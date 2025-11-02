import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

// TypeScript interfaces for Stripe objects
interface StripeCheckoutSession {
  id: string;
  customer: string | null;
  customer_email: string | null;
  metadata: Record<string, string>;
  payment_intent: string | null;
  amount_total: number | null;
  currency: string | null;
}

interface StripeSubscription {
  id: string;
  customer: string;
  status: string;
  metadata: Record<string, string> | null;
}

interface Profile {
  id: string;
  stripe_customer_id: string | null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    
    if (!stripeKey || !webhookSecret) {
      throw new Error("Missing Stripe configuration");
    }

    // Use a stable, valid Stripe API version or omit to use library's default
    const stripe = new Stripe(stripeKey, { apiVersion: "2024-06-20" });
    
    // Verify webhook signature
    const signature = req.headers.get("stripe-signature");
    const body = await req.text();

    if (!signature) {
      return new Response(JSON.stringify({ error: "Missing Stripe-Signature header" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      return new Response(JSON.stringify({ error: "Invalid webhook signature" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Process based on event type
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        await handleCheckoutCompleted(supabase, session);
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object;
        await handleSubscriptionChange(supabase, subscription);
        break;
      }
      // Add more event handlers as needed
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Stripe webhook error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// Helper function to handle checkout completion
async function handleCheckoutCompleted(supabase: SupabaseClient, session: StripeCheckoutSession) {
  console.log('Processing checkout.session.completed:', session.id);
  
  const { customer, customer_email, metadata, payment_intent } = session;

  // Try lookup by email first, then fallback to Stripe customer ID
  let profile: Profile | null = null;
  let profileError: Error | null = null;

  if (customer_email) {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, stripe_customer_id')
      .eq('email', customer_email)
      .single();
    profile = data;
    profileError = error;
  }

  if ((!profile || profileError) && customer) {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, stripe_customer_id')
      .eq('stripe_customer_id', customer)
      .single();
    profile = data;
    profileError = error;
  }

  if (profileError || !profile) {
    console.error('Error: User not found for checkout session', {
      sessionId: session.id,
      customerEmail: customer_email,
      customerId: customer,
      error: profileError?.message || 'No matching profile found'
    });
    return;
  }
  
  // Update Stripe customer ID if not set
  if (!profile.stripe_customer_id && session.customer) {
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ stripe_customer_id: session.customer })
      .eq('id', profile.id);
      
    if (updateError) {
      console.error('Error updating Stripe customer ID:', {
        userId: profile.id,
        customerId: session.customer,
        error: updateError.message
      });
    }
  }
  
  // Process based on metadata
  if (metadata.type === 'credits') {
    const credits = parseInt(metadata.credits || '0');
    
    if (credits > 0) {
      // Add credit transaction
      const { error: txError } = await supabase
        .from('credit_transactions')
        .insert({
          user_id: profile.id,
          amount: credits,
          transaction_type: 'purchase',
          description: `Credit purchase via Stripe - ${credits} credits`,
          stripe_session_id: session.id,
          stripe_payment_intent_id: payment_intent,
          metadata: { 
            session_id: session.id,
            payment_intent: payment_intent,
            amount_total: session.amount_total,
            currency: session.currency
          },
          balance_after_transaction: 0 // Will be calculated by trigger
        });
        
      if (txError) {
        console.error('Error creating credit transaction:', {
          userId: profile.id,
          credits,
          sessionId: session.id,
          error: txError.message
        });
      } else {
        console.log(`Successfully allocated ${credits} credits to user ${profile.id} (session: ${session.id})`);
      }
    } else {
      console.warn('Invalid credits amount in metadata:', { sessionId: session.id, metadata });
    }
  } else if (metadata.type === 'subscription') {
    console.log('Subscription purchase detected, will be handled by subscription events:', session.id);
  } else {
    console.warn('Unknown metadata type in checkout session:', { sessionId: session.id, type: metadata.type });
  }
}

// Helper function to handle subscription changes
async function handleSubscriptionChange(supabase: SupabaseClient, subscription: StripeSubscription) {
  console.log('Processing subscription change:', subscription.id);
  
  const { customer, metadata, status } = subscription;
  
  // Find user by Stripe customer ID
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('stripe_customer_id', customer)
    .single();
    
  if (profileError || !profile) {
    console.error('Error: User not found for Stripe subscription', {
      subscriptionId: subscription.id,
      customerId: customer,
      status,
      error: profileError?.message || 'No matching profile found'
    });
    return;
  }
  
  // Map Stripe status to our subscription_status enum
  let subscriptionStatus = 'none';
  if (status === 'active') subscriptionStatus = 'active';
  else if (status === 'canceled') subscriptionStatus = 'cancelled';
  else if (status === 'past_due') subscriptionStatus = 'past_due';
  
  // Update user subscription status
  const { error: updateError } = await supabase
    .from('user_credits')
    .upsert({
      user_id: profile.id,
      subscription_status: subscriptionStatus,
      stripe_subscription_id: subscription.id,
      subscription_type: metadata?.plan === 'annual' ? 'annual' : 'monthly',
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'user_id'
    });
    
  if (updateError) {
    console.error('Error updating subscription status:', {
      userId: profile.id,
      subscriptionId: subscription.id,
      status: subscriptionStatus,
      error: updateError.message
    });
    return;
  }
  
  console.log(`Updated subscription status for user ${profile.id} to ${subscriptionStatus} (subscription: ${subscription.id})`);
  
  // If subscription is newly active, allocate monthly credits
  if (status === 'active' && metadata?.credits) {
    const monthlyCredits = parseInt(metadata.credits);
    
    if (monthlyCredits > 0) {
      const { error: txError } = await supabase
        .from('credit_transactions')
        .insert({
          user_id: profile.id,
          amount: monthlyCredits,
          transaction_type: 'monthly_allocation',
          description: `Monthly credit allocation - ${metadata.plan || 'unknown'} plan`,
          stripe_subscription_id: subscription.id,
          metadata: { 
            subscription_id: subscription.id,
            plan: metadata.plan,
            credits: monthlyCredits
          },
          balance_after_transaction: 0 // Will be calculated by trigger
        });
        
      if (txError) {
        console.error('Error allocating monthly credits:', {
          userId: profile.id,
          subscriptionId: subscription.id,
          credits: monthlyCredits,
          error: txError.message
        });
      } else {
        console.log(`Allocated ${monthlyCredits} monthly credits to user ${profile.id} (subscription: ${subscription.id})`);
      }
    } else {
      console.warn('Invalid credits amount in subscription metadata:', {
        subscriptionId: subscription.id,
        metadata
      });
    }
  }
}
