# RUNWARE Seedream 4 Integration for ERA Images

## Overview

The ERA-based story generation system now uses **RUNWARE's Seedream 4 model** (AIR ID: `bytedance:5@0`) to generate all ERA and story prompt images with strict text exclusion.

## Key Features

### ✅ Seedream 4 Model Integration
- **Model ID**: `bytedance:5@0`
- **Aspect Ratio**: 3:4 (vertical portrait) - 768x1024 pixels
- **Output Format**: WEBP for optimal quality and size
- **Steps**: 20 (optimized for Seedream 4)
- **Quality**: Photorealistic, high detail

### ✅ Text Exclusion via Negative Prompts

**Comprehensive Negative Prompt:**
```
text, words, letters, typography, captions, subtitles, gen z hook, swiftie signal,
vibe check, labels, watermarks, signatures, writing, script, font, quotes,
speech bubbles, text overlay, Gen Z, GenZ, hooks, signals, banners, signs,
slogans, headlines, messages
```

This ensures:
- NO "Gen Z Hook" text appears in images
- NO "Swiftie Signal" text rendered
- NO "Vibe Check" text displayed
- NO text overlays of any kind
- Pure visual/atmospheric imagery only

## Implementation Details

### File Updates

#### 1. Added Seedream 4 to RUNWARE Models
**File**: `src/modules/shared/utils/runware.ts`
```typescript
export const RUNWARE_MODELS = {
  // ... other models
  SEEDREAM_4: "bytedance:5@0", // Seedream 4 - Advanced image generation
} as const;
```

#### 2. New RunwareService Methods
**File**: `src/modules/shared/utils/runware.ts`

**Method**: `generateEraImage()`
- Generates ERA representative images
- Uses Seedream 4 model
- 3:4 aspect ratio
- Includes comprehensive negative prompt
- Returns WEBP format URL

**Method**: `generateStoryPromptImage()`
- Generates story prompt card images
- Extracts only visual elements from Vibe Check
- Excludes GenZ Hook and Swiftie Signal from prompt
- Uses Seedream 4 model
- 3:4 aspect ratio
- Includes comprehensive negative prompt

#### 3. Updated Image Generation Service
**File**: `src/modules/shared/services/runwayApi.ts`

Now uses RUNWARE service methods instead of external Runway API:
- `generateRunwareImage()` - Wrapper for single image generation
- `batchGenerateImages()` - Sequential batch processing
- `createEraImagePrompt()` - Detailed visual prompts per ERA
- `createStoryPromptImagePrompt()` - Visual-only story prompts

#### 4. Updated Generation Script
**File**: `scripts/generate-era-images.ts`

- Uses RUNWARE Seedream 4 for all images
- 2-second delay between requests (rate limiting)
- Saves results to `generatedImages.json`
- Includes metadata about model and settings

## Image Generation Process

### ERA Images (7 total)

Each ERA gets a carefully crafted visual prompt:

1. **Showgirl**: Art Deco theater, orange/mint lighting, crystals, bathtub, glamour
2. **Folklore**: Misty forest, vintage cardigan, autumn leaves, cabin, golden hour
3. **1989**: NYC rooftop, sunrise, polaroid camera, skyline, urban confidence
4. **Red**: Autumn leaves, rain, record store, burgundy/orange, emotional intensity
5. **Reputation**: Dark city night, leather jacket, metallic accents, empowerment
6. **Lover**: Rainbow light, butterflies, garden, pastels, joyful inclusion
7. **Midnights**: Bedroom moonlight, lavender haze, stars, vulnerable introspection

### Story Prompt Images (35 total)

Each prompt image is generated from:
- **Visual Elements Only**: First 3 comma-separated items from Vibe Check
- **ERA Aesthetic**: Era-specific atmosphere and mood
- **NO Text**: GenZ Hook and Swiftie Signal excluded from prompt
- **Negative Prompt**: Prevents any text from rendering

**Example**:
- **Prompt Title**: "The Bathtub Confession"
- **Vibe Check**: "Portofino orange glitter, crystal tears, vulnerability behind the glamour"
- **Image Prompt**: "Portofino orange glitter, crystal tears, vulnerability behind the glamour, showgirl era atmosphere, emotional cinematic scene..."
- **Excluded**: "That feeling when your public win hides your private breakdown" (GenZ Hook)
- **Excluded**: "Behind every curtain's a version of you they'll never see" (Swiftie Signal)

## Configuration

