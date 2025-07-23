-- Migration: Fix Clerk Authentication for Existing Tables
-- This migration fixes RLS policies to use Clerk JWT authentication for existing tables
-- Date: 2025-07-23

BEGIN;

-- =====================================================
-- PART 1: Fix memory_books RLS policies
-- =====================================================

-- Drop existing memory_books policies if they exist
DROP POLICY IF EXISTS "Users can view own memory books" ON public.memory_books;
DROP POLICY IF EXISTS "Users can insert own memory books" ON public.memory_books;
DROP POLICY IF EXISTS "Users can update own memory books" ON public.memory_books;
DROP POLICY IF EXISTS "Users can delete own memory books" ON public.memory_books;

-- Create memory_books policies using Clerk JWT authentication
CREATE POLICY "Users can view own memory books" ON public.memory_books
  FOR SELECT USING (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can insert own memory books" ON public.memory_books
  FOR INSERT WITH CHECK (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can update own memory books" ON public.memory_books
  FOR UPDATE USING (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can delete own memory books" ON public.memory_books
  FOR DELETE USING (auth.jwt() ->> 'sub' = user_id);

-- =====================================================
-- PART 2: Fix ebook_generations RLS policies
-- =====================================================

-- Drop existing ebook_generations policies
DROP POLICY IF EXISTS "users can select own ebook generations" ON public.ebook_generations;
DROP POLICY IF EXISTS "users can insert own ebook generations" ON public.ebook_generations;
DROP POLICY IF EXISTS "users can update own ebook generations" ON public.ebook_generations;
DROP POLICY IF EXISTS "users can delete own ebook generations" ON public.ebook_generations;

-- Create proper ebook_generations policies using Clerk JWT authentication
CREATE POLICY "Users can view own ebook generations" ON public.ebook_generations
  FOR SELECT USING (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can insert own ebook generations" ON public.ebook_generations
  FOR INSERT WITH CHECK (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can update own ebook generations" ON public.ebook_generations
  FOR UPDATE USING (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can delete own ebook generations" ON public.ebook_generations
  FOR DELETE USING (auth.jwt() ->> 'sub' = user_id);

-- =====================================================
-- PART 3: Create stories table if it doesn't exist
-- =====================================================

-- Create stories table with proper structure for Clerk authentication
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

-- Create indexes for stories table
CREATE INDEX IF NOT EXISTS idx_stories_user_id ON stories(user_id);
CREATE INDEX IF NOT EXISTS idx_stories_status ON stories(status);
CREATE INDEX IF NOT EXISTS idx_stories_created_at ON stories(created_at DESC);

-- Enable RLS for stories table
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;

-- Create stories policies using Clerk JWT authentication
CREATE POLICY "Users can view own stories" ON public.stories
  FOR SELECT USING (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can insert own stories" ON public.stories
  FOR INSERT WITH CHECK (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can update own stories" ON public.stories
  FOR UPDATE USING (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can delete own stories" ON public.stories
  FOR DELETE USING (auth.jwt() ->> 'sub' = user_id);

COMMIT;