begin;

create index if not exists clipt_posts_owner_created_idx on public.posts(user_id,created_at);
create index if not exists clipt_follows_recipient_created_idx on public.follows(following_id,created_at);
create index if not exists clipt_post_views_post_created_idx on public.post_views(post_id,created_at);
create index if not exists clipt_likes_post_created_idx on public.likes(post_id,created_at);
create index if not exists clipt_votes_post_created_idx on public.clip_votes(post_id,created_at);

-- Aggregates the caller's content only. Viewer identities and payment data are
-- intentionally not returned. The public wrapper stays SECURITY INVOKER.
create or replace function clipt_private.creator_dashboard_metrics(p_days integer)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  actor uuid := auth.uid();
  ends_at timestamptz := statement_timestamp();
  starts_at timestamptz;
  result jsonb;
begin
  if actor is null or coalesce((auth.jwt()->>'is_anonymous')::boolean,false) then
    raise exception 'Authenticated account required' using errcode='42501';
  end if;
  if p_days is null or p_days not in (7,30,90,365) then
    raise exception 'Invalid analytics window' using errcode='22023';
  end if;
  starts_at := ends_at - make_interval(days => p_days);
  with owned as materialized (
    select p.id,p.content,p.created_at from public.posts p
    where p.user_id=actor and p.is_published=true and not p.moderation_hidden
      and p.post_type in ('clipt','clipts','video') and p.video_url is not null
  ), events as materialized (
    select v.post_id,v.created_at,'view'::text as kind from public.post_views v join owned p on p.id=v.post_id
      where v.created_at>=starts_at and v.created_at<=ends_at
    union all
    select l.post_id,l.created_at,'like' from public.likes l join owned p on p.id=l.post_id
      where l.created_at>=starts_at and l.created_at<=ends_at
    union all
    select v.post_id,v.created_at,'trophy' from public.clip_votes v join owned p on p.id=v.post_id
      where v.created_at>=starts_at and v.created_at<=ends_at
  ), top_posts as (
    select p.id,left(p.content,200) as caption,count(*) filter(where e.kind='trophy') as trophies,
      count(*) filter(where e.kind='like') as likes,count(*) filter(where e.kind='view') as views
    from owned p join events e on e.post_id=p.id group by p.id,p.content,p.created_at
    order by trophies desc,views desc,p.created_at asc,p.id asc limit 10
  ), daily as (
    select (e.created_at at time zone 'UTC')::date as day,
      count(*) filter(where kind='view') as views,count(*) filter(where kind='like') as likes,
      count(*) filter(where kind='trophy') as trophies from events e group by 1
  )
  select jsonb_build_object(
    'days',p_days,'from',starts_at,'to',ends_at,
    'views',(select count(*) from events where kind='view'),
    'likes',(select count(*) from events where kind='like'),
    'trophies',(select count(*) from events where kind='trophy'),
    'followers',(select count(*) from public.follows where following_id=actor and created_at>=starts_at and created_at<=ends_at),
    'daily',coalesce((select jsonb_agg(to_jsonb(d) order by d.day) from daily d),'[]'::jsonb),
    'top_clipts',coalesce((select jsonb_agg(to_jsonb(t)) from top_posts t),'[]'::jsonb)
  ) into result;
  return result;
end;
$$;
revoke all on function clipt_private.creator_dashboard_metrics(integer) from public,anon,authenticated;
grant execute on function clipt_private.creator_dashboard_metrics(integer) to authenticated;
create or replace function public.get_creator_dashboard(p_days integer default 7)
returns jsonb language sql stable security invoker set search_path = '' as $$
  select clipt_private.creator_dashboard_metrics(p_days);
$$;
revoke all on function public.get_creator_dashboard(integer) from public,anon;
grant execute on function public.get_creator_dashboard(integer) to authenticated;
commit;
