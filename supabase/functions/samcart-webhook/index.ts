import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'
import { 
  handleCors, 
  initSupabaseClient, 
  formatErrorResponse, 
  formatSuccessResponse 
} from "../_shared/utils.ts"

interface SamCartWebhookPayload {
  type: string;
  api_key: string | null;
  product: {
    id: number;
    name: string;
    price: string | number;
    transaction_id?: string;
  };
  customer: {
    first_name: string;
    last_name: string;
    email: string;
    phone_number: string;
    customer_id: number;
    billing_address?: string;
    billing_city?: string;
    billing_state?: string;
    billing_zip?: string;
    billing_country?: string;
  };
  order: {
    id: number;
    total: string | number;
    ip_address: string;
    stripe_id?: string;
    subscription_id?: number;
    custom_fields?: Array<{
      name: string;
      slug: string;
      value: string;
    }>;
    transaction_id?: string[];
    shipping_address?: string;
    shipping_city?: string;
    shipping_state?: string;
    shipping_zip?: string;
    shipping_country?: string;
    created_at?: string;
  };
  affiliate?: {
    id: number | null;
    token: string | null;
  };
  processor?: string;
  refund_transaction_id?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    // Parse the webhook payload
    const payload: SamCartWebhookPayload = await req.json();
    
    // Initialize Supabase client
    const supabase = initSupabaseClient();
    
    // Process the webhook based on the event type
    switch (payload.type) {
      case 'Order':
        // Handle new order
        await handleNewOrder(supabase, payload);
        break;
      
      case 'Refund':
      case 'PartialRefund':
        // Handle refund
        await handleRefund(supabase, payload);
        break;
      
      case 'RecurringPaymentSucceeded':
        // Handle successful subscription payment
        await handleSubscriptionPayment(supabase, payload);
        break;
      
      case 'Cancel':
        // Handle subscription cancellation
        await handleSubscriptionCancellation(supabase, payload);
        break;
      
      case 'RecurringPaymentFailed':
        // Handle failed subscription payment
        await handleFailedPayment(supabase, payload);
        break;
      
      case 'SubscriptionRestarted':
        // Handle subscription restart
        await handleSubscriptionRestart(supabase, payload);
        break;
        
      case 'SubscriptionRecovered':
        // Handle subscription recovery
        await handleSubscriptionRestart(supabase, payload);
        break;
      
      default:
        console.log(`Unhandled webhook event type: ${payload.type}`);
    }
    
    // Return a success response
    return formatSuccessResponse({ message: 'Webhook processed successfully' });
  } catch (error) {
    // Log error without exposing sensitive webhook data
    console.error('Webhook processing error:', error instanceof Error ? error.message : 'Unknown error');
    
    // Return generic error response to prevent information leakage
    return formatErrorResponse(new Error('Webhook processing failed'), 400);
  }
});

// Handler functions for different webhook events

async function handleNewOrder(supabase: SupabaseClient, payload: SamCartWebhookPayload) {
  // Find user by email
  const { data: userData, error: userError } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', payload.customer.email)
    .single();
  
  if (userError && userError.code !== 'PGRST116') {
    console.error('Database error occurred while finding user');
    return;
  }
  
  const userId = userData?.id || null;
  
  // Create order record
  const { error: orderError } = await supabase
    .from('orders')
    .insert({
      samcart_order_id: payload.order.id.toString(),
      user_id: userId,
      product_id: payload.product.id.toString(),
      product_name: payload.product.name,
      amount: typeof payload.order.total === 'string' ? parseFloat(payload.order.total) : payload.order.total,
      status: 'completed',
      customer_email: payload.customer.email,
      customer_name: `${payload.customer.first_name} ${payload.customer.last_name}`,
      order_data: payload
    });
  
  if (orderError) {
    console.error('Database error occurred while creating order record');
    return;
  }
  
  // Handle credit allocation based on product type
  if (userId) {
    await allocateCreditsForPurchase(supabase, userId, payload);
  }
}

