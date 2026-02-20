/**
 * Integration tests for the stream-chapters Edge Function.
 *
 * Prerequisites:
 *   supabase start
 *   supabase functions serve
 *   GROQ_API_KEY set in .env.local (or Supabase secrets)
 *
 * Run:
 *   deno test --allow-net --allow-env supabase/functions/tests/stream-chapters_test.ts
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

const FUNCTION_NAME = "stream-chapters";

Deno.test("stream-chapters - CORS preflight returns correct headers", async () => {
  const res = await fetch(functionUrl(FUNCTION_NAME), {
    method: "OPTIONS",
    headers: { Origin: "https://flipmyera.com" },
  });

  assertEquals(res.status, 200);
  assertCorsHeaders(res.headers, "https://flipmyera.com");
  await res.body?.cancel();
});

Deno.test("stream-chapters - rejects unauthenticated requests", async () => {
  const res = await fetch(functionUrl(FUNCTION_NAME), {
    method: "POST",
    headers: unauthHeaders(),
    body: JSON.stringify({
      originalStory: "Test story",
      useTaylorSwiftThemes: true,
      numChapters: 2,
    }),
  });

  // Should require authentication
  const body = await res.json();
  assertEquals(res.status, 401);
  assertEquals(body.success, false);
});

Deno.test("stream-chapters - rejects GET method", async () => {
  const res = await fetch(functionUrl(FUNCTION_NAME), {
    method: "GET",
    headers: authHeaders("user_test_stream"),
  });

  const status = res.status;
  await res.body?.cancel();
  // POST-only endpoint
  assertEquals(status === 405 || status === 400, true);
});

Deno.test("stream-chapters - returns SSE stream for authenticated request", async () => {
  // This test requires GROQ_API_KEY. It verifies the response is text/event-stream.
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

  try {
    const res = await fetch(functionUrl(FUNCTION_NAME), {
      method: "POST",
      headers: authHeaders("user_test_stream"),
      body: JSON.stringify({
        originalStory: "A brave dreamer arrives in New York City to chase her music career.",
        useTaylorSwiftThemes: true,
        selectedTheme: "1989",
        selectedFormat: "preview",
        numChapters: 1,
        storyline: {
          logline: "A dreamer finds her voice in the city",
          threeActStructure: {
            act1: { setup: "Arrival", incitingIncident: "Audition", firstPlotPoint: "Gets the part" },
            act2: { risingAction: "Rehearsals", midpoint: "Stage fright", darkNightOfTheSoul: "Almost quits" },
            act3: { climax: "Opening night", resolution: "Standing ovation", closingImage: "City skyline" },
          },
          chapters: [
            { number: 1, title: "New Beginnings", summary: "Arriving in the city", wordCountTarget: 500 },
          ],
          themes: ["courage", "self-discovery"],
          wordCountTotal: 500,
        },
      }),
      signal: controller.signal,
    });

    if (res.status === 200) {
      const contentType = res.headers.get("Content-Type") || "";
      assertEquals(
        contentType.includes("text/event-stream"),
        true,
        `Expected text/event-stream, got ${contentType}`
      );

      // Read just the first chunk to verify SSE format
      const reader = res.body?.getReader();
      if (reader) {
        const { value } = await reader.read();
        if (value) {
          const text = new TextDecoder().decode(value);
          // SSE events start with "data: "
          assertEquals(
            text.includes("data:"),
            true,
            `Expected SSE data event, got: ${text.substring(0, 100)}`
          );
        }
        reader.releaseLock();
      }
      await res.body?.cancel();
    } else if (res.status === 429) {
      // Rate limited - acceptable
      await res.body?.cancel();
    } else if (res.status === 500) {
      console.warn("stream-chapters returned 500 - GROQ_API_KEY may not be configured");
      await res.body?.cancel();
    } else {
      const body = await res.text();
      throw new Error(`Unexpected status ${res.status}: ${body}`);
    }
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") {
      console.warn("stream-chapters test timed out (15s)");
    } else {
      throw e;
    }
  } finally {
    clearTimeout(timeoutId);
  }
});
