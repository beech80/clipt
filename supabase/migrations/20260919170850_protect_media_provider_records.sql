BEGIN;
-- Provider IDs, upload URLs and status are trusted provider/backend records.
-- Preserve every row; remove browser mutation authority rather than rewriting data.
REVOKE ALL ON public.mux_assets, public.mux_uploads FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.mux_assets, public.mux_uploads TO service_role;
GRANT SELECT ON public.mux_assets TO anon, authenticated;
GRANT SELECT ON public.mux_uploads TO authenticated;
CREATE POLICY mux_asset_parent_visibility ON public.mux_assets AS RESTRICTIVE
  FOR SELECT TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.posts p WHERE p.id = mux_assets.post_id));
CREATE POLICY mux_upload_owner_boundary ON public.mux_uploads AS RESTRICTIVE
  FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));

-- The prior insert policy only required owning any stream; it allowed creator
-- impersonation. Bind the creator and optional stream scope to the same owner.
REVOKE ALL ON public.chat_emotes FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.chat_emotes TO service_role;
GRANT SELECT ON public.chat_emotes TO anon, authenticated;
GRANT INSERT (name, url, created_by, category, permissions, animated)
  ON public.chat_emotes TO authenticated;
GRANT DELETE ON public.chat_emotes TO authenticated;
CREATE POLICY emote_creator_boundary ON public.chat_emotes AS RESTRICTIVE
  FOR INSERT TO authenticated WITH CHECK (
    created_by = (SELECT auth.uid())
    AND char_length(btrim(name)) BETWEEN 1 AND 64
    AND url LIKE 'https://%'
    AND EXISTS (SELECT 1 FROM public.streams s
      WHERE s.user_id = (SELECT auth.uid())
        AND (NOT (coalesce(permissions, '{}'::jsonb) ? 'stream_id')
          OR s.id::text = permissions->>'stream_id'))
  );
CREATE POLICY emote_owner_delete ON public.chat_emotes
  FOR DELETE TO authenticated USING (created_by = (SELECT auth.uid()));
COMMIT;
