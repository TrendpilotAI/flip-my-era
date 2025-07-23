import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7"
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno"

// Initialize Stripe with your secret key
const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2024-12-18.acacia',
});

// Initialize Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

// Stripe product/price mapping
const STRIPE_PRODUCTS = {
  // Credit Products - Updated with correct price IDs
  'price_1Rk4JDQH2CPu3kDwaJ9W1TDW': { type: 'credits', amount: 1, name: 'Single Credit' },
  'price_1Rk4JDQH2CPu3kDwnWUmRgHb': { type: 'credits', amount: 3, name: '3-Credit Bundle' },
  'price_1Rk4JEQH2CPu3kDwf1ymmbqt': { type: 'credits', amount: 5, name: '5-Credit Bundle' },
};

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      return new Response('No signature', { status: 400 });
    }

    // Verify webhook signature
    let event;
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        Deno.env.get('STRIPE_WEBHOOK_SECRET')!
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return new Response('Invalid signature', { status: 400 });
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object);
        break;
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response('Webhook processed successfully', { status: 200 });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return new Response('Webhook processing failed', { status: 500 });
  }
});

async function handleCheckoutSessionCompleted(session: any) {
  console.log('Processing checkout session:', session.id);
  
  const customerEmail = session.customer_details?.email;
  if (!customerEmail) {
    console.error('No customer email in session');
    return;
  }

  // Find user by email
  const { data: userData, error: userError } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', customerEmail)
    .single();

  if (userError) {
    console.error('Error finding user:', userError);
    return;
  }

  const userId = userData.id;
  console.log(`Found user: ${userId} for email: ${customerEmail}`);

  try {
    // Fetch the session with expanded line_items from Stripe API
    // This ensures we get the complete line items data
    const sessionWithLineItems = await stripe.checkout.sessions.retrieve(
      session.id,
      {
        expand: ['line_items'],
      }
    );

    console.log('Session with line items:', JSON.stringify(sessionWithLineItems, null, 2));

    // Validate that we have line items
    if (!sessionWithLineItems.line_items || !sessionWithLineItems.line_items.data) {
      console.error('No line items found in session');
      return;
    }

    console.log(`Found ${sessionWithLineItems.line_items.data.length} line items`);

    // Process line items
    for (const item of sessionWithLineItems.line_items.data) {
      const priceId = item.price.id;
      const productConfig = STRIPE_PRODUCTS[priceId as keyof typeof STRIPE_PRODUCTS];
      
      if (!productConfig) {
        console.log(`No configuration found for price ID: ${priceId}`);
        continue;
      }

      // Get the quantity from the line item (default to 1 if not specified)
      const quantity = item.quantity || 1;
      const totalCreditsForThisItem = productConfig.amount * quantity;

      console.log(`🔍 ORIGINAL WEBHOOK - Processing item: ${productConfig.name}`);
      console.log(`🔍 ORIGINAL WEBHOOK - Item quantity: ${quantity}`);
      console.log(`🔍 ORIGINAL WEBHOOK - Credits per item: ${productConfig.amount}`);
      console.log(`🔍 ORIGINAL WEBHOOK - Total credits calculated: ${totalCreditsForThisItem}`);
      console.log(`🔍 ORIGINAL WEBHOOK - User ID: ${userId}`);

      if (productConfig.type === 'credits') {
        await allocateCredits(userId, totalCreditsForThisItem, sessionWithLineItems, item);
      }
    }

    // Create order record
    await createOrderRecord(sessionWithLineItems, userId);
  } catch (error) {
    console.error('Error processing checkout session:', error);
    throw error;
  }
}



async function allocateCredits(userId: string, creditAmount: number, session: any, item: any) {
  console.log(`Starting credit allocation for user ${userId}: ${creditAmount} credits`);
  console.log(`Item details:`, JSON.stringify(item, null, 2));
  
  // Get or create user's credit record
  const { data: creditData, error: creditError } = await supabase
    .from('user_credits')
    .select('balance, total_earned')
    .eq('user_id', userId)
    .single();

  let currentBalance = 0;
  let totalEarned = 0;

  if (creditError && creditError.code === 'PGRST116') {
    console.log(`Creating new credit record for user ${userId}`);
    // Create new credit record
    const { data: newCredit, error: createError } = await supabase
      .from('user_credits')
      .insert({
        user_id: userId,
        balance: creditAmount,
        total_earned: creditAmount,
        total_spent: 0
      })
      .select('balance, total_earned')
      .single();

    if (createError) {
      console.error('Error creating credit record:', createError);
      return;
    }
    currentBalance = newCredit.balance;
    totalEarned = newCredit.total_earned;
    console.log(`Created new credit record. Balance: ${currentBalance}, Total earned: ${totalEarned}`);
  } else if (!creditError) {
    console.log(`Updating existing credit record for user ${userId}. Current balance: ${creditData.balance}, Total earned: ${creditData.total_earned}`);
    // Update existing credit record
    currentBalance = creditData.balance + creditAmount;
    totalEarned = (creditData.total_earned || 0) + creditAmount;
    
    const { error: updateError } = await supabase
      .from('user_credits')
      .update({
        balance: currentBalance,
        total_earned: totalEarned,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .single();

    if (updateError) {
      console.error('Error updating credit balance:', updateError);
      return;
    }
    console.log(`Updated credit record. New balance: ${currentBalance}, New total earned: ${totalEarned}`);
  } else {
    console.error('Error fetching credit record:', creditError);
    return;
  }

  // Create credit transaction record
  const { error: transactionError } = await supabase
    .from('credit_transactions')
    .insert({
      user_id: userId,
      type: 'purchase',
      amount: creditAmount,
      description: `Credit purchase: ${item.description || 'Stripe payment'} (${item.quantity || 1} unit${(item.quantity || 1) > 1 ? 's' : ''})`,
      balance_after_transaction: currentBalance,
      stripe_session_id: session.id,
      metadata: {
        stripe_payment_intent: session.payment_intent,
        stripe_customer_id: session.customer,
        product_name: item.description,
        amount_paid: session.amount_total,
        price_id: item.price.id,
        quantity: item.quantity || 1
      }
    })
    .single();

  if (transactionError) {
    console.error('Error creating credit transaction:', transactionError);
  } else {
    console.log(`Created credit transaction record for ${creditAmount} credits`);
  }

  console.log(`Successfully allocated ${creditAmount} credits to user ${userId}. Final balance: ${currentBalance}`);
}

async function createOrderRecord(session: any, userId: string) {
  const { error } = await supabase
    .from('orders')
    .insert({
      stripe_session_id: session.id,
      user_id: userId,
      amount: session.amount_total / 100, // Convert from cents
      status: 'completed',
      customer_email: session.customer_details?.email,
      customer_name: `${session.customer_details?.name || ''}`,
      order_data: session
    })
    .single();

  if (error) {
    console.error('Error creating order record:', error);
  }
} 