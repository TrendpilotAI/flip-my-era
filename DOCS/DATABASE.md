# FlipMyEra Database Schema & Migrations

## 📊 Current Database Schema

### Existing Tables

#### profiles
```sql
CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    avatar_url TEXT,
    subscription_status VARCHAR(50) DEFAULT 'free',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

#### books (Current Implementation)
```sql
CREATE TABLE books (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    metadata JSONB,
    preview BOOLEAN DEFAULT false,
    status VARCHAR(50) DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT NOW()
);
```

#### api_settings
```sql
CREATE TABLE api_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    groq_api_key TEXT,
    runware_api_key TEXT,
    deepseek_api_key TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

## 🎯 Enhanced Production Schema

### Enhanced profiles Table
```sql
-- Migration: Add new columns to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS
    clerk_user_id VARCHAR(255) UNIQUE,
    subscription_tier subscription_tier DEFAULT 'free',
    subscription_expires_at TIMESTAMP,
    total_books_created INTEGER DEFAULT 0,
    total_stories_created INTEGER DEFAULT 0,
    last_active_at TIMESTAMP DEFAULT NOW(),
    preferences JSONB DEFAULT '{}',
    usage_stats JSONB DEFAULT '{}';

-- Create subscription tier enum
CREATE TYPE subscription_tier AS ENUM ('free', 'basic', 'premium', 'family');

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_profiles_clerk_user_id ON profiles(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_tier ON profiles(subscription_tier);
CREATE INDEX IF NOT EXISTS idx_profiles_last_active ON profiles(last_active_at);
```

### stories Table (New)
```sql
CREATE TABLE stories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    
    -- Generation metadata
    prompt_data JSONB, -- Original user input
    generation_settings JSONB, -- AI model settings used
    personality_type VARCHAR(100),
    era VARCHAR(100),
    location VARCHAR(255),
    
    -- Content metadata
    word_count INTEGER,
    reading_time_minutes INTEGER,
    content_rating VARCHAR(20) DEFAULT 'general',
    tags TEXT[],
    
    -- Status and workflow
    status story_status DEFAULT 'draft',
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

-- Story status enum
CREATE TYPE story_status AS ENUM ('draft', 'generating', 'completed', 'published', 'archived');

-- Indexes for performance
CREATE INDEX idx_stories_user_id ON stories(user_id);
CREATE INDEX idx_stories_status ON stories(status);
CREATE INDEX idx_stories_created_at ON stories(created_at DESC);
CREATE INDEX idx_stories_tags ON stories USING GIN(tags);
CREATE INDEX idx_stories_user_status ON stories(user_id, status);
```

### memory_books Table (Enhanced Ebooks)
```sql
CREATE TABLE memory_books (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    original_story_id UUID REFERENCES stories(id),
    
    -- Book metadata
    title VARCHAR(255) NOT NULL,
    description TEXT,
    subtitle VARCHAR(255),
    author_name VARCHAR(255), -- User's preferred author name
    
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
    
    -- Pricing and commerce
    price_cents INTEGER DEFAULT 0,
    is_free BOOLEAN DEFAULT true,
    stripe_product_id VARCHAR(255),
    
    -- Analytics and engagement
    view_count INTEGER DEFAULT 0,
    download_count INTEGER DEFAULT 0,
    purchase_count INTEGER DEFAULT 0,
    share_count INTEGER DEFAULT 0,
    rating_average DECIMAL(3,2) DEFAULT 0.00,
    rating_count INTEGER DEFAULT 0,
    
    -- SEO and discoverability
    slug VARCHAR(255) UNIQUE,
    meta_description TEXT,
    keywords TEXT[],
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Book status enum
CREATE TYPE book_status AS ENUM ('draft', 'generating', 'processing', 'completed', 'published', 'archived');

-- Indexes for performance and queries
CREATE INDEX idx_memory_books_user_id ON memory_books(user_id);
CREATE INDEX idx_memory_books_status ON memory_books(status);
CREATE INDEX idx_memory_books_created_at ON memory_books(created_at DESC);
CREATE INDEX idx_memory_books_published_at ON memory_books(published_at DESC) WHERE published_at IS NOT NULL;
CREATE INDEX idx_memory_books_slug ON memory_books(slug) WHERE slug IS NOT NULL;
CREATE INDEX idx_memory_books_keywords ON memory_books USING GIN(keywords);
CREATE INDEX idx_memory_books_user_status ON memory_books(user_id, status);
CREATE INDEX idx_memory_books_rating ON memory_books(rating_average DESC, rating_count DESC);
```

