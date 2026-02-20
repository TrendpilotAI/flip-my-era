-- Migration: Fix ebook_generations user_id field for Clerk integration
-- Date: 2025-07-03

BEGIN;

-- First, drop all RLS policies that depend on user_id (both naming variants)
DROP POLICY IF EXISTS "Users can view their own ebook generations" ON ebook_generations;
DROP POLICY IF EXISTS "Users can insert their own ebook generations" ON ebook_generations;
DROP POLICY IF EXISTS "Users can update their own ebook generations" ON ebook_generations;
DROP POLICY IF EXISTS "Users can delete their own ebook generations" ON ebook_generations;
DROP POLICY IF EXISTS "Users can view own ebooks" ON ebook_generations;
DROP POLICY IF EXISTS "Users can insert own ebooks" ON ebook_generations;
DROP POLICY IF EXISTS "Users can update own ebooks" ON ebook_generations;
DROP POLICY IF EXISTS "Users can delete own ebooks" ON ebook_generations;

-- Drop the existing foreign key constraint and index
ALTER TABLE ebook_generations DROP CONSTRAINT IF EXISTS ebook_generations_user_id_fkey;
DROP INDEX IF EXISTS idx_ebook_generations_user_id;

-- Change user_id from UUID to TEXT to match Clerk user IDs
ALTER TABLE ebook_generations ALTER COLUMN user_id TYPE TEXT;

-- Add new foreign key constraint to profiles table
ALTER TABLE ebook_generations ADD CONSTRAINT ebook_generations_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Recreate the index
CREATE INDEX idx_ebook_generations_user_id ON ebook_generations(user_id);

-- Create new policies that work with Clerk JWT
CREATE POLICY "Users can view their own ebook generations" ON ebook_generations
  FOR SELECT USING (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can insert their own ebook generations" ON ebook_generations
  FOR INSERT WITH CHECK (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can update their own ebook generations" ON ebook_generations
  FOR UPDATE USING (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can delete their own ebook generations" ON ebook_generations
  FOR DELETE USING (auth.jwt() ->> 'sub' = user_id);

COMMIT; 