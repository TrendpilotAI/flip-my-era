export function getEnvVar(key: string): string | undefined {
  // In Vite, environment variables are accessed via import.meta.env
  return (import.meta.env as unknown as Record<string, string | undefined>)[key];
}

export function getGroqApiKey(): string | undefined {
  return getEnvVar('VITE_GROQ_API_KEY');
}

export function getOpenAiApiKey(): string | undefined {
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

