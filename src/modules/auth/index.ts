// Auth module exports — now backed by BetterAuth
export {
  BetterAuthProvider,
  BetterAuthProvider as SupabaseAuthProvider,
  BetterAuthProvider as ClerkAuthProvider,
  useBetterAuth,
  useBetterAuth as useAuth,
  useBetterAuth as useSupabaseAuth,
  useBetterAuth as useClerkAuth,
  AuthContext,
  type AuthUser,
  type AuthContextType,
} from '@/core/integrations/better-auth/AuthProvider';
export * from './components/Auth';
export * from './components/AuthCallback';
export * from './components/ResetPassword';
