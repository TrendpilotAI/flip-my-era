import { apiRequestWithRetry } from '@/utils/apiWithRetry';
import {
  RunwareService,
  createEbookIllustrationPrompt,
  enhancePromptWithGroq,
  type EbookIllustrationParams,
  type TaylorSwiftIllustrationParams
} from '@/utils/runware';
import { TaylorSwiftTheme } from '@/utils/storyPrompts';
import { type ImageMood } from '@/utils/taylorSwiftImagePrompts';

interface GenerateStoryOptions {
  prompt: string;
  maxTokens?: number;
  temperature?: number;
}

interface GenerateImageOptions {
  prompt: string;
  size?: string;
  quality?: string;
  useRunware?: boolean;
}

interface GenerateEbookIllustrationOptions {
  chapterTitle: string;
  chapterContent: string;
  style?: 'children' | 'fantasy' | 'adventure' | 'educational';
  mood?: 'happy' | 'mysterious' | 'adventurous' | 'peaceful';
  useEnhancedPrompts?: boolean;
}

interface GenerateTaylorSwiftIllustrationOptions {
  chapterTitle: string;
  chapterContent: string;
  theme: TaylorSwiftTheme;
  useEnhancedPrompts?: boolean;
  customMood?: ImageMood;
  timeOfDay?: 'dawn' | 'morning' | 'afternoon' | 'golden-hour' | 'twilight' | 'night';
  season?: 'spring' | 'summer' | 'autumn' | 'winter';
  setting?: string;
}

interface GenerateNameOptions {
  originalName: string;
  targetGender: 'male' | 'female' | 'neutral';
  shouldBeSimilar?: boolean;
}

// API response interfaces
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

interface OpenAIImageData {
  url: string;
  revised_prompt?: string;
}

interface OpenAIImageResponse {
  created: number;
  data: OpenAIImageData[];
}

// Initialize RUNWARE service
const runwareService = new RunwareService(import.meta.env.VITE_RUNWARE_API_KEY || '');

/**
 * Check if RUNWARE is available and properly configured
 */
export async function isRunwareAvailable(): Promise<boolean> {
  if (!runwareService.isConfigured()) {
    return false;
  }
  
  try {
    return await runwareService.isConnected();
  } catch (error) {
    console.error('RUNWARE availability check failed:', error);
    return false;
  }
}

/**
 * Generate a story using the Groq API with retry logic for rate limits
 */
export async function generateStory(options: GenerateStoryOptions): Promise<string> {
  try {
    const { prompt, maxTokens = 2048, temperature = 0.7 } = options;
    
    const response = await apiRequestWithRetry<GroqChatResponse>({
      method: 'POST',
      url: 'https://api.groq.com/openai/v1/chat/completions',
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      data: {
        model: 'llama3-70b-8192',
        messages: [
          { role: 'system', content: 'You are a creative storyteller who specializes in creating engaging, imaginative stories for children and young adults.' },
          { role: 'user', content: prompt }
        ],
        temperature,
        max_tokens: maxTokens
      }
    });
    
    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('Failed to generate story:', error);
    throw new Error('Story generation failed. Please try again later.');
  }
}

/**
 * Generate chapter content based on a story with retry logic
 */
