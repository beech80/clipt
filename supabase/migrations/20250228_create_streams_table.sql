-- Create the streams table
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
  game_id UUID REFERENCES games(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add RLS policies
ALTER TABLE public.streams ENABLE ROW LEVEL SECURITY;

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at trigger
DROP TRIGGER IF EXISTS set_streams_updated_at ON public.streams;
CREATE TRIGGER set_streams_updated_at
BEFORE UPDATE ON public.streams
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS streams_user_id_idx ON public.streams(user_id);
CREATE INDEX IF NOT EXISTS streams_is_live_idx ON public.streams(is_live);
CREATE INDEX IF NOT EXISTS streams_game_id_idx ON public.streams(game_id);
CREATE INDEX IF NOT EXISTS streams_created_at_idx ON public.streams(created_at);

-- Create a view that joins streams with user profiles
CREATE OR REPLACE VIEW public.streams_with_user AS
SELECT
  s.*,
  p.username,
  p.display_name,
  p.avatar_url
FROM
  public.streams s
  JOIN public.profiles p ON s.user_id = p.id;
