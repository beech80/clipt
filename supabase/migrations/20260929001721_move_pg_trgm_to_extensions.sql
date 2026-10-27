-- Move only the relocatable extension; preserve member OIDs, dependencies and data.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';
DO $migration$
DECLARE
  extension_id oid;
  current_schema text;
  members_before text;
  members_after text;
BEGIN
  SELECT e.oid, n.nspname INTO extension_id, current_schema
  FROM pg_extension e JOIN pg_namespace n ON n.oid=e.extnamespace
  WHERE e.extname='pg_trgm' AND e.extrelocatable;
  IF extension_id IS NULL THEN RAISE EXCEPTION 'Relocatable pg_trgm required'; END IF;
  IF current_schema NOT IN ('public','extensions') THEN
    RAISE EXCEPTION 'Unexpected pg_trgm schema';
  END IF;
  IF to_regnamespace('extensions') IS NULL THEN RAISE EXCEPTION 'Existing extensions schema required'; END IF;
  SELECT md5(string_agg(classid::text||':'||objid::text||':'||objsubid::text, ',' ORDER BY classid,objid,objsubid))
    INTO members_before FROM pg_depend
    WHERE refclassid='pg_extension'::regclass AND refobjid=extension_id AND deptype='e';
  IF current_schema='public' THEN ALTER EXTENSION pg_trgm SET SCHEMA extensions; END IF;
  SELECT md5(string_agg(classid::text||':'||objid::text||':'||objsubid::text, ',' ORDER BY classid,objid,objsubid))
    INTO members_after FROM pg_depend
    WHERE refclassid='pg_extension'::regclass AND refobjid=extension_id AND deptype='e';
  IF members_before IS DISTINCT FROM members_after THEN RAISE EXCEPTION 'Extension member identities changed'; END IF;
  IF extensions.similarity('clipt','clipt') <> 1 THEN RAISE EXCEPTION 'Trigram self-similarity failed'; END IF;
END;
$migration$;
NOTIFY pgrst, 'reload schema';
COMMIT;
