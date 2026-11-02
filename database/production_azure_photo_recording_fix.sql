-- API connections preload safeupdate. Scope this singleton update explicitly.
BEGIN;
CREATE OR REPLACE FUNCTION public.record_azure_photo_worker(p_state text) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF p_state NOT IN ('provider_verified','processed','idle','disabled','failed','held') THEN RAISE EXCEPTION 'Invalid worker state'; END IF;
 UPDATE clipt_private.azure_dispatch_settings SET last_worker_at=clock_timestamp(),last_worker_state=p_state,
 probe_verified_at=CASE WHEN p_state='provider_verified' THEN clock_timestamp() ELSE probe_verified_at END
 WHERE singleton IS TRUE;
 RETURN FOUND;
END $$;
REVOKE ALL ON FUNCTION public.record_azure_photo_worker(text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.record_azure_photo_worker(text) TO service_role;
COMMIT;
