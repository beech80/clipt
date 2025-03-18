-- Migration to add updated_at column and trigger to streams table
-- This handles the case where the streams table is missing the updated_at column
-- and sets up a trigger to maintain it automatically

-- First, check if the updated_at column exists
DO $$
BEGIN
    -- Add the updated_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'streams' 
        AND column_name = 'updated_at'
    ) THEN
        -- Add the updated_at column with a default value of now()
        EXECUTE 'ALTER TABLE streams ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()';
        RAISE NOTICE 'Added updated_at column to streams table';
    ELSE
        RAISE NOTICE 'updated_at column already exists in streams table';
    END IF;

    -- Create a function to update the updated_at timestamp
    CREATE OR REPLACE FUNCTION update_timestamp()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    -- Drop the trigger if it exists
    DROP TRIGGER IF EXISTS set_timestamp ON streams;

    -- Create a trigger to automatically update the timestamp
    CREATE TRIGGER set_timestamp
    BEFORE UPDATE ON streams
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

    RAISE NOTICE 'Created/updated timestamp trigger for streams table';
END;
$$ LANGUAGE plpgsql;
