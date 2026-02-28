export function getEnvVar(key: string): string | undefined {
  // In Vite, environment variables are accessed via import.meta.env
  return (import.meta.env as unknown as Record<string, string | undefined>)[key];
}

/**
 * Get Groq API Key
 * 
 * @deprecated REMOVED — Groq API keys must never be exposed in client-side code.
 * All Groq calls go through Edge Functions: groq-api, groq-storyline, stream-chapters.
 * @returns always undefined — use Edge Functions instead
 */
export function getGroqApiKey(): string | undefined {
  // SECURITY: This function intentionally returns undefined.
  // GROQ_API_KEY is a server-side secret stored only in Supabase Edge Function environment.
  // Setting VITE_GROQ_API_KEY would bundle the key into client JS — exposing it to anyone.
  if (import.meta.env.DEV) {
    console.warn('[Security] getGroqApiKey() is deprecated. Use Edge Functions (groq-api, stream-chapters) instead.');
  }
  return undefined;
}

/**
 * Get OpenAI API Key
 * 
 * @deprecated REMOVED — OpenAI API keys must never be exposed in client-side code.
 * All OpenAI calls go through Supabase Edge Functions.
 * @returns always undefined — use Edge Functions instead
 */
export function getOpenAiApiKey(): string | undefined {
  // SECURITY: This function intentionally returns undefined.
  // OPENAI_API_KEY is a server-side secret stored only in Supabase Edge Function environment.
  if (import.meta.env.DEV) {
    console.warn('[Security] getOpenAiApiKey() is deprecated. Use Edge Functions instead.');
  }
  return undefined;
}

export function getSupabaseUrl(): string | undefined {
  return getEnvVar('VITE_SUPABASE_URL');
}

export function getSupabaseAnonKey(): string | undefined {
  return getEnvVar('VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY');
}

// Clerk removed — using Supabase Auth

