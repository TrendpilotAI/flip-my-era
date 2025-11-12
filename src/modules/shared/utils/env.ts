export function getEnvVar(key: string): string | undefined {
  // In Vite, environment variables are accessed via import.meta.env
  return (import.meta.env as unknown as Record<string, string | undefined>)[key];
}

/**
 * Get Groq API Key - DEPRECATED: This function should not be used in client-side code.
 * All Groq API calls should go through Supabase Edge Functions to avoid exposing secrets.
 * 
 * @deprecated Use Edge Functions (groq-api, groq-storyline, stream-chapters) instead
 * @returns undefined in production builds to prevent secret exposure
 */
export function getGroqApiKey(): string | undefined {
  // In production builds, return undefined to prevent secret keys from being bundled
  // This ensures secrets are not exposed in client-side code
  if (import.meta.env.PROD) {
    console.warn('getGroqApiKey() called in production - this should use Edge Functions instead');
    return undefined;
  }
  return getEnvVar('VITE_GROQ_API_KEY');
}

/**
 * Get OpenAI API Key - DEPRECATED: This function should not be used in client-side code.
 * All OpenAI API calls should go through Supabase Edge Functions to avoid exposing secrets.
 * 
 * @deprecated Use Edge Functions instead. This function returns undefined in production builds.
 * @returns undefined in production builds to prevent secret exposure
 */
export function getOpenAiApiKey(): string | undefined {
  // In production builds, return undefined to prevent secret keys from being bundled
  // This ensures secrets are not exposed in client-side code
  if (import.meta.env.PROD) {
    console.warn('getOpenAiApiKey() called in production - this should use Edge Functions instead');
    return undefined;
  }
  return getEnvVar('VITE_OPENAI_API_KEY');
}

export function getSupabaseUrl(): string | undefined {
  return getEnvVar('VITE_SUPABASE_URL');
}

export function getSupabaseAnonKey(): string | undefined {
  return getEnvVar('VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY');
}

export function getClerkPublishableKey(): string | undefined {
  return getEnvVar('VITE_CLERK_PUBLISHABLE_KEY');
}

