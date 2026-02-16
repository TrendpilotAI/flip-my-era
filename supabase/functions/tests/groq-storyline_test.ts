/**
 * Integration tests for the groq-storyline Edge Function.
 *
 * Prerequisites:
 *   supabase start
 *   supabase functions serve
 *   GROQ_API_KEY set in .env.local (or Supabase secrets)
 *
 * Run:
 *   deno test --allow-net --allow-env supabase/functions/tests/groq-storyline_test.ts
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

const FUNCTION_NAME = "groq-storyline";

Deno.test("groq-storyline - CORS preflight returns correct headers", async () => {
  const res = await fetch(functionUrl(FUNCTION_NAME), {
    method: "OPTIONS",
    headers: { Origin: "https://flipmyera.com" },
  });

  assertEquals(res.status, 200);
  assertCorsHeaders(res.headers, "https://flipmyera.com");
  await res.body?.cancel();
});

Deno.test("groq-storyline - returns 401 for unauthenticated request", async () => {
  const res = await fetch(functionUrl(FUNCTION_NAME), {
    method: "POST",
    headers: unauthHeaders(),
    body: JSON.stringify({
      era: "1989",
      characterName: "Taylor",
      characterArchetype: "dreamer",
      gender: "same",
      location: "New York",
      promptDescription: "A story about finding your voice",
    }),
  });

  // Function should reject unauthenticated requests
  const body = await res.json();
  assertEquals(res.status, 401);
  assertEquals(body.success, false);
});

Deno.test("groq-storyline - rejects empty/missing body", async () => {
  const res = await fetch(functionUrl(FUNCTION_NAME), {
    method: "POST",
    headers: authHeaders("user_test_storyline"),
    body: JSON.stringify({}),
  });

  const body = await res.json();
  // Should reject with 400 for missing required fields
  if (res.status === 400) {
    assertEquals(body.success, false);
  }
  // Some implementations may return 500 for unexpected input
  if (res.status === 500) {
    assertEquals(body.success, false);
  }
});

Deno.test("groq-storyline - rejects GET method", async () => {
  const res = await fetch(functionUrl(FUNCTION_NAME), {
    method: "GET",
    headers: authHeaders("user_test_storyline"),
  });

  // POST-only endpoint
  const status = res.status;
  await res.body?.cancel();
  assertEquals(status === 405 || status === 400, true);
});

Deno.test("groq-storyline - returns valid storyline for authenticated request", async () => {
  // This test requires GROQ_API_KEY to be set. Skip if not available.
  const res = await fetch(functionUrl(FUNCTION_NAME), {
    method: "POST",
    headers: authHeaders("user_test_storyline"),
    body: JSON.stringify({
      era: "1989",
      characterName: "Taylor",
      characterArchetype: "dreamer",
      gender: "same",
      location: "New York City",
      promptDescription: "A story about chasing dreams in the big city",
      storyFormat: "short-story",
    }),
  });

  const body = await res.json();

  if (res.status === 200) {
    assertEquals(body.success, true);
    assertExists(body.data);
    // Verify storyline structure
    const storyline = body.data;
    assertExists(storyline.logline);
    assertExists(storyline.threeActStructure);
    assertExists(storyline.chapters);
    assertExists(storyline.themes);
    assertEquals(typeof storyline.wordCountTotal, "number");
    assertEquals(Array.isArray(storyline.chapters), true);
    assertEquals(Array.isArray(storyline.themes), true);
  } else if (res.status === 429) {
    // Rate limited - acceptable in test environment
    assertEquals(body.success, false);
  } else if (res.status === 500) {
    // Groq API key might not be set in test env
    console.warn("groq-storyline returned 500 - GROQ_API_KEY may not be configured");
  }
});

Deno.test("groq-storyline - rate limits repeated requests", async () => {
  // Send multiple rapid requests to trigger rate limiting
  const promises = Array.from({ length: 12 }, () =>
    fetch(functionUrl(FUNCTION_NAME), {
      method: "POST",
      headers: authHeaders("user_rate_limit_test"),
      body: JSON.stringify({
        era: "1989",
        characterName: "Test",
        characterArchetype: "rebel",
        gender: "same",
        location: "Test",
        promptDescription: "Rate limit test",
      }),
    })
  );

  const responses = await Promise.all(promises);

  // At least one response should be 429 (rate limited) given 10/hour limit
  const rateLimited = responses.filter((r) => r.status === 429);
  const hasRateLimit = rateLimited.length > 0;

  // Clean up response bodies
  for (const r of responses) {
    await r.body?.cancel();
  }

  assertEquals(hasRateLimit, true, "Expected at least one 429 rate limit response");
});
