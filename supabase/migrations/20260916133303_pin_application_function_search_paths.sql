BEGIN;
-- Preserve existing public/extension lookups, exclude caller-controlled schemas
-- and put pg_temp last so temporary relations cannot shadow application tables.
REVOKE CREATE ON SCHEMA public, extensions FROM PUBLIC, anon, authenticated;
DO $migration$
DECLARE f record;
BEGIN
  FOR f IN SELECT p.oid::regprocedure AS signature FROM pg_proc p
    WHERE p.pronamespace='public'::regnamespace AND p.prokind='f'
      AND NOT EXISTS (SELECT 1 FROM unnest(p.proconfig) c WHERE c LIKE 'search_path=%')
      AND NOT EXISTS (SELECT 1 FROM pg_depend d WHERE d.objid=p.oid AND d.classid='pg_proc'::regclass AND d.deptype='e')
  LOOP
    EXECUTE format('ALTER FUNCTION %s SET search_path = pg_catalog, public, extensions, pg_temp',f.signature);
  END LOOP;
END $migration$;

CREATE OR REPLACE FUNCTION public.check_chat_rate_limit(p_user_id uuid,p_stream_id uuid,p_limit integer DEFAULT 20,p_window_seconds integer DEFAULT 60)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $function$
DECLARE current_count integer;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() IS DISTINCT FROM p_user_id THEN
    RAISE EXCEPTION 'Not authorized' USING ERRCODE='42501';
  END IF;
  IF p_stream_id IS NULL OR p_limit IS NULL OR p_window_seconds IS NULL
    OR p_limit NOT BETWEEN 1 AND 20 OR p_window_seconds NOT BETWEEN 60 AND 3600 THEN
    RAISE EXCEPTION 'Invalid rate limit' USING ERRCODE='22023';
  END IF;
  INSERT INTO public.chat_rate_limits(user_id,stream_id,message_count,window_start)
    VALUES(p_user_id,p_stream_id,1,now())
    ON CONFLICT(user_id,stream_id) DO UPDATE SET
      message_count=CASE WHEN chat_rate_limits.window_start <= now()-make_interval(secs=>p_window_seconds) THEN 1 ELSE chat_rate_limits.message_count+1 END,
      window_start=CASE WHEN chat_rate_limits.window_start <= now()-make_interval(secs=>p_window_seconds) THEN now() ELSE chat_rate_limits.window_start END
    RETURNING message_count INTO current_count;
  RETURN current_count > p_limit;
END $function$;
COMMIT;
