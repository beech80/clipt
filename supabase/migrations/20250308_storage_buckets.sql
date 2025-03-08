-- Migration for setting up storage buckets and policies for Clipt
-- This creates and configures the necessary storage buckets for profile images and other media

-- PART 1: CREATE STORAGE BUCKETS
-- Create profiles bucket for avatars and banners
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
('profiles', 'profiles', true, 10485760, -- 10MB limit
 '{image/png,image/jpeg,image/gif,image/webp,image/svg+xml}')
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = '{image/png,image/jpeg,image/gif,image/webp,image/svg+xml}';

-- Create media bucket for other uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
('media', 'media', true, 104857600, -- 100MB limit
 '{image/png,image/jpeg,image/gif,image/webp,image/svg+xml,video/mp4,video/webm,audio/mpeg}')
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 104857600,
  allowed_mime_types = '{image/png,image/jpeg,image/gif,image/webp,image/svg+xml,video/mp4,video/webm,audio/mpeg}';

-- PART 2: CREATE STORAGE POLICIES

-- Profiles bucket policies
-- Allow public read access to all files in profiles bucket
CREATE POLICY "Public profiles access"
ON storage.objects FOR SELECT
USING (bucket_id = 'profiles');

-- Allow authenticated users to upload their own profile pictures
CREATE POLICY "Users can upload their own profile pictures"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'profiles' AND
  auth.uid() IS NOT NULL AND
  (
    (storage.foldername(name) = 'avatars' AND name LIKE 'avatars/avatar_' || auth.uid() || '%') OR
    (storage.foldername(name) = 'banners' AND name LIKE 'banners/banner_' || auth.uid() || '%')
  )
);

-- Allow users to update their own profile pictures
CREATE POLICY "Users can update their own profile pictures"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'profiles' AND
  auth.uid() IS NOT NULL AND
  (
    (storage.foldername(name) = 'avatars' AND name LIKE 'avatars/avatar_' || auth.uid() || '%') OR
    (storage.foldername(name) = 'banners' AND name LIKE 'banners/banner_' || auth.uid() || '%')
  )
);

-- Allow users to delete their own profile pictures
CREATE POLICY "Users can delete their own profile pictures"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'profiles' AND
  auth.uid() IS NOT NULL AND
  (
    (storage.foldername(name) = 'avatars' AND name LIKE 'avatars/avatar_' || auth.uid() || '%') OR
    (storage.foldername(name) = 'banners' AND name LIKE 'banners/banner_' || auth.uid() || '%')
  )
);

-- Media bucket policies
-- Allow public read access to all files in media bucket
CREATE POLICY "Public media access"
ON storage.objects FOR SELECT
USING (bucket_id = 'media');

-- Allow authenticated users to upload to media bucket
CREATE POLICY "Authenticated users can upload media"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'media' AND
  auth.uid() IS NOT NULL
);

-- Allow users to update their own media
CREATE POLICY "Users can update their own media"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'media' AND
  auth.uid() IS NOT NULL AND
  owner = auth.uid()::text
);

-- Allow users to delete their own media
CREATE POLICY "Users can delete their own media"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'media' AND
  auth.uid() IS NOT NULL AND
  owner = auth.uid()::text
);
