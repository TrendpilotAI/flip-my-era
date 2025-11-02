import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

// Helper logging function for enhanced debugging
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
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

    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new Error("No authorization header provided");
    }
    logStep("Authorization header found");

    const token = authHeader.replace("Bearer ", "");
    // Decode Clerk token to extract user id (sub)
    let clerkUserId: string | null = null;
    try {
      const parts = token.split(".");
      if (parts.length >= 2) {
        const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
        const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
        const payload = JSON.parse(atob(padded));
        clerkUserId = payload?.sub ?? payload?.user_id ?? payload?.uid ?? null;
      }
    } catch (_e) {
      // ignore; will fail below
    }
    if (!clerkUserId) throw new Error("Invalid token: could not extract user id");

    // Lookup user email from profiles table using service role
    const { data: profile, error: profileErr } = await supabaseServiceClient
      .from("profiles")
      .select("email")
      .eq("id", clerkUserId)
      .single();
    if (profileErr || !profile?.email) throw new Error("User profile not found or missing email");
    const user = { id: clerkUserId, email: profile.email as string } as const;
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Get the plan or stripePriceId from request body
    const { plan, productType, stripePriceId } = await req.json();
    logStep("Request received", { plan, productType, stripePriceId });

    let priceId: string;
    let checkoutMode: "subscription" | "payment";
    let successUrl: string;
    let cancelUrl: string;

    const origin = req.headers.get("origin") || "http://localhost:8080";

    // Define price IDs for subscription plans
    const subscriptionPriceIds: Record<string, string> = {
      starter: "price_1S9zK15U03MNTw3qAO5JnplW",
      deluxe: "price_1S9zK25U03MNTw3qdDnUn7hk",
      vip: "price_1S9zK25U03MNTw3qoCHo9KzE"
    };

    // Define price IDs for credit packs
    const creditPriceIds: Record<string, string> = {
      'starter-pack': "price_1S9zK25U03MNTw3qMH90DnC1",
      'creator-pack': "price_1S9zK25U03MNTw3qFkq00yiu",
      'studio-pack': "price_1S9zK35U03MNTw3qpmqEDL80"
    };

    if (stripePriceId) {
      // Direct price ID provided (for credit purchases)
      priceId = stripePriceId;
      checkoutMode = "payment";
      successUrl = `${origin}/dashboard?success=true`;
      cancelUrl = `${origin}/dashboard`;
      logStep("Using direct price ID", { priceId, mode: checkoutMode });
    } else if (plan && subscriptionPriceIds[plan]) {
      // Subscription plan
      priceId = subscriptionPriceIds[plan];
      checkoutMode = "subscription";
      successUrl = `${origin}/checkout/success?plan=${encodeURIComponent(plan)}`;
      cancelUrl = `${origin}/checkout?plan=${encodeURIComponent(plan)}`;
      logStep("Using subscription plan", { plan, priceId, mode: checkoutMode });
    } else {
      throw new Error(`Invalid plan or price ID: ${plan || stripePriceId}`);
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Check if customer exists
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Existing customer found", { customerId });
    }

    // Fetch the price object from Stripe to get metadata
    const price = await stripe.prices.retrieve(priceId);
    const credits = parseInt(price.metadata.credits || '0');

    if (credits === 0) {
      logStep("Warning: credits not found in price metadata", { priceId });
    }
    
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: checkoutMode,
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        userId: user.id,
        type: checkoutMode === 'subscription' ? 'subscription' : 'credits',
        plan: plan || 'credits',
        credits: credits.toString(),
      },
      customer_update: customerId ? { address: 'auto' } : undefined,
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