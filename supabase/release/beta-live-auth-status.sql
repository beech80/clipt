-- Follow-up to the canonical invitation gate. Existing JWTs must not bypass bans
-- or soft account deletion; editable metadata never determines admission.
CREATE OR REPLACE FUNCTION clipt_private.beta_access_allowed() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $gate$
  SELECT coalesce((SELECT NOT c.enabled OR (
    auth.uid() IS NOT NULL AND EXISTS (
      SELECT 1 FROM clipt_private.beta_members m JOIN auth.users u ON u.id=m.user_id
      WHERE m.user_id=auth.uid() AND m.revoked_at IS NULL
      AND (m.expires_at IS NULL OR m.expires_at>statement_timestamp())
      AND u.email_confirmed_at IS NOT NULL AND NOT coalesce(u.is_anonymous,false)
      AND u.deleted_at IS NULL AND (u.banned_until IS NULL OR u.banned_until<=statement_timestamp())
    )
  ) FROM clipt_private.beta_access_config c WHERE c.singleton),false);
$gate$;
