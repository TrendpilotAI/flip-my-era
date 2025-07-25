# Story Storage Implementation

## Overview

This document describes the implementation of story storage in Supabase instead of local storage. The implementation includes:

1. **Edge Functions**: Two new Supabase Edge Functions for story operations
2. **Frontend Updates**: Modified story persistence utilities to use edge functions
3. **Authentication**: Proper Clerk JWT token handling for secure API calls
4. **Fallback Strategy**: Local storage as backup when Supabase is unavailable

## Architecture

### Edge Functions

#### 1. `save-story` Function
- **Location**: `supabase/functions/save-story/index.ts`
- **Purpose**: Saves generated stories to the Supabase `stories` table
- **Authentication**: Uses Clerk JWT tokens for user identification
- **Features**:
  - Validates required fields (name, initial_story)
  - Stores additional metadata (prompt, personality type, location, etc.)
  - Returns the saved story with generated ID
  - Proper error handling and CORS support

#### 2. `get-user-stories` Function
- **Location**: `supabase/functions/get-user-stories/index.ts`
- **Purpose**: Retrieves user stories from Supabase
- **Features**:
  - Fetches all stories for authenticated user
  - Supports fetching specific story by ID
  - Orders stories by creation date (newest first)
  - Proper error handling for missing stories

### Frontend Changes

#### Updated Files

1. **`src/modules/story/utils/storyPersistence.ts`**
   - Modified `saveStory()` to use edge function instead of direct Supabase calls
   - Updated `getUserStories()` to use edge function
   - Updated `getStoryById()` to use edge function
   - Maintains localStorage as fallback

2. **`src/modules/story/hooks/useStoryGeneration.ts`**
   - Updated to pass Clerk auth token to `saveStory()`
   - Added `getToken` from `useClerkAuth()`

3. **`src/modules/story/components/StoriesList.tsx`**
   - Updated to use `getUserStories()` with auth token
   - Removed direct Supabase calls

4. **`src/modules/story/components/Stories.tsx`**
   - Updated to use `getUserStories()` with auth token
   - Removed direct Supabase calls

## Database Schema

The implementation uses the existing `stories` table with the following structure:

```sql
CREATE TABLE stories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    title TEXT,
    initial_story TEXT NOT NULL,
    prompt TEXT,
    birth_date DATE,
    personality_type TEXT,
    era TEXT,
    location TEXT,
    gender TEXT,
    transformed_name TEXT,
    prompt_data JSONB,
    generation_settings JSONB,
    word_count INTEGER,
    reading_time_minutes INTEGER,
    content_rating TEXT DEFAULT 'general',
    tags TEXT[],
    status story_status DEFAULT 'completed',
    generation_started_at TIMESTAMP,
    generation_completed_at TIMESTAMP,
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    share_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

## Authentication Flow

1. **Token Extraction**: Edge functions extract user ID from Clerk JWT tokens using manual JWT parsing
2. **User Validation**: Functions validate token format and extract user ID from the `sub` field
3. **Database Operations**: All operations are scoped to the authenticated user
4. **Error Handling**: Proper error responses for invalid tokens

**Note**: The edge functions use manual JWT parsing for Clerk tokens since Supabase's `auth.getUser()` expects Supabase JWT tokens, not Clerk tokens.

## API Endpoints

### Save Story
- **URL**: `POST /functions/v1/save-story`
- **Headers**: `Authorization: Bearer <clerk-jwt-token>`
- **Body**: Story data including name, initial_story, and additional metadata
- **Response**: Saved story object with generated ID

### Get User Stories
- **URL**: `GET /functions/v1/get-user-stories`
- **Headers**: `Authorization: Bearer <clerk-jwt-token>`
- **Response**: Array of user's stories

### Get Specific Story
- **URL**: `GET /functions/v1/get-user-stories?storyId=<story-id>`
- **Headers**: `Authorization: Bearer <clerk-jwt-token>`
- **Response**: Single story object

## Error Handling

### Frontend
- Graceful fallback to localStorage when edge functions fail
- Proper error messages for users
- Retry logic for transient failures

### Edge Functions
- CORS preflight handling
- Input validation
- Database error handling
- Authentication error responses

## Testing

Comprehensive test suite in `src/modules/story/utils/__tests__/storyPersistence.test.ts` covering:

- Story saving with authentication
- Story saving without authentication (localStorage fallback)
- Error handling scenarios
- User story retrieval
- Individual story retrieval
- Local storage operations

## Deployment

Edge functions are deployed to Supabase using:

```bash
npx supabase functions deploy save-story
npx supabase functions deploy get-user-stories
```

## Benefits

1. **Persistence**: Stories are now stored in the database and persist across devices
2. **Security**: Proper authentication and user isolation
3. **Scalability**: Database storage supports large numbers of stories
4. **Reliability**: Fallback to localStorage ensures functionality even when Supabase is unavailable
5. **Performance**: Edge functions provide fast, serverless API endpoints

## Migration from Local Storage

The implementation maintains backward compatibility:
- Existing localStorage stories are still accessible
- New stories are saved to both Supabase and localStorage
- Gradual migration as users generate new stories

## Future Enhancements

1. **Story Synchronization**: Sync localStorage stories to Supabase on first login
2. **Story Sharing**: Enable sharing stories between users
3. **Story Analytics**: Track story views, likes, and engagement
4. **Story Categories**: Organize stories by type, era, or personality
5. **Story Export**: Allow users to export stories in various formats 