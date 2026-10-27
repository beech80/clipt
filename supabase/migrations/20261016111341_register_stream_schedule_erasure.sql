-- Reviewed announcement-only data: no financial/security retention category,
-- provider resources, external delivery, or cross-owner descendants.
-- Register with the existing fail-closed erasure walker; do not weaken it.
INSERT INTO clipt_private.erasure_tables(table_oid,table_name)
VALUES ('public.scheduled_streams'::regclass::oid,'scheduled_streams');
