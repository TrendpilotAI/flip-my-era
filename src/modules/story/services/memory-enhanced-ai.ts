// Memory-Enhanced AI Service
// Integrates with the enhanced stream-chapters function for improved story generation

// Generate a proper UUID v4
function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Alternative: Use crypto.randomUUID() if available (more secure)
export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return generateId();
}

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

export interface MemoryWarning {
  isRepetitive: boolean;
  similarChapters: number[];
  maxSimilarity: number;
}

export interface EnhancedChapterProgress {
  type: 'progress' | 'chapter' | 'complete' | 'error' | 'outline' | 'memory_check';
  currentChapter?: number;
  totalChapters?: number;
  chapterTitle?: string;
  chapterContent?: string;
  progress?: number;
  message?: string;
  estimatedTimeRemaining?: number;
  outline?: StoryOutline;
  memoryWarning?: MemoryWarning;
}

export interface EnhancedStreamingOptions {
  originalStory: string;
  useTaylorSwiftThemes: boolean;
  selectedTheme?: string;
  selectedFormat?: string;
  numChapters?: number;
  ebookGenerationId?: string;
  useEnhancedMemory?: boolean;
  onProgress?: (progress: EnhancedChapterProgress) => void;
  onOutlineGenerated?: (outline: StoryOutline) => void;
  onChapterComplete?: (chapter: { title: string; content: string }) => void;
  onMemoryWarning?: (warning: MemoryWarning) => void;
  onComplete?: (chapters: Array<{ title: string; content: string }>) => void;
  onError?: (error: string) => void;
}

/**
 * Enhanced story generation with memory system
 */
export class MemoryEnhancedAI {
  private authToken: string | null = null;

  constructor(authToken?: string) {
    this.authToken = authToken || null;
  }

  /**
   * Generate chapters using the enhanced memory system
   */
  async generateEnhancedStory(options: EnhancedStreamingOptions): Promise<void> {
    const {
      originalStory,
      useTaylorSwiftThemes,
      selectedTheme,
      selectedFormat,
      numChapters,
      ebookGenerationId,
      useEnhancedMemory = true,
      onProgress,
      onOutlineGenerated,
      onChapterComplete,
      onMemoryWarning,
      onComplete,
      onError
    } = options;

    // Generate a unique ebook generation ID if not provided
    const generationId = ebookGenerationId || generateUUID();
    
    // Validate that we have a valid UUID
    if (!generationId || generationId.trim() === '') {
      throw new Error('Invalid ebook generation ID: ID cannot be empty');
    }
    
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(generationId)) {
      throw new Error(`Invalid ebook generation ID format: ${generationId}`);
    }
    


    try {
      // Prepare headers
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY || '',
      };
      
      if (this.authToken) {
        headers['Authorization'] = `Bearer ${this.authToken}`;
      }

      // Choose the appropriate endpoint based on memory system usage
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const functionName = useEnhancedMemory ? 'stream-chapters-enhanced' : 'stream-chapters';
      const functionUrl = `${supabaseUrl}/functions/v1/${functionName}`;

      console.log('Calling enhanced function URL:', functionUrl);