### user_activities Table (Analytics)
```sql
CREATE TABLE user_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Activity information
    activity_type VARCHAR(50) NOT NULL,
    activity_data JSONB,
    resource_type VARCHAR(50), -- 'story', 'memory_book', 'profile', etc.
    resource_id UUID,
    
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

-- Indexes for analytics queries
CREATE INDEX idx_user_activities_user_id ON user_activities(user_id);
CREATE INDEX idx_user_activities_type ON user_activities(activity_type);
CREATE INDEX idx_user_activities_created_at ON user_activities(created_at DESC);
CREATE INDEX idx_user_activities_session_id ON user_activities(session_id);
CREATE INDEX idx_user_activities_resource ON user_activities(resource_type, resource_id);
```

### book_reviews Table (User Feedback)
```sql
CREATE TABLE book_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    memory_book_id UUID NOT NULL REFERENCES memory_books(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Review content
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(255),
    content TEXT,
    
    -- Review metadata
    is_verified_purchase BOOLEAN DEFAULT false,
    is_featured BOOLEAN DEFAULT false,
    helpful_count INTEGER DEFAULT 0,
    
    -- Moderation
    status review_status DEFAULT 'pending',
    moderated_at TIMESTAMP,
    moderated_by UUID REFERENCES profiles(id),
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Ensure one review per user per book
    UNIQUE(memory_book_id, user_id)
);

-- Review status enum
CREATE TYPE review_status AS ENUM ('pending', 'approved', 'rejected', 'hidden');

-- Indexes
CREATE INDEX idx_book_reviews_memory_book_id ON book_reviews(memory_book_id);
CREATE INDEX idx_book_reviews_user_id ON book_reviews(user_id);
CREATE INDEX idx_book_reviews_rating ON book_reviews(rating);
CREATE INDEX idx_book_reviews_status ON book_reviews(status);
CREATE INDEX idx_book_reviews_created_at ON book_reviews(created_at DESC);
```

### book_collections Table (User Organization)
```sql
CREATE TABLE book_collections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Collection metadata
    name VARCHAR(255) NOT NULL,
    description TEXT,
    cover_image_url TEXT,
    
    -- Collection settings
    is_public BOOLEAN DEFAULT false,
    is_featured BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Junction table for books in collections
CREATE TABLE book_collection_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    collection_id UUID NOT NULL REFERENCES book_collections(id) ON DELETE CASCADE,
    memory_book_id UUID NOT NULL REFERENCES memory_books(id) ON DELETE CASCADE,
    
    -- Item metadata
    position INTEGER DEFAULT 0,
    notes TEXT,
    
    -- Timestamps
    added_at TIMESTAMP DEFAULT NOW(),
    
    -- Ensure unique book per collection
    UNIQUE(collection_id, memory_book_id)
);

-- Indexes
CREATE INDEX idx_book_collections_user_id ON book_collections(user_id);
CREATE INDEX idx_book_collections_public ON book_collections(is_public) WHERE is_public = true;
CREATE INDEX idx_book_collection_items_collection_id ON book_collection_items(collection_id);
CREATE INDEX idx_book_collection_items_memory_book_id ON book_collection_items(memory_book_id);
```

