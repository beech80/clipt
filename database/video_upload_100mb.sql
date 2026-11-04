-- Upload admission only. Preserve bucket privacy, MIME restrictions and object policies.
DO $upload_limit$
BEGIN
 IF NOT EXISTS(SELECT 1 FROM storage.buckets WHERE id='media' AND public=false AND file_size_limit IN (52428800,104857600))
 THEN RAISE EXCEPTION 'Expected private media bucket with reviewed upload limit'; END IF;
 UPDATE storage.buckets SET file_size_limit=104857600 WHERE id='media';
END
$upload_limit$;
