import { TaylorSwiftTheme } from './storyPrompts';

export type ImageMood = 'dreamy' | 'nostalgic' | 'romantic' | 'melancholic' | 'joyful' | 'empowering' | 'whimsical' | 'intimate';

export interface TaylorSwiftImageStyle {
  baseStyle: string;
  colorPalette: string;
  lighting: string;
  atmosphere: string;
  aestheticElements: string[];
}

export interface ThematicImageParams {
  theme: TaylorSwiftTheme;
  mood: ImageMood;
  chapterTitle: string;
  chapterContent: string;
  timeOfDay?: 'dawn' | 'morning' | 'afternoon' | 'golden-hour' | 'twilight' | 'night';
  season?: 'spring' | 'summer' | 'autumn' | 'winter';
  setting?: string;
}

// Taylor Swift aesthetic styles for each theme
export const taylorSwiftImageStyles: Record<TaylorSwiftTheme, TaylorSwiftImageStyle> = {
  'coming-of-age': {
    baseStyle: 'soft, painted illustration with gentle brushstrokes',
    colorPalette: 'warm golden hues, soft yellows, gentle oranges, cream whites, touch of lavender',
    lighting: 'natural, warm golden hour lighting with soft shadows',
    atmosphere: 'nostalgic, hopeful, slightly dreamy with a sense of transition',
    aestheticElements: [
      'vintage diary pages',
      'autumn leaves',
      'cozy sweaters',
      'handwritten notes',
      'polaroid photos',
      'fairy lights',
      'old books',
      'worn pathways'
    ]
  },
  'first-love': {
    baseStyle: 'dreamy watercolor illustration with soft, flowing lines',
    colorPalette: 'soft pastels, blush pinks, lavender purples, pearl whites, gold accents',
    lighting: 'ethereal, romantic lighting with gentle glows and soft highlights',
    atmosphere: 'magical, tender, butterfly-inducing with sparkles of wonder',
    aestheticElements: [
      'flower crowns',
      'flowing dresses',
      'butterfly imagery',
      'heart motifs',
      'sparkles and glitter',
      'romantic gardens',
      'moonlight',
      'love letters'
    ]
  },
  'heartbreak': {
    baseStyle: 'emotional oil painting with expressive, dramatic brushwork',
    colorPalette: 'deep blues, stormy grays, muted purples, silver moonlight, touches of burgundy',
    lighting: 'moody, dramatic lighting with strong contrasts and shadows',
    atmosphere: 'melancholic, cathartic, beautifully sad with hope on the horizon',
    aestheticElements: [
      'rain imagery',
      'tear drops',
      'wilted flowers',
      'dark forests',
      'stormy skies',
      'broken mirrors',
      'empty swings',
      'distant city lights'
    ]
  },
  'friendship': {
    baseStyle: 'vibrant, joyful illustration with bright, confident strokes',
    colorPalette: 'bright corals, sunny yellows, sky blues, emerald greens, pure whites',
    lighting: 'bright, cheerful lighting with warm sunshine and happy glows',
    atmosphere: 'celebratory, supportive, energetic with infectious joy',
    aestheticElements: [
      'friendship bracelets',
      'group hugs',
      'shared adventures',
      'colorful confetti',
      'matching outfits',
      'picnic blankets',
      'photo booths',
      'celebration imagery'
    ]
  }
};

// Mood-specific enhancements
export const moodEnhancements: Record<ImageMood, string> = {
  'dreamy': 'soft focus, ethereal glow, floating elements, pastel colors, dreamy atmosphere',
  'nostalgic': 'sepia tones, vintage filter, warm memories, golden hour lighting, wistful mood',
  'romantic': 'soft pastels, gentle lighting, heart imagery, flowing fabrics, tender expressions',
  'melancholic': 'muted colors, gentle sadness, rain or storms, contemplative poses, emotional depth',
  'joyful': 'bright colors, sunny lighting, smiling faces, celebratory elements, energetic composition',
  'empowering': 'strong poses, confident expressions, bold colors, dramatic lighting, inspiring imagery',
  'whimsical': 'playful elements, magical touches, bright colors, fantastical details, childlike wonder',
  'intimate': 'close-up details, warm lighting, personal moments, quiet settings, emotional connection'
};

// Time of day variations
export const timeOfDayStyles: Record<string, string> = {
  'dawn': 'soft pink and orange sky, gentle morning light, peaceful awakening, misty atmosphere',
  'morning': 'bright golden sunlight, fresh air feeling, dewdrops, optimistic lighting',
  'afternoon': 'clear bright light, vibrant colors, active scenes, energetic atmosphere',
  'golden-hour': 'warm golden lighting, magical glow, romantic atmosphere, dreamy quality',
  'twilight': 'purple and pink sky, soft evening light, peaceful transition, contemplative mood',
  'night': 'moonlight, stars, intimate lighting, mysterious atmosphere, cozy indoor scenes'
};

