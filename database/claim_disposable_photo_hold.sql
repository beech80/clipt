-- Development fixture ONLY; administrative claim, not an Azure scan.
-- The normal claim function runs within this transaction. Other transactions
-- never observe enabled=true, and no other queued target may be selected.
BEGIN;
DO $$
DECLARE expected uuid; claimed record; enabled_now boolean;
BEGIN
 PERFORM pg_catalog.pg_advisory_xact_lock(57421,101);
 PERFORM 1 FROM public.profiles WHERE id='875b6725-b8fd-4999-a5e5-9527daf01073' FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Disposable profile unavailable'; END IF;
 PERFORM 1 FROM public.posts WHERE id='84de9d7b-e717-4d9c-abed-b75eae5b0073'
  AND user_id='875b6725-b8fd-4999-a5e5-9527daf01073' AND is_published IS TRUE FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Exact published disposable photo required'; END IF;
 SELECT enabled INTO enabled_now FROM clipt_private.azure_dispatch_settings WHERE singleton FOR UPDATE;
 IF NOT FOUND OR enabled_now IS DISTINCT FROM false THEN RAISE EXCEPTION 'General dispatch must remain disabled'; END IF;
 IF EXISTS(SELECT 1 FROM clipt_private.azure_review_dispatch
  WHERE state='queued' AND post_id<>'84de9d7b-e717-4d9c-abed-b75eae5b0073') THEN
  RAISE EXCEPTION 'Unrelated queue entries require separate review'; END IF;
 SELECT d.id INTO expected FROM clipt_private.azure_review_dispatch d JOIN public.posts p ON p.id=d.post_id
  WHERE p.id='84de9d7b-e717-4d9c-abed-b75eae5b0073' AND d.user_id=p.user_id AND d.state='queued'
   AND d.source_hash=clipt_private.azure_review_snapshot_hash(to_jsonb(p));
 IF NOT FOUND THEN RAISE EXCEPTION 'Exact queued version required; never repeat a reserved claim'; END IF;
 UPDATE clipt_private.azure_dispatch_settings SET enabled=true WHERE singleton;
 SELECT * INTO claimed FROM public.claim_public_photo_review();
 IF NOT FOUND OR claimed.request_id<>expected OR claimed.post_id<>'84de9d7b-e717-4d9c-abed-b75eae5b0073'::uuid
  OR claimed.user_id<>'875b6725-b8fd-4999-a5e5-9527daf01073'::uuid OR claimed.reserved IS DISTINCT FROM true THEN
  RAISE EXCEPTION 'Fixture claim unconfirmed'; END IF;
 UPDATE clipt_private.azure_dispatch_settings SET enabled=false WHERE singleton;
END $$;
COMMIT;
