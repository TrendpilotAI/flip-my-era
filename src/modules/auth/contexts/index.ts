export { SupabaseAuthProvider as AuthProvider } from '@/core/integrations/supabase/auth';
export { AuthContext, type AuthUser, type AuthContextType, type ProfileType } from '@/core/integrations/supabase/auth';
export { useSupabaseAuth as useAuth } from '@/core/integrations/supabase/auth';

// Legacy aliases — keep temporarily for gradual migration
export { SupabaseAuthProvider as ClerkAuthProvider } from '@/core/integrations/supabase/auth';
export { useSupabaseAuth as useClerkAuth } from '@/core/integrations/supabase/auth';
