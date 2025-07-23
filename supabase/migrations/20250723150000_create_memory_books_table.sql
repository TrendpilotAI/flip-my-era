-- Migration: Create Memory Books Table
-- This migration creates the memory_books table for storing user-generated ebooks
-- Date: 2025-07-23

BEGIN;

-- Create memory_books table
CREATE TABLE IF NOT EXISTS public.memory_books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Basic book information
  title TEXT NOT NULL,
  description TEXT,
  subtitle TEXT,
  author_name TEXT,
  
  -- Content structure
  chapters JSONB DEFAULT '[]'::jsonb,
  table_of_contents JSONB DEFAULT '[]'::jsonb,
  
  -- Visual elements
  cover_image_url TEXT,
  images JSONB DEFAULT '[]'::jsonb,
  
  -- Generation settings
  generation_settings JSONB DEFAULT '{}'::jsonb,
  style_preferences JSONB DEFAULT '{}'::jsonb,
  image_style TEXT,
  mood TEXT,
  
  -- Status and metadata
  status TEXT DEFAULT 'draft',
  published_at TIMESTAMP,
  pdf_url TEXT,
  epub_url TEXT,
  
  -- Analytics
  view_count BIGINT DEFAULT 0,
  download_count BIGINT DEFAULT 0,
  share_count BIGINT DEFAULT 0,
  rating_average DECIMAL(3,2) DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_memory_books_user_id ON memory_books(user_id);
CREATE INDEX IF NOT EXISTS idx_memory_books_status ON memory_books(status);
CREATE INDEX IF NOT EXISTS idx_memory_books_created_at ON memory_books(created_at DESC);

-- Add RLS policies for memory_books table
ALTER TABLE public.memory_books ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own memory books
CREATE POLICY "Users can view own memory books" ON public.memory_books
  FOR SELECT USING (auth.uid()::text = user_id);

-- Policy: Users can insert their own memory books
CREATE POLICY "Users can insert own memory books" ON public.memory_books
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- Policy: Users can update their own memory books
CREATE POLICY "Users can update own memory books" ON public.memory_books
  FOR UPDATE USING (auth.uid()::text = user_id);

-- Policy: Users can delete their own memory books
CREATE POLICY "Users can delete own memory books" ON public.memory_books
  FOR DELETE USING (auth.uid()::text = user_id);

COMMIT; 