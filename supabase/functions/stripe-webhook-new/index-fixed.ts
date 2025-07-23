// Fixed version of stripe webhook with proper error handling and credit allocation
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const cryptoProvider = Stripe.createSubtleCryptoProvider();
const stripe = new Stripe(Deno.env.get('STRIPE_API_KEY')!, {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient()
});

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const STRIPE_PRODUCTS: Record<string, { name: string; amount: number }> = {
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

console.log('🚀 Fixed Stripe Webhook Function Started');

Deno.serve(async (request) => {
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
    let receivedEvent: Stripe.Event;

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
      case 'charge.updated':
        console.log(`🔄 Charge updated event: ${receivedEvent.id} - ignoring as credits are handled by checkout.session.completed`);
        break;
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
    // Check if we've already processed this session to prevent duplicate credit allocation
    const { data: existingTransaction, error: checkError } = await supabase
      .from('credit_transactions')
      .select('id')
      .eq('stripe_session_id', session.id)
      .limit(1);

    if (checkError) {
      console.error('❌ Error checking for existing transaction:', checkError);
    } else if (existingTransaction && existingTransaction.length > 0) {
      console.log(`⚠️ Session ${session.id} already processed, skipping to prevent duplicate credits`);
      return;
    }

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

    // Process each line item
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
      
      console.log(`📦 Processing item: ${productConfig.name}`);
      console.log(`📦 Item quantity: ${quantity}`);
      console.log(`📦 Credits per item: ${productConfig.amount}`);
      console.log(`📦 Total credits calculated: ${totalCreditsForThisItem}`);
      console.log(`📦 User ID: ${userId} (type: ${typeof userId})`);
      
      await allocateCredits(userId, totalCreditsForThisItem, session, item, productConfig);
    }

    console.log(`✅ Successfully processed checkout session: ${session.id}`);
  } catch (error) {
    console.error(`❌ Error in handleCheckoutSessionCompleted for session ${session.id}:`, error);
    // Do not re-throw; let the webhook acknowledge receipt to Stripe
  }
}

async function allocateCredits(userId: string, creditAmount: number, session: Stripe.Checkout.Session, item: Stripe.LineItem, productConfig: { name: string; amount: number }) {
  try {
    console.log(`🔄 Starting credit allocation:`);
    console.log(`🔄 User ID: ${userId} (type: ${typeof userId})`);
    console.log(`🔄 Credit amount: ${creditAmount} (type: ${typeof creditAmount})`);

    // Validate inputs
    if (!userId || typeof userId !== 'string') {
      console.error('❌ Invalid user ID:', userId);
      return;
    }

    if (!creditAmount || creditAmount <= 0) {
      console.error('❌ Invalid credit amount:', creditAmount);
      return;
    }

    // Using the fixed stored procedure (RPC) to handle the credit update atomically
    console.log(`🔄 Calling update_user_credits RPC with params:`, {
      p_user_id: userId,
      p_credit_amount: creditAmount
    });
    
    const { data: rpcData, error: rpcError } = await supabase.rpc('update_user_credits', {
      p_user_id: userId,
      p_credit_amount: creditAmount
    });

    if (rpcError) {
      console.error('❌ RPC Error Details:', JSON.stringify(rpcError, null, 2));
      console.error('❌ RPC failed - this should not happen with the fixed function');
      
      // If RPC still fails, something is seriously wrong - don't create transaction record
      throw new Error(`Credit allocation failed: ${rpcError.message}`);
    }
    
    console.log(`✅ RPC call successful - credits updated`);
    console.log(`✅ RPC response:`, rpcData);

    // After successfully updating credits, log the transaction
    const { error: transactionError } = await supabase.from('credit_transactions').insert({
      user_id: userId,
      transaction_type: 'purchase',
      amount: creditAmount,
      description: `Credit purchase: ${item.description || productConfig.name} (${item.quantity || 1} unit${(item.quantity || 1) > 1 ? 's' : ''})`,
      stripe_session_id: session.id,
      metadata: {
        stripe_payment_intent: session.payment_intent,
        stripe_customer_id: session.customer,
        product_name: item.description || productConfig.name,
        amount_paid: session.amount_total,
        price_id: item.price?.id,
        quantity: item.quantity || 1,
        credits_per_unit: productConfig.amount,
        total_credits_allocated: creditAmount,
        webhook_version: 'fixed-v1'
      },
    });

    if (transactionError) {
      console.error('❌ Error creating credit transaction record:', transactionError);
      // This is a non-critical error for the user credit balance, but important for auditing
    } else {
      console.log(`✅ Created transaction record for ${creditAmount} credits`);
    }

    // Verify the final credit balance
    const { data: finalCredits, error: verifyError } = await supabase
      .from('user_credits')
      .select('balance, total_earned')
      .eq('user_id', userId)
      .single();

    if (verifyError) {
      console.error('❌ Error verifying final credits:', verifyError);
    } else {
      console.log(`✅ Final credit balance for user ${userId}: ${finalCredits.balance} (total earned: ${finalCredits.total_earned})`);
    }
    
    console.log(`✅ Successfully allocated ${creditAmount} credits to user ${userId}.`);
  } catch (error) {
    console.error(`❌ Error in allocateCredits for user ${userId}:`, error);
    // Re-throw to prevent transaction record creation if credit allocation failed
    throw error;
  }
}