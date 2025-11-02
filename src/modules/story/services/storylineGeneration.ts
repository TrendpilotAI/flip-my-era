/**
 * Storyline Generation Service
 * Generates structured storylines using Groq with Master System Prompt + ERA-specific prompts
 */

import { EraType } from '../types/eras';
import { getCombinedSystemPrompt } from '../utils/promptLoader';
import { supabase } from '@/core/integrations/supabase/client';

export interface Storyline {
  logline: string;
  threeActStructure: {
    act1: {
      setup: string;
      incitingIncident: string;
      firstPlotPoint: string;
    };
    act2: {
      risingAction: string;
      midpoint: string;
      darkNightOfTheSoul: string;
    };
    act3: {
      climax: string;
      resolution: string;
      closingImage: string;
    };
  };
  chapters: Array<{
    number: number;
    title: string;
    summary: string;
    wordCountTarget: number;
  }>;
  themes: string[];
  wordCountTotal: number;
}

export interface GenerateStorylineParams {
  era: EraType;
  characterName: string;
  characterArchetype: string;
  gender: 'same' | 'flip' | 'neutral';
  location: string;
  promptDescription: string;
  customPrompt?: string;
}

/**
 * Generate a structured storyline using Groq AI via Edge Function
 */
export async function generateStoryline(params: GenerateStorylineParams, clerkToken: string | null): Promise<Storyline> {
  const {
    era,
    characterName,
    characterArchetype,
    gender,
    location,
    promptDescription,
    customPrompt
  } = params;

  // Get combined system prompt
  const systemPrompt = getCombinedSystemPrompt(era);

  // Construct user request
  const userRequest = `
Create a structured storyline following the Master System Prompt framework for the following story:

## Story Details:
- **Character Name**: ${characterName}
- **Character Archetype**: ${characterArchetype}
- **Gender Presentation**: ${gender}
- **Location**: ${location}
- **Story Prompt**: ${customPrompt || promptDescription}

## Required Output Format:
Please provide a complete storyline structure in the following JSON format:

\`\`\`json
{
  "logline": "A compelling one-sentence logline following the formula: When [INCITING INCIDENT], a [CHARACTER DESCRIPTION] must [OBJECTIVE] or else [STAKES], but faces [CENTRAL OBSTACLE].",
  "threeActStructure": {
    "act1": {
      "setup": "Description of the opening and world establishment",
      "incitingIncident": "The event that disrupts the status quo",
      "firstPlotPoint": "The moment the character commits to the journey"
    },
    "act2": {
      "risingAction": "Description of escalating challenges and obstacles",
      "midpoint": "Major twist or revelation at the story's center",
      "darkNightOfTheSoul": "The lowest point where character faces deepest fears"
    },
    "act3": {
      "climax": "Final confrontation with the central conflict",
      "resolution": "New equilibrium established",
      "closingImage": "Ending that mirrors or contrasts with the opening"
    }
  },
  "chapters": [
    {
      "number": 1,
      "title": "Chapter title",
      "summary": "Brief summary of chapter content and key events",
      "wordCountTarget": 800
    }
  ],
  "themes": ["Theme 1", "Theme 2", "Theme 3"],
  "wordCountTotal": 5000
}
\`\`\`

Ensure the storyline:
1. Captures the essence of the ${era} era
2. Features ${characterName} as the ${characterArchetype}
3. Is set in ${location}
4. Follows the three-act structure
5. Includes 3-6 chapters with appropriate pacing
6. Incorporates themes relevant to the era and story
`;

  if (!clerkToken) {
    throw new Error('UNAUTHORIZED');
  }

  try {
    const { data, error } = await supabase.functions.invoke('groq-storyline', {
      body: {
        era,
        characterName,
        characterArchetype,
        gender,
        location,
        promptDescription,
        customPrompt,
        systemPrompt,
      },
      headers: {
        Authorization: `Bearer ${clerkToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (error) {
      if (error.message?.includes('UNAUTHORIZED') || error.message?.includes('401')) {
        throw new Error('UNAUTHORIZED');
      } else if (error.message?.includes('GROQ_API_KEY_MISSING')) {
        throw new Error('GROQ_API_KEY_MISSING');
      } else if (error.message?.includes('INVALID_STORYLINE')) {
        throw new Error('Invalid storyline structure returned from AI');
      } else {
        throw new Error(error.message || 'Failed to generate storyline');
      }
    }

    if (!data || data.error) {
      throw new Error(data?.message || data?.error || 'Failed to generate storyline');
    }
    
    return data.storyline;
  } catch (error) {
    if (error instanceof Error) {
      // Handle specific error cases
      if (error.message === 'GROQ_API_KEY_MISSING') {
        throw error;
      } else if (error.message.includes('rate limit')) {
        throw new Error('RATE_LIMIT_EXCEEDED');
      } else if (error.message.includes('Invalid storyline structure')) {
        throw error;
      }
      throw error;
    }
    
    throw new Error('Failed to generate storyline. Please try again.');
  }
}

/**
 * Generate a storyline with streaming support (for future implementation)
 */
export async function* generateStorylineStreaming(
  params: GenerateStorylineParams,
  clerkToken: string | null
): AsyncGenerator<{ type: 'progress' | 'complete'; data: Partial<Storyline> | Storyline }> {
  // For now, just use the non-streaming version and yield the complete result
  // Future: Implement actual streaming with partial updates
  
  yield {
    type: 'progress',
    data: {}
  };

  const storyline = await generateStoryline(params, clerkToken);

  yield {
    type: 'complete',
    data: storyline
  };
}
