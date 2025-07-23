// Enhanced debug version of stripe webhook with comprehensive logging
import Stripe from "stripe";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

const cryptoProvider = Stripe.createSubtleCryptoProvider();
const stripe = new Stripe(Deno.env.get('STRIPE_API_KEY'), {
  apiVersion: '2025-06-30.basil',
  httpClient: Stripe.createFetchHttpClient()
});

const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const supabase = createClient(supabaseUrl, supabaseServiceKey);

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

console.log('🚀 DEBUG Enhanced Stripe Webhook Function Started');

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
      case 'charge.updated':
        console.log(`🔄 DEBUG: Handling charge.updated event: ${receivedEvent.id}`);
        // Log but don't process - this might be causing interference
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
  console.log(`💰 DEBUG: Processing checkout session: ${session.id}`);
  try {
    const sessionWithLineItems = await stripe.checkout.sessions.retrieve(session.id, {
      expand: ['line_items'],
    });

    if (!sessionWithLineItems.line_items?.data) {
      console.error('❌ DEBUG: No line items found in session');
      return;
    }

    const customerEmail = session.customer_details?.email;
    if (!customerEmail) {
      console.error('❌ DEBUG: No customer email found in session:', session.id);
      return;
    }

    console.log(`🔍 DEBUG: Looking up user by email: ${customerEmail}`);
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('email', customerEmail)
      .single();

    if (profileError || !profile) {
      console.error('❌ DEBUG: User not found for email:', customerEmail, 'Error:', profileError?.message);
      return;
    }

    const userId = profile.id;
    console.log(`👤 DEBUG: Found user: ${userId} (type: ${typeof userId}) for email: ${customerEmail}`);

    // DEBUG: Check what functions exist in the database
    console.log(`🔍 DEBUG: Checking available update_user_credits functions...`);
    await debugCheckFunctions();

    for (const item of sessionWithLineItems.line_items.data) {
      const priceId = item.price?.id;
      if (!priceId) {
        console.log('⚠️ DEBUG: No price ID found for item');
        continue;
      }

      const productConfig = STRIPE_PRODUCTS[priceId];
      if (!productConfig) {
        console.log(`⚠️ DEBUG: No configuration found for price ID: ${priceId}`);
        continue;
      }

      const quantity = item.quantity || 1;
      const totalCreditsForThisItem = productConfig.amount * quantity;
      
      console.log(`📦 DEBUG: Processing item: ${productConfig.name}`);
      console.log(`📦 DEBUG: Item quantity: ${quantity}`);
      console.log(`📦 DEBUG: Credits per item: ${productConfig.amount}`);
      console.log(`📦 DEBUG: Total credits calculated: ${totalCreditsForThisItem}`);
      console.log(`📦 DEBUG: User ID type: ${typeof userId}, value: ${userId}`);
      
      await allocateCreditsWithDebug(userId, totalCreditsForThisItem, session, item);
    }

    console.log(`✅ DEBUG: Successfully processed checkout session: ${session.id}`);
  } catch (error) {
    console.error(`❌ DEBUG: Error in handleCheckoutSessionCompleted for session ${session.id}:`, error);
  }
}

async function debugCheckFunctions() {
  try {
    // Try to query the database for function information
    const { data, error } = await supabase
      .from('information_schema.routines')
      .select('routine_name, data_type, parameter_name, parameter_mode')
      .eq('routine_name', 'update_user_credits');
    
    if (error) {
      console.log(`🔍 DEBUG: Could not query function info: ${error.message}`);
    } else {
      console.log(`🔍 DEBUG: Function query result:`, JSON.stringify(data, null, 2));
    }
  } catch (err) {
    console.log(`🔍 DEBUG: Function check failed:`, err);
  }
}

