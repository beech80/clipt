-- Production Azure photo/caption review. Installs disabled; never scans videos.
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
 operations integer NOT NULL CHECK(operations BETWEEN 1 AND 11),
 source_hash text NOT NULL,
 state text NOT NULL DEFAULT 'pending' CHECK(state IN ('pending','needs_review','no_flag_detected','failed')),
 UNIQUE(user_id,post_id)
);
ALTER TABLE clipt_private.azure_review_jobs ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON clipt_private.azure_review_jobs FROM PUBLIC,anon,authenticated;

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
 IF p_operations IS NULL OR p_operations NOT BETWEEN 1 AND 11 THEN RAISE EXCEPTION 'Invalid operation count'; END IF;
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

CREATE TABLE clipt_private.azure_photo_quarantines (
 job_id uuid PRIMARY KEY REFERENCES clipt_private.azure_review_jobs(id) ON DELETE CASCADE,
 post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
 quarantined_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
ALTER TABLE clipt_private.azure_photo_quarantines ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON clipt_private.azure_photo_quarantines FROM PUBLIC,anon,authenticated;

CREATE FUNCTION clipt_private.finish_azure_review_with_quarantine(p_user uuid,p_request uuid,p_state text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE job clipt_private.azure_review_jobs%rowtype; target public.posts%rowtype; applied boolean;
BEGIN
 -- Follow the existing profile -> post -> job lock order, including deletion.
 SELECT * INTO job FROM clipt_private.azure_review_jobs WHERE id=p_request AND user_id=p_user;
 IF NOT FOUND THEN RAISE EXCEPTION 'Review ownership mismatch' USING ERRCODE='42501'; END IF;
 PERFORM 1 FROM public.profiles WHERE id=p_user FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Account unavailable' USING ERRCODE='42501'; END IF;
 SELECT * INTO target FROM public.posts WHERE id=job.post_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Photo unavailable' USING ERRCODE='42501'; END IF;
 applied:=public.finish_azure_review(p_user,p_request,p_state);
 IF applied IS NOT TRUE THEN RETURN false; END IF;
 -- Re-read actual committed outcome: stale snapshots become failed, never flagged.
 SELECT * INTO job FROM clipt_private.azure_review_jobs WHERE id=p_request FOR UPDATE;
 IF job.state NOT IN ('needs_review','failed') THEN RETURN true; END IF;
 IF target.user_id<>p_user OR target.is_published IS NOT TRUE
  OR target.is_premium IS NOT FALSE OR target.is_subscriber_only IS NOT FALSE
  OR target.required_tier_id IS NOT NULL OR target.moderation_hidden IS NOT FALSE
  OR target.post_type NOT IN ('clipt','regular','photo')
  OR target.image_url IS NULL OR target.image_url='' OR target.video_url IS NOT NULL
  OR (target.scheduled_publish_time IS NOT NULL AND target.scheduled_publish_time>clock_timestamp())
  OR clipt_private.azure_review_snapshot_hash(to_jsonb(target))<>job.source_hash THEN
  RAISE EXCEPTION 'Public scan snapshot changed' USING ERRCODE='42501';
 END IF;
 INSERT INTO clipt_private.azure_photo_quarantines(job_id,post_id) VALUES(p_request,job.post_id);
 UPDATE public.posts SET moderation_hidden=true WHERE id=job.post_id;
 RETURN true;
END $$;
REVOKE ALL ON FUNCTION clipt_private.finish_azure_review_with_quarantine(uuid,uuid,text) FROM PUBLIC,anon,authenticated;
GRANT USAGE ON SCHEMA clipt_private TO service_role;
GRANT EXECUTE ON FUNCTION clipt_private.finish_azure_review_with_quarantine(uuid,uuid,text) TO service_role;
CREATE FUNCTION public.finish_azure_review_with_quarantine(p_user uuid,p_request uuid,p_state text)
RETURNS boolean LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$
 SELECT clipt_private.finish_azure_review_with_quarantine(p_user,p_request,p_state)
$$;
REVOKE ALL ON FUNCTION public.finish_azure_review_with_quarantine(uuid,uuid,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.finish_azure_review_with_quarantine(uuid,uuid,text) TO service_role;

CREATE TABLE clipt_private.azure_dispatch_settings (
 singleton boolean PRIMARY KEY DEFAULT true CHECK(singleton),enabled boolean NOT NULL DEFAULT false
);
INSERT INTO clipt_private.azure_dispatch_settings DEFAULT VALUES;
CREATE TABLE clipt_private.azure_review_dispatch (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
 user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,source_hash text NOT NULL,
 state text NOT NULL DEFAULT 'queued' CHECK(state IN ('queued','processing','completed','failed')),
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(),claimed_at timestamptz,
 UNIQUE(post_id,source_hash)
);
CREATE INDEX azure_review_dispatch_waiting ON clipt_private.azure_review_dispatch(created_at,id) WHERE state='queued';
ALTER TABLE clipt_private.azure_dispatch_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE clipt_private.azure_review_dispatch ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON clipt_private.azure_dispatch_settings,clipt_private.azure_review_dispatch FROM PUBLIC,anon,authenticated;

DO $$DECLARE definition text; old_condition text:='(user_id=p_user AND post_id=p_post)'; BEGIN
 definition:=pg_get_functiondef('public.reserve_azure_review(uuid,uuid,uuid,integer)'::regprocedure);
 IF position(old_condition IN definition)=0 THEN RAISE EXCEPTION 'Review reservation requires manual reconciliation'; END IF;
 ALTER TABLE clipt_private.azure_review_jobs DROP CONSTRAINT azure_review_jobs_user_id_post_id_key;
 ALTER TABLE clipt_private.azure_review_jobs ADD CONSTRAINT azure_review_jobs_content_version UNIQUE(user_id,post_id,source_hash);
 EXECUTE replace(definition,old_condition,'(user_id=p_user AND post_id=p_post AND source_hash=clipt_private.azure_review_snapshot_hash(source))');
END $$;

CREATE FUNCTION clipt_private.enqueue_public_photo_review() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF EXISTS(SELECT 1 FROM clipt_private.azure_dispatch_settings WHERE enabled)
  AND NEW.is_published IS TRUE AND NEW.is_premium IS FALSE AND NEW.is_subscriber_only IS FALSE
  AND NEW.required_tier_id IS NULL AND NEW.moderation_hidden IS FALSE
  AND NEW.post_type IN ('clipt','regular','photo') AND NEW.image_url IS NOT NULL AND NEW.image_url<>''
  AND NEW.video_url IS NULL THEN
  -- Match the existing one-operation caption bound, including UTF-16 pairs.
  IF (SELECT coalesce(sum(CASE WHEN ascii(unit)>65535 THEN 2 ELSE 1 END),0)
   FROM regexp_split_to_table(coalesce(NEW.content,''),'') AS chars(unit))>500 THEN
   RAISE EXCEPTION 'Public photo captions and hashtags must be at most 500 characters' USING ERRCODE='22023'; END IF;
  INSERT INTO clipt_private.azure_review_dispatch(post_id,user_id,source_hash)
   VALUES(NEW.id,NEW.user_id,clipt_private.azure_review_snapshot_hash(to_jsonb(NEW))) ON CONFLICT DO NOTHING;
 END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION clipt_private.enqueue_public_photo_review() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER azure_enqueue_public_photo AFTER INSERT OR UPDATE ON public.posts
 FOR EACH ROW EXECUTE FUNCTION clipt_private.enqueue_public_photo_review();

CREATE FUNCTION clipt_private.photo_review_held(p_post uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT EXISTS(SELECT 1 FROM clipt_private.azure_review_dispatch d JOIN public.posts p ON p.id=d.post_id
  WHERE d.post_id=p_post AND d.state<>'completed' AND d.source_hash=clipt_private.azure_review_snapshot_hash(to_jsonb(p)))
$$;
REVOKE ALL ON FUNCTION clipt_private.photo_review_held(uuid) FROM PUBLIC;
GRANT USAGE ON SCHEMA clipt_private TO anon,authenticated;
GRANT EXECUTE ON FUNCTION clipt_private.photo_review_held(uuid) TO anon,authenticated;
CREATE POLICY clipt_photo_review_hold ON public.posts AS RESTRICTIVE FOR SELECT TO anon,authenticated
 USING(user_id=(SELECT auth.uid()) OR NOT clipt_private.photo_review_held(id));

CREATE FUNCTION clipt_private.my_photo_review_holds()
RETURNS TABLE(post_id uuid,state text,created_at timestamptz)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF auth.uid() IS NULL OR NOT clipt_private.account_available() THEN
  RAISE EXCEPTION 'Authenticated account required' USING ERRCODE='42501'; END IF;
 RETURN QUERY SELECT d.post_id,d.state,d.created_at FROM clipt_private.azure_review_dispatch d
 JOIN public.posts p ON p.id=d.post_id WHERE d.user_id=auth.uid() AND d.state<>'completed'
 AND d.source_hash=clipt_private.azure_review_snapshot_hash(to_jsonb(p)) ORDER BY d.created_at DESC LIMIT 100;
END $$;
CREATE FUNCTION public.my_photo_review_holds() RETURNS TABLE(post_id uuid,state text,created_at timestamptz)
LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$SELECT * FROM clipt_private.my_photo_review_holds()$$;
REVOKE ALL ON FUNCTION clipt_private.my_photo_review_holds(),public.my_photo_review_holds() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION clipt_private.my_photo_review_holds(),public.my_photo_review_holds() TO authenticated;

CREATE FUNCTION clipt_private.claim_public_photo_review()
RETURNS TABLE(request_id uuid,post_id uuid,user_id uuid,reserved boolean) LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE target clipt_private.azure_review_dispatch%rowtype; source jsonb;
BEGIN
 IF NOT EXISTS(SELECT 1 FROM clipt_private.azure_dispatch_settings WHERE enabled) THEN RETURN; END IF;
 -- Same global quota -> profile -> post -> job ordering as reservation.
 PERFORM pg_catalog.pg_advisory_xact_lock(57421,101);
 -- Obsolete versions cannot release the current version's hold or get scanned.
 UPDATE clipt_private.azure_review_dispatch d SET state='completed' FROM public.posts p
  WHERE d.post_id=p.id AND d.state='queued' AND d.source_hash<>clipt_private.azure_review_snapshot_hash(to_jsonb(p));
 SELECT d.* INTO target FROM clipt_private.azure_review_dispatch d JOIN public.posts p ON p.id=d.post_id WHERE d.state='queued'
  AND (p.scheduled_publish_time IS NULL OR p.scheduled_publish_time<=clock_timestamp())
  ORDER BY d.created_at,d.id LIMIT 1;
 IF NOT FOUND THEN RETURN; END IF;
 PERFORM 1 FROM public.profiles WHERE id=target.user_id FOR UPDATE;
 IF NOT FOUND THEN RETURN; END IF;
 SELECT to_jsonb(p) INTO source FROM public.posts p WHERE p.id=target.post_id FOR UPDATE;
 PERFORM 1 FROM clipt_private.azure_review_dispatch d WHERE d.id=target.id AND d.state='queued' FOR UPDATE SKIP LOCKED;
 IF NOT FOUND THEN RETURN; END IF;
 IF source IS NULL OR target.source_hash<>clipt_private.azure_review_snapshot_hash(source) THEN
  UPDATE clipt_private.azure_review_dispatch SET state='completed' WHERE id=target.id; RETURN; END IF;
 -- Reserve and lock the source before returning a claim: an owner cannot edit
 -- between claim and provider dispatch. Ambiguous existing reservations stay held.
 IF public.reserve_azure_review(target.user_id,target.post_id,target.id,least(11,coalesce(array_length(regexp_split_to_array(source->>'image_url',',\s*(?=https?://)','i'),1),1)+CASE WHEN coalesce(source->>'content','')<>'' THEN 1 ELSE 0 END)) IS NOT TRUE THEN
  UPDATE clipt_private.azure_review_dispatch SET state='failed' WHERE id=target.id; RETURN; END IF;
 RETURN QUERY UPDATE clipt_private.azure_review_dispatch d SET state='processing',claimed_at=clock_timestamp()
  WHERE d.id=target.id RETURNING d.id,d.post_id,d.user_id,true;
END $$;
CREATE FUNCTION public.claim_public_photo_review()
RETURNS TABLE(request_id uuid,post_id uuid,user_id uuid,reserved boolean) LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$
 SELECT * FROM clipt_private.claim_public_photo_review()
$$;
CREATE FUNCTION clipt_private.finish_public_photo_dispatch(p_request uuid,p_success boolean) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF p_success IS NULL THEN RAISE EXCEPTION 'Outcome required'; END IF;
 IF p_success AND NOT EXISTS(SELECT 1 FROM clipt_private.azure_review_jobs j JOIN clipt_private.azure_review_dispatch d
  ON d.id=j.id AND d.post_id=j.post_id AND d.user_id=j.user_id AND d.source_hash=j.source_hash
  WHERE d.id=p_request AND j.state IN ('needs_review','no_flag_detected')) THEN
  RAISE EXCEPTION 'Completed review proof required' USING ERRCODE='42501'; END IF;
 UPDATE clipt_private.azure_review_dispatch SET state=CASE WHEN p_success THEN 'completed' ELSE 'failed' END
 WHERE id=p_request AND state='processing';
 RETURN FOUND;
END $$;
CREATE FUNCTION public.finish_public_photo_dispatch(p_request uuid,p_success boolean) RETURNS boolean
LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$SELECT clipt_private.finish_public_photo_dispatch(p_request,p_success)$$;
REVOKE ALL ON FUNCTION clipt_private.claim_public_photo_review(),public.claim_public_photo_review(),
 clipt_private.finish_public_photo_dispatch(uuid,boolean),public.finish_public_photo_dispatch(uuid,boolean) FROM PUBLIC,anon,authenticated;
GRANT USAGE ON SCHEMA clipt_private TO service_role;
GRANT EXECUTE ON FUNCTION clipt_private.claim_public_photo_review(),public.claim_public_photo_review(),
 clipt_private.finish_public_photo_dispatch(uuid,boolean),public.finish_public_photo_dispatch(uuid,boolean) TO service_role;

CREATE FUNCTION clipt_private.enqueue_existing_photo_reviews(p_limit integer DEFAULT 10) RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE candidate record; target public.posts%rowtype; total integer:=0; added integer;
BEGIN
 IF p_limit IS NULL OR p_limit<1 OR p_limit>10 THEN RAISE EXCEPTION 'Batch limit must be between 1 and 10'; END IF;
 IF NOT EXISTS(SELECT 1 FROM clipt_private.azure_dispatch_settings WHERE enabled) THEN RETURN 0; END IF;
 FOR candidate IN SELECT p.id,p.user_id FROM public.posts p
  WHERE p.is_published IS TRUE AND p.moderation_hidden IS FALSE AND p.video_url IS NULL
  AND p.image_url IS NOT NULL AND p.image_url<>'' AND p.is_premium IS FALSE AND p.is_subscriber_only IS FALSE
  AND p.required_tier_id IS NULL AND p.post_type IN ('clipt','regular','photo')
  AND (p.scheduled_publish_time IS NULL OR p.scheduled_publish_time<=clock_timestamp())
  AND NOT EXISTS(SELECT 1 FROM clipt_private.azure_review_dispatch d WHERE d.post_id=p.id
   AND d.source_hash=clipt_private.azure_review_snapshot_hash(to_jsonb(p))) ORDER BY p.user_id,p.id LIMIT p_limit
 LOOP
  PERFORM 1 FROM public.profiles WHERE id=candidate.user_id FOR UPDATE;
  IF NOT FOUND THEN CONTINUE; END IF;
  SELECT * INTO target FROM public.posts WHERE id=candidate.id FOR UPDATE;
  IF NOT FOUND OR target.is_published IS NOT TRUE OR target.moderation_hidden IS NOT FALSE
   OR target.video_url IS NOT NULL OR target.image_url IS NULL OR target.image_url=''
   OR target.is_premium IS NOT FALSE OR target.is_subscriber_only IS NOT FALSE
   OR target.required_tier_id IS NOT NULL OR target.post_type NOT IN ('clipt','regular','photo')
   OR (target.scheduled_publish_time IS NOT NULL AND target.scheduled_publish_time>clock_timestamp()) THEN CONTINUE; END IF;
  INSERT INTO clipt_private.azure_review_dispatch(post_id,user_id,source_hash)
   VALUES(target.id,target.user_id,clipt_private.azure_review_snapshot_hash(to_jsonb(target))) ON CONFLICT DO NOTHING;
  GET DIAGNOSTICS added=ROW_COUNT;total:=total+added;
 END LOOP;
 RETURN total;
END $$;
CREATE FUNCTION public.enqueue_existing_photo_reviews(p_limit integer DEFAULT 10) RETURNS integer
LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$SELECT clipt_private.enqueue_existing_photo_reviews(p_limit)$$;
REVOKE ALL ON FUNCTION clipt_private.enqueue_existing_photo_reviews(integer),public.enqueue_existing_photo_reviews(integer) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION clipt_private.enqueue_existing_photo_reviews(integer),public.enqueue_existing_photo_reviews(integer) TO service_role;

CREATE FUNCTION clipt_private.protect_reviewed_photo_bytes() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF NEW.bucket_id IN ('media','posts') AND EXISTS(
  SELECT 1 FROM public.posts p WHERE p.user_id::text=split_part(NEW.name,'/',1) AND p.video_url IS NULL AND p.image_url IN (
   'https://slnjliheyiiummxhrgmk.supabase.co/storage/v1/object/public/'||NEW.bucket_id||'/'||NEW.name,
   'https://slnjliheyiiummxhrgmk.supabase.co/storage/v1/object/authenticated/'||NEW.bucket_id||'/'||NEW.name)
  AND (EXISTS(SELECT 1 FROM clipt_private.azure_review_dispatch d WHERE d.post_id=p.id)
   OR EXISTS(SELECT 1 FROM clipt_private.azure_photo_quarantines q WHERE q.post_id=p.id))) THEN
  RAISE EXCEPTION 'Reviewed photo media is immutable; upload a new file' USING ERRCODE='55000';
 END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION clipt_private.protect_reviewed_photo_bytes() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER clipt_reviewed_photo_bytes BEFORE INSERT OR UPDATE ON storage.objects
 FOR EACH ROW EXECUTE FUNCTION clipt_private.protect_reviewed_photo_bytes();

ALTER TABLE clipt_private.azure_photo_quarantines
 ADD COLUMN appeal_requested_at timestamptz,
 ADD COLUMN decision text CHECK(decision IN ('restore','keep')),
 ADD COLUMN decided_at timestamptz,
 ADD COLUMN decided_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

CREATE FUNCTION clipt_private.my_photo_quarantines()
RETURNS TABLE(job_id uuid,post_id uuid,quarantined_at timestamptz,appeal_requested_at timestamptz,decision text)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF auth.uid() IS NULL OR NOT clipt_private.account_available() THEN
  RAISE EXCEPTION 'Authenticated account required' USING ERRCODE='42501'; END IF;
 RETURN QUERY SELECT q.job_id,q.post_id,q.quarantined_at,q.appeal_requested_at,q.decision
 FROM clipt_private.azure_photo_quarantines q JOIN clipt_private.azure_review_jobs j ON j.id=q.job_id
 WHERE j.user_id=auth.uid() ORDER BY q.quarantined_at DESC LIMIT 100;
END $$;
CREATE FUNCTION public.my_photo_quarantines()
RETURNS TABLE(job_id uuid,post_id uuid,quarantined_at timestamptz,appeal_requested_at timestamptz,decision text)
LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$SELECT * FROM clipt_private.my_photo_quarantines()$$;

CREATE FUNCTION clipt_private.appeal_photo_quarantine(p_job uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF auth.uid() IS NULL OR NOT clipt_private.account_available() THEN
  RAISE EXCEPTION 'Authenticated account required' USING ERRCODE='42501'; END IF;
 IF NOT EXISTS(SELECT 1 FROM clipt_private.azure_photo_quarantines q
  JOIN clipt_private.azure_review_jobs j ON j.id=q.job_id WHERE q.job_id=p_job AND j.user_id=auth.uid()) THEN
  RAISE EXCEPTION 'Review unavailable' USING ERRCODE='42501'; END IF;
 UPDATE clipt_private.azure_photo_quarantines SET appeal_requested_at=clock_timestamp()
 WHERE job_id=p_job AND appeal_requested_at IS NULL AND decision IS NULL;
 RETURN FOUND;
END $$;
CREATE FUNCTION public.appeal_photo_quarantine(p_job uuid)
RETURNS boolean LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$SELECT clipt_private.appeal_photo_quarantine(p_job)$$;

CREATE FUNCTION clipt_private.photo_quarantine_queue()
RETURNS TABLE(job_id uuid,post_id uuid,quarantined_at timestamptz,appeal_requested_at timestamptz,decision text)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF auth.uid() IS NULL OR NOT clipt_private.account_available() OR coalesce(auth.jwt()->>'aal','aal1')<>'aal2'
  OR NOT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=auth.uid() AND role IN ('admin','moderator')) THEN
  RAISE EXCEPTION 'MFA-verified moderator access required' USING ERRCODE='42501'; END IF;
 RETURN QUERY SELECT q.job_id,q.post_id,q.quarantined_at,q.appeal_requested_at,q.decision
 FROM clipt_private.azure_photo_quarantines q WHERE q.decision IS NULL
 ORDER BY q.appeal_requested_at ASC NULLS LAST,q.quarantined_at ASC LIMIT 100;
END $$;
CREATE FUNCTION public.photo_quarantine_queue()
RETURNS TABLE(job_id uuid,post_id uuid,quarantined_at timestamptz,appeal_requested_at timestamptz,decision text)
LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$SELECT * FROM clipt_private.photo_quarantine_queue()$$;

CREATE FUNCTION clipt_private.resolve_photo_quarantine(p_job uuid,p_decision text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE job clipt_private.azure_review_jobs%rowtype; target public.posts%rowtype; prior text;
BEGIN
 IF auth.uid() IS NULL OR NOT clipt_private.account_available() OR coalesce(auth.jwt()->>'aal','aal1')<>'aal2'
  OR NOT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=auth.uid() AND role IN ('admin','moderator')) THEN
  RAISE EXCEPTION 'MFA-verified moderator access required' USING ERRCODE='42501'; END IF;
 IF p_decision IS NULL OR p_decision NOT IN ('restore','keep') THEN
  RAISE EXCEPTION 'Invalid quarantine decision' USING ERRCODE='22023'; END IF;
 SELECT * INTO job FROM clipt_private.azure_review_jobs WHERE id=p_job;
 IF NOT FOUND THEN RAISE EXCEPTION 'Review unavailable' USING ERRCODE='42501'; END IF;
 PERFORM 1 FROM public.profiles WHERE id=job.user_id FOR UPDATE;
 SELECT * INTO target FROM public.posts WHERE id=job.post_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Photo unavailable' USING ERRCODE='42501'; END IF;
 PERFORM 1 FROM clipt_private.azure_review_jobs WHERE id=p_job FOR UPDATE;
 SELECT decision INTO prior FROM clipt_private.azure_photo_quarantines WHERE job_id=p_job FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Review unavailable' USING ERRCODE='42501'; END IF;
 IF prior IS NOT NULL THEN
  IF prior=p_decision THEN RETURN false; END IF;
  RAISE EXCEPTION 'Review already resolved' USING ERRCODE='55000'; END IF;
 -- Normalize only the quarantine bit. Changed content/privacy cannot be restored.
 IF target.user_id<>job.user_id OR target.moderation_hidden IS NOT TRUE
  OR clipt_private.azure_review_snapshot_hash(to_jsonb(target)||'{"moderation_hidden":false}'::jsonb)<>job.source_hash THEN
  RAISE EXCEPTION 'Photo snapshot changed; review again' USING ERRCODE='42501'; END IF;
 UPDATE clipt_private.azure_photo_quarantines SET decision=p_decision,decided_by=auth.uid(),decided_at=clock_timestamp() WHERE job_id=p_job;
 IF p_decision='restore' THEN UPDATE public.posts SET moderation_hidden=false WHERE id=job.post_id; END IF;
 RETURN true;
END $$;
CREATE FUNCTION public.resolve_photo_quarantine(p_job uuid,p_decision text)
RETURNS boolean LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$SELECT clipt_private.resolve_photo_quarantine(p_job,p_decision)$$;

CREATE FUNCTION clipt_private.quarantined_photo_preview(p_job uuid)
RETURNS TABLE(post_id uuid,user_id uuid,image_url text,caption text)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF auth.uid() IS NULL OR NOT clipt_private.account_available() OR coalesce(auth.jwt()->>'aal','aal1')<>'aal2'
  OR NOT EXISTS(SELECT 1 FROM public.user_roles r WHERE r.user_id=auth.uid() AND r.role IN ('admin','moderator')) THEN
  RAISE EXCEPTION 'MFA-verified moderator access required' USING ERRCODE='42501'; END IF;
 RETURN QUERY SELECT p.id,p.user_id,p.image_url,p.content FROM clipt_private.azure_photo_quarantines q
 JOIN clipt_private.azure_review_jobs j ON j.id=q.job_id JOIN public.posts p ON p.id=q.post_id
 WHERE q.job_id=p_job AND q.decision IS NULL AND p.moderation_hidden IS TRUE
  AND clipt_private.azure_review_snapshot_hash(to_jsonb(p)||'{"moderation_hidden":false}'::jsonb)=j.source_hash;
END $$;
CREATE FUNCTION public.quarantined_photo_preview(p_job uuid)
RETURNS TABLE(post_id uuid,user_id uuid,image_url text,caption text)
LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$SELECT * FROM clipt_private.quarantined_photo_preview(p_job)$$;

REVOKE ALL ON FUNCTION clipt_private.my_photo_quarantines(),public.my_photo_quarantines(),
 clipt_private.appeal_photo_quarantine(uuid),public.appeal_photo_quarantine(uuid),
 clipt_private.photo_quarantine_queue(),public.photo_quarantine_queue(),
 clipt_private.resolve_photo_quarantine(uuid,text),public.resolve_photo_quarantine(uuid,text) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION clipt_private.quarantined_photo_preview(uuid),public.quarantined_photo_preview(uuid) FROM PUBLIC,anon;
GRANT USAGE ON SCHEMA clipt_private TO authenticated;
GRANT EXECUTE ON FUNCTION clipt_private.my_photo_quarantines(),public.my_photo_quarantines(),
 clipt_private.appeal_photo_quarantine(uuid),public.appeal_photo_quarantine(uuid),
 clipt_private.photo_quarantine_queue(),public.photo_quarantine_queue(),
 clipt_private.resolve_photo_quarantine(uuid,text),public.resolve_photo_quarantine(uuid,text) TO authenticated;
GRANT EXECUTE ON FUNCTION clipt_private.quarantined_photo_preview(uuid),public.quarantined_photo_preview(uuid) TO authenticated;

CREATE TABLE clipt_private.azure_review_decisions (
 job_id uuid PRIMARY KEY REFERENCES clipt_private.azure_review_jobs(id) ON DELETE CASCADE,
 actor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
 decision text NOT NULL CHECK(decision IN ('dismiss','hide')),
 decided_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
ALTER TABLE clipt_private.azure_review_decisions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON clipt_private.azure_review_decisions FROM PUBLIC,anon,authenticated;

CREATE FUNCTION clipt_private.resolve_azure_photo_review(p_job uuid,p_decision text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE job clipt_private.azure_review_jobs%rowtype; target public.posts%rowtype; prior text;
BEGIN
 IF auth.uid() IS NULL OR NOT clipt_private.account_available()
  OR coalesce(auth.jwt()->>'aal','aal1')<>'aal2'
  OR NOT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=auth.uid() AND role IN ('admin','moderator')) THEN
  RAISE EXCEPTION 'MFA-verified moderator access required' USING ERRCODE='42501';
 END IF;
 IF p_decision IS NULL OR p_decision NOT IN ('dismiss','hide') THEN
  RAISE EXCEPTION 'Invalid review decision' USING ERRCODE='22023';
 END IF;
 SELECT * INTO job FROM clipt_private.azure_review_jobs WHERE id=p_job;
 IF NOT FOUND THEN RAISE EXCEPTION 'Review unavailable' USING ERRCODE='42501'; END IF;
 -- Same profile -> post -> job order as reservation/account erasure.
 PERFORM 1 FROM public.profiles WHERE id=job.user_id FOR UPDATE;
 SELECT * INTO target FROM public.posts WHERE id=job.post_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Review unavailable' USING ERRCODE='42501'; END IF;
 SELECT * INTO job FROM clipt_private.azure_review_jobs WHERE id=p_job FOR UPDATE;
 SELECT decision INTO prior FROM clipt_private.azure_review_decisions WHERE job_id=p_job;
 IF FOUND THEN
  IF prior=p_decision THEN RETURN false; END IF;
  RAISE EXCEPTION 'Review already resolved' USING ERRCODE='55000';
 END IF;
 IF job.state NOT IN ('needs_review','failed') THEN
  RAISE EXCEPTION 'Completed flagged or failed review required' USING ERRCODE='55000';
 END IF;
 IF target.user_id<>job.user_id OR target.is_published IS NOT TRUE
  OR target.is_premium IS NOT FALSE OR target.is_subscriber_only IS NOT FALSE
  OR target.required_tier_id IS NOT NULL OR target.moderation_hidden IS NOT FALSE
  OR target.post_type NOT IN ('clipt','regular','photo')
  OR target.image_url IS NULL OR target.image_url='' OR target.video_url IS NOT NULL
  OR (target.scheduled_publish_time IS NOT NULL AND target.scheduled_publish_time>clock_timestamp())
  OR clipt_private.azure_review_snapshot_hash(to_jsonb(target))<>job.source_hash THEN
  RAISE EXCEPTION 'Public scan snapshot changed; review unavailable' USING ERRCODE='42501';
 END IF;
 INSERT INTO clipt_private.azure_review_decisions(job_id,actor_id,decision) VALUES(p_job,auth.uid(),p_decision);
 -- Explicit human action only. No deletion, ban or provider-result rewriting.
 IF p_decision='hide' THEN UPDATE public.posts SET moderation_hidden=true WHERE id=job.post_id; END IF;
 RETURN true;
END $$;
REVOKE ALL ON FUNCTION clipt_private.resolve_azure_photo_review(uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION clipt_private.resolve_azure_photo_review(uuid,text) TO authenticated;
CREATE FUNCTION public.resolve_azure_photo_review(p_job uuid,p_decision text)
RETURNS boolean LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$
 SELECT clipt_private.resolve_azure_photo_review(p_job,p_decision)
$$;
REVOKE ALL ON FUNCTION public.resolve_azure_photo_review(uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.resolve_azure_photo_review(uuid,text) TO authenticated;

CREATE OR REPLACE FUNCTION clipt_private.azure_photo_review_queue()
RETURNS TABLE(id uuid,post_id uuid,state text,created_at timestamptz)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF auth.uid() IS NULL OR NOT clipt_private.account_available()
  OR coalesce(auth.jwt()->>'aal','aal1')<>'aal2'
  OR NOT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=auth.uid() AND role IN ('admin','moderator')) THEN
  RAISE EXCEPTION 'MFA-verified moderator access required' USING ERRCODE='42501';
 END IF;
 RETURN QUERY SELECT j.id,j.post_id,j.state,j.created_at FROM clipt_private.azure_review_jobs j
 JOIN public.posts p ON p.id=j.post_id
 WHERE j.state IN ('pending','needs_review','failed') AND p.is_published IS TRUE
 AND p.is_premium IS FALSE AND p.is_subscriber_only IS FALSE AND p.required_tier_id IS NULL
 AND p.post_type IN ('clipt','regular','photo') AND p.image_url IS NOT NULL AND p.image_url<>''
 AND p.video_url IS NULL AND p.moderation_hidden IS FALSE
 AND (p.scheduled_publish_time IS NULL OR p.scheduled_publish_time<=clock_timestamp())
 AND clipt_private.azure_review_snapshot_hash(to_jsonb(p))=j.source_hash
 AND NOT EXISTS(SELECT 1 FROM clipt_private.azure_review_decisions d WHERE d.job_id=j.id)
 ORDER BY j.created_at DESC LIMIT 100;
END $$;

CREATE OR REPLACE FUNCTION clipt_private.quarantined_photo_preview(p_job uuid)
RETURNS TABLE(post_id uuid,user_id uuid,image_url text,caption text)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF auth.uid() IS NULL OR NOT clipt_private.account_available() OR coalesce(auth.jwt()->>'aal','aal1')<>'aal2'
  OR NOT EXISTS(SELECT 1 FROM public.user_roles r WHERE r.user_id=auth.uid() AND r.role IN ('admin','moderator')) THEN
  RAISE EXCEPTION 'MFA-verified moderator access required' USING ERRCODE='42501'; END IF;
 RETURN QUERY SELECT p.id,p.user_id,p.image_url,p.content FROM clipt_private.azure_photo_quarantines q
 JOIN clipt_private.azure_review_jobs j ON j.id=q.job_id JOIN public.posts p ON p.id=q.post_id
 WHERE q.job_id=p_job AND q.decision IS NULL AND p.moderation_hidden IS TRUE
  AND clipt_private.azure_review_snapshot_hash(to_jsonb(p)||'{"moderation_hidden":false}'::jsonb)=j.source_hash;
END $$;
REVOKE ALL ON FUNCTION clipt_private.quarantined_photo_preview(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION clipt_private.quarantined_photo_preview(uuid) TO authenticated;
ALTER TABLE clipt_private.azure_dispatch_settings
 ADD COLUMN verified_free_tier boolean NOT NULL DEFAULT false,
 ADD COLUMN probe_verified_at timestamptz,
 ADD COLUMN last_worker_at timestamptz,
 ADD COLUMN last_worker_state text;
CREATE TABLE clipt_private.production_photo_decisions(
 dispatch_id uuid PRIMARY KEY REFERENCES clipt_private.azure_review_dispatch(id) ON DELETE CASCADE,
 source_hash text NOT NULL, actor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
 decision text NOT NULL CHECK(decision IN ('restore','keep')),
 decided_at timestamptz NOT NULL DEFAULT clock_timestamp());
ALTER TABLE clipt_private.production_photo_decisions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON clipt_private.production_photo_decisions FROM PUBLIC,anon,authenticated;

CREATE FUNCTION clipt_private.require_photo_moderator() RETURNS void
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF auth.uid() IS NULL OR NOT clipt_private.account_available()
 OR NOT clipt_private.beta_access_allowed() OR coalesce(auth.jwt()->>'aal','aal1')<>'aal2'
 OR NOT EXISTS(SELECT 1 FROM public.user_roles r WHERE r.user_id=auth.uid() AND r.role IN ('admin','moderator')) THEN
 RAISE EXCEPTION 'MFA-verified moderator access required' USING ERRCODE='42501'; END IF;
END $$;
REVOKE ALL ON FUNCTION clipt_private.require_photo_moderator() FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION clipt_private.photo_review_held(p_post uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT EXISTS(SELECT 1 FROM clipt_private.azure_review_dispatch d JOIN public.posts p ON p.id=d.post_id
 WHERE d.post_id=p_post AND d.state<>'completed'
 AND d.source_hash=clipt_private.azure_review_snapshot_hash(to_jsonb(p)||'{"moderation_hidden":false}'::jsonb)
 AND NOT EXISTS(SELECT 1 FROM clipt_private.production_photo_decisions x WHERE x.dispatch_id=d.id AND x.source_hash=d.source_hash))
$$;
CREATE FUNCTION clipt_private.production_photo_review_queue()
RETURNS TABLE(job_id uuid,post_id uuid,state text,created_at timestamptz)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
BEGIN
 PERFORM clipt_private.require_photo_moderator();
 RETURN QUERY SELECT d.id,d.post_id,
 CASE WHEN q.job_id IS NOT NULL THEN coalesce(j.state,'failed') ELSE d.state END,d.created_at
 FROM clipt_private.azure_review_dispatch d JOIN public.posts p ON p.id=d.post_id
 LEFT JOIN clipt_private.azure_review_jobs j ON j.id=d.id
 LEFT JOIN clipt_private.azure_photo_quarantines q ON q.job_id=d.id AND q.decision IS NULL
 WHERE (d.state<>'completed' OR q.job_id IS NOT NULL)
 AND p.is_published IS TRUE AND p.is_premium IS FALSE AND p.is_subscriber_only IS FALSE
 AND p.required_tier_id IS NULL AND p.video_url IS NULL AND p.image_url IS NOT NULL
 AND p.post_type IN ('clipt','regular','photo')
 AND d.source_hash=clipt_private.azure_review_snapshot_hash(to_jsonb(p)||'{"moderation_hidden":false}'::jsonb)
 AND NOT EXISTS(SELECT 1 FROM clipt_private.production_photo_decisions x WHERE x.dispatch_id=d.id)
 ORDER BY d.created_at LIMIT 100;
END $$;
CREATE FUNCTION public.production_photo_review_queue()
RETURNS TABLE(job_id uuid,post_id uuid,state text,created_at timestamptz)
LANGUAGE sql STABLE SECURITY INVOKER SET search_path='' AS $$SELECT * FROM clipt_private.production_photo_review_queue()$$;

CREATE FUNCTION clipt_private.production_photo_review_preview(p_job uuid)
RETURNS TABLE(post_id uuid,user_id uuid,image_url text,caption text)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
BEGIN
 PERFORM clipt_private.require_photo_moderator();
 RETURN QUERY SELECT p.id,p.user_id,p.image_url,p.content
 FROM clipt_private.azure_review_dispatch d JOIN public.posts p ON p.id=d.post_id
 WHERE d.id=p_job AND p.is_published IS TRUE AND p.is_premium IS FALSE AND p.is_subscriber_only IS FALSE
 AND p.required_tier_id IS NULL AND p.video_url IS NULL AND p.image_url IS NOT NULL
 AND p.post_type IN ('clipt','regular','photo')
 AND d.source_hash=clipt_private.azure_review_snapshot_hash(to_jsonb(p)||'{"moderation_hidden":false}'::jsonb)
 AND NOT EXISTS(SELECT 1 FROM clipt_private.production_photo_decisions x WHERE x.dispatch_id=d.id);
END $$;
CREATE FUNCTION public.production_photo_review_preview(p_job uuid)
RETURNS TABLE(post_id uuid,user_id uuid,image_url text,caption text)
LANGUAGE sql STABLE SECURITY INVOKER SET search_path='' AS $$SELECT * FROM clipt_private.production_photo_review_preview(p_job)$$;

CREATE FUNCTION clipt_private.resolve_production_photo_review(p_job uuid,p_decision text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE d clipt_private.azure_review_dispatch%rowtype; p public.posts%rowtype;
BEGIN
 PERFORM clipt_private.require_photo_moderator();
 IF p_decision IS NULL OR p_decision NOT IN ('restore','keep') THEN RAISE EXCEPTION 'Invalid review decision'; END IF;
 SELECT * INTO d FROM clipt_private.azure_review_dispatch WHERE id=p_job;
 IF NOT FOUND THEN RAISE EXCEPTION 'Review unavailable'; END IF;
 PERFORM 1 FROM public.profiles WHERE id=d.user_id FOR UPDATE;
 SELECT * INTO p FROM public.posts WHERE id=d.post_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Review unavailable'; END IF;
 SELECT * INTO d FROM clipt_private.azure_review_dispatch WHERE id=p_job FOR UPDATE;
 IF d.state='processing' OR EXISTS(SELECT 1 FROM clipt_private.azure_review_jobs j WHERE j.id=d.id AND j.state='pending') THEN
 RAISE EXCEPTION 'Review is processing; retry after reconciliation' USING ERRCODE='55000'; END IF;
 IF p.user_id<>d.user_id OR p.is_published IS NOT TRUE OR p.is_premium IS NOT FALSE
 OR p.is_subscriber_only IS NOT FALSE OR p.required_tier_id IS NOT NULL OR p.video_url IS NOT NULL
 OR p.post_type NOT IN ('clipt','regular','photo')
 OR d.source_hash<>clipt_private.azure_review_snapshot_hash(to_jsonb(p)||'{"moderation_hidden":false}'::jsonb) THEN
 RAISE EXCEPTION 'Photo changed; refresh review'; END IF;
 IF EXISTS(SELECT 1 FROM clipt_private.production_photo_decisions x WHERE x.dispatch_id=d.id) THEN RETURN false; END IF;
 INSERT INTO clipt_private.production_photo_decisions(dispatch_id,source_hash,actor_id,decision) VALUES(d.id,d.source_hash,auth.uid(),p_decision);
 UPDATE clipt_private.azure_photo_quarantines SET decision=p_decision,decided_by=auth.uid(),decided_at=clock_timestamp() WHERE job_id=d.id AND decision IS NULL;
 UPDATE clipt_private.azure_review_dispatch SET state='completed' WHERE id=d.id;
 UPDATE public.posts SET moderation_hidden=(p_decision='keep') WHERE id=p.id;
 RETURN true;
END $$;
CREATE FUNCTION public.resolve_production_photo_review(p_job uuid,p_decision text) RETURNS boolean
LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$SELECT clipt_private.resolve_production_photo_review(p_job,p_decision)$$;
REVOKE ALL ON FUNCTION clipt_private.production_photo_review_queue(),public.production_photo_review_queue(),
 clipt_private.production_photo_review_preview(uuid),public.production_photo_review_preview(uuid),
 clipt_private.resolve_production_photo_review(uuid,text),public.resolve_production_photo_review(uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION clipt_private.production_photo_review_queue(),public.production_photo_review_queue(),
 clipt_private.production_photo_review_preview(uuid),public.production_photo_review_preview(uuid),
 clipt_private.resolve_production_photo_review(uuid,text),public.resolve_production_photo_review(uuid,text) TO authenticated;

-- Album membership is checked separately; replacing bytes never bypasses a scan.
CREATE OR REPLACE FUNCTION clipt_private.protect_reviewed_photo_bytes() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF NEW.bucket_id IN ('media','posts') AND EXISTS(
 SELECT 1 FROM public.posts p CROSS JOIN LATERAL regexp_split_to_table(p.image_url,',\s*(?=https?://)','i') ref(value)
 WHERE p.user_id::text=split_part(NEW.name,'/',1) AND p.video_url IS NULL
 AND btrim(ref.value) IN (
 'https://slnjliheyiiummxhrgmk.supabase.co/storage/v1/object/public/'||NEW.bucket_id||'/'||NEW.name,
 'https://slnjliheyiiummxhrgmk.supabase.co/storage/v1/object/authenticated/'||NEW.bucket_id||'/'||NEW.name)
 AND EXISTS(SELECT 1 FROM clipt_private.azure_review_dispatch d WHERE d.post_id=p.id)) THEN
 RAISE EXCEPTION 'Reviewed photo media is immutable; upload a new file' USING ERRCODE='55000'; END IF;
 RETURN NEW;
END $$;

CREATE FUNCTION clipt_private.reconcile_stale_photo_reviews() RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE j record; n integer:=0;
BEGIN
 FOR j IN SELECT d.id,d.user_id FROM clipt_private.azure_review_dispatch d
 JOIN clipt_private.azure_review_jobs r ON r.id=d.id
 WHERE d.state='processing' AND r.state='pending' AND d.claimed_at<clock_timestamp()-interval '20 minutes'
 ORDER BY d.created_at LIMIT 10 LOOP
 IF public.finish_azure_review_with_quarantine(j.user_id,j.id,'failed') THEN
 PERFORM public.finish_public_photo_dispatch(j.id,false);n:=n+1; END IF;
 END LOOP;RETURN n;
END $$;
CREATE FUNCTION public.reconcile_stale_photo_reviews() RETURNS integer
LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$SELECT clipt_private.reconcile_stale_photo_reviews()$$;

CREATE FUNCTION public.azure_photo_worker_status() RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT jsonb_build_object('enabled',s.enabled,'verifiedFreeTier',s.verified_free_tier,
 'providerVerified',s.probe_verified_at>clock_timestamp()-interval '24 hours',
 'moderatorReady',EXISTS(SELECT 1 FROM public.user_roles r JOIN auth.mfa_factors f ON f.user_id=r.user_id
 WHERE r.role IN ('admin','moderator') AND f.status='verified'))
 FROM clipt_private.azure_dispatch_settings s WHERE s.singleton
$$;
CREATE FUNCTION public.record_azure_photo_worker(p_state text) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF p_state NOT IN ('provider_verified','processed','idle','disabled','failed','held') THEN RAISE EXCEPTION 'Invalid worker state'; END IF;
 UPDATE clipt_private.azure_dispatch_settings SET last_worker_at=clock_timestamp(),last_worker_state=p_state,
 probe_verified_at=CASE WHEN p_state='provider_verified' THEN clock_timestamp() ELSE probe_verified_at END;
 RETURN FOUND;
END $$;
REVOKE ALL ON FUNCTION clipt_private.reconcile_stale_photo_reviews(),public.reconcile_stale_photo_reviews(),
 public.azure_photo_worker_status(),public.record_azure_photo_worker(text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION clipt_private.reconcile_stale_photo_reviews(),public.reconcile_stale_photo_reviews(),
 public.azure_photo_worker_status(),public.record_azure_photo_worker(text) TO service_role;
-- Public RPCs above are service-only transport wrappers. Browser actions use
-- authenticated MFA/ownership checks in non-exposed clipt_private functions.

CREATE TABLE clipt_private.azure_provider_probes(run_id text,run_attempt text,created_at timestamptz NOT NULL DEFAULT clock_timestamp(),PRIMARY KEY(run_id,run_attempt));
ALTER TABLE clipt_private.azure_provider_probes ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON clipt_private.azure_provider_probes FROM PUBLIC,anon,authenticated;
CREATE FUNCTION public.reserve_azure_photo_probe(p_run text,p_attempt text) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' SET timezone='UTC' AS $
DECLARE day_start timestamptz:=date_trunc('day',clock_timestamp() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC';
 month_start timestamptz:=date_trunc('month',clock_timestamp() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC';n integer;k text;
BEGIN
 IF p_run !~ '^[1-9][0-9]{0,19} OR p_attempt !~ '^[1-9][0-9]{0,4} OR p_run IS NULL OR p_attempt IS NULL THEN RAISE EXCEPTION 'Invalid probe'; END IF;
 PERFORM pg_advisory_xact_lock(57421,101);
 IF EXISTS(SELECT 1 FROM clipt_private.azure_provider_probes WHERE run_id=p_run AND run_attempt=p_attempt) THEN RETURN false; END IF;
 IF (SELECT count(*) FROM clipt_private.azure_provider_probes WHERE created_at>=day_start)>=5 THEN RETURN false; END IF;
 FOREACH k IN ARRAY ARRAY['day:'||day_start::text,'month:'||month_start::text] LOOP
 INSERT INTO clipt_private.azure_review_budget(budget_key,operations) VALUES(k,2)
 ON CONFLICT(budget_key) DO UPDATE SET operations=azure_review_budget.operations+2 RETURNING operations INTO n;
 IF n>CASE WHEN k LIKE 'day:%' THEN 100 ELSE 1000 END THEN RAISE EXCEPTION 'Review quota reached'; END IF;
 END LOOP;
 INSERT INTO clipt_private.azure_provider_probes(run_id,run_attempt) VALUES(p_run,p_attempt);RETURN true;
END $;
REVOKE ALL ON FUNCTION public.reserve_azure_photo_probe(text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_azure_photo_probe(text,text) TO service_role;

COMMIT;
