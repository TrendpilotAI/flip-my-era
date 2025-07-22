-- Migration: Add Story Memory System Tables
-- This migration adds tables to support enhanced story generation with memory
-- Date: 2025-01-25

BEGIN;

-- ============================================================================
-- STORY OUTLINES TABLE
-- Stores the pre-generated story plan before chapter generation
-- ============================================================================

CREATE TABLE public.story_outlines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ebook_generation_id UUID REFERENCES ebook_generations(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Outline content
  book_title TEXT NOT NULL,
  book_description TEXT,
  chapter_titles TEXT[] NOT NULL, -- Array of chapter titles
  chapter_summaries TEXT[] NOT NULL, -- Array of chapter summaries
  
  -- Story elements
  character_bios JSONB DEFAULT '[]', -- Array of character objects
  world_info JSONB DEFAULT '{}', -- World building information
  key_themes TEXT[], -- Main themes for the story
  plot_outline TEXT, -- Overall plot structure
  
  -- Generation settings
  total_chapters INTEGER NOT NULL,
  story_format TEXT NOT NULL, -- 'short-story', 'novella', etc.
  theme TEXT, -- Taylor Swift theme if applicable
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- CHAPTER SUMMARIES TABLE
-- Stores rolling summaries of generated chapters for context
-- ============================================================================

CREATE TABLE public.chapter_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ebook_generation_id UUID REFERENCES ebook_generations(id) ON DELETE CASCADE,
  story_outline_id UUID REFERENCES story_outlines(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Chapter identification
  chapter_number INTEGER NOT NULL,
  chapter_title TEXT NOT NULL,
  
  -- Summary content
  summary TEXT NOT NULL, -- 3-6 sentence summary
  key_events TEXT[], -- Important events that happened
  character_developments JSONB DEFAULT '[]', -- Character changes/developments
  
  -- Context preservation
  last_chapter_excerpt TEXT, -- Last ~200 words of the chapter
  chapter_word_count INTEGER,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  
  -- Ensure one summary per chapter per ebook
  UNIQUE(ebook_generation_id, chapter_number)
);

-- ============================================================================
-- STORY STATE TABLE
-- Maintains persistent story state across chapters
-- ============================================================================

CREATE TABLE public.story_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ebook_generation_id UUID REFERENCES ebook_generations(id) ON DELETE CASCADE,
  story_outline_id UUID REFERENCES story_outlines(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Current story state
  current_chapter INTEGER NOT NULL DEFAULT 1,
  
  -- Character tracking
  characters JSONB DEFAULT '[]', -- Array of character objects with current status
  character_relationships JSONB DEFAULT '{}', -- Character relationship mappings
  
  -- Plot tracking
  major_plot_events JSONB DEFAULT '[]', -- Completed plot events
  active_plot_threads JSONB DEFAULT '[]', -- Ongoing plot threads
  resolved_conflicts JSONB DEFAULT '[]', -- Resolved conflicts
  pending_conflicts JSONB DEFAULT '[]', -- Unresolved conflicts
  
  -- World state
  current_locations JSONB DEFAULT '[]', -- Current story locations
  world_changes JSONB DEFAULT '[]', -- Changes to the world state
  timeline_events JSONB DEFAULT '[]', -- Chronological events
  
  -- Settings and tone
  current_mood TEXT, -- Current story mood/tone
  pacing_notes TEXT, -- Notes about story pacing
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Ensure one state per ebook generation
  UNIQUE(ebook_generation_id)
);

-- ============================================================================
-- CHAPTER EMBEDDINGS TABLE
-- Stores embeddings for repetition detection
-- ============================================================================

CREATE TABLE public.chapter_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ebook_generation_id UUID REFERENCES ebook_generations(id) ON DELETE CASCADE,
  chapter_summary_id UUID REFERENCES chapter_summaries(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Chapter identification
  chapter_number INTEGER NOT NULL,
  chapter_title TEXT NOT NULL,
  
  -- Embedding data
  embedding_vector JSONB, -- Store embedding as JSON array (384 dimensions)
  text_content TEXT NOT NULL, -- The text that was embedded
  content_type TEXT DEFAULT 'chapter', -- 'chapter', 'summary', etc.
  
  -- Similarity tracking
  max_similarity_score FLOAT DEFAULT 0.0, -- Highest similarity to previous chapters
  similar_chapter_numbers INTEGER[], -- Chapters with high similarity
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  
  -- Ensure one embedding per chapter per ebook
  UNIQUE(ebook_generation_id, chapter_number, content_type)
);

-- ============================================================================
-- CREATE INDEXES
-- ============================================================================

-- Story outlines indexes
CREATE INDEX idx_story_outlines_ebook_generation_id ON story_outlines(ebook_generation_id);
CREATE INDEX idx_story_outlines_user_id ON story_outlines(user_id);
CREATE INDEX idx_story_outlines_created_at ON story_outlines(created_at);

-- Chapter summaries indexes
CREATE INDEX idx_chapter_summaries_ebook_generation_id ON chapter_summaries(ebook_generation_id);
CREATE INDEX idx_chapter_summaries_story_outline_id ON chapter_summaries(story_outline_id);
CREATE INDEX idx_chapter_summaries_user_id ON chapter_summaries(user_id);
CREATE INDEX idx_chapter_summaries_chapter_number ON chapter_summaries(chapter_number);

-- Story state indexes
CREATE INDEX idx_story_state_ebook_generation_id ON story_state(ebook_generation_id);
CREATE INDEX idx_story_state_story_outline_id ON story_state(story_outline_id);
CREATE INDEX idx_story_state_user_id ON story_state(user_id);
CREATE INDEX idx_story_state_current_chapter ON story_state(current_chapter);

-- Chapter embeddings indexes
CREATE INDEX idx_chapter_embeddings_ebook_generation_id ON chapter_embeddings(ebook_generation_id);
CREATE INDEX idx_chapter_embeddings_user_id ON chapter_embeddings(user_id);
CREATE INDEX idx_chapter_embeddings_chapter_number ON chapter_embeddings(chapter_number);

-- GIN index for JSONB embedding vectors
CREATE INDEX idx_chapter_embeddings_vector ON chapter_embeddings 
USING gin (embedding_vector);

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE story_outlines ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapter_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapter_embeddings ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- CREATE RLS POLICIES
-- ============================================================================

-- Story outlines policies
CREATE POLICY "Users can view their own story outlines" ON story_outlines
  FOR SELECT USING (user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can insert their own story outlines" ON story_outlines
  FOR INSERT WITH CHECK (user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can update their own story outlines" ON story_outlines
  FOR UPDATE USING (user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can delete their own story outlines" ON story_outlines
  FOR DELETE USING (user_id = auth.jwt() ->> 'sub');

-- Chapter summaries policies
CREATE POLICY "Users can view their own chapter summaries" ON chapter_summaries
  FOR SELECT USING (user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can insert their own chapter summaries" ON chapter_summaries
  FOR INSERT WITH CHECK (user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can update their own chapter summaries" ON chapter_summaries
  FOR UPDATE USING (user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can delete their own chapter summaries" ON chapter_summaries
  FOR DELETE USING (user_id = auth.jwt() ->> 'sub');

-- Story state policies
CREATE POLICY "Users can view their own story state" ON story_state
  FOR SELECT USING (user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can insert their own story state" ON story_state
  FOR INSERT WITH CHECK (user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can update their own story state" ON story_state
  FOR UPDATE USING (user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can delete their own story state" ON story_state
  FOR DELETE USING (user_id = auth.jwt() ->> 'sub');

-- Chapter embeddings policies
CREATE POLICY "Users can view their own chapter embeddings" ON chapter_embeddings
  FOR SELECT USING (user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can insert their own chapter embeddings" ON chapter_embeddings
  FOR INSERT WITH CHECK (user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can update their own chapter embeddings" ON chapter_embeddings
  FOR UPDATE USING (user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can delete their own chapter embeddings" ON chapter_embeddings
  FOR DELETE USING (user_id = auth.jwt() ->> 'sub');

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to calculate cosine similarity between JSONB embeddings
CREATE OR REPLACE FUNCTION calculate_embedding_similarity(
  embedding1 jsonb,
  embedding2 jsonb
) RETURNS float AS $$
DECLARE
  dot_product float := 0;
  norm1 float := 0;
  norm2 float := 0;
  i int;
  val1 float;
  val2 float;
BEGIN
  -- Calculate dot product and norms
  FOR i IN 0..(jsonb_array_length(embedding1) - 1) LOOP
    val1 := (embedding1->i)::float;
    val2 := (embedding2->i)::float;
    dot_product := dot_product + (val1 * val2);
    norm1 := norm1 + (val1 * val1);
    norm2 := norm2 + (val2 * val2);
  END LOOP;
  
  -- Return cosine similarity
  IF norm1 = 0 OR norm2 = 0 THEN
    RETURN 0;
  END IF;
  
  RETURN dot_product / (sqrt(norm1) * sqrt(norm2));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to find similar chapters based on embeddings
CREATE OR REPLACE FUNCTION find_similar_chapters(
  target_embedding jsonb,
  ebook_generation_id_param uuid,
  similarity_threshold float DEFAULT 0.85,
  limit_count integer DEFAULT 5
) RETURNS TABLE(
  chapter_number integer,
  chapter_title text,
  similarity_score float
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ce.chapter_number,
    ce.chapter_title,
    calculate_embedding_similarity(target_embedding, ce.embedding_vector) as similarity_score
  FROM chapter_embeddings ce
  WHERE ce.ebook_generation_id = ebook_generation_id_param
    AND ce.embedding_vector IS NOT NULL
    AND calculate_embedding_similarity(target_embedding, ce.embedding_vector) >= similarity_threshold
  ORDER BY similarity_score DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

COMMIT; 