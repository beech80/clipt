BEGIN;
SET LOCAL lock_timeout = '5s';

ALTER TABLE public.accessibility_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.keyboard_shortcuts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comment_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_similarities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.obs_server_status ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.accessibility_settings, public.keyboard_shortcuts,
  public.comment_likes, public.content_scores, public.content_similarities,
  public.obs_server_status FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.accessibility_settings,
  public.keyboard_shortcuts TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.comment_likes TO authenticated;
GRANT ALL ON public.accessibility_settings, public.keyboard_shortcuts,
  public.comment_likes, public.content_scores, public.content_similarities,
  public.obs_server_status TO service_role;

CREATE POLICY clipt_accessibility_owner ON public.accessibility_settings
  FOR ALL TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY clipt_shortcut_owner ON public.keyboard_shortcuts
  FOR ALL TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY clipt_comment_like_read_own ON public.comment_likes
  FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));
CREATE POLICY clipt_comment_like_delete_own ON public.comment_likes
  FOR DELETE TO authenticated USING (user_id = (SELECT auth.uid()));
CREATE POLICY clipt_comment_like_insert_own ON public.comment_likes
  FOR INSERT TO authenticated WITH CHECK (
    user_id = (SELECT auth.uid()) AND EXISTS (
      SELECT 1 FROM public.comments c JOIN public.posts p ON p.id = c.post_id
      WHERE c.id = comment_id AND (
        p.user_id = (SELECT auth.uid()) OR
        (p.is_published IS TRUE AND p.is_subscriber_only IS NOT TRUE)
      )
    )
  );
-- No client policies on internal scoring/infrastructure tables: service-role only.
COMMIT;
