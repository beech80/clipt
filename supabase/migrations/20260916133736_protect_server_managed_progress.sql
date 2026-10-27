BEGIN;
REVOKE ALL ON public.achievement_progress, public.channel_points,
  public.creator_analytics, public.user_challenges, public.user_levels,
  public.user_points, public.stream_viewer_sessions FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.achievement_progress, public.channel_points,
  public.creator_analytics, public.user_challenges, public.user_levels,
  public.user_points, public.stream_viewer_sessions TO service_role;
GRANT SELECT ON public.user_levels, public.user_points TO anon, authenticated;
GRANT SELECT ON public.achievement_progress, public.channel_points,
  public.creator_analytics, public.user_challenges TO authenticated;
DO $migration$
DECLARE table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY['achievement_progress','channel_points','creator_analytics','user_challenges'] LOOP
    EXECUTE format('CREATE POLICY server_progress_owner_boundary ON public.%I AS RESTRICTIVE FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()))',table_name);
  END LOOP;
END $migration$;
-- XP is awarded for verified server events, not arbitrary client-supplied amounts.
REVOKE EXECUTE ON FUNCTION public.award_user_xp(uuid,integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.award_user_xp(uuid,integer) TO service_role;
COMMIT;
