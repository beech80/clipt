SET LOCAL lock_timeout='5s';

DO $guard$
BEGIN
  IF (SELECT count(*) FROM storage.objects)<>141
     OR (SELECT coalesce(sum((metadata->>'size')::bigint),0) FROM storage.objects)<>942701900
     OR (SELECT count(*) FROM storage.objects WHERE coalesce(nullif(owner_id,''),owner::text) IS NULL)<>2
     OR EXISTS(SELECT 1 FROM storage.objects WHERE owner_id IS NOT NULL AND owner IS NOT NULL AND owner_id<>owner::text)
     OR EXISTS(SELECT 1 FROM storage.objects WHERE coalesce(nullif(owner_id,''),owner::text) IS NOT NULL AND coalesce(nullif(owner_id,''),owner::text)!~*'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$')
  THEN RAISE EXCEPTION 'Reviewed media inventory no longer matches'; END IF;
END $guard$;
-- Additive read boundary only: preserve private buckets, objects, ownership,
-- every existing policy, and the existing account/MFA write boundaries.
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

CREATE OR REPLACE FUNCTION clipt_private.storage_read_eligible(
  object_bucket text, object_name text, object_owner_id text, legacy_owner uuid
) RETURNS boolean LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path='' AS $$
DECLARE
  owner_text text := coalesce(nullif(object_owner_id,''),legacy_owner::text);
  reference text;
BEGIN
  IF owner_text IS NULL THEN RETURN false; END IF;
  IF split_part(object_name,'/',1) IS DISTINCT FROM owner_text AND NOT clipt_private.legacy_media_path_matches(object_bucket,object_name,owner_text) THEN RETURN false; END IF;
  IF auth.uid() IS NOT NULL AND auth.uid()::text=owner_text THEN RETURN true; END IF;
  reference := 'https://slnjliheyiiummxhrgmk.supabase.co/storage/v1/object/public/' || object_bucket || '/' || object_name;
  IF object_bucket IN ('media','posts','videos') THEN
    -- Invoker queries intersect existing post visibility/moderation/block RLS.
    RETURN EXISTS (
      SELECT 1 FROM public.posts p WHERE p.user_id::text=owner_text
      AND p.is_published IS TRUE AND p.is_premium IS NOT TRUE AND p.is_subscriber_only IS NOT TRUE
      AND NOT p.moderation_hidden AND p.required_tier_id IS NULL
      AND (p.scheduled_publish_time IS NULL OR p.scheduled_publish_time<=statement_timestamp())
      AND (p.video_url=reference OR reference=ANY(string_to_array(p.image_url,',')))
    ) OR EXISTS (
      SELECT 1 FROM public.post_video_renditions r JOIN public.posts p ON p.id=r.post_id
      WHERE p.user_id::text=owner_text AND r.playback_url=reference
      AND p.is_published IS TRUE AND p.is_premium IS NOT TRUE AND p.is_subscriber_only IS NOT TRUE
      AND NOT p.moderation_hidden AND p.required_tier_id IS NULL
      AND (p.scheduled_publish_time IS NULL OR p.scheduled_publish_time<=statement_timestamp())
    );
  END IF;
  IF object_bucket IN ('avatars','clipt-avatars') THEN
    RETURN EXISTS (
      SELECT 1 FROM public.profiles p WHERE p.id::text=owner_text
      AND p.avatar_url=reference AND NOT clipt_private.blocked_with(p.id)
    );
  END IF;
  -- Recordings, unreferenced uploads and future buckets remain owner-only.
  RETURN false;
END;
$$;
REVOKE ALL ON FUNCTION clipt_private.storage_read_eligible(text,text,text,uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION clipt_private.storage_read_eligible(text,text,text,uuid) TO anon,authenticated;
CREATE POLICY clipt_storage_read_eligibility_boundary ON storage.objects
AS RESTRICTIVE FOR SELECT TO anon,authenticated USING (
  clipt_private.storage_read_eligible(bucket_id,name,owner_id,owner)
);

INSERT INTO clipt_private.legacy_media_paths(object_id,bucket_id,object_name,owner_id)
SELECT id,bucket_id,name,coalesce(nullif(owner_id,''),owner::text)::uuid
FROM storage.objects
WHERE bucket_id IN ('avatars','clipt-avatars','media','posts','videos','recordings')
  AND coalesce(nullif(owner_id,''),owner::text) IS NOT NULL
  AND split_part(name,'/',1)<>coalesce(nullif(owner_id,''),owner::text);
DO $guard$
BEGIN
 IF (SELECT count(*) FROM clipt_private.legacy_media_paths)<>51 THEN
   RAISE EXCEPTION 'Unexpected legacy compatibility count';
 END IF;
END $guard$;
