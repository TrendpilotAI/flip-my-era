import { GenderInfo, getFlippedGender } from './genderUtils';
import { starSignCharacteristics } from './starSigns';
import { personalityTypes } from '@/types/personality';

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
  sceneSettings: string
) => {
  const starSignTraits = starSign ? starSignCharacteristics[starSign].traits.join(", ") : "";
  
  return `Create an enchanting story with both a captivating title and narrative about ${transformedName}${date ? ` (born ${date.toLocaleDateString()})` : ''} in the style of an enchanting novel, with rich descriptions and flowing narrative. ${getGenderContext(transformedName, detectedGender, gender)}.

First, generate a creative, whimsical title that captures the essence of the story. Format it with a # at the beginning to denote it as the title.

Setting: ${sceneSettings}

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
