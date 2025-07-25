// Story Memory Management Utilities
// Handles outline generation, chapter summarization, and story state tracking

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Types for story memory system
export interface StoryOutline {
  id?: string;
  ebook_generation_id?: string;
  user_id?: string;
  book_title: string;
  book_description?: string;
  chapter_titles: string[];
  chapter_summaries: string[];
  character_bios: CharacterBio[];
  world_info: Record<string, any>;
  key_themes: string[];
  plot_outline: string;
  total_chapters: number;
  story_format: string;
  theme?: string;
}

export interface CharacterBio {
  name: string;
  description: string;
  personality: string;
  goals: string;
  relationships: Record<string, string>;
  current_status?: string;
}

export interface ChapterSummary {
  id?: string;
  ebook_generation_id: string;
  story_outline_id: string;
  user_id: string;
  chapter_number: number;
  chapter_title: string;
  summary: string;
  key_events: string[];
  character_developments: Record<string, any>[];
  last_chapter_excerpt: string;
  chapter_word_count: number;
}

export interface StoryState {
  id?: string;
  ebook_generation_id: string;
  story_outline_id: string;
  user_id: string;
  current_chapter: number;
  characters: CharacterBio[];
  character_relationships: Record<string, string>;
  major_plot_events: Record<string, any>[];
  active_plot_threads: Record<string, any>[];
  resolved_conflicts: Record<string, any>[];
  pending_conflicts: Record<string, any>[];
  current_locations: string[];
  world_changes: Record<string, any>[];
  timeline_events: Record<string, any>[];
  current_mood?: string;
  pacing_notes?: string;
}

export interface ChapterEmbedding {
  id?: string;
  ebook_generation_id: string;
  chapter_summary_id: string;
  user_id: string;
  chapter_number: number;
  chapter_title: string;
  embedding_vector: number[];
  text_content: string;
  content_type: string;
  max_similarity_score: number;
  similar_chapter_numbers: number[];
}

// Groq API interface for AI generation
interface GroqChatMessage {
  role: string;
  content: string;
}

interface GroqChatResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

/**
 * Generate a comprehensive story outline before chapter generation
 */
export async function generateStoryOutline(
  originalStory: string,
  totalChapters: number,
  storyFormat: string,
  theme?: string,
  useTaylorSwiftThemes: boolean = false
): Promise<StoryOutline> {
  const groqApiKey = Deno.env.get('GROQ_API_KEY');
  if (!groqApiKey) {
    throw new Error('GROQ_API_KEY environment variable is not set');
  }

  let prompt: string;

  if (useTaylorSwiftThemes && theme) {
    const themeDescriptions = {
      'coming-of-age': 'coming-of-age, self-discovery, and finding your voice',
      'first-love': 'first love, innocent romance, and the magic of new connections',
      'heartbreak': 'heartbreak, healing, and finding strength after loss',
      'friendship': 'friendship, loyalty, and the bonds that shape us'
    };
    
    const themeDescription = themeDescriptions[theme as keyof typeof themeDescriptions] || themeDescriptions['coming-of-age'];
    
    prompt = `
      Create a comprehensive story outline for a Taylor Swift-inspired young adult ${storyFormat === 'novella' ? 'novella' : 'short story'} with ${totalChapters} chapters based on this story:
      
      ${originalStory}
      
      SPECIFICATIONS:
      - Theme: ${themeDescription}
      - Format: YA ${storyFormat === 'novella' ? 'Novella' : 'Short Story'}
      - Total chapters: ${totalChapters}
      - Age-appropriate content for readers 13-18
      - Emotional storytelling reminiscent of Taylor Swift's lyrical style
      
      Provide a JSON response with:
      {
        "book_title": "Compelling title that captures the emotional journey",
        "book_description": "Brief description of the overall story",
        "chapter_titles": ["Chapter 1 title", "Chapter 2 title", ...],
        "chapter_summaries": ["Summary of what happens in chapter 1", "Summary of chapter 2", ...],
        "character_bios": [
          {
            "name": "Character name",
            "description": "Physical and personality description",
            "personality": "Key personality traits",
            "goals": "What they want to achieve",
            "relationships": {"other_character": "relationship description"}
          }
        ],
        "world_info": {
          "setting": "Where the story takes place",
          "time_period": "When it takes place",
          "atmosphere": "Overall mood and feel",
          "important_locations": ["location 1", "location 2"]
        },
        "key_themes": ["theme 1", "theme 2", "theme 3"],
        "plot_outline": "Overall plot structure and story arc"
      }
    `;
  } else {
    prompt = `
      Create a comprehensive story outline for a children's book with ${totalChapters} chapters based on this story:
      
      ${originalStory}
      
      Provide a JSON response with:
      {
        "book_title": "Engaging title for children",
        "book_description": "Brief description of the adventure",
        "chapter_titles": ["Chapter 1 title", "Chapter 2 title", ...],
        "chapter_summaries": ["Summary of what happens in chapter 1", "Summary of chapter 2", ...],
        "character_bios": [
          {
            "name": "Character name",
            "description": "Character description",
            "personality": "Key traits",
            "goals": "What they want",
            "relationships": {"other_character": "relationship"}
          }
        ],
        "world_info": {
          "setting": "Story setting",
          "atmosphere": "Story mood",
          "important_locations": ["location 1", "location 2"]
        },
        "key_themes": ["friendship", "adventure", "growth"],
        "plot_outline": "Overall story structure"
      }
    `;
  }

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${groqApiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'llama3-70b-8192',
      messages: [
        {
          role: 'system',
          content: 'You are a creative writing assistant who specializes in creating detailed story outlines. Always respond with valid JSON.'
        },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 4096,
      response_format: { type: "json_object" }
    })
  });

  if (!response.ok) {
    throw new Error(`Failed to generate story outline: ${response.statusText}`);
  }

  const data: GroqChatResponse = await response.json();
  const outlineData = JSON.parse(data.choices[0].message.content);

  return {
    book_title: outlineData.book_title,
    book_description: outlineData.book_description,
    chapter_titles: outlineData.chapter_titles,
    chapter_summaries: outlineData.chapter_summaries,
    character_bios: outlineData.character_bios,
    world_info: outlineData.world_info,
    key_themes: outlineData.key_themes,
    plot_outline: outlineData.plot_outline,
    total_chapters: totalChapters,
    story_format: storyFormat,
    theme: theme
  };
}

