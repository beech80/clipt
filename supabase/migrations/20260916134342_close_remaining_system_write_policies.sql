BEGIN;
REVOKE ALL ON public.games,public.chat_message_history,public.post_analytics FROM PUBLIC,anon,authenticated;
GRANT ALL ON public.games,public.chat_message_history,public.post_analytics TO service_role;
GRANT SELECT ON public.games,public.chat_message_history TO anon,authenticated;
GRANT SELECT ON public.post_analytics TO authenticated;
CREATE POLICY public_game_catalog ON public.games FOR SELECT TO anon,authenticated USING(true);
CREATE POLICY visible_chat_history_boundary ON public.chat_message_history AS RESTRICTIVE
  FOR SELECT TO anon,authenticated USING(is_deleted IS NOT TRUE AND NOT clipt_private.blocked_with(user_id));
CREATE POLICY creator_post_analytics_boundary ON public.post_analytics AS RESTRICTIVE
  FOR SELECT TO authenticated USING(EXISTS(SELECT 1 FROM public.posts p
    WHERE p.id=post_id AND p.user_id=(SELECT auth.uid())));

-- This trigger computes aggregates from accepted source rows. It is not a
-- client RPC and accepts no arbitrary increment or target from the browser.
ALTER FUNCTION public.update_post_analytics() SET SCHEMA clipt_private;
ALTER FUNCTION clipt_private.update_post_analytics() SECURITY DEFINER;
REVOKE ALL ON FUNCTION clipt_private.update_post_analytics() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION clipt_private.update_post_analytics() TO service_role;
REVOKE ALL ON FUNCTION public.track_post_analytics(uuid,text,integer) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.track_post_analytics(uuid,text,integer) TO service_role;
COMMIT;
