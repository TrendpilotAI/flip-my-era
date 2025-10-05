import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import RetryQueue from '../_shared/retryQueue.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
        await retryQueue.markFailed(webhook.id, error.message);
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
    
    return new Response(
      JSON.stringify({
        error: error.message,
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
async function processSamcartWebhook(webhook: any, retryQueue: RetryQueue) {
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
async function processOrderEvent(eventData: any, supabase: any) {
  const { customer_email, order_id, product_id, product_name, order_total } = eventData;

  // Find user by email
  const { data: user, error: userError } = await supabase
    .from('users')
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
async function processCancellationEvent(eventData: any, supabase: any) {
  const { customer_email, order_id, product_id, product_name } = eventData;

  // Find user by email
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id, email')
    .eq('email', customer_email)
    .single();

  if (userError || !user) {
    throw new Error(`User not found for email: ${customer_email}`);
  }

  // Get product details to determine credits to remove
  const credits = await getProductCredits(product_id, supabase);

  // Create refund transaction
  const { error: transactionError } = await supabase
    .from('credit_transactions')
    .insert({
      user_id: user.id,
      transaction_type: 'refund',
      credits: credits,
      description: `Refund: ${product_name}`,
      metadata: {
        order_id,
        product_id,
        product_name,
      },
    });

  if (transactionError) throw transactionError;

  console.log(`Refunded ${credits} credits from user ${user.email}`);
}

/**
 * Get credits for a product
 */
async function getProductCredits(productId: string, supabase: any): Promise<number> {
  // This is a simplified version - you might want to store this mapping in a database table
  const productCredits: Record<string, number> = {
    // Add your product ID to credit mappings here
    // 'product_id': credits,
  };

  // Default to 0 if product not found
  return productCredits[productId] || 0;
}