-- Migration: Recreate Profiles Table with TEXT ID for Clerk Integration
-- Date: 2025-07-06
-- This migration recreates the profiles table and all dependent tables
-- with proper TEXT-based user IDs for Clerk authentication

BEGIN;

-- ============================================================================
-- RECREATE PROFILES TABLE WITH TEXT ID
-- ============================================================================

-- Create profiles table with TEXT ID for Clerk integration
CREATE TABLE IF NOT EXISTS public.profiles (
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
-- RECREATE DEPENDENT TABLES
-- ============================================================================

-- Create user_credits table
CREATE TABLE IF NOT EXISTS public.user_credits (
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
CREATE TABLE IF NOT EXISTS public.credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Transaction details
  amount INTEGER NOT NULL, -- positive for credits earned, negative for credits spent
  transaction_type TEXT NOT NULL,
  description TEXT NOT NULL,
  
  -- Reference information
  reference_id VARCHAR(255), -- SamCart order ID, ebook generation ID, etc.
  samcart_order_id VARCHAR(255),
  ebook_generation_id UUID,
  
  -- Transaction metadata
  metadata JSONB DEFAULT '{}',
  
  -- Balance after transaction (for audit trail)
  balance_after_transaction INTEGER NOT NULL,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create stories table
CREATE TABLE IF NOT EXISTS public.stories (
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
CREATE TABLE IF NOT EXISTS public.ebook_generations (
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
CREATE TABLE IF NOT EXISTS public.memory_books (
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
CREATE TABLE IF NOT EXISTS public.user_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  activity_data JSONB,
  resource_type TEXT,
  resource_id UUID,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create tiktok_shares table
CREATE TABLE IF NOT EXISTS public.tiktok_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
  story_id UUID REFERENCES stories(id) ON DELETE CASCADE,
  share_url TEXT,
  share_data JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

-- Profiles table indexes
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_status ON public.profiles(subscription_status);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles(created_at);

-- User credits indexes
CREATE INDEX IF NOT EXISTS idx_user_credits_user_id ON user_credits(user_id);
CREATE INDEX IF NOT EXISTS idx_user_credits_subscription_status ON user_credits(subscription_status);

-- Credit transactions indexes
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at ON credit_transactions(created_at);

-- Stories indexes
CREATE INDEX IF NOT EXISTS idx_stories_user_id ON stories(user_id);
CREATE INDEX IF NOT EXISTS idx_stories_status ON stories(status);
CREATE INDEX IF NOT EXISTS idx_stories_created_at ON stories(created_at DESC);

-- Ebook generations indexes
CREATE INDEX IF NOT EXISTS idx_ebook_generations_user_id ON ebook_generations(user_id);
CREATE INDEX IF NOT EXISTS idx_ebook_generations_status ON ebook_generations(status);

-- Memory books indexes
CREATE INDEX IF NOT EXISTS idx_memory_books_user_id ON memory_books(user_id);
CREATE INDEX IF NOT EXISTS idx_memory_books_status ON memory_books(status);

-- User activities indexes
CREATE INDEX IF NOT EXISTS idx_user_activities_user_id ON user_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activities_activity_type ON user_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_user_activities_created_at ON user_activities(created_at);

-- TikTok shares indexes
CREATE INDEX IF NOT EXISTS idx_tiktok_shares_user_id ON tiktok_shares(user_id);
CREATE INDEX IF NOT EXISTS idx_tiktok_shares_story_id ON tiktok_shares(story_id);

-- ============================================================================
-- SET UP ROW LEVEL SECURITY (RLS)
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

-- Profiles table policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.jwt() ->> 'sub' = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.jwt() ->> 'sub' = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.jwt() ->> 'sub' = id);

-- User credits table policies
CREATE POLICY "Users can view own credits" ON public.user_credits
  FOR SELECT USING (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can update own credits" ON public.user_credits
  FOR UPDATE USING (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can insert own credits" ON public.user_credits
  FOR INSERT WITH CHECK (auth.jwt() ->> 'sub' = user_id);

-- Credit transactions table policies
CREATE POLICY "Users can view own transactions" ON public.credit_transactions
  FOR SELECT USING (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can insert own transactions" ON public.credit_transactions
  FOR INSERT WITH CHECK (auth.jwt() ->> 'sub' = user_id);

-- Stories table policies
CREATE POLICY "Users can view own stories" ON public.stories
  FOR SELECT USING (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can insert own stories" ON public.stories
  FOR INSERT WITH CHECK (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can update own stories" ON public.stories
  FOR UPDATE USING (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can delete own stories" ON public.stories
  FOR DELETE USING (auth.jwt() ->> 'sub' = user_id);

-- Ebook generations table policies
CREATE POLICY "Users can view own ebook generations" ON public.ebook_generations
  FOR SELECT USING (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can insert own ebook generations" ON public.ebook_generations
  FOR INSERT WITH CHECK (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can update own ebook generations" ON public.ebook_generations
  FOR UPDATE USING (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can delete own ebook generations" ON public.ebook_generations
  FOR DELETE USING (auth.jwt() ->> 'sub' = user_id);

-- Memory books table policies
CREATE POLICY "Users can view own memory books" ON public.memory_books
  FOR SELECT USING (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can insert own memory books" ON public.memory_books
  FOR INSERT WITH CHECK (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can update own memory books" ON public.memory_books
  FOR UPDATE USING (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can delete own memory books" ON public.memory_books
  FOR DELETE USING (auth.jwt() ->> 'sub' = user_id);

-- User activities table policies
CREATE POLICY "Users can view own activities" ON public.user_activities
  FOR SELECT USING (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can insert own activities" ON public.user_activities
  FOR INSERT WITH CHECK (auth.jwt() ->> 'sub' = user_id);

-- TikTok shares table policies
CREATE POLICY "Users can view own shares" ON public.tiktok_shares
  FOR SELECT USING (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can insert own shares" ON public.tiktok_shares
  FOR INSERT WITH CHECK (auth.jwt() ->> 'sub' = user_id);

-- ============================================================================
-- CREATE TRIGGERS AND FUNCTIONS
-- ============================================================================

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating updated_at timestamp
CREATE TRIGGER trigger_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_profiles_updated_at();

-- ============================================================================
-- ADD COMMENTS FOR CLARITY
-- ============================================================================

COMMENT ON TABLE public.profiles IS 'User profiles with Clerk user IDs (TEXT format)';
COMMENT ON COLUMN public.profiles.id IS 'Clerk user ID (format: user_abc123) - stored as TEXT, not UUID';
COMMENT ON TABLE public.user_credits IS 'User credit balances and subscription information';
COMMENT ON COLUMN public.user_credits.user_id IS 'Clerk user ID (format: user_abc123) - stored as TEXT, not UUID';
COMMENT ON TABLE public.credit_transactions IS 'Audit trail for all credit transactions';
COMMENT ON COLUMN public.credit_transactions.user_id IS 'Clerk user ID (format: user_abc123) - stored as TEXT, not UUID';

COMMIT; 