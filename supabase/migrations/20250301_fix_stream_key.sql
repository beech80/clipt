-- Fix stream key generation functionality

-- Drop the existing function if it exists and recreate it
DROP FUNCTION IF EXISTS public.generate_stream_key();

-- Create the fixed stream key generation function
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

-- Drop the existing trigger function if it exists
DROP FUNCTION IF EXISTS public.before_insert_stream() CASCADE;

-- Create the fixed trigger function
CREATE OR REPLACE FUNCTION public.before_insert_stream()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  username_val TEXT;
BEGIN
  -- Generate a new stream key if one is not provided
  IF NEW.stream_key IS NULL THEN
    NEW.stream_key := public.generate_stream_key();
  END IF;
  
  -- Get the user's username to create a friendly stream path
  SELECT username INTO username_val 
  FROM public.profiles 
  WHERE id = NEW.user_id;
  
  -- Fallback to user ID if username is not available
  IF username_val IS NULL THEN
    NEW.stream_path := NEW.user_id;
  ELSE
    NEW.stream_path := username_val;
  END IF;
  
  -- Set default RTMP URL
  IF NEW.rtmp_url IS NULL THEN
    NEW.rtmp_url := 'rtmp://stream.clipt.app/live';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Recreate the trigger
DROP TRIGGER IF EXISTS before_insert_stream_trigger ON public.streams;
CREATE TRIGGER before_insert_stream_trigger
BEFORE INSERT ON public.streams
FOR EACH ROW
EXECUTE FUNCTION public.before_insert_stream();

-- Grant execute permissions to the function
GRANT EXECUTE ON FUNCTION public.generate_stream_key() TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_stream_key() TO service_role;

-- Verify existing stream keys and fix any that are null
UPDATE public.streams
SET stream_key = public.generate_stream_key()
WHERE stream_key IS NULL;

-- Create a view for streams with user data
CREATE OR REPLACE VIEW public.streams_with_user AS
SELECT
  s.*,
  p.username,
  p.display_name,
  p.avatar_url
FROM
  public.streams s
JOIN
  public.profiles p ON s.user_id = p.id;
