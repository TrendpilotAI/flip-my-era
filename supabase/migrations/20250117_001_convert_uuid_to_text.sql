-- Migration: Convert UUID columns to TEXT for Clerk compatibility
-- This aligns the database schema with Clerk authentication
-- Date: 2025-01-17

BEGIN;

-- STEP 1: Drop all RLS policies that depend on the columns we're changing
-- Drop existing profiles policies FIRST (before altering column types)
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Drop stories policies if table exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'stories') THEN
        DROP POLICY IF EXISTS "Users can view own stories" ON stories;
        DROP POLICY IF EXISTS "Users can insert own stories" ON stories;
        DROP POLICY IF EXISTS "Users can update own stories" ON stories;
        DROP POLICY IF EXISTS "Users can delete own stories" ON stories;
    END IF;
END $$;

-- Drop tiktok_shares policies
DROP POLICY IF EXISTS "Allow users to view their own shares" ON tiktok_shares;
DROP POLICY IF EXISTS "Allow authenticated users to create shares" ON tiktok_shares;

-- Drop ebook_generations policies if they exist
DROP POLICY IF EXISTS "Users can view own ebooks" ON ebook_generations;
DROP POLICY IF EXISTS "Users can insert own ebooks" ON ebook_generations;
DROP POLICY IF EXISTS "Users can update own ebooks" ON ebook_generations;
DROP POLICY IF EXISTS "Users can delete own ebooks" ON ebook_generations;

-- Drop credit_transactions policies if they exist
DROP POLICY IF EXISTS "Users can view own credit transactions" ON credit_transactions;

-- STEP 2: Drop foreign key constraints
ALTER TABLE IF EXISTS stories DROP CONSTRAINT IF EXISTS stories_user_id_fkey;
ALTER TABLE IF EXISTS tiktok_shares DROP CONSTRAINT IF EXISTS tiktok_shares_user_id_fkey;
ALTER TABLE IF EXISTS ebook_generations DROP CONSTRAINT IF EXISTS ebook_generations_user_id_fkey;
ALTER TABLE IF EXISTS credit_transactions DROP CONSTRAINT IF EXISTS credit_transactions_user_id_fkey;

-- Drop the profiles constraint to auth.users
ALTER TABLE IF EXISTS profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- STEP 3: Convert column types from UUID to TEXT
-- Convert profiles.id from UUID to TEXT
ALTER TABLE profiles ALTER COLUMN id TYPE TEXT;

-- Convert user_id columns from UUID to TEXT
ALTER TABLE IF EXISTS stories ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE IF EXISTS tiktok_shares ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE IF EXISTS ebook_generations ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE IF EXISTS credit_transactions ALTER COLUMN user_id TYPE TEXT;

-- STEP 4: Recreate foreign key constraints pointing to profiles(id)
ALTER TABLE IF EXISTS stories 
ADD CONSTRAINT stories_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE IF EXISTS tiktok_shares 
ADD CONSTRAINT tiktok_shares_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE IF EXISTS ebook_generations 
ADD CONSTRAINT ebook_generations_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE IF EXISTS credit_transactions 
ADD CONSTRAINT credit_transactions_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- STEP 5: Recreate RLS policies with TEXT-based user IDs
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

-- Recreate stories policies if table exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'stories') THEN
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

-- Recreate tiktok_shares policies
CREATE POLICY "Allow users to view their own shares" ON tiktok_shares
  FOR SELECT TO authenticated
  USING (user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Allow authenticated users to create shares" ON tiktok_shares
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.jwt() ->> 'sub');

-- Update ebook_generations policies if table exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ebook_generations') THEN
        CREATE POLICY "Users can view own ebooks" ON ebook_generations
          FOR SELECT TO authenticated
          USING (user_id = auth.jwt() ->> 'sub');
          
        CREATE POLICY "Users can insert own ebooks" ON ebook_generations
          FOR INSERT TO authenticated
          WITH CHECK (user_id = auth.jwt() ->> 'sub');
          
        CREATE POLICY "Users can update own ebooks" ON ebook_generations
          FOR UPDATE TO authenticated
          USING (user_id = auth.jwt() ->> 'sub');
          
        CREATE POLICY "Users can delete own ebooks" ON ebook_generations
          FOR DELETE TO authenticated
          USING (user_id = auth.jwt() ->> 'sub');
    END IF;
END $$;

-- Update credit_transactions policies if table exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'credit_transactions') THEN
        CREATE POLICY "Users can view own credit transactions" ON credit_transactions
          FOR SELECT TO authenticated
          USING (user_id = auth.jwt() ->> 'sub');
    END IF;
END $$;

COMMIT; 