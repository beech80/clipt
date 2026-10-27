BEGIN;
-- Ownership alone must not authorize promotion to moderator or verified status.
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON public.profiles FROM PUBLIC, anon, authenticated;
GRANT INSERT (id, username, avatar_url, bio, website, display_name,
  bio_description, location, custom_theme, social_links, theme_preference,
  font_size, enable_notifications, enable_sounds, keyboard_shortcuts,
  onboarding_completed, onboarding_step, preferred_language)
  ON public.profiles TO authenticated;
GRANT UPDATE (username, avatar_url, bio, website, display_name,
  bio_description, location, custom_theme, social_links, theme_preference,
  font_size, enable_notifications, enable_sounds, keyboard_shortcuts,
  onboarding_completed, onboarding_step, preferred_language,
  verification_requested_at)
  ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
CREATE POLICY profile_insert_identity_boundary ON public.profiles AS RESTRICTIVE
  FOR INSERT TO authenticated WITH CHECK (id=(SELECT auth.uid()));
CREATE POLICY profile_update_identity_boundary ON public.profiles AS RESTRICTIVE
  FOR UPDATE TO authenticated USING (id=(SELECT auth.uid()))
  WITH CHECK (id=(SELECT auth.uid()));
REVOKE ALL ON public.user_roles FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
CREATE POLICY own_role_read ON public.user_roles FOR SELECT TO authenticated
  USING (user_id=(SELECT auth.uid()));
COMMIT;
