// Centralized Supabase client re-export to avoid multiple instances
// Do not create another client here; use the unified client from core
export { supabase } from '@/core/integrations/supabase/client';
export type { SupabaseClient } from '@supabase/supabase-js';