### Environment Variable
Already configured in `.env.development`:
```bash
VITE_RUNWARE_API_KEY=oITNjtsg27Tt9AJp33j3vaRhGw1G738o
```

### Model Selection
Hardcoded to use **only Seedream 4**:
```typescript
model: RUNWARE_MODELS.SEEDREAM_4  // "bytedance:5@0"
```

## Usage

### Generate All Images

Run the batch generation script:
```bash
bun run generate:images
```

This will:
1. Connect to RUNWARE WebSocket
2. Authenticate with API key
3. Generate 7 ERA images (Seedream 4, 3:4, no text)
4. Generate 35 story prompt images (Seedream 4, 3:4, no text)
5. Save URLs to `generatedImages.json`

### Manual Generation

Use in code:
```typescript
import { runwareService } from '@/modules/shared/utils/runware';
import { RUNWARE_MODELS } from '@/modules/shared/utils/runware';

// Generate ERA image
const eraImage = await runwareService.generateEraImage({
  eraName: 'showgirl',
  description: 'Glamorous Art Deco theater with orange lighting...',
  aspectRatio: '3:4'
});

// Generate story prompt image
const promptImage = await runwareService.generateStoryPromptImage({
  title: 'The Bathtub Confession',
  vibeCheck: 'Portofino orange glitter, crystal tears, vulnerability',
  eraType: 'showgirl',
  aspectRatio: '3:4'
});
```

## Technical Specifications

### Image Dimensions
- **3:4 Portrait**: 768 x 1024 pixels (default)
- **16:9 Landscape**: 1024 x 576 pixels
- **1:1 Square**: 1024 x 1024 pixels
- **4:3 Landscape**: 1024 x 768 pixels

### Generation Parameters
- **Model**: Seedream 4 (bytedance:5@0)
- **Steps**: 20
- **Output Format**: WEBP
- **Output Type**: URL
- **NSFW Check**: Enabled
- **Cost Tracking**: Disabled

### Negative Prompt Strategy
The negative prompt is **automatically applied** to all ERA and story prompt images to ensure:
- Pure visual storytelling
- No text distractions
- No accidental typography
- Focus on atmospheric mood
- Professional book-quality imagery

## Quality Assurance

### What's Included in Images:
✅ Atmospheric visual scenes
✅ ERA-specific color palettes
✅ Emotional mood and lighting
✅ Character figures (when appropriate)
✅ Setting and environment details
✅ Cinematic composition

### What's Excluded from Images:
❌ All text and typography
❌ "Gen Z Hook" phrases
❌ "Swiftie Signal" quotes
❌ "Vibe Check" labels
❌ Any written words
❌ Watermarks or captions
❌ Speech bubbles
❌ Text overlays

## Troubleshooting

### If Images Show Text:
1. Check negative prompt is being applied
2. Verify Seedream 4 model is being used
3. Increase negative prompt weight (if available)
4. Regenerate specific image

### If Generation Fails:
1. Check RUNWARE API key is valid
2. Verify WebSocket connection
3. Check rate limits
4. Review console logs for errors
5. Falls back to placeholders automatically

### If Placeholders Display:
- RUNWARE API key not configured
- API connection failed
- Rate limit exceeded
- Model unavailable

## Monitoring

Check console for:
```
✅ "Generating image for: [id]"
✅ "Successfully generated image for: [id]"
✅ "RUNWARE authentication successful"
❌ "Error generating image with RUNWARE Seedream 4"
❌ "RUNWARE not configured"
```

## Cost Optimization

- **Sequential Generation**: Prevents API overload
- **2-second Delays**: Respects rate limits
- **Error Recovery**: Continues on failure
- **Placeholder Fallback**: No re-attempts on failure
- **Batch Script**: One-time generation, not on every page load

## Next Steps

1. **Run Image Generation**:
   ```bash
   bun run generate:images
   ```

2. **Verify Output**:
   - Check `src/modules/story/data/generatedImages.json`
   - Confirm all 42 image URLs present
   - Verify no placeholder URLs (if API worked)

3. **Visual QA**:
   - Open each generated image
   - Confirm NO text appears
   - Verify 3:4 aspect ratio
   - Check ERA-appropriate aesthetic

4. **Update Frontend** (if needed):
   - Images automatically load from JSON
   - No code changes required
   - Wizard uses URLs immediately

---

**Status**: ✅ Integrated and Ready
**Model**: Seedream 4 (bytedance:5@0)  
**Text Exclusion**: ✅ Comprehensive negative prompts
**Aspect Ratio**: 3:4 vertical portrait  
**Quality**: Photorealistic, high detail
