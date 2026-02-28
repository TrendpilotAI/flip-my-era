// @ts-ignore -- Deno Edge Function imports
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

// Import rate limiting utility
// @ts-ignore -- Deno import
import { getRateLimitRecord } from '../_shared/rateLimitStorage.ts';

const RATE_LIMIT = {
  maxRequests: 60,
  windowMs: 60000, // 1 minute
};

const REQUEST_TIMEOUT_MS = 30000; // 30 seconds

// Credits charged per story generation
const STORY_GENERATION_CREDITS = 1;

interface GroqRequest {
  prompt: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  idempotency_key?: string; // Client-generated UUID to prevent double-charging
}

interface GroqChatMessage {
  role: string;
  content: string;
}

interface GroqChatChoice {
  message: GroqChatMessage;
  index: number;
  finish_reason: string;
}

interface GroqChatResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: GroqChatChoice[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
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

    const userId = user.id;

    // Rate limiting check
    const rateLimitKey = `groq-api:${userId}`;
    const rateLimitRecord = await getRateLimitRecord(rateLimitKey, RATE_LIMIT);
    if (!rateLimitRecord.allowed) {
      return new Response(
        JSON.stringify({
          error: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests. Please try again later.',
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
    const requestData: GroqRequest = await req.json();
    const {
      prompt,
      model = 'llama-3.3-70b-versatile',
      temperature = 0.7,
      maxTokens = 4096,
      systemPrompt,
      idempotency_key,
    } = requestData;

    // Input validation
    if (!prompt || typeof prompt !== 'string') {
      return new Response(
        JSON.stringify({ error: 'BAD_REQUEST', message: 'Prompt is required and must be a string' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const sanitizedPrompt = prompt.trim();
    if (sanitizedPrompt.length === 0) {
      return new Response(
        JSON.stringify({ error: 'BAD_REQUEST', message: 'Prompt cannot be empty' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (sanitizedPrompt.length > 50000) {
      return new Response(
        JSON.stringify({ error: 'BAD_REQUEST', message: 'Prompt exceeds maximum length of 50,000 characters' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (typeof temperature !== 'number' || isNaN(temperature) || temperature < 0 || temperature > 2) {
      return new Response(
        JSON.stringify({ error: 'BAD_REQUEST', message: 'Temperature must be a number between 0 and 2' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (typeof maxTokens !== 'number' || isNaN(maxTokens) || maxTokens < 1 || maxTokens > 8192) {
      return new Response(
        JSON.stringify({ error: 'BAD_REQUEST', message: 'maxTokens must be a number between 1 and 8192' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // --- SERVER-SIDE CREDIT SYSTEM ---
    // Use service role client for credit operations (bypasses RLS)
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const adminClient = createClient(supabaseUrl, serviceKey);

    // 1. Idempotency check — if this key was already processed, return cached response
    if (idempotency_key) {
      const { data: existingRequest } = await adminClient
        .from('generation_requests')
        .select('status, response_cache')
        .eq('idempotency_key', idempotency_key)
        .eq('user_id', userId)
        .single();

      if (existingRequest) {
        if (existingRequest.status === 'completed' && existingRequest.response_cache) {
          // Return cached response — no double charge
          console.log(`Idempotent replay for key ${idempotency_key}, user ${userId}`);
          return new Response(
            JSON.stringify(existingRequest.response_cache),
            {
              status: 200,
              headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Idempotent-Replay': 'true' },
            }
          );
        }
        if (existingRequest.status === 'pending') {
          // Request in-flight — reject to prevent concurrent double-spend
          return new Response(
            JSON.stringify({ error: 'REQUEST_IN_PROGRESS', message: 'A generation request with this key is already in progress. Please wait.' }),
            {
              status: 409,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }
      }
    }

    // 2. Verify credit balance and atomically deduct BEFORE generation
    const { data: deductResult, error: deductError } = await adminClient
      .rpc('deduct_credits', {
        p_user_id: userId,
        p_amount: STORY_GENERATION_CREDITS,
        p_description: 'Story generation',
        p_metadata: {
          operation_type: 'story_generation',
          idempotency_key: idempotency_key || null,
        },
      })
      .single();

    if (deductError) {
      console.error('Credit deduction error:', deductError);
      return new Response(
        JSON.stringify({ error: 'CREDIT_SERVICE_ERROR', message: 'Unable to process credits. Please try again.' }),
        {
          status: 503,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (!deductResult?.success) {
      // Insufficient credits
      const { data: balanceData } = await adminClient
        .from('user_credits')
        .select('balance')
        .eq('user_id', userId)
        .single();

      return new Response(
        JSON.stringify({
          error: 'INSUFFICIENT_CREDITS',
          message: 'You do not have enough credits to generate a story.',
          current_balance: balanceData?.balance ?? 0,
          required: STORY_GENERATION_CREDITS,
        }),
        {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const transactionId = deductResult.transaction_id;

    // 3. Register idempotency record as 'pending' (after deduction, before generation)
    let generationRequestId: string | null = null;
    if (idempotency_key) {
      const { data: genReq } = await adminClient
        .from('generation_requests')
        .insert({
          idempotency_key,
          user_id: userId,
          operation_type: 'story_generation',
          credits_charged: STORY_GENERATION_CREDITS,
          transaction_id: transactionId,
          status: 'pending',
        })
        .select('id')
        .single();
      generationRequestId = genReq?.id ?? null;
    }

    // --- GENERATION ---
    const messages: GroqChatMessage[] = [];
    if (systemPrompt && typeof systemPrompt === 'string') {
      const sanitizedSystemPrompt = systemPrompt.trim().substring(0, 10000);
      if (sanitizedSystemPrompt.length > 0) {
        messages.push({ role: 'system', content: sanitizedSystemPrompt });
      }
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
        body: JSON.stringify({
          model,
          messages,
          temperature,
          max_tokens: maxTokens,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!groqResponse.ok) {
        const errorData = await groqResponse.json().catch(() => ({}));
        const errorMessage = errorData.error?.message || 'Groq API request failed';

        // Mark idempotency record as failed
        if (generationRequestId) {
          await adminClient
            .from('generation_requests')
            .update({ status: 'failed', completed_at: new Date().toISOString() })
            .eq('id', generationRequestId);
        }

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

      const data: GroqChatResponse = await groqResponse.json();
      const content = data.choices[0]?.message?.content;

      if (!content) {
        if (generationRequestId) {
          await adminClient
            .from('generation_requests')
            .update({ status: 'failed', completed_at: new Date().toISOString() })
            .eq('id', generationRequestId);
        }
        return new Response(
          JSON.stringify({ error: 'INVALID_RESPONSE', message: 'No content in Groq response' }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      const responsePayload = { content };

      // Mark idempotency record as completed and cache the response
      if (generationRequestId) {
        await adminClient
          .from('generation_requests')
          .update({
            status: 'completed',
            response_cache: responsePayload,
            completed_at: new Date().toISOString(),
          })
          .eq('id', generationRequestId);
      }

      return new Response(
        JSON.stringify(responsePayload),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        if (generationRequestId) {
          await adminClient
            .from('generation_requests')
            .update({ status: 'failed', completed_at: new Date().toISOString() })
            .eq('id', generationRequestId);
        }
        return new Response(
          JSON.stringify({
            error: 'REQUEST_TIMEOUT',
            message: 'Request took too long to complete. Please try again.',
          }),
          {
            status: 408,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
      throw error;
    }
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
