-- Migration: Create Memory Books Table
-- This table stores the actual generated ebooks for user access
-- Date: 2025-06-30

BEGIN;

-- Create book status enum
CREATE TYPE book_status AS ENUM ('draft', 'generating', 'processing', 'completed', 'published', 'archived');

-- Create memory_books table
CREATE TABLE memory_books (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    original_story_id TEXT,
    ebook_generation_id UUID REFERENCES ebook_generations(id),
    
    -- Book metadata
    title VARCHAR(255) NOT NULL,
    description TEXT,
    subtitle VARCHAR(255),
    author_name VARCHAR(255),
    
    -- Book content structure
    chapters JSONB NOT NULL, -- Array of chapter objects
    table_of_contents JSONB, -- Generated TOC
    cover_image_url TEXT,
    back_cover_text TEXT,
    
    -- Generation settings
    generation_settings JSONB, -- AI settings used for generation
    style_preferences JSONB, -- User's style choices (theme, mood, etc.)
    image_style VARCHAR(100) DEFAULT 'children',
    mood VARCHAR(100) DEFAULT 'happy',
    target_age_group VARCHAR(50) DEFAULT 'children',
    
    -- Book specifications
    page_count INTEGER,
    chapter_count INTEGER,
    word_count INTEGER,
    image_count INTEGER,
    
    -- Status and publishing
    status book_status DEFAULT 'draft',
    generation_started_at TIMESTAMP,
    generation_completed_at TIMESTAMP,
    published_at TIMESTAMP,
    
    -- File storage
    pdf_url TEXT,
    epub_url TEXT,
    mobi_url TEXT,
    images JSONB DEFAULT '[]', -- Array of image URLs with metadata
    
    -- Analytics and engagement
    view_count INTEGER DEFAULT 0,
    download_count INTEGER DEFAULT 0,
    share_count INTEGER DEFAULT 0,
    rating_average DECIMAL(3,2) DEFAULT 0.00,
    rating_count INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_memory_books_user_id ON memory_books(user_id);
CREATE INDEX idx_memory_books_status ON memory_books(status);
CREATE INDEX idx_memory_books_created_at ON memory_books(created_at DESC);
CREATE INDEX idx_memory_books_published_at ON memory_books(published_at DESC) WHERE published_at IS NOT NULL;
CREATE INDEX idx_memory_books_user_status ON memory_books(user_id, status);
CREATE INDEX idx_memory_books_rating ON memory_books(rating_average DESC, rating_count DESC);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION update_memory_books_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updating updated_at timestamp
CREATE TRIGGER trigger_memory_books_updated_at
    BEFORE UPDATE ON memory_books
    FOR EACH ROW EXECUTE FUNCTION update_memory_books_updated_at();

-- Set up RLS policies
ALTER TABLE memory_books ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own books
CREATE POLICY "Users can view own books" ON memory_books
    FOR SELECT USING (auth.jwt() ->> 'sub' = user_id);

-- Allow users to insert their own books
CREATE POLICY "Users can insert own books" ON memory_books
    FOR INSERT WITH CHECK (auth.jwt() ->> 'sub' = user_id);

-- Allow users to update their own books
CREATE POLICY "Users can update own books" ON memory_books
    FOR UPDATE USING (auth.jwt() ->> 'sub' = user_id);

-- Allow users to delete their own books
CREATE POLICY "Users can delete own books" ON memory_books
    FOR DELETE USING (auth.jwt() ->> 'sub' = user_id);

COMMIT; 