### subscriptions Table (Billing Management)
```sql
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Subscription details
    tier subscription_tier NOT NULL,
    status subscription_status DEFAULT 'active',
    
    -- Billing information
    external_subscription_id VARCHAR(255), -- Stripe subscription ID
    external_customer_id VARCHAR(255), -- Stripe customer ID
    
    -- Pricing
    price_cents INTEGER NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    billing_cycle VARCHAR(20) DEFAULT 'monthly', -- monthly, yearly
    
    -- Dates
    started_at TIMESTAMP DEFAULT NOW(),
    current_period_start TIMESTAMP,
    current_period_end TIMESTAMP,
    canceled_at TIMESTAMP,
    trial_start TIMESTAMP,
    trial_end TIMESTAMP,
    
    -- Usage limits
    monthly_story_limit INTEGER,
    monthly_book_limit INTEGER,
    monthly_image_limit INTEGER,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Subscription status enum
CREATE TYPE subscription_status AS ENUM ('active', 'canceled', 'past_due', 'unpaid', 'trialing');

-- Indexes
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_external_id ON subscriptions(external_subscription_id);
CREATE INDEX idx_subscriptions_period_end ON subscriptions(current_period_end);
```

## 🔄 Migration Scripts

### Migration 001: Enhanced Profiles
```sql
-- migrations/001_enhance_profiles.sql
BEGIN;

-- Add new columns to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS
    clerk_user_id VARCHAR(255) UNIQUE,
    subscription_tier VARCHAR(50) DEFAULT 'free',
    subscription_expires_at TIMESTAMP,
    total_books_created INTEGER DEFAULT 0,
    total_stories_created INTEGER DEFAULT 0,
    last_active_at TIMESTAMP DEFAULT NOW(),
    preferences JSONB DEFAULT '{}',
    usage_stats JSONB DEFAULT '{}';

-- Create subscription tier enum if it doesn't exist
DO $$ BEGIN
    CREATE TYPE subscription_tier AS ENUM ('free', 'basic', 'premium', 'family');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Update existing subscription_status to use new enum
ALTER TABLE profiles ALTER COLUMN subscription_tier TYPE subscription_tier USING subscription_tier::subscription_tier;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_profiles_clerk_user_id ON profiles(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_tier ON profiles(subscription_tier);
CREATE INDEX IF NOT EXISTS idx_profiles_last_active ON profiles(last_active_at);

COMMIT;
```

### Migration 002: Create Stories Table
```sql
-- migrations/002_create_stories.sql
BEGIN;

-- Create story status enum
CREATE TYPE story_status AS ENUM ('draft', 'generating', 'completed', 'published', 'archived');

-- Create stories table
CREATE TABLE stories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    prompt_data JSONB,
    generation_settings JSONB,
    personality_type VARCHAR(100),
    era VARCHAR(100),
    location VARCHAR(255),
    word_count INTEGER,
    reading_time_minutes INTEGER,
    content_rating VARCHAR(20) DEFAULT 'general',
    tags TEXT[],
    status story_status DEFAULT 'draft',
    generation_started_at TIMESTAMP,
    generation_completed_at TIMESTAMP,
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    share_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_stories_user_id ON stories(user_id);
CREATE INDEX idx_stories_status ON stories(status);
CREATE INDEX idx_stories_created_at ON stories(created_at DESC);
CREATE INDEX idx_stories_tags ON stories USING GIN(tags);
CREATE INDEX idx_stories_user_status ON stories(user_id, status);

COMMIT;
```

