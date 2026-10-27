-- STAGED ONLY. No scheduler or configuration is enabled by this file.
BEGIN;
CREATE TABLE clipt_private.azure_dispatch_settings (
 singleton boolean PRIMARY KEY DEFAULT true CHECK(singleton),enabled boolean NOT NULL DEFAULT false
);
INSERT INTO clipt_private.azure_dispatch_settings DEFAULT VALUES;
CREATE TABLE clipt_private.azure_review_dispatch (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
 user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,source_hash text NOT NULL,
 state text NOT NULL DEFAULT 'queued' CHECK(state IN ('queued','processing','completed','failed')),
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(),claimed_at timestamptz,
 UNIQUE(post_id,source_hash)
);
CREATE INDEX azure_review_dispatch_waiting ON clipt_private.azure_review_dispatch(created_at,id) WHERE state='queued';
ALTER TABLE clipt_private.azure_dispatch_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE clipt_private.azure_review_dispatch ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON clipt_private.azure_dispatch_settings,clipt_private.azure_review_dispatch FROM PUBLIC,anon,authenticated;

-- Keep historical scans/audits while allowing a new content version to be
-- reviewed. Abort rather than guessing if the installed reservation changed.
DO $$DECLARE definition text; old_condition text:='(user_id=p_user AND post_id=p_post)'; BEGIN
 definition:=pg_get_functiondef('public.reserve_azure_review(uuid,uuid,uuid,integer)'::regprocedure);
 IF position(old_condition IN definition)=0 THEN RAISE EXCEPTION 'Review reservation requires manual reconciliation'; END IF;
 ALTER TABLE clipt_private.azure_review_jobs DROP CONSTRAINT azure_review_jobs_user_id_post_id_key;
 ALTER TABLE clipt_private.azure_review_jobs ADD CONSTRAINT azure_review_jobs_content_version UNIQUE(user_id,post_id,source_hash);
 EXECUTE replace(definition,old_condition,'(user_id=p_user AND post_id=p_post AND source_hash=clipt_private.azure_review_snapshot_hash(source))');
END $$;

CREATE FUNCTION clipt_private.enqueue_public_photo_review() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF EXISTS(SELECT 1 FROM clipt_private.azure_dispatch_settings WHERE enabled)
  AND NEW.is_published IS TRUE AND NEW.is_premium IS FALSE AND NEW.is_subscriber_only IS FALSE
  AND NEW.required_tier_id IS NULL AND NEW.moderation_hidden IS FALSE
  AND NEW.post_type IN ('clipt','regular','photo') AND NEW.image_url IS NOT NULL AND NEW.image_url<>''
  AND NEW.video_url IS NULL THEN
  -- Match the existing one-operation caption bound, including UTF-16 pairs.
  IF (SELECT coalesce(sum(CASE WHEN ascii(unit)>65535 THEN 2 ELSE 1 END),0)
   FROM regexp_split_to_table(coalesce(NEW.content,''),'') AS chars(unit))>500 THEN
   RAISE EXCEPTION 'Public photo captions and hashtags must be at most 500 characters' USING ERRCODE='22023'; END IF;
  INSERT INTO clipt_private.azure_review_dispatch(post_id,user_id,source_hash)
   VALUES(NEW.id,NEW.user_id,clipt_private.azure_review_snapshot_hash(to_jsonb(NEW))) ON CONFLICT DO NOTHING;
 END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION clipt_private.enqueue_public_photo_review() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER azure_enqueue_public_photo AFTER INSERT OR UPDATE ON public.posts
 FOR EACH ROW EXECUTE FUNCTION clipt_private.enqueue_public_photo_review();

