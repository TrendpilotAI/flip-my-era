// Auth module exports — now backed by Supabase Auth
export { SupabaseAuthProvider as AuthProvider } from '@/core/integrations/supabase/auth';
export { useSupabaseAuth as useAuth } from '@/core/integrations/supabase/auth';

// Legacy aliases — keep temporarily for gradual migration
export { SupabaseAuthProvider as ClerkAuthProvider } from '@/core/integrations/supabase/auth';
export { useSupabaseAuth as useClerkAuth } from '@/core/integrations/supabase/auth';
export * from './components/Auth';
export * from './components/AuthCallback';
export * from './components/ResetPassword';