/**
 * Generate a summary of a completed chapter
 */
export async function generateChapterSummary(
  chapterTitle: string,
  chapterContent: string,
  chapterNumber: number,
  previousSummaries: string[] = []
): Promise<{ summary: string; key_events: string[]; character_developments: Record<string, any>[] }> {
  const groqApiKey = Deno.env.get('GROQ_API_KEY');
  if (!groqApiKey) {
    throw new Error('GROQ_API_KEY environment variable is not set');
  }

  const previousContext = previousSummaries.length > 0 
    ? `\n\nPrevious chapter summaries:\n${previousSummaries.join('\n')}`
    : '';

  const prompt = `
    Analyze this chapter and create a concise summary for story continuity:

    Chapter ${chapterNumber}: ${chapterTitle}
    ${chapterContent}${previousContext}

    Provide a JSON response with:
    {
      "summary": "A 3-6 sentence summary of the key events and developments",
      "key_events": ["Event 1", "Event 2", "Event 3"],
      "character_developments": [
        {
          "character": "Character name",
          "development": "How they changed or what happened to them",
          "emotional_state": "Their current emotional state"
        }
      ]
    }

    Focus on:
    - Plot progression and key events
    - Character development and emotional changes
    - Important dialogue or revelations
    - Setting or world changes
    - Conflicts introduced or resolved
  `;

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${groqApiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'llama3-70b-8192',
      messages: [
        {
          role: 'system',
          content: 'You are a literary analysis assistant who creates concise, accurate summaries for story continuity. Always respond with valid JSON.'
        },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 1024,
      response_format: { type: "json_object" }
    })
  });

  if (!response.ok) {
    throw new Error(`Failed to generate chapter summary: ${response.statusText}`);
  }

  const data: GroqChatResponse = await response.json();
  const summaryData = JSON.parse(data.choices[0].message.content);

  return {
    summary: summaryData.summary,
    key_events: summaryData.key_events,
    character_developments: summaryData.character_developments
  };
}

/**
 * Build context string from story memory for chapter generation
 */
