BEGIN;
SET LOCAL lock_timeout='5s';
-- Additive, restrictive policy: retain all owner, block, moderation and MFA rules.
-- Existing public types keep their meaning. Squad clips cannot enter the public
-- discovery/ranking/Boost paths, which explicitly allow clipt/clipts/video only.
CREATE POLICY clipt_squad_visibility ON public.posts AS RESTRICTIVE
FOR SELECT TO anon,authenticated USING (
  post_type IS DISTINCT FROM 'squad'
  OR user_id=(SELECT auth.uid())
  OR EXISTS (SELECT 1 FROM public.follows f
    WHERE f.follower_id=(SELECT auth.uid()) AND f.following_id=posts.user_id)
);
CREATE INDEX IF NOT EXISTS clipt_follow_actor_target_idx ON public.follows(follower_id,following_id);
CREATE FUNCTION public.clipt_posting_capabilities() RETURNS boolean
LANGUAGE sql STABLE SECURITY INVOKER SET search_path='' AS $$
  SELECT (SELECT auth.uid()) IS NOT NULL
    AND (SELECT clipt_private.account_available())
    AND EXISTS (SELECT 1 FROM pg_catalog.pg_policy
      WHERE polrelid='public.posts'::regclass AND polname='clipt_squad_visibility'
      AND polpermissive=false AND polcmd='r')
    AND EXISTS (SELECT 1 FROM pg_catalog.pg_class
      WHERE oid='public.posts'::regclass AND relrowsecurity);
$$;
REVOKE ALL ON FUNCTION public.clipt_posting_capabilities() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.clipt_posting_capabilities() TO authenticated;
NOTIFY pgrst,'reload schema';
COMMIT;
