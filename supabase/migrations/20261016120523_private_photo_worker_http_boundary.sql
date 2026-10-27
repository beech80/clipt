-- DEVELOPMENT ONLY. Atomic install/ACL check; no outbound call or activation.
BEGIN;
DO $$BEGIN
 IF EXISTS(SELECT 1 FROM pg_extension WHERE extname='http') THEN
  RAISE EXCEPTION 'Existing HTTP extension requires separate ownership review'; END IF;
END $$;
CREATE SCHEMA clipt_http;
CREATE EXTENSION http WITH SCHEMA clipt_http VERSION '1.6';
REVOKE ALL ON SCHEMA clipt_http FROM PUBLIC,anon,authenticated,authenticator;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA clipt_http FROM PUBLIC,anon,authenticated,authenticator;
-- New schema/extension: there are no pre-existing cached bindings to these OIDs.
-- Managed extension functions can retain PUBLIC EXECUTE. The effective boundary
-- is denied schema USAGE/CREATE, plus no untrusted SQL/wrapper creation rights.
DO $$DECLARE app_role text; denied boolean;BEGIN
 FOREACH app_role IN ARRAY ARRAY['anon','authenticated','authenticator'] LOOP
  IF has_schema_privilege(app_role,'clipt_http','USAGE,CREATE')
    OR has_database_privilege(app_role,current_database(),'CREATE') THEN
   RAISE EXCEPTION 'Private HTTP schema grants unconfirmed'; END IF;
  denied:=false;
  EXECUTE format('SET LOCAL ROLE %I',app_role);
  BEGIN PERFORM clipt_http.http_reset_curlopt();
  EXCEPTION WHEN insufficient_privilege THEN denied:=true; END;
  EXECUTE 'RESET ROLE';
  IF NOT denied THEN RAISE EXCEPTION 'Private HTTP invocation was not denied'; END IF;
 END LOOP;
END $$;
-- Private synchronous transport: no pg_net queue containing worker credentials.
-- Does NOT install an extension, schedule a job or enable scanning.
CREATE FUNCTION clipt_private.photo_worker_http_tick(p_probe boolean DEFAULT false) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE secret_value text; reply record; parsed jsonb; app_role text;
BEGIN
 IF p_probe IS DISTINCT FROM true AND NOT EXISTS(SELECT 1 FROM clipt_private.azure_dispatch_settings WHERE singleton AND enabled) THEN
  RETURN jsonb_build_object('state','disabled'); END IF;
 IF NOT pg_try_advisory_xact_lock(57421,103) THEN RETURN jsonb_build_object('state','busy'); END IF;
 IF to_regprocedure('clipt_http.http(clipt_http.http_request)') IS NULL THEN
  RETURN jsonb_build_object('state','transport_unavailable'); END IF;
 FOREACH app_role IN ARRAY ARRAY['anon','authenticated','authenticator'] LOOP
  IF has_schema_privilege(app_role,'clipt_http','USAGE,CREATE')
   OR has_database_privilege(app_role,current_database(),'CREATE')
   OR has_table_privilege(app_role,'vault.decrypted_secrets','SELECT')
   OR has_any_column_privilege(app_role,'vault.decrypted_secrets','SELECT') THEN
   RETURN jsonb_build_object('state','unsafe_transport'); END IF;
 END LOOP;
 IF (SELECT count(*) FROM vault.decrypted_secrets WHERE name='clipt_azure_worker_secret')<>1 THEN
  RETURN jsonb_build_object('state','credential_unavailable'); END IF;
 SELECT decrypted_secret INTO secret_value FROM vault.decrypted_secrets WHERE name='clipt_azure_worker_secret';
 IF secret_value IS NULL OR length(secret_value) NOT BETWEEN 32 AND 256 OR secret_value !~ '^[a-zA-Z0-9_-]+$' THEN
  RETURN jsonb_build_object('state','credential_unavailable'); END IF;
 -- Reset inherited options, preserve TLS checks, disable proxies, bound blocking.
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
    ROW('x-clipt-worker-probe',CASE WHEN p_probe THEN 'disabled-only' ELSE 'none' END)::clipt_http.http_header],
  'application/json','{}')::clipt_http.http_request);
 secret_value:=NULL;
 -- Never return/log response headers, provider bodies or the request credential.
 IF length(reply.content)>2048 THEN RETURN jsonb_build_object('state','response_unconfirmed'); END IF;
 parsed:=reply.content::jsonb;
 IF reply.status=503 AND parsed->>'error'='Automatic photo review is disabled' THEN
  RETURN jsonb_build_object('state','worker_disabled','http_status',503); END IF;
 IF p_probe THEN RETURN jsonb_build_object('state','probe_refused','http_status',reply.status); END IF;
 IF reply.status=200 AND parsed->>'state' IN ('idle','processed','held') THEN
  RETURN jsonb_build_object('state',parsed->>'state','http_status',200); END IF;
 RETURN jsonb_build_object('state','response_unconfirmed','http_status',reply.status);
EXCEPTION WHEN OTHERS THEN
 RETURN jsonb_build_object('state','transport_unconfirmed');
END $$;
REVOKE ALL ON FUNCTION clipt_private.photo_worker_http_tick(boolean) FROM PUBLIC,anon,authenticated,authenticator;
GRANT EXECUTE ON FUNCTION clipt_private.photo_worker_http_tick(boolean) TO service_role;
COMMIT;


