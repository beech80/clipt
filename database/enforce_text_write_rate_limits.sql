BEGIN;
-- Server-side fixed ceilings; clients cannot choose/reset counters or opt out.
CREATE TABLE clipt_private.text_write_buckets (
  user_id uuid NOT NULL, kind text NOT NULL, window_start timestamptz NOT NULL,
  count integer NOT NULL CHECK(count>0), PRIMARY KEY(user_id,kind)
);
ALTER TABLE clipt_private.text_write_buckets ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON clipt_private.text_write_buckets FROM PUBLIC,anon,authenticated;
CREATE FUNCTION clipt_private.enforce_text_write_rate()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE actor uuid; category text; ceiling integer; total integer; checked_at timestamptz:=clock_timestamp();
BEGIN
  -- Trusted backend jobs retain their existing behavior; never trust payload
  -- user IDs or user-editable metadata to authorize a bypass.
  IF current_setting('role',true)='service_role'
    OR (current_setting('role',true)='none' AND session_user='postgres') THEN RETURN NEW; END IF;
  IF TG_TABLE_NAME IN ('messages','group_messages') THEN actor:=NEW.sender_id;
  ELSE actor:=NEW.user_id; END IF;
  IF actor IS DISTINCT FROM auth.uid() OR actor IS NULL OR NOT clipt_private.account_available()
    THEN RAISE EXCEPTION 'Verified account required' USING ERRCODE='42501'; END IF;
  category:=CASE WHEN TG_TABLE_NAME='posts' THEN 'post' ELSE 'interaction' END;
  ceiling:=CASE WHEN category='post' THEN 5 ELSE 20 END;
  INSERT INTO clipt_private.text_write_buckets(user_id,kind,window_start,count)
    VALUES(actor,category,checked_at,1)
  ON CONFLICT(user_id,kind) DO UPDATE SET
    count=CASE WHEN text_write_buckets.window_start<=checked_at-interval '60 seconds' THEN 1 ELSE text_write_buckets.count+1 END,
    window_start=CASE WHEN text_write_buckets.window_start<=checked_at-interval '60 seconds' THEN checked_at ELSE text_write_buckets.window_start END
  RETURNING count INTO total;
  IF total>ceiling THEN RAISE EXCEPTION 'Too many posts or messages. Try again later.' USING ERRCODE='P0001'; END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION clipt_private.enforce_text_write_rate() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER clipt_write_rate BEFORE INSERT ON public.messages FOR EACH ROW EXECUTE FUNCTION clipt_private.enforce_text_write_rate();
CREATE TRIGGER clipt_write_rate BEFORE INSERT ON public.comments FOR EACH ROW EXECUTE FUNCTION clipt_private.enforce_text_write_rate();
CREATE TRIGGER clipt_write_rate BEFORE INSERT ON public.posts FOR EACH ROW EXECUTE FUNCTION clipt_private.enforce_text_write_rate();
CREATE TRIGGER clipt_write_rate BEFORE INSERT ON public.stream_chat FOR EACH ROW EXECUTE FUNCTION clipt_private.enforce_text_write_rate();
DO $$ BEGIN IF to_regclass('public.group_messages') IS NOT NULL THEN
 EXECUTE 'CREATE TRIGGER clipt_write_rate BEFORE INSERT ON public.group_messages FOR EACH ROW EXECUTE FUNCTION clipt_private.enforce_text_write_rate()';
END IF; END $$;
COMMIT;
