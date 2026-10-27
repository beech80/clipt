-- Development-only, administrator-armed, one-shot synthetic fixture.
-- No automatic scanning flag, scheduler, role or budget reset is enabled here.
BEGIN;
CREATE TABLE clipt_private.photo_worker_fixture (
 singleton boolean PRIMARY KEY DEFAULT true CHECK(singleton),
 user_id uuid NOT NULL REFERENCES public.profiles(id),
 post_id uuid NOT NULL UNIQUE, request_id uuid,
 object_path text NOT NULL UNIQUE,
 state text NOT NULL DEFAULT 'armed' CHECK(state IN ('armed','preparing','prepared','claimed','done','failed','cleaning')),
 expires_at timestamptz NOT NULL,
 CHECK(object_path=user_id::text||'/worker-verification-'||post_id::text||'.png')
);
ALTER TABLE clipt_private.photo_worker_fixture ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON clipt_private.photo_worker_fixture FROM PUBLIC,anon,authenticated,authenticator;

CREATE FUNCTION clipt_private.claim_photo_worker_fixture(p_phase text)
RETURNS TABLE(request_id uuid,post_id uuid,user_id uuid,object_path text,reserved boolean)
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE f clipt_private.photo_worker_fixture%rowtype; d clipt_private.azure_review_dispatch%rowtype;
BEGIN
 PERFORM pg_advisory_xact_lock(57421,101);
 IF (SELECT enabled FROM clipt_private.azure_dispatch_settings WHERE singleton) IS DISTINCT FROM false THEN
  RAISE EXCEPTION 'General dispatch must be disabled' USING ERRCODE='42501'; END IF;
 SELECT * INTO f FROM clipt_private.photo_worker_fixture WHERE singleton FOR UPDATE;
 IF NOT FOUND THEN RETURN; END IF;
 IF p_phase<>'cleanup' AND f.expires_at<=clock_timestamp() THEN RETURN; END IF;
 PERFORM 1 FROM public.profiles WHERE id=f.user_id FOR UPDATE;
 IF NOT FOUND OR NOT EXISTS(SELECT 1 FROM auth.users WHERE id=f.user_id AND email_confirmed_at IS NOT NULL AND NOT coalesce(is_anonymous,false)) THEN
  RAISE EXCEPTION 'Confirmed fixture owner required' USING ERRCODE='42501'; END IF;
 IF p_phase='prepare' THEN
  IF f.state<>'armed' OR EXISTS(SELECT 1 FROM public.posts WHERE id=f.post_id)
   OR EXISTS(SELECT 1 FROM storage.objects o WHERE o.bucket_id='media' AND o.name=f.object_path) THEN RETURN; END IF;
  UPDATE clipt_private.photo_worker_fixture SET state='preparing' WHERE singleton;
 ELSIF p_phase='run' THEN
  IF f.state<>'prepared' THEN RETURN; END IF;
  PERFORM 1 FROM public.posts p WHERE p.id=f.post_id AND p.user_id=f.user_id FOR UPDATE;
  SELECT q.* INTO d FROM clipt_private.azure_review_dispatch q JOIN public.posts p ON p.id=q.post_id
   WHERE q.post_id=f.post_id AND q.user_id=f.user_id AND q.state='queued'
    AND q.source_hash=clipt_private.azure_review_snapshot_hash(to_jsonb(p)) FOR UPDATE OF q;
  IF NOT FOUND THEN RAISE EXCEPTION 'Exact held fixture required'; END IF;
  IF public.reserve_azure_review(f.user_id,f.post_id,d.id,2) IS DISTINCT FROM true THEN
   RAISE EXCEPTION 'Fixture already reserved'; END IF;
  UPDATE clipt_private.azure_review_dispatch SET state='processing',claimed_at=clock_timestamp() WHERE id=d.id;
  UPDATE clipt_private.photo_worker_fixture SET state='claimed',request_id=d.id WHERE singleton;
  f.request_id:=d.id;
 ELSIF p_phase='cleanup' THEN
  IF f.state NOT IN ('preparing','prepared','done','failed','cleaning')
   OR EXISTS(SELECT 1 FROM clipt_private.azure_review_jobs j WHERE j.post_id=f.post_id AND j.state='pending') THEN
   RAISE EXCEPTION 'Fixture cleanup requires reconciliation'; END IF;
  UPDATE clipt_private.photo_worker_fixture SET state='cleaning' WHERE singleton;
 ELSE RAISE EXCEPTION 'Unsupported fixture phase'; END IF;
 RETURN QUERY SELECT f.request_id,f.post_id,f.user_id,f.object_path,true;
END $$;

