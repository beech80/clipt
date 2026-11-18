create or replace function clipt_private.index_post_hashtags()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  found_tag text;
  found_id uuid;
begin
  delete from public.post_hashtags where post_id = new.id;
  for found_tag in
    select distinct matches.value[2]
    from regexp_matches(lower(coalesce(new.content, '')), '(^|[^[:alnum:]_&#/])#([[:alnum:]_]{1,40})(?![[:alnum:]_])', 'g') as matches(value)
  loop
    insert into public.hashtags(name) values (found_tag)
    on conflict (name) do update set name = excluded.name
    returning id into found_id;
    insert into public.post_hashtags(post_id, hashtag_id) values (new.id, found_id)
    on conflict do nothing;
  end loop;
  return new;
end
$$;

revoke all on function clipt_private.index_post_hashtags() from public, anon, authenticated;
drop trigger if exists clipt_index_post_hashtags on public.posts;
create trigger clipt_index_post_hashtags
after insert or update of content on public.posts
for each row execute function clipt_private.index_post_hashtags();

insert into public.hashtags(name)
select distinct matches.value[2]
from public.posts p
cross join lateral regexp_matches(lower(coalesce(p.content, '')), '(^|[^[:alnum:]_&#/])#([[:alnum:]_]{1,40})(?![[:alnum:]_])', 'g') as matches(value)
on conflict (name) do nothing;

insert into public.post_hashtags(post_id, hashtag_id)
select distinct p.id, h.id
from public.posts p
cross join lateral regexp_matches(lower(coalesce(p.content, '')), '(^|[^[:alnum:]_&#/])#([[:alnum:]_]{1,40})(?![[:alnum:]_])', 'g') as matches(value)
join public.hashtags h on h.name = matches.value[2]
on conflict do nothing;

alter table clipt_private.hashtag_search_receipts enable row level security;
alter table public.hashtag_search_counts drop constraint hashtag_search_counts_tag_check;
alter table public.hashtag_search_counts add constraint hashtag_search_counts_tag_check
check (tag = lower(tag) and tag ~ '^[[:alnum:]_]{1,40}$');
grant select on public.hashtag_search_counts to authenticated;
create policy hashtag_counts_read on public.hashtag_search_counts for select to authenticated
using ((select clipt_private.account_available()) and (select clipt_private.beta_access_allowed()));

create or replace function public.search_hashtags(p_term text default '', p_limit integer default 12)
returns table(tag text, search_count bigint, post_count bigint)
language sql stable security invoker set search_path = ''
as $$
  select h.name, coalesce(s.search_count,0), count(distinct visible.id)
  from public.hashtags h
  join public.post_hashtags ph on ph.hashtag_id=h.id
  join (
    select id from public.public_clipt_discovery
    union select id from public.public_channel_posts
  ) visible on visible.id=ph.post_id
  left join public.hashtag_search_counts s on s.tag=h.name
  where starts_with(h.name,trim(leading '#' from lower(trim(coalesce(p_term,'')))))
  group by h.name,s.search_count
  order by coalesce(s.search_count,0) desc,count(distinct visible.id) desc,h.name
  limit least(greatest(coalesce(p_limit,12),1),25)
$$;
revoke all on function public.search_hashtags(text,integer) from public,anon;

create or replace function public.record_hashtag_search(p_tag text)
returns bigint language plpgsql security definer set search_path = ''
as $$
declare actor uuid:=auth.uid(); normalized text:=trim(leading '#' from lower(trim(coalesce(p_tag,''))));
  accepted integer; total bigint;
begin
  if actor is null or not clipt_private.account_available() or not clipt_private.beta_access_allowed()
  then raise exception 'Authentication required' using errcode='42501'; end if;
  if normalized !~ '^[[:alnum:]_]{1,40}$' then raise exception 'Invalid hashtag' using errcode='22023'; end if;
  if not exists(select 1 from public.hashtags where name=normalized) then return 0; end if;
  perform pg_advisory_xact_lock(hashtextextended(actor::text,1729));
  if (select count(*) from clipt_private.hashtag_search_receipts
      where user_id=actor and minute_bucket>=date_trunc('minute',clock_timestamp()))>=30 then
    raise exception 'Search rate limit reached' using errcode='P0001';
  end if;
  delete from clipt_private.hashtag_search_receipts where user_id=actor
    and minute_bucket<date_trunc('minute',clock_timestamp())-interval '1 day';
  insert into clipt_private.hashtag_search_receipts values(actor,normalized,date_trunc('minute',clock_timestamp()))
    on conflict do nothing;
  get diagnostics accepted=row_count;
  if accepted=1 then
    insert into public.hashtag_search_counts(tag,search_count) values(normalized,1)
    on conflict(tag) do update set search_count=public.hashtag_search_counts.search_count+1,updated_at=clock_timestamp()
    returning search_count into total;
  else select search_count into total from public.hashtag_search_counts where tag=normalized;
  end if;
  return coalesce(total,0);
end $$;
