-- Requires the separately committed notification enum addition: system_alert.
-- No external delivery provider, credentials, user text, URLs or error stacks.
CREATE TABLE clipt_private.operational_alert_recipients (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE
);
CREATE TABLE clipt_private.operational_alert_rates (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  window_start timestamptz NOT NULL,
  requests integer NOT NULL CHECK (requests BETWEEN 1 AND 5),
  PRIMARY KEY(user_id,window_start)
);
CREATE TABLE clipt_private.operational_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  kind text NOT NULL CHECK(kind IN ('render_failure','cron_failure','verification')),
  route_key text NOT NULL CHECK(route_key IN ('feed','profile','messages','discovery','settings','create','other')),
  created_at timestamptz NOT NULL DEFAULT statement_timestamp(),
  last_seen_at timestamptz NOT NULL DEFAULT statement_timestamp(),
  occurrences integer NOT NULL DEFAULT 1 CHECK(occurrences>0),
  acknowledged_at timestamptz,
  acknowledged_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);
CREATE INDEX operational_alerts_recent ON clipt_private.operational_alerts(last_seen_at DESC);
ALTER TABLE clipt_private.operational_alert_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE clipt_private.operational_alert_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE clipt_private.operational_alerts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON clipt_private.operational_alert_recipients,
  clipt_private.operational_alert_rates,clipt_private.operational_alerts FROM PUBLIC,anon,authenticated;

CREATE FUNCTION clipt_private.deliver_operational_alert(target_alert uuid) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $alert$
DECLARE item clipt_private.operational_alerts; text_label text;
BEGIN
  SELECT * INTO item FROM clipt_private.operational_alerts WHERE id=target_alert;
  IF NOT FOUND THEN RAISE EXCEPTION 'Alert not found' USING ERRCODE='P0002'; END IF;
  text_label:=CASE item.kind WHEN 'render_failure' THEN 'CLIPT operations: a screen failure was reported.'
    WHEN 'cron_failure' THEN 'CLIPT operations: a scheduled task needs attention.'
    ELSE 'CLIPT operations: alert delivery verification.' END;
  PERFORM pg_advisory_xact_lock(hashtextextended('clipt-operations-delivery',0));
  INSERT INTO public.notifications(user_id,actor_id,type,content,resource_id,resource_type)
  SELECT DISTINCT r.user_id,NULL::uuid,'system_alert'::public.notification_type,text_label,item.id,'operational_alert'
  FROM clipt_private.operational_alert_recipients r
  JOIN auth.users u ON u.id=r.user_id JOIN public.profiles p ON p.id=r.user_id
  JOIN public.user_roles role ON role.user_id=r.user_id AND role.role IN ('admin','moderator')
  WHERE u.email_confirmed_at IS NOT NULL AND NOT coalesce(u.is_anonymous,false)
    AND u.deleted_at IS NULL AND (u.banned_until IS NULL OR u.banned_until<=statement_timestamp())
    AND NOT EXISTS(SELECT 1 FROM public.notifications n WHERE n.user_id=r.user_id
      AND n.type='system_alert' AND n.resource_type='operational_alert' AND n.content=text_label
      AND n.created_at>statement_timestamp()-interval '5 minutes');
END $alert$;
REVOKE ALL ON FUNCTION clipt_private.deliver_operational_alert(uuid) FROM PUBLIC,anon,authenticated;

CREATE FUNCTION clipt_private.report_operational_issue(route_key text) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $alert$
DECLARE actor uuid:=auth.uid(); counter integer; receipt uuid;
BEGIN
  IF actor IS NULL OR NOT clipt_private.account_available() THEN
    RAISE EXCEPTION 'Authenticated account required' USING ERRCODE='42501';
  END IF;
  IF route_key IS NULL OR route_key NOT IN ('feed','profile','messages','discovery','settings','create','other') THEN
    RAISE EXCEPTION 'Invalid route category' USING ERRCODE='22023';
  END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended('clipt-operations:'||actor::text,0));
  SELECT requests INTO counter FROM clipt_private.operational_alert_rates
    WHERE user_id=actor AND window_start=date_trunc('minute',statement_timestamp());
  IF coalesce(counter,0)>=5 THEN RAISE EXCEPTION 'Please wait before reporting again' USING ERRCODE='P0001'; END IF;
  INSERT INTO clipt_private.operational_alert_rates(user_id,window_start,requests)
    VALUES(actor,date_trunc('minute',statement_timestamp()),1)
    ON CONFLICT(user_id,window_start) DO UPDATE SET requests=operational_alert_rates.requests+1;
  SELECT id INTO receipt FROM clipt_private.operational_alerts a WHERE a.actor_id=actor
    AND a.kind='render_failure' AND a.route_key=report_operational_issue.route_key
    AND a.created_at>statement_timestamp()-interval '5 minutes'
    ORDER BY a.created_at DESC LIMIT 1;
  IF receipt IS NULL THEN
    INSERT INTO clipt_private.operational_alerts(actor_id,kind,route_key)
      VALUES(actor,'render_failure',route_key) RETURNING id INTO receipt;
  ELSE
    UPDATE clipt_private.operational_alerts SET last_seen_at=statement_timestamp(),occurrences=occurrences+1
      WHERE id=receipt;
  END IF;
  PERFORM clipt_private.deliver_operational_alert(receipt);
  RETURN receipt;
