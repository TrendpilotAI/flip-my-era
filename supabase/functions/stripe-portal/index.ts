// Supabase Edge Function: Stripe Customer Portal session
// Creates a Stripe Billing Portal session for the authenticated user

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
// Stripe ESM build for Deno runtime
import Stripe from "https://esm.sh/stripe@14.25.0?target=deno";
import { resolveStripeSecretKey } from "../_shared/stripe.ts";
import { getCorsHeaders, handleCors, verifyAuth } from "../_shared/utils.ts";

function stripeConnectionOptions() {
  const apiBase = Deno.env.get("STRIPE_API_BASE");
  if (!apiBase) return {};

  const url = new URL(apiBase);
  const isLocalRuntime = ["development", "test"].includes(
    Deno.env.get("ENVIRONMENT") ?? "",
  );
  if (url.protocol !== "https:" && !(isLocalRuntime && url.protocol === "http:")) {
    throw new Error("STRIPE_API_BASE must use https outside local tests");
  }

  return {
    host: url.hostname,
    port: Number(url.port || (url.protocol === "http:" ? "80" : "443")),
    protocol: url.protocol === "http:" ? "http" as const : "https" as const,
  };
}

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const corsHeaders = getCorsHeaders(req);

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const userId = await verifyAuth(req);
    if (!userId) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("email, stripe_customer_id")
      .eq("id", userId)
      .single();
    if (profileError || !profile?.email) {
      return new Response(
        JSON.stringify({ error: "User profile not found or missing email" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    let stripeSecretKey: string;
    try {
      stripeSecretKey = resolveStripeSecretKey(
        Deno.env.get("STRIPE_SECRET_KEY"),
        Deno.env.get("STRIPE_API_KEY"),
      );
    } catch {
      return new Response(
        JSON.stringify({ error: "Stripe server secret is not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2024-06-20",
      ...stripeConnectionOptions(),
    });

    let customerId: string | null = profile.stripe_customer_id;
    if (!customerId) {
      const existing = await stripe.customers.list({ email: profile.email, limit: 1 });
      if (existing.data.length > 0) {
        customerId = existing.data[0].id;
      } else {
        const created = await stripe.customers.create({ email: profile.email });
        customerId = created.id;
      }
      await supabase.from("profiles").update({ stripe_customer_id: customerId }).eq("id", userId);
    }

    const returnUrl = Deno.env.get("STRIPE_PORTAL_RETURN_URL")
      ?? `${new URL(req.url).origin}`;

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });

    return new Response(
      JSON.stringify({ url: session.url }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("stripe-portal error", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
