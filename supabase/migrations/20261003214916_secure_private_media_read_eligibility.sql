BEGIN;
SET LOCAL lock_timeout='5s';
-- Additive read boundary only: preserve private buckets, objects, ownership,
-- every existing policy, and the existing account/MFA write boundaries.
CREATE FUNCTION clipt_private.storage_read_eligible(
  object_bucket text, object_name text, object_owner_id text, legacy_owner uuid
) RETURNS boolean LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path='' AS $$
DECLARE
  owner_text text := coalesce(nullif(object_owner_id,''),legacy_owner::text);
  reference text;
BEGIN
  IF owner_text IS NULL OR split_part(object_name,'/',1) IS DISTINCT FROM owner_text THEN RETURN false; END IF;
  IF auth.uid() IS NOT NULL AND auth.uid()::text=owner_text THEN RETURN true; END IF;
  reference := 'https://akiksrlzdqvipqbbjxpw.supabase.co/storage/v1/object/public/' || object_bucket || '/' || object_name;
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
COMMIT;
