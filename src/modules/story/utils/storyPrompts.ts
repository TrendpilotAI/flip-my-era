import { GenderInfo, getFlippedGender } from '@/modules/user/utils/genderUtils';
import { starSignCharacteristics } from '@/modules/user/utils/starSigns';
import { personalityTypes } from '@/modules/story/types/personality';

// Taylor Swift-themed story types and formats
export type TaylorSwiftTheme = 'coming-of-age' | 'first-love' | 'heartbreak' | 'friendship';
export type StoryFormat = 'short-story' | 'novella';

export interface StoryFormatConfig {
  name: string;
  description: string;
  minWords: number;
  maxWords: number;
  chapters: number;
  targetLength: string;
}

export const storyFormats: Record<StoryFormat, StoryFormatConfig> = {
  'short-story': {
    name: 'YA Short Story',
    description: 'A compelling short story perfect for young adults',
    minWords: 1000,
    maxWords: 7500,
    chapters: 3,
    targetLength: 'approximately 1,000-7,500 words'
  },
  'novella': {
    name: 'YA Novella',
    description: 'An extended narrative with rich character development',
    minWords: 10000,
    maxWords: 25000,
    chapters: 8,
    targetLength: 'approximately 10,000-25,000 words'
  }
};

export const taylorSwiftThemes = {
  'coming-of-age': {
    title: 'Coming of Age',
    description: 'Stories about growing up, self-discovery, and finding your voice',
    keywords: ['growth', 'identity', 'independence', 'self-discovery', 'transformation'],
    inspirations: ['Fifteen', 'The Best Day', 'Never Grow Up', 'Seven', 'Innocent']
  },
  'first-love': {
    title: 'First Love',
    description: 'Sweet, innocent romance and the magic of first connections',
    keywords: ['love', 'romance', 'butterflies', 'dreams', 'fairy tale'],
    inspirations: ['Love Story', 'You Belong With Me', 'Enchanted', 'Begin Again', 'Lavender Haze']
  },
  'heartbreak': {
    title: 'Heartbreak',
    description: 'Stories of loss, healing, and finding strength after disappointment',
    keywords: ['loss', 'healing', 'strength', 'resilience', 'moving on'],
    inspirations: ['All Too Well', 'Ronan', 'Soon You\'ll Get Better', 'Death By A Thousand Cuts', 'Right Where You Left Me']
  },
  'friendship': {
    title: 'Friendship',
    description: 'Celebrating the bonds that shape us and stand the test of time',
    keywords: ['loyalty', 'support', 'adventure', 'shared memories', 'trust'],
    inspirations: ['22', 'The Best Day', 'Long Live', 'Daylight', 'Paper Rings']
  }
};

export const getRandomViralTropes = (): string[] => {
  const tropes = [
    "a breathtaking moment of serendipity",
    "an unforgettable twist of fate",
    "a chance encounter that changes everything",
    "a magical revelation under starlight",
    "an extraordinary coincidence that sparks wonder",
    "a beautiful misunderstanding that leads to love",
    "a moment of clarity amidst chaos",
    "a destined meeting in an unexpected place",
    "a life-changing decision made in a heartbeat",
    "a perfect alignment of cosmic events"
  ];
  const selected = new Set<string>();
  while (selected.size < 2) {
    selected.add(tropes[Math.floor(Math.random() * tropes.length)]);
  }
  return Array.from(selected);
};

export const getTaylorSwiftInspiredTropes = (theme: TaylorSwiftTheme): string[] => {
  const themeTropes = {
    'coming-of-age': [
      "a moment of sudden self-realization in a familiar place",
      "discovering inner strength through an unexpected challenge",
      "finding your voice when it matters most",
      "a conversation that changes how you see yourself",
      "taking the first step toward independence",
      "realizing you're not the same person you were yesterday"
    ],
    'first-love': [
      "a chance meeting that feels like destiny",
      "the moment when friendship transforms into something deeper",
      "a shared laugh that creates an unbreakable connection",
      "finding courage to express hidden feelings",
      "a dance that feels like floating on air",
      "discovering that love stories can be real"
    ],
    'heartbreak': [
      "learning to breathe again after loss",
      "finding pieces of yourself you thought were gone forever",
      "a memory that both hurts and heals",
      "discovering that endings can be beginnings",
      "the moment you realize you're stronger than you knew",
      "finding light in the darkest of chapters"
    ],
    'friendship': [
      "a friend who believes in you when you can't believe in yourself",
      "shared secrets that bond hearts forever",
      "standing together against the world",
      "adventures that become treasured memories",
      "the comfort of unconditional acceptance",
      "promises that transcend time and distance"
    ]
  };
  
  const tropes = themeTropes[theme];
  const selected = new Set<string>();
  while (selected.size < 2) {
    selected.add(tropes[Math.floor(Math.random() * tropes.length)]);
  }
  return Array.from(selected);
};