END $alert$;
REVOKE ALL ON FUNCTION clipt_private.report_operational_issue(text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION clipt_private.report_operational_issue(text) TO authenticated;
CREATE FUNCTION public.report_operational_issue(route_key text) RETURNS uuid
LANGUAGE sql SECURITY INVOKER SET search_path='' AS $alert$
  SELECT clipt_private.report_operational_issue(route_key);
$alert$;
REVOKE ALL ON FUNCTION public.report_operational_issue(text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.report_operational_issue(text) TO authenticated;

CREATE FUNCTION clipt_private.list_operational_alerts()
RETURNS TABLE(id uuid,kind text,route_key text,created_at timestamptz,last_seen_at timestamptz,
  occurrences integer,acknowledged boolean)
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $alert$
BEGIN
  IF NOT clipt_private.account_available() OR NOT EXISTS(SELECT 1 FROM public.user_roles r
    WHERE r.user_id=auth.uid() AND r.role IN ('admin','moderator')) THEN
    RAISE EXCEPTION 'Moderator role required' USING ERRCODE='42501';
  END IF;
  RETURN QUERY SELECT a.id,a.kind,a.route_key,a.created_at,a.last_seen_at,a.occurrences,
    a.acknowledged_at IS NOT NULL FROM clipt_private.operational_alerts a
    WHERE a.created_at>statement_timestamp()-interval '14 days'
    ORDER BY a.last_seen_at DESC,a.id DESC LIMIT 100;
END $alert$;
REVOKE ALL ON FUNCTION clipt_private.list_operational_alerts() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION clipt_private.list_operational_alerts() TO authenticated;
CREATE FUNCTION public.list_operational_alerts()
RETURNS TABLE(id uuid,kind text,route_key text,created_at timestamptz,last_seen_at timestamptz,
  occurrences integer,acknowledged boolean)
LANGUAGE sql SECURITY INVOKER SET search_path='' AS $alert$
  SELECT * FROM clipt_private.list_operational_alerts();
$alert$;
REVOKE ALL ON FUNCTION public.list_operational_alerts() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.list_operational_alerts() TO authenticated;

CREATE FUNCTION clipt_private.ack_operational_alert(alert_id uuid) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $alert$
DECLARE receipt uuid;
BEGIN
  IF NOT clipt_private.account_available() OR NOT EXISTS(SELECT 1 FROM public.user_roles r
    WHERE r.user_id=auth.uid() AND r.role IN ('admin','moderator')) THEN
    RAISE EXCEPTION 'Moderator role required' USING ERRCODE='42501';
  END IF;
  UPDATE clipt_private.operational_alerts SET acknowledged_at=coalesce(acknowledged_at,statement_timestamp()),
    acknowledged_by=coalesce(acknowledged_by,auth.uid()) WHERE id=alert_id RETURNING id INTO receipt;
  IF receipt IS NULL THEN RAISE EXCEPTION 'Alert not found' USING ERRCODE='P0002'; END IF;
  RETURN receipt;
END $alert$;
REVOKE ALL ON FUNCTION clipt_private.ack_operational_alert(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION clipt_private.ack_operational_alert(uuid) TO authenticated;
CREATE FUNCTION public.ack_operational_alert(alert_id uuid) RETURNS uuid
LANGUAGE sql SECURITY INVOKER SET search_path='' AS $alert$
  SELECT clipt_private.ack_operational_alert(alert_id);
$alert$;
REVOKE ALL ON FUNCTION public.ack_operational_alert(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.ack_operational_alert(uuid) TO authenticated;

CREATE FUNCTION clipt_private.check_operational_health() RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $alert$
DECLARE receipt uuid;
BEGIN
  IF EXISTS(SELECT 1 FROM cron.job_run_details d JOIN cron.job j ON j.jobid=d.jobid
    WHERE j.active AND j.jobname<>'clipt-operations-watchdog' AND d.status='failed'
      AND d.start_time>statement_timestamp()-interval '15 minutes') THEN
    PERFORM pg_advisory_xact_lock(hashtextextended('clipt-operations-health',0));
    IF NOT EXISTS(SELECT 1 FROM clipt_private.operational_alerts
      WHERE kind='cron_failure' AND created_at>statement_timestamp()-interval '15 minutes') THEN
      INSERT INTO clipt_private.operational_alerts(kind,route_key) VALUES('cron_failure','other') RETURNING id INTO receipt;
      PERFORM clipt_private.deliver_operational_alert(receipt);
    END IF;
  END IF;
  DELETE FROM clipt_private.operational_alert_rates WHERE window_start<statement_timestamp()-interval '1 hour';
  DELETE FROM clipt_private.operational_alerts WHERE created_at<statement_timestamp()-interval '14 days';
  DELETE FROM public.notifications WHERE type='system_alert' AND resource_type='operational_alert'
    AND created_at<statement_timestamp()-interval '14 days';
END $alert$;
REVOKE ALL ON FUNCTION clipt_private.check_operational_health() FROM PUBLIC,anon,authenticated;

-- Exact confirmed operator lookup; no existing accounts are granted staff roles.
INSERT INTO clipt_private.operational_alert_recipients(user_id)
SELECT u.id FROM auth.users u JOIN public.profiles p ON p.id=u.id
WHERE lower(u.email)='beecher@cliptgaming.com' AND u.email_confirmed_at IS NOT NULL
  AND NOT coalesce(u.is_anonymous,false) AND u.deleted_at IS NULL
  AND (u.banned_until IS NULL OR u.banned_until<=statement_timestamp())
  AND (SELECT count(*) FROM auth.users WHERE lower(email)='beecher@cliptgaming.com')=1
  AND EXISTS(SELECT 1 FROM public.user_roles r WHERE r.user_id=u.id AND r.role IN ('admin','moderator'))
ON CONFLICT DO NOTHING;