// New function to handle credit allocation for purchases
async function allocateCreditsForPurchase(supabase: SupabaseClient, userId: string, payload: SamCartWebhookPayload) {
  // Map SamCart product IDs to credit amounts and subscription types
  // These IDs should match your actual SamCart product configuration
  const productMapping: Record<number, { type: 'credits' | 'subscription', amount?: number, subscription_type?: string }> = {
    // Credit Products
    350001: { type: 'credits', amount: 1 },      // Single Credit ($2.99)
    350002: { type: 'credits', amount: 3 },      // 3-Credit Bundle ($7.99)
    350003: { type: 'credits', amount: 5 },      // 5-Credit Bundle ($11.99)
    
    // Subscription Products
    350004: { type: 'subscription', subscription_type: 'monthly_unlimited' },  // Monthly Unlimited ($9.99)
    350005: { type: 'subscription', subscription_type: 'annual_unlimited' },   // Annual Unlimited ($89.99)
    
    // Legacy subscription mappings (keeping for backward compatibility)
    350399: { type: 'subscription', subscription_type: 'monthly_unlimited' },  // Legacy basic plan
    440369: { type: 'subscription', subscription_type: 'annual_unlimited' },   // Legacy premium plan
  };
  
  const productConfig = productMapping[payload.product.id];
  
  if (!productConfig) {
    console.log(`No credit allocation configured for product ID: ${payload.product.id}`);
    return;
  }
  
  try {
    if (productConfig.type === 'credits') {
      // Handle credit purchase
      await allocateCredits(supabase, userId, productConfig.amount!, payload);
    } else if (productConfig.type === 'subscription') {
      // Handle subscription purchase
      await updateSubscriptionStatus(supabase, userId, productConfig.subscription_type!, payload);
    }
  } catch (error) {
    console.error('Error allocating credits/subscription:', error);
  }
}

// Function to allocate credits for credit purchases
async function allocateCredits(supabase: SupabaseClient, userId: string, creditAmount: number, payload: SamCartWebhookPayload) {
  // Get or create user's credit record
  const { data: creditData, error: creditError } = await supabase
    .from('user_credits')
    .select('balance, subscription_type')
    .eq('user_id', userId)
    .single();
  
  let currentBalance = 0;
  let subscriptionType = null;
  
  if (creditError && creditError.code === 'PGRST116') {
    // No credit record exists, create one
    const { data: newCredit, error: createError } = await supabase
      .from('user_credits')
      .insert({
        user_id: userId,
        balance: creditAmount,
        subscription_type: null
      })
      .select('balance, subscription_type')
      .single();
    
    if (createError) {
      console.error('Error creating credit record:', createError);
      return;
    }
    
    currentBalance = newCredit.balance;
    subscriptionType = newCredit.subscription_type;
  } else if (!creditError) {
    // Update existing credit record
    currentBalance = creditData.balance + creditAmount;
    subscriptionType = creditData.subscription_type;
    
    const { error: updateError } = await supabase
      .from('user_credits')
      .update({
        balance: currentBalance,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);
    
    if (updateError) {
      console.error('Error updating credit balance:', updateError);
      return;
    }
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
      description: `Credit purchase: ${payload.product.name}`,
      samcart_order_id: payload.order.id.toString(),
      metadata: {
        product_id: payload.product.id,
        product_name: payload.product.name,
        order_total: payload.order.total,
        customer_email: payload.customer.email
      }
    });
  
  if (transactionError) {
    console.error('Error creating credit transaction:', transactionError);
  }
  
  console.log(`Allocated ${creditAmount} credits to user ${userId}. New balance: ${currentBalance}`);
}

// Function to update subscription status for subscription purchases
async function updateSubscriptionStatus(supabase: SupabaseClient, userId: string, subscriptionType: string, payload: SamCartWebhookPayload) {
  // Update user's credit record with subscription type
  const { data: creditData, error: creditError } = await supabase
    .from('user_credits')
    .select('balance')
    .eq('user_id', userId)
    .single();
  
  let currentBalance = 0;
  
  if (creditError && creditError.code === 'PGRST116') {
    // No credit record exists, create one with subscription
    const { error: createError } = await supabase
      .from('user_credits')
      .insert({
        user_id: userId,
        balance: 0,
        subscription_type: subscriptionType
      });
    
    if (createError) {
      console.error('Error creating credit record with subscription:', createError);
      return;
    }
  } else if (!creditError) {
    // Update existing credit record with subscription
    currentBalance = creditData.balance;
    
    const { error: updateError } = await supabase
      .from('user_credits')
      .update({
        subscription_type: subscriptionType,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);
    
    if (updateError) {
      console.error('Error updating subscription status:', updateError);
      return;
    }
  } else {
    console.error('Error fetching credit record:', creditError);
    return;
  }
  
  // Update legacy subscription fields in profiles for backward compatibility
  if (payload.order.subscription_id) {
    const legacySubscriptionLevel = subscriptionType === 'monthly_unlimited' ? 'basic' :
                                   subscriptionType === 'annual_unlimited' ? 'premium' : 'free';
    
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        subscription_status: legacySubscriptionLevel,
        subscription_id: payload.order.subscription_id.toString()
      })
      .eq('id', userId);
    
    if (profileError) {
      console.error('Error updating profile subscription status:', profileError);
    }
  }
  
  // Create transaction record for subscription activation
  const { error: transactionError } = await supabase
    .from('credit_transactions')
    .insert({
      user_id: userId,
      type: 'purchase',
      amount: 0, // No credits added, but subscription activated
      description: `Subscription activated: ${payload.product.name}`,
      samcart_order_id: payload.order.id.toString(),
      metadata: {
        product_id: payload.product.id,
        product_name: payload.product.name,
        subscription_type: subscriptionType,
        subscription_id: payload.order.subscription_id?.toString(),
        order_total: payload.order.total,
        customer_email: payload.customer.email
      }
    });
  
  if (transactionError) {
    console.error('Error creating subscription transaction:', transactionError);
  }
  
  console.log(`Activated ${subscriptionType} subscription for user ${userId}`);
}

