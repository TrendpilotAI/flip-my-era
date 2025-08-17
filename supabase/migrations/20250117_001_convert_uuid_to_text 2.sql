-- Migration: Convert UUID columns to TEXT for Clerk compatibility
-- This aligns the database schema with Clerk authentication
-- Date: 2025-01-17

BEGIN;

-- Drop foreign key constraints first
ALTER TABLE IF EXISTS stories DROP CONSTRAINT IF EXISTS stories_user_id_fkey;
ALTER TABLE IF EXISTS tiktok_shares DROP CONSTRAINT IF EXISTS tiktok_shares_user_id_fkey;
ALTER TABLE IF EXISTS ebook_generations DROP CONSTRAINT IF EXISTS ebook_generations_user_id_fkey;

-- Drop the profiles constraint to auth.users
ALTER TABLE IF EXISTS profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Convert profiles.id from UUID to TEXT
ALTER TABLE profiles ALTER COLUMN id TYPE TEXT;

-- Convert user_id columns from UUID to TEXT
ALTER TABLE IF EXISTS stories ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE IF EXISTS tiktok_shares ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE IF EXISTS ebook_generations ALTER COLUMN user_id TYPE TEXT;

-- Recreate foreign key constraints pointing to profiles(id)
ALTER TABLE IF EXISTS stories 
ADD CONSTRAINT stories_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE IF EXISTS tiktok_shares 
ADD CONSTRAINT tiktok_shares_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE IF EXISTS ebook_generations 
ADD CONSTRAINT ebook_generations_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Update RLS policies to work with TEXT user IDs
-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Create new policies for TEXT-based Clerk user IDs
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT TO authenticated
  USING (id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT TO authenticated
  WITH CHECK (id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE TO authenticated
  USING (id = auth.jwt() ->> 'sub');

-- Update stories policies if table exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'stories') THEN
        DROP POLICY IF EXISTS "Users can view own stories" ON stories;
        DROP POLICY IF EXISTS "Users can insert own stories" ON stories;
        DROP POLICY IF EXISTS "Users can update own stories" ON stories;
        DROP POLICY IF EXISTS "Users can delete own stories" ON stories;
        
        CREATE POLICY "Users can view own stories" ON stories
          FOR SELECT TO authenticated
          USING (user_id = auth.jwt() ->> 'sub');
          
        CREATE POLICY "Users can insert own stories" ON stories
          FOR INSERT TO authenticated
          WITH CHECK (user_id = auth.jwt() ->> 'sub');
          
        CREATE POLICY "Users can update own stories" ON stories
          FOR UPDATE TO authenticated
          USING (user_id = auth.jwt() ->> 'sub');
          
        CREATE POLICY "Users can delete own stories" ON stories
          FOR DELETE TO authenticated
          USING (user_id = auth.jwt() ->> 'sub');
    END IF;
END $$;

-- Update tiktok_shares policies
DROP POLICY IF EXISTS "Allow users to view their own shares" ON tiktok_shares;
DROP POLICY IF EXISTS "Allow authenticated users to create shares" ON tiktok_shares;

CREATE POLICY "Allow users to view their own shares" ON tiktok_shares
  FOR SELECT TO authenticated
  USING (user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Allow authenticated users to create shares" ON tiktok_shares
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.jwt() ->> 'sub');

COMMIT; 