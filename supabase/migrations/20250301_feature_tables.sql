-- Migration script for Clipt feature tables
-- This script creates tables for stream donations, clips, scheduled streams, and other features

-- PART 1: STREAM CLIPS TABLE
CREATE TABLE IF NOT EXISTS public.stream_clips (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stream_id UUID REFERENCES public.streams(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  duration INTEGER,
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add indexes for stream_clips
CREATE INDEX IF NOT EXISTS stream_clips_user_id_idx ON public.stream_clips(user_id);
CREATE INDEX IF NOT EXISTS stream_clips_stream_id_idx ON public.stream_clips(stream_id);
CREATE INDEX IF NOT EXISTS stream_clips_created_at_idx ON public.stream_clips(created_at);

-- Enable RLS for stream_clips
ALTER TABLE public.stream_clips ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for stream_clips
CREATE POLICY "Anyone can view clips" 
ON public.stream_clips FOR SELECT 
USING (true);

CREATE POLICY "Users can create their own clips" 
ON public.stream_clips FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own clips" 
ON public.stream_clips FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own clips" 
ON public.stream_clips FOR DELETE 
USING (auth.uid() = user_id);

-- PART 2: CLIP VIEWS TABLE
CREATE TABLE IF NOT EXISTS public.clip_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clip_id UUID NOT NULL REFERENCES public.stream_clips(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ip_address TEXT,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add indexes for clip_views
CREATE INDEX IF NOT EXISTS clip_views_clip_id_idx ON public.clip_views(clip_id);
CREATE INDEX IF NOT EXISTS clip_views_user_id_idx ON public.clip_views(user_id);
CREATE INDEX IF NOT EXISTS clip_views_viewed_at_idx ON public.clip_views(viewed_at);

-- Enable RLS for clip_views
ALTER TABLE public.clip_views ENABLE ROW LEVEL SECURITY;

-- Create function to increment view count
CREATE OR REPLACE FUNCTION public.increment_clip_view_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.stream_clips
  SET view_count = view_count + 1
  WHERE id = NEW.clip_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for incrementing view count
DROP TRIGGER IF EXISTS increment_clip_view_count_trigger ON public.clip_views;
CREATE TRIGGER increment_clip_view_count_trigger
AFTER INSERT ON public.clip_views
FOR EACH ROW
EXECUTE FUNCTION public.increment_clip_view_count();

-- PART 3: CLIP LIKES TABLE
CREATE TABLE IF NOT EXISTS public.clip_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clip_id UUID NOT NULL REFERENCES public.stream_clips(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add indexes for clip_likes
CREATE INDEX IF NOT EXISTS clip_likes_clip_id_idx ON public.clip_likes(clip_id);
CREATE INDEX IF NOT EXISTS clip_likes_user_id_idx ON public.clip_likes(user_id);

-- Enable RLS for clip_likes
ALTER TABLE public.clip_likes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for clip_likes
CREATE POLICY "Users can like/unlike clips" 
ON public.clip_likes 
FOR ALL 
USING (auth.uid() = user_id);

-- Create function to increment like count
CREATE OR REPLACE FUNCTION public.update_clip_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.stream_clips
    SET like_count = like_count + 1
    WHERE id = NEW.clip_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.stream_clips
    SET like_count = like_count - 1
    WHERE id = OLD.clip_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for like count
DROP TRIGGER IF EXISTS clip_like_insert_trigger ON public.clip_likes;
CREATE TRIGGER clip_like_insert_trigger
AFTER INSERT ON public.clip_likes
FOR EACH ROW
EXECUTE FUNCTION public.update_clip_like_count();

DROP TRIGGER IF EXISTS clip_like_delete_trigger ON public.clip_likes;
CREATE TRIGGER clip_like_delete_trigger
AFTER DELETE ON public.clip_likes
FOR EACH ROW
EXECUTE FUNCTION public.update_clip_like_count();

-- PART 4: STREAM DONATIONS TABLE
CREATE TABLE IF NOT EXISTS public.stream_donations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stream_id UUID NOT NULL REFERENCES public.streams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add indexes for stream_donations
CREATE INDEX IF NOT EXISTS stream_donations_stream_id_idx ON public.stream_donations(stream_id);
CREATE INDEX IF NOT EXISTS stream_donations_user_id_idx ON public.stream_donations(user_id);
CREATE INDEX IF NOT EXISTS stream_donations_created_at_idx ON public.stream_donations(created_at);

-- Enable RLS for stream_donations
ALTER TABLE public.stream_donations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for stream_donations
CREATE POLICY "Users can see their own donations and streamers can see donations to their streams" 
ON public.stream_donations FOR SELECT 
USING (
  auth.uid() = user_id OR 
  auth.uid() IN (
    SELECT user_id FROM public.streams WHERE id = stream_id
  )
);

CREATE POLICY "Users can create their own donations" 
ON public.stream_donations FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- PART 5: SCHEDULED STREAMS TABLE
CREATE TABLE IF NOT EXISTS public.scheduled_streams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  scheduled_start TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  is_private BOOLEAN DEFAULT false,
  thumbnail_url TEXT,
  game_id UUID REFERENCES public.games(id) ON DELETE SET NULL,
  stream_id UUID REFERENCES public.streams(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add indexes for scheduled_streams
CREATE INDEX IF NOT EXISTS scheduled_streams_user_id_idx ON public.scheduled_streams(user_id);
CREATE INDEX IF NOT EXISTS scheduled_streams_scheduled_start_idx ON public.scheduled_streams(scheduled_start);
CREATE INDEX IF NOT EXISTS scheduled_streams_game_id_idx ON public.scheduled_streams(game_id);

-- Enable RLS for scheduled_streams
ALTER TABLE public.scheduled_streams ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for scheduled_streams
CREATE POLICY "Anyone can view public scheduled streams" 
ON public.scheduled_streams FOR SELECT 
USING (is_private = false OR auth.uid() = user_id);

CREATE POLICY "Users can manage their own scheduled streams" 
ON public.scheduled_streams FOR ALL 
USING (auth.uid() = user_id);

-- PART 6: STREAM POLLS TABLE
CREATE TABLE IF NOT EXISTS public.stream_polls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stream_id UUID NOT NULL REFERENCES public.streams(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Add indexes for stream_polls
CREATE INDEX IF NOT EXISTS stream_polls_stream_id_idx ON public.stream_polls(stream_id);
CREATE INDEX IF NOT EXISTS stream_polls_is_active_idx ON public.stream_polls(is_active);

-- Enable RLS for stream_polls
ALTER TABLE public.stream_polls ENABLE ROW LEVEL SECURITY;

-- PART 7: POLL OPTIONS TABLE
CREATE TABLE IF NOT EXISTS public.poll_options (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  poll_id UUID NOT NULL REFERENCES public.stream_polls(id) ON DELETE CASCADE,
  option_text TEXT NOT NULL,
  vote_count INTEGER DEFAULT 0
);

-- Add indexes for poll_options
CREATE INDEX IF NOT EXISTS poll_options_poll_id_idx ON public.poll_options(poll_id);

-- Enable RLS for poll_options
ALTER TABLE public.poll_options ENABLE ROW LEVEL SECURITY;

-- PART 8: POLL VOTES TABLE
CREATE TABLE IF NOT EXISTS public.poll_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  option_id UUID NOT NULL REFERENCES public.poll_options(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add indexes for poll_votes
CREATE INDEX IF NOT EXISTS poll_votes_option_id_idx ON public.poll_votes(option_id);
CREATE INDEX IF NOT EXISTS poll_votes_user_id_idx ON public.poll_votes(user_id);

-- Enable RLS for poll_votes
ALTER TABLE public.poll_votes ENABLE ROW LEVEL SECURITY;

-- Create function to increment vote count
CREATE OR REPLACE FUNCTION public.increment_poll_vote_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.poll_options
  SET vote_count = vote_count + 1
  WHERE id = NEW.option_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for incrementing vote count
DROP TRIGGER IF EXISTS increment_poll_vote_count_trigger ON public.poll_votes;
CREATE TRIGGER increment_poll_vote_count_trigger
AFTER INSERT ON public.poll_votes
FOR EACH ROW
EXECUTE FUNCTION public.increment_poll_vote_count();

-- PART 9: PUSH SUBSCRIPTION TABLE
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add indexes for push_subscriptions
CREATE INDEX IF NOT EXISTS push_subscriptions_user_id_idx ON public.push_subscriptions(user_id);

-- Enable RLS for push_subscriptions
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for push_subscriptions
CREATE POLICY "Users can manage their own push subscriptions" 
ON public.push_subscriptions 
FOR ALL 
USING (auth.uid() = user_id);

-- PART 10: STREAM ANALYTICS FUNCTIONS
-- Create function to get stream metrics
CREATE OR REPLACE FUNCTION public.get_stream_metrics(
  p_user_id UUID,
  p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
  stream_id UUID,
  title TEXT,
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  peak_viewers INTEGER,
  average_viewers FLOAT,
  total_donations DECIMAL(10, 2),
  clip_count INTEGER
) LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id AS stream_id,
    s.title,
    s.started_at,
    s.ended_at,
    s.viewer_count AS peak_viewers,
    COALESCE(AVG(s.viewer_count), 0) AS average_viewers,
    COALESCE(SUM(sd.amount), 0) AS total_donations,
    COUNT(DISTINCT sc.id) AS clip_count
  FROM 
    public.streams s
    LEFT JOIN public.stream_donations sd ON s.id = sd.stream_id
    LEFT JOIN public.stream_clips sc ON s.id = sc.stream_id
  WHERE 
    s.user_id = p_user_id AND
    s.started_at >= (NOW() - (p_days || ' days')::INTERVAL)
  GROUP BY 
    s.id, s.title, s.started_at, s.ended_at, s.viewer_count
  ORDER BY 
    s.started_at DESC;
END;
$$;