export async function generateChapters(story: string, numChapters: number = 3): Promise<Array<{ title: string; content: string }>> {
  try {
    const prompt = `
      Create ${numChapters} chapters for a children's book based on this story:
      
      ${story}
      
      For each chapter, provide a title and content. Make the chapters engaging, imaginative, and appropriate for children.
      Format your response as a JSON array with objects containing 'title' and 'content' properties.
    `;
    
    const response = await apiRequestWithRetry<GroqChatResponse>({
      method: 'POST',
      url: 'https://api.groq.com/openai/v1/chat/completions',
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      data: {
        model: 'llama3-70b-8192',
        messages: [
          { role: 'system', content: 'You are a creative children\'s book author who specializes in creating engaging chapter books.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 4096,
        response_format: { type: "json_object" }
      }
    });
    
    const content = response.data.choices[0].message.content;
    const parsedContent = JSON.parse(content);
    
    return parsedContent.chapters || [];
  } catch (error) {
    console.error('Failed to generate chapters:', error);
    throw new Error('Chapter generation failed. Please try again later.');
  }
}

/**
 * Generate Taylor Swift-themed chapters with format-specific targeting
 */
export async function generateTaylorSwiftChapters(
  story: string,
  theme: string,
  format: 'short-story' | 'novella',
  numChapters?: number
): Promise<Array<{ title: string; content: string }>> {
  try {
    // Set chapter count and word targets based on format
    const chapterCount = numChapters || (format === 'novella' ? 8 : 3);
    const wordTarget = format === 'novella' ?
      `approximately 1,250-3,125 words per chapter (targeting 10,000-25,000 total words)` :
      `approximately 300-2,500 words per chapter (targeting 1,000-7,500 total words)`;
    
    const themeDescriptions = {
      'coming-of-age': 'coming-of-age, self-discovery, and finding your voice',
      'first-love': 'first love, innocent romance, and the magic of new connections',
      'heartbreak': 'heartbreak, healing, and finding strength after loss',
      'friendship': 'friendship, loyalty, and the bonds that shape us'
    };
    
    const themeDescription = themeDescriptions[theme as keyof typeof themeDescriptions] || 'personal growth and emotional discovery';
    
    const prompt = `
      Create ${chapterCount} chapters for a Taylor Swift-inspired young adult ${format === 'novella' ? 'novella' : 'short story'} based on this story:
      
      ${story}
      
      SPECIFICATIONS:
      - Theme: ${themeDescription}
      - Format: YA ${format === 'novella' ? 'Novella' : 'Short Story'}
      - Target: ${wordTarget}
      - Age-appropriate content for readers 13-18
      - Emotional storytelling reminiscent of Taylor Swift's lyrical style
      
      For each chapter, provide:
      - A compelling title that reflects the emotional journey
      - Rich content with authentic dialogue and relatable teenage experiences
      - Character development and emotional depth
      - Age-appropriate themes and situations
      - Vivid descriptions and emotional resonance
      
      Make each chapter build toward an emotionally satisfying conclusion that captures the essence of young adult ${themeDescription}.
      
      Format your response as a JSON object with a "chapters" array containing objects with 'title' and 'content' properties.
    `;
    
    const response = await apiRequestWithRetry<GroqChatResponse>({
      method: 'POST',
      url: 'https://api.groq.com/openai/v1/chat/completions',
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      data: {
        model: 'llama3-70b-8192',
        messages: [
          {
            role: 'system',
            content: `You are a creative young adult author who specializes in emotionally resonant ${format === 'novella' ? 'novellas' : 'short stories'} with Taylor Swift-inspired themes. You write age-appropriate content that captures the intensity and authenticity of teenage emotions.`
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: format === 'novella' ? 8192 : 4096,
        response_format: { type: "json_object" }
      }
    });
    
    const content = response.data.choices[0].message.content;
    const parsedContent = JSON.parse(content);
    
    return parsedContent.chapters || [];
  } catch (error) {
    console.error('Failed to generate Taylor Swift chapters:', error);
    throw new Error('Taylor Swift-themed chapter generation failed. Please try again later.');
  }
}

/**
 * Generate a name based on gender using Groq API with retry logic
 */
export async function generateName(options: GenerateNameOptions): Promise<string> {
  try {
    const { originalName, targetGender, shouldBeSimilar = true } = options;
    
    const systemPrompt = 'You are a creative name generator who specializes in creating interesting and appropriate names.';
    let userPrompt = '';
    
    if (targetGender === 'neutral') {
      userPrompt = `Generate a gender-neutral name that is interesting and unique${shouldBeSimilar ? ' but somewhat similar in style or sound to the original name "' + originalName + '"' : ''}. Return ONLY the name, with no additional text or explanation.`;
    } else {
      userPrompt = `Generate a ${targetGender} name that is interesting and unique${shouldBeSimilar ? ' but somewhat similar in style or sound to the original name "' + originalName + '"' : ''}. Return ONLY the name, with no additional text or explanation.`;
    }
    
    const response = await apiRequestWithRetry<GroqChatResponse>({
      method: 'POST',
      url: 'https://api.groq.com/openai/v1/chat/completions',
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      data: {
        model: 'llama3-70b-8192',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.8,
        max_tokens: 50
      }
    });
    
    // Clean up the response to ensure we only get the name
    const generatedName = response.data.choices[0].message.content.trim();
    return generatedName;
  } catch (error) {
    console.error('Failed to generate name:', error);
    throw new Error('Name generation failed. Please try again later.');
  }
}

/**
 * Generate an optimized illustration for an ebook chapter using RUNWARE Flux1.1 Pro with AI-enhanced prompts
 */
export async function generateEbookIllustration(options: GenerateEbookIllustrationOptions): Promise<string> {
  try {
    const { chapterTitle, chapterContent, style = 'children', mood = 'happy', useEnhancedPrompts = true } = options;
    
    // Check if RUNWARE is available
    const runwareAvailable = await isRunwareAvailable();
    
    if (runwareAvailable) {
      // Use RUNWARE with Flux1.1 Pro for ebook illustrations
      const illustration = await runwareService.generateEbookIllustration({
        chapterTitle,
        chapterContent,
        style,
        mood,
        useEnhancedPrompts
      });
      
      return illustration.imageURL || '';
    } else {
      console.warn('RUNWARE not available, falling back to OpenAI');
      throw new Error('RUNWARE not available');
    }
  } catch (error) {
    console.error('Failed to generate ebook illustration with RUNWARE:', error);
    
    // Fallback to OpenAI if RUNWARE fails
    try {
      const { chapterTitle, chapterContent, style = 'children', mood = 'happy', useEnhancedPrompts = true } = options;
      
      let prompt: string;
      
      if (useEnhancedPrompts) {
        // Try to use Groq-enhanced prompt
        try {
          prompt = await enhancePromptWithGroq({
            chapterTitle,
            chapterContent,
            style,
            mood
          });
        } catch (enhancementError) {
          console.warn('Failed to enhance prompt with Groq, using basic prompt:', enhancementError);
          prompt = createEbookIllustrationPrompt({
            chapterTitle,
            chapterContent,
            style,
            mood
          });
        }
      } else {
        // Use basic prompt
        prompt = createEbookIllustrationPrompt({
          chapterTitle,
          chapterContent,
          style,
          mood
        });
      }
      
      return await generateImage({ prompt, useRunware: false });
    } catch (fallbackError) {
      console.error('Fallback image generation also failed:', fallbackError);
      throw new Error('Ebook illustration generation failed. Please try again later.');
    }
  }
}

/**
 * Generate a Taylor Swift-inspired thematic illustration with mood-appropriate styling
 */
export async function generateTaylorSwiftIllustration(options: GenerateTaylorSwiftIllustrationOptions): Promise<string> {
  try {
    const {
      chapterTitle,
      chapterContent,
      theme,
      useEnhancedPrompts = true,
      customMood,
      timeOfDay,
      season,
      setting
    } = options;
    
    // Check if RUNWARE is available
    const runwareAvailable = await isRunwareAvailable();
    
    if (runwareAvailable) {
      // Use RUNWARE with Taylor Swift-specific styling
      const illustration = await runwareService.generateTaylorSwiftIllustration({
        chapterTitle,
        chapterContent,
        theme,
        useEnhancedPrompts,
        customMood,
        timeOfDay,
        season,
        setting
      });
      
      return illustration.imageURL || '';
    } else {
      console.warn('RUNWARE not available for Taylor Swift illustrations, falling back to standard generation');
      
      // Fallback to standard ebook illustration with Taylor Swift styling hints
      const styleMapping: Record<TaylorSwiftTheme, 'children' | 'fantasy' | 'adventure' | 'educational'> = {
        'coming-of-age': 'children',
        'first-love': 'fantasy',
        'heartbreak': 'children',
        'friendship': 'adventure'
      };
      
      const moodMapping: Record<TaylorSwiftTheme, 'happy' | 'mysterious' | 'adventurous' | 'peaceful'> = {
        'coming-of-age': 'peaceful',
        'first-love': 'happy',
        'heartbreak': 'mysterious',
        'friendship': 'happy'
      };
      
      return await generateEbookIllustration({
        chapterTitle,
        chapterContent,
        style: styleMapping[theme],
        mood: moodMapping[theme],
        useEnhancedPrompts
      });
    }
  } catch (error) {
    console.error('Failed to generate Taylor Swift illustration:', error);
    throw new Error('Taylor Swift illustration generation failed. Please try again later.');
  }
}

/**
 * Generate an image for a chapter with retry logic
 */
export async function generateImage(options: GenerateImageOptions): Promise<string> {
  try {
    const { prompt, size = '1024x1024', quality = 'standard', useRunware = false } = options;
    
    // Use RUNWARE if specified and available
    if (useRunware) {
      const runwareAvailable = await isRunwareAvailable();
      if (runwareAvailable) {
        try {
          const illustration = await runwareService.generateImage({
            positivePrompt: prompt,
            model: "flux1.1-pro",
            numberResults: 1,
            outputFormat: "WEBP",
            CFGScale: 7,
            scheduler: "FlowMatchEulerDiscreteScheduler",
            strength: 0.8,
          });
          return illustration.imageURL;
        } catch (runwareError) {
          console.warn('RUNWARE image generation failed, falling back to OpenAI:', runwareError);
        }
      } else {
        console.warn('RUNWARE not available, using OpenAI');
      }
    }
    
    // First try with OpenAI
    try {
      const response = await apiRequestWithRetry<OpenAIImageResponse>({
        method: 'POST',
        url: 'https://api.openai.com/v1/images/generations',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        data: {
          prompt,
          n: 1,
          size,
          quality,
          response_format: 'url'
        }
      });
      
      return response.data.data[0].url;
    } catch (openaiError) {
      console.warn('OpenAI image generation failed, falling back to placeholder:', openaiError);
      
      // Fallback to a placeholder image if OpenAI fails
      return `https://picsum.photos/seed/${Math.random().toString(36).substring(7)}/1024/1024`;
    }
  } catch (error) {
    console.error('Failed to generate image:', error);
    throw new Error('Image generation failed. Please try again later.');
  }
} 