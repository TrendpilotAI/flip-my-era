/**
 * Integration tests for the stripe-webhook Edge Function.
 *
 * Prerequisites:
 *   supabase start
 *   supabase functions serve
 *
 * Run:
 *   deno test --allow-net --allow-env supabase/functions/tests/stripe-webhook_test.ts
 */

import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { functionUrl, unauthHeaders } from "./helpers.ts";

const FUNCTION_NAME = "stripe-webhook";

Deno.test("stripe-webhook - rejects requests without Stripe signature", async () => {
  const res = await fetch(functionUrl(FUNCTION_NAME), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: "http://localhost:8081",
    },
    body: JSON.stringify({ type: "checkout.session.completed" }),
  });

  // Should reject without stripe-signature header
  const status = res.status;
  await res.body?.cancel();
  assertEquals(status === 400 || status === 401 || status === 500, true);
});

Deno.test("stripe-webhook - rejects GET requests", async () => {
  const res = await fetch(functionUrl(FUNCTION_NAME), {
    method: "GET",
    headers: unauthHeaders(),
  });

  const status = res.status;
  await res.body?.cancel();
  // Webhooks are POST-only
  assertEquals(status === 405 || status === 400 || status === 500, true);
});

Deno.test("stripe-webhook - rejects invalid signature", async () => {
  const res = await fetch(functionUrl(FUNCTION_NAME), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "stripe-signature": "t=1234567890,v1=invalid_signature",
    },
    body: JSON.stringify({
      id: "evt_test",
      type: "checkout.session.completed",
      data: { object: {} },
    }),
  });

  const status = res.status;
  await res.body?.cancel();
  // Should fail signature verification
  assertEquals(status === 400 || status === 401 || status === 500, true);
});
