/* eslint-disable @typescript-eslint/no-explicit-any */
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { resolveStripeSecretKey } from "../_shared/stripe.ts";
import { formatErrorResponse, getCorsHeaders, handleCors, verifyAuth } from "../_shared/utils.ts";

// Helper logging function for debugging
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CUSTOMER-PORTAL] ${step}${detailsStr}`);
};

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const corsHeaders = getCorsHeaders(req);

  try {
    logStep("Function started");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

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
    let customerId = profile.stripe_customer_id as string | null;
    if (!customerId) {
      const customers = await stripe.customers.list({ email: profile.email, limit: 1 });
      if (customers.data.length === 0) throw new Error("No Stripe customer found for this user");
      customerId = customers.data[0].id;
    }
    logStep("Found Stripe customer", { customerId });

    const origin = req.headers.get("Origin")
      ?? Deno.env.get("STRIPE_PORTAL_RETURN_URL")
      ?? "https://flipmyera.com";
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${origin}/`,
    });
    logStep("Customer portal session created", { sessionId: portalSession.id, url: portalSession.url });

    return new Response(JSON.stringify({ url: portalSession.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in customer-portal", { message: errorMessage });
    return formatErrorResponse(error, 500, req);
  }
});
