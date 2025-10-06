# ERA-Based Story Generation Workflow

## Overview

FlipMyEra now features an enhanced story generation workflow based on Taylor Swift's iconic eras. This multi-step wizard guides users through creating deeply personalized, era-specific narratives.

## User Journey

### 1. Hero Section with ERA Gallery
- Animated photo gallery showcasing all 7 eras
- "Choose Your Era" CTA that scrolls to wizard
- Engaging visual introduction to the platform

### 2. ERA Selection (Bento Grid)
- Interactive Bento grid with 7 ERA cards
- Each card features:
  - ERA-specific representative image
  - Era name and description
  - Color-coded gradient overlays
  - Hover animations with sparkle effects
- User clicks to select their preferred ERA

### 3. Story Prompt Selection
- Grid animates to show ERA-specific story prompts
- 5 curated prompts per ERA from Visual Prompts Collection:
  - Vertical 3:4 portrait images
  - Vibe Check, GenZ Hook, and Swiftie Signal
  - Hover reveals additional context
- "Create Your Own" option for custom prompts
- Back button to return to ERA selection

### 4. Character Archetype Selection
- Dynamic character archetypes based on selected ERA
- Examples:
  - **Showgirl**: The Performer, The Rescued Heart, The Rising Star, etc.
  - **Folklore**: The Dreamer, The Wise Friend, The Creative, etc.
  - **Red**: The Deep Feeler, The Heartbreak Survivor, The Artist, etc.
- Card-based selection with character traits
- Selection highlighted with checkmark

### 5. Story Details Form
- Character name input
- Gender presentation selector (Keep Same, Flip, Neutral)
- Story location input
- Custom prompt textarea (if "Create Your Own" was selected)
- Selected archetype displayed prominently
- "Generate Storyline" button

### 6. Storyline Generation
- Uses Master System Prompt + ERA-specific prompt
- Groq AI generates structured storyline:
  - Logline following professional formula
  - Three-act structure breakdown
  - Chapter outline with summaries
  - Theme identification
  - Word count estimates
- Powered by `llama-3.3-70b-versatile` model

### 7. Storyline Preview
- Beautiful display of generated storyline:
  - Hero section with logline
  - Visual three-act structure (color-coded)
  - Chapter cards with summaries and word counts
  - Theme badges
- Actions:
  - Regenerate storyline
  - Edit details (back to form)
  - Continue to format selection

### 8. Story Format Selection
- Three options with full details:
  - **Preview**: 1 chapter, 500-1,000 words, 1 credit
  - **Short Story**: 3-6 chapters, 1,500-5,000 words, 3 credits
  - **Novella**: 8-12 chapters, 10,000-25,000 words, 5 credits
- Each card shows:
  - Icon and name
  - Chapter count and word count
  - Estimated generation time
  - Credit cost
  - Included features
  - Recommended badge (Short Story)

### 9. Story Generation (EbookGenerator)
- Streaming chapter generation using storyline context
- Each chapter follows the structured outline
- Real-time progress updates
- Maintains existing ebook functionality
- Image generation for chapters
- Download and sharing options

## Technical Architecture

### Data Structures

#### ERA Configuration (`src/modules/story/types/eras.ts`)
- 7 ERA types defined
- Each ERA has:
  - Display name, description
  - Color scheme (primary, secondary, gradient)
  - Character archetypes array
  - Image URL and prompt path
  - Grid span for Bento layout

#### Story Prompts (`src/modules/story/data/storyPrompts.ts`)
- 35 total story prompts (5 per ERA)
- Each prompt includes:
  - Title, description
  - Vibe Check, GenZ Hook, Swiftie Signal
  - Image URL (generated or placeholder)

### State Management

#### Wizard Context (`src/modules/story/contexts/StoryWizardContext.tsx`)
- Centralized state management
- Persisted to sessionStorage
- Tracks:
  - Current wizard step
  - Selected ERA, prompt, archetype
  - Character details
  - Generated storyline
  - Selected format

### Prompt Loading System

#### Prompt Loader (`src/modules/story/utils/promptLoader.ts`)
- Loads Master System Prompt from markdown
- Loads ERA-specific prompts from markdown
- Combines prompts for AI generation
- Caches prompts in memory

