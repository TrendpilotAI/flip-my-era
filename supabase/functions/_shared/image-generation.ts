// Image Generation Utilities for Ebook Chapters
// Integrates with OpenAI DALL-E API for generating chapter illustrations

interface GeneratedImage {
  imageUrl: string;
  prompt: string;
  chapterNumber: number;
  chapterTitle: string;
  revisedPrompt?: string;
  generatedAt: string;
}

/**
 * Create an optimized prompt for ebook chapter illustrations
 */
function createEbookIllustrationPrompt(
  chapterTitle: string,
  chapterContent: string,
  style: 'children' | 'fantasy' | 'adventure' | 'educational' = 'children',
  mood: 'happy' | 'mysterious' | 'adventurous' | 'peaceful' = 'happy'
): string {
  // Extract key elements from chapter content (first 200 characters for context)
  const contentPreview = chapterContent.substring(0, 200).replace(/[^\w\s]/g, '');
  
  // Style-specific enhancements
  const styleEnhancements = {
    children: 'colorful, vibrant, child-friendly, simple shapes, warm colors, cute characters',
    fantasy: 'magical, ethereal, mystical elements, glowing effects, fantasy creatures, enchanted setting',
    adventure: 'dynamic, action-oriented, dramatic lighting, exciting composition, adventurous spirit',
    educational: 'clear, informative, educational, well-lit, detailed, learning-focused'
  };
  
  // Mood-specific enhancements
  const moodEnhancements = {
    happy: 'bright, cheerful, positive energy, smiling characters, warm lighting',
    mysterious: 'mysterious atmosphere, soft lighting, intriguing elements, subtle shadows',
    adventurous: 'bold, energetic, dynamic composition, exciting colors, sense of movement',
    peaceful: 'calm, serene, gentle colors, peaceful atmosphere, tranquil setting'
  };
  
  // Base prompt structure optimized for DALL-E
  const basePrompt = `Create a beautiful children's book illustration for the chapter "${chapterTitle}". 
    The scene should be: ${styleEnhancements[style]}, ${moodEnhancements[mood]}. 
    Context from the chapter: ${contentPreview}... 
    Style: high-quality digital art, professional children's book illustration, 
    detailed but not overwhelming, age-appropriate, engaging for young readers. 
    Technical quality: sharp details, balanced composition, harmonious colors, 
    professional lighting, clean lines, appealing to children.`;
  
  return basePrompt.trim();
}

/**
 * Generate image using OpenAI DALL-E API
 */
async function generateImageWithDallE(
  prompt: string,
  chapterTitle: string
): Promise<GeneratedImage | null> {
  const apiKey = Deno.env.get('VITE_OPENAI_API_KEY') || Deno.env.get('OPENAI_API_KEY');
  
  if (!apiKey) {
    console.warn('OpenAI API key not configured. Skipping image generation.');
    return null;
  }

  try {
    console.log(`Generating DALL-E image for: ${chapterTitle}`);
    
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: prompt,
        n: 1,
        size: '1024x1024',
        quality: 'standard',
        response_format: 'url'
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('DALL-E API error:', errorData);
      return null;
    }

    const data = await response.json();
    
    if (data.data && data.data.length > 0) {
      const imageData = data.data[0];
      console.log(`Successfully generated DALL-E image for: ${chapterTitle}`);
      
      return {
        imageUrl: imageData.url,
        prompt: prompt,
        chapterNumber: 0, // Will be set by caller
        chapterTitle: chapterTitle,
        revisedPrompt: imageData.revised_prompt,
        generatedAt: new Date().toISOString()
      };
    } else {
      console.error('No image data returned from DALL-E API');
      return null;
    }
  } catch (error) {
    console.error(`Error generating DALL-E image for ${chapterTitle}:`, error);
    return null;
  }
}

/**
 * Generate an image for a chapter with fallback handling
 */
export async function generateChapterImage(
  chapterTitle: string,
  chapterContent: string,
  chapterNumber: number,
  style: 'children' | 'fantasy' | 'adventure' | 'educational' = 'children'
): Promise<{
  imageUrl?: string;
  prompt: string;
  chapterNumber: number;
  chapterTitle: string;
  revisedPrompt?: string;
  generatedAt: string;
} | null> {
  try {
    console.log(`Generating DALL-E image for Chapter ${chapterNumber}: ${chapterTitle}`);
    
    // Create optimized prompt
    const prompt = createEbookIllustrationPrompt(chapterTitle, chapterContent, style, 'happy');
    
    // Generate image with DALL-E
    const generatedImage = await generateImageWithDallE(prompt, chapterTitle);
    
    if (generatedImage && generatedImage.imageUrl) {
      console.log(`Successfully generated DALL-E image for Chapter ${chapterNumber}`);
      return {
        imageUrl: generatedImage.imageUrl,
        prompt: prompt,
        chapterNumber: chapterNumber,
        chapterTitle: chapterTitle,
        revisedPrompt: generatedImage.revisedPrompt,
        generatedAt: generatedImage.generatedAt
      };
    } else {
      console.warn(`Failed to generate DALL-E image for Chapter ${chapterNumber}, continuing without image`);
      return null;
    }
  } catch (error) {
    console.error(`Error generating DALL-E image for Chapter ${chapterNumber}:`, error);
    return null;
  }
}

/**
 * Generate a cover image for the entire ebook
 */
export async function generateCoverImage(
  bookTitle: string,
  bookDescription: string,
  style: 'children' | 'fantasy' | 'adventure' | 'educational' = 'children'
): Promise<{
  imageUrl?: string;
  prompt: string;
  revisedPrompt?: string;
  generatedAt: string;
} | null> {
  try {
    console.log(`Generating DALL-E cover image for: ${bookTitle}`);
    
    // Create cover-specific prompt
    const prompt = `Create a beautiful book cover illustration for "${bookTitle}". 
      ${bookDescription ? `Book description: ${bookDescription.substring(0, 200)}...` : ''}
      Style: professional book cover design, ${style === 'children' ? 'child-friendly, colorful, engaging for young readers' : 
             style === 'fantasy' ? 'magical, mystical, fantasy elements' :
             style === 'adventure' ? 'exciting, dynamic, adventurous' : 'educational, clear, informative'}.
      Technical quality: high-resolution, professional book cover design, 
      attractive typography space, compelling visual composition, 
      suitable for both print and digital formats.`;
    
    // Generate image with DALL-E
    const generatedImage = await generateImageWithDallE(prompt, `Cover: ${bookTitle}`);
    
    if (generatedImage && generatedImage.imageUrl) {
      console.log(`Successfully generated DALL-E cover image for: ${bookTitle}`);
      return {
        imageUrl: generatedImage.imageUrl,
        prompt: prompt,
        revisedPrompt: generatedImage.revisedPrompt,
        generatedAt: generatedImage.generatedAt
      };
    } else {
      console.warn(`Failed to generate DALL-E cover image for: ${bookTitle}`);
      return null;
    }
  } catch (error) {
    console.error(`Error generating DALL-E cover image for: ${bookTitle}`, error);
    return null;
  }
}