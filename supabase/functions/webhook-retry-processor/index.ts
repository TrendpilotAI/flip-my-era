import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import RetryQueue, { RetryQueueItem } from '../_shared/retryQueue.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SamcartEventData {
  event: string;
  customer_email: string;
  order_id: string;
  product_id: string;
  product_name: string;
  order_total: number;
  subscription_id?: string;
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Verify the request is from Supabase (using service role key)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error('Missing or invalid authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    if (token !== supabaseServiceKey) {
      throw new Error('Invalid authorization token');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const retryQueue = new RetryQueue();

    // Get pending webhooks
    const pendingWebhooks = await retryQueue.getPending(50);

    console.log(`Processing ${pendingWebhooks.length} webhooks from retry queue`);

    const results = {
      processed: 0,
      failed: 0,
      skipped: 0,
    };

    // Process each webhook
    for (const webhook of pendingWebhooks) {
      try {
        console.log(`Processing webhook: ${webhook.webhook_type} (${webhook.webhook_id}) - Attempt ${webhook.retry_count + 1}`);

        // Process based on webhook type
        switch (webhook.webhook_type) {
          case 'samcart':
            await processSamcartWebhook(webhook, retryQueue);
            results.processed++;
            break;
          
          default:
            console.warn(`Unknown webhook type: ${webhook.webhook_type}`);
            await retryQueue.markProcessed(webhook.id);
            results.skipped++;
        }
      } catch (error) {
        console.error(`Failed to process webhook ${webhook.id}:`, error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        await retryQueue.markFailed(webhook.id, errorMessage);
        results.failed++;
      }
    }

    console.log(`Webhook retry processing completed:`, results);

    return new Response(
      JSON.stringify({
        success: true,
        results,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Webhook retry processor error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return new Response(
      JSON.stringify({
        error: errorMessage,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

/**
 * Process a Samcart webhook from the retry queue
 */
async function processSamcartWebhook(webhook: RetryQueueItem, retryQueue: RetryQueue): Promise<void> {
  // Use the same supabase client created in the main handler
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Get the original webhook log
    const { data: webhookLog, error: logError } = await supabase
      .from('samcart_webhook_logs')
      .select('*')
      .eq('id', webhook.webhook_id)
      .single();

    if (logError || !webhookLog) {
      throw new Error(`Webhook log not found: ${webhook.webhook_id}`);
    }

    // Process the webhook based on event type
    const eventData = webhook.payload;
    const eventType = eventData.event;

    console.log(`Processing Samcart event: ${eventType}`);

    switch (eventType) {
      case 'subscription_created':
      case 'subscription_charged':
      case 'order_completed':
        await processOrderEvent(eventData, supabase);
        break;
      
      case 'subscription_cancelled':
      case 'order_refunded':
        await processCancellationEvent(eventData, supabase);
        break;
      
      default:
        console.log(`Unhandled event type: ${eventType}`);
    }

    // Mark webhook log as processed
    const { error: updateError } = await supabase
      .from('samcart_webhook_logs')
      .update({
        processed: true,
        processed_at: new Date().toISOString(),
      })
      .eq('id', webhook.webhook_id);

    if (updateError) throw updateError;

    // Mark retry queue item as processed
    await retryQueue.markProcessed(webhook.id);

    console.log(`Successfully processed Samcart webhook: ${webhook.webhook_id}`);
  } catch (error) {
    console.error(`Failed to process Samcart webhook:`, error);
    throw error;
  }
}

/**
 * Process order events (subscription created, charged, order completed)
 */
async function processOrderEvent(eventData: SamcartEventData, supabase: SupabaseClient): Promise<void> {
  const { customer_email, order_id, product_id, product_name, order_total } = eventData;

  // Find user by email
  const { data: user, error: userError } = await supabase
    .from('profiles')
    .select('id, email')
    .eq('email', customer_email)
    .single();

  if (userError || !user) {
    throw new Error(`User not found for email: ${customer_email}`);
  }

  // Get product details to determine credits
  const credits = await getProductCredits(product_id, supabase);

  // Create credit transaction
  const { error: transactionError } = await supabase
    .from('credit_transactions')
    .insert({
      user_id: user.id,
      transaction_type: 'purchase',
      credits: credits,
      amount_cents: Math.round(order_total * 100),
      description: `Purchase: ${product_name}`,
      metadata: {
        order_id,
        product_id,
        product_name,
      },
    });

  if (transactionError) throw transactionError;

  console.log(`Added ${credits} credits to user ${user.email}`);
}

/**
 * Process cancellation events (subscription cancelled, order refunded)
 */
async function processCancellationEvent(eventData: SamcartEventData, supabase: SupabaseClient): Promise<void> {
  const { customer_email, order_id, subscription_id } = eventData;

  // Find user by email
  const { data: user, error: userError } = await supabase
    .from('profiles')
    .select('id, email')
    .eq('email', customer_email)
    .single();

  if (userError || !user) {
    throw new Error(`User not found for email: ${customer_email}`);
  }

  // Update user's subscription status to free if this was a subscription cancellation
  if (subscription_id) {
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ 
        subscription_status: 'free',
        subscription_id: null
      })
      .eq('id', user.id);

    if (profileError) {
      console.error('Error updating profile subscription status:', profileError);
      throw profileError;
    }

    // Update user_credits table to remove subscription type
    const { error: creditsError } = await supabase
      .from('user_credits')
      .update({ 
        subscription_type: null,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id);

    if (creditsError && creditsError.code !== 'PGRST116') {
      console.error('Error updating user_credits subscription:', creditsError);
      // Don't throw - this is not critical if the record doesn't exist
    }
  }

  console.log(`Processed cancellation for user ${user.email}`);
}

/**
 * Get credits for a product
 */
async function getProductCredits(productId: string, supabase: SupabaseClient): Promise<number> {
  // This is a simplified version - you might want to store this mapping in a database table
  const productCredits: Record<string, number> = {
    // Add your product ID to credit mappings here
    // 'product_id': credits,
  };

  // Default to 0 if product not found
  return productCredits[productId] || 0;
}