begin;
-- Pure selection: no writes to engagement, views, votes or organic scores.
create function clipt_private.boost_opportunities(p_game_id uuid)
returns table(boost_id uuid,post_id uuid,package_code text,expires_at timestamptz)
language sql stable security definer set search_path='' as $$
 select b.id,b.post_id,b.package_code,b.expires_at
 from public.content_boosts b join public.posts p on p.id=b.post_id
 where auth.uid() is not null and coalesce((auth.jwt()->>'is_anonymous')::boolean,false)=false
  and b.invalidated_at is null and b.activated_at<=statement_timestamp() and b.expires_at>statement_timestamp()
  and p.user_id=b.user_id and p.is_published is true and p.is_premium is not true
  and p.is_subscriber_only is not true and not p.moderation_hidden and p.required_tier_id is null
  and nullif(p.video_url,'') is not null and p.post_type in ('clipt','clipts','video')
  and not clipt_private.blocked_with(p.user_id)
  and (p_game_id is null or p.game_id=p_game_id)
  and (
   (b.package_code='king_now' and p_game_id is not null and p.game_id=p_game_id)
   or (b.package_code='squad_blast' and auth.uid() in (
    select f.follower_id from public.follows f where f.following_id=b.user_id and f.follower_id<>b.user_id
    order by f.created_at desc,f.follower_id limit 25))
   or (b.package_code='chain_reaction' and (
    auth.uid() in (select f.follower_id from public.follows f where f.following_id=b.user_id
      and f.follower_id<>b.user_id order by f.created_at desc,f.follower_id limit 5)
    or exists (
     select 1 from (
      select l.user_id from public.likes l where l.post_id=b.post_id and l.user_id<>b.user_id
       and l.created_at>=b.activated_at and l.created_at<=statement_timestamp()
      union
      select c.user_id from public.comments c where c.post_id=b.post_id and c.user_id<>b.user_id
       and length(btrim(c.content))>0 and c.created_at>=b.activated_at and c.created_at<=statement_timestamp()
     ) genuine_actor
     cross join lateral (
      select f.follower_id from public.follows f where f.following_id=genuine_actor.user_id
       and f.follower_id<>b.user_id and f.follower_id<>genuine_actor.user_id
      order by f.created_at desc,f.follower_id limit 5
     ) expansion where expansion.follower_id=auth.uid()
    )
   ))
  ) order by b.activated_at desc,b.id limit 20;
$$;
revoke all on function clipt_private.boost_opportunities(uuid) from public,anon,authenticated;
grant execute on function clipt_private.boost_opportunities(uuid) to authenticated;
-- The invoker join additionally applies existing post visibility/block RLS.
create function public.get_boosted_discovery(p_game_id uuid default null)
returns table(boost_id uuid,post_id uuid,package_code text,expires_at timestamptz,caption text,image_url text)
language sql stable security invoker set search_path='' as $$
 select b.boost_id,b.post_id,b.package_code,b.expires_at,p.content,p.image_url
 from clipt_private.boost_opportunities(p_game_id) b join public.posts p on p.id=b.post_id;
$$;
revoke all on function public.get_boosted_discovery(uuid) from public,anon;
grant execute on function public.get_boosted_discovery(uuid) to authenticated;
notify pgrst,'reload schema';
commit;
