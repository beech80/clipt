BEGIN;
SET LOCAL lock_timeout = '5s';
ALTER VIEW public.active_season_multiplier SET (security_invoker = true);
ALTER VIEW public.stream_recommendations SET (security_invoker = true);
ALTER VIEW public.weekly_top_clips SET (security_invoker = true);

-- Materialized data has no per-caller RLS. Preserve it for backend jobs only.
REVOKE ALL ON public.top_games, public.trending_posts, public.trending_streams FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.top_games, public.trending_posts, public.trending_streams TO service_role;

-- Remove default RPC exposure for existing privileged internals. Keep trigger
-- execution and backend access; reviewed client RPCs receive guarded grants below.
DO $migration$
DECLARE f record;
BEGIN
  FOR f IN SELECT p.oid::regprocedure AS signature FROM pg_proc p
    JOIN pg_namespace n ON n.oid=p.pronamespace
    WHERE n.nspname='public' AND p.prosecdef
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon, authenticated',f.signature);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role',f.signature);
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
  IF p_stream_id IS NULL OR p_limit NOT BETWEEN 1 AND 20 OR p_window_seconds NOT BETWEEN 60 AND 3600 THEN
    RAISE EXCEPTION 'Invalid rate limit';
  END IF;
  INSERT INTO public.chat_rate_limits(user_id,stream_id,message_count,window_start)
    VALUES(p_user_id,p_stream_id,1,now())
    ON CONFLICT(user_id,stream_id) DO UPDATE SET
      message_count=CASE WHEN chat_rate_limits.window_start <= now()-make_interval(secs=>p_window_seconds) THEN 1 ELSE chat_rate_limits.message_count+1 END,
      window_start=CASE WHEN chat_rate_limits.window_start <= now()-make_interval(secs=>p_window_seconds) THEN now() ELSE chat_rate_limits.window_start END
    RETURNING message_count INTO current_count;
  RETURN current_count > p_limit;
END $function$;

CREATE OR REPLACE FUNCTION public.is_user_timed_out(p_user_id uuid,p_stream_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $function$
BEGIN
  IF auth.uid() IS NULL OR auth.uid() IS DISTINCT FROM p_user_id THEN
    RAISE EXCEPTION 'Not authorized' USING ERRCODE='42501';
  END IF;
  RETURN EXISTS(SELECT 1 FROM public.chat_timeouts WHERE user_id=p_user_id AND stream_id=p_stream_id AND expires_at>now());
END $function$;

CREATE OR REPLACE FUNCTION public.filter_chat_message(p_message text,p_stream_id uuid)
RETURNS TABLE(filtered_message text,is_blocked boolean,filter_matched text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $function$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authorized' USING ERRCODE='42501'; END IF;
  IF p_stream_id IS NULL OR p_message IS NULL OR length(p_message) NOT BETWEEN 1 AND 2000 THEN RAISE EXCEPTION 'Invalid message'; END IF;
  RETURN QUERY WITH matched_filter AS (
    SELECT pattern,filter_type,replacement,is_regex FROM public.chat_filters
    WHERE (stream_id=p_stream_id OR stream_id IS NULL) AND
      ((is_regex AND p_message ~* pattern) OR (NOT is_regex AND p_message ILIKE '%'||pattern||'%'))
    ORDER BY stream_id NULLS LAST,created_at DESC LIMIT 1
  ) SELECT CASE WHEN f.filter_type='replace' THEN CASE WHEN f.is_regex
      THEN regexp_replace(p_message,f.pattern,COALESCE(f.replacement,'*****'),'gi')
      ELSE replace(p_message,f.pattern,COALESCE(f.replacement,'*****')) END ELSE p_message END,
    f.filter_type='block',NULL::text FROM matched_filter f
    UNION ALL SELECT p_message,false,NULL::text WHERE NOT EXISTS(SELECT 1 FROM matched_filter);
END $function$;

CREATE OR REPLACE FUNCTION public.update_stream_quality(stream_id uuid,new_settings jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $function$
DECLARE result jsonb; current_session uuid;
BEGIN
  IF auth.uid() IS NULL OR NOT EXISTS(SELECT 1 FROM public.streams s WHERE s.id=$1 AND s.user_id=auth.uid()) THEN
    RAISE EXCEPTION 'Not authorized' USING ERRCODE='42501';
  END IF;
  IF jsonb_typeof(new_settings) IS DISTINCT FROM 'object' OR octet_length(new_settings::text)>16384 THEN RAISE EXCEPTION 'Invalid settings'; END IF;
  SELECT e.id INTO current_session FROM public.stream_encoding_sessions e WHERE e.stream_id=$1 AND e.status='active' ORDER BY e.started_at DESC LIMIT 1;
  IF current_session IS NULL THEN RAISE EXCEPTION 'No active encoding session'; END IF;
  UPDATE public.stream_encoding_sessions SET current_settings=new_settings WHERE id=current_session
    RETURNING jsonb_build_object('session_id',id,'settings',current_settings,'updated_at',updated_at) INTO result;
  RETURN result;
END $function$;
GRANT EXECUTE ON FUNCTION public.check_chat_rate_limit(uuid,uuid,integer,integer),public.is_user_timed_out(uuid,uuid),public.filter_chat_message(text,uuid),public.update_stream_quality(uuid,jsonb) TO authenticated;
COMMIT;
