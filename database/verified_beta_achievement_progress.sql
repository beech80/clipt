-- Verified beta achievements: caller can refresh only their own server-derived metrics.
begin;
create table if not exists clipt_private.achievement_metrics (
 achievement_id uuid primary key references public.achievements(id) on delete cascade,
 metric text not null check(metric in ('trophies','followers','friends','messages','connections','likes','posts','profile','theme'))
);
alter table clipt_private.achievement_metrics enable row level security;
revoke all on clipt_private.achievement_metrics from public,anon,authenticated;
insert into clipt_private.achievement_metrics(achievement_id,metric)
select a.id,r.metric from public.achievements a join (values
 ('Clip Rookie','trophies'),('Rising Clipper','trophies'),('Trophy Collector','trophies'),('Trophy Master','trophies'),
 ('Popular Creator','followers'),('Social Butterfly','friends'),('Conversation Starter','messages'),
 ('Network Master','connections'),('Helpful Hand','likes'),('Content Creator','posts'),('Welcome!','profile'),('Customization King','theme')
) r(name,metric) on r.name=a.name on conflict(achievement_id) do update set metric=excluded.metric;

create or replace function clipt_private.sync_achievement_progress() returns jsonb
language plpgsql security definer set search_path='' as $$
declare uid uuid := auth.uid(); metrics jsonb; result jsonb;
begin
 if uid is null or not clipt_private.account_available() or not clipt_private.beta_access_allowed()
  or coalesce(auth.jwt()->>'is_anonymous','false')='true' then
  raise exception 'Account access required' using errcode='42501';
 end if;
 -- Serialize same-account refreshes so concurrent requests cannot duplicate awards.
 perform pg_advisory_xact_lock(hashtextextended('achievements:'||uid::text,0));
 metrics:=jsonb_build_object(
 'trophies',(select count(*) from public.clip_votes v join public.posts p on p.id=v.post_id
   where p.user_id=uid and p.is_published is true and p.is_premium is not true and p.is_subscriber_only is not true
   and p.moderation_hidden is not true and p.created_at<=now() and nullif(p.video_url,'') is not null and p.post_type in ('clipt','clipts','video')),
 'followers',(select count(*) from public.follows where following_id=uid and follower_id<>uid),
 'friends',(select count(distinct f.following_id) from public.follows f where f.follower_id=uid and f.following_id<>uid
   and exists(select 1 from public.follows b where b.follower_id=f.following_id and b.following_id=uid)),
 'connections',(select count(distinct following_id) from public.follows where follower_id=uid and following_id<>uid),
 'messages',(select count(*) from public.messages where sender_id=uid and receiver_id<>uid),
 'likes',(select count(distinct l.post_id) from public.likes l join public.posts p on p.id=l.post_id
   where l.user_id=uid and p.is_published is true and p.moderation_hidden is not true),
 'posts',(select count(*) from public.posts where user_id=uid and is_published is true and moderation_hidden is not true and created_at<=now()),
 'profile',(select case when onboarding_completed is true then 1 else 0 end from public.profiles where id=uid),
 'theme',(select case when custom_theme is not null and custom_theme<>'{}'::jsonb and custom_theme<>'null'::jsonb then 1 else 0 end from public.profiles where id=uid));
 insert into public.achievement_progress(user_id,achievement_id,current_value,updated_at)
 select uid,r.achievement_id,least(2147483647,coalesce((metrics->>r.metric)::bigint,0))::integer,now()
 from clipt_private.achievement_metrics r
 on conflict(user_id,achievement_id) do update set current_value=excluded.current_value,updated_at=excluded.updated_at
 where achievement_progress.current_value is distinct from excluded.current_value;
 -- Repair previously reached milestones as well as new ones; no wallet/token writes.
 insert into public.user_achievements(user_id,achievement_id)
 select uid,p.achievement_id from public.achievement_progress p join public.achievements a on a.id=p.achievement_id
 join clipt_private.achievement_metrics r on r.achievement_id=a.id
 where p.user_id=uid and a.target_value>0 and p.current_value>=a.target_value on conflict do nothing;
 select jsonb_build_object('trophies',coalesce((metrics->>'trophies')::bigint,0),'rows',
 coalesce(jsonb_agg(jsonb_build_object('id',p.id,'user_id',uid,'achievement_id',a.id,
 'current_value',coalesce(p.current_value,0),'created_at',p.created_at,'updated_at',p.updated_at,
 'achievement',to_jsonb(a),'tracked',r.achievement_id is not null,'completed',e.earned_at is not null,'earned_at',e.earned_at)
 order by a.category,a.points desc,a.id),'[]'::jsonb)) into result
 from public.achievements a left join clipt_private.achievement_metrics r on r.achievement_id=a.id
 left join public.achievement_progress p on p.achievement_id=a.id and p.user_id=uid
 left join public.user_achievements e on e.achievement_id=a.id and e.user_id=uid;
 return result;
end; $$;
revoke all on function clipt_private.sync_achievement_progress() from public,anon;
grant execute on function clipt_private.sync_achievement_progress() to authenticated;
create or replace function public.sync_my_achievements() returns jsonb
language sql security invoker set search_path='' as $$ select clipt_private.sync_achievement_progress(); $$;
revoke all on function public.sync_my_achievements() from public,anon;
grant execute on function public.sync_my_achievements() to authenticated;
-- Existing progress trigger: atomic one-time award and notification, preserving its interface.
create or replace function public.check_and_award_achievement() returns trigger
language plpgsql security definer set search_path='' as $$
declare awarded uuid;
begin
 if exists(select 1 from clipt_private.achievement_metrics m join public.achievements a on a.id=m.achievement_id
 where a.id=new.achievement_id and a.target_value>0 and new.current_value>=a.target_value) then
  insert into public.user_achievements(user_id,achievement_id) values(new.user_id,new.achievement_id)
  on conflict do nothing returning achievement_id into awarded;
  if awarded is not null then
   insert into public.notifications(user_id,type,content,resource_id,resource_type)
   values(new.user_id,'system_alert','You earned an achievement!',new.achievement_id,'achievement');
  end if;
 end if;
 return new;
end; $$;
revoke all on function public.check_and_award_achievement() from public,anon,authenticated;
commit;
