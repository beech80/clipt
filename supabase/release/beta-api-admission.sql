-- Complements RLS and Edge guards; PostgREST only. Storage/Realtime keep RLS.
CREATE FUNCTION clipt_private.enforce_beta_api_request() RETURNS void
LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $admission$
BEGIN
  -- This is the verified database execution role, never editable user metadata.
  -- Trusted workers retain authenticated account export/deletion and maintenance.
  IF current_user='service_role' THEN RETURN; END IF;
  IF current_setting('request.method',true)='OPTIONS' THEN RETURN; END IF;
  -- The UI needs an explicit false admission result, not an ambiguous fetch error.
  IF current_setting('request.path',true) IN ('/rpc/clipt_beta_access','/rpc/clipt_beta_access/') THEN RETURN; END IF;
  IF NOT clipt_private.beta_access_allowed() THEN
    RAISE EXCEPTION 'A beta invitation is required' USING ERRCODE='42501';
  END IF;
  IF current_user='authenticated' THEN
    IF NOT clipt_private.account_available() THEN
      RAISE EXCEPTION 'Verified account and enrolled MFA required' USING ERRCODE='42501';
    END IF;
  END IF;
END $admission$;
REVOKE ALL ON FUNCTION clipt_private.enforce_beta_api_request() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION clipt_private.enforce_beta_api_request() TO anon,authenticated,service_role;

DO $guard$
BEGIN
  IF to_regprocedure('public.clipt_beta_access()') IS NULL THEN
    RAISE EXCEPTION 'Install the canonical invitation gate first';
  END IF;
  IF EXISTS(SELECT 1 FROM pg_db_role_setting s JOIN pg_roles r ON r.oid=s.setrole,
    unnest(s.setconfig) value WHERE r.rolname='authenticator'
      AND value LIKE 'pgrst.db_pre_request=%'
      AND value NOT IN ('pgrst.db_pre_request=','pgrst.db_pre_request=clipt_private.enforce_beta_api_request')) THEN
    RAISE EXCEPTION 'Existing pre-request hook requires explicit chaining; no override performed';
  END IF;
END $guard$;
ALTER ROLE authenticator SET pgrst.db_pre_request='clipt_private.enforce_beta_api_request';
NOTIFY pgrst,'reload config';
