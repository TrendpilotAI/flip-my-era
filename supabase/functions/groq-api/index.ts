// @ts-ignore -- Deno Edge Function imports
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore -- Deno Edge Function imports
import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2.57.2";
// @ts-ignore -- Deno Edge Function imports
import { getCorsHeaders, handleCors, verifyAuth } from "../_shared/utils.ts";
// @ts-ignore -- Deno Edge Function imports
import { getRateLimitRecord } from "../_shared/rateLimitStorage.ts";

const RATE_LIMIT = { maxRequests: 60, windowMs: 60000 };
const REQUEST_TIMEOUT_MS = 30000;
const STORY_GENERATION_CREDITS = 1;

interface GroqRequest {
  prompt: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  idempotency_key?: string;
}

interface GroqChatResponse {
  choices: Array<{ message: { content: string } }>;
}

interface GenerationClaim {
  request_id: string | null;
  outcome: 'claimed' | 'replay' | 'in_progress' | 'insufficient' | 'failed';
  transaction_id: string | null;
  credits_charged: number | string;
  current_balance: number | string | null;
  response_cache: Record<string, unknown> | null;
  lease_token: string | null;
  lease_expires_at: string | null;
}

function createJsonResponse(corsHeaders: Record<string, string>) {
  return (
    body: Record<string, unknown>,
    status: number,
    idempotencyKey?: string,
    headers: Record<string, string> = {},
  ): Response => {
    return new Response(JSON.stringify(body), {
      status,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        ...(idempotencyKey ? { 'X-Idempotency-Key': idempotencyKey } : {}),
        ...headers,
      },
    });
  };
}

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const jsonResponse = createJsonResponse(getCorsHeaders(req));

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'METHOD_NOT_ALLOWED', message: 'Only POST is supported' }, 405);
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
      console.error('Unable to finalize failed generation request:', error ?? data);
      return false;
    }

    claimWasCharged = false;
    return true;
  };

  try {
    userId = await verifyAuth(req);
    if (!userId) {
      return jsonResponse({ error: 'UNAUTHORIZED', message: 'Invalid or expired token' }, 401);
    }

    const groqApiKey = Deno.env.get('GROQ_API_KEY');
    if (!groqApiKey) {
      return jsonResponse({ error: 'GROQ_API_KEY_MISSING', message: 'Groq API key not configured' }, 500);
    }

    let requestData: GroqRequest;
    try {
      requestData = await req.json();
    } catch {
      return jsonResponse({ error: 'BAD_REQUEST', message: 'Request body must be valid JSON' }, 400);
    }

    const {
      prompt,
      model = 'llama-3.3-70b-versatile',
      temperature = 0.7,
      maxTokens = 4096,
      systemPrompt,
    } = requestData;

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return jsonResponse({ error: 'BAD_REQUEST', message: 'Prompt is required and cannot be empty' }, 400);
    }
    const sanitizedPrompt = prompt.trim();
    if (sanitizedPrompt.length > 50000) {
      return jsonResponse({ error: 'BAD_REQUEST', message: 'Prompt exceeds maximum length of 50,000 characters' }, 400);
    }
    if (typeof model !== 'string' || model.trim().length === 0 || model.length > 200) {
      return jsonResponse({ error: 'BAD_REQUEST', message: 'Model must be a non-empty string of at most 200 characters' }, 400);
    }
    if (typeof temperature !== 'number' || !Number.isFinite(temperature) || temperature < 0 || temperature > 2) {
      return jsonResponse({ error: 'BAD_REQUEST', message: 'Temperature must be a number between 0 and 2' }, 400);
    }
    if (typeof maxTokens !== 'number' || !Number.isInteger(maxTokens) || maxTokens < 1 || maxTokens > 8192) {
      return jsonResponse({ error: 'BAD_REQUEST', message: 'maxTokens must be an integer between 1 and 8192' }, 400);
    }
    if (systemPrompt !== undefined && typeof systemPrompt !== 'string') {
      return jsonResponse({ error: 'BAD_REQUEST', message: 'systemPrompt must be a string' }, 400);
    }

    idempotencyKey = (
      requestData.idempotency_key
      ?? req.headers.get('Idempotency-Key')
      ?? crypto.randomUUID()
    ).trim();
    if (!idempotencyKey || idempotencyKey.length > 200) {
      return jsonResponse({ error: 'BAD_REQUEST', message: 'Idempotency key must contain 1 to 200 characters' }, 400);
    }

    const rateLimitRecord = await getRateLimitRecord(`groq-api:${userId}`, RATE_LIMIT);
    if (!rateLimitRecord.allowed) {
      const retryAfter = Math.ceil((rateLimitRecord.resetAt - Date.now()) / 1000);
      return jsonResponse(
        { error: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests. Please try again later.', retryAfter },
        429,
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
      return jsonResponse({ error: 'CREDIT_SERVICE_ERROR', message: 'Credit service is not configured' }, 503, idempotencyKey);
    }
    adminClient = createClient<any>(supabaseUrl, serviceKey);

    const { data: claimData, error: claimError } = await adminClient
      .rpc('claim_generation_request', {
        p_user_id: userId,
        p_idempotency_key: idempotencyKey,
        p_operation_type: 'story_generation',
        p_credits: STORY_GENERATION_CREDITS,
        p_metadata: { model: model.trim() },
      })
      .single();

    if (claimError || !claimData) {
      console.error('Generation claim failed:', claimError);
      return jsonResponse({ error: 'CREDIT_SERVICE_ERROR', message: 'Unable to process credits. Please try again.' }, 503, idempotencyKey);
    }

    const claim = claimData as GenerationClaim;
    if (claim.outcome === 'replay' && claim.response_cache) {
      return jsonResponse(claim.response_cache, 200, idempotencyKey, { 'X-Idempotent-Replay': 'true' });
    }
    if (claim.outcome === 'in_progress') {
      return jsonResponse(
        { error: 'REQUEST_IN_PROGRESS', message: 'A generation request with this key is already in progress.' },
        409,
        idempotencyKey,
      );
    }
    if (claim.outcome === 'insufficient') {
      return jsonResponse({
        error: 'INSUFFICIENT_CREDITS',
        message: 'You do not have enough credits to generate a story.',
        current_balance: Number(claim.current_balance ?? 0),
        required: STORY_GENERATION_CREDITS,
      }, 402, idempotencyKey);
    }
    if (claim.outcome === 'failed') {
      return jsonResponse(
        { error: 'REQUEST_PREVIOUSLY_FAILED', message: 'This generation attempt failed. Retry with a new idempotency key.' },
        409,
        idempotencyKey,
      );
    }
    if (claim.outcome !== 'claimed') {
      return jsonResponse({ error: 'CREDIT_SERVICE_ERROR', message: 'Unexpected generation claim state' }, 503, idempotencyKey);
    }
    if (!claim.lease_token) {
      return jsonResponse({ error: 'CREDIT_SERVICE_ERROR', message: 'Generation claim did not provide a lease' }, 503, idempotencyKey);
    }
    leaseToken = claim.lease_token;
    claimWasCharged = true;

    const messages: Array<{ role: string; content: string }> = [];
    const sanitizedSystemPrompt = systemPrompt?.trim().substring(0, 10000);
    if (sanitizedSystemPrompt) {
      messages.push({ role: 'system', content: sanitizedSystemPrompt });
    }
    messages.push({ role: 'user', content: sanitizedPrompt });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${groqApiKey}`,
        },
        body: JSON.stringify({ model: model.trim(), messages, temperature, max_tokens: maxTokens }),
        signal: controller.signal,
      });

      if (!groqResponse.ok) {
        const errorData = await groqResponse.json().catch(() => ({}));
        const message = errorData.error?.message || 'Groq API request failed';
        const refunded = await failClaim('GROQ_API_ERROR', message);
        if (!refunded) {
          return jsonResponse({ error: 'CREDIT_REFUND_ERROR', message: 'Generation failed and its credit refund could not be confirmed.' }, 503, idempotencyKey);
        }
        return jsonResponse(
          { error: 'GROQ_API_ERROR', message, status: groqResponse.status },
          groqResponse.status >= 500 ? 500 : groqResponse.status,
          idempotencyKey,
        );
      }

      const data: GroqChatResponse = await groqResponse.json();
      const content = data.choices[0]?.message?.content;
      if (!content) {
        const refunded = await failClaim('INVALID_RESPONSE', 'No content in Groq response');
        if (!refunded) {
          return jsonResponse({ error: 'CREDIT_REFUND_ERROR', message: 'Invalid generation response and its credit refund could not be confirmed.' }, 503, idempotencyKey);
        }
        return jsonResponse({ error: 'INVALID_RESPONSE', message: 'No content in Groq response' }, 500, idempotencyKey);
      }

      const responsePayload = { content };
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
        console.error('Unable to complete generation request:', completeError ?? completed);
        await failClaim('COMPLETION_ERROR', 'Unable to persist completed generation response');
        return jsonResponse({ error: 'GENERATION_STATE_ERROR', message: 'Generation completed but its result could not be finalized. Retry with the same key.' }, 503, idempotencyKey);
      }

      claimWasCharged = false;
      return jsonResponse(responsePayload, 200, idempotencyKey);
    } catch (error) {
      const isTimeout = error instanceof Error && error.name === 'AbortError';
      const code = isTimeout ? 'REQUEST_TIMEOUT' : 'GENERATION_ERROR';
      const message = isTimeout
        ? 'Request took too long to complete. Please try again.'
        : error instanceof Error ? error.message : 'Generation failed';
      const refunded = await failClaim(code, message);
      if (!refunded) {
        return jsonResponse({ error: 'CREDIT_REFUND_ERROR', message: 'Generation failed and its credit refund could not be confirmed.' }, 503, idempotencyKey);
      }
      return jsonResponse({ error: code, message }, isTimeout ? 408 : 500, idempotencyKey);
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const refunded = await failClaim('INTERNAL_ERROR', message);
    if (!refunded) {
      return jsonResponse({ error: 'CREDIT_REFUND_ERROR', message: 'The request failed and its credit refund could not be confirmed.' }, 503, idempotencyKey ?? undefined);
    }
    return jsonResponse({ error: 'INTERNAL_ERROR', message }, 500, idempotencyKey ?? undefined);
  }
});
