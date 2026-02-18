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

    // Idempotency: check if we've already processed this event
    const { data: existingEvent } = await supabase
      .from('webhook_events')
      .select('id')
      .eq('stripe_event_id', event.id)
      .single();

    if (existingEvent) {
      console.log(`Event ${event.id} already processed, skipping (idempotent)`);
      return new Response(JSON.stringify({ received: true, duplicate: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Record the event before processing (claim it)
    const { error: insertEventError } = await supabase
      .from('webhook_events')
      .insert({
        stripe_event_id: event.id,
        event_type: event.type,
        processed_at: new Date().toISOString(),
      });

    if (insertEventError) {
      // If insert fails due to unique constraint, another instance is handling it
      if (insertEventError.code === '23505') {
        console.log(`Event ${event.id} claimed by another instance, skipping`);
        return new Response(JSON.stringify({ received: true, duplicate: true }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      console.error('Error recording webhook event:', insertEventError);
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
      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        await handleSubscriptionDeleted(supabase, subscription);
        break;
      }
      case "invoice.payment_failed": {
        const invoice = event.data.object;
        await handlePaymentFailed(supabase, invoice);
        break;
      }
      case "charge.refunded": {
        const charge = event.data.object;
        await handleChargeRefunded(supabase, charge);
        break;
      }
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
      // Idempotency: check if credits were already granted for this session
      const { data: existingTx } = await supabase
        .from('credit_transactions')
        .select('id')
        .eq('stripe_session_id', session.id)
        .eq('transaction_type', 'purchase')
        .single();
      
      if (existingTx) {
        console.log(`Credits already granted for session ${session.id}, skipping`);
        return;
      }

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

// Helper function to handle subscription deletion
async function handleSubscriptionDeleted(supabase: SupabaseClient, subscription: StripeSubscription) {
  console.log('Processing subscription deletion:', subscription.id);
  
  const { customer } = subscription;
  
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('stripe_customer_id', customer)
    .single();
    
  if (profileError || !profile) {
    console.error('Error: User not found for subscription deletion', {
      subscriptionId: subscription.id,
      customerId: customer,
      error: profileError?.message || 'No matching profile found'
    });
    return;
  }
  
  // Set subscription status to cancelled
  const { error: updateError } = await supabase
    .from('user_credits')
    .update({
      subscription_status: 'cancelled',
      updated_at: new Date().toISOString()
    })
    .eq('user_id', profile.id);
    
  if (updateError) {
    console.error('Error updating subscription status on deletion:', {
      userId: profile.id,
      subscriptionId: subscription.id,
      error: updateError.message
    });
    return;
  }
  
  // Also update profile subscription status
  await supabase
    .from('profiles')
    .update({ subscription_status: 'free' })
    .eq('id', profile.id);
  
  console.log(`Subscription ${subscription.id} deleted for user ${profile.id}`);
}

// Helper function to handle failed payments
async function handlePaymentFailed(supabase: SupabaseClient, invoice: { id: string; customer: string; subscription?: string; amount_due: number }) {
  console.log('Processing payment failure:', invoice.id);
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, email')
    .eq('stripe_customer_id', invoice.customer)
    .single();
    
  if (!profile) {
    console.error('User not found for failed payment:', { customerId: invoice.customer });
    return;
  }
  
  // If subscription payment failed, mark as past_due
  if (invoice.subscription) {
    await supabase
      .from('user_credits')
      .update({
        subscription_status: 'past_due',
        updated_at: new Date().toISOString()
      })
      .eq('user_id', profile.id);
  }
  
  // Log the failed payment for audit
  await supabase
    .from('credit_transactions')
    .insert({
      user_id: profile.id,
      amount: 0,
      transaction_type: 'payment_failed',
      description: `Payment failed - Invoice ${invoice.id}`,
      metadata: {
        invoice_id: invoice.id,
        subscription_id: invoice.subscription,
        amount_due: invoice.amount_due
      },
      balance_after_transaction: 0
    });
  
  console.log(`Recorded payment failure for user ${profile.id} (invoice: ${invoice.id})`);
}

// Helper function to handle charge refunds
async function handleChargeRefunded(supabase: SupabaseClient, charge: { id: string; customer: string; amount_refunded: number; payment_intent: string | null; metadata?: Record<string, string> }) {
  console.log('Processing charge refund:', charge.id);
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('stripe_customer_id', charge.customer)
    .single();
    
  if (!profile) {
    console.error('User not found for refund:', { customerId: charge.customer });
    return;
  }
  
  // Find the original credit transaction by payment intent
  let creditsToRevoke = 0;
  if (charge.payment_intent) {
    const { data: originalTx } = await supabase
      .from('credit_transactions')
      .select('amount')
      .eq('stripe_payment_intent_id', charge.payment_intent)
      .eq('transaction_type', 'purchase')
      .single();
    
    if (originalTx) {
      creditsToRevoke = originalTx.amount;
    }
  }
  
  // Create refund transaction (negative credits)
  if (creditsToRevoke > 0) {
    await supabase
      .from('credit_transactions')
      .insert({
        user_id: profile.id,
        amount: -creditsToRevoke,
        transaction_type: 'refund',
        description: `Refund - ${creditsToRevoke} credits revoked`,
        metadata: {
          charge_id: charge.id,
          payment_intent: charge.payment_intent,
          amount_refunded: charge.amount_refunded
        },
        balance_after_transaction: 0
      });
    
    // Deduct credits from balance
    const { data: currentCredits } = await supabase
      .from('user_credits')
      .select('balance')
      .eq('user_id', profile.id)
      .single();
    
    if (currentCredits) {
      const newBalance = Math.max(0, currentCredits.balance - creditsToRevoke);
      await supabase
        .from('user_credits')
        .update({ balance: newBalance, updated_at: new Date().toISOString() })
        .eq('user_id', profile.id);
    }
  }
  
  console.log(`Processed refund for user ${profile.id}: ${creditsToRevoke} credits revoked (charge: ${charge.id})`);
}
