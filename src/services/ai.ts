import { apiRequestWithRetry } from '@/utils/apiWithRetry';

interface GenerateStoryOptions {
  prompt: string;
  maxTokens?: number;
  temperature?: number;
}

interface GenerateImageOptions {
  prompt: string;
  size?: string;
  quality?: string;
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
 * Generate an image for a chapter with retry logic
 */
export async function generateImage(options: GenerateImageOptions): Promise<string> {
  try {
    const { prompt, size = '1024x1024', quality = 'standard' } = options;
    
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