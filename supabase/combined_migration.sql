-- Combined migration script for Clipt application
-- This script creates and updates tables for comments and streams

-- PART 1: COMMENT TABLE SETUP
-- Create comments table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  likes INT DEFAULT 0
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS comments_post_id_idx ON public.comments(post_id);
CREATE INDEX IF NOT EXISTS comments_user_id_idx ON public.comments(user_id);
CREATE INDEX IF NOT EXISTS comments_parent_id_idx ON public.comments(parent_id);
CREATE INDEX IF NOT EXISTS comments_created_at_idx ON public.comments(created_at);

-- Enable RLS
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY IF NOT EXISTS "Anyone can read comments" 
ON public.comments FOR SELECT 
USING (true);

CREATE POLICY IF NOT EXISTS "Users can insert their own comments" 
ON public.comments FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can update their own comments" 
ON public.comments FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can delete their own comments" 
ON public.comments FOR DELETE 
USING (auth.uid() = user_id);

-- PART 2: STREAM FUNCTIONALITY SETUP
-- Create streams table
CREATE TABLE IF NOT EXISTS public.streams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  is_live BOOLEAN DEFAULT false,
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  stream_key TEXT,
  stream_path TEXT,
  rtmp_url TEXT DEFAULT 'rtmp://stream.clipt.app/live',
  thumbnail_url TEXT,
  viewer_count INTEGER DEFAULT 0,
  playback_url TEXT,
  game_id UUID REFERENCES public.games(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add RLS policies
ALTER TABLE public.streams ENABLE ROW LEVEL SECURITY;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS streams_user_id_idx ON public.streams(user_id);
CREATE INDEX IF NOT EXISTS streams_is_live_idx ON public.streams(is_live);
CREATE INDEX IF NOT EXISTS streams_game_id_idx ON public.streams(game_id);
CREATE INDEX IF NOT EXISTS streams_created_at_idx ON public.streams(created_at);

-- Create or replace stream key generation function
CREATE OR REPLACE FUNCTION public.generate_stream_key()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  random_key TEXT;
BEGIN
  -- Generate a secure random key (36 characters)
  SELECT encode(gen_random_bytes(18), 'hex') INTO random_key;
  RETURN random_key;
END;
$$;

-- Create or replace function to handle new stream creation
CREATE OR REPLACE FUNCTION public.before_insert_stream()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Generate a new stream key if one is not provided
  IF NEW.stream_key IS NULL THEN
    NEW.stream_key := public.generate_stream_key();
  END IF;
  
  -- Get the user's username to create a friendly stream path
  SELECT username INTO NEW.stream_path 
  FROM public.profiles 
  WHERE id = NEW.user_id;
  
  -- Fallback to user ID if username is not available
  IF NEW.stream_path IS NULL THEN
    NEW.stream_path := NEW.user_id;
  END IF;
  
  -- Set default RTMP URL if not provided
  IF NEW.rtmp_url IS NULL THEN
    NEW.rtmp_url := 'rtmp://stream.clipt.app/live';
  END IF;
  
  -- Set created_at if not provided
  IF NEW.created_at IS NULL THEN
    NEW.created_at := NOW();
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to set updated_at on streams table
DROP TRIGGER IF EXISTS set_streams_updated_at ON public.streams;
CREATE TRIGGER set_streams_updated_at
BEFORE UPDATE ON public.streams
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- Add trigger to automatically set stream key and other fields on new stream creation
DROP TRIGGER IF EXISTS before_insert_stream_trigger ON public.streams;
CREATE TRIGGER before_insert_stream_trigger
BEFORE INSERT ON public.streams
FOR EACH ROW
EXECUTE FUNCTION public.before_insert_stream();

-- Create RLS policies for streams table
CREATE POLICY IF NOT EXISTS "Users can view own streams" 
ON public.streams 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Anyone can view active streams" 
ON public.streams 
FOR SELECT 
USING (is_live = true);

CREATE POLICY IF NOT EXISTS "Users can update own streams" 
ON public.streams 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can delete own streams" 
ON public.streams 
FOR DELETE 
USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can create streams" 
ON public.streams 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);
