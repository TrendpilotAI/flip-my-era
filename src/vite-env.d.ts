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
  readonly VITE_SAMCART_CHECKOUT_ENDPOINT?: string;
  readonly VITE_PUBLIC_POSTHOG_KEY: string;
  readonly VITE_PUBLIC_POSTHOG_HOST: string;
  
  // Deprecated secret keys - should NOT be set in production
  // These are only for local development/testing. In production, use Edge Functions instead.
  // @deprecated Use Edge Functions (groq-api, groq-storyline, stream-chapters) instead
  readonly VITE_GROQ_API_KEY?: string;
  // @deprecated Use Edge Functions instead
  readonly VITE_OPENAI_API_KEY?: string;
  // @deprecated Use runware-proxy Edge Function instead
  readonly VITE_RUNWARE_API_KEY?: string;
  
  // Legacy/optional keys
  readonly VITE_RUNWAY_API_KEY?: string;
  readonly VITE_RUNWAY_API_URL?: string;
  readonly VITE_SAMCART_EBOOK_PRODUCT_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}