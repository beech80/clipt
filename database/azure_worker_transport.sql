-- STAGED ONLY. Installs no extensions, schedule or enablement flags.
-- Review/apply only in clipt-development after extension privileges are secured.
BEGIN;
CREATE FUNCTION clipt_private.assert_photo_worker_transport() RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE role_name text; target regclass; transport regprocedure;
BEGIN
 IF to_regclass('net.http_request_queue') IS NULL OR to_regclass('net._http_response') IS NULL THEN
  RAISE EXCEPTION 'Reviewed network transport required' USING ERRCODE='55000'; END IF;
 transport:=to_regprocedure('net.http_post(text,jsonb,jsonb,jsonb,integer)');
 IF transport IS NULL THEN RAISE EXCEPTION 'Reviewed network transport required' USING ERRCODE='55000'; END IF;
 FOREACH role_name IN ARRAY ARRAY['anon','authenticated','authenticator'] LOOP
  IF has_schema_privilege(role_name,'net','USAGE') OR has_function_privilege(role_name,transport,'EXECUTE') THEN
   RAISE EXCEPTION 'Untrusted network transport access' USING ERRCODE='42501'; END IF;
  FOREACH target IN ARRAY ARRAY[to_regclass('net.http_request_queue'),to_regclass('net._http_response')] LOOP
   IF has_table_privilege(role_name,target,'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')
    OR has_any_column_privilege(role_name,target,'SELECT,INSERT,UPDATE,REFERENCES') THEN
    RAISE EXCEPTION 'Untrusted network queue access' USING ERRCODE='42501'; END IF;
  END LOOP;
  IF has_table_privilege(role_name,'vault.decrypted_secrets','SELECT')
   OR has_any_column_privilege(role_name,'vault.decrypted_secrets','SELECT') THEN
   RAISE EXCEPTION 'Untrusted worker credential access' USING ERRCODE='42501'; END IF;
 END LOOP;
 RETURN true;
END $$;
CREATE FUNCTION clipt_private.enqueue_photo_worker_tick() RETURNS bigint
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE worker_secret text; queued bigint;
BEGIN
 -- Disabled means zero secret reads and zero network calls.
 IF NOT EXISTS(SELECT 1 FROM clipt_private.azure_dispatch_settings WHERE singleton AND enabled) THEN RETURN NULL; END IF;
 PERFORM clipt_private.assert_photo_worker_transport();
 IF (SELECT count(*) FROM vault.decrypted_secrets WHERE name='clipt_azure_worker_secret')<>1 THEN
  RAISE EXCEPTION 'Worker credential unavailable' USING ERRCODE='55000'; END IF;
 SELECT decrypted_secret INTO worker_secret FROM vault.decrypted_secrets WHERE name='clipt_azure_worker_secret';
 IF worker_secret IS NULL OR worker_secret !~ '^[a-fA-F0-9]{64,128}$' THEN
  RAISE EXCEPTION 'Worker credential unavailable' USING ERRCODE='55000'; END IF;
 -- Fixed destination/body. Never use caller URLs, content or credentials.
 SELECT net.http_post(
  url:='https://akiksrlzdqvipqbbjxpw.supabase.co/functions/v1/process-photo-reviews',
  body:='{}'::jsonb,params:='{}'::jsonb,
  headers:=jsonb_build_object('Content-Type','application/json','x-clipt-worker-key',worker_secret),
  timeout_milliseconds:=30000) INTO queued;
 RETURN queued;
END $$;
REVOKE ALL ON FUNCTION clipt_private.assert_photo_worker_transport(),clipt_private.enqueue_photo_worker_tick() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION clipt_private.assert_photo_worker_transport(),clipt_private.enqueue_photo_worker_tick() TO service_role;
COMMIT;
-- Future reviewed cron command must contain only the function call, never a key:
-- SELECT clipt_private.enqueue_photo_worker_tick();
-- This file deliberately does not create/activate any cron job.
