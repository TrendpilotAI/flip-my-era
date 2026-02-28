/// <reference types="vite/client" />

// Markdown file imports
declare module '*.md' {
  const content: string;
  export default content;
}

declare module '*.md?raw' {
  const content: string;
  export default content;
}

interface ImportMetaEnv {
  // Public keys - safe to expose in client-side code
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_PUBLISHABLE_KEY: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_CLERK_PUBLISHABLE_KEY: string;
  readonly VITE_RUNWARE_PROXY_URL?: string;
  /** @deprecated SamCart removed - use Stripe */
  // readonly VITE_SAMCART_CHECKOUT_ENDPOINT?: string;
  readonly VITE_PUBLIC_POSTHOG_KEY: string;
  readonly VITE_PUBLIC_POSTHOG_HOST: string;
  
  // SECURITY: GROQ_API_KEY and OPENAI_API_KEY must NEVER be exposed as VITE_ variables.
  // They are server-side secrets set only in Supabase Edge Function environment.
  // All AI calls go through Edge Functions: groq-api, groq-storyline, stream-chapters.
  // @deprecated Use runware-proxy Edge Function instead
  readonly VITE_RUNWARE_API_KEY?: string;
  
  // Legacy/optional keys
  readonly VITE_RUNWAY_API_KEY?: string;
  readonly VITE_RUNWAY_API_URL?: string;
  /** @deprecated SamCart removed - use Stripe */
  // readonly VITE_SAMCART_EBOOK_PRODUCT_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}