-- STAGED development extension; requires azure_auto_quarantine.sql.
BEGIN;
ALTER TABLE clipt_private.azure_photo_quarantines
 ADD COLUMN appeal_requested_at timestamptz,
 ADD COLUMN decision text CHECK(decision IN ('restore','keep')),
 ADD COLUMN decided_at timestamptz,
 ADD COLUMN decided_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

CREATE FUNCTION clipt_private.my_photo_quarantines()
RETURNS TABLE(job_id uuid,post_id uuid,quarantined_at timestamptz,appeal_requested_at timestamptz,decision text)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF auth.uid() IS NULL OR NOT clipt_private.account_available() THEN
  RAISE EXCEPTION 'Authenticated account required' USING ERRCODE='42501'; END IF;
 RETURN QUERY SELECT q.job_id,q.post_id,q.quarantined_at,q.appeal_requested_at,q.decision
 FROM clipt_private.azure_photo_quarantines q JOIN clipt_private.azure_review_jobs j ON j.id=q.job_id
 WHERE j.user_id=auth.uid() ORDER BY q.quarantined_at DESC LIMIT 100;
END $$;
CREATE FUNCTION public.my_photo_quarantines()
RETURNS TABLE(job_id uuid,post_id uuid,quarantined_at timestamptz,appeal_requested_at timestamptz,decision text)
LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$SELECT * FROM clipt_private.my_photo_quarantines()$$;

CREATE FUNCTION clipt_private.appeal_photo_quarantine(p_job uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF auth.uid() IS NULL OR NOT clipt_private.account_available() THEN
  RAISE EXCEPTION 'Authenticated account required' USING ERRCODE='42501'; END IF;
 IF NOT EXISTS(SELECT 1 FROM clipt_private.azure_photo_quarantines q
  JOIN clipt_private.azure_review_jobs j ON j.id=q.job_id WHERE q.job_id=p_job AND j.user_id=auth.uid()) THEN
  RAISE EXCEPTION 'Review unavailable' USING ERRCODE='42501'; END IF;
 UPDATE clipt_private.azure_photo_quarantines SET appeal_requested_at=clock_timestamp()
 WHERE job_id=p_job AND appeal_requested_at IS NULL AND decision IS NULL;
 RETURN FOUND;
END $$;
CREATE FUNCTION public.appeal_photo_quarantine(p_job uuid)
RETURNS boolean LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$SELECT clipt_private.appeal_photo_quarantine(p_job)$$;

CREATE FUNCTION clipt_private.photo_quarantine_queue()
RETURNS TABLE(job_id uuid,post_id uuid,quarantined_at timestamptz,appeal_requested_at timestamptz,decision text)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF auth.uid() IS NULL OR NOT clipt_private.account_available() OR coalesce(auth.jwt()->>'aal','aal1')<>'aal2'
  OR NOT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=auth.uid() AND role IN ('admin','moderator')) THEN
  RAISE EXCEPTION 'MFA-verified moderator access required' USING ERRCODE='42501'; END IF;
 RETURN QUERY SELECT q.job_id,q.post_id,q.quarantined_at,q.appeal_requested_at,q.decision
 FROM clipt_private.azure_photo_quarantines q WHERE q.decision IS NULL
 ORDER BY q.appeal_requested_at ASC NULLS LAST,q.quarantined_at ASC LIMIT 100;
END $$;
CREATE FUNCTION public.photo_quarantine_queue()
RETURNS TABLE(job_id uuid,post_id uuid,quarantined_at timestamptz,appeal_requested_at timestamptz,decision text)
LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$SELECT * FROM clipt_private.photo_quarantine_queue()$$;