export const getRandomSceneSettings = () => {
  const settings = [
    "a hidden garden blooming with fairy lights and midnight flowers",
    "a cozy bookstore café where time seems to stand still",
    "a rooftop overlooking a city painted in sunset hues",
    "a secret beach where the waves whisper ancient stories",
    "an enchanted forest path lined with glowing butterflies",
    "a vintage jazz club frozen in a golden era",
    "a charming street corner where magic feels possible",
    "a moonlit balcony overlooking a sleeping city",
    "a hidden courtyard filled with fairy lights and memories",
    "a mystical art gallery where paintings come alive"
  ];
  return settings[Math.floor(Math.random() * settings.length)];
};

export const getTaylorSwiftInspiredSceneSettings = (theme: TaylorSwiftTheme): string => {
  const themeSettings = {
    'coming-of-age': [
      "a small-town coffee shop where dreams are whispered over steaming cups",
      "a high school hallway that holds a thousand untold stories",
      "a childhood bedroom being packed up for the last time",
      "a graduation ceremony under a sky full of possibilities",
      "a quiet library corner where self-discovery begins",
      "a familiar park bench where everything suddenly makes sense"
    ],
    'first-love': [
      "a school dance where time stops with one look",
      "a summer carnival illuminated by twinkling lights and laughter",
      "a quiet corner of a bookstore where hearts skip beats",
      "a starlit field perfect for making wishes come true",
      "a cozy café where every word feels like poetry",
      "a tree-lined path where hand-holding feels like flying"
    ],
    'heartbreak': [
      "an empty room where memories echo in the silence",
      "a rain-soaked window that mirrors falling tears",
      "a bridge where letters are released to the wind",
      "an old oak tree that has witnessed both joy and sorrow",
      "a quiet beach where waves wash away yesterday's pain",
      "a favorite song playing in an empty car"
    ],
    'friendship': [
      "a treehouse where secrets are safe and dreams are shared",
      "a sleepover fort built from blankets and whispered promises",
      "a school cafeteria table where laughter conquers loneliness",
      "a photo booth capturing moments that will last forever",
      "a hiking trail where adventures create unbreakable bonds",
      "a late-night diner where hearts are mended over milkshakes"
    ]
  };
  
  const settings = themeSettings[theme];
  return settings[Math.floor(Math.random() * settings.length)];
};

export const getGenderContext = (transformedName: string, detectedGender: GenderInfo, gender: "same" | "flip" | "neutral") => {
  const originalGender = detectedGender.gender;
  switch (gender) {
    case "flip":
      return `Write the story with the protagonist's name as ${transformedName} and gender as ${getFlippedGender(originalGender)}, incorporating this change naturally into the narrative. Use appropriate pronouns and gender-specific references throughout.`;
    case "neutral":
      return `Write the story with the protagonist's name as ${transformedName} using gender-neutral language and they/them pronouns throughout.`;
    default:
      return `Write the story with the protagonist's name as ${transformedName} and gender as ${originalGender}, using appropriate pronouns throughout.`;
  }
};

export const generateStoryPrompt = (
  transformedName: string,
  date: Date | undefined,
  detectedGender: GenderInfo,
  gender: "same" | "flip" | "neutral",
  starSign: string | null,
  selectedPersonality: typeof personalityTypes[keyof typeof personalityTypes],
  viralTropes: string[],
  sceneSettings: string,
  location: string
) => {
  const starSignTraits = starSign ? starSignCharacteristics[starSign].traits.join(", ") : "";
  const locationContext = location ? `Set in the enchanting backdrop of ${location}, where` : 'In a place where';
  
  return `Create an enchanting story with both a captivating title and narrative about ${transformedName}${date ? ` (born ${date.toLocaleDateString()})` : ''} in the style of an enchanting novel, with rich descriptions and flowing narrative. ${getGenderContext(transformedName, detectedGender, gender)}.

First, generate a creative, whimsical title that captures the essence of the story. Format it with a # at the beginning to denote it as the title.

${locationContext} ${sceneSettings}

Story Elements:
- Open with vivid, sensory descriptions that transport readers
- Use elegant, flowing prose that creates a dreamy atmosphere
- Include meaningful dialogue wrapped in descriptive narrative
- Paint pictures with words, focusing on emotions and atmosphere
- Create a story that feels like a cherished book passage

Character Elements:
- Personality: ${selectedPersonality.title} (${selectedPersonality.traits.join(", ")})
- Zodiac Influence: ${starSign ? `${starSign} - ${starSignTraits}` : 'Unknown'}
- Inner Voice: ${selectedPersonality.description}

Key Moments:
- Primary Scene: ${viralTropes[0]}
- Supporting Scene: ${viralTropes[1]}

Writing Style:
1. Use beautiful, descriptive prose with proper paragraph breaks for readability
2. Integrate dialogue naturally within paragraphs
3. Create vivid imagery through careful word choice
4. Build emotional resonance through detailed observations
5. Maintain a dreamy, enchanting tone
6. Include poetic descriptions of settings and feelings

Structure:
First Paragraph: Set the scene with rich detail and introduce ${transformedName} through elegant description and meaningful action.

Second Paragraph: Develop the story through a mix of internal thoughts, external dialogue, and atmospheric description. Focus on the emotional journey and the magic of the moment.

Final Paragraph: Bring the story to a satisfying close with poetic imagery and profound realization, ending with a beautiful observation or meaningful exchange that lingers in the reader's mind.

Format the response with:
1. Title at the top prefixed with #
2. Story text broken into clear, well-spaced paragraphs
3. Proper line breaks between paragraphs for readability`;
};

