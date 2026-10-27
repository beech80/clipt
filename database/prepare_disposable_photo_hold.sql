-- Development test fixture ONLY. Run only against akiksrlzdqvipqbbjxpw.
-- Admin fixture preparation, NOT an authenticated ownership test or scan pass.
-- Seeds the expected future-public snapshot without publishing a private draft,
-- enabling dispatch, reserving Azure quota, or transmitting any media.
BEGIN;
DO $$
DECLARE
 fixture_owner constant uuid := '875b6725-b8fd-4999-a5e5-9527daf01073';
 fixture_post constant uuid := '84de9d7b-e717-4d9c-abed-b75eae5b0073';
 source jsonb; prospective_hash text; dispatch_enabled boolean;
BEGIN
 PERFORM pg_catalog.pg_advisory_xact_lock(57421,101);
 PERFORM 1 FROM public.profiles WHERE id=fixture_owner FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Disposable account unavailable'; END IF;
 SELECT to_jsonb(p) INTO source FROM public.posts p
 WHERE p.id=fixture_post AND p.user_id=fixture_owner FOR UPDATE;
 IF source IS NULL OR source->>'is_published' IS DISTINCT FROM 'false'
  OR source->>'is_premium' IS DISTINCT FROM 'false'
  OR source->>'is_subscriber_only' IS DISTINCT FROM 'false'
  OR source->>'moderation_hidden' IS DISTINCT FROM 'false'
  OR source->>'required_tier_id' IS NOT NULL OR source->>'video_url' IS NOT NULL
  OR source->>'scheduled_publish_time' IS NOT NULL
  OR coalesce(source->>'post_type','') NOT IN ('clipt','regular','photo') THEN
  RAISE EXCEPTION 'Exact eligible disposable photo draft required'; END IF;
 IF NOT EXISTS(SELECT 1 FROM storage.objects o
  WHERE o.bucket_id IN ('media','posts') AND split_part(o.name,'/',1)=fixture_owner::text
   AND source->>'image_url' IN (
    'https://akiksrlzdqvipqbbjxpw.supabase.co/storage/v1/object/public/'||o.bucket_id||'/'||o.name,
    'https://akiksrlzdqvipqbbjxpw.supabase.co/storage/v1/object/authenticated/'||o.bucket_id||'/'||o.name)) THEN
  RAISE EXCEPTION 'Owned development photo object required'; END IF;
 IF (SELECT coalesce(sum(CASE WHEN ascii(unit)>65535 THEN 2 ELSE 1 END),0)
  FROM regexp_split_to_table(coalesce(source->>'content',''),'') AS chars(unit))>500 THEN
  RAISE EXCEPTION 'Fixture caption exceeds scanner limit'; END IF;
 SELECT enabled INTO dispatch_enabled FROM clipt_private.azure_dispatch_settings
 WHERE singleton FOR SHARE;
 IF NOT FOUND OR dispatch_enabled IS DISTINCT FROM false THEN
  RAISE EXCEPTION 'General dispatch must remain disabled'; END IF;
 IF EXISTS(SELECT 1 FROM clipt_private.azure_review_jobs WHERE post_id=fixture_post) THEN
  RAISE EXCEPTION 'Existing review must be reconciled first'; END IF;
 prospective_hash:=clipt_private.azure_review_snapshot_hash(source||jsonb_build_object('is_published',true));
 IF EXISTS(SELECT 1 FROM clipt_private.azure_review_dispatch
  WHERE post_id=fixture_post AND (user_id<>fixture_owner OR source_hash<>prospective_hash OR state<>'queued')) THEN
  RAISE EXCEPTION 'Fixture queue changed; do not overwrite it'; END IF;
 INSERT INTO clipt_private.azure_review_dispatch(post_id,user_id,source_hash)
 VALUES(fixture_post,fixture_owner,prospective_hash) ON CONFLICT(post_id,source_hash) DO NOTHING;
END $$;
COMMIT;
