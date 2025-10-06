/**
 * Script to generate Hero Gallery, ERA, and Story Prompt images using RUNWARE Seedream 4
 * Generates 5 variations per prompt, analyzes them, and selects the best
 * Run with: bun run scripts/generate-era-images.ts
 */

import { getAllEras } from '../src/modules/story/types/eras';
import { ALL_STORY_PROMPTS } from '../src/modules/story/data/storyPrompts';
import { 
  batchGenerateImagesWithVariations,
  createEraImagePrompt, 
  createStoryPromptImagePrompt,
  type ImageGenerationResult
} from '../src/modules/shared/services/runwayApi';
import * as fs from 'fs';
import * as path from 'path';

// Hero Gallery image prompts (for the animated photo gallery on landing page - all 7 ERAs)
const HERO_GALLERY_PROMPTS = [
  {
    id: 'hero-1',
    title: 'Showgirl Era',
    prompt: 'Glamorous showgirl in sparkling costume on vintage theater stage, warm spotlight, Art Deco elegance, 3:4 vertical portrait, photorealistic. Always include the title "Showgirl Era" in elegant typography. Do not include the words "GenZ Hook".'
  },
  {
    id: 'hero-2',
    title: 'Folklore Era',
    prompt: 'Person in cozy cardigan sitting by misty forest creek, autumn leaves, golden hour, cottagecore aesthetic, 3:4 vertical portrait, photorealistic. Always include the title "Folklore Era" in handwritten calligraphy. Do not include the words "GenZ Hook".'
  },
  {
    id: 'hero-3',
    title: '1989 Era',
    prompt: 'Confident figure on NYC rooftop at sunrise, city skyline, polaroid camera, modern fashion, 3:4 vertical portrait, photorealistic. Always include the title "1989 Era" in modern sans-serif typography. Do not include the words "GenZ Hook".'
  },
  {
    id: 'hero-4',
    title: 'Red Era',
    prompt: 'Emotional portrait surrounded by falling autumn leaves, rain-soaked street, burgundy tones, intense mood, 3:4 vertical portrait, photorealistic. Always include the title "Red Era" in bold dramatic typography. Do not include the words "GenZ Hook".'
  },
  {
    id: 'hero-5',
    title: 'Reputation Era',
    prompt: 'Bold confident figure in dark urban night, city lights, leather jacket, metallic accents, empowered pose, 3:4 vertical portrait, photorealistic. Always include the title "Reputation Era" in bold geometric typography. Do not include the words "GenZ Hook".'
  },
  {
    id: 'hero-6',
    title: 'Lover Era',
    prompt: 'Joyful figure in soft rainbow light, butterflies, community garden, pastel pink and blue tones, 3:4 vertical portrait, photorealistic. Always include the title "Lover Era" in whimsical script typography. Do not include the words "GenZ Hook".'
  },
  {
    id: 'hero-7',
    title: 'Midnights Era',
    prompt: 'Introspective figure in bedroom with lavender haze, moonlight through window, stars, midnight blue tones, 3:4 vertical portrait, photorealistic. Always include the title "Midnights Era" in elegant serif typography. Do not include the words "GenZ Hook".'
  }
];