### Migration 003: Enhanced Memory Books
```sql
-- migrations/003_enhance_memory_books.sql
BEGIN;

-- Create book status enum
CREATE TYPE book_status AS ENUM ('draft', 'generating', 'processing', 'completed', 'published', 'archived');

-- Drop existing books table and recreate as memory_books
DROP TABLE IF EXISTS books;

-- Create enhanced memory_books table
CREATE TABLE memory_books (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    original_story_id UUID REFERENCES stories(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    subtitle VARCHAR(255),
    author_name VARCHAR(255),
    chapters JSONB NOT NULL,
    table_of_contents JSONB,
    cover_image_url TEXT,
    back_cover_text TEXT,
    generation_settings JSONB,
    style_preferences JSONB,
    image_style VARCHAR(100) DEFAULT 'children',
    mood VARCHAR(100) DEFAULT 'happy',
    target_age_group VARCHAR(50) DEFAULT 'children',
    page_count INTEGER,
    chapter_count INTEGER,
    word_count INTEGER,
    image_count INTEGER,
    status book_status DEFAULT 'draft',
    generation_started_at TIMESTAMP,
    generation_completed_at TIMESTAMP,
    published_at TIMESTAMP,
    pdf_url TEXT,
    epub_url TEXT,
    mobi_url TEXT,
    images JSONB DEFAULT '[]',
    price_cents INTEGER DEFAULT 0,
    is_free BOOLEAN DEFAULT true,
    stripe_product_id VARCHAR(255),
    view_count INTEGER DEFAULT 0,
    download_count INTEGER DEFAULT 0,
    purchase_count INTEGER DEFAULT 0,
    share_count INTEGER DEFAULT 0,
    rating_average DECIMAL(3,2) DEFAULT 0.00,
    rating_count INTEGER DEFAULT 0,
    slug VARCHAR(255) UNIQUE,
    meta_description TEXT,
    keywords TEXT[],
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_memory_books_user_id ON memory_books(user_id);
CREATE INDEX idx_memory_books_status ON memory_books(status);
CREATE INDEX idx_memory_books_created_at ON memory_books(created_at DESC);
CREATE INDEX idx_memory_books_published_at ON memory_books(published_at DESC) WHERE published_at IS NOT NULL;
CREATE INDEX idx_memory_books_slug ON memory_books(slug) WHERE slug IS NOT NULL;
CREATE INDEX idx_memory_books_keywords ON memory_books USING GIN(keywords);
CREATE INDEX idx_memory_books_user_status ON memory_books(user_id, status);
CREATE INDEX idx_memory_books_rating ON memory_books(rating_average DESC, rating_count DESC);

COMMIT;
```

### Migration 004: Analytics and Reviews
```sql
-- migrations/004_analytics_reviews.sql
BEGIN;

-- Create user activities table
CREATE TABLE user_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL,
    activity_data JSONB,
    resource_type VARCHAR(50),
    resource_id UUID,
    session_id VARCHAR(255),
    ip_address INET,
    user_agent TEXT,
    referrer TEXT,
    country_code VARCHAR(2),
    region VARCHAR(100),
    city VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create review status enum
CREATE TYPE review_status AS ENUM ('pending', 'approved', 'rejected', 'hidden');

-- Create book reviews table
CREATE TABLE book_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    memory_book_id UUID NOT NULL REFERENCES memory_books(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(255),
    content TEXT,
    is_verified_purchase BOOLEAN DEFAULT false,
    is_featured BOOLEAN DEFAULT false,
    helpful_count INTEGER DEFAULT 0,
    status review_status DEFAULT 'pending',
    moderated_at TIMESTAMP,
    moderated_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(memory_book_id, user_id)
);

-- Create indexes
CREATE INDEX idx_user_activities_user_id ON user_activities(user_id);
CREATE INDEX idx_user_activities_type ON user_activities(activity_type);
CREATE INDEX idx_user_activities_created_at ON user_activities(created_at DESC);
CREATE INDEX idx_user_activities_session_id ON user_activities(session_id);
CREATE INDEX idx_user_activities_resource ON user_activities(resource_type, resource_id);

CREATE INDEX idx_book_reviews_memory_book_id ON book_reviews(memory_book_id);
CREATE INDEX idx_book_reviews_user_id ON book_reviews(user_id);
CREATE INDEX idx_book_reviews_rating ON book_reviews(rating);
CREATE INDEX idx_book_reviews_status ON book_reviews(status);
CREATE INDEX idx_book_reviews_created_at ON book_reviews(created_at DESC);

COMMIT;
```

## 🔧 Database Functions and Triggers

