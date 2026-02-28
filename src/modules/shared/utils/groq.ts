import { supabase } from '@/core/integrations/supabase/client';

/**
 * Generate a UUID v4 for idempotency keys.
 * Uses the Web Crypto API available in all modern browsers.
 */
function generateIdempotencyKey(): string {
  return crypto.randomUUID();
}

export const generateWithGroq = async (
  prompt: string,
  clerkToken: string | null,
  options?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    systemPrompt?: string;
    idempotencyKey?: string; // Pass an existing key to retry safely
  }
) => {
  if (!clerkToken) {
    throw new Error('UNAUTHORIZED');
  }

  // Generate idempotency key client-side to prevent double-charging on retry/double-click
  const idempotency_key = options?.idempotencyKey ?? generateIdempotencyKey();

  try {
    const { data, error } = await supabase.functions.invoke('groq-api', {
      body: {
        prompt,
        model: options?.model || 'openai/gpt-oss-120b',
        temperature: options?.temperature || 0.7,
        maxTokens: options?.maxTokens || 4096,
        systemPrompt: options?.systemPrompt || 'You are a creative writer specializing in humorous alternate reality stories and chapter generation.',
        idempotency_key,
      },
      headers: {
        Authorization: `Bearer ${clerkToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (error) {
      // Handle specific error cases
      if (error.message?.includes('UNAUTHORIZED') || error.message?.includes('401')) {
        throw new Error('UNAUTHORIZED');
      } else if (error.message?.includes('429') || error.message?.includes('rate limit')) {
        throw new Error('RATE_LIMIT_EXCEEDED');
      } else if (error.message?.includes('GROQ_API_KEY_MISSING')) {
        throw new Error('GROQ_API_KEY_MISSING');
      } else if (error.message?.includes('INSUFFICIENT_CREDITS') || error.message?.includes('402')) {
        throw new Error('INSUFFICIENT_CREDITS');
      } else {
        throw new Error(error.message || 'API_ERROR');
      }
    }

    if (data?.error === 'INSUFFICIENT_CREDITS') {
      throw new Error('INSUFFICIENT_CREDITS');
    }

    if (!data || data.error) {
      throw new Error(data?.message || data?.error || 'Failed to generate with Groq');
    }
    
    return data.content;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to generate with Groq');
  }
};
