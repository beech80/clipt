-- STAGED ONLY. Review and verify in development before any enablement.
BEGIN;
CREATE TABLE clipt_private.azure_photo_quarantines (
 job_id uuid PRIMARY KEY REFERENCES clipt_private.azure_review_jobs(id) ON DELETE CASCADE,
 post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
 quarantined_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
ALTER TABLE clipt_private.azure_photo_quarantines ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON clipt_private.azure_photo_quarantines FROM PUBLIC,anon,authenticated;

CREATE FUNCTION clipt_private.finish_azure_review_with_quarantine(p_user uuid,p_request uuid,p_state text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE job clipt_private.azure_review_jobs%rowtype; target public.posts%rowtype; applied boolean;
BEGIN
 -- Follow the existing profile -> post -> job lock order, including deletion.
 SELECT * INTO job FROM clipt_private.azure_review_jobs WHERE id=p_request AND user_id=p_user;
 IF NOT FOUND THEN RAISE EXCEPTION 'Review ownership mismatch' USING ERRCODE='42501'; END IF;
 PERFORM 1 FROM public.profiles WHERE id=p_user FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Account unavailable' USING ERRCODE='42501'; END IF;
 SELECT * INTO target FROM public.posts WHERE id=job.post_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Photo unavailable' USING ERRCODE='42501'; END IF;
 applied:=public.finish_azure_review(p_user,p_request,p_state);
 IF applied IS NOT TRUE THEN RETURN false; END IF;
 -- Re-read actual committed outcome: stale snapshots become failed, never flagged.
 SELECT * INTO job FROM clipt_private.azure_review_jobs WHERE id=p_request FOR UPDATE;
 IF job.state<>'needs_review' THEN RETURN true; END IF;
 IF target.user_id<>p_user OR target.is_published IS NOT TRUE
  OR target.is_premium IS NOT FALSE OR target.is_subscriber_only IS NOT FALSE
  OR target.required_tier_id IS NOT NULL OR target.moderation_hidden IS NOT FALSE
  OR target.post_type NOT IN ('clipt','regular','photo')
  OR target.image_url IS NULL OR target.image_url='' OR target.video_url IS NOT NULL
  OR (target.scheduled_publish_time IS NOT NULL AND target.scheduled_publish_time>clock_timestamp())
  OR clipt_private.azure_review_snapshot_hash(to_jsonb(target))<>job.source_hash THEN
  RAISE EXCEPTION 'Public scan snapshot changed' USING ERRCODE='42501';
 END IF;
 INSERT INTO clipt_private.azure_photo_quarantines(job_id,post_id) VALUES(p_request,job.post_id);
 UPDATE public.posts SET moderation_hidden=true WHERE id=job.post_id;
 RETURN true;
END $$;
REVOKE ALL ON FUNCTION clipt_private.finish_azure_review_with_quarantine(uuid,uuid,text) FROM PUBLIC,anon,authenticated;
GRANT USAGE ON SCHEMA clipt_private TO service_role;
GRANT EXECUTE ON FUNCTION clipt_private.finish_azure_review_with_quarantine(uuid,uuid,text) TO service_role;
CREATE FUNCTION public.finish_azure_review_with_quarantine(p_user uuid,p_request uuid,p_state text)
RETURNS boolean LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$
 SELECT clipt_private.finish_azure_review_with_quarantine(p_user,p_request,p_state)
$$;
REVOKE ALL ON FUNCTION public.finish_azure_review_with_quarantine(uuid,uuid,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.finish_azure_review_with_quarantine(uuid,uuid,text) TO service_role;
COMMIT;
