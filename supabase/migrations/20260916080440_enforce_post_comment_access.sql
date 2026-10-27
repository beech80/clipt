BEGIN;
SET LOCAL lock_timeout='5s';
CREATE SCHEMA IF NOT EXISTS clipt_private;
REVOKE ALL ON SCHEMA clipt_private FROM PUBLIC;
GRANT USAGE ON SCHEMA clipt_private TO anon,authenticated,service_role;
CREATE FUNCTION clipt_private.blocked_with(other_user uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $function$
  SELECT auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.user_blocks b
    WHERE (b.blocker_id=auth.uid() AND b.blocked_id=other_user)
       OR (b.blocked_id=auth.uid() AND b.blocker_id=other_user)
  )
$function$;
REVOKE ALL ON FUNCTION clipt_private.blocked_with(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION clipt_private.blocked_with(uuid) TO anon,authenticated,service_role;

-- Restrictive policies compose with, rather than delete, legacy policies.
-- Premium/subscriber entitlements are not trustworthy yet; keep those posts
-- owner-only until an independently verified entitlement path is available.
CREATE POLICY clipt_post_visibility ON public.posts AS RESTRICTIVE
FOR SELECT TO anon,authenticated USING (
  (user_id=(SELECT auth.uid()) OR (is_published IS TRUE AND is_premium IS NOT TRUE AND is_subscriber_only IS NOT TRUE))
  AND NOT clipt_private.blocked_with(user_id)
);
CREATE POLICY clipt_post_insert_identity ON public.posts AS RESTRICTIVE
FOR INSERT TO authenticated WITH CHECK(user_id=(SELECT auth.uid()));
CREATE POLICY clipt_post_update_identity ON public.posts AS RESTRICTIVE
FOR UPDATE TO authenticated USING(user_id=(SELECT auth.uid())) WITH CHECK(user_id=(SELECT auth.uid()));
CREATE POLICY clipt_post_delete_identity ON public.posts AS RESTRICTIVE
FOR DELETE TO authenticated USING(user_id=(SELECT auth.uid()));

CREATE POLICY clipt_comment_visibility ON public.comments AS RESTRICTIVE
FOR SELECT TO anon,authenticated USING (
  EXISTS(SELECT 1 FROM public.posts p WHERE p.id=post_id)
  AND NOT clipt_private.blocked_with(user_id)
);
CREATE POLICY clipt_comment_insert_identity ON public.comments AS RESTRICTIVE
FOR INSERT TO authenticated WITH CHECK (
  user_id=(SELECT auth.uid()) AND EXISTS(SELECT 1 FROM public.posts p WHERE p.id=post_id)
);
CREATE POLICY clipt_comment_update_identity ON public.comments AS RESTRICTIVE
FOR UPDATE TO authenticated USING(user_id=(SELECT auth.uid())) WITH CHECK (
  user_id=(SELECT auth.uid()) AND EXISTS(SELECT 1 FROM public.posts p WHERE p.id=post_id)
);
CREATE POLICY clipt_comment_delete_identity ON public.comments AS RESTRICTIVE
FOR DELETE TO authenticated USING(user_id=(SELECT auth.uid()));

REVOKE ALL ON public.posts,public.comments FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.posts,public.comments TO anon;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.posts TO authenticated;
GRANT SELECT,INSERT,DELETE ON public.comments TO authenticated;
GRANT UPDATE(content) ON public.comments TO authenticated;

CREATE FUNCTION clipt_private.validate_comment_parent() RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $function$
BEGIN
  IF NEW.parent_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.comments p WHERE p.id=NEW.parent_id AND p.post_id=NEW.post_id AND p.id<>NEW.id
  ) THEN RAISE EXCEPTION 'Reply parent must be a visible comment on the same post' USING ERRCODE='23514'; END IF;
  RETURN NEW;
END $function$;
REVOKE ALL ON FUNCTION clipt_private.validate_comment_parent() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER clipt_validate_comment_parent BEFORE INSERT OR UPDATE OF parent_id,post_id ON public.comments
FOR EACH ROW EXECUTE FUNCTION clipt_private.validate_comment_parent();
COMMIT;
