/**
 * Integration tests for the credits Edge Function.
 *
 * Prerequisites:
 *   supabase start
 *   supabase functions serve
 *
 * Run:
 *   deno test --allow-net --allow-env supabase/functions/tests/credits_test.ts
 */

import {
  assertEquals,
  assertExists,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  functionUrl,
  authHeaders,
  unauthHeaders,
  assertCorsHeaders,
} from "./helpers.ts";

const FUNCTION_NAME = "credits";

Deno.test("credits - CORS preflight returns 200 with correct headers", async () => {
  const res = await fetch(functionUrl(FUNCTION_NAME), {
    method: "OPTIONS",
    headers: { Origin: "http://localhost:8081" },
  });

  assertEquals(res.status, 200);
  assertCorsHeaders(res.headers, "http://localhost:8081");
  await res.body?.cancel();
});

Deno.test("credits - CORS rejects unknown origin", async () => {
  const res = await fetch(functionUrl(FUNCTION_NAME), {
    method: "OPTIONS",
    headers: { Origin: "https://evil.com" },
  });

  assertEquals(res.status, 200); // preflight still returns 200
  // But origin should fall back to default, not echo the attacker origin
  const origin = res.headers.get("Access-Control-Allow-Origin");
  assertEquals(origin, "http://localhost:8081");
  await res.body?.cancel();
});

Deno.test("credits - returns 401 for unauthenticated request", async () => {
  const res = await fetch(functionUrl(FUNCTION_NAME), {
    method: "GET",
    headers: unauthHeaders(),
  });

  assertEquals(res.status, 401);
  const body = await res.json();
  assertEquals(body.success, false);
  assertExists(body.error);
});

Deno.test("credits - returns 401 for invalid token", async () => {
  const res = await fetch(functionUrl(FUNCTION_NAME), {
    method: "GET",
    headers: {
      Authorization: "Bearer not-a-valid-jwt",
      "Content-Type": "application/json",
      Origin: "http://localhost:8081",
    },
  });

  assertEquals(res.status, 401);
  const body = await res.json();
  assertEquals(body.success, false);
});

Deno.test("credits - returns 405 for unsupported methods", async () => {
  const res = await fetch(functionUrl(FUNCTION_NAME), {
    method: "DELETE",
    headers: authHeaders("user_test_123"),
  });

  assertEquals(res.status, 405);
  const body = await res.json();
  assertEquals(body.success, false);
});

Deno.test("credits - returns credit data for authenticated user", async () => {
  // Note: This test requires a user_credits row for this user ID in the local DB.
  // If no row exists, the function returns 503 (unable to fetch).
  const res = await fetch(functionUrl(FUNCTION_NAME), {
    method: "GET",
    headers: authHeaders("user_test_credits"),
  });

  const body = await res.json();

  // Either 200 with data or 503 if no DB record exists
  if (res.status === 200) {
    assertEquals(body.success, true);
    assertExists(body.data);
    assertExists(body.data.balance);
    assertEquals(typeof body.data.balance.balance, "number");
  } else {
    assertEquals(res.status, 503);
    assertEquals(body.success, false);
  }
});

Deno.test("credits - returns 503 when database unavailable (not mock data)", async () => {
  // This test verifies that mock data fallbacks have been removed.
  // A user that doesn't exist in the DB should get 503, not fake data.
  const res = await fetch(functionUrl(FUNCTION_NAME), {
    method: "GET",
    headers: authHeaders("user_definitely_does_not_exist_" + Date.now()),
  });

  const body = await res.json();

  // Should be 503 (database returned no data), NOT 200 with mock data
  assertEquals(res.status, 503);
  assertEquals(body.success, false);
  assertEquals(body.error, "Unable to fetch credit data");
});