// Seasonal variations
export const seasonalStyles: Record<string, string> = {
  'spring': 'blooming flowers, fresh green leaves, soft pastels, renewal and growth imagery',
  'summer': 'bright sunshine, vibrant colors, beach or outdoor scenes, carefree atmosphere',
  'autumn': 'golden and red leaves, cozy sweaters, warm colors, nostalgic atmosphere',
  'winter': 'snow, cold air, warm indoor scenes, holiday elements, intimate gatherings'
};

/**
 * Detect mood from chapter content using keyword analysis
 */
export function detectMoodFromContent(content: string, theme: TaylorSwiftTheme): ImageMood {
  const lowerContent = content.toLowerCase();
  
  // Theme-specific mood mapping
  const themeMoodKeywords: Record<TaylorSwiftTheme, Record<ImageMood, string[]>> = {
    'coming-of-age': {
      'nostalgic': ['remember', 'childhood', 'growing up', 'used to', 'past', 'memories'],
      'empowering': ['strong', 'confident', 'independent', 'brave', 'courage', 'overcome'],
      'dreamy': ['dream', 'imagine', 'future', 'hope', 'wish', 'possibility'],
      'melancholic': ['sad', 'lonely', 'missing', 'lost', 'confused', 'uncertain'],
      'joyful': ['happy', 'excited', 'celebration', 'joy', 'laugh', 'smile'],
      'whimsical': ['magic', 'wonder', 'surprise', 'adventure', 'discovery'],
      'intimate': ['close', 'family', 'personal', 'private', 'secret', 'trust'],
      'romantic': ['love', 'crush', 'heart', 'romantic', 'attraction', 'dating']
    },
    'first-love': {
      'romantic': ['love', 'heart', 'kiss', 'romance', 'tender', 'sweet', 'butterflies'],
      'dreamy': ['dream', 'floating', 'magical', 'perfect', 'fairy tale', 'enchanted'],
      'joyful': ['happy', 'excited', 'smile', 'laugh', 'joy', 'celebration'],
      'intimate': ['close', 'whisper', 'gentle', 'soft', 'private', 'together'],
      'whimsical': ['playful', 'fun', 'silly', 'giggle', 'adventure', 'wonder'],
      'nostalgic': ['first', 'remember', 'never forget', 'special', 'moment'],
      'melancholic': ['nervous', 'worried', 'scared', 'uncertain', 'vulnerable'],
      'empowering': ['confident', 'brave', 'strong', 'bold', 'fearless']
    },
    'heartbreak': {
      'melancholic': ['sad', 'cry', 'tears', 'hurt', 'pain', 'broken', 'lonely', 'empty'],
      'nostalgic': ['remember', 'used to', 'miss', 'memories', 'before', 'past'],
      'empowering': ['stronger', 'overcome', 'heal', 'move on', 'independent', 'survivor'],
      'intimate': ['alone', 'quiet', 'solitude', 'personal', 'private', 'reflection'],
      'dreamy': ['hope', 'future', 'better', 'dream', 'imagine', 'possibility'],
      'joyful': ['laugh', 'smile', 'happy', 'friends', 'support', 'celebration'],
      'whimsical': ['surprise', 'unexpected', 'wonder', 'magic', 'discovery'],
      'romantic': ['love', 'heart', 'romance', 'relationship', 'connection']
    },
    'friendship': {
      'joyful': ['happy', 'fun', 'laugh', 'smile', 'celebration', 'party', 'excited'],
      'empowering': ['support', 'strong', 'together', 'brave', 'confident', 'powerful'],
      'whimsical': ['adventure', 'silly', 'playful', 'fun', 'crazy', 'spontaneous'],
      'intimate': ['close', 'trust', 'secret', 'personal', 'deep', 'understanding'],
      'nostalgic': ['remember', 'memories', 'childhood', 'always', 'forever'],
      'romantic': ['love', 'care', 'heart', 'special', 'connection', 'bond'],
      'dreamy': ['dream', 'future', 'hope', 'imagine', 'plan', 'wish'],
      'melancholic': ['miss', 'apart', 'distance', 'sad', 'worried', 'concern']
    }
  };
  
  const keywords = themeMoodKeywords[theme];
  const moodScores: Record<ImageMood, number> = {
    'dreamy': 0, 'nostalgic': 0, 'romantic': 0, 'melancholic': 0,
    'joyful': 0, 'empowering': 0, 'whimsical': 0, 'intimate': 0
  };
  
  // Score each mood based on keyword matches
  Object.entries(keywords).forEach(([mood, words]) => {
    words.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      const matches = lowerContent.match(regex);
      if (matches) {
        moodScores[mood as ImageMood] += matches.length;
      }
    });
  });
  
  // Find the highest scoring mood
  const topMood = Object.entries(moodScores).reduce((a, b) => 
    moodScores[a[0] as ImageMood] > moodScores[b[0] as ImageMood] ? a : b
  )[0] as ImageMood;
  
  // Return the top mood, or a default based on theme
  if (moodScores[topMood] > 0) {
    return topMood;
  }
  
  // Default moods for each theme
  const defaultMoods: Record<TaylorSwiftTheme, ImageMood> = {
    'coming-of-age': 'nostalgic',
    'first-love': 'romantic',
    'heartbreak': 'melancholic',
    'friendship': 'joyful'
  };
  
  return defaultMoods[theme];
}

