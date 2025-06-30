import { generateWithGroq } from "@/utils/groq";
import { apiRequestWithRetry } from '@/utils/apiWithRetry';
import {
  TaylorSwiftTheme,
  StoryFormat,
  taylorSwiftThemes,
  storyFormats
} from "@/utils/storyPrompts";

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
  selectedTheme?: TaylorSwiftTheme;
  selectedFormat?: StoryFormat;
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

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const { 
    originalStory, 
    useTaylorSwiftThemes, 
    selectedTheme = 'coming-of-age', 
    selectedFormat = 'short-story',
    numChapters 
  }: StreamChapterRequest = await req.json();

  const chapterCount = numChapters || storyFormats[selectedFormat || 'short-story'].chapters;

  // Create a readable stream for Server-Sent Events
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      
      const sendEvent = (data: ChapterProgress) => {
        const eventData = `data: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(eventData));
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

        const chapters = [];
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
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

async function generateSingleChapter(
  originalStory: string,
  chapterNumber: number,
  totalChapters: number,
  useTaylorSwiftThemes: boolean,
  selectedTheme?: TaylorSwiftTheme,
  selectedFormat?: StoryFormat
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
    
    const themeDescription = themeDescriptions[theme];
    
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

  const response = await apiRequestWithRetry<GroqChatResponse>({
    method: 'POST',
    url: 'https://api.groq.com/openai/v1/chat/completions',
    headers: {
      'Authorization': `Bearer ${process.env.VITE_GROQ_API_KEY}`,
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

  const parsedContent = JSON.parse(response.data.choices[0].message.content);
  return {
    title: parsedContent.title || `Chapter ${chapterNumber}`,
    content: parsedContent.content || ''
  };
}