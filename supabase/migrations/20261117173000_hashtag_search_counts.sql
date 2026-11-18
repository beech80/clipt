create table if not exists public.hashtag_search_counts (
  tag text primary key check (tag = lower(tag) and tag ~ '^[a-z0-9_]{1,50}$'),
  search_count bigint not null default 0 check (search_count >= 0),
  updated_at timestamptz not null default now()
);

create table if not exists clipt_private.hashtag_search_receipts (
  user_id uuid not null references auth.users(id) on delete cascade,
  tag text not null,
  minute_bucket timestamptz not null,
  primary key (user_id, tag, minute_bucket)
);

alter table public.hashtag_search_counts enable row level security;
revoke all on public.hashtag_search_counts from public, anon, authenticated;
revoke all on clipt_private.hashtag_search_receipts from public, anon, authenticated;

create or replace function public.search_hashtags(p_term text default '', p_limit integer default 12)
returns table(tag text, search_count bigint, post_count bigint)
language sql
stable
security definer
set search_path = ''
as $$
  select h.name,
         coalesce(s.search_count, 0),
         count(ph.post_id)::bigint
  from public.hashtags h
  left join public.hashtag_search_counts s on s.tag = h.name
  left join public.post_hashtags ph on ph.hashtag_id = h.id
  where h.name ~ '^[a-z0-9_]{1,50}$'
    and (nullif(trim(leading '#' from lower(trim(coalesce(p_term, '')))), '') is null
      or h.name like trim(leading '#' from lower(trim(coalesce(p_term, '')))) || '%')
  group by h.name, s.search_count
  order by coalesce(s.search_count, 0) desc, count(ph.post_id) desc, h.name
  limit least(greatest(coalesce(p_limit, 12), 1), 25)
$$;

create or replace function public.record_hashtag_search(p_tag text)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  normalized text := trim(leading '#' from lower(trim(coalesce(p_tag, ''))));
  accepted integer;
  total bigint;
begin
  if actor is null then raise exception 'Authentication required' using errcode = '42501'; end if;
  if normalized !~ '^[a-z0-9_]{1,50}$' then raise exception 'Invalid hashtag' using errcode = '22023'; end if;
  if not exists (select 1 from public.hashtags where name = normalized) then
    raise exception 'Unknown hashtag' using errcode = '22023';
  end if;

  insert into clipt_private.hashtag_search_receipts(user_id, tag, minute_bucket)
  values (actor, normalized, date_trunc('minute', clock_timestamp()))
  on conflict do nothing;
  get diagnostics accepted = row_count;

  if accepted = 1 then
    insert into public.hashtag_search_counts(tag, search_count, updated_at)
    values (normalized, 1, clock_timestamp())
    on conflict (tag) do update
      set search_count = public.hashtag_search_counts.search_count + 1,
          updated_at = excluded.updated_at
    returning search_count into total;
  else
    select search_count into total from public.hashtag_search_counts where tag = normalized;
  end if;
  return coalesce(total, 0);
end
$$;

revoke all on function public.search_hashtags(text, integer) from public, anon, authenticated;
grant execute on function public.search_hashtags(text, integer) to anon, authenticated;
revoke all on function public.record_hashtag_search(text) from public, anon, authenticated;
grant execute on function public.record_hashtag_search(text) to authenticated;
