/**
 * Auth context barrel — now backed by BetterAuth.
 *
 * All existing consumers that import from this path continue to work unchanged.
 * The context shape (AuthContextType, AuthUser, etc.) is identical to what was
 * provided by the Supabase Auth integration.
 */
export {
  BetterAuthProvider,
  BetterAuthProvider as SupabaseAuthProvider,
  BetterAuthProvider as ClerkAuthProvider,
  AuthContext,
  useBetterAuth,
  useBetterAuth as useSupabaseAuth,
  useBetterAuth as useClerkAuth,
  useBetterAuth as useAuth,
  type AuthUser,
  type AuthContextType,
  type ProfileType,
  type BetterAuthSession,
} from '@/core/integrations/better-auth/AuthProvider';
