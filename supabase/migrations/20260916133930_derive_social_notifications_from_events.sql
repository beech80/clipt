BEGIN;
CREATE POLICY follow_identity_block_boundary ON public.follows AS RESTRICTIVE
  FOR INSERT TO authenticated WITH CHECK (follower_id=(SELECT auth.uid())
    AND following_id<>follower_id AND NOT clipt_private.blocked_with(following_id));
CREATE POLICY like_visible_post_boundary ON public.likes AS RESTRICTIVE
  FOR INSERT TO authenticated WITH CHECK (user_id=(SELECT auth.uid())
    AND EXISTS(SELECT 1 FROM public.posts p WHERE p.id=post_id));

-- Trigger-only privilege: recipients and actors come from accepted source rows,
-- never from a notification payload supplied by the browser.
CREATE FUNCTION clipt_private.notify_social_event()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE actor uuid; recipient uuid; resource uuid; kind public.notification_type;
  resource_kind text;
BEGIN
  IF TG_TABLE_NAME='follows' THEN
    actor:=NEW.follower_id; recipient:=NEW.following_id;
    kind:='follow'; resource:=actor; resource_kind:='profile';
  ELSIF TG_TABLE_NAME='likes' THEN
    actor:=NEW.user_id;
    SELECT user_id INTO recipient FROM public.posts WHERE id=NEW.post_id;
    kind:='like'; resource:=NEW.post_id; resource_kind:='post';
  ELSIF TG_TABLE_NAME='comments' THEN
    actor:=NEW.user_id; resource:=NEW.post_id; resource_kind:='post';
    IF NEW.parent_id IS NOT NULL THEN
      SELECT user_id INTO recipient FROM public.comments WHERE id=NEW.parent_id AND post_id=NEW.post_id;
      kind:='reply';
    ELSE
      SELECT user_id INTO recipient FROM public.posts WHERE id=NEW.post_id;
      kind:='comment';
    END IF;
  ELSE RAISE EXCEPTION 'Unsupported notification source';
  END IF;
  IF actor IS NOT NULL AND recipient IS NOT NULL AND actor<>recipient
    AND NOT EXISTS(SELECT 1 FROM public.user_blocks
      WHERE (blocker_id=actor AND blocked_id=recipient) OR (blocker_id=recipient AND blocked_id=actor)) THEN
    INSERT INTO public.notifications(user_id,actor_id,type,resource_id,resource_type)
      VALUES(recipient,actor,kind,resource,resource_kind);
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION clipt_private.notify_social_event() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION clipt_private.notify_social_event() TO service_role;
CREATE TRIGGER clipt_notify_follow AFTER INSERT ON public.follows
  FOR EACH ROW EXECUTE FUNCTION clipt_private.notify_social_event();
CREATE TRIGGER clipt_notify_like AFTER INSERT ON public.likes
  FOR EACH ROW EXECUTE FUNCTION clipt_private.notify_social_event();
CREATE TRIGGER clipt_notify_comment AFTER INSERT ON public.comments
  FOR EACH ROW EXECUTE FUNCTION clipt_private.notify_social_event();
COMMIT;
