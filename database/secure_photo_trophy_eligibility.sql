BEGIN;
SET LOCAL lock_timeout='5s';
-- Add photos to the existing free ranking signal; retain invoker RLS, moderation,
-- account/MFA restrictions, server clock, period calculation and vote uniqueness.
ALTER POLICY clipt_vote_eligible_target ON public.clip_votes WITH CHECK (
  user_id=(SELECT auth.uid())
  AND coalesce((SELECT auth.jwt()->>'is_anonymous'),'false')<>'true'
  AND EXISTS(SELECT 1 FROM public.posts p WHERE p.id=clip_votes.post_id
    AND p.is_published IS TRUE AND p.is_premium IS NOT TRUE
    AND p.is_subscriber_only IS NOT TRUE AND NOT p.moderation_hidden
    AND p.required_tier_id IS NULL
    AND (p.scheduled_publish_time IS NULL OR p.scheduled_publish_time<=statement_timestamp())
    AND p.post_type IN ('clipt','clipts','video')
    AND (nullif(p.video_url,'') IS NOT NULL OR nullif(p.image_url,'') IS NOT NULL))
);
DO $change$
DECLARE definition text;
BEGIN
  definition:=pg_get_functiondef('public.get_top_clipts(text)'::regprocedure);
  IF position('nullif(p.video_url, '''') is not null' IN definition)=0
     OR position('SECURITY DEFINER' IN definition)>0 THEN
    RAISE EXCEPTION 'Unexpected ranking definition; refusing unreviewed rewrite';
  END IF;
  EXECUTE replace(definition,'nullif(p.video_url, '''') is not null',
    '(nullif(p.video_url, '''') is not null or nullif(p.image_url, '''') is not null)');
END;
$change$;
NOTIFY pgrst,'reload schema';
COMMIT;
