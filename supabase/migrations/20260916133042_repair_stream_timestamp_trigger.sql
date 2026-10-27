BEGIN;
-- The existing streams table has created_at but no updated_at. Its insert
-- trigger referenced the missing field and prevented every stream creation.
CREATE OR REPLACE FUNCTION public.handle_new_stream()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
BEGIN
  IF NEW.created_at IS NULL THEN NEW.created_at := pg_catalog.now(); END IF;
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.handle_new_stream() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_stream() TO service_role;
COMMIT;
