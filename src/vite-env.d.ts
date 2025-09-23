/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_PUBLISHABLE_KEY: string
  readonly VITE_SUPABASE_SERVICE_ROLE_KEY: string
  readonly VITE_GROQ_API_KEY: string
  readonly VITE_OPENAI_API_KEY: string
  readonly VITE_RUNWARE_API_KEY: string
  readonly VITE_SAMCART_API_KEY: string
  readonly VITE_SAMCART_MERCHANT_ID: string
  readonly VITE_APP_URL: string
  readonly VITE_APP_ENV: string
  readonly PROD: boolean
  readonly DEV: boolean
  readonly MODE: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
