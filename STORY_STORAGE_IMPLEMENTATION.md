# Story Storage Implementation

## Overview

This implementation provides a complete solution for storing and retrieving user-generated stories in the Flip My Era application. The system uses Supabase as the backend database with Clerk authentication.

## Database Schema

### Stories Table

The stories table is already created in the database with the following structure:

```sql
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
```

## Implementation Components

### 1. Edge Function (`supabase/functions/stories/index.ts`)

A Supabase Edge Function that handles CRUD operations for stories:

- **GET /stories** - Get all stories for the authenticated user
- **GET /stories/{id}** - Get a specific story by ID
- **POST /stories** - Create a new story
- **PUT /stories/{id}** - Update an existing story
- **DELETE /stories/{id}** - Delete a story

The function uses Clerk authentication tokens to identify users and ensures users can only access their own stories.

### 2. API Client (`src/core/api/stories.ts`)

A TypeScript API client that provides a clean interface for story operations:

```typescript
export const storiesAPI = {
  getStories(): Promise<Story[]>
  getStory(id: string): Promise<Story>
  createStory(storyData: CreateStoryData): Promise<Story>
  updateStory(id: string, updates: Partial<CreateStoryData>): Promise<Story>
  deleteStory(id: string): Promise<void>
}
```

### 3. Custom Hook (`src/modules/story/hooks/useStories.ts`)

A React hook that provides state management for stories:

```typescript
export const useStories = () => {
  return {
    stories: Story[],
    loading: boolean,
    error: string | null,
    loadStories: () => Promise<void>,
    createStory: (data) => Promise<Story>,
    updateStory: (id, updates) => Promise<Story>,
    deleteStory: (id) => Promise<void>,
    getStoryById: (id) => Promise<Story>,
  }
}
```

### 4. Updated Components

The following components have been updated to use the new story storage system:

- `src/modules/story/components/Stories.tsx` - Story gallery
- `src/modules/story/components/StoriesList.tsx` - Story list component
- `src/modules/user/components/UserDashboard.tsx` - User dashboard with stories

### 5. Updated Utilities

- `src/modules/story/utils/storyPersistence.ts` - Updated to use the new API

## Authentication Integration

The implementation uses Clerk for authentication:

1. **Token-based authentication**: The Edge Function extracts user IDs from Clerk JWT tokens
2. **Row Level Security**: Supabase RLS policies ensure users can only access their own stories
3. **Automatic user identification**: The API client automatically includes authentication headers

## Usage Examples

### Creating a Story

```typescript
import { useStories } from '@/modules/story/hooks/useStories';

const { createStory } = useStories();

const handleCreateStory = async () => {
  const newStory = await createStory({
    name: 'John Doe',
    title: 'My Alternate Life',
    initial_story: 'Once upon a time...',
    personality_type: 'dreamer',
    location: 'New York',
  });
};
```

### Loading User Stories

```typescript
import { useStories } from '@/modules/story/hooks/useStories';

const { stories, loading, error } = useStories();

// Stories are automatically loaded when the user is authenticated
```

### Updating a Story

```typescript
import { useStories } from '@/modules/story/hooks/useStories';

const { updateStory } = useStories();

const handleUpdateStory = async (storyId: string) => {
  await updateStory(storyId, {
    title: 'Updated Title',
    view_count: 5,
  });
};
```

## Security Features

1. **Authentication Required**: All story operations require a valid Clerk token
2. **User Isolation**: Users can only access their own stories
3. **Input Validation**: The API validates all input data
4. **Error Handling**: Comprehensive error handling with user-friendly messages

## Migration

To apply the database changes, run the migration:

```sql
-- Copy and paste this into your Supabase SQL editor
-- Migration: Ensure Stories Table Exists
-- This migration ensures the stories table exists with the correct structure

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
```

## Deployment

1. **Deploy the Edge Function**: The stories Edge Function needs to be deployed to Supabase
2. **Apply Migration**: Run the SQL migration in your Supabase dashboard
3. **Update Environment Variables**: Ensure your environment variables are set up correctly

## Testing

The implementation includes tests in `src/modules/story/components/__tests__/StoriesAPI.test.tsx` to verify the API integration works correctly.

## Future Enhancements

1. **Story Analytics**: Track story views, likes, and shares
2. **Story Categories**: Add tagging and categorization
3. **Story Sharing**: Implement social sharing features
4. **Story Export**: Allow users to export stories as PDF or other formats
5. **Story Collaboration**: Allow multiple users to collaborate on stories 