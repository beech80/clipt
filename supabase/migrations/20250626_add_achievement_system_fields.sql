-- Add achievement system fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS xp integer DEFAULT 0 NOT NULL,
ADD COLUMN IF NOT EXISTS level integer DEFAULT 1 NOT NULL,
ADD COLUMN IF NOT EXISTS tokens integer DEFAULT 0 NOT NULL,
ADD COLUMN IF NOT EXISTS prestige integer DEFAULT 0 NOT NULL,
ADD COLUMN IF NOT EXISTS title text,
ADD COLUMN IF NOT EXISTS unlocked_themes text[] DEFAULT '{}';

-- Create achievements table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.achievements (
  id text PRIMARY KEY,
  name text NOT NULL,
  description text NOT NULL,
  category text NOT NULL,
  image text,
  target_value integer,
  points integer DEFAULT 0,
  xp_reward integer DEFAULT 0,
  token_reward integer DEFAULT 0,
  progress_type text DEFAULT 'count',
  reward_type text DEFAULT 'points',
  visible boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create achievement_progress table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.achievement_progress (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  achievement_id text REFERENCES public.achievements(id) ON DELETE CASCADE,
  current_value integer DEFAULT 0,
  completed boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE (user_id, achievement_id)
);

-- Add RLS policies for achievements
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anyone to read achievements" 
  ON public.achievements FOR SELECT 
  USING (true);
  
CREATE POLICY "Allow admins to insert achievements"
  ON public.achievements FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IN (
    SELECT id FROM public.admins
  ));

CREATE POLICY "Allow admins to update achievements"
  ON public.achievements FOR UPDATE
  TO authenticated
  USING (auth.uid() IN (
    SELECT id FROM public.admins
  ));

-- Add RLS policies for achievement_progress
ALTER TABLE public.achievement_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow users to read their own achievement progress"
  ON public.achievement_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Allow system/admins to insert achievement progress"
  ON public.achievement_progress FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id OR auth.uid() IN (
    SELECT id FROM public.admins
  ));

CREATE POLICY "Allow system/admins to update achievement progress"
  ON public.achievement_progress FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id OR auth.uid() IN (
    SELECT id FROM public.admins
  ));

-- Create or replace function to update user xp and level when an achievement is completed
CREATE OR REPLACE FUNCTION public.update_user_xp_tokens()
RETURNS TRIGGER AS $$
DECLARE
  xp_gained integer;
  tokens_gained integer;
  achievement_record record;
BEGIN
  -- Only process completed achievements
  IF NEW.completed = true AND OLD.completed = false THEN
    -- Get achievement details
    SELECT * INTO achievement_record 
    FROM public.achievements 
    WHERE id = NEW.achievement_id;
    
    -- Set rewards based on achievement
    xp_gained := COALESCE(achievement_record.xp_reward, 0);
    tokens_gained := COALESCE(achievement_record.token_reward, 0);
    
    -- Update user profile with rewards
    IF xp_gained > 0 OR tokens_gained > 0 THEN
      UPDATE public.profiles
      SET 
        xp = xp + xp_gained,
        tokens = tokens + tokens_gained,
        updated_at = now()
      WHERE id = NEW.user_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for the function
DROP TRIGGER IF EXISTS trigger_update_user_xp_tokens ON public.achievement_progress;
CREATE TRIGGER trigger_update_user_xp_tokens
AFTER UPDATE OF completed ON public.achievement_progress
FOR EACH ROW
EXECUTE FUNCTION public.update_user_xp_tokens();
