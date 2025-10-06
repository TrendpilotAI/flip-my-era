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
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_PUBLISHABLE_KEY: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_CLERK_PUBLISHABLE_KEY: string;
  readonly VITE_GROQ_API_KEY: string;
  readonly VITE_RUNWAY_API_KEY?: string;
  readonly VITE_RUNWAY_API_URL?: string;
  readonly VITE_SAMCART_EBOOK_PRODUCT_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}