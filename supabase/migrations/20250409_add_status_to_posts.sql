-- Migration: Add status column to posts table
-- This migration addresses the "could not find the 'status' column of 'posts'" error

-- Add status column to posts table if it doesn't already exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public'
    AND table_name = 'posts'
    AND column_name = 'status'
  ) THEN
    ALTER TABLE public.posts ADD COLUMN status TEXT DEFAULT 'published';
  END IF;
END
$$;

-- Create an index on the status column for better performance
CREATE INDEX IF NOT EXISTS idx_posts_status ON public.posts(status);

-- Update any existing posts to have the default status
UPDATE public.posts SET status = 'published' WHERE status IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.posts.status IS 'The status of the post: draft, published, processing, error, etc.';
