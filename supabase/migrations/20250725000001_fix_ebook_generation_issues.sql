-- Fix ebook generation issues: remove problematic unique constraint and ensure proper style_preferences handling
-- Date: 2025-07-25

BEGIN;

-- Remove the problematic unique constraint that's causing duplicate issues
-- The constraint unique_story_per_user (user_id, story_id) is problematic because:
-- 1. story_id can be null for many records
-- 2. Multiple ebooks can be generated from the same story
-- 3. It's causing conflicts during concurrent generation
ALTER TABLE ebook_generations DROP CONSTRAINT IF EXISTS unique_story_per_user;

-- Ensure style_preferences column exists and has proper default
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'ebook_generations' 
    AND column_name = 'style_preferences'
  ) THEN
    ALTER TABLE ebook_generations 
    ADD COLUMN style_preferences JSONB DEFAULT '{}'::jsonb;
  ELSE
    -- Update existing NULL values to empty object
    UPDATE ebook_generations 
    SET style_preferences = '{}'::jsonb 
    WHERE style_preferences IS NULL;
    
    -- Set proper default for future records
    ALTER TABLE ebook_generations 
    ALTER COLUMN style_preferences SET DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- Add a comment explaining the table purpose
COMMENT ON TABLE ebook_generations IS 'Stores memory-enhanced ebook generations with styling preferences. Each record represents a unique ebook generation.';

-- Add a comment on the style_preferences column
COMMENT ON COLUMN ebook_generations.style_preferences IS 'JSONB object containing user-selected styling preferences for the ebook (fonts, colors, layout, etc.)';

COMMIT;