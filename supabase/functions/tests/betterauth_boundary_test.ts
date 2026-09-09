/**
 * Real local integration tests for the BetterAuth-to-Supabase boundary.
 *
 * These tests intentionally use opaque BetterAuth session tokens stored in
 * public."session". They never mint a Supabase or Clerk JWT and never mock an
 * Edge Function, Stripe, or database call.
 *
 * Prerequisites (do not bypass the gateway with --no-verify-jwt):
 *   1. supabase start
 *   2. Export SUPABASE_URL, SUPABASE_ANON_KEY, and
 *      SUPABASE_SERVICE_ROLE_KEY from `supabase status -o env`.
 *   3. supabase functions serve --env-file supabase/functions/.env.local
 *   4. deno test --allow-net --allow-env --allow-read \
 *        supabase/functions/tests/betterauth_boundary_test.ts
 *
 * The suite fails when that real local service is unavailable. A skipped
 * integration test would conceal the exact auth boundary this suite protects.
 */

import {
  assert,
  assertEquals,
  assertExists,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const DEFAULT_SUPABASE_URL = "http://127.0.0.1:54321";
const DEFAULT_FUNCTIONS_URL = "http://127.0.0.1:54321/functions/v1";
const ALLOWED_ORIGIN = "http://gallery-hybrid.localhost:1355";
const REJECTED_ORIGIN = "https://attacker.invalid";
const SIGNUP_CREDITS = 3;

interface BetterAuthIdentity {
  id: string;
  email: string;
  image: string;
  name: string;
  token: string;
}

interface CreateIdentityOptions {
  expiresAt?: Date;
}

interface MemoryBook {
  ebook_generation_id?: string | null;
  id: string;
  published_at: string | null;
  status: "completed" | "published";
  title: string;
  user_id: string;
  version: number;
}

interface EbookGeneration {
  id: string;
  title: string;
  transaction_id: string | null;
}

interface CreditTransaction {
  id: string;
}

interface ProvisionResponse {
  created: boolean;
  credits: number;
  profile: {
    avatar_url: string | null;
    email: string;
    id: string;
    name: string;
    subscription_status: string;
  };
}

interface GalleryListResponse {
  books: MemoryBook[];
  legacyBooks: EbookGeneration[];
}

interface GalleryMutationResponse {
  book: MemoryBook;
  created?: boolean;
  generation?: EbookGeneration;
}

interface ProtectedFunctionCall {
  body?: Record<string, unknown>;
  method: string;
  name: string;
}

interface GatewayManifest {
  gatewayFunctions: string[];
}

const gatewayManifest: GatewayManifest = JSON.parse(
  await Deno.readTextFile(
    new URL("./betterauth_gateway_manifest.json", import.meta.url),
  ),
);

const GATEWAY_REQUESTS: Readonly<
  Record<string, Omit<ProtectedFunctionCall, "name">>
> = {
  "admin-credits": { method: "POST", body: {} },
  "check-subscription": { method: "GET" },
  "create-checkout": {
    method: "POST",
    body: { plan: "single", productType: "credits" },
  },
  credits: { method: "GET" },
  "credits-validate": { method: "POST", body: {} },
  "customer-portal": { method: "POST", body: {} },
  "gallery-books": { method: "GET" },
  "generate-video": { method: "POST", body: {} },
  "groq-api": { method: "POST", body: {} },
  "groq-storyline": { method: "POST", body: {} },
  "provision-profile": { method: "POST", body: {} },
  "runware-proxy": { method: "POST", body: {} },
  "stream-chapters": { method: "POST", body: {} },
  "stripe-portal": { method: "POST", body: {} },
  "tiktok-auth": { method: "POST", body: {} },
  "tiktok-share-analytics": { method: "POST", body: {} },
  "user-data": { method: "POST", body: { action: "get-profile", payload: {} } },
};

const PROTECTED_FUNCTIONS: readonly ProtectedFunctionCall[] = gatewayManifest
  .gatewayFunctions.map(
    (name) => ({ name, ...GATEWAY_REQUESTS[name] }),
  );

for (const candidate of PROTECTED_FUNCTIONS) {
  if (!candidate.method) {
    throw new Error(
      `Gateway manifest includes ${candidate.name} without a test request shape`,
    );
  }
}

function envValue(...names: string[]): string | undefined {
  return names.map((name) => Deno.env.get(name)).find(Boolean);
}

function requiredEnv(...names: string[]): string {
  const value = envValue(...names);
  if (value) return value;

  throw new Error(
    `Missing ${
      names.join(" or ")
    }. Start the local Supabase stack, export its ` +
      "service-role key, and serve functions before running this real integration suite.",
  );
}

function supabaseUrl(): string {
  return envValue("SUPABASE_URL", "SUPABASE_LOCAL_URL") ?? DEFAULT_SUPABASE_URL;
}

function functionsUrl(): string {
  return envValue("SUPABASE_FUNCTIONS_URL") ?? DEFAULT_FUNCTIONS_URL;
}

function anonKey(): string {
  return requiredEnv("SUPABASE_ANON_KEY", "ANON_KEY");
}

function serviceClient() {
  return createClient(
    supabaseUrl(),
    requiredEnv("SUPABASE_SERVICE_ROLE_KEY", "SERVICE_ROLE_KEY"),
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

function functionUrl(name: string): string {
  return `${functionsUrl().replace(/\/$/, "")}/${name}`;
}

function requestHeaders(token?: string, origin = ALLOWED_ORIGIN): HeadersInit {
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    "Content-Type": "application/json",
    Origin: origin,
    apikey: anonKey(),
  };
}

async function callFunction(
  name: string,
  init: RequestInit,
): Promise<Response> {
  try {
    return await fetch(functionUrl(name), {
      ...init,
      signal: AbortSignal.timeout(10_000),
    });
  } catch (cause) {
    throw new Error(
      `Unable to reach the locally served ${name} function at ${
        functionUrl(name)
      }. ` +
        "Run `supabase start` and `supabase functions serve` before this suite. " +
        `Cause: ${cause instanceof Error ? cause.message : String(cause)}`,
    );
  }
}

function assertCorsHeaders(
  response: Response,
  origin: string,
  message: string,
): void {
  assertEquals(
    response.headers.get("access-control-allow-origin"),
    origin,
    `${message}: response must reflect the reviewed origin exactly`,
  );
  assert(
    response.headers.get("vary")?.split(",").map((value) => value.trim())
      .includes("Origin"),
    `${message}: response must vary by Origin`,
  );
}

function assertRejectedCorsHeaders(response: Response, message: string): void {
  assertEquals(
    response.headers.get("access-control-allow-origin"),
    null,
    `${message}: rejected origins must receive no ACAO header`,
  );
  assert(
    response.headers.get("vary")?.split(",").map((value) => value.trim())
      .includes("Origin"),
    `${message}: rejected responses must still vary by Origin`,
  );
}

interface ReleaseBarrier {
  awaitRelease(): Promise<void>;
  waitUntilReady(): Promise<void>;
}

function createReleaseBarrier(parties: number): ReleaseBarrier {
  let arrived = 0;
  let release!: () => void;
  let ready!: () => void;
  const released = new Promise<void>((resolve) => {
    release = resolve;
  });
  const allArrived = new Promise<void>((resolve) => {
    ready = resolve;
  });

  return {
    async awaitRelease(): Promise<void> {
      arrived += 1;
      if (arrived === parties) ready();
      await released;
    },
    async waitUntilReady(): Promise<void> {
      await allArrived;
      release();
    },
  };
}

async function launchTogether<T>(
  parties: number,
  operation: () => Promise<T>,
): Promise<T[]> {
  const barrier = createReleaseBarrier(parties);
  const operations = Array.from({ length: parties }, async () => {
    await barrier.awaitRelease();
    return await operation();
  });
  await barrier.waitUntilReady();
  return await Promise.all(operations);
}

async function readJson<T>(response: Response): Promise<T> {
  const text = await response.text();
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(
      `Expected JSON from the Edge Function, received ${response.status}: ${text}`,
    );
  }
}

async function assertNoServiceError(
  operation: string,
  result: PromiseLike<{ error: { message: string } | null }>,
): Promise<void> {
  const { error } = await result;
  if (error) throw new Error(`${operation}: ${error.message}`);
}

async function createIdentity(
  label: string,
  options: CreateIdentityOptions = {},
): Promise<BetterAuthIdentity> {
  const suffix = crypto.randomUUID().replaceAll("-", "");
  const identity: BetterAuthIdentity = {
    id: `ba_${label}_${suffix}`,
    email: `${label}.${suffix}@example.test`,
    image: `https://images.example.test/${suffix}.png`,
    name: `BetterAuth ${label} ${suffix.slice(0, 8)}`,
    token: `opaque-betterauth-session-${suffix}`,
  };

  assertEquals(
    identity.token.includes("."),
    false,
    "The test token must remain opaque rather than resembling a JWT",
  );

  const service = serviceClient();
  await assertNoServiceError(
    "creating BetterAuth user",
    service.from("user").insert({
      id: identity.id,
      email: identity.email,
      image: identity.image,
      name: identity.name,
      emailVerified: true,
    }),
  );
  await assertNoServiceError(
    "creating BetterAuth session",
    service.from("session").insert({
      userId: identity.id,
      token: identity.token,
      expiresAt: (options.expiresAt ?? new Date(Date.now() + 60 * 60 * 1000))
        .toISOString(),
    }),
  );

  return identity;
}

async function cleanupIdentity(identity: BetterAuthIdentity): Promise<void> {
  const service = serviceClient();
  const deleteForUser = async (table: string, column = "user_id") => {
    const { error } = await service.from(table).delete().eq(
      column,
      identity.id,
    );
    if (error) {
      throw new Error(`cleaning ${table} for ${identity.id}: ${error.message}`);
    }
  };

  // Delete dependents explicitly so teardown works with either legacy or new FKs.
  await deleteForUser("memory_books");
  await deleteForUser("ebook_generations");
  await deleteForUser("generation_requests");
  await deleteForUser("credit_transactions");
  await deleteForUser("user_credits");
  await deleteForUser("profiles", "id");
  await deleteForUser("session", "userId");
  await assertNoServiceError(
    "cleaning BetterAuth user",
    service.from("user").delete().eq("id", identity.id),
  );
}

async function seedProfile(
  identity: BetterAuthIdentity,
  stripeCustomerId?: string,
): Promise<void> {
  const service = serviceClient();
  await assertNoServiceError(
    "seeding profile",
    service.from("profiles").upsert({
      id: identity.id,
      email: identity.email,
      name: identity.name,
      avatar_url: identity.image,
      subscription_status: "free",
      ...(stripeCustomerId ? { stripe_customer_id: stripeCustomerId } : {}),
    }, { onConflict: "id" }),
  );
}

async function seedBook(
  identity: BetterAuthIdentity,
  status: "completed" | "published",
  ebookGenerationId?: string,
): Promise<MemoryBook> {
  const service = serviceClient();
  const { data, error } = await service
    .from("memory_books")
    .insert({
      user_id: identity.id,
      title: `${status} book ${crypto.randomUUID()}`,
      chapters: [],
      ...(ebookGenerationId ? { ebook_generation_id: ebookGenerationId } : {}),
      status,
      published_at: status === "published" ? new Date().toISOString() : null,
    })
    .select("id,user_id,title,status,published_at,version,ebook_generation_id")
    .single();

  if (error) throw new Error(`seeding memory book: ${error.message}`);
  return data as MemoryBook;
}

async function seedGeneration(
  identity: BetterAuthIdentity,
  transactionId: string | null = null,
): Promise<EbookGeneration> {
  const service = serviceClient();
  const { data, error } = await service
    .from("ebook_generations")
    .insert({
      user_id: identity.id,
      title: `generation ${crypto.randomUUID()}`,
      content: JSON.stringify([{
        title: "Chapter 1",
        content: "Fixture content",
      }]),
      status: "completed",
      credits_used: 1,
      paid_with_credits: true,
      transaction_id: transactionId,
      story_type: "test-generation",
      chapter_count: 1,
      word_count: 2,
    })
    .select("id,title,transaction_id")
    .single();

  if (error) throw new Error(`seeding ebook generation: ${error.message}`);
  return data as EbookGeneration;
}

async function seedCompletedGeneration(
  identity: BetterAuthIdentity,
  idempotencyKey: string,
): Promise<CreditTransaction> {
  const service = serviceClient();
  const requestId = crypto.randomUUID();
  await assertNoServiceError(
    "seeding a post-signup balance",
    service.from("user_credits").update({
      balance: SIGNUP_CREDITS - 3,
      total_spent: 3,
    }).eq("user_id", identity.id),
  );

  const { data, error } = await service
    .from("credit_transactions")
    .insert({
      user_id: identity.id,
      amount: -3,
      credits: 3,
      transaction_type: "chapter_generation",
      description: "Fixture ebook generation debit",
      balance_after_transaction: SIGNUP_CREDITS - 3,
      metadata: {
        source: "fixture_generation_debit",
        generation_request_id: requestId,
      },
      idempotency_key: `generation:${requestId}:charge`,
      reference_id: requestId,
    })
    .select("id")
    .single();

  if (error) throw new Error(`seeding usage transaction: ${error.message}`);

  await assertNoServiceError(
    "seeding a completed generation request",
    service.from("generation_requests").insert({
      id: requestId,
      idempotency_key: idempotencyKey,
      user_id: identity.id,
      operation_type: "chapter_generation",
      credits_charged: 3,
      transaction_id: data.id,
      status: "completed",
      response_cache: { chapters: [] },
      completed_at: new Date().toISOString(),
    }),
  );

  return data as CreditTransaction;
}

async function countRows(
  table: string,
  apply: (query: any) => any,
): Promise<number> {
  const { count, error } = await apply(
    serviceClient().from(table).select("id", { count: "exact", head: true }),
  );
  if (error) throw new Error(`counting ${table}: ${error.message}`);
  return count ?? 0;
}

async function provision(
  identity: BetterAuthIdentity,
  body: Record<string, unknown> = {},
): Promise<Response> {
  return await callFunction("provision-profile", {
    method: "POST",
    headers: requestHeaders(identity.token),
    body: JSON.stringify(body),
  });
}

function generatedBookRequest(
  transactionId: string,
  idempotencyKey: string,
): Record<string, unknown> {
  return {
    idempotencyKey,
    transactionId,
    generation: {
      title: "A server-owned generated ebook",
      content: JSON.stringify([{
        title: "Chapter 1",
        content: "Server-owned content",
      }]),
      creditsUsed: 3,
      paidWithCredits: true,
      storyType: "test-generation",
      chapterCount: 1,
      wordCount: 2,
    },
    book: {
      title: "A server-owned generated ebook",
      chapters: [{ title: "Chapter 1", content: "Server-owned content" }],
      chapterCount: 1,
      wordCount: 2,
    },
  };
}

Deno.test("BetterAuth boundary: every opaque gateway enforces reflected CORS on preflight", async () => {
  for (const candidate of PROTECTED_FUNCTIONS) {
    const allowed = await callFunction(candidate.name, {
      method: "OPTIONS",
      headers: {
        Origin: ALLOWED_ORIGIN,
        "Access-Control-Request-Method": candidate.method,
        "Access-Control-Request-Headers": "authorization, content-type, apikey",
        apikey: anonKey(),
      },
    });

    assert(
      [200, 204].includes(allowed.status),
      `${candidate.name} must answer an allowed preflight request`,
    );
    assertCorsHeaders(
      allowed,
      ALLOWED_ORIGIN,
      `${candidate.name} allowed preflight`,
    );
    await allowed.body?.cancel();

    const rejected = await callFunction(candidate.name, {
      method: "OPTIONS",
      headers: {
        Origin: REJECTED_ORIGIN,
        "Access-Control-Request-Method": candidate.method,
        "Access-Control-Request-Headers": "authorization, content-type, apikey",
        apikey: anonKey(),
      },
    });

    assertEquals(
      rejected.status,
      403,
      `${candidate.name} must reject an untrusted preflight origin`,
    );
    assertRejectedCorsHeaders(rejected, `${candidate.name} rejected preflight`);
    await rejected.body?.cancel();
  }
});

Deno.test("BetterAuth boundary: actual GET, POST, and PATCH responses reject untrusted origins before auth or mutation", async () => {
  const probes: readonly ProtectedFunctionCall[] = [
    { name: "gallery-books", method: "GET" },
    { name: "provision-profile", method: "POST", body: {} },
    {
      name: "gallery-books",
      method: "PATCH",
      body: { bookId: crypto.randomUUID(), status: "published", version: 1 },
    },
  ];

  for (const probe of probes) {
    const allowed = await callFunction(probe.name, {
      method: probe.method,
      headers: requestHeaders(undefined, ALLOWED_ORIGIN),
      ...(probe.body ? { body: JSON.stringify(probe.body) } : {}),
    });
    assertEquals(
      allowed.status,
      401,
      `${probe.name} ${probe.method} must reach opaque-token authorization for an allowed origin`,
    );
    assertCorsHeaders(
      allowed,
      ALLOWED_ORIGIN,
      `${probe.name} ${probe.method} allowed response`,
    );
    await allowed.body?.cancel();

    const rejected = await callFunction(probe.name, {
      method: probe.method,
      headers: requestHeaders(undefined, REJECTED_ORIGIN),
      ...(probe.body ? { body: JSON.stringify(probe.body) } : {}),
    });
    assertEquals(
      rejected.status,
      403,
      `${probe.name} ${probe.method} must reject an untrusted actual request before auth or mutation`,
    );
    assertRejectedCorsHeaders(
      rejected,
      `${probe.name} ${probe.method} rejected response`,
    );
    await rejected.body?.cancel();
  }
});

Deno.test("BetterAuth boundary: protected functions reject missing, forged, and expired opaque tokens before effects", async () => {
  const expiredIdentity = await createIdentity("expired", {
    expiresAt: new Date(Date.now() - 60_000),
  });

  try {
    for (const candidate of PROTECTED_FUNCTIONS) {
      for (
        const token of [
          undefined,
          "forged-opaque-betterauth-token",
          expiredIdentity.token,
        ]
      ) {
        const response = await callFunction(candidate.name, {
          method: candidate.method,
          headers: requestHeaders(token),
          ...(candidate.body ? { body: JSON.stringify(candidate.body) } : {}),
        });

        assertEquals(
          response.status,
          401,
          `${candidate.name} must reject ${
            token === expiredIdentity.token
              ? "an expired"
              : token
              ? "a forged"
              : "a missing"
          } token before any mutation or external call`,
        );
        await response.body?.cancel();
      }
    }
  } finally {
    await cleanupIdentity(expiredIdentity);
  }
});

Deno.test("BetterAuth boundary: an empty provision body receives only server-derived identity and the exact signup grant", async () => {
  const identity = await createIdentity("server-derived");

  try {
    const response = await provision(identity);
    assertEquals(response.status, 200);
    const payload = await readJson<ProvisionResponse>(response);
    assertEquals(payload.profile.id, identity.id);
    assertEquals(payload.profile.email, identity.email);
    assertEquals(payload.profile.name, identity.name);
    assertEquals(payload.profile.avatar_url, identity.image);
    assertEquals(payload.profile.subscription_status, "free");
    assertEquals(payload.created, true);
    assertEquals(payload.credits, SIGNUP_CREDITS);

    const { data: storedProfile, error: profileError } = await serviceClient()
      .from("profiles")
      .select("id,email,name,avatar_url,subscription_status")
      .eq("id", identity.id)
      .single();
    if (profileError) {
      throw new Error(`reading provisioned profile: ${profileError.message}`);
    }
    assertEquals(storedProfile, {
      id: identity.id,
      email: identity.email,
      name: identity.name,
      avatar_url: identity.image,
      subscription_status: "free",
    });

    const { data: storedCredits, error: creditsError } = await serviceClient()
      .from("user_credits")
      .select("balance")
      .eq("user_id", identity.id)
      .single();
    if (creditsError) {
      throw new Error(`reading stored credit balance: ${creditsError.message}`);
    }
    assertEquals(storedCredits.balance, SIGNUP_CREDITS);

    const { data: bonuses, error: bonusError } = await serviceClient()
      .from("credit_transactions")
      .select(
        "amount,credits,transaction_type,balance_after_transaction,metadata",
      )
      .eq("user_id", identity.id)
      .eq("transaction_type", "bonus")
      .eq("metadata->>source", "signup_bonus");
    if (bonusError) {
      throw new Error(`reading signup bonus: ${bonusError.message}`);
    }
    assertEquals(bonuses?.length, 1);
    assertEquals(bonuses?.[0]?.amount, SIGNUP_CREDITS);
    assertEquals(bonuses?.[0]?.credits, SIGNUP_CREDITS);
    assertEquals(bonuses?.[0]?.balance_after_transaction, SIGNUP_CREDITS);
    assertEquals(bonuses?.[0]?.metadata, { source: "signup_bonus" });
  } finally {
    await cleanupIdentity(identity);
  }
});

Deno.test("BetterAuth boundary: client identity fields are rejected without creating profile, balance, or bonus state", async () => {
  const identity = await createIdentity("client-identity");

  try {
    const response = await provision(identity, {
      email: "attacker@example.test",
      name: "Attacker Controlled Name",
      avatar_url: "https://attacker.invalid/avatar.png",
    });

    assert(
      response.status >= 400 && response.status < 500,
      "provision-profile must reject any client-supplied identity fields",
    );
    await response.body?.cancel();

    assertEquals(
      await countRows("profiles", (query) => query.eq("id", identity.id)),
      0,
    );
    assertEquals(
      await countRows(
        "user_credits",
        (query) => query.eq("user_id", identity.id),
      ),
      0,
    );
    assertEquals(
      await countRows(
        "credit_transactions",
        (query) => query.eq("user_id", identity.id),
      ),
      0,
    );
  } finally {
    await cleanupIdentity(identity);
  }
});

Deno.test("BetterAuth boundary: a released concurrency barrier creates exactly one profile, balance, and bonus", async () => {
  const identity = await createIdentity("race");

  try {
    const responses = await launchTogether(20, () => provision(identity));

    for (const response of responses) {
      assertEquals(response.status, 200);
    }

    const payloads = await Promise.all(
      responses.map(readJson<ProvisionResponse>),
    );
    assertEquals(payloads.filter((payload) => payload.created).length, 1);
    assertEquals(payloads.filter((payload) => !payload.created).length, 19);

    const profileCount = await countRows(
      "profiles",
      (query) => query.eq("id", identity.id),
    );
    const creditCount = await countRows(
      "user_credits",
      (query) => query.eq("user_id", identity.id),
    );
    const bonusCount = await countRows(
      "credit_transactions",
      (query) =>
        query.eq("user_id", identity.id).eq("transaction_type", "bonus")
          .contains("metadata", { source: "signup_bonus" }),
    );
    assertEquals(profileCount, 1);
    assertEquals(creditCount, 1);
    assertEquals(bonusCount, 1);

    const { data: storedCredits, error } = await serviceClient()
      .from("user_credits")
      .select("balance")
      .eq("user_id", identity.id)
      .single();
    if (error) {
      throw new Error(`reading stored credit balance: ${error.message}`);
    }
    assertExists(storedCredits);

    assertEquals(storedCredits.balance, SIGNUP_CREDITS);
    for (const payload of payloads) {
      assertEquals(payload.credits, SIGNUP_CREDITS);
      assertEquals(payload.profile.email, identity.email);
    }
  } finally {
    await cleanupIdentity(identity);
  }
});

Deno.test("BetterAuth boundary: rejected-origin profile and gallery mutations have no database effect", async () => {
  const identity = await createIdentity("cors-no-effect");

  try {
    const rejectedProvision = await callFunction("provision-profile", {
      method: "POST",
      headers: requestHeaders(identity.token, REJECTED_ORIGIN),
      body: JSON.stringify({}),
    });
    assertEquals(rejectedProvision.status, 403);
    assertRejectedCorsHeaders(rejectedProvision, "rejected provision mutation");
    await rejectedProvision.body?.cancel();
    assertEquals(
      await countRows("profiles", (query) => query.eq("id", identity.id)),
      0,
    );
    assertEquals(
      await countRows(
        "user_credits",
        (query) => query.eq("user_id", identity.id),
      ),
      0,
    );

    const acceptedProvision = await provision(identity);
    assertEquals(acceptedProvision.status, 200);
    await acceptedProvision.body?.cancel();
    const privateBook = await seedBook(identity, "completed");

    const rejectedPublish = await callFunction("gallery-books", {
      method: "PATCH",
      headers: requestHeaders(identity.token, REJECTED_ORIGIN),
      body: JSON.stringify({
        bookId: privateBook.id,
        status: "published",
        version: privateBook.version,
      }),
    });
    assertEquals(rejectedPublish.status, 403);
    assertRejectedCorsHeaders(rejectedPublish, "rejected publish mutation");
    await rejectedPublish.body?.cancel();

    const { data: persisted, error } = await serviceClient()
      .from("memory_books")
      .select("status,published_at,version")
      .eq("id", privateBook.id)
      .single();
    if (error) {
      throw new Error(`reading rejected-origin book: ${error.message}`);
    }
    assertEquals(persisted, {
      status: "completed",
      published_at: null,
      version: privateBook.version,
    });
  } finally {
    await cleanupIdentity(identity);
  }
});

Deno.test("BetterAuth boundary: reprovisioning preserves a paid subscription and returns the persisted balance", async () => {
  const identity = await createIdentity("preserve-paid");

  try {
    const firstResponse = await provision(identity);
    assertEquals(firstResponse.status, 200);
    await firstResponse.body?.cancel();

    await assertNoServiceError(
      "setting paid profile state",
      serviceClient().from("profiles").update({
        credits: 41,
        subscription_status: "premium",
      }).eq("id", identity.id),
    );
    await assertNoServiceError(
      "setting paid credit balance",
      serviceClient().from("user_credits").update({
        balance: 41,
        subscription_status: "active",
        total_earned: 41,
      }).eq("user_id", identity.id),
    );

    const response = await provision(identity);
    assertEquals(response.status, 200);
    const payload = await readJson<ProvisionResponse>(response);

    assertEquals(payload.created, false);
    assertEquals(payload.credits, 41);
    assertEquals(payload.profile.subscription_status, "premium");
    assertEquals(payload.profile.email, identity.email);

    const { data: stored, error } = await serviceClient()
      .from("profiles")
      .select("email,subscription_status,credits")
      .eq("id", identity.id)
      .single();
    if (error) throw new Error(`reading paid profile: ${error.message}`);
    assertEquals(stored.email, identity.email);
    assertEquals(stored.subscription_status, "premium");
    assertEquals(stored.credits, 41);

    const bonusCount = await countRows(
      "credit_transactions",
      (query) =>
        query.eq("user_id", identity.id).eq("transaction_type", "bonus")
          .contains("metadata", { source: "signup_bonus" }),
    );
    assertEquals(bonusCount, 1);
  } finally {
    await cleanupIdentity(identity);
  }
});

Deno.test("BetterAuth boundary: gallery list is owner-isolated and same-version publishes have one winner", async () => {
  const owner = await createIdentity("gallery-owner");
  const stranger = await createIdentity("gallery-stranger");

  try {
    await seedProfile(owner);
    await seedProfile(stranger);
    const ownerBook = await seedBook(owner, "completed");
    const strangerPublishedBook = await seedBook(stranger, "published");

    const listResponse = await callFunction("gallery-books", {
      method: "GET",
      headers: requestHeaders(owner.token),
    });
    assertEquals(listResponse.status, 200);
    const listPayload = await readJson<GalleryListResponse>(listResponse);
    assert(
      listPayload.books.some((book) => book.id === ownerBook.id),
      "My eBooks must include the verified caller's private book",
    );
    assertEquals(
      listPayload.books.some((book) => book.id === strangerPublishedBook.id),
      false,
      "A stranger's published Community book must not appear in My eBooks",
    );
    assertEquals(
      listPayload.books.every((book) => book.user_id === owner.id),
      true,
      "My eBooks must contain only the verified caller's records",
    );

    const foreignPublish = await callFunction("gallery-books", {
      method: "PATCH",
      headers: requestHeaders(owner.token),
      body: JSON.stringify({
        bookId: strangerPublishedBook.id,
        status: "completed",
        version: strangerPublishedBook.version,
      }),
    });
    assertEquals(foreignPublish.status, 404);
    await foreignPublish.body?.cancel();

    const publishBody = {
      bookId: ownerBook.id,
      status: "published",
      version: ownerBook.version,
    } as const;
    const concurrentPublishes = await launchTogether(
      2,
      () =>
        callFunction("gallery-books", {
          method: "PATCH",
          headers: requestHeaders(owner.token),
          body: JSON.stringify(publishBody),
        }),
    );
    assertEquals(
      concurrentPublishes.map((response) => response.status).sort((
        left,
        right,
      ) => left - right),
      [200, 409],
      "two same-version publish attempts must produce one winner and one stale-version conflict",
    );

    const winningResponse = concurrentPublishes.find((response) =>
      response.status === 200
    );
    assertExists(winningResponse);
    const publishPayload = await readJson<GalleryMutationResponse>(
      winningResponse,
    );
    assertEquals(publishPayload.book.status, "published");
    assertExists(publishPayload.book.published_at);
    assertEquals(publishPayload.book.version, ownerBook.version + 1);
    await Promise.all(
      concurrentPublishes
        .filter((response) => response.status !== 200)
        .map((response) => response.body?.cancel()),
    );

    const { data: updatedBook, error } = await serviceClient()
      .from("memory_books")
      .select("status,published_at,version")
      .eq("id", ownerBook.id)
      .single();
    if (error) throw new Error(`reading published book: ${error.message}`);
    assertEquals(updatedBook.status, "published");
    assertExists(updatedBook.published_at);
    assertEquals(updatedBook.version, ownerBook.version + 1);

    const unpublish = await callFunction("gallery-books", {
      method: "PATCH",
      headers: requestHeaders(owner.token),
      body: JSON.stringify({
        bookId: ownerBook.id,
        status: "completed",
        version: ownerBook.version + 1,
      }),
    });
    assertEquals(
      unpublish.status,
      200,
      "the owner may unpublish with the latest version",
    );
    const unpublished = await readJson<GalleryMutationResponse>(unpublish);
    assertEquals(unpublished.book.status, "completed");
    assertEquals(unpublished.book.published_at, null);
    assertEquals(unpublished.book.version, ownerBook.version + 2);

    const anonymous = createClient(supabaseUrl(), anonKey(), {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: communityRows, error: communityError } = await anonymous
      .from("community_books")
      .select("id")
      .eq("id", ownerBook.id);
    if (communityError) {
      throw new Error(
        `reading Community after unpublish: ${communityError.message}`,
      );
    }
    assertEquals(
      communityRows,
      [],
      "unpublishing must immediately remove the book from Community",
    );
  } finally {
    await cleanupIdentity(owner);
    await cleanupIdentity(stranger);
  }
});

Deno.test("BetterAuth boundary: gallery creation rejects client ownership and another user's transaction", async () => {
  const owner = await createIdentity("gallery-transaction-owner");
  const attacker = await createIdentity("gallery-transaction-attacker");

  try {
    const ownerProvision = await provision(owner);
    assertEquals(ownerProvision.status, 200);
    await ownerProvision.body?.cancel();
    const attackerProvision = await provision(attacker);
    assertEquals(attackerProvision.status, 200);
    await attackerProvision.body?.cancel();
    const ownerGenerationKey = `owner-generation-${crypto.randomUUID()}`;
    const ownerTransaction = await seedCompletedGeneration(
      owner,
      ownerGenerationKey,
    );

    const attackerGenerationCount = await countRows(
      "ebook_generations",
      (query) => query.eq("user_id", attacker.id),
    );
    const attackerBookCount = await countRows(
      "memory_books",
      (query) => query.eq("user_id", attacker.id),
    );
    const attackerTransactionCount = await countRows(
      "credit_transactions",
      (query) => query.eq("user_id", attacker.id),
    );

    const clientOwnerResponse = await callFunction("gallery-books", {
      method: "POST",
      headers: requestHeaders(attacker.token),
      body: JSON.stringify({
        ...generatedBookRequest(
          ownerTransaction.id,
          `foreign-${crypto.randomUUID()}`,
        ),
        userId: owner.id,
      }),
    });
    assertEquals(
      clientOwnerResponse.status,
      400,
      "gallery-books must reject a browser-supplied owner id",
    );
    await clientOwnerResponse.body?.cancel();

    const foreignTransactionResponse = await callFunction("gallery-books", {
      method: "POST",
      headers: requestHeaders(attacker.token),
      body: JSON.stringify(
        generatedBookRequest(
          ownerTransaction.id,
          `foreign-transaction-${crypto.randomUUID()}`,
        ),
      ),
    });
    assertEquals(
      foreignTransactionResponse.status,
      403,
      "gallery-books must reject another user's debit even when no owner field is supplied",
    );
    await foreignTransactionResponse.body?.cancel();

    assertEquals(
      await countRows(
        "ebook_generations",
        (query) => query.eq("user_id", attacker.id),
      ),
      attackerGenerationCount,
    );
    assertEquals(
      await countRows(
        "memory_books",
        (query) => query.eq("user_id", attacker.id),
      ),
      attackerBookCount,
    );
    assertEquals(
      await countRows(
        "credit_transactions",
        (query) => query.eq("user_id", attacker.id),
      ),
      attackerTransactionCount,
    );
  } finally {
    await cleanupIdentity(owner);
    await cleanupIdentity(attacker);
  }
});

Deno.test("BetterAuth boundary: gallery creation is private and replays one generation, one book, and one debit", async () => {
  const identity = await createIdentity("gallery-replay");

  try {
    const provisionResponse = await provision(identity);
    assertEquals(provisionResponse.status, 200);
    await provisionResponse.body?.cancel();
    const idempotencyKey = `gallery-replay-${crypto.randomUUID()}`;
    const transaction = await seedCompletedGeneration(identity, idempotencyKey);
    const request = generatedBookRequest(transaction.id, idempotencyKey);

    const disguisedAsFree = structuredClone(request);
    (disguisedAsFree.generation as Record<string, unknown>).creditsUsed = 0;
    (disguisedAsFree.generation as Record<string, unknown>).paidWithCredits =
      false;
    const disguisedResponse = await callFunction("gallery-books", {
      method: "POST",
      headers: requestHeaders(identity.token),
      body: JSON.stringify(disguisedAsFree),
    });
    assertEquals(
      disguisedResponse.status,
      400,
      "gallery-books must reject payment metadata that hides the completed charge",
    );
    await disguisedResponse.body?.cancel();
    assertEquals(
      await countRows(
        "ebook_generations",
        (query) => query.eq("user_id", identity.id),
      ),
      0,
    );

    const responses = await launchTogether(
      2,
      () =>
        callFunction("gallery-books", {
          method: "POST",
          headers: requestHeaders(identity.token),
          body: JSON.stringify(request),
        }),
    );
    assertEquals(responses.map((response) => response.status), [200, 200]);
    const payloads = await Promise.all(
      responses.map(readJson<GalleryMutationResponse>),
    );
    assertEquals(
      payloads.filter((payload) => payload.created === true).length,
      1,
    );
    assertEquals(
      payloads.filter((payload) => payload.created === false).length,
      1,
    );
    assertEquals(
      new Set(payloads.map((payload) => payload.generation?.id)).size,
      1,
    );
    assertEquals(new Set(payloads.map((payload) => payload.book.id)).size, 1);
    assertEquals(payloads[0]?.book.status, "completed");
    assertEquals(payloads[0]?.book.published_at, null);

    const { data: generations, error: generationsError } = await serviceClient()
      .from("ebook_generations")
      .select("id,transaction_id")
      .eq("user_id", identity.id)
      .eq("transaction_id", transaction.id);
    if (generationsError) {
      throw new Error(
        `reading replayed generations: ${generationsError.message}`,
      );
    }
    assertEquals(generations?.length, 1);
    assertExists(generations?.[0]?.id);

    assertEquals(
      await countRows(
        "memory_books",
        (query) =>
          query.eq("user_id", identity.id).eq(
            "ebook_generation_id",
            generations?.[0]?.id,
          ),
      ),
      1,
    );
    assertEquals(
      await countRows(
        "credit_transactions",
        (query) => query.eq("user_id", identity.id),
      ),
      2,
      "the signup bonus plus the supplied debit are the only ledger rows",
    );

    const alteredContent = structuredClone(request);
    (alteredContent.generation as Record<string, unknown>).title =
      "Replay payload was altered";
    const alteredContentResponse = await callFunction("gallery-books", {
      method: "POST",
      headers: requestHeaders(identity.token),
      body: JSON.stringify(alteredContent),
    });
    assertEquals(
      alteredContentResponse.status,
      409,
      "reusing an idempotency key with changed generation content must be rejected",
    );
    await alteredContentResponse.body?.cancel();

    const alteredKeyResponse = await callFunction("gallery-books", {
      method: "POST",
      headers: requestHeaders(identity.token),
      body: JSON.stringify(
        generatedBookRequest(
          transaction.id,
          `reused-debit-${crypto.randomUUID()}`,
        ),
      ),
    });
    assertEquals(
      alteredKeyResponse.status,
      403,
      "a debit cannot be reused without its completed generation request",
    );
    await alteredKeyResponse.body?.cancel();

    assertEquals(
      await countRows(
        "credit_transactions",
        (query) => query.eq("user_id", identity.id),
      ),
      2,
      "replay conflicts must not create another debit",
    );
  } finally {
    await cleanupIdentity(identity);
  }
});

Deno.test("BetterAuth boundary: the retired user-data book writer cannot bypass gallery provenance", async () => {
  const identity = await createIdentity("retired-book-writer");

  try {
    const provisionResponse = await provision(identity);
    assertEquals(provisionResponse.status, 200);
    await provisionResponse.body?.cancel();

    const response = await callFunction("user-data", {
      method: "POST",
      headers: requestHeaders(identity.token),
      body: JSON.stringify({
        action: "save-generated-book",
        payload: {
          idempotencyKey: `retired-${crypto.randomUUID()}`,
          generation: { title: "Unproven", content: "[]" },
          book: { title: "Unproven", chapters: [] },
        },
      }),
    });

    assertEquals(response.status, 400);
    await response.body?.cancel();
    assertEquals(
      await countRows(
        "ebook_generations",
        (query) => query.eq("user_id", identity.id),
      ),
      0,
    );
    assertEquals(
      await countRows(
        "memory_books",
        (query) => query.eq("user_id", identity.id),
      ),
      0,
    );
  } finally {
    await cleanupIdentity(identity);
  }
});

Deno.test("BetterAuth boundary: gallery legacy fallback omits generations that already have a canonical memory book", async () => {
  const identity = await createIdentity("gallery-legacy");

  try {
    await seedProfile(identity);
    const canonicalGeneration = await seedGeneration(identity);
    const canonicalBook = await seedBook(
      identity,
      "completed",
      canonicalGeneration.id,
    );
    const legacyOnlyGeneration = await seedGeneration(identity);

    const response = await callFunction("gallery-books", {
      method: "GET",
      headers: requestHeaders(identity.token),
    });
    assertEquals(response.status, 200);
    const payload = await readJson<GalleryListResponse>(response);
    assert(
      payload.books.some((book) => book.id === canonicalBook.id),
      "the canonical memory book must remain in My eBooks",
    );
    assert(
      payload.legacyBooks.some((generation) =>
        generation.id === legacyOnlyGeneration.id
      ),
      "an old generation without a memory book must remain available as a fallback",
    );
    assertEquals(
      payload.legacyBooks.some((generation) =>
        generation.id === canonicalGeneration.id
      ),
      false,
      "a legacy row that already has a memory_books copy must not be duplicated",
    );
  } finally {
    await cleanupIdentity(identity);
  }
});

Deno.test("BetterAuth boundary: anonymous Community uses only the reviewed public projection", async () => {
  const identity = await createIdentity("community");

  try {
    await seedProfile(identity);
    const privateBook = await seedBook(identity, "completed");
    const publishedBook = await seedBook(identity, "published");

    const anonymous = createClient(supabaseUrl(), anonKey(), {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data, error } = await anonymous
      .from("community_books")
      .select("*")
      .in("id", [privateBook.id, publishedBook.id]);
    if (error) {
      throw new Error(`querying anonymous Community books: ${error.message}`);
    }

    assertEquals(data?.map((book) => book.id), [publishedBook.id]);
    assertEquals(data?.[0]?.status, "published");
    assertExists(data?.[0]?.published_at);
    for (
      const privateColumn of [
        "chapters",
        "user_id",
        "ebook_generation_id",
        "generation_settings",
        "style_preferences",
        "pdf_url",
      ]
    ) {
      assertEquals(
        Object.hasOwn(data?.[0] ?? {}, privateColumn),
        false,
        `community_books must not expose ${privateColumn}`,
      );
    }
  } finally {
    await cleanupIdentity(identity);
  }
});

Deno.test("BetterAuth boundary: Stripe portal ignores client customer ids and uses each verified profile's stored customer", async () => {
  const expectedStripeBase = requiredEnv("STRIPE_TEST_API_BASE");
  assertEquals(
    expectedStripeBase,
    "http://127.0.0.1:5566/v1",
    "serve stripe-portal with STRIPE_API_BASE=http://127.0.0.1:5566/v1 for this fake transport",
  );

  const seenCustomers: string[] = [];
  const stripeServer = Deno.serve({
    hostname: "0.0.0.0",
    port: 5566,
    onListen: () => {},
  }, async (request) => {
    if (
      request.method !== "POST" ||
      !new URL(request.url).pathname.endsWith("/billing_portal/sessions")
    ) {
      return new Response("not found", { status: 404 });
    }
    const body = new URLSearchParams(await request.text());
    const customer = body.get("customer");
    if (!customer) {
      return new Response(JSON.stringify({ error: "customer required" }), {
        status: 400,
      });
    }
    seenCustomers.push(customer);
    return new Response(
      JSON.stringify({
        id: `bps_${customer}`,
        object: "billing_portal.session",
        url: `https://portal.example.test/${customer}`,
      }),
      { headers: { "Content-Type": "application/json" } },
    );
  });
  const first = await createIdentity("portal-first");
  const second = await createIdentity("portal-second");
  const firstCustomer = `cus_first_${crypto.randomUUID().replaceAll("-", "")}`;
  const secondCustomer = `cus_second_${
    crypto.randomUUID().replaceAll("-", "")
  }`;

  try {
    await seedProfile(first, firstCustomer);
    await seedProfile(second, secondCustomer);

    const barrier = createReleaseBarrier(2);
    const callPortal = async (
      caller: BetterAuthIdentity,
      attackerCustomer: string,
    ) => {
      await barrier.awaitRelease();
      return await callFunction("stripe-portal", {
        method: "POST",
        headers: requestHeaders(caller.token),
        body: JSON.stringify({ customerId: attackerCustomer }),
      });
    };
    const firstPromise = callPortal(first, secondCustomer);
    const secondPromise = callPortal(second, firstCustomer);
    await barrier.waitUntilReady();
    const [firstPortal, secondPortal] = await Promise.all([
      firstPromise,
      secondPromise,
    ]);

    assertEquals(firstPortal.status, 200);
    assertEquals(secondPortal.status, 200);
    assertCorsHeaders(
      firstPortal,
      ALLOWED_ORIGIN,
      "first Stripe portal response",
    );
    assertCorsHeaders(
      secondPortal,
      ALLOWED_ORIGIN,
      "second Stripe portal response",
    );
    await firstPortal.body?.cancel();
    await secondPortal.body?.cancel();
    assertEquals(
      seenCustomers.sort(),
      [firstCustomer, secondCustomer].sort(),
      "each portal session must use the customer stored for its verified profile, never the request body",
    );
  } finally {
    await cleanupIdentity(first);
    await cleanupIdentity(second);
    await stripeServer.shutdown();
  }
});

Deno.test("BetterAuth boundary: valid opaque requests reach profile validation before Stripe or method rejection", async () => {
  const identity = await createIdentity("stripe-profile-missing");

  try {
    const portal = await callFunction("stripe-portal", {
      method: "POST",
      headers: requestHeaders(identity.token),
      body: JSON.stringify({ customerId: "cus_attacker_controlled" }),
    });
    assertEquals(
      portal.status,
      404,
      "a valid opaque POST must reach verified-user profile validation before Stripe configuration or a method rejection",
    );
    const portalBody = await readJson<{ error?: string }>(portal);
    assert(
      portalBody.error?.toLowerCase().includes("profile"),
      "stripe-portal must report the verified caller's missing profile rather than use request identity",
    );

    const checkout = await callFunction("create-checkout", {
      method: "POST",
      headers: requestHeaders(identity.token),
      body: JSON.stringify({ plan: "not-a-real-plan", productType: "credits" }),
    });
    assertEquals(
      checkout.status,
      400,
      "An authenticated invalid checkout request must reach application validation before Stripe",
    );
    await checkout.body?.cancel();
  } finally {
    await cleanupIdentity(identity);
  }
});
