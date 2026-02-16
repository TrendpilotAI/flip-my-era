/**
 * Shared test helpers for Edge Function integration tests.
 *
 * These tests run against a local Supabase instance (`supabase start`).
 * Start the functions with: `supabase functions serve`
 *
 * Run tests with: `deno test --allow-net --allow-env supabase/functions/tests/`
 */

const FUNCTIONS_URL =
  Deno.env.get("SUPABASE_FUNCTIONS_URL") ||
  "http://127.0.0.1:54321/functions/v1";

const ANON_KEY =
  Deno.env.get("SUPABASE_ANON_KEY") ||
  // Default local dev anon key (from `supabase start`)
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";

/** Build the full URL for an edge function. */
export function functionUrl(name: string, params?: Record<string, string>): string {
  const url = new URL(`${FUNCTIONS_URL}/${name}`);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      url.searchParams.set(k, v);
    }
  }
  return url.toString();
}

/** Create a fake Clerk JWT with a given `sub` claim (user ID). */
export function fakeClerkJwt(userId: string): string {
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = btoa(
    JSON.stringify({
      sub: userId,
      iss: "https://clerk.test",
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
    })
  );
  // Not a real signature – Edge Functions decode but don't verify in dev
  const sig = btoa("test-signature");
  return `${header}.${payload}.${sig}`;
}

/** Standard headers for authenticated requests. */
export function authHeaders(userId: string, origin = "http://localhost:8081"): HeadersInit {
  return {
    Authorization: `Bearer ${fakeClerkJwt(userId)}`,
    "Content-Type": "application/json",
    apikey: ANON_KEY,
    Origin: origin,
  };
}

/** Standard headers for unauthenticated requests. */
export function unauthHeaders(origin = "http://localhost:8081"): HeadersInit {
  return {
    "Content-Type": "application/json",
    apikey: ANON_KEY,
    Origin: origin,
  };
}

/** Assert that a response has CORS headers with the expected origin. */
export function assertCorsHeaders(
  headers: Headers,
  expectedOrigin = "http://localhost:8081"
): void {
  const origin = headers.get("Access-Control-Allow-Origin");
  if (origin !== expectedOrigin) {
    throw new Error(
      `Expected CORS origin '${expectedOrigin}', got '${origin}'`
    );
  }
}
