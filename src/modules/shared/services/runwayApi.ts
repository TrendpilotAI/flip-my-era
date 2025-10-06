/**
 * RUNWARE API Integration for ERA Images
 * Generates images using RUNWARE's Seedream 4 model with 2K 3:4 vertical portraits
 */

import { runwareService, type GeneratedImage } from '@/modules/shared/utils/runware';
import { generateWithGroq } from '@/modules/shared/utils/groq';

export interface ImageVariation {
  url: string;
  seed: number;
  cost?: number;
  score?: number;
  reasoning?: string;
}

export interface ImageGenerationResult {
  id: string;
  title: string;
  variations: ImageVariation[];
  bestImageIndex: number;
  bestImage: ImageVariation;
}

/**
 * Analyze image variations and select the best one using AI
 */
async function analyzeAndSelectBestImage(
  variations: ImageVariation[],
  title: string,
  description: string
): Promise<{ bestIndex: number; reasoning: string; scores: number[] }> {
  try {
    const analysisPrompt = `You are an expert art director analyzing images for a Taylor Swift-inspired storytelling app.

Task: Analyze ${variations.length} image variations and select the BEST one.

Title: "${title}"
Description: "${description}"

Criteria for "best" image:
1. Composition: Strong visual balance and focal point
2. Aesthetic Match: Aligns with described mood and era
3. Technical Quality: Sharp, well-lit, professional
4. Emotional Impact: Evokes the intended feeling
5. Readability: Text (if present) is legible and well-placed
6. No "GenZ Hook" text visible

Image URLs:
${variations.map((v, i) => `${i + 1}. Seed: ${v.seed}, URL: ${v.url}`).join('\n')}

Respond with JSON only:
{
  "bestIndex": <0-${variations.length - 1}>,
  "reasoning": "Brief explanation why this image is best",
  "scores": [<score 0-10 for each image>]
}`;

    const response = await generateWithGroq(analysisPrompt);
    
    // Parse JSON response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const analysis = JSON.parse(jsonMatch[0]);
      return {
        bestIndex: analysis.bestIndex || 0,
        reasoning: analysis.reasoning || 'Selected by AI analysis',
        scores: analysis.scores || variations.map(() => 5)
      };
    }
  } catch (error) {
    console.error('Error analyzing images:', error);
  }

  // Fallback: select middle image
  return {
    bestIndex: Math.floor(variations.length / 2),
    reasoning: 'Auto-selected (analysis unavailable)',
    scores: variations.map(() => 5)
  };
}

/**
 * Generate multiple image variations and select the best one
 */
export async function generateImageWithVariations(params: {
  id: string;
  prompt: string;
  title: string;
  vibeCheck?: string;
  swiftieSignal?: string;
  eraType?: string;
  aspectRatio?: '3:4' | '16:9' | '1:1' | '4:3';
  numberResults?: number;
}): Promise<ImageGenerationResult> {
  const numVariations = params.numberResults || 5;

  if (!runwareService.isConfigured()) {
    console.warn('RUNWARE not configured, using placeholder');
    return {
      id: params.id,
      title: params.title,
      variations: [{
        url: generatePlaceholderImage(params.prompt),
        seed: 0
      }],
      bestImageIndex: 0,
      bestImage: {
        url: generatePlaceholderImage(params.prompt),
        seed: 0
      }
    };
  }

  try {
    let results: any[];

    // Determine if this is an ERA or story prompt image
    if (params.vibeCheck && params.swiftieSignal && params.eraType) {
      // Story prompt image
      results = await runwareService.generateStoryPromptImage({
        title: params.title,
        vibeCheck: params.vibeCheck,
        swiftieSignal: params.swiftieSignal,
        eraType: params.eraType,
        aspectRatio: params.aspectRatio || '3:4',
        numberResults: numVariations
      });
    } else {
      // ERA image
      results = await runwareService.generateEraImage({
        eraName: params.id,
        description: params.prompt,
        title: params.title,
        aspectRatio: params.aspectRatio || '3:4',
        numberResults: numVariations
      });
    }

    // Extract variations from results
    const variations: ImageVariation[] = results.map(r => ({
      url: r.imageURL,
      seed: r.seed,
      cost: r.cost
    }));

    // Analyze and select best image
    const analysis = await analyzeAndSelectBestImage(variations, params.title, params.prompt);

    // Add scores to variations
    variations.forEach((v, i) => {
      v.score = analysis.scores[i];
      if (i === analysis.bestIndex) {
        v.reasoning = analysis.reasoning;
      }
    });

    return {
      id: params.id,
      title: params.title,
      variations,
      bestImageIndex: analysis.bestIndex,
      bestImage: variations[analysis.bestIndex]
    };
  } catch (error) {
    console.error('Error generating image variations:', error);
    throw error;
  }
}

/**
 * Batch generate images with variations
 */
export async function batchGenerateImagesWithVariations(
  prompts: Array<{ 
    id: string; 
    prompt: string; 
    title: string;
    vibeCheck?: string;
    swiftieSignal?: string;
    eraType?: string;
    aspectRatio?: '3:4' | '16:9' | '1:1' | '4:3';
  }>
): Promise<ImageGenerationResult[]> {
  const results: ImageGenerationResult[] = [];

  for (const item of prompts) {
    try {
      console.log(`\n📸 Generating 5 variations for: ${item.title}`);
      const result = await generateImageWithVariations({
        ...item,
        numberResults: 5
      });
      results.push(result);
      console.log(`✅ Generated variations. Best: #${result.bestImageIndex + 1} (Score: ${result.bestImage.score}/10)`);
      console.log(`   Reasoning: ${result.bestImage.reasoning}`);
      
      // 3-second delay between prompts (each prompt generates 5 images)
      await new Promise(resolve => setTimeout(resolve, 3000));
    } catch (error) {
      console.error(`❌ Failed for ${item.id}:`, error);
    }
  }

  return results;
}

