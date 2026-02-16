/**
 * Integration tests for the credits-validate Edge Function.
 *
 * Prerequisites:
 *   supabase start
 *   supabase functions serve
 *
 * Run:
 *   deno test --allow-net --allow-env supabase/functions/tests/credits-validate_test.ts
 */

import {
  assertEquals,
  assertExists,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  functionUrl,
  authHeaders,
  unauthHeaders,
} from "./helpers.ts";

const FUNCTION_NAME = "credits-validate";

Deno.test("credits-validate - returns 401 for unauthenticated request", async () => {
  const res = await fetch(functionUrl(FUNCTION_NAME), {
    method: "POST",
    headers: unauthHeaders(),
    body: JSON.stringify({ requiredCredits: 1 }),
  });

  assertEquals(res.status, 401);
  const body = await res.json();
  assertEquals(body.success, false);
});

Deno.test("credits-validate - CORS preflight returns 200", async () => {
  const res = await fetch(functionUrl(FUNCTION_NAME), {
    method: "OPTIONS",
    headers: { Origin: "http://localhost:8081" },
  });

  assertEquals(res.status, 200);
  await res.body?.cancel();
});

Deno.test("credits-validate - returns 503 for non-existent user (not mock data)", async () => {
  const res = await fetch(functionUrl(FUNCTION_NAME), {
    method: "POST",
    headers: authHeaders("user_nonexistent_" + Date.now()),
    body: JSON.stringify({ requiredCredits: 1 }),
  });

  const body = await res.json();

  // Should be 503, not 200 with mock validation data
  assertEquals(res.status, 503);
  assertEquals(body.success, false);
});

Deno.test("credits-validate - validates credit requirement for authenticated user", async () => {
  const res = await fetch(functionUrl(FUNCTION_NAME), {
    method: "POST",
    headers: authHeaders("user_test_credits"),
    body: JSON.stringify({ requiredCredits: 1 }),
  });

  const body = await res.json();

  // Either validates successfully or returns 503 if no DB record
  if (res.status === 200) {
    assertEquals(body.success, true);
    assertExists(body.data);
    assertEquals(typeof body.data.hasEnoughCredits, "boolean");
    assertEquals(typeof body.data.currentBalance, "number");
  } else {
    assertEquals(res.status, 503);
  }
});