export function buildStoryContext(
  outline: StoryOutline,
  chapterSummaries: ChapterSummary[],
  storyState: StoryState,
  chapterNumber: number
): string {
  let context = `STORY CONTEXT FOR CHAPTER ${chapterNumber}:\n\n`;

  // Book overview
  context += `BOOK: ${outline.book_title}\n`;
  context += `DESCRIPTION: ${outline.book_description}\n`;
  context += `THEMES: ${outline.key_themes.join(', ')}\n\n`;

  // Plot outline
  context += `OVERALL PLOT: ${outline.plot_outline}\n\n`;

  // Character information
  if (storyState.characters.length > 0) {
    context += `CHARACTERS:\n`;
    storyState.characters.forEach(char => {
      context += `- ${char.name}: ${char.description} (${char.personality})\n`;
      context += `  Goals: ${char.goals}\n`;
      if (char.current_status) {
        context += `  Current Status: ${char.current_status}\n`;
      }
    });
    context += '\n';
  }

  // World information
  if (outline.world_info) {
    context += `WORLD/SETTING:\n`;
    Object.entries(outline.world_info).forEach(([key, value]) => {
      context += `- ${key}: ${value}\n`;
    });
    context += '\n';
  }

  // Previous chapter summaries
  if (chapterSummaries.length > 0) {
    context += `PREVIOUS CHAPTERS:\n`;
    chapterSummaries.forEach(summary => {
      context += `Chapter ${summary.chapter_number} - ${summary.chapter_title}:\n`;
      context += `${summary.summary}\n`;
      if (summary.key_events.length > 0) {
        context += `Key events: ${summary.key_events.join(', ')}\n`;
      }
      context += '\n';
    });
  }

  // Story state
  if (storyState.major_plot_events.length > 0) {
    context += `MAJOR PLOT EVENTS COMPLETED:\n`;
    storyState.major_plot_events.forEach((event, index) => {
      context += `${index + 1}. ${event.description || JSON.stringify(event)}\n`;
    });
    context += '\n';
  }

  if (storyState.active_plot_threads.length > 0) {
    context += `ACTIVE PLOT THREADS:\n`;
    storyState.active_plot_threads.forEach((thread, index) => {
      context += `${index + 1}. ${thread.description || JSON.stringify(thread)}\n`;
    });
    context += '\n';
  }

  if (storyState.pending_conflicts.length > 0) {
    context += `UNRESOLVED CONFLICTS:\n`;
    storyState.pending_conflicts.forEach((conflict, index) => {
      context += `${index + 1}. ${conflict.description || JSON.stringify(conflict)}\n`;
    });
    context += '\n';
  }

  // Current chapter plan
  if (chapterNumber <= outline.chapter_summaries.length) {
    const plannedSummary = outline.chapter_summaries[chapterNumber - 1];
    context += `PLANNED CHAPTER ${chapterNumber} SUMMARY: ${plannedSummary}\n\n`;
  }

  // Last chapter excerpt for continuity
  if (chapterSummaries.length > 0) {
    const lastSummary = chapterSummaries[chapterSummaries.length - 1];
    if (lastSummary.last_chapter_excerpt) {
      context += `LAST CHAPTER ENDING:\n${lastSummary.last_chapter_excerpt}\n\n`;
    }
  }

  return context;
}

/**
 * Save story outline to database
 */
export async function saveStoryOutline(
  supabase: any,
  outline: StoryOutline
): Promise<string> {
  // Validate required fields
  if (!outline.ebook_generation_id) {
    throw new Error('ebook_generation_id is required to save story outline');
  }
  if (!outline.user_id) {
    throw new Error('user_id is required to save story outline');
  }

  const { data, error } = await supabase
    .from('story_outlines')
    .insert({
      ebook_generation_id: outline.ebook_generation_id,
      user_id: outline.user_id,
      book_title: outline.book_title,
      book_description: outline.book_description,
      chapter_titles: outline.chapter_titles,
      chapter_summaries: outline.chapter_summaries,
      character_bios: outline.character_bios,
      world_info: outline.world_info,
      key_themes: outline.key_themes,
      plot_outline: outline.plot_outline,
      total_chapters: outline.total_chapters,
      story_format: outline.story_format,
      theme: outline.theme
    })
    .select('id')
    .single();

  if (error) {
    console.error('Error saving story outline:', error);
    throw new Error(`Failed to save story outline: ${error.message}`);
  }

  return data.id;
}

/**
 * Save chapter summary to database
 */
export async function saveChapterSummary(
  supabase: any,
  summary: ChapterSummary
): Promise<string> {
  const { data, error } = await supabase
    .from('chapter_summaries')
    .insert(summary)
    .select('id')
    .single();

  if (error) {
    console.error('Error saving chapter summary:', error);
    throw new Error(`Failed to save chapter summary: ${error.message}`);
  }

  return data.id;
}

/**
 * Initialize or update story state
 */
export async function saveStoryState(
  supabase: any,
  storyState: StoryState
): Promise<void> {
  const { error } = await supabase
    .from('story_state')
    .upsert(storyState, { onConflict: 'ebook_generation_id' });

  if (error) {
    console.error('Error saving story state:', error);
    throw new Error(`Failed to save story state: ${error.message}`);
  }
}

/**
 * Get story memory data for chapter generation
 */
