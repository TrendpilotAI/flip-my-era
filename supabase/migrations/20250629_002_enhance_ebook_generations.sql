-- Migration 002: Enhance Ebook Generations for Credit System
-- Phase 1A: Enhanced E-Book Generation System
-- Date: 2025-06-29

BEGIN;

-- Add credit tracking columns to ebook_generations table
-- First check if the table exists and if columns don't already exist
DO $$
BEGIN
    -- Check if ebook_generations table exists, if not create a basic version
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ebook_generations') THEN
        CREATE TABLE ebook_generations (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
            story_id UUID,
            title VARCHAR(255),
            content TEXT,
            status VARCHAR(50) DEFAULT 'generating',
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        );
        
        CREATE INDEX idx_ebook_generations_user_id ON ebook_generations(user_id);
        CREATE INDEX idx_ebook_generations_status ON ebook_generations(status);
        CREATE INDEX idx_ebook_generations_created_at ON ebook_generations(created_at DESC);
    END IF;
    
    -- Add credit-related columns if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ebook_generations' AND column_name = 'credits_used') THEN
        ALTER TABLE ebook_generations ADD COLUMN credits_used INTEGER DEFAULT 1;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ebook_generations' AND column_name = 'generation_cost_cents') THEN
        ALTER TABLE ebook_generations ADD COLUMN generation_cost_cents INTEGER DEFAULT 299;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ebook_generations' AND column_name = 'paid_with_credits') THEN
        ALTER TABLE ebook_generations ADD COLUMN paid_with_credits BOOLEAN DEFAULT true;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ebook_generations' AND column_name = 'transaction_id') THEN
        ALTER TABLE ebook_generations ADD COLUMN transaction_id UUID REFERENCES credit_transactions(id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ebook_generations' AND column_name = 'story_type') THEN
        ALTER TABLE ebook_generations ADD COLUMN story_type VARCHAR(50) DEFAULT 'short_story';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ebook_generations' AND column_name = 'theme') THEN
        ALTER TABLE ebook_generations ADD COLUMN theme VARCHAR(100);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ebook_generations' AND column_name = 'chapter_count') THEN
        ALTER TABLE ebook_generations ADD COLUMN chapter_count INTEGER;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ebook_generations' AND column_name = 'word_count') THEN
        ALTER TABLE ebook_generations ADD COLUMN word_count INTEGER;
    END IF;
END $$;

-- Create index for transaction tracking
CREATE INDEX IF NOT EXISTS idx_ebook_generations_transaction_id ON ebook_generations(transaction_id);

-- Create function to update ebook generation timestamps
CREATE OR REPLACE FUNCTION update_ebook_generations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updating updated_at timestamp
DROP TRIGGER IF EXISTS trigger_ebook_generations_updated_at ON ebook_generations;
CREATE TRIGGER trigger_ebook_generations_updated_at
    BEFORE UPDATE ON ebook_generations
    FOR EACH ROW EXECUTE FUNCTION update_ebook_generations_updated_at();

COMMIT;