-- This function generates a secure random stream key
-- To be executed in Supabase SQL Editor
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

-- This function is used when creating a new stream to automatically generate a key
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
  
  -- Set default RTMP URL
  NEW.rtmp_url := 'rtmp://stream.clipt.app/live';
  
  -- Set created_at if not provided
  IF NEW.created_at IS NULL THEN
    NEW.created_at := NOW();
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger to automatically set stream key and other fields on new stream creation
DROP TRIGGER IF EXISTS before_insert_stream_trigger ON public.streams;
CREATE TRIGGER before_insert_stream_trigger
BEFORE INSERT ON public.streams
FOR EACH ROW
EXECUTE FUNCTION public.before_insert_stream();

-- Create an RLS policy to ensure users can only see their own stream keys
CREATE POLICY "Users can view own stream keys" 
ON public.streams 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own streams" 
ON public.streams 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create a policy to allow inserting streams
CREATE POLICY "Users can create streams" 
ON public.streams 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);
