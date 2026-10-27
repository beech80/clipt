-- Additive compatibility registry. Never modifies Storage metadata or bytes.
CREATE TABLE clipt_private.legacy_media_paths (
  object_id uuid PRIMARY KEY,
  bucket_id text NOT NULL CHECK (bucket_id IN ('media','posts','videos','avatars','clipt-avatars','recordings')),
  object_name text NOT NULL,
  owner_id uuid NOT NULL,
  approved_at timestamptz NOT NULL DEFAULT statement_timestamp(),
  UNIQUE(bucket_id,object_name)
);
ALTER TABLE clipt_private.legacy_media_paths ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON clipt_private.legacy_media_paths FROM PUBLIC,anon,authenticated;

-- A narrow privileged metadata comparison, not a download/signing endpoint.
-- The outer INVOKER read boundary still checks post visibility/MFA/blocking.
CREATE FUNCTION clipt_private.legacy_media_path_matches(
  object_bucket text, object_path text, recorded_owner text
) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
  SELECT auth.uid() IS NOT NULL AND clipt_private.beta_access_allowed()
  AND EXISTS (
    SELECT 1 FROM clipt_private.legacy_media_paths m
    JOIN storage.objects o ON o.id=m.object_id AND o.bucket_id=m.bucket_id AND o.name=m.object_name
    WHERE m.bucket_id=object_bucket AND m.object_name=object_path
      AND m.owner_id::text=recorded_owner
      AND coalesce(nullif(o.owner_id,''),o.owner::text)=recorded_owner
      AND (o.owner_id IS NULL OR o.owner_id='' OR o.owner IS NULL OR o.owner_id=o.owner::text)
  );
$$;
REVOKE ALL ON FUNCTION clipt_private.legacy_media_path_matches(text,text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION clipt_private.legacy_media_path_matches(text,text,text) TO anon,authenticated;