export async function getStoryMemory(
  supabase: any,
  ebookGenerationId: string
): Promise<{
  outline: StoryOutline | null;
  summaries: ChapterSummary[];
  state: StoryState | null;
}> {
  // Get story outline
  const { data: outlineData, error: outlineError } = await supabase
    .from('story_outlines')
    .select('*')
    .eq('ebook_generation_id', ebookGenerationId)
    .single();

  if (outlineError && outlineError.code !== 'PGRST116') {
    console.error('Error fetching story outline:', outlineError);
  }

  // Get chapter summaries
  const { data: summariesData, error: summariesError } = await supabase
    .from('chapter_summaries')
    .select('*')
    .eq('ebook_generation_id', ebookGenerationId)
    .order('chapter_number');

  if (summariesError) {
    console.error('Error fetching chapter summaries:', summariesError);
  }

  // Get story state
  const { data: stateData, error: stateError } = await supabase
    .from('story_state')
    .select('*')
    .eq('ebook_generation_id', ebookGenerationId)
    .single();

  if (stateError && stateError.code !== 'PGRST116') {
    console.error('Error fetching story state:', stateError);
  }

  return {
    outline: outlineData || null,
    summaries: summariesData || [],
    state: stateData || null
  };
}

/**
 * Extract last N words from text for continuity
 */
export function extractLastWords(text: string, wordCount: number = 200): string {
  const words = text.trim().split(/\s+/);
  if (words.length <= wordCount) {
    return text;
  }
  return words.slice(-wordCount).join(' ');
}

/**
 * Generate embeddings for text (placeholder - would use actual embedding service)
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  // This is a placeholder implementation
  // In a real implementation, you would call an embedding API like OpenAI's text-embedding-ada-002
  // For now, return a mock embedding
  const mockEmbedding = new Array(384).fill(0).map(() => Math.random());
  return mockEmbedding;
}

/**
 * Check for repetitive content using embeddings
 */
export async function checkRepetition(
  supabase: any,
  ebookGenerationId: string,
  chapterText: string,
  chapterNumber: number,
  threshold: number = 0.85
): Promise<{ isRepetitive: boolean; similarChapters: number[]; maxSimilarity: number }> {
  try {
    // Generate embedding for current chapter
    const embedding = await generateEmbedding(chapterText);

    // Get existing embeddings for this ebook
    const { data: existingEmbeddings, error } = await supabase
      .from('chapter_embeddings')
      .select('chapter_number, embedding_vector')
      .eq('ebook_generation_id', ebookGenerationId)
      .lt('chapter_number', chapterNumber);

    if (error) {
      console.error('Error fetching existing embeddings:', error);
      return { isRepetitive: false, similarChapters: [], maxSimilarity: 0 };
    }

    let maxSimilarity = 0;
    const similarChapters: number[] = [];

    // Calculate similarity with existing chapters
    for (const existing of existingEmbeddings) {
      if (!existing.embedding_vector) continue;
      
      const existingVector = Array.isArray(existing.embedding_vector) 
        ? existing.embedding_vector 
        : JSON.parse(existing.embedding_vector);
      
      const similarity = cosineSimilarity(embedding, existingVector);
      
      if (similarity > maxSimilarity) {
        maxSimilarity = similarity;
      }
      
      if (similarity >= threshold) {
        similarChapters.push(existing.chapter_number);
      }
    }

    return {
      isRepetitive: maxSimilarity >= threshold,
      similarChapters,
      maxSimilarity
    };
  } catch (error) {
    console.error('Error checking repetition:', error);
    return { isRepetitive: false, similarChapters: [], maxSimilarity: 0 };
  }
}

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) {
    throw new Error('Vectors must have the same length');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Initialize story state from outline
 */
export function initializeStoryState(
  outline: StoryOutline,
  ebookGenerationId: string,
  userId: string,
  storyOutlineId?: string
): StoryState {
  return {
    ebook_generation_id: ebookGenerationId,
    story_outline_id: storyOutlineId || outline.id || ebookGenerationId,
    user_id: userId,
    current_chapter: 1,
    characters: outline.character_bios,
    character_relationships: {},
    major_plot_events: [],
    active_plot_threads: [],
    resolved_conflicts: [],
    pending_conflicts: [],
    current_locations: [],
    world_changes: [],
    timeline_events: [],
    current_mood: 'beginning',
    pacing_notes: 'Story initialization'
  };
}

/**
 * Save chapter embedding to database
 */
export async function saveChapterEmbedding(
  supabase: any,
  embedding: ChapterEmbedding
): Promise<void> {
  const { error } = await supabase
    .from('chapter_embeddings')
    .insert(embedding);

  if (error) {
    console.error('Error saving chapter embedding:', error);
    throw new Error(`Failed to save chapter embedding: ${error.message}`);
  }
} 