async function handleRefund(supabase: SupabaseClient, payload: SamCartWebhookPayload) {
  // Update order status to refunded
  const { error } = await supabase
    .from('orders')
    .update({ status: 'refunded' })
    .eq('samcart_order_id', payload.order.id.toString());
  
  if (error) {
    console.error('Error updating order status:', error);
    return;
  }
  
  // If this was a subscription product, update the user's subscription status
  if (payload.order.subscription_id) {
    // Find the user associated with this order
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .select('user_id')
      .eq('samcart_order_id', payload.order.id.toString())
      .single();
    
    if (orderError) {
      console.error('Error finding order:', orderError);
      return;
    }
    
    if (orderData?.user_id) {
      const { error: subscriptionError } = await supabase
        .from('profiles')
        .update({ 
          subscription_status: 'free',
          subscription_id: null
        })
        .eq('id', orderData.user_id);
      
      if (subscriptionError) {
        console.error('Error updating subscription status:', subscriptionError);
      }
    }
  }
}

async function handleSubscriptionPayment(supabase: SupabaseClient, payload: SamCartWebhookPayload) {
  // Create a record for the subscription payment
  const { error } = await supabase
    .from('subscription_payments')
    .insert({
      subscription_id: payload.order.subscription_id?.toString(),
      order_id: payload.order.id.toString(),
      amount: typeof payload.order.total === 'string' ? parseFloat(payload.order.total) : payload.order.total,
      status: 'succeeded',
      customer_email: payload.customer.email,
      payment_data: payload
    });
  
  if (error) {
    console.error('Error recording subscription payment:', error);
  }
}

async function handleSubscriptionCancellation(supabase: SupabaseClient, payload: SamCartWebhookPayload) {
  // Find the user with this subscription
  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('subscription_id', payload.order.subscription_id?.toString())
    .single();
  
  if (profileError && profileError.code !== 'PGRST116') {
    console.error('Error finding user profile:', profileError);
    return;
  }
  
  if (profileData?.id) {
    // Update the user's subscription status
    const { error } = await supabase
      .from('profiles')
      .update({ 
        subscription_status: 'free',
        subscription_end_date: new Date().toISOString() // Set end date to now
      })
      .eq('id', profileData.id);
    
    if (error) {
      console.error('Error updating subscription status:', error);
    }
  }
}

async function handleFailedPayment(supabase: SupabaseClient, payload: SamCartWebhookPayload) {
  // Record the failed payment
  const { error } = await supabase
    .from('subscription_payments')
    .insert({
      subscription_id: payload.order.subscription_id?.toString(),
      order_id: payload.order.id.toString(),
      amount: typeof payload.order.total === 'string' ? parseFloat(payload.order.total) : payload.order.total,
      status: 'failed',
      customer_email: payload.customer.email,
      payment_data: payload
    });
  
  if (error) {
    console.error('Error recording failed payment:', error);
  }
}

async function handleSubscriptionRestart(supabase: SupabaseClient, payload: SamCartWebhookPayload) {
  // Find the user with this subscription
  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('subscription_id', payload.order.subscription_id?.toString())
    .single();
  
  if (profileError && profileError.code !== 'PGRST116') {
    console.error('Error finding user profile:', profileError);
    return;
  }
  
  if (profileData?.id) {
    // Determine subscription level based on product ID
    let subscriptionLevel: 'free' | 'basic' | 'premium' = 'free';
    
    // Map product IDs to subscription levels
    // You'll need to customize this based on your actual product IDs
    if (payload.product.id === 350399) { // Replace with your actual product ID for basic plan
      subscriptionLevel = 'basic';
    } else if (payload.product.id === 440369) { // Replace with your actual product ID for premium plan
      subscriptionLevel = 'premium';
    }
    
    // Update the user's subscription status
    const { error } = await supabase
      .from('profiles')
      .update({ 
        subscription_status: subscriptionLevel,
        subscription_end_date: null // Remove end date
      })
      .eq('id', profileData.id);
    
    if (error) {
      console.error('Error updating subscription status:', error);
    }
  }
} 