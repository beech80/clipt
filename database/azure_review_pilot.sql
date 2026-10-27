-- STAGED development-only review quota contract; do not apply to production.
BEGIN;
CREATE TABLE clipt_private.azure_review_budget (
 budget_key text PRIMARY KEY, operations integer NOT NULL CHECK(operations>=0)
);
ALTER TABLE clipt_private.azure_review_budget ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON clipt_private.azure_review_budget FROM PUBLIC,anon,authenticated;
CREATE TABLE clipt_private.azure_review_jobs (
 id uuid PRIMARY KEY, user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
 post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 operations integer NOT NULL CHECK(operations BETWEEN 1 AND 2),
 source_hash text NOT NULL,
 state text NOT NULL DEFAULT 'pending' CHECK(state IN ('pending','needs_review','no_flag_detected','failed')),
 UNIQUE(user_id,post_id)
);
ALTER TABLE clipt_private.azure_review_jobs ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON clipt_private.azure_review_jobs FROM PUBLIC,anon,authenticated;

-- Only fields that define the authorized scan snapshot belong in this hash.
-- Engagement counters/timestamps may change without changing external content.
CREATE FUNCTION clipt_private.azure_review_snapshot_hash(p_source jsonb)
RETURNS text LANGUAGE sql IMMUTABLE SET search_path='' AS $$
 SELECT pg_catalog.md5(pg_catalog.jsonb_build_array(
  p_source->'id',p_source->'user_id',p_source->'content',p_source->'image_url',p_source->'video_url',
  p_source->'is_published',p_source->'is_premium',p_source->'is_subscriber_only',
  p_source->'required_tier_id',p_source->'moderation_hidden',p_source->'post_type',
  p_source->'scheduled_publish_time')::text)
$$;
REVOKE ALL ON FUNCTION clipt_private.azure_review_snapshot_hash(jsonb) FROM PUBLIC,anon,authenticated;
CREATE INDEX azure_review_pending_post ON clipt_private.azure_review_jobs(post_id) WHERE state='pending';

