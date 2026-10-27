BEGIN;
REVOKE SELECT ON public.profiles FROM anon,authenticated;
REVOKE SELECT(theme_preference,font_size,enable_notifications,enable_sounds,keyboard_shortcuts,
  verification_requested_at,verification_approved_at,verification_rejected_at,verification_rejected_reason,
  onboarding_completed,onboarding_step,preferred_language) ON public.profiles FROM anon,authenticated;
GRANT SELECT(id,username,avatar_url,created_at,bio,website,display_name,is_moderator,bio_description,
  location,custom_theme,social_links,is_verified) ON public.profiles TO anon,authenticated;

-- No caller-supplied ID; private fields are available only for auth.uid().
CREATE FUNCTION clipt_private.get_own_profile()
RETURNS SETOF public.profiles LANGUAGE sql SECURITY DEFINER SET search_path='' AS $$
  SELECT p.* FROM public.profiles p WHERE p.id=(SELECT auth.uid());
$$;
REVOKE ALL ON FUNCTION clipt_private.get_own_profile() FROM PUBLIC,anon;
GRANT USAGE ON SCHEMA clipt_private TO authenticated;
GRANT EXECUTE ON FUNCTION clipt_private.get_own_profile() TO authenticated;
CREATE FUNCTION public.get_own_profile()
RETURNS SETOF public.profiles LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$
  SELECT * FROM clipt_private.get_own_profile();
$$;
REVOKE ALL ON FUNCTION public.get_own_profile() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.get_own_profile() TO authenticated;
COMMIT;
