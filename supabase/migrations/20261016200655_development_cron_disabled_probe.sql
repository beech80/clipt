-- Development scheduler installation only; no scan job or provider activation.
BEGIN;
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
REVOKE ALL ON SCHEMA cron FROM PUBLIC,anon,authenticated,authenticator;
REVOKE ALL ON ALL TABLES IN SCHEMA cron FROM PUBLIC,anon,authenticated,authenticator;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA cron FROM PUBLIC,anon,authenticated,authenticator;
GRANT USAGE ON SCHEMA cron TO postgres;
DO $$DECLARE r text; BEGIN
 FOREACH r IN ARRAY ARRAY['anon','authenticated','authenticator'] LOOP
  IF has_schema_privilege(r,'cron','USAGE,CREATE') THEN RAISE EXCEPTION 'App cron access remains'; END IF;
 END LOOP;
END $$;
COMMIT;
