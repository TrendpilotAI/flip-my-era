-- Direct SQL script to fix ebook generation issues
-- Run this directly in your Supabase SQL editor

BEGIN;

-- Remove the problematic unique constraint if it exists
ALTER TABLE ebook_generations DROP CONSTRAINT IF EXISTS unique_story_per_user;

-- Ensure style_preferences column exists and has proper default
DO $$ 
BEGIN 
  -- Check if column exists
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'ebook_generations' 
    AND column_name = 'style_preferences'
  ) THEN
    -- Add column if it doesn't exist
    ALTER TABLE ebook_generations 
    ADD COLUMN style_preferences JSONB DEFAULT '{}'::jsonb;
  END IF;
  
  -- Update existing NULL values to empty object
  UPDATE ebook_generations 
  SET style_preferences = '{}'::jsonb 
  WHERE style_preferences IS NULL;
  
  -- Set proper default for future records
  ALTER TABLE ebook_generations 
  ALTER COLUMN style_preferences SET DEFAULT '{}'::jsonb;
  
  -- Ensure column is not null
  ALTER TABLE ebook_generations 
  ALTER COLUMN style_preferences SET NOT NULL;
END $$;

COMMIT;

-- Verify the changes
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default 
FROM information_schema.columns 
WHERE table_name = 'ebook_generations' 
AND column_name = 'style_preferences';