CREATE FUNCTION public.reserve_azure_review(p_user uuid,p_post uuid,p_request uuid,p_operations integer)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path='' SET timezone='UTC' AS $$
DECLARE current_day timestamptz:=date_trunc('day',clock_timestamp() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC';
 current_month timestamptz:=date_trunc('month',clock_timestamp() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC';
 used integer; counter_key text; ceiling integer; counter integer; source jsonb;
BEGIN
 IF p_operations IS NULL OR p_operations NOT BETWEEN 1 AND 2 THEN RAISE EXCEPTION 'Invalid operation count'; END IF;
 -- Serializes cross-user quota reservations; failures also consume budget.
 PERFORM pg_catalog.pg_advisory_xact_lock(57421,101);
 -- Serialize reservation against profile/account deletion before locking posts.
 PERFORM 1 FROM public.profiles WHERE id=p_user FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Account unavailable' USING ERRCODE='42501'; END IF;
 SELECT to_jsonb(p) INTO source FROM public.posts p WHERE id=p_post FOR UPDATE;
 IF EXISTS(SELECT 1 FROM clipt_private.azure_review_jobs WHERE id=p_request OR (user_id=p_user AND post_id=p_post)) THEN RETURN false; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.posts WHERE id=p_post AND user_id=p_user
   AND is_published IS TRUE AND is_premium IS FALSE AND is_subscriber_only IS FALSE
   AND required_tier_id IS NULL AND moderation_hidden IS FALSE AND post_type IN ('clipt','regular','photo')
   AND image_url IS NOT NULL AND image_url<>'' AND video_url IS NULL
   AND (scheduled_publish_time IS NULL OR scheduled_publish_time<=clock_timestamp())) THEN
   RAISE EXCEPTION 'Public owned photo required' USING ERRCODE='42501';
 END IF;
 -- Counters deliberately do not cascade with posts: deletion cannot refund quota.
 FOR counter IN 1..3 LOOP
  counter_key:=CASE counter WHEN 1 THEN 'day:'||current_day::text
    WHEN 2 THEN 'month:'||current_month::text
    ELSE 'actor:'||pg_catalog.md5(p_user::text)||':'||current_day::text END;
  ceiling:=CASE counter WHEN 1 THEN 100 WHEN 2 THEN 1000 ELSE 10 END;
  INSERT INTO clipt_private.azure_review_budget(budget_key,operations) VALUES(counter_key,p_operations)
   ON CONFLICT(budget_key) DO UPDATE SET operations=azure_review_budget.operations+excluded.operations
   RETURNING operations INTO used;
  IF used>ceiling THEN RAISE EXCEPTION 'Review pilot quota reached' USING ERRCODE='P0001'; END IF;
 END LOOP;
 INSERT INTO clipt_private.azure_review_jobs(id,user_id,post_id,operations,source_hash)
 VALUES(p_request,p_user,p_post,p_operations,clipt_private.azure_review_snapshot_hash(source));
 RETURN true;
END $$;
REVOKE ALL ON FUNCTION public.reserve_azure_review(uuid,uuid,uuid,integer) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_azure_review(uuid,uuid,uuid,integer) TO service_role;

-- A pending scan keeps its public snapshot stable. No automatic expiry: a
-- crashed worker must be reconciled as failed before releasing the snapshot.
CREATE FUNCTION clipt_private.guard_azure_review_post() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF TG_OP='UPDATE' AND clipt_private.azure_review_snapshot_hash(to_jsonb(OLD))=
  clipt_private.azure_review_snapshot_hash(to_jsonb(NEW)) THEN RETURN NEW; END IF;
 IF EXISTS(SELECT 1 FROM clipt_private.azure_review_jobs WHERE post_id=OLD.id AND state='pending') THEN
  RAISE EXCEPTION 'Photo review in progress; please retry shortly' USING ERRCODE='55000';
 END IF;
 IF TG_OP='DELETE' THEN RETURN OLD; END IF; RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION clipt_private.guard_azure_review_post() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER azure_review_snapshot_guard BEFORE UPDATE OR DELETE ON public.posts
 FOR EACH ROW EXECUTE FUNCTION clipt_private.guard_azure_review_post();

-- Private-schema cascades are outside the public erasure inventory. Never let
-- a profile cascade discard an active worker's privacy guard first.
CREATE FUNCTION clipt_private.guard_azure_review_profile() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF EXISTS(SELECT 1 FROM clipt_private.azure_review_jobs WHERE user_id=OLD.id AND state='pending') THEN
  RAISE EXCEPTION 'Photo review in progress; please retry shortly' USING ERRCODE='55000';
 END IF;
 DELETE FROM clipt_private.azure_review_budget
  WHERE budget_key LIKE 'actor:'||pg_catalog.md5(OLD.id::text)||':%';
 -- Global day/month accounting remains intact; account erasure is not a refund.
 RETURN OLD;
END $$;
REVOKE ALL ON FUNCTION clipt_private.guard_azure_review_profile() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER azure_review_profile_guard BEFORE DELETE ON public.profiles
 FOR EACH ROW EXECUTE FUNCTION clipt_private.guard_azure_review_profile();

CREATE FUNCTION clipt_private.guard_azure_review_storage() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF EXISTS(SELECT 1 FROM clipt_private.azure_review_jobs j JOIN public.posts p ON p.id=j.post_id
  WHERE j.state='pending' AND (right(p.image_url,length('/object/public/'||OLD.bucket_id||'/'||OLD.name))='/object/public/'||OLD.bucket_id||'/'||OLD.name
   OR right(p.image_url,length('/object/authenticated/'||OLD.bucket_id||'/'||OLD.name))='/object/authenticated/'||OLD.bucket_id||'/'||OLD.name)) THEN
  RAISE EXCEPTION 'Photo review in progress; please retry shortly' USING ERRCODE='55000';
 END IF;
 IF TG_OP='DELETE' THEN RETURN OLD; END IF; RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION clipt_private.guard_azure_review_storage() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER azure_review_storage_guard BEFORE UPDATE OR DELETE ON storage.objects
 FOR EACH ROW EXECUTE FUNCTION clipt_private.guard_azure_review_storage();

CREATE FUNCTION public.finish_azure_review(p_user uuid,p_request uuid,p_state text) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE job clipt_private.azure_review_jobs%rowtype;
BEGIN
 IF p_state NOT IN ('failed','needs_review','no_flag_detected') THEN RAISE EXCEPTION 'Invalid review state'; END IF;
 SELECT * INTO job FROM clipt_private.azure_review_jobs WHERE id=p_request AND user_id=p_user FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Review ownership mismatch' USING ERRCODE='42501'; END IF;
 IF job.state<>'pending' THEN RETURN false; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.posts p WHERE p.id=job.post_id AND clipt_private.azure_review_snapshot_hash(to_jsonb(p))=job.source_hash) THEN
  p_state:='failed';
 END IF;
 UPDATE clipt_private.azure_review_jobs SET state=p_state WHERE id=p_request;
 RETURN true;
END $$;
REVOKE ALL ON FUNCTION public.finish_azure_review(uuid,uuid,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.finish_azure_review(uuid,uuid,text) TO service_role;

CREATE FUNCTION clipt_private.azure_photo_review_queue() RETURNS TABLE(id uuid,post_id uuid,state text,created_at timestamptz)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF NOT clipt_private.account_available() OR NOT EXISTS(SELECT 1 FROM public.user_roles
  WHERE user_id=auth.uid() AND role IN ('admin','moderator')) THEN
  RAISE EXCEPTION 'Moderator access required' USING ERRCODE='42501';
 END IF;
 RETURN QUERY SELECT j.id,j.post_id,j.state,j.created_at FROM clipt_private.azure_review_jobs j
  JOIN public.posts p ON p.id=j.post_id
  WHERE j.state IN ('pending','needs_review','failed') AND p.is_published IS TRUE
  AND p.is_premium IS FALSE AND p.is_subscriber_only IS FALSE AND p.required_tier_id IS NULL
  AND p.post_type IN ('clipt','regular','photo') AND p.image_url IS NOT NULL AND p.image_url<>''
  AND p.video_url IS NULL AND p.moderation_hidden IS FALSE
  ORDER BY j.created_at DESC LIMIT 100;
END $$;
REVOKE ALL ON FUNCTION clipt_private.azure_photo_review_queue() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION clipt_private.azure_photo_review_queue() TO authenticated;
CREATE OR REPLACE FUNCTION public.azure_photo_review_queue() RETURNS TABLE(id uuid,post_id uuid,state text,created_at timestamptz)
LANGUAGE sql STABLE SECURITY INVOKER SET search_path='' AS $$
 SELECT * FROM clipt_private.azure_photo_review_queue()
$$;
REVOKE ALL ON FUNCTION public.azure_photo_review_queue() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.azure_photo_review_queue() TO authenticated;
COMMIT;
