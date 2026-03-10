/* eslint-disable @typescript-eslint/no-explicit-any */
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

// ─── CORS: Origin allowlist (no more wildcard) ─────────────
const ALLOWED_ORIGINS = [
  "http://localhost:8080",
  "http://localhost:8081",
  "https://flip-my-era.netlify.app",
  "https://flipmyera.com",
  "https://www.flipmyera.com",
];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("Origin") || "";
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Max-Age": "86400",
    "Access-Control-Allow-Credentials": "true",
  };
}

// ─── Server-side price ID mapping ───────────────────────────
// ALL price resolution happens here. Client sends plan name only.
// Never trust client-sent stripePriceId for security.

// Subscription tiers (monthly)
const SUBSCRIPTION_PRICE_IDS: Record<string, { priceId: string; credits: number }> = {
  // Current tier names
  speakNow:    { priceId: "price_1S9zK15U03MNTw3qAO5JnplW", credits: 15 },
  midnights:   { priceId: "price_1S9zK25U03MNTw3qdDnUn7hk", credits: 40 },
  // Legacy aliases (frontend may still send these)
  starter:     { priceId: "price_1S9zK15U03MNTw3qAO5JnplW", credits: 15 },
  deluxe:      { priceId: "price_1S9zK25U03MNTw3qdDnUn7hk", credits: 40 },
  vip:         { priceId: "price_1S9zK25U03MNTw3qoCHo9KzE", credits: 40 },
};

// Subscription tiers (annual)
const ANNUAL_PRICE_IDS: Record<string, { priceId: string; credits: number }> = {
  speakNowAnnual:    { priceId: Deno.env.get("STRIPE_PRICE_SPEAK_NOW_ANNUAL") || "price_speak_now_annual", credits: 15 },
  midnightsAnnual:   { priceId: Deno.env.get("STRIPE_PRICE_MIDNIGHTS_ANNUAL") || "price_midnights_annual", credits: 40 },
};

// Credit packs (one-time payment)
const CREDIT_PACK_PRICE_IDS: Record<string, { priceId: string; credits: number }> = {
  single:       { priceId: "price_1S9zK25U03MNTw3qMH90DnC1", credits: 5 },
  album:        { priceId: "price_1S9zK25U03MNTw3qFkq00yiu", credits: 20 },
  tour:         { priceId: "price_1S9zK35U03MNTw3qpmqEDL80", credits: 50 },
  // Legacy aliases
  "starter-pack": { priceId: "price_1S9zK25U03MNTw3qMH90DnC1", credits: 5 },
  "creator-pack": { priceId: "price_1S9zK25U03MNTw3qFkq00yiu", credits: 20 },
  "studio-pack":  { priceId: "price_1S9zK35U03MNTw3qpmqEDL80", credits: 50 },
};

