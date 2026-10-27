-- Administrative DEVELOPMENT TEST DATA ONLY, not a migration or Azure result.
-- Owner approved a separate synthetic fixture; never change the genuine job.
BEGIN;
DO $$
DECLARE source public.posts%rowtype;
BEGIN
 PERFORM pg_catalog.pg_advisory_xact_lock(57421,101);
 PERFORM 1 FROM public.profiles WHERE id='1b0ea76e-a629-4f54-8ec5-1e4ae0e7a251' FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Approved test owner unavailable'; END IF;
 SELECT * INTO source FROM public.posts WHERE id='0b28e432-16c4-4fc1-adc7-bec6ce263cd8'
  AND user_id='1b0ea76e-a629-4f54-8ec5-1e4ae0e7a251' FOR UPDATE;
 IF NOT FOUND OR source.is_published IS DISTINCT FROM true OR source.moderation_hidden
  OR source.is_premium IS DISTINCT FROM false OR source.is_subscriber_only IS DISTINCT FROM false
  OR source.required_tier_id IS NOT NULL OR source.video_url IS NOT NULL OR source.image_url IS NULL
  OR source.content<>'CLIPT Azure test' THEN RAISE EXCEPTION 'Approved public source changed'; END IF;
 IF NOT EXISTS(SELECT 1 FROM clipt_private.azure_review_jobs WHERE id='c26f0d68-19f7-4f99-9c5a-52fe945caa10'
  AND post_id=source.id AND user_id=source.user_id AND state='no_flag_detected'
  AND source_hash=clipt_private.azure_review_snapshot_hash(to_jsonb(source))) THEN
  RAISE EXCEPTION 'Genuine Azure result must remain unchanged'; END IF;
 PERFORM 1 FROM clipt_private.azure_dispatch_settings WHERE singleton AND enabled=false FOR SHARE;
 IF NOT FOUND THEN RAISE EXCEPTION 'General scanning must remain disabled'; END IF;
 IF EXISTS(SELECT 1 FROM public.posts WHERE id='a7dc97c8-70bf-4f51-95e2-4ab700946270')
  OR EXISTS(SELECT 1 FROM clipt_private.azure_review_jobs WHERE id='23e72062-e1e3-4f45-a94e-803c93eb7c4a') THEN
  RAISE EXCEPTION 'Synthetic fixture already exists; do not repeat'; END IF;
 -- Same already-public owned image, no new upload or external transmission.
 -- Hide atomically before commit: the synthetic post is never public to peers.
 INSERT INTO public.posts(id,user_id,content,image_url,video_url,is_published,is_premium,
  is_subscriber_only,required_tier_id,post_type,moderation_hidden)
 VALUES('a7dc97c8-70bf-4f51-95e2-4ab700946270',source.user_id,
  'SYNTHETIC QUARANTINE TEST - not an Azure classification',source.image_url,null,true,false,false,null,'clipt',false);
 IF public.reserve_azure_review(source.user_id,'a7dc97c8-70bf-4f51-95e2-4ab700946270',
  '23e72062-e1e3-4f45-a94e-803c93eb7c4a',1) IS DISTINCT FROM true THEN
  RAISE EXCEPTION 'Synthetic reservation failed'; END IF;
 IF public.finish_azure_review_with_quarantine(source.user_id,'23e72062-e1e3-4f45-a94e-803c93eb7c4a','needs_review') IS DISTINCT FROM true THEN
  RAISE EXCEPTION 'Synthetic quarantine failed'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.posts WHERE id='a7dc97c8-70bf-4f51-95e2-4ab700946270' AND moderation_hidden=true) THEN
  RAISE EXCEPTION 'Synthetic post not hidden'; END IF;
END $$;
COMMIT;
