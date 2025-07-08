-- Migration: Create User Activities Table
-- This table tracks user activities like downloads and shares
-- Date: 2025-01-18

BEGIN;

-- Create user_activities table
CREATE TABLE user_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Activity information
    activity_type VARCHAR(50) NOT NULL,
    activity_data JSONB,
    resource_type VARCHAR(50), -- 'story', 'ebook', 'profile', etc.
    resource_id TEXT,
    
    -- Session information
    session_id VARCHAR(255),
    ip_address INET,
    user_agent TEXT,
    referrer TEXT,
    
    -- Geolocation (optional)
    country_code VARCHAR(2),
    region VARCHAR(100),
    city VARCHAR(100),
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for analytics queries
CREATE INDEX idx_user_activities_user_id ON user_activities(user_id);
CREATE INDEX idx_user_activities_type ON user_activities(activity_type);
CREATE INDEX idx_user_activities_created_at ON user_activities(created_at DESC);
CREATE INDEX idx_user_activities_session_id ON user_activities(session_id);
CREATE INDEX idx_user_activities_resource ON user_activities(resource_type, resource_id);

-- Enable Row Level Security (RLS)
ALTER TABLE user_activities ENABLE ROW LEVEL SECURITY;

-- Create policies for user_activities
CREATE POLICY "Users can view their own activities" ON user_activities
  FOR SELECT TO authenticated
  USING (
    user_id = auth.jwt() ->> 'sub'
    OR user_id = auth.jwt() ->> 'user_id'
    OR user_id = auth.jwt() ->> 'userId'
  );

CREATE POLICY "Users can insert their own activities" ON user_activities
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.jwt() ->> 'sub'
    OR user_id = auth.jwt() ->> 'user_id'
    OR user_id = auth.jwt() ->> 'userId'
  );

-- Add download_count and share_count columns to ebook_generations if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ebook_generations' AND column_name = 'download_count') THEN
        ALTER TABLE ebook_generations ADD COLUMN download_count INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ebook_generations' AND column_name = 'share_count') THEN
        ALTER TABLE ebook_generations ADD COLUMN share_count INTEGER DEFAULT 0;
    END IF;
END $$;

-- Add download_count and share_count columns to stories if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stories' AND column_name = 'download_count') THEN
        ALTER TABLE stories ADD COLUMN download_count INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stories' AND column_name = 'share_count') THEN
        ALTER TABLE stories ADD COLUMN share_count INTEGER DEFAULT 0;
    END IF;
END $$;

-- Create function to update download/share counts
CREATE OR REPLACE FUNCTION update_content_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Update download count
    IF NEW.activity_type = 'download' THEN
        IF NEW.resource_type = 'ebook' THEN
            UPDATE ebook_generations 
            SET download_count = download_count + 1 
            WHERE id = NEW.resource_id;
        ELSIF NEW.resource_type = 'story' THEN
            UPDATE stories 
            SET download_count = download_count + 1 
            WHERE id = NEW.resource_id;
        END IF;
    END IF;
    
    -- Update share count
    IF NEW.activity_type = 'share' THEN
        IF NEW.resource_type = 'ebook' THEN
            UPDATE ebook_generations 
            SET share_count = share_count + 1 
            WHERE id = NEW.resource_id;
        ELSIF NEW.resource_type = 'story' THEN
            UPDATE stories 
            SET share_count = share_count + 1 
            WHERE id = NEW.resource_id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update stats
CREATE TRIGGER trigger_update_content_stats
    AFTER INSERT ON user_activities
    FOR EACH ROW
    EXECUTE FUNCTION update_content_stats();

COMMIT; 