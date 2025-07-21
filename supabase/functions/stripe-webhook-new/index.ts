// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.
import Stripe from "stripe";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
// This is needed to use the Web Crypto API in Deno.
const cryptoProvider = Stripe.createSubtleCryptoProvider();
// Initialize Stripe
const stripe = new Stripe(Deno.env.get('STRIPE_API_KEY'), {
  apiVersion: '2025-06-30.basil',
  httpClient: Stripe.createFetchHttpClient()
});
// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const supabase = createClient(supabaseUrl, supabaseServiceKey);
// Stripe product configuration
const STRIPE_PRODUCTS = {
  'price_1Rk4JDQH2CPu3kDwaJ9W1TDW': {
    name: 'Single Credit',
    amount: 1
  },
  'price_1Rk4JDQH2CPu3kDwnWUmRgHb': {
    name: '3-Credit Bundle',
    amount: 3
  },
  'price_1Rk4JEQH2CPu3kDwf1ymmbqt': {
    name: '5-Credit Bundle',
    amount: 5
  }
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

console.log('🚀 Stripe Webhook Function Started');

Deno.serve(async (request) => {
  // Handle CORS preflight requests
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 200 });
  }

  try {
    const signature = request.headers.get('Stripe-Signature');
    if (!signature) {
      console.error('❌ No Stripe signature found');
      return new Response('No signature provided', { status: 400, headers: corsHeaders });
    }

    const body = await request.text();
    let receivedEvent;

    try {
      receivedEvent = await stripe.webhooks.constructEventAsync(
        body,
        signature,
        Deno.env.get('STRIPE_WEBHOOK_SECRET')!,
        undefined,
        cryptoProvider
      );
    } catch (err) {
      const errMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('❌ Webhook signature verification failed:', errMessage);
      return new Response(`Webhook signature verification failed: ${errMessage}`, { status: 400, headers: corsHeaders });
    }

    console.log(`🔔 Event received: ${receivedEvent.id} (${receivedEvent.type})`);

    // Handle the event
    switch (receivedEvent.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(receivedEvent.data.object as Stripe.Checkout.Session);
        break;
      // Add other event types to handle here
      default:
        console.warn(`🤷‍♀️ Unhandled event type: ${receivedEvent.type}`);
    }

    return new Response(JSON.stringify({ received: true, eventId: receivedEvent.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('❌ Top-level webhook error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown internal server error.';
    return new Response(`Webhook Error: ${errorMessage}`, {
      headers: corsHeaders,
      status: 500
    });
  }
});

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  console.log(`💰 Processing checkout session: ${session.id}`);
  try {
    const sessionWithLineItems = await stripe.checkout.sessions.retrieve(session.id, {
      expand: ['line_items'],
    });

    if (!sessionWithLineItems.line_items?.data) {
      console.error('❌ No line items found in session');
      return;
    }

    const customerEmail = session.customer_details?.email;
    if (!customerEmail) {
      console.error('❌ No customer email found in session:', session.id);
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('email', customerEmail)
      .single();

    if (profileError || !profile) {
      console.error('❌ User not found for email:', customerEmail, 'Error:', profileError?.message);
      return;
    }

    const userId = profile.id;
    console.log(`👤 Found user: ${userId} for email: ${customerEmail}`);

    for (const item of sessionWithLineItems.line_items.data) {
      const priceId = item.price?.id;
      if (!priceId) {
        console.log('⚠️ No price ID found for item');
        continue;
      }

      const productConfig = STRIPE_PRODUCTS[priceId];
      if (!productConfig) {
        console.log(`⚠️ No configuration found for price ID: ${priceId}`);
        continue;
      }

      const quantity = item.quantity || 1;
      const totalCreditsForThisItem = productConfig.amount * quantity;
      
      console.log(`📦 Processing item: ${productConfig.name} (${quantity} x ${productConfig.amount} credits = ${totalCreditsForThisItem} total)`);
      
      await allocateCredits(userId, totalCreditsForThisItem, session, item);
    }

    console.log(`✅ Successfully processed checkout session: ${session.id}`);
  } catch (error) {
    console.error(`❌ Error in handleCheckoutSessionCompleted for session ${session.id}:`, error);
    // Do not re-throw; let the webhook acknowledge receipt to Stripe
  }
}

async function allocateCredits(userId: string, creditAmount: number, session: Stripe.Checkout.Session, item: Stripe.LineItem) {
  try {
    console.log(`Allocating ${creditAmount} credits to user ${userId}`);

    // Using a stored procedure (RPC) to handle the credit update atomically
    const { error: rpcError } = await supabase.rpc('update_user_credits', {
      p_user_id: userId,
      p_credit_amount: creditAmount
    });

    if (rpcError) {
      console.error('❌ Error calling update_user_credits RPC:', rpcError);
      // Depending on the desired behavior, you might want to throw here to indicate a critical failure
      return; // Stop further processing for this item
    }

    // After successfully updating credits, log the transaction
    const { error: transactionError } = await supabase.from('credit_transactions').insert({
      user_id: userId,
      type: 'purchase',
      amount: creditAmount,
      description: `Credit purchase: ${item.description || 'Stripe payment'}`,
      stripe_session_id: session.id,
      metadata: {
        stripe_payment_intent: session.payment_intent,
        stripe_customer_id: session.customer,
        product_name: item.description,
        amount_paid: session.amount_total,
        price_id: item.price?.id,
        quantity: item.quantity,
      },
    });

    if (transactionError) {
      console.error('❌ Error creating credit transaction record:', transactionError);
      // This is a non-critical error for the user credit balance, but important for auditing
    }
    
    console.log(`✅ Successfully allocated ${creditAmount} credits to user ${userId}.`);
  } catch (error) {
    console.error(`❌ Error in allocateCredits for user ${userId}:`, error);
    // Do not re-throw; allow other line items to be processed if any
  }
}