CREATE FUNCTION clipt_private.finish_photo_worker_fixture(p_phase text,p_success boolean)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE f clipt_private.photo_worker_fixture%rowtype; source_url text;
BEGIN
 IF p_success IS NULL THEN RAISE EXCEPTION 'Outcome required'; END IF;
 PERFORM pg_advisory_xact_lock(57421,101);
 SELECT * INTO f FROM clipt_private.photo_worker_fixture WHERE singleton FOR UPDATE;
 IF NOT FOUND THEN RETURN false; END IF;
 IF (SELECT enabled FROM clipt_private.azure_dispatch_settings WHERE singleton) IS DISTINCT FROM false THEN
  RAISE EXCEPTION 'General dispatch must be disabled'; END IF;
 source_url:='https://akiksrlzdqvipqbbjxpw.supabase.co/storage/v1/object/public/media/'||f.object_path;
 IF p_phase='prepare' AND f.state='preparing' THEN
  IF NOT p_success THEN UPDATE clipt_private.photo_worker_fixture SET state='failed' WHERE singleton; RETURN true; END IF;
  IF f.expires_at<=clock_timestamp() OR NOT EXISTS(SELECT 1 FROM storage.objects o WHERE o.bucket_id='media' AND o.name=f.object_path
   AND (o.owner_id IS NULL OR o.owner_id=f.user_id::text) AND o.metadata->>'mimetype'='image/png' AND (o.metadata->>'size')::integer=179) THEN
   RAISE EXCEPTION 'Owned fixture upload unconfirmed'; END IF;
  -- Service API created only this fresh registered fixture; assign its approved
  -- owner before publication. No existing object can enter the prepare phase.
  UPDATE storage.objects SET owner_id=f.user_id::text,owner=f.user_id WHERE bucket_id='media' AND name=f.object_path;
  -- Only this transaction observes enabled=true; normal publication trigger
  -- enqueues the exact inserted snapshot before anyone can read it.
  UPDATE clipt_private.azure_dispatch_settings SET enabled=true WHERE singleton;
  INSERT INTO public.posts(id,user_id,content,image_url,post_type,is_published,is_premium,is_subscriber_only)
   VALUES(f.post_id,f.user_id,'A blue square created only for the Clipt public moderation test.',source_url,'clipt',true,false,false);
  UPDATE clipt_private.azure_dispatch_settings SET enabled=false WHERE singleton;
  IF NOT clipt_private.photo_review_held(f.post_id) THEN RAISE EXCEPTION 'Fixture hold unconfirmed'; END IF;
  UPDATE clipt_private.photo_worker_fixture SET state='prepared' WHERE singleton;
 ELSIF p_phase='run' AND f.state='claimed' THEN
  IF p_success AND NOT EXISTS(SELECT 1 FROM clipt_private.azure_review_dispatch d JOIN clipt_private.azure_review_jobs j ON j.id=d.id
    WHERE d.id=f.request_id AND d.post_id=f.post_id AND d.user_id=f.user_id AND d.state='completed' AND j.state IN ('needs_review','no_flag_detected')) THEN
   RAISE EXCEPTION 'Actual review completion proof required'; END IF;
  IF NOT p_success AND EXISTS(SELECT 1 FROM clipt_private.azure_review_jobs WHERE id=f.request_id AND state='pending') THEN
   RAISE EXCEPTION 'Pending fixture requires reconciliation'; END IF;
  UPDATE clipt_private.photo_worker_fixture SET state=CASE WHEN p_success THEN 'done' ELSE 'failed' END WHERE singleton;
 ELSIF p_phase='cleanup' AND f.state='cleaning' AND p_success THEN
  IF EXISTS(SELECT 1 FROM storage.objects WHERE bucket_id='media' AND name=f.object_path) THEN RAISE EXCEPTION 'Storage cleanup unconfirmed'; END IF;
  DELETE FROM public.posts WHERE id=f.post_id AND user_id=f.user_id AND image_url=source_url;
  IF EXISTS(SELECT 1 FROM public.posts WHERE id=f.post_id) THEN RAISE EXCEPTION 'Fixture binding changed'; END IF;
  DELETE FROM clipt_private.photo_worker_fixture WHERE singleton;
 ELSE RETURN false; END IF;
 RETURN true;