async function allocateCreditsWithDebug(userId: string, creditAmount: number, session: Stripe.Checkout.Session, item: Stripe.LineItem) {
  try {
    console.log(`🔄 DEBUG: Starting credit allocation:`);
    console.log(`🔄 DEBUG: User ID: ${userId} (type: ${typeof userId})`);
    console.log(`🔄 DEBUG: Credit amount: ${creditAmount} (type: ${typeof creditAmount})`);

    // DEBUG: Try different approaches to identify the issue
    console.log(`🔄 DEBUG: Attempting RPC call with TEXT parameters...`);
    
    // First, try the RPC call and capture detailed error information
    const { data: rpcData, error: rpcError } = await supabase.rpc('update_user_credits', {
      p_user_id: userId,
      p_credit_amount: creditAmount
    });

    if (rpcError) {
      console.error('❌ DEBUG: RPC Error Details:', JSON.stringify(rpcError, null, 2));
      console.error('❌ DEBUG: RPC Error Code:', rpcError.code);
      console.error('❌ DEBUG: RPC Error Message:', rpcError.message);
      console.error('❌ DEBUG: RPC Error Hint:', rpcError.hint);
      
      // Try alternative approach - direct database update
      console.log(`🔄 DEBUG: RPC failed, trying direct database update...`);
      await fallbackDirectUpdate(userId, creditAmount);
      
    } else {
      console.log(`✅ DEBUG: RPC call successful - credits should be updated`);
      console.log(`✅ DEBUG: RPC response data:`, rpcData);
    }

    // Verify the credit balance after update
    await verifyCreditsAfterUpdate(userId, creditAmount);

    // Create transaction record
    const { error: transactionError } = await supabase.from('credit_transactions').insert({
      user_id: userId,
      type: 'purchase',
      amount: creditAmount,
      description: `DEBUG: Credit purchase: ${item.description || 'Stripe payment'}`,
      stripe_session_id: session.id,
      metadata: {
        debug_mode: true,
        stripe_payment_intent: session.payment_intent,
        stripe_customer_id: session.customer,
        product_name: item.description,
        amount_paid: session.amount_total,
        price_id: item.price?.id,
        quantity: item.quantity,
      },
    });

    if (transactionError) {
      console.error('❌ DEBUG: Error creating credit transaction record:', transactionError);
    } else {
      console.log(`✅ DEBUG: Created transaction record for ${creditAmount} credits`);
    }
    
    console.log(`✅ DEBUG: Successfully allocated ${creditAmount} credits to user ${userId}.`);
  } catch (error) {
    console.error(`❌ DEBUG: Error in allocateCreditsWithDebug for user ${userId}:`, error);
  }
}

async function fallbackDirectUpdate(userId: string, creditAmount: number) {
  try {
    console.log(`🔄 DEBUG: Attempting direct database update as fallback...`);
    
    // Get current credits
    const { data: currentCredits, error: fetchError } = await supabase
      .from('user_credits')
      .select('balance, total_earned')
      .eq('user_id', userId)
      .single();

    if (fetchError && fetchError.code === 'PGRST116') {
      // User doesn't exist, create new record
      console.log(`🔄 DEBUG: Creating new credit record for user ${userId}`);
      const { error: insertError } = await supabase
        .from('user_credits')
        .insert({
          user_id: userId,
          balance: creditAmount,
          total_earned: creditAmount,
          total_spent: 0
        });
      
      if (insertError) {
        console.error('❌ DEBUG: Error creating new credit record:', insertError);
      } else {
        console.log(`✅ DEBUG: Created new credit record with ${creditAmount} credits`);
      }
    } else if (!fetchError) {
      // Update existing record
      const newBalance = currentCredits.balance + creditAmount;
      const newTotalEarned = (currentCredits.total_earned || 0) + creditAmount;
      
      console.log(`🔄 DEBUG: Updating existing record. Current: ${currentCredits.balance}, Adding: ${creditAmount}, New: ${newBalance}`);
      
      const { error: updateError } = await supabase
        .from('user_credits')
        .update({
          balance: newBalance,
          total_earned: newTotalEarned,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);
      
      if (updateError) {
        console.error('❌ DEBUG: Error updating credit record:', updateError);
      } else {
        console.log(`✅ DEBUG: Updated credit record. New balance: ${newBalance}`);
      }
    } else {
      console.error('❌ DEBUG: Error fetching current credits:', fetchError);
    }
  } catch (error) {
    console.error('❌ DEBUG: Error in fallbackDirectUpdate:', error);
  }
}

async function verifyCreditsAfterUpdate(userId: string, expectedIncrease: number) {
  try {
    console.log(`🔍 DEBUG: Verifying credits after update...`);
    const { data: finalCredits, error } = await supabase
      .from('user_credits')
      .select('balance, total_earned, updated_at')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('❌ DEBUG: Error verifying credits:', error);
    } else {
      console.log(`🔍 DEBUG: Final credit state:`, JSON.stringify(finalCredits, null, 2));
      console.log(`🔍 DEBUG: Expected increase: ${expectedIncrease}`);
    }
  } catch (error) {
    console.error('❌ DEBUG: Error in verifyCreditsAfterUpdate:', error);
  }
}