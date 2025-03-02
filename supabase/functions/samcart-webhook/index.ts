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
    return formatErrorResponse(error);
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
    console.error('Error finding user:', userError);
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
    console.error('Error creating order record:', orderError);
    return;
  }
  
  // If this is a subscription product, update the user's subscription status
  if (payload.order.subscription_id) {
    // Determine subscription level based on product ID
    let subscriptionLevel: 'free' | 'basic' | 'premium' = 'free';
    
    // Map product IDs to subscription levels
    // You'll need to customize this based on your actual product IDs
    if (payload.product.id === 350399) { // Replace with your actual product ID for basic plan
      subscriptionLevel = 'basic';
    } else if (payload.product.id === 440369) { // Replace with your actual product ID for premium plan
      subscriptionLevel = 'premium';
    }
    
    if (userId) {
      const { error: subscriptionError } = await supabase
        .from('profiles')
        .update({ 
          subscription_status: subscriptionLevel,
          subscription_id: payload.order.subscription_id.toString()
        })
        .eq('id', userId);
      
      if (subscriptionError) {
        console.error('Error updating subscription status:', subscriptionError);
      }
    }
  }
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