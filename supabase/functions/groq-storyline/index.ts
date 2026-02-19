// @ts-ignore -- Deno Edge Function imports
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore -- Deno Edge Function imports
import { verifyAuth } from "../_shared/utils.ts";

const ALLOWED_ORIGINS = [
  'http://localhost:8081',
  'https://flip-my-era.netlify.app',
  'https://flipmyera.com',
  'https://www.flipmyera.com',
];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get('Origin') || '';
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Max-Age': '86400',
    'Access-Control-Allow-Credentials': 'true',
  };
}

// Import rate limiting utility
// @ts-ignore -- Deno import
import { getRateLimitRecord } from '../_shared/rateLimitStorage.ts';

const RATE_LIMIT = {
  maxRequests: 10, // More restrictive for storyline generation
  windowMs: 3600000, // 1 hour
};

const REQUEST_TIMEOUT_MS = 60000; // 60 seconds (longer for storyline generation)

// verifyAuth is imported from _shared/utils.ts — cryptographically verifies JWT

// Debug logging removed for security - was sending to hardcoded localhost endpoint

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
  const corsHeaders = getCorsHeaders(req);
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get Groq API key from environment
    const groqApiKey = Deno.env.get('GROQ_API_KEY');
    if (!groqApiKey) {
      console.error('GROQ_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'GROQ_API_KEY_MISSING', message: 'Groq API key not configured' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Verify JWT cryptographically via Supabase auth.getUser()
    const userId = await verifyAuth(req);

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'UNAUTHORIZED', message: 'Invalid or expired token' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Rate limiting check for storyline generation
    const rateLimitKey = `groq-storyline:${userId}`;
    const rateLimitRecord = await getRateLimitRecord(rateLimitKey, RATE_LIMIT);
    if (!rateLimitRecord.allowed) {
      return new Response(
        JSON.stringify({
          error: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many storyline generation requests. Please try again later.',
          retryAfter: Math.ceil((rateLimitRecord.resetAt - Date.now()) / 1000),
        }),
        {
          status: 429,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
            'Retry-After': String(Math.ceil((rateLimitRecord.resetAt - Date.now()) / 1000)),
            'X-RateLimit-Limit': String(RATE_LIMIT.maxRequests),
            'X-RateLimit-Remaining': String(rateLimitRecord.remaining),
            'X-RateLimit-Reset': String(rateLimitRecord.resetAt),
          },
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

    // Validate systemPrompt
    if (!systemPrompt || typeof systemPrompt !== 'string' || systemPrompt.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'BAD_REQUEST', message: 'System prompt is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Enhanced sanitization to prevent prompt injection
    const sanitizeForPrompt = (input: string, maxLength: number): string => {
      return input
        .replace(/ignore\s+(previous|above|all)\s+instructions/gi, '')
        .replace(/system\s*:/gi, '')
        .replace(/user\s*:/gi, '')
        .replace(/assistant\s*:/gi, '')
        .replace(/```/g, '')
        .trim()
        .substring(0, maxLength);
    };

    const sanitizedCharacterName = sanitizeForPrompt(characterName, 50);
    const sanitizedLocation = sanitizeForPrompt(location, 100);
    const sanitizedPromptDescription = promptDescription ? sanitizeForPrompt(promptDescription, 2000) : '';
    const sanitizedCustomPrompt = customPrompt ? sanitizeForPrompt(customPrompt, 2000) : '';
    const sanitizedSystemPrompt = sanitizeForPrompt(systemPrompt, 10000);

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

    // Call Groq API with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
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
              content: sanitizedSystemPrompt,
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
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!groqResponse.ok) {
        const errorData = await groqResponse.json().catch(() => ({}));
        const errorMessage = errorData.error?.message || 'Groq API request failed';
        console.error('Groq API error:', groqResponse.status, errorMessage);
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
        console.error('Invalid storyline structure returned from AI');
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
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        console.error('Groq request timeout');
        return new Response(
          JSON.stringify({
            error: 'REQUEST_TIMEOUT',
            message: 'Storyline generation took too long. Please try again.',
          }),
          {
            status: 408,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
      throw error; // Re-throw to outer catch block
    }
  } catch (error) {
    console.error('Unhandled error during storyline generation:', error);
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
