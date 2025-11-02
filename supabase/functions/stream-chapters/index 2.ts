// @ts-expect-error -- Deno Edge Function imports
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
// @ts-expect-error -- Deno Edge Function imports
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

// Helper: decode JWT payload (no verify, for dev only)
function decodeJwtPayload(token: string): unknown {
  try {
    const payload = token.split('.')[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded);
  } catch (e) {
    return null;
  }
}

// Groq API types
interface GroqChatMessage {
  role: string;
  content: string;
}

interface GroqChatChoice {
  message: GroqChatMessage;
  index: number;
  finish_reason: string;
}

interface GroqChatResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: GroqChatChoice[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface StreamChapterRequest {
  originalStory: string;
  useTaylorSwiftThemes: boolean;
  selectedTheme?: string;
  selectedFormat?: string;
  numChapters?: number;
}

interface ChapterProgress {
  type: 'progress' | 'chapter' | 'complete' | 'error';
  currentChapter?: number;
  totalChapters?: number;
  chapterTitle?: string;
  chapterContent?: string;
  progress?: number;
  message?: string;
  estimatedTimeRemaining?: number;
}

// Story formats configuration
const storyFormats = {
  'short-story': { chapters: 3 },
  'novella': { chapters: 8 },
  'children-book': { chapters: 5 }
};

// Taylor Swift themes
const taylorSwiftThemes = ['coming-of-age', 'first-love', 'heartbreak', 'friendship'];

async function apiRequestWithRetry<T>(
  config: {
    method: string;
    url: string;
    headers: Record<string, string>;
    data: unknown;
  },
  maxRetries = 3
): Promise<{ data: T }> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Attempt ${attempt}: Making request to ${config.url}`);
      console.log('Request headers:', Object.keys(config.headers));
      
      const response = await fetch(config.url, {
        method: config.method,
        headers: config.headers,
        body: JSON.stringify(config.data),
      });

      console.log(`Response status: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`HTTP ${response.status} error:`, errorText);
        throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      console.log('Request successful');
      return { data };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`Attempt ${attempt} failed:`, lastError.message);
      
      if (attempt === maxRetries) {
        throw lastError;
      }
      
      // Wait before retrying (exponential backoff)
      const delay = Math.pow(2, attempt) * 1000;
      console.log(`Waiting ${delay}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

async function generateSingleChapter(
  originalStory: string,
  chapterNumber: number,
  totalChapters: number,
  useTaylorSwiftThemes: boolean,
  selectedTheme?: string,
  selectedFormat?: string
): Promise<{ title: string; content: string }> {
  const format = selectedFormat || 'short-story';
  const theme = selectedTheme || 'coming-of-age';
  
  let prompt: string;

  if (useTaylorSwiftThemes) {
    const wordTarget = format === 'novella' ?
      `approximately 1,250-3,125 words` :
      `approximately 300-2,500 words`;
    
    const themeDescriptions = {
      'coming-of-age': 'coming-of-age, self-discovery, and finding your voice',
      'first-love': 'first love, innocent romance, and the magic of new connections',
      'heartbreak': 'heartbreak, healing, and finding strength after loss',
      'friendship': 'friendship, loyalty, and the bonds that shape us'
    };
    
    const themeDescription = themeDescriptions[theme as keyof typeof themeDescriptions] || themeDescriptions['coming-of-age'];
    
    prompt = `
      Create Chapter ${chapterNumber} of ${totalChapters} for a Taylor Swift-inspired young adult ${format === 'novella' ? 'novella' : 'short story'} based on this story:
      
      ${originalStory}
      
      SPECIFICATIONS:
      - Theme: ${themeDescription}
      - Format: YA ${format === 'novella' ? 'Novella' : 'Short Story'}
      - Target: ${wordTarget} for this chapter
      - Chapter ${chapterNumber} of ${totalChapters}
      - Age-appropriate content for readers 13-18
      - Emotional storytelling reminiscent of Taylor Swift's lyrical style
      
      Provide:
      - A compelling chapter title that reflects the emotional journey
      - Rich content with authentic dialogue and relatable teenage experiences
      - Character development and emotional depth
      - Age-appropriate themes and situations
      - Vivid descriptions and emotional resonance
      
      ${chapterNumber === 1 ? 'This is the opening chapter - establish the world, characters, and central conflict.' : 
        chapterNumber === totalChapters ? 'This is the final chapter - bring the story to an emotionally satisfying conclusion.' :
        'This is a middle chapter - develop the story and deepen character relationships.'}
      
      Format your response as a JSON object with "title" and "content" properties.
    `;
  } else {
    prompt = `
      Create Chapter ${chapterNumber} of ${totalChapters} for a children's book based on this story:
      
      ${originalStory}
      
      Make this chapter engaging, imaginative, and appropriate for children.
      ${chapterNumber === 1 ? 'This is the opening chapter - introduce the characters and setting.' : 
        chapterNumber === totalChapters ? 'This is the final chapter - bring the story to a satisfying conclusion.' :
        'This is a middle chapter - develop the adventure and characters.'}
      
      Format your response as a JSON object with "title" and "content" properties.
    `;
  }

  const groqApiKey = Deno.env.get('GROQ_API_KEY');
  if (!groqApiKey) {
    throw new Error('GROQ_API_KEY environment variable is not set');
  }
  
  console.log('Using Groq API key:', groqApiKey.substring(0, 10) + '...');
  console.log('API key length:', groqApiKey.length);
  console.log('API key starts with:', groqApiKey.startsWith('gsk_') ? 'gsk_ (valid format)' : 'Invalid format');
  
  const response = await apiRequestWithRetry<GroqChatResponse>({
    method: 'POST',
    url: 'https://api.groq.com/openai/v1/chat/completions',
    headers: {
      'Authorization': `Bearer ${groqApiKey}`,
      'Content-Type': 'application/json'
    },
    data: {
      model: 'llama3-70b-8192',
      messages: [
        {
          role: 'system',
          content: useTaylorSwiftThemes
            ? `You are a creative young adult author who specializes in emotionally resonant ${format === 'novella' ? 'novellas' : 'short stories'} with Taylor Swift-inspired themes. You write age-appropriate content that captures the intensity and authenticity of teenage emotions.`
            : 'You are a creative children\'s book author who specializes in creating engaging chapter books.'
        },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: format === 'novella' ? 4096 : 2048,
      response_format: { type: "json_object" }
    }
  });

  let parsedContent;
  try {
    // First, try to clean the response content
    /* eslint-disable no-control-regex */
    const cleanedContent = response.data.choices[0].message.content
      .replace(/\0/g, '') // Remove null bytes
      .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
      .replace(/[\uFFFE\uFFFF]/g, '') // Remove Unicode BOM and invalid chars
      .replace(/[\uD800-\uDFFF]/g, '') // Remove surrogate pairs
      .trim();
    /* eslint-enable no-control-regex */
    
    parsedContent = JSON.parse(cleanedContent);
  } catch (parseError) {
    console.error('Error parsing AI response:', parseError);
    console.error('Raw AI response:', response.data.choices[0].message.content);
    
    // Fallback: try to extract title and content from the raw text
    const rawContent = response.data.choices[0].message.content;
    
    // Try multiple regex patterns to extract content
    let titleMatch = rawContent.match(/"title"\s*:\s*"([^"]*)"/);
    let contentMatch = rawContent.match(/"content"\s*:\s*"([^"]*)"/);
    
    // If that doesn't work, try without quotes
    if (!titleMatch) {
      titleMatch = rawContent.match(/title\s*:\s*([^\n,}]+)/);
    }
    if (!contentMatch) {
      contentMatch = rawContent.match(/content\s*:\s*([^\n,}]+)/);
    }
    
    // If still no match, try to extract any text that looks like a title or content
    if (!titleMatch) {
      const lines = rawContent.split('\n');
      const titleLine = lines.find(line => line.toLowerCase().includes('title') || line.includes('Chapter'));
      if (titleLine) {
        const extractedTitle = titleLine.replace(/.*?:\s*/, '');
        titleMatch = [titleLine, extractedTitle] as RegExpMatchArray;
      }
    }
    
    if (!contentMatch) {
      // Find the longest paragraph that's not a title
      const paragraphs = rawContent.split('\n\n');
      const contentParagraph = paragraphs.find(p => 
        p.length > 50 && 
        !p.toLowerCase().includes('title') && 
        !p.toLowerCase().includes('chapter')
      );
      if (contentParagraph) {
        contentMatch = [contentParagraph, contentParagraph] as RegExpMatchArray;
      }
    }
    
    parsedContent = {
      title: titleMatch ? titleMatch[1].trim() : `Chapter ${chapterNumber}`,
      content: contentMatch ? contentMatch[1].trim() : rawContent
    };
  }
  
  // Ensure the returned content is clean and safe
  // Convert title/content to strings first to avoid calling .replace on non-string values
  const rawTitle = typeof parsedContent.title === 'string'
    ? parsedContent.title
    : JSON.stringify(parsedContent.title ?? `Chapter ${chapterNumber}`);

  const rawContent = typeof parsedContent.content === 'string'
    ? parsedContent.content
    : JSON.stringify(parsedContent.content ?? '');

  /* eslint-disable no-control-regex */
  const cleanTitle = (rawTitle || `Chapter ${chapterNumber}`)
    .replace(/\0/g, '')
    .replace(/[\x00-\x1F\x7F]/g, '')
    .replace(/[\uFFFE\uFFFF]/g, '')
    .replace(/[\uD800-\uDFFF]/g, '')
    .trim();
    
  const cleanContent = (rawContent)
    .replace(/\0/g, '')
    .replace(/[\x00-\x1F\x7F]/g, '')
    .replace(/[\uFFFE\uFFFF]/g, '')
    .replace(/[\uD800-\uDFFF]/g, '')
    .trim();
  /* eslint-enable no-control-regex */
  
  return {
    title: cleanTitle,
    content: cleanContent
  };
}

serve(async (req: Request) => {
  // Log method and auth header
  console.log('Request method:', req.method);
  console.log('Authorization header:', req.headers.get('authorization'));

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', {
      status: 405,
      headers: corsHeaders,
    });
  }

  // Parse and verify Authorization header
  const authHeader = req.headers.get('authorization');
  let userId: string | null = null;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    const jwtPayload = decodeJwtPayload(token);
    
    if (jwtPayload && jwtPayload.sub && jwtPayload.sub.startsWith('user_')) {
      userId = jwtPayload.sub;
      console.log('Clerk user ID:', userId);
    } else {
      console.log('Invalid or missing Clerk JWT payload');
    }
  } else {
    console.log('No Authorization header or invalid format');
  }
  
  // For now, allow the request to proceed even without valid authentication
  // In production, you might want to require authentication
  if (!userId) {
    console.log('Proceeding without user authentication');
  }

  // Create Supabase client with user's auth context for RLS
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    {
      global: {
        headers: userId ? { Authorization: `Bearer ${authHeader?.slice(7)}` } : {},
      },
    }
  );

  try {
    const { 
      originalStory, 
      useTaylorSwiftThemes, 
      selectedTheme = 'coming-of-age', 
      selectedFormat = 'short-story',
      numChapters 
    }: StreamChapterRequest = await req.json();

    const chapterCount = numChapters || storyFormats[selectedFormat as keyof typeof storyFormats]?.chapters || 3;

    // Create a readable stream for Server-Sent Events
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        
        const sendEvent = (data: ChapterProgress) => {
          try {
            // Create a clean copy of the data to avoid modifying the original
            const cleanData = { ...data };
            
            // Clean all string fields to ensure they're safe for JSON serialization
            /* eslint-disable no-control-regex */
            const cleanString = (str: string): string => {
              return str
                .replace(/\0/g, '') // Remove null bytes
                .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters except newlines/tabs
                .replace(/[\uFFFE\uFFFF]/g, '') // Remove Unicode BOM and invalid chars
                .replace(/[\uD800-\uDFFF]/g, '') // Remove surrogate pairs
                .trim(); // Remove leading/trailing whitespace
            };
            /* eslint-enable no-control-regex */
            
            // Clean all string fields
            if (cleanData.chapterContent) {
              cleanData.chapterContent = cleanString(cleanData.chapterContent);
            }
            
            if (cleanData.chapterTitle) {
              cleanData.chapterTitle = cleanString(cleanData.chapterTitle);
            }
            
            if (cleanData.message) {
              cleanData.message = cleanString(cleanData.message);
            }
            
            // Test JSON serialization first to catch any issues
            const testJson = JSON.stringify(cleanData);
            
            const eventData = `data: ${testJson}\n\n`;
            controller.enqueue(encoder.encode(eventData));
          } catch (error) {
            console.error('Error serializing event data:', error);
            console.error('Data that failed to serialize:', data);
            
            // Try to create a minimal safe version
            try {
              const safeData = {
                type: data.type,
                currentChapter: data.currentChapter,
                totalChapters: data.totalChapters,
                progress: data.progress,
                message: data.message ? data.message.substring(0, 100) + '...' : 'Content truncated due to serialization error',
                estimatedTimeRemaining: data.estimatedTimeRemaining
              };
              
              const safeEventData = `data: ${JSON.stringify(safeData)}\n\n`;
              controller.enqueue(encoder.encode(safeEventData));
            } catch (fallbackError) {
              console.error('Fallback serialization also failed:', fallbackError);
              // Send a basic error event
              const errorEvent = `data: ${JSON.stringify({
                type: 'error',
                message: 'Failed to serialize chapter data'
              })}\n\n`;
              controller.enqueue(encoder.encode(errorEvent));
            }
          }
        };

        try {
          // Send initial progress
          sendEvent({
            type: 'progress',
            currentChapter: 0,
            totalChapters: chapterCount,
            progress: 0,
            message: 'Initializing chapter generation...'
          });

          const chapters: Array<{ title: string; content: string }> = [];
          const startTime = Date.now();

          for (let i = 0; i < chapterCount; i++) {
            const chapterNumber = i + 1;
            
            // Send progress update
            sendEvent({
              type: 'progress',
              currentChapter: chapterNumber,
              totalChapters: chapterCount,
              progress: (i / chapterCount) * 100,
              message: `Generating Chapter ${chapterNumber}...`,
              estimatedTimeRemaining: i > 0 ? 
                ((Date.now() - startTime) / i) * (chapterCount - i) / 1000 : 
                undefined
            });

            // Generate individual chapter
            const chapter = await generateSingleChapter(
              originalStory, 
              chapterNumber, 
              chapterCount, 
              useTaylorSwiftThemes, 
              selectedTheme, 
              selectedFormat
            );

            chapters.push(chapter);

            // Send chapter completion
            sendEvent({
              type: 'chapter',
              currentChapter: chapterNumber,
              totalChapters: chapterCount,
              chapterTitle: chapter.title,
              chapterContent: chapter.content,
              progress: (chapterNumber / chapterCount) * 100
            });

            // Small delay to allow UI to update
            await new Promise(resolve => setTimeout(resolve, 100));
          }

          // Send completion
          sendEvent({
            type: 'complete',
            progress: 100,
            message: 'All chapters generated successfully!'
          });

        } catch (error) {
          console.error('Streaming error:', error);
          const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
          console.error('Error details:', {
            message: errorMessage,
            stack: error instanceof Error ? error.stack : undefined,
            name: error instanceof Error ? error.name : undefined
          });
          sendEvent({
            type: 'error',
            message: errorMessage
          });
        }

        controller.close();
      }
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('Request error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Invalid request', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      }), 
      { 
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        }
      }
    );
  }
}); 