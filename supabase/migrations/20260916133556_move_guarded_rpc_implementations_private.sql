BEGIN;
-- Retain the reviewed, caller-bound guards in a non-exposed implementation
-- schema. Public API signatures remain stable and run as the invoking role.
ALTER FUNCTION public.check_chat_rate_limit(uuid,uuid,integer,integer) SET SCHEMA clipt_private;
ALTER FUNCTION public.is_user_timed_out(uuid,uuid) SET SCHEMA clipt_private;
ALTER FUNCTION public.filter_chat_message(text,uuid) SET SCHEMA clipt_private;
ALTER FUNCTION public.update_stream_quality(uuid,jsonb) SET SCHEMA clipt_private;

CREATE FUNCTION public.check_chat_rate_limit(p_user_id uuid,p_stream_id uuid,p_limit integer DEFAULT 20,p_window_seconds integer DEFAULT 60)
RETURNS boolean LANGUAGE sql SECURITY INVOKER SET search_path = '' AS $$
  SELECT clipt_private.check_chat_rate_limit(p_user_id,p_stream_id,p_limit,p_window_seconds);
$$;
CREATE FUNCTION public.is_user_timed_out(p_user_id uuid,p_stream_id uuid)
RETURNS boolean LANGUAGE sql SECURITY INVOKER SET search_path = '' AS $$
  SELECT clipt_private.is_user_timed_out(p_user_id,p_stream_id);
$$;
CREATE FUNCTION public.filter_chat_message(p_message text,p_stream_id uuid)
RETURNS TABLE(filtered_message text,is_blocked boolean,filter_matched text)
LANGUAGE sql SECURITY INVOKER SET search_path = '' AS $$
  SELECT * FROM clipt_private.filter_chat_message(p_message,p_stream_id);
$$;
CREATE FUNCTION public.update_stream_quality(stream_id uuid,new_settings jsonb)
RETURNS jsonb LANGUAGE sql SECURITY INVOKER SET search_path = '' AS $$
  SELECT clipt_private.update_stream_quality(stream_id,new_settings);
$$;
REVOKE ALL ON FUNCTION public.check_chat_rate_limit(uuid,uuid,integer,integer),
  public.is_user_timed_out(uuid,uuid),public.filter_chat_message(text,uuid),
  public.update_stream_quality(uuid,jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.check_chat_rate_limit(uuid,uuid,integer,integer),
  public.is_user_timed_out(uuid,uuid),public.filter_chat_message(text,uuid),
  public.update_stream_quality(uuid,jsonb) TO authenticated, service_role;
COMMIT;
