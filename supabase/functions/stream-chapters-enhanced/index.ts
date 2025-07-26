// Enhanced Stream Chapters Function with Memory System
// Implements: Story Outline Planning, Rolling Memory, Story State, and Repetition Detection
// OPTION A: Single Record with Staged Updates

// @ts-ignore -- Deno Edge Function imports
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
// @ts-ignore -- Deno Edge Function imports
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Import our story memory utilities
import {
  generateStoryOutline,
  generateChapterSummary,
  buildStoryContext,
  saveStoryOutline,
  saveChapterSummary,
  saveStoryState,
  getStoryMemory,
  extractLastWords,
  checkRepetition,
  saveChapterEmbedding,
  generateEmbedding,
  initializeStoryState,
  type StoryOutline,
  type ChapterSummary,
  type StoryState,
  type CharacterBio
} from '../_shared/story-memory.ts';

// Import image generation utilities
import { generateChapterImage } from '../_shared/image-generation.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

// Helper: decode JWT payload (no verify, for dev only)
function decodeJwtPayload(token: string): any {
  try {
    const payload = token.split('.')[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded);
  } catch (e) {
    return null;
  }
}

// Helper: Generate chapter with Groq API
async function generateSingleChapterWithMemory(
  chapterNumber: number,
  chapterTitle: string,
  storyContext: string,
  originalStory: string,
  selectedFormat: string = 'short-story'
): Promise<{ title: string; content: string }> {
  const groqApiKey = Deno.env.get('GROQ_API_KEY');
  
  if (!groqApiKey) {
    throw new Error('GROQ_API_KEY not configured');
  }

  const prompt = `${storyContext}

CHAPTER TO WRITE: Chapter ${chapterNumber}: "${chapterTitle}"

Write this chapter in detail, maintaining perfect consistency with all previous story elements, characters, and plot developments mentioned in the context above.

Requirements:
- Write approximately 800-1200 words
- Keep character names, personalities, and relationships exactly as established
- Continue the plot logically from previous chapters
- Use vivid descriptions and engaging dialogue
- End with a natural transition or cliffhanger for the next chapter
- Format: ${selectedFormat}

Write only the chapter content, no title or chapter number:`;

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${groqApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama3-70b-8192',
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    throw new Error(`Groq API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content?.trim();

  if (!content) {
    throw new Error('No content generated from Groq API');
  }

  return {
    title: chapterTitle,
    content
  };
}

interface StreamChapterRequest {
  originalStory: string;
  useTaylorSwiftThemes: boolean;
  selectedTheme?: string;
  selectedFormat?: string;
  numChapters?: number;
  ebookGenerationId?: string; // Required for memory system
  useEnhancedMemory?: boolean;
  designSettings?: any; // Style preferences for the ebook
}

interface ChapterProgress {
  type: 'progress' | 'chapter' | 'complete' | 'error' | 'outline' | 'memory_check';
  currentChapter?: number;
  totalChapters?: number;
  chapterTitle?: string;
  chapterContent?: string;
  progress?: number;
  message?: string;
  estimatedTimeRemaining?: number;
  outline?: StoryOutline;
  memoryWarning?: {
    isRepetitive: boolean;
    similarChapters: number[];
    maxSimilarity: number;
  };
}

serve(async (req: Request) => {
  console.log('Enhanced Stream Chapters - Request method:', req.method);

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
    }
  }
  
  if (!userId) {
    console.log('Proceeding without user authentication');
  }

  // Create Supabase client
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
  
  if (!supabaseUrl || !supabaseAnonKey) {
    return new Response(
      JSON.stringify({ error: 'Supabase configuration missing' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  
  const supabase = createClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      global: {
        headers: authHeader ? { Authorization: authHeader } : {},
      },
    }
  );

  try {
    const requestBody: StreamChapterRequest = await req.json();
    const { 
      originalStory, 
      useTaylorSwiftThemes, 
      selectedTheme, 
      selectedFormat, 
      numChapters, 
      ebookGenerationId,
      useEnhancedMemory = true,
      designSettings
    } = requestBody;

    if (!ebookGenerationId) {
      return new Response(
        JSON.stringify({ error: 'ebookGenerationId is required for enhanced memory system' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(ebookGenerationId)) {
      return new Response(
        JSON.stringify({ error: `Invalid ebookGenerationId format: ${ebookGenerationId}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create a readable stream for Server-Sent Events
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        
        const sendEvent = (data: ChapterProgress) => {
          try {
            const eventData = `data: ${JSON.stringify(data)}\n\n`;
            controller.enqueue(encoder.encode(eventData));
          } catch (error) {
            console.error('Error serializing event data:', error);
            const errorEvent = `data: ${JSON.stringify({
              type: 'error',
              message: 'Failed to serialize chapter data'
            })}\n\n`;
            controller.enqueue(encoder.encode(errorEvent));
          }
        };

        try {
          sendEvent({
            type: 'progress',
            progress: 5,
            message: 'Enhanced memory system initialized successfully!'
          });

          const chapterCount = numChapters || 3;
          const chapters: Array<{ title: string; content: string }> = [];
          const chapterSummaries: ChapterSummary[] = [];

          // STAGE 1: CREATE INITIAL EBOOK RECORD WITH USER INPUT DATA
          sendEvent({
            type: 'progress',
            progress: 8,
            message: 'Creating initial ebook record...'
          });

          // DEBUG LOGGING: Log the input data
          console.log('=== EBOOK GENERATION DEBUG ===');
          console.log('ebookGenerationId:', ebookGenerationId);
          console.log('userId:', userId);
          console.log('designSettings received:', JSON.stringify(designSettings, null, 2));
          console.log('designSettings type:', typeof designSettings);
          console.log('designSettings is null:', designSettings === null);
          console.log('designSettings is undefined:', designSettings === undefined);

          if (userId) {
            try {
              // Check if record already exists to prevent duplicates
              const { data: existingRecord, error: checkError } = await supabase
                .from('ebook_generations')
                .select('id, status')
                .eq('id', ebookGenerationId)
                .single();

              if (existingRecord) {
                console.log('Record already exists, skipping creation:', existingRecord);
                sendEvent({
                  type: 'progress',
                  progress: 10,
                  message: 'Using existing ebook record...'
                });
              } else {
                // Ensure designSettings is properly handled - never null, always an object
                const safeDesignSettings = designSettings && typeof designSettings === 'object'
                  ? designSettings
                  : {};

                const insertData = {
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
                  style_preferences: safeDesignSettings, // Ensure it's always an object, never null
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                };

                console.log('Inserting ebook record with data:', JSON.stringify(insertData, null, 2));

                // Use upsert to handle potential race conditions
                const { data: initialEbook, error: insertError } = await supabase
                  .from('ebook_generations')
                  .upsert(insertData, {
                    onConflict: 'id',
                    ignoreDuplicates: false
                  })
                  .select()
                  .single();

                if (insertError) {
                  console.error('Error creating initial ebook record:', insertError);
                  console.error('Insert error details:', JSON.stringify(insertError, null, 2));
                  throw new Error(`Failed to create ebook record: ${insertError.message}`);
                }

                console.log('Successfully created initial ebook record:', JSON.stringify(initialEbook, null, 2));
              }
            } catch (dbError) {
              console.error('Database insertion error:', dbError);
              console.error('Database error details:', JSON.stringify(dbError, null, 2));
              
              // If it's a unique constraint violation, it means another process created the record
              if (dbError instanceof Error && dbError.message.includes('duplicate key')) {
                console.log('Record was created by another process, continuing...');
                sendEvent({
                  type: 'progress',
                  progress: 10,
                  message: 'Record created by concurrent process, continuing...'
                });
              } else {
                throw new Error('Failed to create initial ebook record');
              }
            }
          }

          // PHASE 1: STORY OUTLINE PLANNING
          sendEvent({
            type: 'progress',
            progress: 10,
            message: 'Generating story outline with character bios and plot structure...'
          });

          const outline = await generateStoryOutline(
            originalStory,
            chapterCount,
            selectedFormat || 'short-story',
            selectedTheme
          );

          // Set required fields for database storage
          outline.ebook_generation_id = ebookGenerationId;
          outline.user_id = userId || 'anonymous';
          
          // Validate required fields
          if (!outline.ebook_generation_id || outline.ebook_generation_id.trim() === '') {
            throw new Error('ebook_generation_id cannot be empty');
          }
          if (!outline.user_id || outline.user_id.trim() === '') {
            throw new Error('user_id cannot be empty');
          }

          // Save outline to database (now that ebook record exists)
          const outlineId = await saveStoryOutline(supabase, outline);
          console.log('Saved story outline:', outlineId);

          sendEvent({
            type: 'outline',
            outline: outline,
            progress: 20,
            message: `Story outline created: "${outline.book_title}"`
          });

          // STAGE 2: UPDATE WITH AI-GENERATED METADATA
          sendEvent({
            type: 'progress',
            progress: 22,
            message: 'Updating with AI-generated metadata...'
          });

          if (userId) {
            try {
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
                .eq('id', ebookGenerationId)
                .select()
                .single();

              if (updateError) {
                console.error('Error updating ebook with metadata:', updateError);
                throw new Error(`Failed to update ebook metadata: ${updateError.message}`);
              }

              console.log('Successfully updated ebook with AI metadata:', updatedEbook);
            } catch (dbError) {
              console.error('Database metadata update error:', dbError);
              throw new Error('Failed to update ebook with metadata');
            }
          }

          // PHASE 2: INITIALIZE STORY STATE
          sendEvent({
            type: 'progress',
            progress: 24,
            message: 'Initializing story state tracking...'
          });

          let storyState = initializeStoryState(outline, ebookGenerationId, userId || 'anonymous', outlineId);
          await saveStoryState(supabase, storyState);

          // PHASE 3: GENERATE CHAPTERS WITH MEMORY
          const generatedImages: Array<{
            imageUrl?: string;
            prompt: string;
            chapterNumber: number;
            chapterTitle: string;
            revisedPrompt?: string;
            generatedAt: string;
          }> = [];

          for (let i = 0; i < chapterCount; i++) {
            const chapterNumber = i + 1;
            const progressPercent = 24 + (i / chapterCount) * 50; // Reduced from 60 to 50 to make room for image generation

            sendEvent({
              type: 'progress',
              progress: progressPercent,
              currentChapter: chapterNumber,
              totalChapters: chapterCount,
              message: `Generating Chapter ${chapterNumber}: "${outline.chapter_titles[i]}"...`
            });

            // Build context with all memory information
            const storyContext = buildStoryContext(
              outline,
              chapterSummaries,
              storyState,
              chapterNumber
            );

            // Generate the chapter
            const chapter = await generateSingleChapterWithMemory(
              chapterNumber,
              outline.chapter_titles[i],
              storyContext,
              originalStory,
              selectedFormat
            );

            chapters.push(chapter);

            // PHASE 3.5: GENERATE CHAPTER IMAGE
            sendEvent({
              type: 'progress',
              progress: progressPercent + 3,
              message: `Generating illustration for Chapter ${chapterNumber}...`
            });

            try {
              const chapterImage = await generateChapterImage(
                chapter.title,
                chapter.content,
                chapterNumber,
                'children' // Default style, could be made configurable
              );

              if (chapterImage) {
                generatedImages.push(chapterImage);
                console.log(`Successfully generated image for Chapter ${chapterNumber}: ${chapterImage.imageUrl}`);
              }
            } catch (imageError) {
              console.error(`Failed to generate image for Chapter ${chapterNumber}:`, imageError);
              // Continue without image - don't fail the entire generation
            }

            // PHASE 4: POST-CHAPTER PROCESSING
            sendEvent({
              type: 'progress',
              progress: progressPercent + 5,
              message: `Processing Chapter ${chapterNumber} memory data...`
            });

            // Generate chapter summary
            const summaryData = await generateChapterSummary(
              chapter.title,
              chapter.content,
              chapterNumber,
              chapterSummaries.map(s => s.summary)
            );

            const chapterSummary: ChapterSummary = {
              ebook_generation_id: ebookGenerationId,
              story_outline_id: outlineId,
              user_id: userId || 'anonymous',
              chapter_number: chapterNumber,
              chapter_title: chapter.title,
              summary: summaryData.summary,
              key_events: summaryData.key_events,
              character_developments: summaryData.character_developments,
              last_chapter_excerpt: extractLastWords(chapter.content, 200),
              chapter_word_count: chapter.content.length
            };

            const chapterSummaryId = await saveChapterSummary(supabase, chapterSummary);
            chapterSummaries.push(chapterSummary);

            // Check for repetition
            const repetitionCheck = await checkRepetition(
              supabase,
              ebookGenerationId,
              chapter.content,
              chapterNumber,
              0.85
            );

            if (repetitionCheck.isRepetitive) {
              sendEvent({
                type: 'memory_check',
                memoryWarning: repetitionCheck,
                message: `Warning: Chapter ${chapterNumber} may be repetitive`
              });
            }

            // Generate and save embedding
            const embedding = await generateEmbedding(chapter.content);
            await saveChapterEmbedding(supabase, {
              ebook_generation_id: ebookGenerationId,
              chapter_summary_id: chapterSummaryId,
              user_id: userId || 'anonymous',
              chapter_number: chapterNumber,
              chapter_title: chapter.title,
              embedding_vector: embedding,
              text_content: chapter.content,
              content_type: 'chapter',
              max_similarity_score: repetitionCheck.maxSimilarity,
              similar_chapter_numbers: repetitionCheck.similarChapters
            });

            // Update story state
            storyState.current_chapter = chapterNumber + 1;
            
            // Update character developments
            for (const charDev of summaryData.character_developments) {
              const charName = charDev.character_name;
              const character = storyState.characters.find(c => c.name === charName);
              if (character) {
                character.current_status = charDev.development || character.current_status;
              }
            }

            // Add key events to major plot events
            for (const event of summaryData.key_events) {
              storyState.major_plot_events.push({
                event: event,
                chapter: chapterNumber,
                consequences: `Event from Chapter ${chapterNumber}`
              });
            }

            await saveStoryState(supabase, storyState);

            // STAGE 3: UPDATE WITH GENERATED CHAPTERS AND IMAGES (Progressive Updates)
            if (userId) {
              try {
                // Prepare current images data for progressive update
                const currentImagesData = generatedImages.map(img => ({
                  imageUrl: img.imageUrl,
                  prompt: img.prompt,
                  chapterNumber: img.chapterNumber,
                  chapterTitle: img.chapterTitle,
                  revisedPrompt: img.revisedPrompt,
                  generatedAt: img.generatedAt,
                  type: 'chapter_illustration'
                }));

                const { data: chapterUpdateEbook, error: chapterUpdateError } = await supabase
                  .from('ebook_generations')
                  .update({
                    chapters: chapters,
                    images: currentImagesData, // Update images progressively
                    word_count: chapters.reduce((total, ch) => total + ch.content.length, 0),
                    updated_at: new Date().toISOString()
                  })
                  .eq('id', ebookGenerationId)
                  .select()
                  .single();

                if (chapterUpdateError) {
                  console.error('Error updating ebook with chapter:', chapterUpdateError);
                } else {
                  console.log(`Successfully updated ebook with Chapter ${chapterNumber} and ${currentImagesData.length} images`);
                }
              } catch (dbError) {
                console.error('Database chapter update error:', dbError);
              }
            }

            // Send chapter completion event
            sendEvent({
              type: 'chapter',
              chapterTitle: chapter.title,
              chapterContent: chapter.content,
              currentChapter: chapterNumber,
              totalChapters: chapterCount,
              progress: progressPercent + 10,
              message: `Chapter ${chapterNumber} completed successfully`
            });
          }

          // STAGE 4: FINAL UPDATE - MARK AS COMPLETED WITH IMAGES
          sendEvent({
            type: 'progress',
            progress: 90,
            message: 'Finalizing ebook generation and saving images...'
          });

          // Prepare images data for database storage
          const imagesData = generatedImages.map(img => ({
            imageUrl: img.imageUrl,
            prompt: img.prompt,
            chapterNumber: img.chapterNumber,
            chapterTitle: img.chapterTitle,
            revisedPrompt: img.revisedPrompt,
            generatedAt: img.generatedAt,
            type: 'chapter_illustration'
          }));

          console.log(`Generated ${imagesData.length} images for ebook ${ebookGenerationId}`);

          // Final update to mark the ebook as completed with images
          if (userId) {
            try {
              const updateData = {
                status: 'completed',
                chapter_count: chapters.length,
                word_count: chapters.reduce((total, ch) => total + ch.content.length, 0),
                images: imagesData, // Store the generated images
                updated_at: new Date().toISOString()
              };

              const { data: ebookGeneration, error } = await supabase
                .from('ebook_generations')
                .update(updateData)
                .eq('id', ebookGenerationId)
                .select()
                .single();

              if (error) {
                console.error('Error finalizing ebook_generations:', error);
              } else {
                console.log('Successfully completed memory-enhanced story with images:', {
                  id: ebookGeneration.id,
                  title: ebookGeneration.title,
                  chapters: chapters.length,
                  images: imagesData.length
                });
              }
            } catch (dbError) {
              console.error('Database finalization error:', dbError);
            }
          }

          // PHASE 6: COMPLETION
          sendEvent({
            type: 'complete',
            progress: 100,
            message: `Successfully generated ${chapters.length} chapters with enhanced memory system!`,
            totalChapters: chapterCount
          });

        } catch (error) {
          console.error('Enhanced streaming error:', error);
          sendEvent({
            type: 'error',
            message: error instanceof Error ? error.message : 'Unknown error occurred'
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