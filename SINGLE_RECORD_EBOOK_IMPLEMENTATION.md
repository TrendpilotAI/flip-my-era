# Single Record Ebook Generation Implementation

## Overview

This document describes the implementation of **Option A: Single Record with Stages** for ebook generation in the Flip My Era application. This approach ensures there is only ONE row in the Supabase `ebook_generations` table for each ebook generated, with the record being updated through different stages of the generation process.

## Architecture

### Staged Update Flow

The ebook generation process now follows a staged approach with a single database record:

1. **Stage 1: Initial INSERT** - Create ebook record with user input data
2. **Stage 2: First UPDATE** - Add AI-generated metadata (outline, character bios, etc.)
3. **Stage 3: Progressive UPDATES** - Add generated chapters as they complete
4. **Stage 4: Final UPDATE** - Mark as completed

### Database Schema

The `ebook_generations` table supports this staged approach with the following key fields:

```sql
CREATE TABLE public.ebook_generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Book metadata (Stage 2)
  title TEXT NOT NULL,
  description TEXT,
  subtitle TEXT,
  author_name TEXT,
  
  -- Book content structure (Stage 3)
  chapters JSONB NOT NULL, -- Array of chapter objects
  table_of_contents JSONB,
  cover_image_url TEXT,
  
  -- Generation settings (Stage 2)
  generation_settings JSONB,
  style_preferences JSONB,
  image_style TEXT DEFAULT 'children',
  mood TEXT DEFAULT 'happy',
  
  -- Status tracking
  status TEXT DEFAULT 'generating', -- 'generating' -> 'completed'
  
  -- File storage (Stage 4)
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
```

## Implementation Details

### Functions Modified

#### 1. `stream-chapters-enhanced` Function

**Location**: `supabase/functions/stream-chapters-enhanced/index.ts`

**Changes**:
- **Stage 1**: Creates initial record immediately when generation starts
- **Stage 2**: Updates record with AI-generated metadata (outline, character bios, etc.)
- **Stage 3**: Progressively updates record with chapters as they are generated
- **Stage 4**: Final update to mark record as completed

**Key Code Sections**:

```typescript
// STAGE 1: CREATE INITIAL EBOOK RECORD WITH USER INPUT DATA
const { data: initialEbook, error: insertError } = await supabase
  .from('ebook_generations')
  .insert({
    id: ebookGenerationId,
    user_id: userId,
    title: 'Generating...',
    description: '',
    chapters: [],
    status: 'generating',
    credits_used: 1,
    paid_with_credits: true,
    story_type: 'memory_enhanced',
    chapter_count: chapterCount,
    word_count: 0,
    style_preferences: designSettings || {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });

// STAGE 2: UPDATE WITH AI-GENERATED METADATA
const { data: updatedEbook, error: updateError } = await supabase
  .from('ebook_generations')
  .update({
    title: outline.book_title,
    description: outline.book_description || '',
    table_of_contents: {
      chapters: outline.chapter_titles.map((title, index) => ({
        number: index + 1,
        title,
        summary: outline.chapter_summaries[index] || ''
      }))
    },
    generation_settings: {
      outline: outline,
      character_bios: outline.character_bios,
      world_info: outline.world_info,
      key_themes: outline.key_themes,
      plot_outline: outline.plot_outline
    },
    updated_at: new Date().toISOString()
  })
  .eq('id', ebookGenerationId);

// STAGE 3: UPDATE WITH GENERATED CHAPTERS (Progressive Updates)
const { data: chapterUpdateEbook, error: chapterUpdateError } = await supabase
  .from('ebook_generations')
  .update({
    chapters: chapters,
    word_count: chapters.reduce((total, ch) => total + ch.content.length, 0),
    updated_at: new Date().toISOString()
  })
  .eq('id', ebookGenerationId);

// STAGE 4: FINAL UPDATE - MARK AS COMPLETED
const { data: ebookGeneration, error } = await supabase
  .from('ebook_generations')
  .update({
    status: 'completed',
    chapter_count: chapters.length,
    word_count: chapters.reduce((total, ch) => total + ch.content.length, 0),
    updated_at: new Date().toISOString()
  })
  .eq('id', ebookGenerationId);
```

#### 2. `ebook-generation` Function

**Location**: `supabase/functions/ebook-generation/index.ts`

**Changes**:
- Now handles additional updates to existing records only
- Used for post-generation updates like design settings, illustrations, etc.
- Simplified to use only `ebook_id` for identification

**Key Code Sections**:

```typescript
// Find the existing ebook record by ebook_id
const { data: existingEbook, error: checkError } = await supabase
  .from("ebook_generations")
  .select("id, title, status")
  .eq("id", ebook_id)
  .single();

// Update the existing ebook record with only provided fields
const { data, error } = await supabase
  .from("ebook_generations")
  .update(updateData)
  .eq("id", existingEbook.id)
  .select()
  .single();
```

## Benefits of This Approach

### 1. **Data Consistency**
- Only one record per ebook generation
- No duplicate or orphaned records
- Clear single source of truth

### 2. **Real-time Progress Tracking**
- Frontend can query the same record to see generation progress
- Status field clearly indicates current stage
- Progressive chapter updates visible immediately

### 3. **Simplified Database Management**
- Easier to manage and query
- Better performance with fewer records
- Cleaner data model

### 4. **Error Recovery**
- If generation fails, the record exists with current progress
- Can resume or retry from last successful stage
- No cleanup of multiple records needed

## Frontend Integration

The frontend can track progress by polling the single ebook record:

```typescript
// Poll for progress updates
const checkProgress = async (ebookId: string) => {
  const { data, error } = await supabase
    .from('ebook_generations')
    .select('*')
    .eq('id', ebookId)
    .single();
    
  if (data) {
    // Update UI based on current status and chapter count
    updateProgressUI(data.status, data.chapters?.length || 0);
  }
};
```

## Testing

To test the implementation:

1. **Start Supabase**: `supabase start`
2. **Generate an ebook** through the frontend
3. **Monitor the database** to ensure only one record is created and updated through stages
4. **Check the final record** has all expected data

## Migration Notes

- No migration needed for existing setup
- The `ebook_generations` table structure supports this approach
- Backwards compatible with existing records

## Error Handling

- Each stage has proper error handling
- Failed stages don't create duplicate records
- Clear error messages indicate which stage failed
- Partial progress is preserved in the database

## Future Enhancements

1. **Resume Capability**: Add ability to resume failed generations from last successful stage
2. **Stage Timestamps**: Track when each stage completed for analytics
3. **Rollback Mechanism**: Add ability to rollback to previous stages if needed
4. **Batch Updates**: Optimize chapter updates to reduce database calls 