/**
 * Create a Taylor Swift-inspired image prompt with thematic styling
 */
export function createTaylorSwiftImagePrompt(params: ThematicImageParams): string {
  const { theme, mood, chapterTitle, chapterContent, timeOfDay, season, setting } = params;
  
  const themeStyle = taylorSwiftImageStyles[theme];
  const moodEnhancement = moodEnhancements[mood];
  const timeStyle = timeOfDay ? timeOfDayStyles[timeOfDay] : '';
  const seasonStyle = season ? seasonalStyles[season] : '';
  
  // Extract key scene elements from content (first 300 characters)
  const sceneContext = chapterContent.substring(0, 300).replace(/[^\w\s]/g, '');
  
  // Select 2-3 random aesthetic elements for this theme
  const selectedElements = themeStyle.aestheticElements
    .sort(() => 0.5 - Math.random())
    .slice(0, 3)
    .join(', ');
  
  // Build the comprehensive prompt
  const prompt = `
Create a beautiful Taylor Swift-inspired illustration for the chapter "${chapterTitle}".

VISUAL STYLE: ${themeStyle.baseStyle}, professional young adult book illustration, ${moodEnhancement}

COLOR PALETTE: ${themeStyle.colorPalette}

LIGHTING & ATMOSPHERE: ${themeStyle.lighting}, ${themeStyle.atmosphere}
${timeStyle ? `Time of day: ${timeStyle}` : ''}
${seasonStyle ? `Seasonal elements: ${seasonStyle}` : ''}

AESTHETIC ELEMENTS: Incorporate ${selectedElements} in a tasteful, age-appropriate way

SCENE CONTEXT: ${sceneContext}...
${setting ? `Setting: ${setting}` : ''}

TAYLOR SWIFT AESTHETIC: Capture the emotional storytelling style reminiscent of Taylor Swift's music videos and album artwork, with attention to:
- Emotional depth and narrative
- Dreamy, cinematic quality
- Young adult appropriate content
- Rich symbolism and metaphors
- Beautiful, Instagram-worthy composition

TECHNICAL SPECIFICATIONS: 
- High resolution digital art
- Professional illustration quality
- Balanced composition with strong focal point
- Age-appropriate for 13-18 year olds
- Suitable for book illustration
- Clean, polished finish

Style should evoke the emotional resonance of Taylor Swift's ${theme.replace('-', ' ')} themed songs while maintaining artistic sophistication.
`.trim();

  return prompt;
}

/**
 * Analyze chapter content and auto-detect optimal image parameters
 */
export function analyzeChapterForImageGeneration(
  chapterTitle: string, 
  chapterContent: string, 
  theme: TaylorSwiftTheme
): Omit<ThematicImageParams, 'chapterTitle' | 'chapterContent'> {
  const detectedMood = detectMoodFromContent(chapterContent, theme);
  
  // Auto-detect time of day from content
  const timeOfDayKeywords = {
    'dawn': ['dawn', 'sunrise', 'early morning', 'first light'],
    'morning': ['morning', 'breakfast', 'school', 'woke up'],
    'afternoon': ['afternoon', 'lunch', 'class', 'after school'],
    'golden-hour': ['sunset', 'golden hour', 'evening light', 'dusk'],
    'twilight': ['twilight', 'evening', 'dusk', 'dinner'],
    'night': ['night', 'midnight', 'dark', 'moon', 'stars', 'sleep']
  };
  
  let detectedTimeOfDay: string | undefined;
  for (const [time, keywords] of Object.entries(timeOfDayKeywords)) {
    if (keywords.some(keyword => chapterContent.toLowerCase().includes(keyword))) {
      detectedTimeOfDay = time;
      break;
    }
  }
  
  // Auto-detect season from content
  const seasonKeywords = {
    'spring': ['spring', 'bloom', 'flowers', 'fresh', 'green'],
    'summer': ['summer', 'hot', 'beach', 'vacation', 'swim'],
    'autumn': ['autumn', 'fall', 'leaves', 'orange', 'sweater'],
    'winter': ['winter', 'snow', 'cold', 'holiday', 'fireplace']
  };
  
  let detectedSeason: string | undefined;
  for (const [season, keywords] of Object.entries(seasonKeywords)) {
    if (keywords.some(keyword => chapterContent.toLowerCase().includes(keyword))) {
      detectedSeason = season;
      break;
    }
  }
  
  return {
    theme,
    mood: detectedMood,
    timeOfDay: detectedTimeOfDay as 'dawn' | 'morning' | 'afternoon' | 'golden-hour' | 'twilight' | 'night' | undefined,
    season: detectedSeason as 'spring' | 'summer' | 'autumn' | 'winter' | undefined
  };
}