async function generateAllImages() {
  console.log('🎨 Starting image generation with RUNWARE Seedream 4...\n');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('Model: Seedream 4 (bytedance:5@0)');
  console.log('Resolution: 2K (1536×2048 for 3:4 aspect ratio)');
  console.log('Variations: 5 per prompt');
  console.log('Format: WEBP');
  console.log('Text Instructions: Include Title & Swiftie Signal, exclude GenZ Hook');
  console.log('═══════════════════════════════════════════════════════════\n');

  const allResults: {
    heroGallery: ImageGenerationResult[];
    eras: ImageGenerationResult[];
    prompts: ImageGenerationResult[];
  } = {
    heroGallery: [],
    eras: [],
    prompts: []
  };

  // 1. Generate Hero Gallery images
  console.log('📸 PHASE 1: Generating Hero Gallery Images\n');
  console.log(`Total Hero images to process: ${HERO_GALLERY_PROMPTS.length}`);
  console.log('Each will generate 5 variations (35 total images)\n');
  
  allResults.heroGallery = await batchGenerateImagesWithVariations(HERO_GALLERY_PROMPTS);
  
  console.log('\n✅ Hero Gallery Images Complete!');
  console.log(`   Generated: ${allResults.heroGallery.length} prompts × 5 variations = ${allResults.heroGallery.length * 5} images`);
  console.log(`   Best images selected: ${allResults.heroGallery.length}`);

  // 2. Generate ERA representative images
  console.log('\n\n📸 PHASE 2: Generating ERA Selector Images\n');
  console.log(`Total ERAs to process: ${getAllEras().length}`);
  console.log('Each ERA will generate 5 variations (35 total images)\n');
  
  const eras = getAllEras();
  const eraPrompts = eras.map(era => ({
    id: era.id,
    prompt: createEraImagePrompt(era.name, era.displayName, era.description),
    title: era.displayName,
    aspectRatio: '3:4' as const
  }));

  allResults.eras = await batchGenerateImagesWithVariations(eraPrompts);
  
  console.log('\n✅ ERA Images Complete!');
  console.log(`   Generated: ${allResults.eras.length} prompts × 5 variations = ${allResults.eras.length * 5} images`);
  console.log(`   Best images selected: ${allResults.eras.length}`);

  // 3. Generate Story Prompt images
  console.log('\n\n📸 PHASE 3: Generating Story Prompt Images\n');
  console.log(`Total Story Prompts to process: ${ALL_STORY_PROMPTS.length}`);
  console.log('Each prompt will generate 5 variations (175 total images)\n');
  
  const promptBatches = [];
  for (let i = 0; i < ALL_STORY_PROMPTS.length; i += 5) {
    const batch = ALL_STORY_PROMPTS.slice(i, i + 5);
    console.log(`\n--- Processing Batch ${Math.floor(i / 5) + 1} (${batch.length} prompts) ---`);
    
    const batchPrompts = batch.map(prompt => ({
      id: prompt.id,
      prompt: createStoryPromptImagePrompt(
        prompt.title,
        prompt.vibeCheck,
        prompt.swiftieSignal,
        prompt.eraType
      ),
      title: prompt.title,
      vibeCheck: prompt.vibeCheck,
      swiftieSignal: prompt.swiftieSignal,
      eraType: prompt.eraType,
      aspectRatio: '3:4' as const
    }));

    const batchResults = await batchGenerateImagesWithVariations(batchPrompts);
    allResults.prompts.push(...batchResults);
    promptBatches.push(batchResults);
    
    console.log(`✅ Batch complete: ${batchResults.length} prompts processed`);
  }

  console.log('\n✅ All Story Prompt Images Complete!');
  console.log(`   Generated: ${allResults.prompts.length} prompts × 5 variations = ${allResults.prompts.length * 5} images`);
  console.log(`   Best images selected: ${allResults.prompts.length}`);

  // 4. Save full results with all variations
  const fullResultsPath = path.join(__dirname, '../src/modules/story/data/generatedImagesWithVariations.json');
  const fullData = {
    heroGallery: allResults.heroGallery,
    eras: allResults.eras,
    prompts: allResults.prompts,
    generated_at: new Date().toISOString(),
    model: 'RUNWARE Seedream 4 (bytedance:5@0)',
    aspect_ratio: '3:4',
    resolution: '2K (1536×2048)',
    variations_per_prompt: 5,
    total_images: (allResults.heroGallery.length + allResults.eras.length + allResults.prompts.length) * 5,
    instructions: 'Title and Swiftie Signal included, GenZ Hook excluded'
  };

  fs.writeFileSync(fullResultsPath, JSON.stringify(fullData, null, 2));
  console.log(`\n💾 Saved full results to: ${fullResultsPath}`);

  // 5. Save best images only (for use in wizard and hero gallery)
  const bestImagesPath = path.join(__dirname, '../src/modules/story/data/generatedImages.json');
  const bestData = {
    heroGallery: Object.fromEntries(
      allResults.heroGallery.map(r => [r.id, r.bestImage.url])
    ),
    eras: Object.fromEntries(
      allResults.eras.map(r => [r.id, r.bestImage.url])
    ),
    prompts: Object.fromEntries(
      allResults.prompts.map(r => [r.id, r.bestImage.url])
    ),
    generated_at: new Date().toISOString(),
    model: 'RUNWARE Seedream 4 (bytedance:5@0)',
    aspect_ratio: '3:4',
    resolution: '2K (1536×2048)',
    selection: 'AI-selected best from 5 variations'
  };

  fs.writeFileSync(bestImagesPath, JSON.stringify(bestData, null, 2));
  console.log(`💾 Saved best images to: ${bestImagesPath}`);

  // 6. Summary
  console.log('\n\n═══════════════════════════════════════════════════════════');
  console.log('🎉 IMAGE GENERATION COMPLETE!');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`\n📊 STATISTICS:`);
  console.log(`   Hero Gallery:        ${allResults.heroGallery.length} prompts × 5 = ${allResults.heroGallery.length * 5} images`);
  console.log(`   ERA Images:          ${allResults.eras.length} prompts × 5 = ${allResults.eras.length * 5} images`);
  console.log(`   Story Prompts:       ${allResults.prompts.length} prompts × 5 = ${allResults.prompts.length * 5} images`);
  console.log(`   Total Generated:     ${(allResults.heroGallery.length + allResults.eras.length + allResults.prompts.length) * 5} images`);
  console.log(`   Best Selected:       ${allResults.heroGallery.length + allResults.eras.length + allResults.prompts.length} images`);
  
  console.log(`\n📁 OUTPUT FILES:`);
  console.log(`   Full Results:        generatedImagesWithVariations.json`);
  console.log(`   Best Images Only:    generatedImages.json (used by wizard & hero)`);
  
  console.log(`\n🎯 SPECIFICATIONS:`);
  console.log(`   Model:               Seedream 4 (bytedance:5@0)`);
  console.log(`   Resolution:          2K (1536×2048 pixels)`);
  console.log(`   Aspect Ratio:        3:4 (vertical portrait)`);
  console.log(`   Format:              WEBP`);
  console.log(`   Text Handling:       Title & Swiftie Signal included, GenZ Hook excluded`);
  
  console.log('\n✨ Next step: Visit /image-review to review all variations and selections');
  console.log('═══════════════════════════════════════════════════════════\n');
}

// Run the script
generateAllImages().catch((error) => {
  console.error('\n❌ ERROR DURING GENERATION:', error);
  console.error('Stack:', error.stack);
  process.exit(1);
});