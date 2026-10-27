-- STAGED eligibility-only patch. No entitlement/financial record changes.
-- Requires reviewed existing Maxed functions; abort if their shape differs.
BEGIN;
DO $$DECLARE definition text; marker text; BEGIN
 definition:=pg_get_functiondef('clipt_private.mega_opportunities(uuid)'::regprocedure);
 marker:='AND NOT p.moderation_hidden';
 IF position(marker IN definition)=0 THEN RAISE EXCEPTION 'Mega discovery requires manual reconciliation'; END IF;
 EXECUTE replace(definition,marker,marker||' AND NOT clipt_private.photo_review_held(p.id)');
 definition:=pg_get_functiondef('clipt_private.redeem_mega(uuid,uuid,timestamptz)'::regprocedure);
 marker:='OR target.moderation_hidden';
 IF position(marker IN definition)=0 THEN RAISE EXCEPTION 'Mega eligibility requires manual reconciliation'; END IF;
 EXECUTE replace(definition,marker,marker||' OR clipt_private.photo_review_held(target.id)');
END $$;
COMMIT;
