import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { corsHeaders, handleCors, initSupabaseClient } from "../_shared/utils.ts";

// Utility: Safe JSON stringify without throwing on circular refs
function safeStringify(value: unknown) {
  try {
    return JSON.stringify(value);
  } catch (_e) {
    return "<unserializable>";
  }
}

serve(async (req) => {
  // Handle CORS preflight
  const preflight = handleCors(req);
  if (preflight) return preflight;

  try {
    const stripeSecret = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

    if (!stripeSecret) {
      console.error("Missing STRIPE_SECRET_KEY secret");
      return new Response(
        JSON.stringify({ error: "Server not configured: STRIPE_SECRET_KEY missing" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 },
      );
    }
    if (!webhookSecret) {
      console.error("Missing STRIPE_WEBHOOK_SECRET secret");
      return new Response(
        JSON.stringify({ error: "Server not configured: STRIPE_WEBHOOK_SECRET missing" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 },
      );
    }

    const stripe = new Stripe(stripeSecret, {
      apiVersion: "2025-08-27.basil",
    });

    // Read raw body for signature verification
    const signature = req.headers.get("stripe-signature") || req.headers.get("Stripe-Signature");
    if (!signature) {
      return new Response(
        JSON.stringify({ error: "Missing Stripe-Signature header" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 },
      );
    }
    const body = await req.text();

    let event: Stripe.Event;
    try {
      const cryptoProvider = Stripe.createSubtleCryptoProvider();
      event = await stripe.webhooks.constructEventAsync(
        body,
        signature,
        webhookSecret,
        undefined,
        cryptoProvider,
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("❌ Webhook signature verification failed:", msg);
      return new Response(
        JSON.stringify({ error: `Webhook signature verification failed: ${msg}` }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 },
      );
    }

    // Initialize Supabase (service role) for DB operations
    const supabase = initSupabaseClient();

    // Idempotency guard: record event IDs to avoid double-processing
    const { data: existing } = await supabase
      .from("stripe_webhook_events")
      .select("id")
      .eq("stripe_event_id", event.id)
      .maybeSingle();

    if (existing) {
      console.log(`⏭️ Event ${event.id} already processed`);
      return new Response(JSON.stringify({ received: true, duplicate: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        // Retrieve session with line items
        const fullSession = await stripe.checkout.sessions.retrieve(session.id, {
          expand: ["line_items.data.price", "customer"],
        });

        const lineItems = fullSession.line_items?.data || [];

        // Price ID → product type mapping from secrets
        const PRICE_SHORT_STORY = Deno.env.get("STRIPE_PRICE_SHORT_STORY") || "";
        const PRICE_NOVELLA = Deno.env.get("STRIPE_PRICE_NOVELLA") || "";

        const priceToProduct = new Map<string, string>();
        if (PRICE_SHORT_STORY) priceToProduct.set(PRICE_SHORT_STORY, "short-story");
        if (PRICE_NOVELLA) priceToProduct.set(PRICE_NOVELLA, "novella");

        // Track story purchases to insert
        const storyPurchases: Array<{ productType: string; quantity: number; priceId: string; amount: number }> = [];

        for (const item of lineItems) {
          const priceId = (item.price as Stripe.Price | null)?.id || "";
          const qty = item.quantity ?? 1;
          const productType = priceToProduct.get(priceId);

          if (!productType) {
            console.warn(`⚠️ Unknown price ID in webhook: ${priceId}; item=${safeStringify(item)}`);
            continue;
          }

          storyPurchases.push({
            productType,
            quantity: qty,
            priceId,
            amount: item.amount_total || 0,
          });
        }

        // Determine customer email
        const customerEmail = fullSession.customer_details?.email || fullSession.customer_email || undefined;
        if (!customerEmail) {
          console.error("❌ No customer email available on session", fullSession.id);
          // Record event to idempotency table with zero credits
          await supabase.from("stripe_webhook_events").insert({
            stripe_event_id: event.id,
            stripe_session_id: session.id,
            event_type: event.type,
            credits_added: 0,
            metadata: { reason: "missing_email", session: fullSession.id },
          });
          return new Response(JSON.stringify({ received: true, warning: "missing_email" }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          });
        }

        // Look up the user by email
        const { data: profile, error: profileErr } = await supabase
          .from("profiles")
          .select("id, credits")
          .eq("email", customerEmail)
          .maybeSingle();

        if (profileErr) {
          console.error("❌ DB error fetching profile:", profileErr);
        }
        if (!profile?.id) {
          console.error("❌ No profile found for email: ", customerEmail);
          await supabase.from("stripe_webhook_events").insert({
            stripe_event_id: event.id,
            stripe_session_id: session.id,
            event_type: event.type,
            credits_added: 0,
            metadata: { reason: "user_not_found", email: customerEmail },
          });
          return new Response(JSON.stringify({ received: true, warning: "user_not_found" }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          });
        }

        // If no story purchases were matched, still record event and exit
        if (storyPurchases.length === 0) {
          console.warn("⚠️ No story purchases resolved from line items for session", session.id);
          await supabase.from("stripe_webhook_events").insert({
            stripe_event_id: event.id,
            stripe_session_id: session.id,
            event_type: event.type,
            user_id: profile.id,
            credits_added: 0,
            metadata: { reason: "no_product_match", line_items: lineItems?.length ?? 0 },
          });
          return new Response(JSON.stringify({ received: true, info: "no_product_match" }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          });
        }

        // Insert story purchase records
        let totalSlotsAdded = 0;
        for (const purchase of storyPurchases) {
          for (let i = 0; i < purchase.quantity; i++) {
            const { error: insertErr } = await supabase.from("story_purchases").insert({
              user_id: profile.id,
              product_type: purchase.productType,
              status: "unused",
              stripe_session_id: session.id,
              stripe_payment_intent: fullSession.payment_intent as string | undefined,
              amount_paid_cents: purchase.amount,
              metadata: {
                stripe_price_id: purchase.priceId,
                stripe_customer_id: fullSession.customer,
              },
            });

            if (insertErr) {
              console.error("❌ Failed inserting story purchase:", insertErr);
              return new Response(
                JSON.stringify({ error: "Failed to record story purchase" }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 },
              );
            }
            totalSlotsAdded++;
          }
        }

        // Record idempotency/audit entry
        await supabase.from("stripe_webhook_events").insert({
          stripe_event_id: event.id,
          stripe_session_id: session.id,
          event_type: event.type,
          user_id: profile.id,
          credits_added: totalSlotsAdded,
          metadata: {
            amount_total: fullSession.amount_total,
            currency: fullSession.currency,
            customer_email: customerEmail,
            story_purchases: storyPurchases,
          },
        });

        console.log(
          `✅ Processed checkout.session.completed: user=${profile.id} +${totalSlotsAdded} story slots (session=${session.id})`,
        );

        return new Response(JSON.stringify({ received: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      default: {
        // For unhandled events, acknowledge to prevent Stripe retries
        console.log(`ℹ️ Unhandled event type: ${event.type}`);
        // Still record event idempotency to suppress duplicates later
        await initSupabaseClient()
          .from("stripe_webhook_events")
          .insert({ stripe_event_id: event.id, event_type: event.type, metadata: { ignored: true } });

        return new Response(JSON.stringify({ received: true, ignored: event.type }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Unhandled webhook error:", msg);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 },
    );
  }
});