END $$;
CREATE FUNCTION public.claim_photo_worker_fixture(p_phase text)
RETURNS TABLE(request_id uuid,post_id uuid,user_id uuid,object_path text,reserved boolean)
LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$SELECT * FROM clipt_private.claim_photo_worker_fixture(p_phase)$$;
CREATE FUNCTION public.finish_photo_worker_fixture(p_phase text,p_success boolean)
RETURNS boolean LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$SELECT clipt_private.finish_photo_worker_fixture(p_phase,p_success)$$;
REVOKE ALL ON FUNCTION clipt_private.claim_photo_worker_fixture(text),public.claim_photo_worker_fixture(text),
 clipt_private.finish_photo_worker_fixture(text,boolean),public.finish_photo_worker_fixture(text,boolean) FROM PUBLIC,anon,authenticated,authenticator;
GRANT EXECUTE ON FUNCTION clipt_private.claim_photo_worker_fixture(text),public.claim_photo_worker_fixture(text),
 clipt_private.finish_photo_worker_fixture(text,boolean),public.finish_photo_worker_fixture(text,boolean) TO service_role;

CREATE FUNCTION clipt_private.bounded_photo_worker_http_tick(p_phase text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE secret_value text; reply record; parsed jsonb; r text;
BEGIN
 IF p_phase IS NULL OR p_phase NOT IN ('prepare','run','cleanup') THEN RAISE EXCEPTION 'Unsupported fixture phase'; END IF;
 IF NOT pg_try_advisory_xact_lock(57421,103) THEN RETURN jsonb_build_object('state','busy'); END IF;
 IF (SELECT enabled FROM clipt_private.azure_dispatch_settings WHERE singleton) IS DISTINCT FROM false THEN
  RETURN jsonb_build_object('state','general_dispatch_enabled'); END IF;
 FOREACH r IN ARRAY ARRAY['anon','authenticated','authenticator'] LOOP
  IF has_schema_privilege(r,'clipt_http','USAGE,CREATE') OR has_database_privilege(r,current_database(),'CREATE')
   OR has_table_privilege(r,'vault.decrypted_secrets','SELECT') OR has_any_column_privilege(r,'vault.decrypted_secrets','SELECT') THEN
   RETURN jsonb_build_object('state','unsafe_transport'); END IF;
 END LOOP;
 IF (SELECT count(*) FROM vault.decrypted_secrets WHERE name='clipt_azure_worker_secret')<>1 THEN
  RETURN jsonb_build_object('state','credential_unavailable'); END IF;
 SELECT decrypted_secret INTO secret_value FROM vault.decrypted_secrets WHERE name='clipt_azure_worker_secret';
 IF secret_value IS NULL OR length(secret_value) NOT BETWEEN 32 AND 256 OR secret_value !~ '^[a-zA-Z0-9_-]+$' THEN
  RETURN jsonb_build_object('state','credential_unavailable'); END IF;
 PERFORM clipt_http.http_reset_curlopt();
 IF clipt_http.http_set_curlopt('CURLOPT_SSL_VERIFYPEER','1') IS DISTINCT FROM true
  OR clipt_http.http_set_curlopt('CURLOPT_SSL_VERIFYHOST','2') IS DISTINCT FROM true
  OR clipt_http.http_set_curlopt('CURLOPT_PROXY','') IS DISTINCT FROM true
  OR clipt_http.http_set_curlopt('CURLOPT_CONNECTTIMEOUT','3') IS DISTINCT FROM true
  OR clipt_http.http_set_curlopt('CURLOPT_TIMEOUT_MS','25000') IS DISTINCT FROM true THEN
  RETURN jsonb_build_object('state','transport_unavailable'); END IF;
 SELECT * INTO reply FROM clipt_http.http(ROW('POST',
  'https://akiksrlzdqvipqbbjxpw.supabase.co/functions/v1/process-photo-reviews',
  ARRAY[ROW('x-clipt-worker-key',secret_value)::clipt_http.http_header,
    ROW('x-clipt-worker-probe','bounded-'||p_phase)::clipt_http.http_header],
  'application/json','{}')::clipt_http.http_request);
 secret_value:=NULL;
 IF length(reply.content)>2048 THEN RETURN jsonb_build_object('state','response_unconfirmed'); END IF;
 parsed:=reply.content::jsonb;
 IF reply.status=200 AND parsed->>'state' IN ('prepared','processed','cleaned','idle','held') THEN
  RETURN jsonb_build_object('state',parsed->>'state','http_status',200); END IF;
 RETURN jsonb_build_object('state','response_unconfirmed','http_status',reply.status);
EXCEPTION WHEN OTHERS THEN RETURN jsonb_build_object('state','transport_unconfirmed');
END $$;
REVOKE ALL ON FUNCTION clipt_private.bounded_photo_worker_http_tick(text) FROM PUBLIC,anon,authenticated,authenticator;
GRANT EXECUTE ON FUNCTION clipt_private.bounded_photo_worker_http_tick(text) TO service_role;
COMMIT;
