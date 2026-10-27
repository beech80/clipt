BEGIN;
-- Bucket upload admission only: existing objects/URLs are not rewritten.
UPDATE storage.buckets SET file_size_limit=LEAST(COALESCE(file_size_limit,52428800),52428800),
  allowed_mime_types=ARRAY['image/jpeg','image/png','image/gif','image/webp','video/mp4','video/webm','video/ogg']
WHERE id='media';
UPDATE storage.buckets SET file_size_limit=LEAST(COALESCE(file_size_limit,5242880),5242880),
  allowed_mime_types=ARRAY['image/jpeg','image/png','image/gif','image/webp']
WHERE id='avatars';
COMMIT;
