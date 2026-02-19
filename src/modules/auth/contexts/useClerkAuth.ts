// Backward-compatible alias — now backed by Supabase Auth
import { useSupabaseAuth } from '@/core/integrations/supabase/auth';

export const useClerkAuth = useSupabaseAuth;
