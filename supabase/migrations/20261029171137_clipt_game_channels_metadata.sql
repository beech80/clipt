-- Public game tags contain no ingest/provider credentials.
alter table public.streams add column if not exists game_id uuid references public.games(id) on delete set null;
create index if not exists streams_live_game_channel_idx on public.streams(game_id,id) where is_live is true;
grant select(game_id) on public.streams to anon, authenticated;
grant insert(game_id), update(game_id) on public.streams to authenticated;

-- Preserve underlying post/profile RLS; public channels never include private,
-- Squad, future, premium, hidden, or review-held posts.
create or replace view public.public_channel_posts
with (security_invoker = true, security_barrier = true) as
select p.id,p.content,p.image_url,p.created_at,p.game_id,p.user_id,pr.username,pr.avatar_url
from public.posts p left join public.profiles pr on pr.id=p.user_id
where p.is_published is true and p.moderation_hidden is false
  and p.is_premium is not true and p.is_subscriber_only is not true
  and p.required_tier_id is null and p.post_type is distinct from 'squad'
  and (p.video_url is null or btrim(p.video_url)='')
  and (p.content is not null or p.image_url is not null)
  and p.created_at<=statement_timestamp()
  and not clipt_private.photo_review_held(p.id);
revoke all on public.public_channel_posts from public,anon,authenticated;
grant select on public.public_channel_posts to anon,authenticated;
