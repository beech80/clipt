-- Reviewed release preparation, NOT an automatically applied migration.
-- Activate only after the owner-supplied roster, RPC/Edge audit and acceptance.
BEGIN;
SET LOCAL lock_timeout = '5s';
CREATE TABLE clipt_private.beta_access_config (
  singleton boolean PRIMARY KEY DEFAULT true CHECK (singleton),
  enabled boolean NOT NULL DEFAULT false
);
INSERT INTO clipt_private.beta_access_config(singleton,enabled) VALUES(true,false);
CREATE TABLE clipt_private.beta_members (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  approved_at timestamptz NOT NULL DEFAULT statement_timestamp(),
  expires_at timestamptz,
  revoked_at timestamptz
);
ALTER TABLE clipt_private.beta_access_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE clipt_private.beta_members ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON clipt_private.beta_access_config,clipt_private.beta_members FROM PUBLIC,anon,authenticated;

-- Deliberately narrow definer lookup: clients cannot read/edit the roster.
-- Live DB membership, not user_metadata or stale JWT approval claims.
CREATE FUNCTION clipt_private.beta_access_allowed() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
  SELECT coalesce((SELECT NOT c.enabled OR (
    auth.uid() IS NOT NULL AND EXISTS (
      SELECT 1 FROM clipt_private.beta_members m JOIN auth.users u ON u.id=m.user_id
      WHERE m.user_id=auth.uid() AND m.revoked_at IS NULL
      AND (m.expires_at IS NULL OR m.expires_at>statement_timestamp())
      AND u.email_confirmed_at IS NOT NULL AND NOT coalesce(u.is_anonymous,false)
    )
  ) FROM clipt_private.beta_access_config c WHERE c.singleton),false);
$$;
REVOKE ALL ON FUNCTION clipt_private.beta_access_allowed() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION clipt_private.beta_access_allowed() TO anon,authenticated;

CREATE FUNCTION public.clipt_beta_access() RETURNS boolean
LANGUAGE sql STABLE SECURITY INVOKER SET search_path='' AS $$
  SELECT clipt_private.beta_access_allowed();
$$;
REVOKE ALL ON FUNCTION public.clipt_beta_access() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.clipt_beta_access() TO anon,authenticated;

-- Preserve the existing account-existence and enrolled-MFA checks.
CREATE OR REPLACE FUNCTION clipt_private.account_available() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
  SELECT clipt_private.beta_access_allowed()
  AND EXISTS(SELECT 1 FROM public.profiles WHERE id=(SELECT auth.uid()))
  AND (coalesce((SELECT auth.jwt()->>'aal'),'aal1')='aal2'
    OR NOT EXISTS(SELECT 1 FROM auth.mfa_factors
      WHERE user_id=(SELECT auth.uid()) AND status='verified'));
$$;

-- Restrictive intersection: no existing visibility/ownership rule is replaced.
-- Fail rather than silently omit any public ordinary/partitioned table without RLS.
DO $$ DECLARE target record; BEGIN
  FOR target IN SELECT n.nspname,c.relname,c.relrowsecurity FROM pg_class c
    JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE n.nspname='public' AND c.relkind IN ('r','p')
  LOOP
    IF NOT target.relrowsecurity THEN
      RAISE EXCEPTION 'Beta gate requires RLS on %.%',target.nspname,target.relname;
    END IF;
    EXECUTE format('CREATE POLICY clipt_beta_access_boundary ON %I.%I AS RESTRICTIVE FOR ALL TO anon,authenticated USING ((SELECT clipt_private.beta_access_allowed())) WITH CHECK ((SELECT clipt_private.beta_access_allowed()))',target.nspname,target.relname);
  END LOOP;
END $$;
CREATE POLICY clipt_beta_access_boundary ON storage.objects
AS RESTRICTIVE FOR ALL TO anon,authenticated
USING ((SELECT clipt_private.beta_access_allowed()))
WITH CHECK ((SELECT clipt_private.beta_access_allowed()));
COMMIT;

-- No approval rows, activation, invitations or production changes are performed.
-- Public buckets bypass SELECT RLS: make the tested Storage API cutover first.
-- Auth signup settings, SECURITY DEFINER RPCs, Edge Functions and Realtime require
-- separate acceptance. This file alone is not a complete invite-only rollout.
