BEGIN;
SET LOCAL lock_timeout='5s';
-- Additive billing state; never rewrite existing subscriptions or wallets.
CREATE TABLE clipt_private.billing_accounts (
 user_id uuid PRIMARY KEY REFERENCES auth.users(id),
 customer_id text UNIQUE, subscription_id text UNIQUE,
 membership_row_id uuid UNIQUE,
 paid_tier text CHECK(paid_tier IN ('premium','maxed')),
 paid_start timestamptz, paid_end timestamptz,
 provider_status text NOT NULL DEFAULT 'none', cancel_at_period_end boolean NOT NULL DEFAULT false,
 risk_hold boolean NOT NULL DEFAULT false,
 mega_anchor timestamptz, last_event_created bigint NOT NULL DEFAULT 0,
 CHECK(paid_end IS NULL OR paid_end>paid_start)
);
CREATE TABLE clipt_private.billing_checkouts (
 user_id uuid PRIMARY KEY REFERENCES auth.users(id),
 request_id uuid NOT NULL UNIQUE, plan text NOT NULL CHECK(plan IN ('premium','maxed')),
 session_id text UNIQUE, session_url text, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE clipt_private.billing_events (
 event_id text PRIMARY KEY, user_id uuid NOT NULL REFERENCES auth.users(id),
 subscription_id text NOT NULL, event_created bigint NOT NULL,
 applied_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE clipt_private.billing_management_requests (
 request_id uuid PRIMARY KEY, user_id uuid NOT NULL REFERENCES auth.users(id),
 subscription_id text NOT NULL, action text NOT NULL CHECK(action IN ('cancel','resume','change_plan')),
 plan text CHECK(plan IN ('premium','maxed')), state text NOT NULL DEFAULT 'pending' CHECK(state IN ('pending','complete')),
 provider_parameters jsonb, result jsonb, created_at timestamptz NOT NULL DEFAULT now(),
 CHECK((action='change_plan')=(plan IS NOT NULL)),
 CHECK((state='complete')=(result IS NOT NULL))
);
CREATE UNIQUE INDEX clipt_one_pending_management ON clipt_private.billing_management_requests(user_id) WHERE state='pending';
CREATE TABLE clipt_private.mega_boosts (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES auth.users(id),
 post_id uuid REFERENCES public.posts(id) ON DELETE SET NULL, original_post_id uuid NOT NULL,
 request_id uuid NOT NULL, window_start timestamptz NOT NULL,
 activated_at timestamptz NOT NULL, expires_at timestamptz NOT NULL,
 invalidated_at timestamptz,
 UNIQUE(user_id,request_id), UNIQUE(user_id,window_start),
 CHECK(expires_at=activated_at+interval '24 hours')
);
ALTER TABLE clipt_private.billing_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE clipt_private.billing_checkouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE clipt_private.billing_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE clipt_private.billing_management_requests ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON clipt_private.billing_management_requests FROM PUBLIC,anon,authenticated;
ALTER TABLE clipt_private.mega_boosts ENABLE ROW LEVEL SECURITY;
CREATE INDEX clipt_mega_active_game_lookup ON clipt_private.mega_boosts(expires_at,post_id) WHERE invalidated_at IS NULL;
REVOKE ALL ON clipt_private.billing_accounts,clipt_private.billing_checkouts,
 clipt_private.billing_events,clipt_private.mega_boosts FROM PUBLIC,anon,authenticated;

CREATE FUNCTION clipt_private.reserve_subscription_checkout(p_user uuid,p_request uuid,p_plan text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE account clipt_private.billing_accounts%rowtype; lease clipt_private.billing_checkouts%rowtype;
BEGIN
 IF p_user IS NULL OR p_request IS NULL OR p_plan NOT IN ('premium','maxed') OR p_plan IS NULL THEN
  RAISE EXCEPTION 'Invalid checkout request' USING ERRCODE='22023'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.profiles WHERE id=p_user) THEN
  RAISE EXCEPTION 'Account unavailable' USING ERRCODE='42501'; END IF;
 INSERT INTO clipt_private.billing_accounts(user_id) VALUES(p_user) ON CONFLICT DO NOTHING;
 SELECT * INTO account FROM clipt_private.billing_accounts WHERE user_id=p_user FOR UPDATE;
 IF EXISTS(SELECT 1 FROM clipt_private.billing_management_requests WHERE user_id=p_user AND state='pending') THEN
  RAISE EXCEPTION 'Resolve pending membership management before checkout' USING ERRCODE='23505'; END IF;
 -- Existing public schema has UNIQUE(user_id,plan_id). Preserve legacy rows
 -- and refuse payment BEFORE provider Checkout rather than fail fulfillment.
 IF EXISTS(SELECT 1 FROM public.user_subscriptions s JOIN public.subscription_plans p ON p.id=s.plan_id
  WHERE s.user_id=p_user AND p.clipt_membership_code IN ('premium','maxed')
   AND s.id IS DISTINCT FROM account.membership_row_id) THEN
  RAISE EXCEPTION 'Legacy subscription history requires billing review before checkout' USING ERRCODE='23505'; END IF;
 IF account.risk_hold OR account.provider_status IN ('active','past_due','trialing','incomplete','unpaid','paused')
  OR EXISTS(SELECT 1 FROM public.user_subscriptions WHERE user_id=p_user AND status='active' AND current_period_end>clock_timestamp()) THEN
  RAISE EXCEPTION 'Existing subscription requires management, not duplicate checkout' USING ERRCODE='23505'; END IF;
 SELECT * INTO lease FROM clipt_private.billing_checkouts WHERE user_id=p_user;
 IF FOUND AND (lease.request_id<>p_request OR lease.plan<>p_plan) THEN
  RAISE EXCEPTION 'Checkout already pending; resolve original session first' USING ERRCODE='23505'; END IF;
 INSERT INTO clipt_private.billing_checkouts(user_id,request_id,plan) VALUES(p_user,p_request,p_plan) ON CONFLICT DO NOTHING;
 SELECT * INTO lease FROM clipt_private.billing_checkouts WHERE user_id=p_user;
 RETURN to_jsonb(lease)||jsonb_build_object('customer_id',account.customer_id);
END $$;
CREATE FUNCTION clipt_private.bind_subscription_checkout(p_user uuid,p_request uuid,p_customer text,p_session text,p_url text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE account clipt_private.billing_accounts%rowtype;
BEGIN
 SELECT * INTO account FROM clipt_private.billing_accounts WHERE user_id=p_user FOR UPDATE;
 IF NOT FOUND OR (account.customer_id IS NOT NULL AND account.customer_id<>p_customer) THEN
  RAISE EXCEPTION 'Customer binding conflict' USING ERRCODE='23505'; END IF;
 IF p_customer IS NULL OR p_session IS NULL OR p_url IS NULL OR p_customer !~ '^cus_[A-Za-z0-9]+$' OR p_session !~ '^cs_test_[A-Za-z0-9]+$' OR p_url NOT LIKE 'https://checkout.stripe.com/%' THEN
  RAISE EXCEPTION 'Invalid test checkout' USING ERRCODE='22023'; END IF;
 UPDATE clipt_private.billing_checkouts SET session_id=p_session,session_url=p_url WHERE user_id=p_user AND request_id=p_request;
 IF NOT FOUND THEN RAISE EXCEPTION 'Checkout reservation missing'; END IF;
 UPDATE clipt_private.billing_accounts SET customer_id=p_customer WHERE user_id=p_user;
 RETURN true;
END $$;
-- Only verified provider expiry may release a checkout; there is no timer that
-- can race a completed payment or an uncertain provider response.
CREATE FUNCTION clipt_private.release_subscription_checkout(p_user uuid,p_session text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 PERFORM 1 FROM clipt_private.billing_accounts WHERE user_id=p_user FOR UPDATE;
 DELETE FROM clipt_private.billing_checkouts WHERE user_id=p_user AND session_id=p_session;
 RETURN FOUND;
END $$;
CREATE FUNCTION clipt_private.reconcile_subscription(p_event text,p_created bigint,p_snapshot jsonb)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE actor uuid:=(p_snapshot->>'user_id')::uuid; account clipt_private.billing_accounts%rowtype;
 tier text:=p_snapshot->>'paid_tier'; start_at timestamptz:=(p_snapshot->>'paid_start')::timestamptz;
 end_at timestamptz:=(p_snapshot->>'paid_end')::timestamptz; plan_id uuid; row_id uuid;
BEGIN
 SELECT * INTO account FROM clipt_private.billing_accounts WHERE user_id=actor FOR UPDATE;
 IF NOT FOUND OR account.customer_id IS DISTINCT FROM p_snapshot->>'customer_id' THEN
  RAISE EXCEPTION 'Unknown customer binding' USING ERRCODE='42501'; END IF;
 IF account.subscription_id IS NOT NULL AND account.subscription_id<>p_snapshot->>'subscription_id'
  AND account.provider_status NOT IN ('canceled','incomplete_expired') THEN
  RAISE EXCEPTION 'Duplicate subscription requires review' USING ERRCODE='23505'; END IF;
 IF p_created IS NULL OR p_created<0 OR p_event IS NULL OR p_snapshot->>'subscription_id' IS NULL
  OR p_snapshot->>'status' IS NULL OR p_snapshot->>'status' NOT IN ('active','past_due','trialing','incomplete','incomplete_expired','canceled','unpaid','paused')
  OR p_snapshot->>'subscription_id' !~ '^sub_[A-Za-z0-9]+$' OR p_event !~ '^evt_[A-Za-z0-9]+$' THEN
  RAISE EXCEPTION 'Invalid provider identity' USING ERRCODE='22023'; END IF;
 IF EXISTS(SELECT 1 FROM clipt_private.billing_events WHERE event_id=p_event) THEN RETURN false; END IF;
 INSERT INTO clipt_private.billing_events(event_id,user_id,subscription_id,event_created)
 VALUES(p_event,actor,p_snapshot->>'subscription_id',p_created);
 IF p_created<account.last_event_created THEN
  -- A delayed, verified refund/dispute still revokes benefits. Never replay its
  -- older tier/status over a newer snapshot.
  IF coalesce((p_snapshot->>'risk_hold')::boolean,false) THEN
   UPDATE clipt_private.billing_accounts SET risk_hold=true,paid_end=least(paid_end,clock_timestamp()) WHERE user_id=actor;
   UPDATE public.user_subscriptions SET status='canceled',current_period_end=least(current_period_end,clock_timestamp()),updated_at=clock_timestamp()
    WHERE id=account.membership_row_id AND user_id=actor;
   RETURN true;
  END IF;
  RETURN false;
 END IF;
 IF account.subscription_id IS DISTINCT FROM p_snapshot->>'subscription_id' THEN
  account.paid_tier:=NULL;account.paid_start:=NULL;account.paid_end:=NULL;
 END IF;
 -- The server adapter supplies a paid invoice period, never an event's browser metadata alone.
 IF tier IS NOT NULL THEN
  IF tier NOT IN ('premium','maxed') OR start_at IS NULL OR end_at IS NULL OR end_at<=start_at OR start_at>clock_timestamp() THEN
   RAISE EXCEPTION 'Invalid paid period' USING ERRCODE='22023'; END IF;
  IF account.paid_end IS NULL OR end_at>=account.paid_end THEN
   account.paid_tier:=tier;account.paid_start:=start_at;account.paid_end:=end_at;
   IF tier='maxed' AND account.mega_anchor IS NULL THEN account.mega_anchor:=start_at; END IF;
  END IF;
 END IF;
 account.provider_status:=p_snapshot->>'status';
 account.cancel_at_period_end:=coalesce((p_snapshot->>'cancel_at_period_end')::boolean,false);
 -- Risk cannot be cleared by an unrelated renewal or a stale webhook.
 account.risk_hold:=account.risk_hold OR coalesce((p_snapshot->>'risk_hold')::boolean,false);
 IF account.provider_status IN ('canceled','incomplete_expired') OR account.risk_hold THEN
  account.paid_end:=least(account.paid_end,clock_timestamp());
 END IF;
 UPDATE clipt_private.billing_accounts SET subscription_id=p_snapshot->>'subscription_id',
 paid_tier=account.paid_tier,paid_start=account.paid_start,paid_end=account.paid_end,
 provider_status=account.provider_status,cancel_at_period_end=account.cancel_at_period_end,
 risk_hold=account.risk_hold,mega_anchor=account.mega_anchor,last_event_created=p_created WHERE user_id=actor;
 IF account.paid_tier IS NOT NULL THEN
  SELECT id INTO plan_id FROM public.subscription_plans WHERE clipt_membership_code=account.paid_tier AND is_active;
  IF plan_id IS NULL THEN RAISE EXCEPTION 'Approved plan unavailable'; END IF;
  row_id:=coalesce(account.membership_row_id,gen_random_uuid());
  INSERT INTO public.user_subscriptions(id,user_id,plan_id,status,current_period_start,current_period_end,cancel_at_period_end)
  VALUES(row_id,actor,plan_id,CASE WHEN account.risk_hold OR account.provider_status NOT IN ('active','past_due') THEN 'canceled' ELSE 'active' END,
   account.paid_start,account.paid_end,account.cancel_at_period_end)
  ON CONFLICT(id) DO UPDATE SET plan_id=excluded.plan_id,status=excluded.status,
   current_period_start=excluded.current_period_start,current_period_end=excluded.current_period_end,
   cancel_at_period_end=excluded.cancel_at_period_end,updated_at=clock_timestamp();
  UPDATE clipt_private.billing_accounts SET membership_row_id=row_id WHERE user_id=actor;
 END IF;
 DELETE FROM clipt_private.billing_checkouts WHERE user_id=actor;
 RETURN true;
END $$;

CREATE FUNCTION clipt_private.mega_status() RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE a clipt_private.billing_accounts%rowtype; window_at timestamptz; used boolean:=false; now_at timestamptz:=statement_timestamp();
BEGIN
 IF auth.uid() IS NULL OR NOT clipt_private.account_available() OR coalesce((auth.jwt()->>'is_anonymous')::boolean,false) THEN
  RAISE EXCEPTION 'Verified account required' USING ERRCODE='42501'; END IF;
 SELECT * INTO a FROM clipt_private.billing_accounts WHERE user_id=auth.uid();
 IF a.mega_anchor IS NOT NULL AND now_at>=a.mega_anchor THEN
  window_at:=a.mega_anchor+floor(extract(epoch FROM (now_at-a.mega_anchor))/604800)*interval '7 days';
  SELECT EXISTS(SELECT 1 FROM clipt_private.mega_boosts WHERE user_id=auth.uid() AND window_start=window_at) INTO used;
 END IF;
 RETURN jsonb_build_object('available',coalesce(a.paid_tier='maxed' AND a.provider_status IN ('active','past_due')
  AND window_at IS NOT NULL AND NOT a.risk_hold AND a.paid_start<=now_at AND a.paid_end>now_at AND NOT used,false),
  'used',used,'window_start',window_at,'resets_at',window_at+interval '7 days','duration_seconds',86400,'rollover',false);
END $$;
CREATE FUNCTION clipt_private.redeem_mega(p_post uuid,p_request uuid,p_window timestamptz)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE actor uuid:=auth.uid(); target public.posts%rowtype; prior clipt_private.mega_boosts%rowtype;
 state jsonb; now_at timestamptz; result uuid:=gen_random_uuid();
BEGIN
 IF actor IS NULL OR p_post IS NULL OR p_request IS NULL OR p_window IS NULL OR NOT clipt_private.account_available()
  OR coalesce((auth.jwt()->>'is_anonymous')::boolean,false) THEN RAISE EXCEPTION 'Verified account required' USING ERRCODE='42501'; END IF;
 SELECT * INTO target FROM public.posts WHERE id=p_post FOR UPDATE;
 -- Same post-before-wallet order as existing Boost activation and moderation.
 INSERT INTO public.token_wallets(user_id) VALUES(actor) ON CONFLICT DO NOTHING;
 PERFORM 1 FROM public.token_wallets WHERE user_id=actor FOR UPDATE;
 PERFORM 1 FROM clipt_private.billing_accounts WHERE user_id=actor FOR UPDATE;
 SELECT * INTO prior FROM clipt_private.mega_boosts WHERE user_id=actor AND request_id=p_request;
 IF FOUND THEN
  IF prior.original_post_id<>p_post OR prior.window_start<>p_window THEN RAISE EXCEPTION 'Idempotency conflict' USING ERRCODE='22023'; END IF;
  RETURN prior.id;
 END IF;
 state:=clipt_private.mega_status();now_at:=clock_timestamp();
 IF state->>'available'<>'true' OR (state->>'window_start')::timestamptz IS DISTINCT FROM p_window
  OR now_at>=(state->>'resets_at')::timestamptz
  OR NOT EXISTS(SELECT 1 FROM clipt_private.billing_accounts WHERE user_id=actor AND paid_start<=now_at AND paid_end>now_at) THEN
  RAISE EXCEPTION 'Weekly Mega entitlement unavailable' USING ERRCODE='42501'; END IF;
 IF target.id IS NULL OR target.user_id<>actor OR target.is_published IS NOT TRUE OR target.moderation_hidden
  OR target.is_premium IS TRUE OR target.is_subscriber_only IS TRUE OR target.required_tier_id IS NOT NULL
  OR target.game_id IS NULL OR target.created_at>now_at OR target.post_type NOT IN ('clipt','clipts','video','photo')
  OR (nullif(target.video_url,'') IS NULL AND nullif(target.image_url,'') IS NULL) THEN
  RAISE EXCEPTION 'Clipt ineligible for Mega Boost' USING ERRCODE='42501'; END IF;
 IF EXISTS(SELECT 1 FROM public.content_boosts WHERE post_id=p_post AND invalidated_at IS NULL AND expires_at>now_at)
  OR EXISTS(SELECT 1 FROM clipt_private.mega_boosts WHERE post_id=p_post AND invalidated_at IS NULL AND expires_at>now_at) THEN
  RAISE EXCEPTION 'Clipt already boosted' USING ERRCODE='23505'; END IF;
 INSERT INTO clipt_private.mega_boosts(id,user_id,post_id,original_post_id,request_id,window_start,activated_at,expires_at)
 VALUES(result,actor,p_post,p_post,p_request,p_window,now_at,now_at+interval '24 hours');
 RETURN result;
END $$;
-- No browser can read private bindings or call provider reconciliation.
DO $$ DECLARE f record; BEGIN
 FOR f IN SELECT p.oid::regprocedure AS signature FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
 WHERE n.nspname='clipt_private' AND p.proname IN ('reserve_subscription_checkout','bind_subscription_checkout','release_subscription_checkout','reconcile_subscription') LOOP
  EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC,anon,authenticated',f.signature);
  EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role',f.signature);
 END LOOP;
END $$;
REVOKE ALL ON FUNCTION clipt_private.mega_status(),clipt_private.redeem_mega(uuid,uuid,timestamptz) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION clipt_private.mega_status(),clipt_private.redeem_mega(uuid,uuid,timestamptz) TO authenticated;
CREATE FUNCTION public.get_weekly_mega_status() RETURNS jsonb LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$ SELECT clipt_private.mega_status(); $$;
CREATE FUNCTION public.redeem_weekly_mega(p_post uuid,p_request uuid,p_window timestamptz) RETURNS uuid LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$ SELECT clipt_private.redeem_mega(p_post,p_request,p_window); $$;
REVOKE ALL ON FUNCTION public.get_weekly_mega_status(),public.redeem_weekly_mega(uuid,uuid,timestamptz) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.get_weekly_mega_status(),public.redeem_weekly_mega(uuid,uuid,timestamptz) TO authenticated;

-- Short database reservations serialize different operations without holding
-- a database transaction open over Stripe HTTP calls. Uncertain outcomes never
-- auto-expire into a different action. Same-request retries replay fixed data.
CREATE FUNCTION clipt_private.management_command(p_stage text,p_payload jsonb) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE actor uuid:=(p_payload->>'user_id')::uuid; req uuid:=(p_payload->>'request_id')::uuid;
 account clipt_private.billing_accounts%rowtype; operation clipt_private.billing_management_requests%rowtype;
 action text:=p_payload->>'action'; plan text:=p_payload->>'plan';
BEGIN
 IF actor IS NULL OR req IS NULL THEN RAISE EXCEPTION 'Invalid management identity' USING ERRCODE='22023'; END IF;
 SELECT * INTO account FROM clipt_private.billing_accounts WHERE user_id=actor FOR UPDATE;
 IF NOT FOUND OR account.subscription_id IS NULL OR NOT EXISTS(SELECT 1 FROM public.profiles WHERE id=actor) THEN
  RAISE EXCEPTION 'Membership unavailable' USING ERRCODE='42501'; END IF;
 SELECT * INTO operation FROM clipt_private.billing_management_requests WHERE request_id=req FOR UPDATE;
 IF FOUND AND operation.user_id<>actor THEN RAISE EXCEPTION 'Request ownership conflict' USING ERRCODE='42501'; END IF;
 IF p_stage='reserve' THEN
  IF action IS NULL OR action NOT IN ('cancel','resume','change_plan')
   OR (action='change_plan' AND (plan IS NULL OR plan NOT IN ('premium','maxed')))
   OR (action<>'change_plan' AND plan IS NOT NULL) THEN RAISE EXCEPTION 'Invalid management action' USING ERRCODE='22023'; END IF;
  IF operation.request_id IS NOT NULL THEN
   IF operation.action<>action OR operation.plan IS DISTINCT FROM plan THEN
    RAISE EXCEPTION 'Management idempotency conflict' USING ERRCODE='22023'; END IF;
   RETURN to_jsonb(operation);
  END IF;
  IF account.risk_hold AND action<>'cancel' THEN RAISE EXCEPTION 'Membership requires review' USING ERRCODE='42501'; END IF;
  IF action='change_plan' AND EXISTS(SELECT 1 FROM public.user_subscriptions s JOIN public.subscription_plans p ON p.id=s.plan_id
    WHERE s.user_id=actor AND p.clipt_membership_code=plan AND s.id IS DISTINCT FROM account.membership_row_id) THEN
   RAISE EXCEPTION 'Legacy target-plan history requires billing review before plan change' USING ERRCODE='23505'; END IF;
  IF EXISTS(SELECT 1 FROM clipt_private.billing_management_requests WHERE user_id=actor AND state='pending') THEN
   RAISE EXCEPTION 'Resolve original pending membership request first' USING ERRCODE='23505'; END IF;
  INSERT INTO clipt_private.billing_management_requests(request_id,user_id,subscription_id,action,plan)
   VALUES(req,actor,account.subscription_id,action,plan) RETURNING * INTO operation;
 ELSIF p_stage='snapshot' THEN
  IF operation.request_id IS NULL OR operation.subscription_id<>account.subscription_id
   OR jsonb_typeof(p_payload->'parameters') IS DISTINCT FROM 'object' THEN
   RAISE EXCEPTION 'Management snapshot unavailable' USING ERRCODE='22023'; END IF;
  IF operation.provider_parameters IS NULL THEN
   UPDATE clipt_private.billing_management_requests SET provider_parameters=p_payload->'parameters' WHERE request_id=req RETURNING * INTO operation;
  END IF;
 ELSIF p_stage='complete' THEN
  IF operation.request_id IS NULL OR operation.subscription_id<>account.subscription_id
   OR jsonb_typeof(p_payload->'result') IS DISTINCT FROM 'object' THEN RAISE EXCEPTION 'Management confirmation unavailable' USING ERRCODE='22023'; END IF;
  IF operation.state<>'complete' THEN
   UPDATE clipt_private.billing_management_requests SET state='complete',result=p_payload->'result' WHERE request_id=req RETURNING * INTO operation;
  END IF;
 ELSE RAISE EXCEPTION 'Invalid management stage' USING ERRCODE='22023';
 END IF;
 RETURN to_jsonb(operation);
END $$;
REVOKE ALL ON FUNCTION clipt_private.management_command(text,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION clipt_private.management_command(text,jsonb) TO service_role;
CREATE FUNCTION clipt_private.billing_command(p_action text,p_payload jsonb) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE actor uuid:=(p_payload->>'user_id')::uuid;
BEGIN
 CASE p_action
 WHEN 'reserve' THEN RETURN clipt_private.reserve_subscription_checkout(actor,(p_payload->>'request_id')::uuid,p_payload->>'plan');
 WHEN 'bind' THEN RETURN to_jsonb(clipt_private.bind_subscription_checkout(actor,(p_payload->>'request_id')::uuid,p_payload->>'customer_id',p_payload->>'session_id',p_payload->>'session_url'));
 WHEN 'release' THEN RETURN to_jsonb(clipt_private.release_subscription_checkout(actor,p_payload->>'session_id'));
 WHEN 'reconcile' THEN RETURN to_jsonb(clipt_private.reconcile_subscription(p_payload->>'event_id',(p_payload->>'event_created')::bigint,p_payload->'snapshot'));
 WHEN 'account' THEN RETURN (SELECT to_jsonb(a) FROM clipt_private.billing_accounts a WHERE a.user_id=actor);
 WHEN 'management_reserve' THEN RETURN clipt_private.management_command('reserve',p_payload);
 WHEN 'management_snapshot' THEN RETURN clipt_private.management_command('snapshot',p_payload);
 WHEN 'management_complete' THEN RETURN clipt_private.management_command('complete',p_payload);
 ELSE RAISE EXCEPTION 'Invalid billing action' USING ERRCODE='22023';
 END CASE;
END $$;
REVOKE ALL ON FUNCTION clipt_private.billing_command(text,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION clipt_private.billing_command(text,jsonb) TO service_role;
CREATE FUNCTION public.sandbox_billing_command(p_action text,p_payload jsonb) RETURNS jsonb
LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$ SELECT clipt_private.billing_command(p_action,p_payload); $$;
REVOKE ALL ON FUNCTION public.sandbox_billing_command(text,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.sandbox_billing_command(text,jsonb) TO service_role;

CREATE FUNCTION clipt_private.invalidate_mega() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF TG_OP='DELETE' THEN UPDATE clipt_private.mega_boosts SET invalidated_at=coalesce(invalidated_at,clock_timestamp()) WHERE post_id=OLD.id; RETURN OLD; END IF;
 IF NEW.user_id IS DISTINCT FROM OLD.user_id OR NEW.game_id IS DISTINCT FROM OLD.game_id
  OR NEW.video_url IS DISTINCT FROM OLD.video_url OR NEW.image_url IS DISTINCT FROM OLD.image_url OR NEW.post_type IS DISTINCT FROM OLD.post_type
  OR NEW.is_published IS NOT TRUE OR NEW.moderation_hidden OR NEW.is_premium IS TRUE
  OR NEW.is_subscriber_only IS TRUE OR NEW.required_tier_id IS NOT NULL THEN
  UPDATE clipt_private.mega_boosts SET invalidated_at=coalesce(invalidated_at,clock_timestamp()) WHERE post_id=NEW.id;
 END IF; RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION clipt_private.invalidate_mega() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER clipt_mega_content_invalidation BEFORE UPDATE OR DELETE ON public.posts FOR EACH ROW EXECUTE FUNCTION clipt_private.invalidate_mega();
CREATE FUNCTION clipt_private.guard_mega_stack() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF NEW.invalidated_at IS NULL AND NEW.expires_at>clock_timestamp() THEN
  PERFORM 1 FROM public.posts WHERE id=NEW.post_id FOR UPDATE;
  IF EXISTS(SELECT 1 FROM clipt_private.mega_boosts WHERE post_id=NEW.post_id AND invalidated_at IS NULL AND expires_at>clock_timestamp()) THEN
   RAISE EXCEPTION 'Clipt already Mega Boosted' USING ERRCODE='23505';
  END IF;
 END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION clipt_private.guard_mega_stack() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER clipt_no_boost_over_active_mega BEFORE INSERT OR UPDATE ON public.content_boosts
 FOR EACH ROW EXECUTE FUNCTION clipt_private.guard_mega_stack();
-- Existing erasure intentionally reviews only its frozen public-table manifest.
-- Reject before profile/data erasure, rather than strand an Auth deletion on new
-- private billing FKs. Provider shutdown/financial retention needs explicit review.
CREATE FUNCTION clipt_private.guard_billing_erasure() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF EXISTS(SELECT 1 FROM clipt_private.billing_accounts WHERE user_id=OLD.id AND customer_id IS NOT NULL) THEN
  RAISE EXCEPTION 'Provider billing cleanup and retention review required' USING ERRCODE='P0001';
 END IF;
 DELETE FROM clipt_private.billing_checkouts WHERE user_id=OLD.id;
 DELETE FROM clipt_private.billing_management_requests WHERE user_id=OLD.id;
 DELETE FROM clipt_private.billing_accounts WHERE user_id=OLD.id AND customer_id IS NULL;
 RETURN OLD;
END $$;
REVOKE ALL ON FUNCTION clipt_private.guard_billing_erasure() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER clipt_billing_erasure_guard BEFORE DELETE ON public.profiles
 FOR EACH ROW EXECUTE FUNCTION clipt_private.guard_billing_erasure();
CREATE FUNCTION clipt_private.mega_opportunities(p_game uuid)
RETURNS TABLE(boost_id uuid,post_id uuid,package_code text,expires_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT m.id,m.post_id,'weekly_mega'::text,m.expires_at
 FROM clipt_private.mega_boosts m JOIN public.posts p ON p.id=m.post_id JOIN clipt_private.billing_accounts a ON a.user_id=m.user_id
 WHERE auth.uid() IS NOT NULL AND clipt_private.account_available() AND NOT coalesce((auth.jwt()->>'is_anonymous')::boolean,false)
  AND m.invalidated_at IS NULL AND m.expires_at>statement_timestamp() AND m.activated_at<=statement_timestamp()
  AND a.paid_tier='maxed' AND a.paid_start<=statement_timestamp() AND a.paid_end>statement_timestamp() AND NOT a.risk_hold AND a.provider_status IN ('active','past_due')
  AND p.user_id=m.user_id AND p.is_published AND NOT p.moderation_hidden AND p.is_premium IS NOT TRUE
  AND p.is_subscriber_only IS NOT TRUE AND p.required_tier_id IS NULL AND NOT clipt_private.blocked_with(p.user_id)
  AND ((p_game IS NOT NULL AND p.game_id=p_game) OR (p_game IS NULL AND auth.uid() IN (
    SELECT f.follower_id FROM public.follows f WHERE f.following_id=m.user_id AND f.follower_id<>m.user_id
    ORDER BY f.created_at DESC,f.follower_id LIMIT 50)))
 ORDER BY m.activated_at DESC,m.id LIMIT 20;
$$;
REVOKE ALL ON FUNCTION clipt_private.mega_opportunities(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION clipt_private.mega_opportunities(uuid) TO authenticated;
CREATE OR REPLACE FUNCTION public.get_boosted_discovery(p_game_id uuid DEFAULT NULL)
RETURNS TABLE(boost_id uuid,post_id uuid,package_code text,expires_at timestamptz,caption text,image_url text)
LANGUAGE sql STABLE SECURITY INVOKER SET search_path='' AS $$
 SELECT b.boost_id,b.post_id,b.package_code,b.expires_at,p.content,p.image_url
 FROM (SELECT * FROM clipt_private.boost_opportunities(p_game_id)
       UNION ALL SELECT * FROM clipt_private.mega_opportunities(p_game_id)) b
 JOIN public.posts p ON p.id=b.post_id;
$$;
COMMIT;
