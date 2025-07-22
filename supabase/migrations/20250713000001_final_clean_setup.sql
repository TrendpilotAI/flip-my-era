-- Final Clean Setup Migration
-- Date: 2025-07-13
-- This migration consolidates all previous migrations and creates a clean,
-- properly structured database with TEXT-based user IDs for Clerk integration

BEGIN;

-- Drop all existing tables to start completely fresh
DROP TABLE IF EXISTS public.credit_transactions CASCADE;
DROP TABLE IF EXISTS public.user_credits CASCADE;
DROP TABLE IF EXISTS public.tiktok_shares CASCADE;
DROP TABLE IF EXISTS public.user_activities CASCADE;
DROP TABLE IF EXISTS public.memory_books CASCADE;
DROP TABLE IF EXISTS public.ebook_generations CASCADE;
DROP TABLE IF EXISTS public.stories CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Drop any existing functions and triggers
DROP FUNCTION IF EXISTS update_profiles_updated_at() CASCADE;
DROP FUNCTION IF EXISTS is_valid_clerk_user_id(TEXT) CASCADE;

-- ============================================================================
-- CREATE PROFILES TABLE WITH TEXT ID (Clerk-compatible)
-- ============================================================================

CREATE TABLE public.profiles (
  id TEXT PRIMARY KEY, -- Clerk user ID format: user_abc123
  email TEXT,
  name TEXT,
  avatar_url TEXT,
  subscription_status TEXT DEFAULT 'free',
  credits INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================================================
-- CREATE CREDIT SYSTEM TABLES
-- ============================================================================

-- Create user_credits table
CREATE TABLE public.user_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  
  -- Credit balance tracking
  balance INTEGER DEFAULT 0 NOT NULL CHECK (balance >= 0),
  total_earned INTEGER DEFAULT 0 NOT NULL,
  total_spent INTEGER DEFAULT 0 NOT NULL,
  
  -- Subscription information
  subscription_status TEXT DEFAULT 'none',
  subscription_type TEXT DEFAULT NULL,
  subscription_starts_at TIMESTAMP DEFAULT NULL,
  subscription_expires_at TIMESTAMP DEFAULT NULL,
  monthly_credit_allowance INTEGER DEFAULT 0,
  monthly_credits_used INTEGER DEFAULT 0,
  current_period_start TIMESTAMP DEFAULT NULL,
  current_period_end TIMESTAMP DEFAULT NULL,
  
  -- SamCart integration
  samcart_subscription_id VARCHAR(255) DEFAULT NULL,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create credit_transactions table
CREATE TABLE public.credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Transaction details
  type TEXT NOT NULL, -- 'purchase', 'spend', 'refund', etc.
  amount INTEGER NOT NULL, -- positive for credits earned, negative for credits spent
  description TEXT NOT NULL,
  
  -- Balance tracking
  balance_after_transaction INTEGER NOT NULL,
  
  -- Stripe integration
  stripe_session_id TEXT,
  
  -- Transaction metadata
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- CREATE CONTENT TABLES
-- ============================================================================

-- Create stories table
CREATE TABLE public.stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Basic story information
  name TEXT NOT NULL, -- User's name used in the story
  title TEXT, -- Generated or extracted title
  initial_story TEXT NOT NULL, -- The generated story content
  
  -- Generation metadata
  prompt TEXT, -- The original prompt used for generation
  birth_date DATE, -- User's birth date if provided
  personality_type TEXT, -- Personality type used for generation
  era TEXT, -- Era/time period for the story
  location TEXT, -- Location setting for the story
  gender TEXT, -- Gender preference for the story
  transformed_name TEXT, -- Name transformation applied
  
  -- Generation settings
  prompt_data JSONB, -- Original user input data
  generation_settings JSONB, -- AI model settings used
  
  -- Content metadata
  word_count INTEGER,
  reading_time_minutes INTEGER,
  content_rating TEXT DEFAULT 'general',
  tags TEXT[],
  
  -- Status and workflow
  status TEXT DEFAULT 'completed',
  generation_started_at TIMESTAMP,
  generation_completed_at TIMESTAMP,
  
  -- Analytics
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  share_count INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create ebook_generations table
CREATE TABLE public.ebook_generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Book metadata
  title TEXT NOT NULL,
  description TEXT,
  subtitle TEXT,
  author_name TEXT,
  
  -- Book content structure
  chapters JSONB NOT NULL, -- Array of chapter objects
  table_of_contents JSONB,
  cover_image_url TEXT,
  
  -- Generation settings
  generation_settings JSONB,
  style_preferences JSONB,
  image_style TEXT DEFAULT 'children',
  mood TEXT DEFAULT 'happy',
  
  -- Status and publishing
  status TEXT DEFAULT 'draft',
  published_at TIMESTAMP,
  
  -- File storage
  pdf_url TEXT,
  epub_url TEXT,
  images JSONB DEFAULT '[]',
  
  -- Analytics
  view_count INTEGER DEFAULT 0,
  download_count INTEGER DEFAULT 0,
  share_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create memory_books table
CREATE TABLE public.memory_books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  original_story_id UUID REFERENCES stories(id),
  
  -- Book metadata
  title TEXT NOT NULL,
  description TEXT,
  subtitle TEXT,
  author_name TEXT,
  
  -- Book content structure
  chapters JSONB NOT NULL, -- Array of chapter objects
  table_of_contents JSONB,
  cover_image_url TEXT,
  
  -- Generation settings
  generation_settings JSONB,
  style_preferences JSONB,
  image_style TEXT DEFAULT 'children',
  mood TEXT DEFAULT 'happy',
  
  -- Status and publishing
  status TEXT DEFAULT 'draft',
  published_at TIMESTAMP,
  
  -- File storage
  pdf_url TEXT,
  epub_url TEXT,
  images JSONB DEFAULT '[]',
  
  -- Analytics
  view_count INTEGER DEFAULT 0,
  download_count INTEGER DEFAULT 0,
  share_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create user_activities table
CREATE TABLE public.user_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Activity details
  activity_type TEXT NOT NULL, -- 'story_created', 'ebook_generated', 'credits_purchased', etc.
  activity_data JSONB DEFAULT '{}',
  
  -- Reference information
  reference_id UUID, -- ID of the related object (story, ebook, etc.)
  reference_type TEXT, -- Type of the referenced object
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create tiktok_shares table
CREATE TABLE public.tiktok_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  story_id UUID REFERENCES stories(id) ON DELETE CASCADE,
  
  -- Share details
  share_url TEXT,
  share_id TEXT,
  platform TEXT DEFAULT 'tiktok',
  
  -- Analytics
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  share_count INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- CREATE INDEXES
-- ============================================================================

-- Profiles indexes
CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_profiles_subscription_status ON public.profiles(subscription_status);
CREATE INDEX idx_profiles_created_at ON public.profiles(created_at);

-- User credits indexes
CREATE INDEX idx_user_credits_user_id ON user_credits(user_id);
CREATE INDEX idx_user_credits_subscription_status ON user_credits(subscription_status);

-- Credit transactions indexes
CREATE INDEX idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX idx_credit_transactions_created_at ON credit_transactions(created_at);

-- Stories indexes
CREATE INDEX idx_stories_user_id ON stories(user_id);
CREATE INDEX idx_stories_status ON stories(status);
CREATE INDEX idx_stories_created_at ON stories(created_at DESC);

-- Ebook generations indexes
CREATE INDEX idx_ebook_generations_user_id ON ebook_generations(user_id);
CREATE INDEX idx_ebook_generations_status ON ebook_generations(status);

-- Memory books indexes
CREATE INDEX idx_memory_books_user_id ON memory_books(user_id);
CREATE INDEX idx_memory_books_status ON memory_books(status);

-- User activities indexes
CREATE INDEX idx_user_activities_user_id ON user_activities(user_id);
CREATE INDEX idx_user_activities_activity_type ON user_activities(activity_type);
CREATE INDEX idx_user_activities_created_at ON user_activities(created_at);

-- TikTok shares indexes
CREATE INDEX idx_tiktok_shares_user_id ON tiktok_shares(user_id);
CREATE INDEX idx_tiktok_shares_story_id ON tiktok_shares(story_id);

-- ============================================================================
-- CREATE FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for profiles updated_at
CREATE TRIGGER trigger_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_profiles_updated_at();

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ebook_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memory_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tiktok_shares ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- CREATE RLS POLICIES
-- ============================================================================

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT TO authenticated
  USING (id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT TO authenticated
  WITH CHECK (id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE TO authenticated
  USING (id = auth.jwt() ->> 'sub');

-- User credits policies
CREATE POLICY "Users can view own credits" ON user_credits
  FOR SELECT TO authenticated
  USING (user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can insert own credits" ON user_credits
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can update own credits" ON user_credits
  FOR UPDATE TO authenticated
  USING (user_id = auth.jwt() ->> 'sub');

-- Credit transactions policies
CREATE POLICY "Users can view own credit transactions" ON credit_transactions
  FOR SELECT TO authenticated
  USING (user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can insert own credit transactions" ON credit_transactions
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.jwt() ->> 'sub');

-- Stories policies
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

-- Ebook generations policies
CREATE POLICY "Users can view own ebook generations" ON ebook_generations
  FOR SELECT TO authenticated
  USING (user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can insert own ebook generations" ON ebook_generations
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can update own ebook generations" ON ebook_generations
  FOR UPDATE TO authenticated
  USING (user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can delete own ebook generations" ON ebook_generations
  FOR DELETE TO authenticated
  USING (user_id = auth.jwt() ->> 'sub');

-- Memory books policies
CREATE POLICY "Users can view own memory books" ON memory_books
  FOR SELECT TO authenticated
  USING (user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can insert own memory books" ON memory_books
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can update own memory books" ON memory_books
  FOR UPDATE TO authenticated
  USING (user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can delete own memory books" ON memory_books
  FOR DELETE TO authenticated
  USING (user_id = auth.jwt() ->> 'sub');

-- User activities policies
CREATE POLICY "Users can view own activities" ON user_activities
  FOR SELECT TO authenticated
  USING (user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can insert own activities" ON user_activities
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.jwt() ->> 'sub');

-- TikTok shares policies
CREATE POLICY "Users can view own shares" ON tiktok_shares
  FOR SELECT TO authenticated
  USING (user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can insert own shares" ON tiktok_shares
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can update own shares" ON tiktok_shares
  FOR UPDATE TO authenticated
  USING (user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can delete own shares" ON tiktok_shares
  FOR DELETE TO authenticated
  USING (user_id = auth.jwt() ->> 'sub');

COMMIT; 