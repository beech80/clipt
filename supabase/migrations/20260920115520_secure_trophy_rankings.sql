begin;

-- Preserve every existing vote. The existing UNIQUE(post_id,user_id) constraint
-- is the concurrency-safe duplicate boundary; no client-provided timestamps.
revoke insert, update, delete, truncate, references, trigger on public.clip_votes from anon, authenticated;
revoke insert (id, post_id, user_id, created_at), update (id, post_id, user_id, created_at) on public.clip_votes from anon, authenticated;
grant insert (post_id, user_id), delete on public.clip_votes to authenticated;

create policy clipt_vote_visible_target on public.clip_votes
as restrictive for select to anon, authenticated
using (exists (select 1 from public.posts p where p.id = clip_votes.post_id));

create policy clipt_vote_eligible_target on public.clip_votes
as restrictive for insert to authenticated
with check (
  user_id = (select auth.uid())
  and coalesce((select auth.jwt()->>'is_anonymous'), 'false') <> 'true'
  and exists (select 1 from public.posts p where p.id = clip_votes.post_id
    and p.is_published is true and p.is_premium is not true
    and p.is_subscriber_only is not true and nullif(p.video_url, '') is not null
    and p.post_type = 'clipt')
);

-- Invoker retains posts RLS (including blocking) and profile column grants.
-- Periods select Clipts published/created during the UTC calendar week/month.
create or replace function public.get_top_clipts(ranking_period text default 'weekly')
returns table (post_id uuid, creator_id uuid, content text, username text,
  avatar_url text, created_at timestamptz, trophy_count bigint)
language plpgsql stable security invoker set search_path = ''
as $$
begin
  if ranking_period is null or ranking_period not in ('weekly', 'monthly', 'all-time') then
    raise exception 'Invalid ranking period' using errcode = '22023';
  end if;
  return query
    select p.id, p.user_id, p.content, pr.username, pr.avatar_url, p.created_at, count(v.id)
    from public.posts p
    join public.profiles pr on pr.id = p.user_id
    join public.clip_votes v on v.post_id = p.id
    where p.is_published is true and p.is_premium is not true
      and p.is_subscriber_only is not true and p.post_type = 'clipt'
      and nullif(p.video_url, '') is not null and p.created_at <= now()
      and (ranking_period = 'all-time' or p.created_at >=
        (date_trunc(case when ranking_period = 'weekly' then 'week' else 'month' end,
          now() at time zone 'UTC') at time zone 'UTC'))
    group by p.id, pr.username, pr.avatar_url
    order by count(v.id) desc, p.created_at asc, p.id asc
    limit 100;
end;
$$;
revoke all on function public.get_top_clipts(text) from public;
grant execute on function public.get_top_clipts(text) to anon, authenticated, service_role;
notify pgrst, 'reload schema';
commit;
