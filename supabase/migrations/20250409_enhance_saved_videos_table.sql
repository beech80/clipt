-- Migration to enhance the saved_videos table
-- This ensures users can save clipts and access them from their profile

-- Create the saved_videos table if it doesn't exist
CREATE TABLE IF NOT EXISTS saved_videos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  thumbnail_url TEXT,
  video_url TEXT,
  title TEXT,
  saved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Add a unique constraint to prevent duplicate saves
  UNIQUE(user_id, post_id)
);

-- Create an index for faster lookups by user_id
CREATE INDEX IF NOT EXISTS saved_videos_user_id_idx ON saved_videos(user_id);

-- Add RLS policies for saved_videos table
ALTER TABLE saved_videos ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to see only their own saved videos
CREATE POLICY saved_videos_select_policy ON saved_videos
  FOR SELECT USING (auth.uid() = user_id);

-- Policy to allow users to insert their own saved videos
CREATE POLICY saved_videos_insert_policy ON saved_videos
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy to allow users to delete their own saved videos
CREATE POLICY saved_videos_delete_policy ON saved_videos
  FOR DELETE USING (auth.uid() = user_id);
