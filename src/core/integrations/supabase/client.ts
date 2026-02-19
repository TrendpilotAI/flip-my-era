import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    'Missing Supabase environment variables: VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY. ' +
    'The app will load, but Supabase features will not function until these are set.'
  );
}

let supabaseInstance: ReturnType<typeof createClient<Database>> | undefined;

function createStubClient(): ReturnType<typeof createClient<Database>> {
  const notConfigured = () => {
    throw new Error('Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.');
  };
  return {
    auth: {
      getSession: async () => ({ data: { session: null }, error: new Error('Supabase not configured') }),
      signOut: async () => ({ error: new Error('Supabase not configured') }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    },
    from: () => ({ select: notConfigured, insert: notConfigured, update: notConfigured, delete: notConfigured }),
    functions: { invoke: async () => ({ data: null, error: new Error('Supabase not configured') }) },
  } as unknown as ReturnType<typeof createClient<Database>>;
}

export const supabase = (() => {
  if (supabaseInstance) return supabaseInstance;

  if (supabaseUrl && supabaseAnonKey) {
    supabaseInstance = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
      },
    });
    return supabaseInstance;
  }

  return createStubClient();
})();

export async function getSupabaseSession() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

export async function signOutFromSupabase() {
  const { error } = await supabase.auth.signOut();
  return { error };
}
