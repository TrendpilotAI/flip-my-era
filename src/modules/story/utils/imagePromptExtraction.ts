/**
 * Image Prompt Extraction Utilities
 * Extracts visual descriptions from story content for image generation
 */

export interface ImagePrompt {
  scene: string;
  characters: string[];
  setting: string;
  mood: string;
  style: string;
  description: string;
  confidence: number; // 0-1 score of how good the extracted prompt is
}

/**
 * Extract image prompt from streaming chapter content
 */
export const extractImagePromptFromStream = (
  content: string,
  title?: string,
  previousPrompt?: ImagePrompt | null
): ImagePrompt | null => {
  if (!content || content.length < 50) {
    return previousPrompt || null;
  }

  try {
    // Look for descriptive passages that would make good images
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20);
    
    let bestPrompt: ImagePrompt | null = null;
    let highestScore = 0;

    for (const sentence of sentences) {
      const prompt = extractFromSentence(sentence.trim(), title);
      if (prompt && prompt.confidence > highestScore) {
        bestPrompt = prompt;
        highestScore = prompt.confidence;
      }
    }

    // If we found a better prompt than before, return it
    if (bestPrompt && (!previousPrompt || bestPrompt.confidence > previousPrompt.confidence)) {
      return bestPrompt;
    }

    return previousPrompt || bestPrompt;
  } catch (error) {
    console.error('Error extracting image prompt:', error);
    return previousPrompt || null;
  }
};

/**
 * Extract image prompt from a single sentence
 */
const extractFromSentence = (sentence: string, title?: string): ImagePrompt | null => {
  // Skip dialogue and internal thoughts
  if (sentence.includes('"') || sentence.toLowerCase().includes('thought') || sentence.toLowerCase().includes('said')) {
    return null;
  }

  // Look for visual descriptors
  const visualWords = [
    'stood', 'walked', 'ran', 'sat', 'looked', 'gazed', 'stared',
    'room', 'house', 'garden', 'street', 'forest', 'beach', 'mountain',
    'sunlight', 'moonlight', 'shadows', 'darkness', 'bright', 'dim',
    'beautiful', 'stunning', 'magnificent', 'peaceful', 'chaotic',
    'wearing', 'dressed', 'hair', 'eyes', 'face', 'smile'
  ];

  const visualScore = visualWords.reduce((score, word) => {
    return sentence.toLowerCase().includes(word) ? score + 1 : score;
  }, 0);

  if (visualScore < 2) {
    return null;
  }

  // Extract components
  const characters = extractCharacters(sentence);
  const setting = extractSetting(sentence);
  const mood = extractMood(sentence);
  const scene = extractScene(sentence);

  const confidence = Math.min(visualScore / 5, 1); // Normalize to 0-1

  return {
    scene,
    characters,
    setting,
    mood,
    style: 'realistic, detailed, cinematic lighting',
    description: `${scene} ${setting} ${mood} ${characters.join(', ')}`.trim(),
    confidence
  };
};

/**
 * Extract character descriptions from text
 */
const extractCharacters = (text: string): string[] => {
  const characters: string[] = [];
  const lowerText = text.toLowerCase();

  // Common character descriptors
  const characterPatterns = [
    /\b(young|old|teenage|elderly)\s+(woman|man|girl|boy|person)/gi,
    /\b(she|he)\s+(was|is)\s+wearing\s+([^.]+)/gi,
    /\b(her|his)\s+(hair|eyes|face|smile)/gi
  ];

  characterPatterns.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) {
      characters.push(...matches.map(m => m.trim()));
    }
  });

  return characters.slice(0, 3); // Limit to 3 character descriptions
};

/**
 * Extract setting/location from text
 */
const extractSetting = (text: string): string => {
  const locationWords = [
    'room', 'bedroom', 'kitchen', 'living room', 'bathroom',
    'house', 'home', 'apartment', 'building',
    'garden', 'park', 'forest', 'woods', 'field',
    'street', 'road', 'sidewalk', 'path',
    'beach', 'ocean', 'lake', 'river',
    'mountain', 'hill', 'valley',
    'school', 'classroom', 'library', 'cafeteria',
    'office', 'store', 'restaurant', 'cafe'
  ];

  const lowerText = text.toLowerCase();
  for (const location of locationWords) {
    if (lowerText.includes(location)) {
      return `in a ${location}`;
    }
  }

  return 'in a scenic location';
};

/**
 * Extract mood/atmosphere from text
 */
const extractMood = (text: string): string => {
  const moodWords = {
    peaceful: ['peaceful', 'calm', 'serene', 'quiet', 'tranquil'],
    romantic: ['romantic', 'intimate', 'tender', 'loving', 'sweet'],
    dramatic: ['dramatic', 'intense', 'powerful', 'striking'],
    melancholy: ['sad', 'melancholy', 'lonely', 'wistful', 'nostalgic'],
    joyful: ['happy', 'joyful', 'cheerful', 'bright', 'sunny'],
    mysterious: ['mysterious', 'dark', 'shadowy', 'enigmatic'],
    energetic: ['energetic', 'dynamic', 'lively', 'vibrant']
  };

  const lowerText = text.toLowerCase();
  
  for (const [mood, words] of Object.entries(moodWords)) {
    if (words.some(word => lowerText.includes(word))) {
      return `${mood} atmosphere`;
    }
  }

  return 'warm, inviting atmosphere';
};

/**
 * Extract main scene description
 */
const extractScene = (text: string): string => {
  // Try to get the main action or scene
  const actionWords = [
    'standing', 'sitting', 'walking', 'running', 'dancing',
    'looking', 'gazing', 'staring', 'watching',
    'holding', 'carrying', 'wearing',
    'smiling', 'laughing', 'crying', 'thinking'
  ];

  const lowerText = text.toLowerCase();
  for (const action of actionWords) {
    if (lowerText.includes(action)) {
      return `scene of someone ${action}`;
    }
  }

  return 'beautiful scene';
};