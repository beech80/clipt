-- Additive development-only extension. Never apply to production automatically.
BEGIN;
CREATE TABLE clipt_private.azure_review_decisions (
 job_id uuid PRIMARY KEY REFERENCES clipt_private.azure_review_jobs(id) ON DELETE CASCADE,
 actor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
 decision text NOT NULL CHECK(decision IN ('dismiss','hide')),
 decided_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
ALTER TABLE clipt_private.azure_review_decisions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON clipt_private.azure_review_decisions FROM PUBLIC,anon,authenticated;

CREATE FUNCTION clipt_private.resolve_azure_photo_review(p_job uuid,p_decision text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE job clipt_private.azure_review_jobs%rowtype; target public.posts%rowtype; prior text;
BEGIN
 IF auth.uid() IS NULL OR NOT clipt_private.account_available()
  OR coalesce(auth.jwt()->>'aal','aal1')<>'aal2'
  OR NOT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=auth.uid() AND role IN ('admin','moderator')) THEN
  RAISE EXCEPTION 'MFA-verified moderator access required' USING ERRCODE='42501';
 END IF;
 IF p_decision IS NULL OR p_decision NOT IN ('dismiss','hide') THEN
  RAISE EXCEPTION 'Invalid review decision' USING ERRCODE='22023';
 END IF;
 SELECT * INTO job FROM clipt_private.azure_review_jobs WHERE id=p_job;
 IF NOT FOUND THEN RAISE EXCEPTION 'Review unavailable' USING ERRCODE='42501'; END IF;
 -- Same profile -> post -> job order as reservation/account erasure.
 PERFORM 1 FROM public.profiles WHERE id=job.user_id FOR UPDATE;
 SELECT * INTO target FROM public.posts WHERE id=job.post_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Review unavailable' USING ERRCODE='42501'; END IF;
 SELECT * INTO job FROM clipt_private.azure_review_jobs WHERE id=p_job FOR UPDATE;
 SELECT decision INTO prior FROM clipt_private.azure_review_decisions WHERE job_id=p_job;
 IF FOUND THEN
  IF prior=p_decision THEN RETURN false; END IF;
  RAISE EXCEPTION 'Review already resolved' USING ERRCODE='55000';
 END IF;
 IF job.state NOT IN ('needs_review','failed') THEN
  RAISE EXCEPTION 'Completed flagged or failed review required' USING ERRCODE='55000';
 END IF;
 IF target.user_id<>job.user_id OR target.is_published IS NOT TRUE
  OR target.is_premium IS NOT FALSE OR target.is_subscriber_only IS NOT FALSE
  OR target.required_tier_id IS NOT NULL OR target.moderation_hidden IS NOT FALSE
  OR target.post_type NOT IN ('clipt','regular','photo')
  OR target.image_url IS NULL OR target.image_url='' OR target.video_url IS NOT NULL
  OR (target.scheduled_publish_time IS NOT NULL AND target.scheduled_publish_time>clock_timestamp())
  OR clipt_private.azure_review_snapshot_hash(to_jsonb(target))<>job.source_hash THEN
  RAISE EXCEPTION 'Public scan snapshot changed; review unavailable' USING ERRCODE='42501';
 END IF;
 INSERT INTO clipt_private.azure_review_decisions(job_id,actor_id,decision) VALUES(p_job,auth.uid(),p_decision);
 -- Explicit human action only. No deletion, ban or provider-result rewriting.
 IF p_decision='hide' THEN UPDATE public.posts SET moderation_hidden=true WHERE id=job.post_id; END IF;
 RETURN true;
END $$;
REVOKE ALL ON FUNCTION clipt_private.resolve_azure_photo_review(uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION clipt_private.resolve_azure_photo_review(uuid,text) TO authenticated;
CREATE FUNCTION public.resolve_azure_photo_review(p_job uuid,p_decision text)
RETURNS boolean LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$
 SELECT clipt_private.resolve_azure_photo_review(p_job,p_decision)
$$;
REVOKE ALL ON FUNCTION public.resolve_azure_photo_review(uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.resolve_azure_photo_review(uuid,text) TO authenticated;

CREATE OR REPLACE FUNCTION clipt_private.azure_photo_review_queue()
RETURNS TABLE(id uuid,post_id uuid,state text,created_at timestamptz)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF auth.uid() IS NULL OR NOT clipt_private.account_available()
  OR coalesce(auth.jwt()->>'aal','aal1')<>'aal2'
  OR NOT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=auth.uid() AND role IN ('admin','moderator')) THEN
  RAISE EXCEPTION 'MFA-verified moderator access required' USING ERRCODE='42501';
 END IF;
 RETURN QUERY SELECT j.id,j.post_id,j.state,j.created_at FROM clipt_private.azure_review_jobs j
 JOIN public.posts p ON p.id=j.post_id
 WHERE j.state IN ('pending','needs_review','failed') AND p.is_published IS TRUE
 AND p.is_premium IS FALSE AND p.is_subscriber_only IS FALSE AND p.required_tier_id IS NULL
 AND p.post_type IN ('clipt','regular','photo') AND p.image_url IS NOT NULL AND p.image_url<>''
 AND p.video_url IS NULL AND p.moderation_hidden IS FALSE
 AND (p.scheduled_publish_time IS NULL OR p.scheduled_publish_time<=clock_timestamp())
 AND clipt_private.azure_review_snapshot_hash(to_jsonb(p))=j.source_hash
 AND NOT EXISTS(SELECT 1 FROM clipt_private.azure_review_decisions d WHERE d.job_id=j.id)
 ORDER BY j.created_at DESC LIMIT 100;
END $$;
COMMIT;
