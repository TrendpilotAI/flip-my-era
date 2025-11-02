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

interface GroqRequest {
  prompt: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
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

    // Simple rate limiting check (basic implementation)
    // TODO: Implement proper distributed rate limiting with Redis or database
    const rateLimitKey = `groq-api:${user.id}`;
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
    const { prompt, model = 'llama-3.3-70b-versatile', temperature = 0.7, maxTokens = 4096, systemPrompt } = requestData;

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

    // Sanitize and validate prompt length
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

    // Validate temperature and maxTokens with proper number checks
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

    // Call Groq API
    const messages: GroqChatMessage[] = [];
    if (systemPrompt && typeof systemPrompt === 'string') {
      // Sanitize system prompt
      const sanitizedSystemPrompt = systemPrompt.trim().substring(0, 10000);
      if (sanitizedSystemPrompt.length > 0) {
        messages.push({ role: 'system', content: sanitizedSystemPrompt });
      }
    }
    messages.push({ role: 'user', content: sanitizedPrompt });

    // Add timeout to Groq API call
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
        return new Response(
          JSON.stringify({ error: 'INVALID_RESPONSE', message: 'No content in Groq response' }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      return new Response(
        JSON.stringify({ content }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
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
      throw error; // Re-throw to outer catch block
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
