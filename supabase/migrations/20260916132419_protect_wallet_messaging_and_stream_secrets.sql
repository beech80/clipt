BEGIN;
SET LOCAL lock_timeout = '5s';

-- Wallet balances and paid entitlements are backend-owned, never profile edits.
REVOKE ALL ON public.user_profiles FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.user_profiles TO authenticated;
GRANT ALL ON public.user_profiles TO service_role;
CREATE POLICY wallet_owner_boundary ON public.user_profiles AS RESTRICTIVE
  FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));

REVOKE ALL ON public.messages FROM PUBLIC, anon, authenticated;
GRANT SELECT, DELETE ON public.messages TO authenticated;
GRANT INSERT (sender_id, receiver_id, content, message_type, metadata, reply_to)
  ON public.messages TO authenticated;
GRANT UPDATE (read) ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;
CREATE POLICY message_read_boundary ON public.messages AS RESTRICTIVE
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) IN (sender_id, receiver_id));
CREATE POLICY message_send_boundary ON public.messages AS RESTRICTIVE
  FOR INSERT TO authenticated WITH CHECK (
    sender_id = (SELECT auth.uid()) AND receiver_id IS NOT NULL
    AND NOT clipt_private.blocked_with(receiver_id));
CREATE POLICY message_receipt_boundary ON public.messages AS RESTRICTIVE
  FOR UPDATE TO authenticated USING (receiver_id = (SELECT auth.uid()))
  WITH CHECK (receiver_id = (SELECT auth.uid()));
CREATE POLICY message_delete_boundary ON public.messages AS RESTRICTIVE
  FOR DELETE TO authenticated USING (sender_id = (SELECT auth.uid()));

-- Notification identity/content must come from trusted server-side events.
REVOKE ALL ON public.notifications FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.notifications TO authenticated;
GRANT UPDATE (read) ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
CREATE POLICY notification_owner_read_boundary ON public.notifications AS RESTRICTIVE
  FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));
CREATE POLICY notification_owner_receipt_boundary ON public.notifications AS RESTRICTIVE
  FOR UPDATE TO authenticated USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- Explicit public projection: adding a future secret column cannot expose it.
REVOKE ALL ON public.streams FROM PUBLIC, anon, authenticated;
GRANT SELECT (id, user_id, title, description, thumbnail_url, is_live,
  viewer_count, started_at, ended_at, created_at, chat_enabled,
  health_status, current_bitrate, current_fps, available_qualities,
  stream_resolution, scheduled_start_time, scheduled_duration, schedule_status,
  recurring_schedule, vod_enabled, vod_processing_status, playback_url,
  max_bitrate, supported_codecs, stream_latency_ms, hls_playback_url,
  stream_health_status, last_health_check, dvr_enabled, dvr_window_seconds,
  cdn_url, recommendation_score, abr_active, low_latency_active,
  current_quality_preset)
  ON public.streams TO anon, authenticated;
GRANT INSERT (user_id, title, description, thumbnail_url, chat_enabled,
  scheduled_start_time, scheduled_duration, recurring_schedule, vod_enabled)
  ON public.streams TO authenticated;
GRANT UPDATE (title, description, thumbnail_url, chat_enabled,
  scheduled_start_time, scheduled_duration, recurring_schedule, vod_enabled)
  ON public.streams TO authenticated;
GRANT DELETE ON public.streams TO authenticated;
GRANT ALL ON public.streams TO service_role;
CREATE POLICY stream_create_owner_boundary ON public.streams AS RESTRICTIVE
  FOR INSERT TO authenticated WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY stream_update_owner_boundary ON public.streams AS RESTRICTIVE
  FOR UPDATE TO authenticated USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY stream_delete_owner_boundary ON public.streams AS RESTRICTIVE
  FOR DELETE TO authenticated USING (user_id = (SELECT auth.uid()));
COMMIT;
