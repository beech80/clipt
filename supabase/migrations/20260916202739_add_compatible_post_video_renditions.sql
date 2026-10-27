BEGIN;
CREATE TABLE public.post_video_renditions (
  post_id uuid PRIMARY KEY REFERENCES public.posts(id) ON DELETE CASCADE,
  source_url text NOT NULL,
  playback_url text NOT NULL CHECK (playback_url LIKE 'https://%'),
  codec text NOT NULL CHECK (codec IN ('h264','vp9','av1')),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.post_video_renditions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.post_video_renditions FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.post_video_renditions TO anon,authenticated;
GRANT ALL ON public.post_video_renditions TO service_role;
CREATE POLICY rendition_parent_visibility ON public.post_video_renditions
  FOR SELECT TO anon,authenticated USING(EXISTS(SELECT 1 FROM public.posts p WHERE p.id=post_id));
COMMIT;