### Storyline Generation

#### Service (`src/modules/story/services/storylineGeneration.ts`)
- Uses Groq API with combined system prompt
- Generates structured JSON response:
  - Logline
  - Three-act structure
  - Chapter outline
  - Themes
  - Word counts
- Error handling for API failures

### Image Generation

#### Runway API (`src/modules/shared/services/runwayApi.ts`)
- Integrates Runway's Seedream 4 model
- Generates 3:4 vertical portraits
- Batch generation support
- Fallback to placeholders if API unavailable

#### Generation Script (`scripts/generate-era-images.ts`)
- Pre-generates all ERA images
- Pre-generates all story prompt images
- Saves URLs to JSON file
- Run with: `bun run generate:images`

## Environment Variables

Add to `.env.development`:

```bash
# Runway AI (Optional - will use placeholders if not provided)
VITE_RUNWAY_API_KEY=your_runway_api_key
VITE_RUNWAY_API_URL=https://api.runwayml.com/v1
```

## File Structure

```
src/modules/story/
├── components/
│   ├── EraSelector.tsx              # Bento grid ERA selection
│   ├── StoryPromptsSelector.tsx     # Story prompt cards
│   ├── CharacterSelector.tsx        # Character archetype selection
│   ├── StoryDetailsForm.tsx         # Character details form
│   ├── StorylinePreview.tsx         # Storyline review
│   ├── StoryFormatSelector.tsx      # Format selection cards
│   ├── StoryWizard.tsx              # Main wizard orchestrator
│   └── index.ts                     # Barrel exports
├── contexts/
│   └── StoryWizardContext.tsx       # Wizard state management
├── data/
│   ├── storyPrompts.ts              # All story prompts
│   └── generatedImages.json         # Generated image URLs
├── services/
│   └── storylineGeneration.ts       # Groq storyline generation
├── types/
│   └── eras.ts                      # ERA types and configs
└── utils/
    └── promptLoader.ts              # Markdown prompt loader

src/modules/shared/
├── components/
│   └── HeroGallery.tsx              # Landing page hero
└── services/
    └── runwayApi.ts                 # Runway AI integration

Prompts/
├── FlipMyEra Master System Prompt.md
├── showgirl_era_prompt.md
├── folklore_evermore_era_prompt.md
├── 1989_era_prompt.md
├── red_era_prompt.md
├── reputation_era_prompt.md
├── lover_era_prompt.md
└── midnights_era_prompt.md
```

## Development

### Running Locally

```bash
# Start dev server
bun run dev

# Generate ERA and prompt images (optional)
bun run generate:images

# Run tests
bun run test
```

### Adding New ERAs

1. Add ERA type to `eras.ts`
2. Create character archetypes
3. Add ERA config with colors and metadata
4. Create markdown prompt file in `/Prompts`
5. Add prompts to `storyPrompts.ts`
6. Update `promptLoader.ts` import
7. Generate images with script

## Key Features

### Master System Prompt Integration
- Professional story structure guidance
- Three-act framework
- KDP optimization built-in
- ERA-specific transformation rules
- Character development guidelines

### Streaming Generation
- Real-time chapter creation
- Progress indicators
- Abort/pause capabilities
- Storyline context for coherent narrative

### State Persistence
- Wizard progress saved to sessionStorage
- Resume after page refresh
- Clear state on completion

### Responsive Design
- Mobile-first approach
- Bento grid adapts to screen size
- Touch-friendly interactions
- Accessible navigation

## User Benefits

1. **Guided Creative Process**: Step-by-step wizard removes blank page paralysis
2. **ERA-Specific Stories**: Deep alignment with Taylor Swift's storytelling traditions
3. **Professional Structure**: Stories follow proven narrative frameworks
4. **Visual Engagement**: Beautiful images enhance immersion
5. **Flexibility**: Choose from prompts or create custom stories
6. **Quality Control**: Review storyline before committing to full generation

## Future Enhancements

- [ ] Real Runway AI image generation (currently placeholders)
- [ ] Additional eras (Fearless, Speak Now, etc.)
- [ ] Collaborative stories with multiple users
- [ ] ERA mixing for hybrid stories
- [ ] Export storyline as PDF outline
- [ ] Save and revisit draft storylines