CREATE FUNCTION clipt_private.resolve_photo_quarantine(p_job uuid,p_decision text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE job clipt_private.azure_review_jobs%rowtype; target public.posts%rowtype; prior text;
BEGIN
 IF auth.uid() IS NULL OR NOT clipt_private.account_available() OR coalesce(auth.jwt()->>'aal','aal1')<>'aal2'
  OR NOT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=auth.uid() AND role IN ('admin','moderator')) THEN
  RAISE EXCEPTION 'MFA-verified moderator access required' USING ERRCODE='42501'; END IF;
 IF p_decision IS NULL OR p_decision NOT IN ('restore','keep') THEN
  RAISE EXCEPTION 'Invalid quarantine decision' USING ERRCODE='22023'; END IF;
 SELECT * INTO job FROM clipt_private.azure_review_jobs WHERE id=p_job;
 IF NOT FOUND THEN RAISE EXCEPTION 'Review unavailable' USING ERRCODE='42501'; END IF;
 PERFORM 1 FROM public.profiles WHERE id=job.user_id FOR UPDATE;
 SELECT * INTO target FROM public.posts WHERE id=job.post_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Photo unavailable' USING ERRCODE='42501'; END IF;
 PERFORM 1 FROM clipt_private.azure_review_jobs WHERE id=p_job FOR UPDATE;
 SELECT decision INTO prior FROM clipt_private.azure_photo_quarantines WHERE job_id=p_job FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Review unavailable' USING ERRCODE='42501'; END IF;
 IF prior IS NOT NULL THEN
  IF prior=p_decision THEN RETURN false; END IF;
  RAISE EXCEPTION 'Review already resolved' USING ERRCODE='55000'; END IF;
 -- Normalize only the quarantine bit. Changed content/privacy cannot be restored.
 IF target.user_id<>job.user_id OR target.moderation_hidden IS NOT TRUE
  OR clipt_private.azure_review_snapshot_hash(to_jsonb(target)||'{"moderation_hidden":false}'::jsonb)<>job.source_hash THEN
  RAISE EXCEPTION 'Photo snapshot changed; review again' USING ERRCODE='42501'; END IF;
 UPDATE clipt_private.azure_photo_quarantines SET decision=p_decision,decided_by=auth.uid(),decided_at=clock_timestamp() WHERE job_id=p_job;
 IF p_decision='restore' THEN UPDATE public.posts SET moderation_hidden=false WHERE id=job.post_id; END IF;
 RETURN true;
END $$;
CREATE FUNCTION public.resolve_photo_quarantine(p_job uuid,p_decision text)
RETURNS boolean LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$SELECT clipt_private.resolve_photo_quarantine(p_job,p_decision)$$;

CREATE FUNCTION clipt_private.quarantined_photo_preview(p_job uuid)
RETURNS TABLE(post_id uuid,user_id uuid,image_url text,caption text)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF auth.uid() IS NULL OR NOT clipt_private.account_available() OR coalesce(auth.jwt()->>'aal','aal1')<>'aal2'
  OR NOT EXISTS(SELECT 1 FROM public.user_roles r WHERE r.user_id=auth.uid() AND r.role IN ('admin','moderator')) THEN
  RAISE EXCEPTION 'MFA-verified moderator access required' USING ERRCODE='42501'; END IF;
 RETURN QUERY SELECT p.id,p.user_id,p.image_url,p.content FROM clipt_private.azure_photo_quarantines q
 JOIN clipt_private.azure_review_jobs j ON j.id=q.job_id JOIN public.posts p ON p.id=q.post_id
 WHERE q.job_id=p_job AND q.decision IS NULL AND p.moderation_hidden IS TRUE
  AND clipt_private.azure_review_snapshot_hash(to_jsonb(p)||'{"moderation_hidden":false}'::jsonb)=j.source_hash;
END $$;
CREATE FUNCTION public.quarantined_photo_preview(p_job uuid)
RETURNS TABLE(post_id uuid,user_id uuid,image_url text,caption text)
LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$SELECT * FROM clipt_private.quarantined_photo_preview(p_job)$$;

REVOKE ALL ON FUNCTION clipt_private.my_photo_quarantines(),public.my_photo_quarantines(),
 clipt_private.appeal_photo_quarantine(uuid),public.appeal_photo_quarantine(uuid),
 clipt_private.photo_quarantine_queue(),public.photo_quarantine_queue(),
 clipt_private.resolve_photo_quarantine(uuid,text),public.resolve_photo_quarantine(uuid,text) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION clipt_private.quarantined_photo_preview(uuid),public.quarantined_photo_preview(uuid) FROM PUBLIC,anon;
GRANT USAGE ON SCHEMA clipt_private TO authenticated;
GRANT EXECUTE ON FUNCTION clipt_private.my_photo_quarantines(),public.my_photo_quarantines(),
 clipt_private.appeal_photo_quarantine(uuid),public.appeal_photo_quarantine(uuid),
 clipt_private.photo_quarantine_queue(),public.photo_quarantine_queue(),
 clipt_private.resolve_photo_quarantine(uuid,text),public.resolve_photo_quarantine(uuid,text) TO authenticated;
GRANT EXECUTE ON FUNCTION clipt_private.quarantined_photo_preview(uuid),public.quarantined_photo_preview(uuid) TO authenticated;
COMMIT;
