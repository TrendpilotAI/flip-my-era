# Phase 2 Story Generation Setup Guide

## Overview
This guide helps you set up and test the story generation service for Phase 2 of FlipMyEra.

## Environment Setup

### 1. Create Environment File
Copy `.env.example` to `.env.local` and fill in your actual values:

```bash
cp .env.example .env.local
```

### 2. Required Environment Variables

#### Essential for Story Generation:
- `VITE_GROQ_API_KEY` - Your Groq API key (get from https://console.groq.com)
- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY` - Supabase anon key
- `VITE_CLERK_PUBLISHABLE_KEY` - Clerk authentication key

#### Optional but Recommended:
- `VITE_RUNWARE_API_KEY` - For image generation
- `VITE_OPENAI_API_KEY` - Fallback for AI services

## Testing Story Generation

### 1. Environment Validation
Run the test script to validate your setup:

```bash
node test-story-generation.js
```

### 2. Manual Testing Steps

1. **Start Development Server**
   ```bash
   npm run dev
   ```

2. **Test Story Generation Flow**
   - Navigate to the app (usually http://localhost:8084)
   - Generate an initial story
   - Click "Generate Chapters" 
   - Verify streaming generation works

### 3. Common Issues & Solutions

#### Issue: "GROQ API key not found"
**Solution:** Set `VITE_GROQ_API_KEY` in your `.env.local` file

#### Issue: "Failed to start generation: 401"
**Solution:** Check your Supabase configuration and ensure the edge function is deployed

#### Issue: "Streaming response error: 500"
**Solution:** Check Supabase function logs and ensure GROQ_API_KEY is set in Supabase secrets

#### Issue: Chapters not appearing
**Solution:** Check browser console for streaming errors and verify network connectivity

## Supabase Edge Function Setup

### 1. Deploy Functions
```bash
supabase functions deploy stream-chapters
```

### 2. Set Environment Variables
```bash
supabase secrets set GROQ_API_KEY=your_groq_api_key_here
```

### 3. Test Function Directly
```bash
curl -X POST https://your-project.supabase.co/functions/v1/stream-chapters \
  -H "Content-Type: application/json" \
  -H "apikey: your_supabase_anon_key" \
  -d '{"originalStory":"Test story","useTaylorSwiftThemes":false,"numChapters":1}'
```

## Architecture Overview

### Story Generation Flow
1. User clicks "Generate Chapters"
2. Frontend calls `useStreamingGeneration.startGeneration()`
3. Hook makes request to `/functions/v1/stream-chapters`
4. Edge function streams chapter generation progress
5. Frontend updates UI in real-time with streaming data

### Key Components
- `useStreamingGeneration` - React hook for streaming
- `stream-chapters` - Supabase edge function
- `EbookGenerator` - Main UI component
- `StreamingChapterView` - Individual chapter display

## Performance Optimizations

### 1. Streaming Implementation
- Real-time progress updates
- Chapter-by-chapter generation
- Graceful error handling
- User-friendly loading states

### 2. Error Recovery
- Automatic retry logic
- Fallback error messages  
- Network connectivity checks
- Rate limit handling

### 3. UX Improvements
- Progress indicators
- Stop/pause functionality
- Celebration animations
- Responsive design

## Debugging Tips

### 1. Browser Console
Check for:
- Network errors
- Streaming parse errors
- Authentication issues

### 2. Supabase Logs
Monitor edge function logs for:
- API key issues
- Rate limits
- Generation failures

### 3. Common Debug Commands
```bash
# Check Supabase status
supabase status

# View function logs (if available)
supabase functions logs stream-chapters

# Test local development
npm run dev
```

## Next Steps
Once story generation is working smoothly:
1. Test image generation
2. Optimize performance
3. Add more error handling
4. Implement user feedback collection
