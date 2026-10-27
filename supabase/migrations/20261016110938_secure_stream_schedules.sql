-- Development rollout only. Announcements never start OBS, provision a provider,
-- grant LIVE status, or invoke the moderation worker.
CREATE TABLE public.scheduled_streams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL CHECK (char_length(btrim(title)) BETWEEN 3 AND 100),
  description text NOT NULL DEFAULT '' CHECK (char_length(description) <= 500),
  scheduled_start timestamptz NOT NULL,
  duration_minutes integer NOT NULL DEFAULT 60 CHECK (duration_minutes BETWEEN 15 AND 720),
  is_private boolean NOT NULL DEFAULT true,
  tags text NOT NULL DEFAULT '' CHECK (char_length(tags) <= 100),
  game_id uuid REFERENCES public.games(id) ON DELETE SET NULL,
  -- Reserved compatibility fields cannot be populated by client writes.
  thumbnail_url text CHECK (thumbnail_url IS NULL),
  stream_id uuid CHECK (stream_id IS NULL),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, scheduled_start)
);
CREATE INDEX scheduled_streams_upcoming_idx ON public.scheduled_streams (scheduled_start) WHERE NOT is_private;
CREATE INDEX scheduled_streams_game_idx ON public.scheduled_streams (game_id) WHERE game_id IS NOT NULL;
ALTER TABLE public.scheduled_streams ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.scheduled_streams FROM PUBLIC, anon, authenticated;
GRANT SELECT, DELETE ON public.scheduled_streams TO authenticated;
GRANT INSERT (user_id,title,description,scheduled_start,duration_minutes,is_private,tags,game_id)
  ON public.scheduled_streams TO authenticated;
GRANT UPDATE (title,description,scheduled_start,duration_minutes,is_private,tags,game_id)
  ON public.scheduled_streams TO authenticated;

CREATE POLICY schedule_read ON public.scheduled_streams FOR SELECT TO authenticated
  USING ((SELECT clipt_private.account_available()) AND
    (user_id=(SELECT auth.uid()) OR (NOT is_private AND NOT clipt_private.blocked_with(user_id))));
CREATE POLICY schedule_insert ON public.scheduled_streams FOR INSERT TO authenticated
  WITH CHECK ((SELECT clipt_private.account_available()) AND user_id=(SELECT auth.uid()));
CREATE POLICY schedule_update ON public.scheduled_streams FOR UPDATE TO authenticated
  USING ((SELECT clipt_private.account_available()) AND user_id=(SELECT auth.uid()))
  WITH CHECK ((SELECT clipt_private.account_available()) AND user_id=(SELECT auth.uid()));
CREATE POLICY schedule_delete ON public.scheduled_streams FOR DELETE TO authenticated
  USING ((SELECT clipt_private.account_available()) AND user_id=(SELECT auth.uid()));

CREATE FUNCTION clipt_private.validate_stream_schedule() RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
BEGIN
  IF NEW.scheduled_start <= now() OR NEW.scheduled_start > now()+interval '1 year' THEN
    RAISE EXCEPTION USING ERRCODE='22023', MESSAGE='Choose a future start within one year';
  END IF;
  -- Serializes concurrent inserts for this owner; the count is owner-visible
  -- through RLS, never a privileged scan of other accounts.
  PERFORM pg_advisory_xact_lock(hashtextextended(NEW.user_id::text, 816));
  IF TG_OP='INSERT' AND (SELECT count(*) FROM public.scheduled_streams
      WHERE user_id=NEW.user_id AND scheduled_start>now()) >= 50 THEN
    RAISE EXCEPTION USING ERRCODE='54000', MESSAGE='Upcoming schedule limit reached';
  END IF;
  NEW.title := btrim(NEW.title);
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION clipt_private.validate_stream_schedule() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER validate_stream_schedule BEFORE INSERT OR UPDATE ON public.scheduled_streams
  FOR EACH ROW EXECUTE FUNCTION clipt_private.validate_stream_schedule();
