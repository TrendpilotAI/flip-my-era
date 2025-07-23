-- Migration: Ensure Stories Table Exists
-- This migration ensures the stories table exists with the correct structure
-- Date: 2025-01-20

BEGIN;

-- Create stories table if it doesn't exist
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

-- Create indexes for performance (if they don't exist)
CREATE INDEX IF NOT EXISTS idx_stories_user_id ON stories(user_id);
CREATE INDEX IF NOT EXISTS idx_stories_status ON stories(status);
CREATE INDEX IF NOT EXISTS idx_stories_created_at ON stories(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stories_user_status ON stories(user_id, status);

-- Add RLS policies for stories table
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own stories
CREATE POLICY "Users can view own stories" ON public.stories
  FOR SELECT USING (auth.uid()::text = user_id);

-- Policy: Users can insert their own stories
CREATE POLICY "Users can insert own stories" ON public.stories
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- Policy: Users can update their own stories
CREATE POLICY "Users can update own stories" ON public.stories
  FOR UPDATE USING (auth.uid()::text = user_id);

-- Policy: Users can delete their own stories
CREATE POLICY "Users can delete own stories" ON public.stories
  FOR DELETE USING (auth.uid()::text = user_id);

COMMIT; 