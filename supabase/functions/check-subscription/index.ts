/* eslint-disable @typescript-eslint/no-explicit-any */
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { resolveStripeSecretKey } from "../_shared/stripe.ts";
import { formatErrorResponse, getCorsHeaders, handleCors, verifyAuth } from "../_shared/utils.ts";

// Helper logging function for enhanced debugging
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const corsHeaders = getCorsHeaders(req);

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    logStep("Function started");

    const userId = await verifyAuth(req);
    if (!userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const stripeKey = resolveStripeSecretKey(
      Deno.env.get("STRIPE_SECRET_KEY"),
      Deno.env.get("STRIPE_API_KEY"),
    );
    logStep("Stripe key verified");

    const { data: profile, error: profileError } = await supabaseClient
      .from("profiles")
      .select("email, stripe_customer_id")
      .eq("id", userId)
      .single();
    if (profileError || !profile?.email) throw new Error("User profile not found or missing email");
    logStep("User authenticated", { userId });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Check for existing customer
    const customers = profile.stripe_customer_id
      ? { data: [{ id: profile.stripe_customer_id }] }
      : await stripe.customers.list({ email: profile.email, limit: 1 });
    
    if (customers.data.length === 0) {
      logStep("No customer found, returning unsubscribed state");
      return new Response(JSON.stringify({ subscribed: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    // Check for active subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });

    const hasActiveSub = subscriptions.data.length > 0;
    let productId = null;
    let subscriptionEnd = null;
    let plan = 'free';

    if (hasActiveSub) {
      const subscription = subscriptions.data[0];
      subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
      productId = subscription.items.data[0].price.product;
      
      // Map product ID to plan name
      const productToPlans: Record<string, string> = {
        "prod_T66l2ofWiIeXwG": "basic",
        "prod_T66sHD5TeKOubL": "premium", 
        "prod_T66skpDMZXB6Qx": "family"
      };
      
      plan = productToPlans[productId as string] || 'unknown';
      logStep("Active subscription found", { subscriptionId: subscription.id, endDate: subscriptionEnd, plan });
    } else {
      logStep("No active subscription found");
    }

    return new Response(JSON.stringify({
      subscribed: hasActiveSub,
      product_id: productId,
      subscription_end: subscriptionEnd,
      plan: plan
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in check-subscription", { message: errorMessage });
    return formatErrorResponse(error, 500, req);
  }
});
