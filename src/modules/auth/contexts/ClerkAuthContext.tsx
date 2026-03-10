// Backward-compatible re-export — now backed by BetterAuth
export {
  BetterAuthProvider as ClerkAuthProvider,
  BetterAuthProvider as SupabaseAuthProvider,
} from '@/core/integrations/better-auth/AuthProvider';
export {
  useBetterAuth as useClerkAuth,
  useBetterAuth as useSupabaseAuth,
} from '@/core/integrations/better-auth/AuthProvider';
