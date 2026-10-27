BEGIN;
CREATE FUNCTION clipt_private.initialize_application_profile() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $function$
DECLARE requested_name text; fallback_name text;
BEGIN
  IF TG_TABLE_SCHEMA <> 'auth' OR TG_TABLE_NAME <> 'users' OR TG_OP <> 'INSERT' THEN
    RAISE EXCEPTION 'Invalid profile trigger context';
  END IF;
  -- User metadata can supply display identity only, never roles, verification,
  -- balances or other authorization fields.
  requested_name := lower(btrim(NEW.raw_user_meta_data->>'username'));
  fallback_name := 'user_' || replace(NEW.id::text,'-','');
  IF requested_name IS NULL OR requested_name !~ '^[a-z0-9_]{3,30}$' THEN
    requested_name := fallback_name;
  END IF;
  BEGIN
    INSERT INTO public.profiles(id,username,display_name)
      VALUES(NEW.id,requested_name,requested_name) ON CONFLICT(id) DO NOTHING;
  EXCEPTION WHEN unique_violation THEN
    INSERT INTO public.profiles(id,username,display_name)
      VALUES(NEW.id,fallback_name,requested_name) ON CONFLICT(id) DO NOTHING;
  END;
  RETURN NEW;
END;
$function$;
REVOKE ALL ON FUNCTION clipt_private.initialize_application_profile() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER clipt_initialize_application_profile AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION clipt_private.initialize_application_profile();
-- Keep the existing wallet trigger and all existing profiles untouched.
COMMIT;
