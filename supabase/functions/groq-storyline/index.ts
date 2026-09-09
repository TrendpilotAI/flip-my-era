// @ts-ignore -- Deno Edge Function imports
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore -- Deno Edge Function imports
import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2.57.2";
// @ts-ignore -- Deno Edge Function imports
import { getCorsHeaders, handleCors, verifyAuth } from "../_shared/utils.ts";
// @ts-ignore -- Deno Edge Function imports
import { getRateLimitRecord } from "../_shared/rateLimitStorage.ts";

const STORYLINE_GENERATION_CREDITS = 2;
const REQUEST_TIMEOUT_MS = 60000;
const RATE_LIMIT = { maxRequests: 10, windowMs: 3600000 };

interface GenerateStorylineRequest {
  era: string;
  characterName: string;
  characterArchetype: string;
  gender: 'same' | 'flip' | 'neutral';
  location: string;
  promptDescription: string;
  customPrompt?: string;
  systemPrompt: string;
  idempotency_key?: string;
}

interface Storyline {
  logline: string;
  threeActStructure: {
    act1: { setup: string; incitingIncident: string; firstPlotPoint: string };
    act2: { risingAction: string; midpoint: string; darkNightOfTheSoul: string };
    act3: { climax: string; resolution: string; closingImage: string };
  };
  chapters: Array<{ number: number; title: string; summary: string; wordCountTarget: number }>;
  themes: string[];
  wordCountTotal: number;
}

interface GenerationClaim {
  outcome: 'claimed' | 'replay' | 'in_progress' | 'insufficient' | 'failed';
  current_balance: number | string | null;
  response_cache: Record<string, unknown> | null;
  lease_token: string | null;
  lease_expires_at: string | null;
}

function jsonResponse(
  body: Record<string, unknown>,
  status: number,
  corsHeaders: Record<string, string>,
  idempotencyKey?: string,
  headers: Record<string, string> = {},
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
      ...(idempotencyKey ? { 'X-Idempotency-Key': idempotencyKey } : {}),
      ...headers,
    },
  });
}