### Update Timestamps Trigger
```sql
-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to relevant tables
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stories_updated_at BEFORE UPDATE ON stories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_memory_books_updated_at BEFORE UPDATE ON memory_books
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_book_reviews_updated_at BEFORE UPDATE ON book_reviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### Update User Statistics Trigger
```sql
-- Function to update user statistics
CREATE OR REPLACE FUNCTION update_user_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_TABLE_NAME = 'stories' THEN
        UPDATE profiles 
        SET total_stories_created = (
            SELECT COUNT(*) FROM stories WHERE user_id = NEW.user_id AND status = 'completed'
        )
        WHERE id = NEW.user_id;
    ELSIF TG_TABLE_NAME = 'memory_books' THEN
        UPDATE profiles 
        SET total_books_created = (
            SELECT COUNT(*) FROM memory_books WHERE user_id = NEW.user_id AND status = 'completed'
        )
        WHERE id = NEW.user_id;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers
CREATE TRIGGER update_story_stats AFTER INSERT OR UPDATE ON stories
    FOR EACH ROW EXECUTE FUNCTION update_user_stats();

CREATE TRIGGER update_book_stats AFTER INSERT OR UPDATE ON memory_books
    FOR EACH ROW EXECUTE FUNCTION update_user_stats();
```

### Update Book Ratings Trigger
```sql
-- Function to update book ratings
CREATE OR REPLACE FUNCTION update_book_rating()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE memory_books 
    SET 
        rating_average = (
            SELECT ROUND(AVG(rating)::numeric, 2) 
            FROM book_reviews 
            WHERE memory_book_id = COALESCE(NEW.memory_book_id, OLD.memory_book_id) 
            AND status = 'approved'
        ),
        rating_count = (
            SELECT COUNT(*) 
            FROM book_reviews 
            WHERE memory_book_id = COALESCE(NEW.memory_book_id, OLD.memory_book_id) 
            AND status = 'approved'
        )
    WHERE id = COALESCE(NEW.memory_book_id, OLD.memory_book_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

-- Apply trigger
CREATE TRIGGER update_book_rating_trigger 
    AFTER INSERT OR UPDATE OR DELETE ON book_reviews
    FOR EACH ROW EXECUTE FUNCTION update_book_rating();
```

## 📊 Performance Optimization

### Query Optimization Examples
```sql
-- Efficient user dashboard query
SELECT 
    mb.id,
    mb.title,
    mb.status,
    mb.created_at,
    mb.view_count,
    mb.rating_average,
    s.title as original_story_title
FROM memory_books mb
LEFT JOIN stories s ON mb.original_story_id = s.id
WHERE mb.user_id = $1
ORDER BY mb.created_at DESC
LIMIT 20;

-- Popular books query with pagination
SELECT 
    mb.id,
    mb.title,
    mb.description,
    mb.cover_image_url,
    mb.rating_average,
    mb.rating_count,
    p.name as author_name
FROM memory_books mb
JOIN profiles p ON mb.user_id = p.id
WHERE mb.status = 'published'
ORDER BY mb.rating_average DESC, mb.rating_count DESC
OFFSET $1 LIMIT $2;

-- User activity analytics
SELECT 
    activity_type,
    COUNT(*) as count,
    DATE_TRUNC('day', created_at) as date
FROM user_activities
WHERE user_id = $1 
    AND created_at >= NOW() - INTERVAL '30 days'
GROUP BY activity_type, DATE_TRUNC('day', created_at)
ORDER BY date DESC;
```

### Database Maintenance
```sql
-- Regular maintenance queries
-- Analyze tables for query optimization
ANALYZE profiles;
ANALYZE stories;
ANALYZE memory_books;
ANALYZE user_activities;
ANALYZE book_reviews;

-- Vacuum to reclaim space
VACUUM ANALYZE profiles;
VACUUM ANALYZE stories;
VACUUM ANALYZE memory_books;

-- Check index usage
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;
```

## 🔒 Row Level Security (RLS)

### Enable RLS on Tables
```sql
-- Enable RLS on user-specific tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE book_reviews ENABLE ROW LEVEL SECURITY;

-- Profiles policy
CREATE POLICY "Users can view and edit their own profile" ON profiles
    FOR ALL USING (auth.uid() = id);

-- Stories policy
CREATE POLICY "Users can manage their own stories" ON stories
    FOR ALL USING (auth.uid() = user_id);

-- Memory books policy
CREATE POLICY "Users can manage their own books" ON memory_books
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view published books" ON memory_books
    FOR SELECT USING (status = 'published');

-- User activities policy
CREATE POLICY "Users can view their own activities" ON user_activities
    FOR SELECT USING (auth.uid() = user_id);

-- Book reviews policy
CREATE POLICY "Users can manage their own reviews" ON book_reviews
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view approved reviews" ON book_reviews
    FOR SELECT USING (status = 'approved');
```

## 📈 Monitoring and Metrics

### Database Health Queries
```sql
-- Table sizes
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Active connections
SELECT 
    count(*) as active_connections,
    state
FROM pg_stat_activity 
GROUP BY state;

-- Slow queries
SELECT 
    query,
    calls,
    total_time,
    mean_time,
    rows
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;
```

---

*This database schema supports FlipMyEra's evolution from a simple story generator to a comprehensive MemoryBook platform with user management, analytics, and commercial features.* 

# FlipMyEra Database Schema & Migrations

## 📊 Current Database Schema

### Existing Tables

#### profiles
```sql
CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    avatar_url TEXT,
    subscription_status VARCHAR(50) DEFAULT 'free',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

#### books (Current Implementation)
```sql
CREATE TABLE books (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    metadata JSONB,
    preview BOOLEAN DEFAULT false,
    status VARCHAR(50) DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT NOW()
);
```

## 🎯 Enhanced Production Schema

### Enhanced memory_books Table (MemoryBooks/Ebooks)
```sql
CREATE TABLE memory_books (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    original_story_id UUID REFERENCES stories(id),
    
    -- Book metadata
    title VARCHAR(255) NOT NULL,
    description TEXT,
    subtitle VARCHAR(255),
    author_name VARCHAR(255),
    
    -- Book content structure
    chapters JSONB NOT NULL, -- Array of chapter objects
    table_of_contents JSONB,
    cover_image_url TEXT,
    
    -- Generation settings
    generation_settings JSONB,
    style_preferences JSONB,
    image_style VARCHAR(100) DEFAULT 'children',
    mood VARCHAR(100) DEFAULT 'happy',
    
    -- Status and publishing
    status book_status DEFAULT 'draft',
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

CREATE TYPE book_status AS ENUM ('draft', 'generating', 'completed', 'published', 'archived');
```

### stories Table (New)
```sql
CREATE TABLE stories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    
    -- Generation metadata
    prompt_data JSONB,
    generation_settings JSONB,
    personality_type VARCHAR(100),
    era VARCHAR(100),
    location VARCHAR(255),
    
    -- Status and workflow
    status story_status DEFAULT 'draft',
    
    -- Analytics
    view_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TYPE story_status AS ENUM ('draft', 'generating', 'completed', 'published', 'archived');
```

### Enhanced profiles Table
```sql
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS
    clerk_user_id VARCHAR(255) UNIQUE,
    subscription_tier subscription_tier DEFAULT 'free',
    subscription_expires_at TIMESTAMP,
    total_books_created INTEGER DEFAULT 0,
    total_stories_created INTEGER DEFAULT 0,
    preferences JSONB DEFAULT '{}',
    usage_stats JSONB DEFAULT '{}';

CREATE TYPE subscription_tier AS ENUM ('free', 'basic', 'premium', 'family');
```

### user_activities Table (Analytics)
```sql
CREATE TABLE user_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL,
    activity_data JSONB,
    resource_type VARCHAR(50),
    resource_id UUID,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
```

## 🔄 Migration Scripts

### Migration 001: Enhanced Profiles
```sql
BEGIN;

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS
    clerk_user_id VARCHAR(255) UNIQUE,
    subscription_tier VARCHAR(50) DEFAULT 'free',
    total_books_created INTEGER DEFAULT 0,
    total_stories_created INTEGER DEFAULT 0,
    preferences JSONB DEFAULT '{}',
    usage_stats JSONB DEFAULT '{}';

CREATE TYPE subscription_tier AS ENUM ('free', 'basic', 'premium', 'family');

CREATE INDEX IF NOT EXISTS idx_profiles_clerk_user_id ON profiles(clerk_user_id);

COMMIT;
```

### Migration 002: Create Stories Table
```sql
BEGIN;

CREATE TYPE story_status AS ENUM ('draft', 'generating', 'completed', 'published', 'archived');

CREATE TABLE stories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    prompt_data JSONB,
    generation_settings JSONB,
    status story_status DEFAULT 'draft',
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_stories_user_id ON stories(user_id);
CREATE INDEX idx_stories_status ON stories(status);

COMMIT;
```

### Migration 003: Enhanced Memory Books
```sql
BEGIN;

CREATE TYPE book_status AS ENUM ('draft', 'generating', 'completed', 'published', 'archived');

-- Rename existing books table to memory_books and enhance
ALTER TABLE books RENAME TO memory_books;

ALTER TABLE memory_books ADD COLUMN IF NOT EXISTS
    original_story_id UUID REFERENCES stories(id),
    description TEXT,
    chapters JSONB NOT NULL DEFAULT '[]',
    generation_settings JSONB,
    style_preferences JSONB,
    cover_image_url TEXT,
    pdf_url TEXT,
    epub_url TEXT,
    images JSONB DEFAULT '[]',
    view_count INTEGER DEFAULT 0,
    download_count INTEGER DEFAULT 0,
    share_count INTEGER DEFAULT 0;

ALTER TABLE memory_books ALTER COLUMN status TYPE book_status USING status::book_status;

CREATE INDEX idx_memory_books_user_id ON memory_books(user_id);
CREATE INDEX idx_memory_books_status ON memory_books(status);

COMMIT;
```

## 🔧 Database Functions and Triggers

### Update User Statistics Trigger
```sql
CREATE OR REPLACE FUNCTION update_user_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_TABLE_NAME = 'stories' THEN
        UPDATE profiles 
        SET total_stories_created = (
            SELECT COUNT(*) FROM stories WHERE user_id = NEW.user_id
        )
        WHERE id = NEW.user_id;
    ELSIF TG_TABLE_NAME = 'memory_books' THEN
        UPDATE profiles 
        SET total_books_created = (
            SELECT COUNT(*) FROM memory_books WHERE user_id = NEW.user_id
        )
        WHERE id = NEW.user_id;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_story_stats AFTER INSERT ON stories
    FOR EACH ROW EXECUTE FUNCTION update_user_stats();

CREATE TRIGGER update_book_stats AFTER INSERT ON memory_books
    FOR EACH ROW EXECUTE FUNCTION update_user_stats();
```

## 📊 Performance Optimization

### Essential Indexes
```sql
-- Core performance indexes
CREATE INDEX idx_memory_books_user_id ON memory_books(user_id);
CREATE INDEX idx_memory_books_status ON memory_books(status);
CREATE INDEX idx_memory_books_created_at ON memory_books(created_at DESC);
CREATE INDEX idx_stories_user_id ON stories(user_id);
CREATE INDEX idx_stories_status ON stories(status);
CREATE INDEX idx_user_activities_user_id ON user_activities(user_id);
CREATE INDEX idx_user_activities_type ON user_activities(activity_type);
```

### Query Examples
```sql
-- User dashboard query
SELECT 
    mb.id,
    mb.title,
    mb.status,
    mb.created_at,
    mb.view_count
FROM memory_books mb
WHERE mb.user_id = $1
ORDER BY mb.created_at DESC
LIMIT 20;

-- User activity analytics
SELECT 
    activity_type,
    COUNT(*) as count
FROM user_activities
WHERE user_id = $1 
    AND created_at >= NOW() - INTERVAL '30 days'
GROUP BY activity_type;
```

## 🔒 Row Level Security (RLS)

### Enable RLS Policies
```sql
-- Enable RLS on tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activities ENABLE ROW LEVEL SECURITY;

-- Users can manage their own data
CREATE POLICY "Users can manage their own profile" ON profiles
    FOR ALL USING (auth.uid() = id);

CREATE POLICY "Users can manage their own stories" ON stories
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own books" ON memory_books
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own activities" ON user_activities
    FOR SELECT USING (auth.uid() = user_id);
``` 