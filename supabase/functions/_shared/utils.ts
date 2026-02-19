import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';

// Production CORS origin allowlist
const ALLOWED_ORIGINS = [
  'http://localhost:8081',
  'https://flip-my-era.netlify.app',
  'https://flipmyera.com',
  'https://www.flipmyera.com',
];

// Get CORS headers with origin validation
export function getCorsHeaders(req: Request) {
  const origin = req.headers.get('Origin') || '';
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Max-Age': '86400',
    'Access-Control-Allow-Credentials': 'true',
  };
}

// Legacy export for backwards compatibility
export const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://flipmyera.com',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper to handle CORS preflight requests
export function handleCors(req: Request) {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: getCorsHeaders(req) });
  }
  return null;
}

// Initialize Supabase client with error handling
export function initSupabaseClient() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables');
  }
  
  return createClient(supabaseUrl, supabaseKey);
}

/**
 * Verify the caller's JWT and extract the authenticated user ID.
 *
 * Uses Supabase's auth.getUser() which cryptographically verifies the token
 * signature against the project's JWT secret — NOT raw base64 decoding.
 *
 * Returns the user ID string on success, or null on failure.
 */
export async function verifyAuth(req: Request): Promise<string | null> {
  const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    if (!supabaseUrl || !supabaseAnonKey) return null;

    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const { data: { user }, error } = await authClient.auth.getUser(token);
    if (error || !user) return null;

    // user.id is the Supabase auth.uid(); for Clerk-synced users the 'sub'
    // claim is mapped to this field by the Clerk ↔ Supabase integration.
    return user.id;
  } catch {
    return null;
  }
}

// Standard error response formatter
export function formatErrorResponse(error: Error, status = 500) {
  // Log error details for debugging (avoid logging sensitive data)
  console.error(`Function error occurred:`, error.message);
  
  // In production, avoid exposing detailed error information
  const isDevelopment = Deno.env.get('ENVIRONMENT') === 'development';
  
  return new Response(
    JSON.stringify({
      success: false,
      error: isDevelopment ? error.message : 'An error occurred while processing your request',
      // Only include stack trace in development
      ...(isDevelopment && { details: error.stack })
    }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: status
    }
  );
}

// Standard success response formatter
export function formatSuccessResponse<T>(data: T, status = 200) {
  return new Response(
    JSON.stringify({ 
      success: true,
      data
    }),
    { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status
    }
  );
} 