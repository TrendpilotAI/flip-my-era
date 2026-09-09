/* eslint-disable @typescript-eslint/no-explicit-any */
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import {
  CHECKOUT_CATALOG,
  resolveCheckoutProduct,
  type ResolvedCheckoutProduct,
} from "../_shared/checkoutCatalog.ts";
import { resolveStripeSecretKey } from "../_shared/stripe.ts";
import {
  formatErrorResponse,
  getCorsHeaders,
  handleCors,
  verifyAuth,
} from "../_shared/utils.ts";

// Helper logging function
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const corsHeaders = getCorsHeaders(req);

  // Use service role for server-side lookups (profiles email)
  const supabaseServiceClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );

  try {
    logStep("Function started");

    // ─── Auth: shared BetterAuth/Supabase verification ─────────────────────
    const authenticatedUserId = await verifyAuth(req);
    if (!authenticatedUserId) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired token" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 401,
        },
      );
    }
    logStep("Auth via shared verifyAuth", { userId: authenticatedUserId });

    // Get the plan from request body
    const body = await req.json();
    const { plan, productType } = body;
    logStep("Request received", { plan, productType });

    // ─── Resolve price ID server-side (never trust client-sent price IDs) ───
    let resolvedProduct: ResolvedCheckoutProduct;
    let successUrl: string;
    let cancelUrl: string;

    const origin = req.headers.get("Origin") ?? "https://flipmyera.com";

    const catalogProduct = resolveCheckoutProduct(
      plan,
      productType,
      (name) => Deno.env.get(name),
    );
    if (!catalogProduct) {
      return new Response(
        JSON.stringify({
          error: `Invalid plan: "${String(plan)}"`,
          validPlans: Object.keys(CHECKOUT_CATALOG),
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        },
      );
    }
    resolvedProduct = catalogProduct;

    if (resolvedProduct.productType === "credits") {
      successUrl = `${origin}/dashboard?success=true`;
      cancelUrl = `${origin}/dashboard`;
    } else {
      successUrl = `${origin}/dashboard?upgrade=success`;
      cancelUrl = `${origin}/pricing?cancelled=true`;
    }

    logStep("Price resolved server-side", {
      plan,
      priceId: resolvedProduct.priceId,
      credits: resolvedProduct.credits,
      mode: resolvedProduct.mode,
    });

    // ─── Create Stripe session ──────────────────────────────
    const stripeKey = resolveStripeSecretKey(
      Deno.env.get("STRIPE_SECRET_KEY"),
      Deno.env.get("STRIPE_API_KEY"),
    );
    logStep("Stripe key verified");

    // Lookup user email only after the request is known to be actionable.
    const { data: profile, error: profileErr } = await supabaseServiceClient
      .from("profiles")
      .select("email")
      .eq("id", authenticatedUserId)
      .single();
    if (profileErr || !profile?.email) {
      return new Response(
        JSON.stringify({ error: "User profile not found or missing email" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 404,
        },
      );
    }
    const user = {
      id: authenticatedUserId,
      email: profile.email as string,
    } as const;
    logStep("User authenticated", { userId: user.id, email: user.email });

    const stripe = new Stripe(stripeKey, { apiVersion: "2024-06-20" });

    // Check if customer exists
    const customers = await stripe.customers.list({
      email: user.email,
      limit: 1,
    });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Existing customer found", { customerId });
    }

    // Also try to read credits from Stripe price metadata (belt + suspenders)
    let creditsFromMetadata = resolvedProduct.credits;
    try {
      const price = await stripe.prices.retrieve(resolvedProduct.priceId);
      const metaCredits = parseInt(price.metadata?.credits || "0");
      if (metaCredits > 0) {
        creditsFromMetadata = metaCredits;
        logStep("Credits from Stripe metadata", { metaCredits });
      }
    } catch (_e) {
      logStep("Could not fetch price metadata, using server-side value");
    }

    // Idempotency: 30-second window dedup
    const idempotencyKey = `checkout_${user.id}_${resolvedProduct.priceId}_${
      Math.floor(Date.now() / 30000)
    }`;

    const checkoutMetadata = {
      userId: user.id,
      type: resolvedProduct.productType,
      plan,
      credits: creditsFromMetadata.toString(),
    };

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [{ price: resolvedProduct.priceId, quantity: 1 }],
      mode: resolvedProduct.mode,
      payment_method_types: ["card"],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: checkoutMetadata,
      subscription_data: resolvedProduct.mode === "subscription"
        ? { metadata: checkoutMetadata }
        : undefined,
      customer_update: customerId ? { address: "auto" } : undefined,
    }, {
      idempotencyKey,
    });

    logStep("Checkout session created", {
      sessionId: session.id,
      url: session.url,
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in create-checkout", { message: errorMessage });
    return formatErrorResponse(error, 500, req);
  }
});
