-- Migration: Create saved_videos table
-- This table stores user saved videos

-- Create the saved_videos table
CREATE TABLE IF NOT EXISTS public.saved_videos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  post_id UUID REFERENCES public.posts(id) NOT NULL,
  video_url TEXT NOT NULL,
  title TEXT,
  saved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Create a unique constraint to prevent duplicate saves
  UNIQUE(user_id, post_id)
);

-- Add RLS policies for saved_videos table
ALTER TABLE public.saved_videos ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own saved videos
CREATE POLICY "Users can view their own saved videos" 
  ON public.saved_videos 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Policy: Users can add videos to their saved videos
CREATE POLICY "Users can save videos" 
  ON public.saved_videos 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can remove videos from their saved videos
CREATE POLICY "Users can remove saved videos" 
  ON public.saved_videos 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create function to initialize the saved_videos table via RPC
CREATE OR REPLACE FUNCTION public.create_saved_videos_table()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if the table already exists
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public'
    AND table_name = 'saved_videos'
  ) THEN
    RETURN true;
  END IF;

  -- Create the saved_videos table
  CREATE TABLE IF NOT EXISTS public.saved_videos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    post_id UUID REFERENCES public.posts(id) NOT NULL,
    video_url TEXT NOT NULL,
    title TEXT,
    saved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Create a unique constraint to prevent duplicate saves
    UNIQUE(user_id, post_id)
  );

  -- Add RLS policies for saved_videos table
  ALTER TABLE public.saved_videos ENABLE ROW LEVEL SECURITY;

  -- Policy: Users can view their own saved videos
  CREATE POLICY "Users can view their own saved videos" 
    ON public.saved_videos 
    FOR SELECT 
    USING (auth.uid() = user_id);

  -- Policy: Users can add videos to their saved videos
  CREATE POLICY "Users can save videos" 
    ON public.saved_videos 
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

  -- Policy: Users can remove videos from their saved videos
  CREATE POLICY "Users can remove saved videos" 
    ON public.saved_videos 
    FOR DELETE 
    USING (auth.uid() = user_id);

  RETURN true;
END;
$$;

-- Grant execute permission to the RPC function
GRANT EXECUTE ON FUNCTION public.create_saved_videos_table() TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_saved_videos_table() TO anon;
