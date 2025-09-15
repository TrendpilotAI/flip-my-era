-- Migration: Add is_public column to stories table
-- Date: 2025-09-15
-- Purpose: Enable public sharing of stories with proper indexing

BEGIN;

-- Add is_public column to stories table if it doesn't exist
ALTER TABLE public.stories 
ADD COLUMN IF NOT EXISTS is_public boolean DEFAULT false;

-- Add comment to explain the column
COMMENT ON COLUMN public.stories.is_public IS 'Whether the story is publicly viewable by all users';

-- Create index for better query performance on public stories
CREATE INDEX IF NOT EXISTS idx_stories_is_public 
ON public.stories(is_public);

-- Create index for combined user_id and is_public queries
CREATE INDEX IF NOT EXISTS idx_stories_user_id_is_public 
ON public.stories(user_id, is_public);

-- Update RLS policies to handle public stories
-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Anyone can view public stories" ON public.stories;

-- Create policy for viewing public stories
CREATE POLICY "Anyone can view public stories" 
ON public.stories
FOR SELECT 
USING (is_public = true);

-- Update the existing "Users can view own stories" policy to be more explicit
DROP POLICY IF EXISTS "Users can view own stories" ON public.stories;

CREATE POLICY "Users can view own stories" 
ON public.stories
FOR SELECT 
USING (
  auth.jwt() ->> 'sub' = user_id 
  OR is_public = true
);

-- Ensure other policies remain unchanged
DROP POLICY IF EXISTS "Users can insert own stories" ON public.stories;
CREATE POLICY "Users can insert own stories" 
ON public.stories
FOR INSERT 
WITH CHECK (auth.jwt() ->> 'sub' = user_id);

DROP POLICY IF EXISTS "Users can update own stories" ON public.stories;
CREATE POLICY "Users can update own stories" 
ON public.stories
FOR UPDATE 
USING (auth.jwt() ->> 'sub' = user_id);

DROP POLICY IF EXISTS "Users can delete own stories" ON public.stories;
CREATE POLICY "Users can delete own stories" 
ON public.stories
FOR DELETE 
USING (auth.jwt() ->> 'sub' = user_id);

-- Add a partial index for faster queries on public stories
CREATE INDEX IF NOT EXISTS idx_stories_public_created_at 
ON public.stories(created_at DESC) 
WHERE is_public = true;

-- Analyze the table to update statistics after adding the column and indexes
ANALYZE public.stories;

COMMIT;

-- Verification query to confirm the migration
SELECT 
  'Migration completed successfully!' as status,
  EXISTS(
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'stories' 
      AND column_name = 'is_public'
  ) as is_public_column_exists,
  EXISTS(
    SELECT 1 
    FROM pg_indexes 
    WHERE schemaname = 'public' 
      AND tablename = 'stories' 
      AND indexname = 'idx_stories_is_public'
  ) as is_public_index_exists;