/**
 * Generate placeholder image URL
 */
function generatePlaceholderImage(prompt: string): string {
  const hash = hashString(prompt);
  const colors = ['FF6B35', '8B7355', '87CEEB', '8B0000', '000000', 'FFB6C1', '191970'];
  const colorIndex = Math.abs(hash) % colors.length;
  const color = colors[colorIndex];
  
  return `https://placehold.co/1536x2048/${color}/white?text=${encodeURIComponent(prompt.substring(0, 20))}`;
}

/**
 * Simple string hash function
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash;
}

/**
 * Create detailed image prompt for ERA representative image
 * Instructions included in prompt since Seedream doesn't support negative prompts
 */
export function createEraImagePrompt(eraName: string, eraDisplayName: string, description: string): string {
  const prompts: Record<string, string> = {
    'showgirl': `Glamorous showgirl in Art Deco theater, orange and mint green atmospheric lighting, crystal embellishments on costume, sparkling sequins, vintage Hollywood elegance, bathtub filled with rose petals in background, dreamy cinematic atmosphere, luxurious theatrical setting, warm golden glow, professional photography, 3:4 vertical portrait composition, photorealistic, ultra high detail, 2K quality. Always include the title "${eraDisplayName}" in elegant Art Deco typography. Do not include the words "GenZ Hook".`,
    
    'folklore-evermore': `Ethereal cottagecore scene, misty forest in background, person wearing vintage knit cardigan, autumn leaves gently falling, holding old handwritten letter, cozy wooden cabin interior, golden hour warm sunlight filtering through trees, nostalgic peaceful mood, rustic natural aesthetic, earth tones and muted colors, professional photography, 3:4 vertical portrait composition, photorealistic, ultra high detail, 2K quality. Always include the title "${eraDisplayName}" in handwritten calligraphy. Do not include the words "GenZ Hook".`,
    
    '1989': `Urban cityscape at golden sunrise, confident person on Manhattan rooftop, soft neon lights in background, holding vintage polaroid camera, modern chic fashion outfit, New York skyline silhouette, vibrant city energy, sky blue and blush pink color palette, professional photography, 3:4 vertical portrait composition, photorealistic, ultra high detail, 2K quality. Always include the title "${eraDisplayName}" in modern sans-serif typography. Do not include the words "GenZ Hook".`,
    
    'red': `Intense autumn atmosphere, emotional figure surrounded by swirling red and orange leaves, rain-soaked cobblestone street, vintage record store with glowing window, deep burgundy and burnt orange dominant colors, raw emotional cinematic mood, dramatic moody lighting, fall season aesthetic, professional photography, 3:4 vertical portrait composition, photorealistic, ultra high detail, 2K quality. Always include the title "${eraDisplayName}" in bold dramatic typography. Do not include the words "GenZ Hook".`,
    
    'reputation': `Bold confident figure in dark urban nightscape, city lights bokeh background, wearing edgy black leather jacket, striking powerful pose, metallic silver accent lighting, atmospheric fog or mist, empowered defiant energy, sleek modern metropolitan aesthetic, dark and moody color grading, professional photography, 3:4 vertical portrait composition, photorealistic, ultra high detail, 2K quality. Always include the title "${eraDisplayName}" in bold geometric typography. Do not include the words "GenZ Hook".`,
    
    'lover': `Joyful person in soft rainbow light, subtle pride celebration atmosphere, butterflies gently floating around, pastel pink and sky blue color palette, sunny community garden setting with flowers, warm golden sunlight, inclusive loving energy, heartfelt genuine smile, cheerful optimistic mood, professional photography, 3:4 vertical portrait composition, photorealistic, ultra high detail, 2K quality. Always include the title "${eraDisplayName}" in whimsical script typography. Do not include the words "GenZ Hook".`,
    
    'midnights': `Midnight bedroom scene with lavender haze effect, soft moonlight streaming through window, introspective person sitting or lying down, late night contemplative aesthetic, deep purple and indigo color tones, stars visible in night sky outside, vulnerable thoughtful mood, dreamy soft focus atmosphere, cozy intimate setting, professional photography, 3:4 vertical portrait composition, photorealistic, ultra high detail, 2K quality. Always include the title "${eraDisplayName}" in elegant serif typography. Do not include the words "GenZ Hook".`
  };

  return prompts[eraName.toLowerCase()] || 
    `${description}, atmospheric emotional scene, cinematic portrait, soft dramatic lighting, 3:4 vertical composition, photorealistic, ultra high detail, 2K quality. Always include the title "${eraDisplayName}" in elegant typography. Do not include the words "GenZ Hook".`;
}

/**
 * Create image prompt for story prompt card
 * Includes Title and Swiftie Signal in the image, excludes GenZ Hook
 */
export function createStoryPromptImagePrompt(
  title: string,
  vibeCheck: string,
  swiftieSignal: string,
  eraName: string
): string {
  // Extract only visual/atmospheric descriptive elements
  const visualElements = vibeCheck
    .split(',')
    .slice(0, 3)
    .map(el => el.trim())
    .filter(el => el.length > 0)
    .join(', ');
  
  return `${visualElements}, ${eraName} era atmosphere, emotional cinematic scene, professional photography, 3:4 vertical portrait, photorealistic artistic style, ultra high detail, 2K quality, soft dramatic lighting. Always include the title "${title}" and the phrase "${swiftieSignal}" in elegant typography integrated into the scene. Do not include the words "GenZ Hook".`;
}