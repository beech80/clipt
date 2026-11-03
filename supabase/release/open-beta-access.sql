-- Install after the existing beta-access and live-auth-status boundaries.
-- Installation is inert: keep allow_verified_signups=false until coordinated activation.
BEGIN;
SET LOCAL lock_timeout = '5s';
ALTER TABLE clipt_private.beta_access_config
  ADD COLUMN IF NOT EXISTS allow_verified_signups boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION clipt_private.beta_access_allowed() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $gate$
  SELECT coalesce((SELECT NOT c.enabled OR (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM auth.users u
      WHERE u.id=auth.uid()
      AND u.email_confirmed_at IS NOT NULL AND NOT coalesce(u.is_anonymous,false)
      AND u.deleted_at IS NULL
      AND (u.banned_until IS NULL OR u.banned_until<=statement_timestamp())
    )
    AND (
      EXISTS (
        SELECT 1 FROM clipt_private.beta_members m
        WHERE m.user_id=auth.uid() AND m.revoked_at IS NULL
        AND (m.expires_at IS NULL OR m.expires_at>statement_timestamp())
      )
      OR (
        c.allow_verified_signups
        AND NOT EXISTS (
          SELECT 1 FROM clipt_private.beta_members m
          WHERE m.user_id=auth.uid()
          AND (m.revoked_at IS NOT NULL OR m.expires_at<=statement_timestamp())
        )
      )
    )
  ) FROM clipt_private.beta_access_config c WHERE c.singleton),false);
$gate$;
REVOKE ALL ON FUNCTION clipt_private.beta_access_allowed() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION clipt_private.beta_access_allowed() TO anon,authenticated;

-- Keep the Data API pre-request boundary, including service, OPTIONS and MFA handling.
CREATE OR REPLACE FUNCTION clipt_private.enforce_beta_api_request() RETURNS void
LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $admission$
BEGIN
  IF current_user='service_role' THEN RETURN; END IF;
  IF current_setting('request.method',true)='OPTIONS' THEN RETURN; END IF;
  IF current_setting('request.path',true) IN ('/rpc/clipt_beta_access','/rpc/clipt_beta_access/') THEN RETURN; END IF;
  IF NOT clipt_private.beta_access_allowed() THEN
    RAISE EXCEPTION 'Sign in with a verified account to use CLIPT' USING ERRCODE='42501';
  END IF;
  IF current_user='authenticated' THEN
    IF NOT clipt_private.account_available() THEN
      RAISE EXCEPTION 'Verified account and enrolled MFA required' USING ERRCODE='42501';
    END IF;
  END IF;
END $admission$;
REVOKE ALL ON FUNCTION clipt_private.enforce_beta_api_request() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION clipt_private.enforce_beta_api_request() TO anon,authenticated,service_role;
COMMIT;

-- Activation (separate, owner-authorized release step):
-- UPDATE clipt_private.beta_access_config SET allow_verified_signups=true WHERE singleton AND enabled;
-- Rollback: set only allow_verified_signups=false. Never disable the admission boundary.
