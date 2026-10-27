BEGIN;
-- Staged LOCAL policy: additive write guard, not a semantic moderation model.
-- Does not change existing rows, RLS, ownership, MFA or notification rules.
CREATE OR REPLACE FUNCTION clipt_private.strict_text_content_guard()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE value text; normalized text; old_value text;
BEGIN
  IF TG_TABLE_NAME='stream_chat' THEN
    value:=NEW.message;
    IF TG_OP='UPDATE' THEN old_value:=OLD.message; END IF;
  ELSE
    value:=NEW.content;
    IF TG_OP='UPDATE' THEN old_value:=OLD.content; END IF;
  END IF;
  -- Read receipts/soft deletion of existing messages must still work.
  IF TG_OP='UPDATE' AND value IS NOT DISTINCT FROM old_value THEN RETURN NEW; END IF;
  normalized:=lower(normalize(coalesce(value,''),NFKC));
  normalized:=translate(normalized,'013457@$','oieastas');
  normalized:=regexp_replace(normalized,U&'[\200B-\200D\FEFF]','','g');
  IF normalized ~ '(^|[^a-z])(fuck[a-z]*|shit[a-z]*|bitch[a-z]*|asshole[a-z]*|cunt[a-z]*|nigg(er|a)[a-z]*|kike[s]?|faggot[s]?)([^a-z]|$)'
    OR normalized ~ '(^|[^a-z])(f[^a-z]{0,3}u[^a-z]{0,3}c[^a-z]{0,3}k|s[^a-z]{0,3}h[^a-z]{0,3}i[^a-z]{0,3}t)([^a-z]|$)'
    OR normalized ~ 'white[[:space:]]+supremacy|heil[[:space:]]+hitler'
    OR EXISTS(SELECT 1 FROM (
      SELECT regexp_replace(translate(lower(normalize(f.word,NFKC)),
        '013457@$','oieastas'),U&'[\200B-\200D\FEFF]','','g') AS term
      FROM public.content_filters f WHERE f.action_type='block'
    ) blocked WHERE length(trim(blocked.term))>0
      AND strpos(normalized,blocked.term)>0)
  THEN RAISE EXCEPTION 'Content is not allowed by Clipt community rules' USING ERRCODE='23514';
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION clipt_private.strict_text_content_guard() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER clipt_strict_text BEFORE INSERT OR UPDATE ON public.messages
  FOR EACH ROW EXECUTE FUNCTION clipt_private.strict_text_content_guard();
CREATE TRIGGER clipt_strict_text BEFORE INSERT OR UPDATE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION clipt_private.strict_text_content_guard();
CREATE TRIGGER clipt_strict_text BEFORE INSERT OR UPDATE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION clipt_private.strict_text_content_guard();
CREATE TRIGGER clipt_strict_text BEFORE INSERT OR UPDATE ON public.stream_chat
  FOR EACH ROW EXECUTE FUNCTION clipt_private.strict_text_content_guard();
-- Older development schemas may not have group chat; never create a parallel
-- table or pretend its membership/RLS was verified by this text-only guard.
DO $$ BEGIN
  IF to_regclass('public.group_messages') IS NOT NULL THEN
    EXECUTE 'CREATE TRIGGER clipt_strict_text BEFORE INSERT OR UPDATE ON public.group_messages FOR EACH ROW EXECUTE FUNCTION clipt_private.strict_text_content_guard()';
  END IF;
END $$;
COMMIT;