      const requestBody = {
        originalStory,
        useTaylorSwiftThemes,
        selectedTheme,
        selectedFormat,
        numChapters,
        ebookGenerationId: generationId,
        useEnhancedMemory
      };
      console.log('Frontend - request body:', requestBody);

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Enhanced streaming response error:', response.status, errorText);
        throw new Error(`Failed to start enhanced generation: ${response.status} ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body reader available');
      }

      const decoder = new TextDecoder();
      const chapters: Array<{ title: string; content: string }> = [];

      const readStream = async () => {
        try {
          let buffer = '';
          
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            buffer += chunk;
            
            // Process complete lines from the buffer
            const lines = buffer.split('\n');
            // Keep the last line in the buffer if it's incomplete
            buffer = lines.pop() || '';
            
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const data: EnhancedChapterProgress = JSON.parse(line.slice(6));
                  
                  switch (data.type) {
                    case 'progress':
                      onProgress?.(data);
                      break;
                      
                    case 'outline':
                      if (data.outline) {
                        onOutlineGenerated?.(data.outline);
                      }
                      onProgress?.(data);
                      break;
                      
                    case 'chapter': {
                      const newChapter = {
                        title: data.chapterTitle || `Chapter ${data.currentChapter}`,
                        content: data.chapterContent || ''
                      };
                      
                      chapters.push(newChapter);
                      onChapterComplete?.(newChapter);
                      onProgress?.(data);
                      break;
                    }
                    
                    case 'memory_check':
                      if (data.memoryWarning) {
                        onMemoryWarning?.(data.memoryWarning);
                      }
                      onProgress?.(data);
                      break;
                      
                    case 'complete':
                      onProgress?.(data);
                      onComplete?.(chapters);
                      return;
                      
                    case 'error':
                      onError?.(data.message || 'Unknown error occurred');
                      return;
                  }
                } catch (parseError) {
                  console.error('Error parsing SSE data:', parseError);
                  // Log the problematic line for debugging
                  console.error('Problematic line:', line);
                }
              }
            }
          }
        } catch (error) {
          console.error('Error reading stream:', error);
          onError?.(error instanceof Error ? error.message : 'Stream reading error');
        }
      };

      await readStream();

    } catch (error) {
      console.error('Enhanced generation error:', error);
      onError?.(error instanceof Error ? error.message : 'Unknown error occurred');
    }
  }

  /**
   * Update the auth token
   */
  setAuthToken(token: string) {
    this.authToken = token;
  }
}

/**
 * Create a memory-enhanced AI instance
 */
export function createMemoryEnhancedAI(authToken?: string): MemoryEnhancedAI {
  return new MemoryEnhancedAI(authToken);
}

/**
 * Utility function to check if memory enhancement is available
 */
export function isMemoryEnhancementAvailable(): boolean {
  // Check if the enhanced features are available
  // This could be based on user subscription, feature flags, etc.
  return true; // For now, always available
}

/**
 * Utility function to estimate memory usage for a story
 */
export function estimateMemoryUsage(
  numChapters: number,
  storyFormat: string
): {
  outlineTokens: number;
  summaryTokens: number;
  stateTokens: number;
  totalEstimatedTokens: number;
} {
  const baseOutlineTokens = 500;
  const tokensPerChapterSummary = 150;
  const baseStateTokens = 300;
  
  const formatMultiplier = storyFormat === 'novella' ? 1.5 : 1.0;
  
  const outlineTokens = Math.round(baseOutlineTokens * formatMultiplier);
  const summaryTokens = Math.round(tokensPerChapterSummary * numChapters * formatMultiplier);
  const stateTokens = Math.round(baseStateTokens * formatMultiplier);
  
  return {
    outlineTokens,
    summaryTokens,
    stateTokens,
    totalEstimatedTokens: outlineTokens + summaryTokens + stateTokens
  };
}

/**
 * Utility function to format memory warnings for display
 */
export function formatMemoryWarning(warning: MemoryWarning): string {
  if (!warning.isRepetitive) {
    return '';
  }
  
  const similarityPercentage = Math.round(warning.maxSimilarity * 100);
  const similarChaptersList = warning.similarChapters.join(', ');
  
  return `High similarity detected (${similarityPercentage}%) with chapter${warning.similarChapters.length > 1 ? 's' : ''} ${similarChaptersList}. The AI will adjust to reduce repetition.`;
}

/**
 * Utility function to generate outline preview text
 */
export function generateOutlinePreview(outline: StoryOutline): string {
  let preview = `**${outline.book_title}**\n\n`;
  
  if (outline.book_description) {
    preview += `${outline.book_description}\n\n`;
  }
  
  preview += `**Chapters (${outline.total_chapters}):**\n`;
  outline.chapter_titles.forEach((title, index) => {
    preview += `${index + 1}. ${title}\n`;
  });
  
  if (outline.key_themes.length > 0) {
    preview += `\n**Key Themes:** ${outline.key_themes.join(', ')}`;
  }
  
  return preview;
} 