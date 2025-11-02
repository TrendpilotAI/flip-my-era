// @ts-ignore -- Deno Edge Function imports
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

interface GenerateStorylineRequest {
  era: string;
  characterName: string;
  characterArchetype: string;
  gender: 'same' | 'flip' | 'neutral';
  location: string;
  promptDescription: string;
  customPrompt?: string;
  systemPrompt: string;
}

interface Storyline {
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

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get Groq API key from environment
    const groqApiKey = Deno.env.get('GROQ_API_KEY');
    if (!groqApiKey) {
      return new Response(
        JSON.stringify({ error: 'GROQ_API_KEY_MISSING', message: 'Groq API key not configured' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Verify JWT token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'UNAUTHORIZED', message: 'Missing authorization header' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Create Supabase client to verify token
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'UNAUTHORIZED', message: 'Invalid or expired token' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Parse request body
    const params: GenerateStorylineRequest = await req.json();
    const {
      era,
      characterName,
      characterArchetype,
      gender,
      location,
      promptDescription,
      customPrompt,
      systemPrompt,
    } = params;

    // Input validation
    if (!era || typeof era !== 'string') {
      return new Response(
        JSON.stringify({ error: 'BAD_REQUEST', message: 'Era is required and must be a string' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (!characterName || typeof characterName !== 'string' || characterName.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'BAD_REQUEST', message: 'Character name is required and cannot be empty' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (characterName.length > 50) {
      return new Response(
        JSON.stringify({ error: 'BAD_REQUEST', message: 'Character name must be 50 characters or less' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (!location || typeof location !== 'string' || location.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'BAD_REQUEST', message: 'Location is required and cannot be empty' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (location.length > 100) {
      return new Response(
        JSON.stringify({ error: 'BAD_REQUEST', message: 'Location must be 100 characters or less' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (!['same', 'flip', 'neutral'].includes(gender)) {
      return new Response(
        JSON.stringify({ error: 'BAD_REQUEST', message: 'Gender must be same, flip, or neutral' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Sanitize inputs
    const sanitizedCharacterName = characterName.trim().substring(0, 50);
    const sanitizedLocation = location.trim().substring(0, 100);
    const sanitizedPromptDescription = promptDescription ? promptDescription.trim().substring(0, 2000) : '';
    const sanitizedCustomPrompt = customPrompt ? customPrompt.trim().substring(0, 2000) : '';

    // Construct user request with sanitized inputs
    const userRequest = `
Create a structured storyline following the Master System Prompt framework for the following story:

## Story Details:
- **Character Name**: ${sanitizedCharacterName}
- **Character Archetype**: ${characterArchetype || 'protagonist'}
- **Gender Presentation**: ${gender}
- **Location**: ${sanitizedLocation}
- **Story Prompt**: ${sanitizedCustomPrompt || sanitizedPromptDescription}

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
2. Features ${sanitizedCharacterName} as the ${characterArchetype || 'protagonist'}
3. Is set in ${sanitizedLocation}
4. Follows the three-act structure
5. Includes 3-6 chapters with appropriate pacing
6. Incorporates themes relevant to the era and story
`;

    // Call Groq API
    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${groqApiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: userRequest,
          },
        ],
        temperature: 0.7,
        max_tokens: 4096,
        stream: false,
      }),
    });

    if (!groqResponse.ok) {
      const errorData = await groqResponse.json().catch(() => ({}));
      const errorMessage = errorData.error?.message || 'Groq API request failed';
      
      return new Response(
        JSON.stringify({
          error: 'GROQ_API_ERROR',
          message: errorMessage,
          status: groqResponse.status,
        }),
        {
          status: groqResponse.status >= 500 ? 500 : groqResponse.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const data = await groqResponse.json();
    const responseText = data.choices[0]?.message?.content || '';

    // Extract JSON from response (it might be wrapped in markdown code blocks)
    let jsonText = responseText;
    const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      jsonText = jsonMatch[1];
    }

    // Parse the JSON response
    const storyline = JSON.parse(jsonText) as Storyline;

    // Validate the structure
    if (!storyline.logline || !storyline.threeActStructure || !storyline.chapters) {
      return new Response(
        JSON.stringify({
          error: 'INVALID_STORYLINE',
          message: 'Invalid storyline structure returned from AI',
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({ storyline }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
