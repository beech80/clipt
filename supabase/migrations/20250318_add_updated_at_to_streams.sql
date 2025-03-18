-- Check if updated_at column exists in streams table, if not add it
DO $$
BEGIN
    -- Check if the column exists
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'streams'
          AND column_name = 'updated_at'
    ) THEN
        -- Add the column if it doesn't exist
        ALTER TABLE public.streams ADD COLUMN updated_at TIMESTAMPTZ DEFAULT now();
    END IF;
END
$$;