export const generateTaylorSwiftStoryPrompt = (
  transformedName: string,
  date: Date | undefined,
  detectedGender: GenderInfo,
  gender: "same" | "flip" | "neutral",
  starSign: string | null,
  selectedPersonality: typeof personalityTypes[keyof typeof personalityTypes],
  theme: TaylorSwiftTheme,
  format: StoryFormat,
  location: string
) => {
  const starSignTraits = starSign ? starSignCharacteristics[starSign].traits.join(", ") : "";
  const locationContext = location ? `Set in the enchanting backdrop of ${location}, where` : 'In a place where';
  const themeInfo = taylorSwiftThemes[theme];
  const formatInfo = storyFormats[format];
  const taylorSwiftTropes = getTaylorSwiftInspiredTropes(theme);
  const taylorSwiftScene = getTaylorSwiftInspiredSceneSettings(theme);
  
  return `Create a Taylor Swift-inspired ${formatInfo.name.toLowerCase()} with both a captivating title and narrative about ${transformedName}${date ? ` (born ${date.toLocaleDateString()})` : ''} in the style of a young adult ${themeInfo.title.toLowerCase()} story. ${getGenderContext(transformedName, detectedGender, gender)}.

STORY SPECIFICATIONS:
- Theme: ${themeInfo.title} - ${themeInfo.description}
- Format: ${formatInfo.name} (${formatInfo.targetLength})
- Target Chapters: ${formatInfo.chapters}
- Taylor Swift Inspiration: Songs like ${themeInfo.inspirations.join(', ')}

First, generate a creative, emotionally resonant title that captures the ${themeInfo.title.toLowerCase()} theme in Taylor Swift's storytelling style. Format it with a # at the beginning to denote it as the title.

SETTING: ${locationContext} ${taylorSwiftScene}

STORY ELEMENTS:
- Create age-appropriate content suitable for young adult readers (ages 13-18)
- Incorporate ${themeInfo.title.toLowerCase()} themes naturally throughout the narrative
- Use vivid, emotional storytelling reminiscent of Taylor Swift's lyrical style
- Include authentic dialogue and relatable teenage experiences
- Build emotional resonance through detailed character development
- Capture the essence of growing up and the intensity of young emotions

CHARACTER ELEMENTS:
- Personality: ${selectedPersonality.title} (${selectedPersonality.traits.join(", ")})
- Zodiac Influence: ${starSign ? `${starSign} - ${starSignTraits}` : 'Unknown'}
- Inner Voice: ${selectedPersonality.description}
- Theme Keywords: ${themeInfo.keywords.join(', ')}

KEY STORY MOMENTS:
- Primary Scene: ${taylorSwiftTropes[0]}
- Supporting Scene: ${taylorSwiftTropes[1]}

WRITING STYLE (Taylor Swift-Inspired):
1. Use emotional, descriptive prose that captures the intensity of young feelings
2. Include meaningful dialogue that reveals character growth
3. Create vivid imagery through careful word choice and metaphors
4. Build emotional resonance through relatable experiences
5. Maintain an authentic young adult voice
6. Include moments of self-reflection and personal growth
7. Use sensory details to create immersive scenes

STRUCTURE FOR ${formatInfo.name.toUpperCase()}:
${format === 'short-story' ?
  `Opening: Set the scene with rich detail and introduce ${transformedName} through meaningful action that establishes the ${themeInfo.title.toLowerCase()} theme.

Development: Build the central conflict or emotional journey through authentic dialogue, internal thoughts, and atmospheric description. Focus on the ${themeInfo.title.toLowerCase()} experience with emotional depth.

Climax: Create a pivotal moment that embodies the core ${themeInfo.title.toLowerCase()} theme, showing character growth and emotional truth.

Resolution: Bring the story to a satisfying close with emotional resonance and a meaningful realization that captures the essence of young adult growth.` :
  `Act I (Chapters 1-2): Establish ${transformedName} and their world, introducing the central ${themeInfo.title.toLowerCase()} conflict with rich character development.

Act II-A (Chapters 3-4): Develop relationships and deepen the ${themeInfo.title.toLowerCase()} theme through meaningful interactions and growing emotional stakes.

Act II-B (Chapters 5-6): Build toward the emotional climax with increasing tension, authentic dialogue, and deeper exploration of the theme.

Act III (Chapters 7-8): Resolve the central conflict with emotional truth, character growth, and a satisfying conclusion that honors the ${themeInfo.title.toLowerCase()} journey.`}

TARGET LENGTH: Write ${formatInfo.targetLength} with rich character development and emotional depth appropriate for the ${formatInfo.name.toLowerCase()} format.

Format the response with:
1. Title at the top prefixed with #
2. Story text broken into clear, well-spaced paragraphs
3. Proper line breaks between paragraphs for readability
4. Natural chapter breaks if writing a novella`;
};
