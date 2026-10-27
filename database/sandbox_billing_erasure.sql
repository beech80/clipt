BEGIN;
SET LOCAL lock_timeout='5s';
-- Separate receipt-bound provider shutdown from destructive account erasure.
CREATE TABLE clipt_private.billing_erasure_requests (
 request_id uuid PRIMARY KEY, user_id uuid UNIQUE, receipt_hash bytea NOT NULL,
 customer_id text NOT NULL, subscription_id text,
 state text NOT NULL DEFAULT 'reserved' CHECK(state IN ('reserved','verified','erased')),
 created_at timestamptz NOT NULL DEFAULT now(), verified_at timestamptz,
 CHECK((state='reserved')=(verified_at IS NULL))
);
ALTER TABLE clipt_private.billing_erasure_requests ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON clipt_private.billing_erasure_requests FROM PUBLIC,anon,authenticated;
CREATE FUNCTION clipt_private.billing_erasure(p_stage text,p_user uuid,p_request uuid,p_receipt text,p_proof jsonb DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE r clipt_private.billing_erasure_requests%rowtype; a clipt_private.billing_accounts%rowtype;
BEGIN
 IF p_request IS NULL OR p_receipt IS NULL OR p_receipt !~ '^[a-f0-9]{64}$' OR p_stage NOT IN ('prepare','verify') THEN
  RAISE EXCEPTION 'Invalid billing deletion request' USING ERRCODE='22023'; END IF;
 -- Serializes different receipts for one identity; provider calls never hold a DB transaction.
 IF p_user IS NOT NULL THEN PERFORM pg_advisory_xact_lock(hashtextextended(p_user::text,17)); END IF;
 SELECT * INTO r FROM clipt_private.billing_erasure_requests WHERE request_id=p_request;
 IF FOUND THEN
  IF r.receipt_hash<>sha256(convert_to(p_receipt,'UTF8')) OR (p_user IS NOT NULL AND r.user_id IS DISTINCT FROM p_user AND r.state<>'erased') THEN
   RAISE EXCEPTION 'Billing deletion receipt rejected' USING ERRCODE='42501'; END IF;
  IF r.state='erased' THEN RETURN NULL; END IF;
  PERFORM 1 FROM clipt_private.billing_accounts WHERE user_id=r.user_id FOR UPDATE;
  SELECT * INTO r FROM clipt_private.billing_erasure_requests WHERE request_id=p_request FOR UPDATE;
 ELSE
  IF p_stage<>'prepare' OR p_user IS NULL THEN RETURN NULL; END IF;
  SELECT * INTO a FROM clipt_private.billing_accounts WHERE user_id=p_user FOR UPDATE;
  IF NOT FOUND THEN RETURN NULL; END IF;
  IF NOT EXISTS(SELECT 1 FROM public.profiles WHERE id=p_user) THEN RAISE EXCEPTION 'Account unavailable' USING ERRCODE='42501'; END IF;
  IF EXISTS(SELECT 1 FROM clipt_private.billing_checkouts WHERE user_id=p_user)
   OR EXISTS(SELECT 1 FROM clipt_private.billing_management_requests WHERE user_id=p_user AND state='pending') THEN
   RAISE EXCEPTION 'Resolve pending billing operation before deleting account' USING ERRCODE='23505'; END IF;
  IF a.customer_id IS NULL THEN RETURN NULL; END IF;
  IF EXISTS(SELECT 1 FROM public.user_subscriptions WHERE user_id=p_user AND id IS DISTINCT FROM a.membership_row_id AND status IN ('active','trialing','past_due')) THEN
   RAISE EXCEPTION 'Unbound subscription requires review' USING ERRCODE='23505'; END IF;
  INSERT INTO clipt_private.billing_erasure_requests(request_id,user_id,receipt_hash,customer_id,subscription_id)
   VALUES(p_request,p_user,sha256(convert_to(p_receipt,'UTF8')),a.customer_id,a.subscription_id) RETURNING * INTO r;
 END IF;
 IF p_stage='verify' THEN
  SELECT * INTO a FROM clipt_private.billing_accounts WHERE user_id=r.user_id FOR UPDATE;
  IF a.customer_id IS DISTINCT FROM r.customer_id OR a.subscription_id IS DISTINCT FROM r.subscription_id
   OR p_proof->>'customer_id' IS DISTINCT FROM r.customer_id
   OR p_proof->>'subscription_id' IS DISTINCT FROM r.subscription_id
   OR p_proof->>'status' IS DISTINCT FROM (CASE WHEN r.subscription_id IS NULL THEN 'no_subscription' ELSE 'canceled' END) THEN
   RAISE EXCEPTION 'Provider shutdown unconfirmed' USING ERRCODE='42501'; END IF;
  UPDATE clipt_private.billing_erasure_requests SET state='verified',verified_at=coalesce(verified_at,clock_timestamp()) WHERE request_id=p_request RETURNING * INTO r;
  UPDATE clipt_private.billing_accounts SET provider_status='canceled',paid_end=least(paid_end,clock_timestamp()) WHERE user_id=r.user_id;
  UPDATE public.user_subscriptions SET status='canceled',current_period_end=least(current_period_end,clock_timestamp()),updated_at=clock_timestamp()
   WHERE user_id=r.user_id AND id=a.membership_row_id;
 END IF;
 RETURN jsonb_build_object('user_id',r.user_id,'customer_id',r.customer_id,'subscription_id',r.subscription_id,'state',r.state);
END $$;
REVOKE ALL ON FUNCTION clipt_private.billing_erasure(text,uuid,uuid,text,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION clipt_private.billing_erasure(text,uuid,uuid,text,jsonb) TO service_role;
CREATE FUNCTION public.sandbox_billing_erasure(p_stage text,p_user uuid,p_request uuid,p_receipt text,p_proof jsonb DEFAULT NULL)
RETURNS jsonb LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$ SELECT clipt_private.billing_erasure(p_stage,p_user,p_request,p_receipt,p_proof); $$;
REVOKE ALL ON FUNCTION public.sandbox_billing_erasure(text,uuid,uuid,text,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.sandbox_billing_erasure(text,uuid,uuid,text,jsonb) TO service_role;
CREATE FUNCTION clipt_private.freeze_erasing_billing() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 PERFORM 1 FROM clipt_private.billing_accounts WHERE user_id=NEW.user_id FOR UPDATE;
 IF EXISTS(SELECT 1 FROM clipt_private.billing_erasure_requests WHERE user_id=NEW.user_id) THEN
  RAISE EXCEPTION 'Account billing deletion in progress' USING ERRCODE='42501'; END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION clipt_private.freeze_erasing_billing() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER clipt_freeze_erasure_checkout BEFORE INSERT OR UPDATE ON clipt_private.billing_checkouts FOR EACH ROW EXECUTE FUNCTION clipt_private.freeze_erasing_billing();
CREATE TRIGGER clipt_freeze_erasure_management BEFORE INSERT OR UPDATE ON clipt_private.billing_management_requests FOR EACH ROW EXECUTE FUNCTION clipt_private.freeze_erasing_billing();
CREATE FUNCTION clipt_private.guard_new_billing_identity() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 -- Match public erasure's profile-before-billing lock order. A customer cannot
 -- be created for a profile concurrently being deleted or already gone.
 PERFORM 1 FROM public.profiles WHERE id=NEW.user_id FOR KEY SHARE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Account unavailable' USING ERRCODE='42501'; END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION clipt_private.guard_new_billing_identity() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER clipt_billing_identity_guard BEFORE INSERT ON clipt_private.billing_accounts FOR EACH ROW EXECUTE FUNCTION clipt_private.guard_new_billing_identity();
CREATE FUNCTION clipt_private.purge_billing_erasure_receipt() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 DELETE FROM clipt_private.billing_erasure_requests WHERE request_id=OLD.id AND state='erased';
 RETURN OLD;
END $$;
REVOKE ALL ON FUNCTION clipt_private.purge_billing_erasure_receipt() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER clipt_billing_receipt_retention AFTER DELETE ON clipt_private.erasure_jobs FOR EACH ROW EXECUTE FUNCTION clipt_private.purge_billing_erasure_receipt();
CREATE OR REPLACE FUNCTION clipt_private.guard_billing_erasure() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE a clipt_private.billing_accounts%rowtype; r clipt_private.billing_erasure_requests%rowtype; subject uuid; years integer;
BEGIN
 SELECT * INTO a FROM clipt_private.billing_accounts WHERE user_id=OLD.id FOR UPDATE;
 IF EXISTS(SELECT 1 FROM clipt_private.billing_checkouts WHERE user_id=OLD.id)
  OR EXISTS(SELECT 1 FROM clipt_private.billing_management_requests WHERE user_id=OLD.id AND state='pending') THEN
  RAISE EXCEPTION 'Resolve pending billing before deletion' USING ERRCODE='P0001'; END IF;
 IF a.customer_id IS NOT NULL THEN
  SELECT * INTO r FROM clipt_private.billing_erasure_requests WHERE user_id=OLD.id FOR UPDATE;
  SELECT subject_id INTO subject FROM clipt_private.erasure_jobs WHERE id=r.request_id AND user_id=OLD.id AND state='cleanup';
  IF r.state IS DISTINCT FROM 'verified' OR subject IS NULL OR a.provider_status<>'canceled'
   OR a.customer_id IS DISTINCT FROM r.customer_id OR a.subscription_id IS DISTINCT FROM r.subscription_id THEN
   RAISE EXCEPTION 'Provider billing cleanup required' USING ERRCODE='P0001'; END IF;
  SELECT financial_years INTO years FROM clipt_private.erasure_policy WHERE singleton;
  IF years IS NULL THEN RAISE EXCEPTION 'Financial retention policy unavailable'; END IF;
  INSERT INTO clipt_private.retained_records(subject_id,category,source_table,source_id,data,expires_at)
   VALUES(subject,'financial','billing_accounts',r.request_id::text,
    jsonb_build_object('provider','stripe_sandbox','status','canceled','paid_tier',a.paid_tier,'paid_start',a.paid_start,'paid_end',a.paid_end,'verified_at',r.verified_at,
     'subscription_hash',encode(sha256(convert_to(a.subscription_id,'UTF8')),'hex')),
    clock_timestamp()+make_interval(years=>years)) ON CONFLICT(source_table,source_id) DO NOTHING;
  -- Erased reservations retain only retry capability, never the account/provider identifiers.
  UPDATE clipt_private.billing_erasure_requests SET state='erased',user_id=NULL,customer_id='erased',subscription_id=NULL WHERE request_id=r.request_id;
 END IF;
 DELETE FROM clipt_private.billing_checkouts WHERE user_id=OLD.id;
 DELETE FROM clipt_private.billing_management_requests WHERE user_id=OLD.id;
 DELETE FROM clipt_private.billing_events WHERE user_id=OLD.id;
 DELETE FROM clipt_private.mega_boosts WHERE user_id=OLD.id;
 DELETE FROM clipt_private.billing_accounts WHERE user_id=OLD.id;
 RETURN OLD;
END $$;
CREATE OR REPLACE FUNCTION clipt_private.billing_command(p_action text,p_payload jsonb) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE actor uuid:=(p_payload->>'user_id')::uuid;
BEGIN
 CASE p_action
 WHEN 'reserve' THEN RETURN clipt_private.reserve_subscription_checkout(actor,(p_payload->>'request_id')::uuid,p_payload->>'plan');
 WHEN 'bind' THEN RETURN to_jsonb(clipt_private.bind_subscription_checkout(actor,(p_payload->>'request_id')::uuid,p_payload->>'customer_id',p_payload->>'session_id',p_payload->>'session_url'));
 WHEN 'release' THEN RETURN to_jsonb(clipt_private.release_subscription_checkout(actor,p_payload->>'session_id'));
 WHEN 'reconcile' THEN
  -- A signed late callback for a verified erased subscription is acknowledged,
  -- never allowed to recreate its identity or membership. Unknown bindings still fail.
  IF NOT EXISTS(SELECT 1 FROM clipt_private.billing_accounts WHERE user_id=(p_payload->'snapshot'->>'user_id')::uuid)
   AND EXISTS(SELECT 1 FROM clipt_private.retained_records WHERE source_table='billing_accounts'
    AND data->>'subscription_hash'=encode(sha256(convert_to(p_payload->'snapshot'->>'subscription_id','UTF8')),'hex')) THEN RETURN 'false'::jsonb; END IF;
  RETURN to_jsonb(clipt_private.reconcile_subscription(p_payload->>'event_id',(p_payload->>'event_created')::bigint,p_payload->'snapshot'));
 WHEN 'account' THEN RETURN (SELECT to_jsonb(a) FROM clipt_private.billing_accounts a WHERE a.user_id=actor);
 WHEN 'management_reserve' THEN RETURN clipt_private.management_command('reserve',p_payload);
 WHEN 'management_snapshot' THEN RETURN clipt_private.management_command('snapshot',p_payload);
 WHEN 'management_complete' THEN RETURN clipt_private.management_command('complete',p_payload);
 ELSE RAISE EXCEPTION 'Invalid billing action' USING ERRCODE='22023';
 END CASE;
END $$;
COMMIT;
