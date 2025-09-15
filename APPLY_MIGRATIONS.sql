-- Comprehensive Database Migration Script for Flip My Era
-- Run this in your Supabase SQL Editor: https://supabase.com/dashboard/project/tusdijypopftcmlenahr/sql/new

-- ============================================
-- Step 1: Fix Profiles Table Schema
-- ============================================

-- Ensure profiles table has the correct 'name' column (not 'full_name')
DO $$ 
BEGIN
  -- Add 'name' column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'profiles' AND column_name = 'name') THEN
    ALTER TABLE profiles ADD COLUMN name TEXT;
  END IF;
  
  -- If 'full_name' exists, migrate data to 'name' column
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'profiles' AND column_name = 'full_name') THEN
    UPDATE profiles SET name = full_name WHERE name IS NULL AND full_name IS NOT NULL;
    ALTER TABLE profiles DROP COLUMN full_name;
  END IF;
END $$;

-- ============================================
-- Step 2: Ensure ebook_generations Table Exists
-- ============================================

CREATE TABLE IF NOT EXISTS ebook_generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  title TEXT,
  content JSONB,
  status TEXT DEFAULT 'pending',
  story_type TEXT,
  story_preferences JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key constraint if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                 WHERE table_name = 'ebook_generations' 
                 AND constraint_type = 'FOREIGN KEY'
                 AND constraint_name = 'ebook_generations_user_id_fkey') THEN
    ALTER TABLE ebook_generations 
    ADD CONSTRAINT ebook_generations_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ebook_generations_user_id ON ebook_generations(user_id);
CREATE INDEX IF NOT EXISTS idx_ebook_generations_created_at ON ebook_generations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ebook_generations_status ON ebook_generations(status);

-- ============================================
-- Step 3: Set up RLS Policies for ebook_generations
-- ============================================

ALTER TABLE ebook_generations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own ebooks" ON ebook_generations;
DROP POLICY IF EXISTS "Users can insert own ebooks" ON ebook_generations;
DROP POLICY IF EXISTS "Users can update own ebooks" ON ebook_generations;
DROP POLICY IF EXISTS "Users can delete own ebooks" ON ebook_generations;

-- Create new policies
CREATE POLICY "Users can view own ebooks" ON ebook_generations
  FOR SELECT USING (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can insert own ebooks" ON ebook_generations
  FOR INSERT WITH CHECK (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can update own ebooks" ON ebook_generations
  FOR UPDATE USING (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can delete own ebooks" ON ebook_generations
  FOR DELETE USING (auth.jwt() ->> 'sub' = user_id);

-- ============================================
-- Step 4: Ensure Stories Table Exists
-- ============================================
-- Note: is_public column has been added via migration 20250915_001_add_stories_is_public.sql

CREATE TABLE IF NOT EXISTS stories (
  id TEXT PRIMARY KEY DEFAULT substr(md5(random()::text), 1, 20),
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT,
  personality_type TEXT,
  era TEXT,
  additional_context TEXT,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb,
  is_public BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add is_public column if it doesn't exist (for existing tables)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'stories' AND column_name = 'is_public') THEN
    ALTER TABLE stories ADD COLUMN is_public BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Add foreign key constraint if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                 WHERE table_name = 'stories' 
                 AND constraint_type = 'FOREIGN KEY'
                 AND constraint_name = 'stories_user_id_fkey') THEN
    ALTER TABLE stories 
    ADD CONSTRAINT stories_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_stories_user_id ON stories(user_id);
CREATE INDEX IF NOT EXISTS idx_stories_created_at ON stories(created_at DESC);

-- Only create is_public index if column exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'stories' AND column_name = 'is_public') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes 
                   WHERE tablename = 'stories' AND indexname = 'idx_stories_is_public') THEN
      CREATE INDEX idx_stories_is_public ON stories(is_public);
    END IF;
  END IF;
END $$;

-- Set up RLS for stories
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own stories" ON stories;
DROP POLICY IF EXISTS "Users can insert own stories" ON stories;
DROP POLICY IF EXISTS "Users can update own stories" ON stories;
DROP POLICY IF EXISTS "Users can delete own stories" ON stories;
DROP POLICY IF EXISTS "Anyone can view public stories" ON stories;

CREATE POLICY "Users can view own stories" ON stories
  FOR SELECT USING (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can insert own stories" ON stories
  FOR INSERT WITH CHECK (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can update own stories" ON stories
  FOR UPDATE USING (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can delete own stories" ON stories
  FOR DELETE USING (auth.jwt() ->> 'sub' = user_id);

-- Only create public stories policy if is_public column exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'stories' AND column_name = 'is_public') THEN
    EXECUTE 'CREATE POLICY "Anyone can view public stories" ON stories
      FOR SELECT USING (is_public = true)';
  END IF;
EXCEPTION
  WHEN duplicate_object THEN
    NULL; -- Policy already exists, ignore
END $$;

-- ============================================
-- Step 5: Create Update Timestamp Functions
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updating timestamps
DROP TRIGGER IF EXISTS update_ebook_generations_updated_at ON ebook_generations;
CREATE TRIGGER update_ebook_generations_updated_at
    BEFORE UPDATE ON ebook_generations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_stories_updated_at ON stories;
CREATE TRIGGER update_stories_updated_at
    BEFORE UPDATE ON stories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Step 6: Ensure Credits System Tables
-- ============================================

-- Create credit_transactions table if it doesn't exist
CREATE TABLE IF NOT EXISTS credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  operation TEXT NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at ON credit_transactions(created_at DESC);

-- Set up RLS for credit_transactions
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own credit transactions" ON credit_transactions;
CREATE POLICY "Users can view own credit transactions" ON credit_transactions
  FOR SELECT USING (auth.jwt() ->> 'sub' = user_id);

-- ============================================
-- Step 7: Ensure TikTok Shares Table
-- ============================================

CREATE TABLE IF NOT EXISTS tiktok_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  story_id TEXT REFERENCES stories(id) ON DELETE CASCADE,
  share_url TEXT,
  platform TEXT DEFAULT 'tiktok',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tiktok_shares_user_id ON tiktok_shares(user_id);
CREATE INDEX IF NOT EXISTS idx_tiktok_shares_story_id ON tiktok_shares(story_id);

-- Set up RLS for tiktok_shares
ALTER TABLE tiktok_shares ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own shares" ON tiktok_shares;
DROP POLICY IF EXISTS "Users can insert own shares" ON tiktok_shares;

CREATE POLICY "Users can view own shares" ON tiktok_shares
  FOR SELECT USING (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can insert own shares" ON tiktok_shares
  FOR INSERT WITH CHECK (auth.jwt() ->> 'sub' = user_id);

-- ============================================
-- Step 8: Verify and Display Results
-- ============================================

-- Display table structure to confirm migrations
SELECT 
  'Tables created/updated successfully!' as status,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public') as total_tables,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'profiles') as profile_columns,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'ebook_generations') as ebook_columns,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'stories') as story_columns;

-- Show current table structure
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name IN ('profiles', 'ebook_generations', 'stories', 'credit_transactions', 'tiktok_shares')
ORDER BY table_name, ordinal_position;