CREATE FUNCTION clipt_private.photo_review_held(p_post uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT EXISTS(SELECT 1 FROM clipt_private.azure_review_dispatch d JOIN public.posts p ON p.id=d.post_id
  WHERE d.post_id=p_post AND d.state<>'completed' AND d.source_hash=clipt_private.azure_review_snapshot_hash(to_jsonb(p)))
$$;
REVOKE ALL ON FUNCTION clipt_private.photo_review_held(uuid) FROM PUBLIC;
GRANT USAGE ON SCHEMA clipt_private TO anon,authenticated;
GRANT EXECUTE ON FUNCTION clipt_private.photo_review_held(uuid) TO anon,authenticated;
-- Intersects existing privacy/account/MFA/moderation policies. The media-read
-- eligibility function is invoker-scoped and reads these same protected posts.
CREATE POLICY clipt_photo_review_hold ON public.posts AS RESTRICTIVE FOR SELECT TO anon,authenticated
 USING(user_id=(SELECT auth.uid()) OR NOT clipt_private.photo_review_held(id));

CREATE FUNCTION clipt_private.my_photo_review_holds()
RETURNS TABLE(post_id uuid,state text,created_at timestamptz)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF auth.uid() IS NULL OR NOT clipt_private.account_available() THEN
  RAISE EXCEPTION 'Authenticated account required' USING ERRCODE='42501'; END IF;
 RETURN QUERY SELECT d.post_id,d.state,d.created_at FROM clipt_private.azure_review_dispatch d
 JOIN public.posts p ON p.id=d.post_id WHERE d.user_id=auth.uid() AND d.state<>'completed'
 AND d.source_hash=clipt_private.azure_review_snapshot_hash(to_jsonb(p)) ORDER BY d.created_at DESC LIMIT 100;
END $$;
CREATE FUNCTION public.my_photo_review_holds() RETURNS TABLE(post_id uuid,state text,created_at timestamptz)
LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$SELECT * FROM clipt_private.my_photo_review_holds()$$;
REVOKE ALL ON FUNCTION clipt_private.my_photo_review_holds(),public.my_photo_review_holds() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION clipt_private.my_photo_review_holds(),public.my_photo_review_holds() TO authenticated;

CREATE FUNCTION clipt_private.claim_public_photo_review()
RETURNS TABLE(request_id uuid,post_id uuid,user_id uuid,reserved boolean) LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE target clipt_private.azure_review_dispatch%rowtype; source jsonb;
BEGIN
 IF NOT EXISTS(SELECT 1 FROM clipt_private.azure_dispatch_settings WHERE enabled) THEN RETURN; END IF;
 -- Same global quota -> profile -> post -> job ordering as reservation.
 PERFORM pg_catalog.pg_advisory_xact_lock(57421,101);
 -- Obsolete versions cannot release the current version's hold or get scanned.
 UPDATE clipt_private.azure_review_dispatch d SET state='completed' FROM public.posts p
  WHERE d.post_id=p.id AND d.state='queued' AND d.source_hash<>clipt_private.azure_review_snapshot_hash(to_jsonb(p));
 SELECT d.* INTO target FROM clipt_private.azure_review_dispatch d JOIN public.posts p ON p.id=d.post_id WHERE d.state='queued'
  AND (p.scheduled_publish_time IS NULL OR p.scheduled_publish_time<=clock_timestamp())
  ORDER BY d.created_at,d.id LIMIT 1;
 IF NOT FOUND THEN RETURN; END IF;
 PERFORM 1 FROM public.profiles WHERE id=target.user_id FOR UPDATE;
 IF NOT FOUND THEN RETURN; END IF;
 SELECT to_jsonb(p) INTO source FROM public.posts p WHERE p.id=target.post_id FOR UPDATE;
 PERFORM 1 FROM clipt_private.azure_review_dispatch d WHERE d.id=target.id AND d.state='queued' FOR UPDATE SKIP LOCKED;
 IF NOT FOUND THEN RETURN; END IF;
 IF source IS NULL OR target.source_hash<>clipt_private.azure_review_snapshot_hash(source) THEN
  UPDATE clipt_private.azure_review_dispatch SET state='completed' WHERE id=target.id; RETURN; END IF;
 -- Reserve and lock the source before returning a claim: an owner cannot edit
 -- between claim and provider dispatch. Ambiguous existing reservations stay held.
 IF public.reserve_azure_review(target.user_id,target.post_id,target.id,2) IS NOT TRUE THEN
  UPDATE clipt_private.azure_review_dispatch SET state='failed' WHERE id=target.id; RETURN; END IF;
 RETURN QUERY UPDATE clipt_private.azure_review_dispatch d SET state='processing',claimed_at=clock_timestamp()
  WHERE d.id=target.id RETURNING d.id,d.post_id,d.user_id,true;
END $$;
CREATE FUNCTION public.claim_public_photo_review()
RETURNS TABLE(request_id uuid,post_id uuid,user_id uuid,reserved boolean) LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$
 SELECT * FROM clipt_private.claim_public_photo_review()
$$;
CREATE FUNCTION clipt_private.finish_public_photo_dispatch(p_request uuid,p_success boolean) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF p_success IS NULL THEN RAISE EXCEPTION 'Outcome required'; END IF;
 IF p_success AND NOT EXISTS(SELECT 1 FROM clipt_private.azure_review_jobs j JOIN clipt_private.azure_review_dispatch d
  ON d.id=j.id AND d.post_id=j.post_id AND d.user_id=j.user_id AND d.source_hash=j.source_hash
  WHERE d.id=p_request AND j.state IN ('needs_review','no_flag_detected')) THEN
  RAISE EXCEPTION 'Completed review proof required' USING ERRCODE='42501'; END IF;
 UPDATE clipt_private.azure_review_dispatch SET state=CASE WHEN p_success THEN 'completed' ELSE 'failed' END
 WHERE id=p_request AND state='processing';
 RETURN FOUND;
END $$;
CREATE FUNCTION public.finish_public_photo_dispatch(p_request uuid,p_success boolean) RETURNS boolean
LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$SELECT clipt_private.finish_public_photo_dispatch(p_request,p_success)$$;
REVOKE ALL ON FUNCTION clipt_private.claim_public_photo_review(),public.claim_public_photo_review(),
 clipt_private.finish_public_photo_dispatch(uuid,boolean),public.finish_public_photo_dispatch(uuid,boolean) FROM PUBLIC,anon,authenticated;
GRANT USAGE ON SCHEMA clipt_private TO service_role;
GRANT EXECUTE ON FUNCTION clipt_private.claim_public_photo_review(),public.claim_public_photo_review(),
 clipt_private.finish_public_photo_dispatch(uuid,boolean),public.finish_public_photo_dispatch(uuid,boolean) TO service_role;

CREATE FUNCTION clipt_private.enqueue_existing_photo_reviews(p_limit integer DEFAULT 10) RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE candidate record; target public.posts%rowtype; total integer:=0; added integer;
BEGIN
 IF p_limit IS NULL OR p_limit<1 OR p_limit>10 THEN RAISE EXCEPTION 'Batch limit must be between 1 and 10'; END IF;
 IF NOT EXISTS(SELECT 1 FROM clipt_private.azure_dispatch_settings WHERE enabled) THEN RETURN 0; END IF;
 FOR candidate IN SELECT p.id,p.user_id FROM public.posts p
  WHERE p.is_published IS TRUE AND p.moderation_hidden IS FALSE AND p.video_url IS NULL
  AND p.image_url IS NOT NULL AND p.image_url<>'' AND p.is_premium IS FALSE AND p.is_subscriber_only IS FALSE
  AND p.required_tier_id IS NULL AND p.post_type IN ('clipt','regular','photo')
  AND (p.scheduled_publish_time IS NULL OR p.scheduled_publish_time<=clock_timestamp())
  AND NOT EXISTS(SELECT 1 FROM clipt_private.azure_review_dispatch d WHERE d.post_id=p.id
   AND d.source_hash=clipt_private.azure_review_snapshot_hash(to_jsonb(p))) ORDER BY p.user_id,p.id LIMIT p_limit
 LOOP
  PERFORM 1 FROM public.profiles WHERE id=candidate.user_id FOR UPDATE;
  IF NOT FOUND THEN CONTINUE; END IF;
  SELECT * INTO target FROM public.posts WHERE id=candidate.id FOR UPDATE;
  IF NOT FOUND OR target.is_published IS NOT TRUE OR target.moderation_hidden IS NOT FALSE
   OR target.video_url IS NOT NULL OR target.image_url IS NULL OR target.image_url=''
   OR target.is_premium IS NOT FALSE OR target.is_subscriber_only IS NOT FALSE
   OR target.required_tier_id IS NOT NULL OR target.post_type NOT IN ('clipt','regular','photo')
   OR (target.scheduled_publish_time IS NOT NULL AND target.scheduled_publish_time>clock_timestamp()) THEN CONTINUE; END IF;
  INSERT INTO clipt_private.azure_review_dispatch(post_id,user_id,source_hash)
   VALUES(target.id,target.user_id,clipt_private.azure_review_snapshot_hash(to_jsonb(target))) ON CONFLICT DO NOTHING;
  GET DIAGNOSTICS added=ROW_COUNT;total:=total+added;
 END LOOP;
 RETURN total;
END $$;
CREATE FUNCTION public.enqueue_existing_photo_reviews(p_limit integer DEFAULT 10) RETURNS integer
LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$SELECT clipt_private.enqueue_existing_photo_reviews(p_limit)$$;
REVOKE ALL ON FUNCTION clipt_private.enqueue_existing_photo_reviews(integer),public.enqueue_existing_photo_reviews(integer) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION clipt_private.enqueue_existing_photo_reviews(integer),public.enqueue_existing_photo_reviews(integer) TO service_role;

-- Published reviewed media must not be swapped behind a stable locator. DELETE
-- is left available for normal erasure; reinsertion at a still-referenced path
-- is denied. Fresh random-key uploads remain unaffected.
CREATE FUNCTION clipt_private.protect_reviewed_photo_bytes() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF NEW.bucket_id IN ('media','posts') AND EXISTS(
  SELECT 1 FROM public.posts p WHERE p.user_id::text=split_part(NEW.name,'/',1) AND p.video_url IS NULL AND p.image_url IN (
   'https://akiksrlzdqvipqbbjxpw.supabase.co/storage/v1/object/public/'||NEW.bucket_id||'/'||NEW.name,
   'https://akiksrlzdqvipqbbjxpw.supabase.co/storage/v1/object/authenticated/'||NEW.bucket_id||'/'||NEW.name)
  AND (EXISTS(SELECT 1 FROM clipt_private.azure_review_dispatch d WHERE d.post_id=p.id)
   OR EXISTS(SELECT 1 FROM clipt_private.azure_photo_quarantines q WHERE q.post_id=p.id))) THEN
  RAISE EXCEPTION 'Reviewed photo media is immutable; upload a new file' USING ERRCODE='55000';
 END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION clipt_private.protect_reviewed_photo_bytes() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER clipt_reviewed_photo_bytes BEFORE INSERT OR UPDATE ON storage.objects
 FOR EACH ROW EXECUTE FUNCTION clipt_private.protect_reviewed_photo_bytes();
COMMIT;