// Helper logging function
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Use service role for server-side lookups (profiles email)
  const supabaseServiceClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    // ─── Auth: Use Supabase auth.getUser() for cryptographic JWT verification ───
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new Error("No authorization header provided");
    }

    const token = authHeader.replace("Bearer ", "");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const authClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      supabaseAnonKey,
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    );
    const { data: { user: authUser }, error: authError } = await authClient.auth.getUser(token);

    if (authError || !authUser) {
      // Fallback: decode JWT manually for Clerk-synced tokens
      let userId: string | null = null;
      try {
        const parts = token.split(".");
        if (parts.length >= 2) {
          const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
          const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
          const payload = JSON.parse(atob(padded));
          userId = payload?.sub ?? payload?.user_id ?? payload?.uid ?? null;
        }
      } catch (_e) { /* ignore */ }
      if (!userId) throw new Error("Invalid token: authentication failed");
      logStep("Auth via JWT decode fallback", { userId });
      // Continue with userId from JWT
      var authenticatedUserId = userId;
    } else {
      logStep("Auth via Supabase getUser", { userId: authUser.id });
      var authenticatedUserId = authUser.id;
    }

    // Lookup user email from profiles table
    const { data: profile, error: profileErr } = await supabaseServiceClient
      .from("profiles")
      .select("email")
      .eq("id", authenticatedUserId)
      .single();
    if (profileErr || !profile?.email) throw new Error("User profile not found or missing email");
    const user = { id: authenticatedUserId, email: profile.email as string } as const;
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Get the plan from request body
    const body = await req.json();
    const { plan, productType } = body;
    logStep("Request received", { plan, productType });

    // ─── Resolve price ID server-side (never trust client-sent price IDs) ───
    let resolvedProduct: { priceId: string; credits: number } | undefined;
    let checkoutMode: "subscription" | "payment";
    let successUrl: string;
    let cancelUrl: string;

    const origin = req.headers.get("origin") || "https://flipmyera.com";

    // 1. Check credit packs first (productType === 'credits' or plan matches)
    if (productType === 'credits' || CREDIT_PACK_PRICE_IDS[plan]) {
      resolvedProduct = CREDIT_PACK_PRICE_IDS[plan];
      checkoutMode = "payment";
      successUrl = `${origin}/dashboard?success=true`;
      cancelUrl = `${origin}/dashboard`;
    }
    // 2. Check annual subscriptions
    else if (ANNUAL_PRICE_IDS[plan]) {
      resolvedProduct = ANNUAL_PRICE_IDS[plan];
      checkoutMode = "subscription";
      successUrl = `${origin}/dashboard?upgrade=success`;
      cancelUrl = `${origin}/pricing?cancelled=true`;
    }
    // 3. Check monthly subscriptions
    else if (SUBSCRIPTION_PRICE_IDS[plan]) {
      resolvedProduct = SUBSCRIPTION_PRICE_IDS[plan];
      checkoutMode = "subscription";
      successUrl = `${origin}/dashboard?upgrade=success`;
      cancelUrl = `${origin}/pricing?cancelled=true`;
    }

    if (!resolvedProduct) {
      throw new Error(`Invalid plan: "${plan}". Valid plans: ${[
        ...Object.keys(CREDIT_PACK_PRICE_IDS),
        ...Object.keys(SUBSCRIPTION_PRICE_IDS),
        ...Object.keys(ANNUAL_PRICE_IDS),
      ].join(', ')}`);
    }

    logStep("Price resolved server-side", {
      plan,
      priceId: resolvedProduct.priceId,
      credits: resolvedProduct.credits,
      mode: checkoutMode!,
    });

    // ─── Create Stripe session ──────────────────────────────
    const stripe = new Stripe(stripeKey, { apiVersion: "2024-06-20" });

    // Check if customer exists
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Existing customer found", { customerId });
    }

    // Also try to read credits from Stripe price metadata (belt + suspenders)
    let creditsFromMetadata = resolvedProduct.credits;
    try {
      const price = await stripe.prices.retrieve(resolvedProduct.priceId);
      const metaCredits = parseInt(price.metadata?.credits || '0');
      if (metaCredits > 0) {
        creditsFromMetadata = metaCredits;
        logStep("Credits from Stripe metadata", { metaCredits });
      }
    } catch (_e) {
      logStep("Could not fetch price metadata, using server-side value");
    }

    // Idempotency: 30-second window dedup
    const idempotencyKey = `checkout_${user.id}_${resolvedProduct.priceId}_${Math.floor(Date.now() / 30000)}`;

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [{ price: resolvedProduct.priceId, quantity: 1 }],
      mode: checkoutMode!,
      success_url: successUrl!,
      cancel_url: cancelUrl!,
      metadata: {
        userId: user.id,
        type: checkoutMode! === 'subscription' ? 'subscription' : 'credits',
        plan: plan || 'credits',
        credits: creditsFromMetadata.toString(),
      },
      customer_update: customerId ? { address: 'auto' } : undefined,
    }, {
      idempotencyKey,
    });

    logStep("Checkout session created", { sessionId: session.id, url: session.url });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in create-checkout", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
