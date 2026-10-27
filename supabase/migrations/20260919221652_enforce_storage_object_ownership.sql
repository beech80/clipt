BEGIN;
-- Restrictive policies intersect the existing permissive policies. No objects,
-- bucket visibility, existing URLs or ownership metadata are changed.
CREATE POLICY clipt_storage_insert_owner_boundary ON storage.objects AS RESTRICTIVE
FOR INSERT TO public WITH CHECK (
  (SELECT auth.uid()) IS NOT NULL
  AND (owner_id=(SELECT auth.uid())::text OR (owner_id IS NULL AND owner=(SELECT auth.uid())))
  AND (storage.foldername(name))[1]=(SELECT auth.uid())::text
);
CREATE POLICY clipt_storage_update_owner_boundary ON storage.objects AS RESTRICTIVE
FOR UPDATE TO public USING (
  owner_id=(SELECT auth.uid())::text OR (owner_id IS NULL AND owner=(SELECT auth.uid()))
) WITH CHECK (
  owner_id=(SELECT auth.uid())::text OR (owner_id IS NULL AND owner=(SELECT auth.uid()))
);
CREATE POLICY clipt_storage_delete_owner_boundary ON storage.objects AS RESTRICTIVE
FOR DELETE TO public USING (
  owner_id=(SELECT auth.uid())::text OR (owner_id IS NULL AND owner=(SELECT auth.uid()))
);
COMMIT;
