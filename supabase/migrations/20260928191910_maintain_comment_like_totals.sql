BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';
-- Serialize the one-time derived-count reconciliation with like writers.
LOCK TABLE public.comment_likes, public.comments IN SHARE ROW EXCLUSIVE MODE;
-- Clients may supply content/identity, never derived counters or event time.
REVOKE INSERT ON public.comments FROM authenticated;
REVOKE INSERT (likes_count, created_at) ON public.comments FROM authenticated;
GRANT INSERT (id, post_id, user_id, content, parent_id) ON public.comments TO authenticated;

CREATE OR REPLACE FUNCTION clipt_private.maintain_comment_like_totals()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $function$
BEGIN
  IF TG_TABLE_SCHEMA <> 'public' OR TG_TABLE_NAME <> 'comment_likes' THEN
    RAISE EXCEPTION 'Invalid trigger target';
  END IF;
  -- This is trigger-only privileged maintenance after the row passed RLS.
  -- Atomic deltas serialize on the comment row; unique(comment_id,user_id)
  -- makes a failed duplicate insert incapable of incrementing the total.
  IF TG_OP = 'DELETE' OR (TG_OP = 'UPDATE' AND OLD.comment_id IS DISTINCT FROM NEW.comment_id) THEN
    UPDATE public.comments SET likes_count = greatest(coalesce(likes_count, 0) - 1, 0)
      WHERE id = OLD.comment_id;
  END IF;
  IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.comment_id IS DISTINCT FROM NEW.comment_id) THEN
    UPDATE public.comments SET likes_count = coalesce(likes_count, 0) + 1
      WHERE id = NEW.comment_id;
  END IF;
  RETURN NULL;
END
$function$;
REVOKE ALL ON FUNCTION clipt_private.maintain_comment_like_totals() FROM PUBLIC, anon, authenticated, service_role;
CREATE TRIGGER clipt_maintain_comment_like_totals
AFTER INSERT OR DELETE OR UPDATE OF comment_id ON public.comment_likes
FOR EACH ROW EXECUTE FUNCTION clipt_private.maintain_comment_like_totals();

-- Repair only derived totals from existing real likes. Preserve every source row.
UPDATE public.comments c SET likes_count = (SELECT count(*)::integer FROM public.comment_likes l WHERE l.comment_id = c.id)
WHERE c.likes_count IS DISTINCT FROM (SELECT count(*)::integer FROM public.comment_likes l WHERE l.comment_id = c.id);
COMMIT;
