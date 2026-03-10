// Backward-compatible aliases — now backed by Supabase Auth
import { useSupabaseAuth } from '@/core/integrations/supabase/auth';

export const useAuth = useSupabaseAuth;

/** @deprecated Use `useAuth` instead */
export const useClerkAuth = useSupabaseAuth;
