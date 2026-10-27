-- Development repair: qualify the role table's user_id to avoid colliding with
-- the RETURNS TABLE user_id output variable. No authorization is relaxed.
BEGIN;
CREATE OR REPLACE FUNCTION clipt_private.quarantined_photo_preview(p_job uuid)
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
REVOKE ALL ON FUNCTION clipt_private.quarantined_photo_preview(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION clipt_private.quarantined_photo_preview(uuid) TO authenticated;
COMMIT;