function sanitizeForPrompt(input: string, maxLength: number): string {
  return input
    .replace(/ignore\s+(previous|above|all)\s+instructions/gi, '')
    .replace(/system\s*:/gi, '')
    .replace(/user\s*:/gi, '')
    .replace(/assistant\s*:/gi, '')
    .replace(/```/g, '')
    .trim()
    .substring(0, maxLength);
}

function validateInput(params: GenerateStorylineRequest): string | null {
  if (!params.era || typeof params.era !== 'string' || !params.era.trim()) {
    return 'Era is required and must be a non-empty string';
  }
  if (params.era.length > 100) return 'Era must be 100 characters or less';
  if (!params.characterName || typeof params.characterName !== 'string' || !params.characterName.trim()) {
    return 'Character name is required and cannot be empty';
  }
  if (params.characterName.length > 50) return 'Character name must be 50 characters or less';
  if (typeof params.characterArchetype !== 'string' || params.characterArchetype.length > 100) {
    return 'Character archetype must be a string of at most 100 characters';
  }
  if (!params.location || typeof params.location !== 'string' || !params.location.trim()) {
    return 'Location is required and cannot be empty';
  }
  if (params.location.length > 100) return 'Location must be 100 characters or less';
  if (!['same', 'flip', 'neutral'].includes(params.gender)) {
    return 'Gender must be same, flip, or neutral';
  }
  if (typeof params.promptDescription !== 'string' || params.promptDescription.length > 2000) {
    return 'Prompt description must be a string of at most 2,000 characters';
  }
  if (params.customPrompt !== undefined && (typeof params.customPrompt !== 'string' || params.customPrompt.length > 2000)) {
    return 'Custom prompt must be a string of at most 2,000 characters';
  }
  if (!params.systemPrompt || typeof params.systemPrompt !== 'string' || !params.systemPrompt.trim()) {
    return 'System prompt is required';
  }
  if (params.systemPrompt.length > 10000) return 'System prompt must be 10,000 characters or less';
  return null;
}

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const corsHeaders = getCorsHeaders(req);
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'METHOD_NOT_ALLOWED', message: 'Only POST is supported' }, 405, corsHeaders);
  }

  let userId: string | null = null;
  let idempotencyKey: string | null = null;
  let leaseToken: string | null = null;
  let claimWasCharged = false;
  let adminClient: SupabaseClient<any> | null = null;

  const failClaim = async (errorCode: string, errorMessage: string): Promise<boolean> => {
    if (!claimWasCharged || !adminClient || !userId || !idempotencyKey || !leaseToken) {
      return true;
    }

    const { data, error } = await adminClient
      .rpc('fail_generation_request', {
        p_user_id: userId,
        p_idempotency_key: idempotencyKey,
        p_lease_token: leaseToken,
        p_error_code: errorCode,
        p_error_message: errorMessage,
      })
      .single();

    const failureResult = data as { success?: boolean } | null;
    if (error || !failureResult?.success) {
      console.error('Unable to finalize failed storyline request:', error ?? data);
      return false;
    }

    claimWasCharged = false;
    return true;
  };

  try {
    userId = await verifyAuth(req);
    if (!userId) {
      return jsonResponse({ error: 'UNAUTHORIZED', message: 'Invalid or expired token' }, 401, corsHeaders);
    }

    const groqApiKey = Deno.env.get('GROQ_API_KEY');
    if (!groqApiKey) {
      return jsonResponse({ error: 'GROQ_API_KEY_MISSING', message: 'Groq API key not configured' }, 500, corsHeaders);
    }

    let params: GenerateStorylineRequest;
    try {
      params = await req.json();
    } catch {
      return jsonResponse({ error: 'BAD_REQUEST', message: 'Request body must be valid JSON' }, 400, corsHeaders);
    }

    const validationError = validateInput(params);
    if (validationError) {
      return jsonResponse({ error: 'BAD_REQUEST', message: validationError }, 400, corsHeaders);
    }

    idempotencyKey = (
      params.idempotency_key
      ?? req.headers.get('Idempotency-Key')
      ?? crypto.randomUUID()
    ).trim();
    if (!idempotencyKey || idempotencyKey.length > 200) {
      return jsonResponse({ error: 'BAD_REQUEST', message: 'Idempotency key must contain 1 to 200 characters' }, 400, corsHeaders);
    }

    const rateLimitRecord = await getRateLimitRecord(`groq-storyline:${userId}`, RATE_LIMIT);
    if (!rateLimitRecord.allowed) {
      const retryAfter = Math.ceil((rateLimitRecord.resetAt - Date.now()) / 1000);
      return jsonResponse(
        { error: 'RATE_LIMIT_EXCEEDED', message: 'Too many storyline generation requests. Please try again later.', retryAfter },
        429,
        corsHeaders,
        idempotencyKey,
        {
          'Retry-After': String(retryAfter),
          'X-RateLimit-Limit': String(RATE_LIMIT.maxRequests),
          'X-RateLimit-Remaining': String(rateLimitRecord.remaining),
          'X-RateLimit-Reset': String(rateLimitRecord.resetAt),
        },
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !serviceKey) {
      return jsonResponse({ error: 'CREDIT_SERVICE_ERROR', message: 'Credit service is not configured' }, 503, corsHeaders, idempotencyKey);
    }
    adminClient = createClient<any>(supabaseUrl, serviceKey);

    const sanitizedCharacterName = sanitizeForPrompt(params.characterName, 50);
    const sanitizedLocation = sanitizeForPrompt(params.location, 100);
    const sanitizedPromptDescription = sanitizeForPrompt(params.promptDescription, 2000);
    const sanitizedCustomPrompt = params.customPrompt ? sanitizeForPrompt(params.customPrompt, 2000) : '';
    const sanitizedSystemPrompt = sanitizeForPrompt(params.systemPrompt, 10000);
    const sanitizedEra = sanitizeForPrompt(params.era, 100);
    const sanitizedArchetype = sanitizeForPrompt(params.characterArchetype || 'protagonist', 100);

    if (!sanitizedCharacterName || !sanitizedLocation || !sanitizedSystemPrompt) {
      return jsonResponse({ error: 'BAD_REQUEST', message: 'Required prompt fields became empty after sanitization' }, 400, corsHeaders, idempotencyKey);
    }

    const { data: claimData, error: claimError } = await adminClient
      .rpc('claim_generation_request', {
        p_user_id: userId,
        p_idempotency_key: idempotencyKey,
        p_operation_type: 'storyline_generation',
        p_credits: STORYLINE_GENERATION_CREDITS,
        p_metadata: { era: sanitizedEra },
      })
      .single();

    if (claimError || !claimData) {
      console.error('Storyline claim failed:', claimError);
      return jsonResponse({ error: 'CREDIT_SERVICE_ERROR', message: 'Unable to process credits. Please try again.' }, 503, corsHeaders, idempotencyKey);
    }

    const claim = claimData as GenerationClaim;
    if (claim.outcome === 'replay' && claim.response_cache) {
      return jsonResponse(claim.response_cache, 200, corsHeaders, idempotencyKey, { 'X-Idempotent-Replay': 'true' });
    }
    if (claim.outcome === 'in_progress') {
      return jsonResponse(
        { error: 'REQUEST_IN_PROGRESS', message: 'A storyline generation with this key is already in progress.' },
        409,
        corsHeaders,
        idempotencyKey,
      );
    }
    if (claim.outcome === 'insufficient') {
      return jsonResponse({
        error: 'INSUFFICIENT_CREDITS',
        message: 'You do not have enough credits to generate a storyline.',
        current_balance: Number(claim.current_balance ?? 0),
        required: STORYLINE_GENERATION_CREDITS,
      }, 402, corsHeaders, idempotencyKey);
    }
    if (claim.outcome === 'failed') {
      return jsonResponse(
        { error: 'REQUEST_PREVIOUSLY_FAILED', message: 'This storyline attempt failed. Retry with a new idempotency key.' },
        409,
        corsHeaders,
        idempotencyKey,
      );
    }
    if (claim.outcome !== 'claimed') {
      return jsonResponse({ error: 'CREDIT_SERVICE_ERROR', message: 'Unexpected generation claim state' }, 503, corsHeaders, idempotencyKey);
    }
    if (!claim.lease_token) {
      return jsonResponse({ error: 'CREDIT_SERVICE_ERROR', message: 'Storyline claim did not provide a lease' }, 503, corsHeaders, idempotencyKey);
    }
    leaseToken = claim.lease_token;
    claimWasCharged = true;

    const userRequest = `
Create a structured storyline following the Master System Prompt framework for the following story:

## Story Details:
- **Character Name**: ${sanitizedCharacterName}
- **Character Archetype**: ${sanitizedArchetype}
- **Gender Presentation**: ${params.gender}
- **Location**: ${sanitizedLocation}
- **Story Prompt**: ${sanitizedCustomPrompt || sanitizedPromptDescription}

## Required Output Format:
Return JSON with this exact top-level shape:
{
  "logline": "string",
  "threeActStructure": {
    "act1": { "setup": "string", "incitingIncident": "string", "firstPlotPoint": "string" },
    "act2": { "risingAction": "string", "midpoint": "string", "darkNightOfTheSoul": "string" },
    "act3": { "climax": "string", "resolution": "string", "closingImage": "string" }
  },
  "chapters": [{ "number": 1, "title": "string", "summary": "string", "wordCountTarget": 800 }],
  "themes": ["string"],
  "wordCountTotal": 5000
}

The storyline must capture the ${sanitizedEra} era, feature ${sanitizedCharacterName},
be set in ${sanitizedLocation}, follow a three-act structure, and include 3-6 chapters.
`;

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
            { role: 'system', content: sanitizedSystemPrompt },
            { role: 'user', content: userRequest },
          ],
          temperature: 0.7,
          max_tokens: 4096,
          stream: false,
        }),
        signal: controller.signal,
      });

      if (!groqResponse.ok) {
        const errorData = await groqResponse.json().catch(() => ({}));
        const message = errorData.error?.message || 'Groq API request failed';
        const refunded = await failClaim('GROQ_API_ERROR', message);
        if (!refunded) {
          return jsonResponse({ error: 'CREDIT_REFUND_ERROR', message: 'Storyline generation failed and its credit refund could not be confirmed.' }, 503, corsHeaders, idempotencyKey);
        }
        return jsonResponse(
          { error: 'GROQ_API_ERROR', message, status: groqResponse.status },
          groqResponse.status >= 500 ? 500 : groqResponse.status,
          corsHeaders,
          idempotencyKey,
        );
      }

      const data = await groqResponse.json();
      const responseText = data.choices[0]?.message?.content || '';
      const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/);
      const storyline = JSON.parse(jsonMatch ? jsonMatch[1] : responseText) as Storyline;

      if (!storyline.logline
          || !storyline.threeActStructure?.act1
          || !storyline.threeActStructure?.act2
          || !storyline.threeActStructure?.act3
          || !Array.isArray(storyline.chapters)
          || storyline.chapters.length === 0
          || !Array.isArray(storyline.themes)
          || !Number.isFinite(storyline.wordCountTotal)) {
        const refunded = await failClaim('INVALID_STORYLINE', 'Invalid storyline structure returned from AI');
        if (!refunded) {
          return jsonResponse({ error: 'CREDIT_REFUND_ERROR', message: 'Invalid storyline response and its credit refund could not be confirmed.' }, 503, corsHeaders, idempotencyKey);
        }
        return jsonResponse({ error: 'INVALID_STORYLINE', message: 'Invalid storyline structure returned from AI' }, 500, corsHeaders, idempotencyKey);
      }

      const responsePayload = { storyline };
      const { data: completed, error: completeError } = await adminClient
        .rpc('complete_generation_request', {
          p_user_id: userId,
          p_idempotency_key: idempotencyKey,
          p_response_cache: responsePayload,
          p_lease_token: leaseToken,
        })
        .single();

      const completeResult = completed as { success?: boolean } | null;
      if (completeError || !completeResult?.success) {
        console.error('Unable to complete storyline request:', completeError ?? completed);
        await failClaim('COMPLETION_ERROR', 'Unable to persist completed storyline response');
        return jsonResponse({ error: 'GENERATION_STATE_ERROR', message: 'Storyline completed but its result could not be finalized. Retry with the same key.' }, 503, corsHeaders, idempotencyKey);
      }

      claimWasCharged = false;
      return jsonResponse(responsePayload, 200, corsHeaders, idempotencyKey);
    } catch (error) {
      const isTimeout = error instanceof Error && error.name === 'AbortError';
      const isParseError = error instanceof SyntaxError;
      const code = isTimeout ? 'REQUEST_TIMEOUT' : isParseError ? 'INVALID_STORYLINE' : 'GENERATION_ERROR';
      const message = isTimeout
        ? 'Storyline generation took too long. Please try again.'
        : isParseError
          ? 'Invalid storyline structure returned from AI'
          : error instanceof Error ? error.message : 'Storyline generation failed';
      const refunded = await failClaim(code, message);
      if (!refunded) {
        return jsonResponse({ error: 'CREDIT_REFUND_ERROR', message: 'Storyline generation failed and its credit refund could not be confirmed.' }, 503, corsHeaders, idempotencyKey);
      }
      return jsonResponse({ error: code, message }, isTimeout ? 408 : 500, corsHeaders, idempotencyKey);
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const refunded = await failClaim('INTERNAL_ERROR', message);
    if (!refunded) {
      return jsonResponse({ error: 'CREDIT_REFUND_ERROR', message: 'The request failed and its credit refund could not be confirmed.' }, 503, corsHeaders, idempotencyKey ?? undefined);
    }
    return jsonResponse({ error: 'INTERNAL_ERROR', message }, 500, corsHeaders, idempotencyKey ?? undefined);
  }
});
