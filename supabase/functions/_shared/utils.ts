import { createClient } from 'npm:@supabase/supabase-js@2.57.2';

// Browser origins reviewed for credentialed Edge Function requests.
const ALLOWED_ORIGINS = new Set([
  'https://flipmyera.com',
  'https://www.flipmyera.com',
  'https://flip-my-era.vercel.app',
  'https://flip-my-era-trendpilotais-projects.vercel.app',
  'https://flip-my-era-preview.vercel.app',
]);

const DEVELOPMENT_ORIGINS = new Set([
  'http://localhost:8080',
  'http://localhost:8081',
  'http://localhost:8084',
  'http://gallery-hybrid.localhost:1355',
]);

export function isAllowedOrigin(
  origin: string,
  environment = Deno.env.get('ENVIRONMENT') ?? 'production',
): boolean {
  if (ALLOWED_ORIGINS.has(origin)) return true;
  return environment === 'development' && DEVELOPMENT_ORIGINS.has(origin);
}

const baseCorsHeaders = {
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, idempotency-key',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
  'Access-Control-Max-Age': '86400',
  'Vary': 'Origin',
};

// Return browser CORS headers without ever reflecting an unreviewed origin.
export function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('Origin');
  return {
    ...baseCorsHeaders,
    ...(origin && isAllowedOrigin(origin)
      ? {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Credentials': 'true',
      }
      : {}),
  };
}

/**
 * Reject a browser request from an unreviewed origin before auth or effects.
 * Requests without an Origin header are server-to-server requests and proceed.
 */
export function rejectUntrustedOrigin(req: Request): Response | null {
  const origin = req.headers.get('Origin');
  if (origin === null || isAllowedOrigin(origin)) return null;

  return new Response(
    JSON.stringify({ success: false, error: 'Origin not allowed' }),
    {
      status: 403,
      headers: {
        ...baseCorsHeaders,
        'Content-Type': 'application/json',
      },
    },
  );
}

// Legacy export for backwards compatibility
export const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://flipmyera.com',
  'Access-Control-Allow-Headers': baseCorsHeaders['Access-Control-Allow-Headers'],
  'Access-Control-Allow-Methods': baseCorsHeaders['Access-Control-Allow-Methods'],
  'Access-Control-Max-Age': baseCorsHeaders['Access-Control-Max-Age'],
  'Access-Control-Allow-Credentials': 'true',
  'Vary': 'Origin',
};

// Helper to handle CORS preflight requests
export function handleCors(req: Request): Response | null {
  const rejection = rejectUntrustedOrigin(req);
  if (rejection) return rejection;

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
 * Verify the caller's session token and extract the authenticated user ID.
 *
 * BetterAuth stores sessions in the `session` Postgres table and issues an
 * opaque token (not a JWT).  We look up the token directly in the database
 * via the Supabase service-role client.
 *
 * Falls back to legacy Supabase JWT verification so that any in-flight
 * Supabase-Auth sessions continue to work during the migration window.
 *
 * Returns the user ID string on success, or null on failure.
 */
export async function verifyAuth(req: Request): Promise<string | null> {
  const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  if (!token) return null;

  // ── 1. Try BetterAuth session lookup (opaque token in `session` table) ───
  try {
    const supabase = initSupabaseClient();
    const { data: session, error } = await (supabase as any)
      .from('session')
      .select('userId, expiresAt')
      .eq('token', token)
      .single();

    if (!error && session) {
      const expiresAt = new Date(session.expiresAt).getTime();
      if (expiresAt > Date.now()) {
        return session.userId;
      }
      // Token expired
      return null;
    }
  } catch {
    // fall through to legacy path
  }

  // ── 2. Legacy: Supabase Auth JWT (migration compatibility) ────────────────
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    if (!supabaseUrl || !supabaseAnonKey) return null;

    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const { data: { user }, error } = await authClient.auth.getUser(token);
    if (error || !user) return null;

    return user.id;
  } catch {
    return null;
  }
}

// Standard error response formatter
export function formatErrorResponse(error: unknown, status = 500, req?: Request) {
  const normalizedError = error instanceof Error
    ? error
    : new Error(typeof error === 'string' ? error : 'Unknown error');

  // Log error details for debugging (avoid logging sensitive data)
  console.error(`Function error occurred:`, normalizedError.message);
  
  // In production, avoid exposing detailed error information
  const isDevelopment = Deno.env.get('ENVIRONMENT') === 'development';
  
  return new Response(
    JSON.stringify({
      success: false,
      error: isDevelopment ? normalizedError.message : 'An error occurred while processing your request',
      // Only include stack trace in development
      ...(isDevelopment && { details: normalizedError.stack })
    }),
    {
      headers: { ...(req ? getCorsHeaders(req) : corsHeaders), 'Content-Type': 'application/json' },
      status: status
    }
  );
}

// Standard success response formatter
export function formatSuccessResponse<T>(data: T, status = 200, req?: Request) {
  return new Response(
    JSON.stringify({ 
      success: true,
      data
    }),
    { 
      headers: { ...(req ? getCorsHeaders(req) : corsHeaders), 'Content-Type': 'application/json' },
      status
    }
  );
}
