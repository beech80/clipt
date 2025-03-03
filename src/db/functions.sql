-- Function to create the follows table if it doesn't exist
CREATE OR REPLACE FUNCTION create_follows_table_if_not_exists()
RETURNS void AS $$
BEGIN
  -- Check if the table already exists
  IF NOT EXISTS (
    SELECT FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'follows'
  ) THEN
    -- Create the follows table
    CREATE TABLE public.follows (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
      UNIQUE (follower_id, following_id)
    );

    -- Add RLS policies
    ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

    -- Allow users to see who they are following/followed by
    CREATE POLICY "Users can see their own follows" 
      ON public.follows 
      FOR SELECT 
      USING (auth.uid() = follower_id OR auth.uid() = following_id);

    -- Allow users to follow/unfollow others
    CREATE POLICY "Users can create their own follows" 
      ON public.follows 
      FOR INSERT 
      WITH CHECK (auth.uid() = follower_id);

    -- Allow users to unfollow others
    CREATE POLICY "Users can delete their own follows" 
      ON public.follows 
      FOR DELETE 
      USING (auth.uid() = follower_id);
      
    -- Grant permissions to authenticated users
    GRANT SELECT, INSERT, DELETE ON public.follows TO authenticated;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
