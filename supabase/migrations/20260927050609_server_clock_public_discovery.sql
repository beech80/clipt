-- Invoker view retains the caller's post/profile RLS, including block isolation.
-- Only the database clock determines whether published content is current.
create view public.public_clipt_discovery with (security_invoker=true) as
select p.id,p.content,p.image_url,p.created_at,p.game_id,p.user_id,
       pr.username,pr.avatar_url
from public.posts p left join public.profiles pr on pr.id=p.user_id
where p.is_published is true and p.moderation_hidden is false
  and p.is_premium is not true and p.is_subscriber_only is not true
  and p.required_tier_id is null and p.post_type in ('clipt','clipts','video')
  and p.video_url is not null and p.created_at <= statement_timestamp();
revoke all on public.public_clipt_discovery from public,anon,authenticated;
grant select on public.public_clipt_discovery to anon,authenticated,service_role;
comment on view public.public_clipt_discovery is 'Read-only public discovery projection; invoker RLS and server publication clock. No ranking or Boost score changes.';
