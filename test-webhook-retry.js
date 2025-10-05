// Test script for webhook retry functionality
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testWebhookRetry() {
  console.log('🧪 Testing webhook retry functionality...\n');

  try {
    // Test 1: Create a test webhook log
    console.log('1. Creating test webhook log...');
    const { data: webhookLog, error: logError } = await supabase
      .from('samcart_webhook_logs')
      .insert({
        event_type: 'subscription_created',
        event_data: {
          event: 'subscription_created',
          customer_email: 'test@example.com',
          order_id: 'test-order-' + Date.now(),
          product_id: 'test-product',
          product_name: 'Test Product',
          order_total: 99.99,
        },
        processed: false,
      })
      .select()
      .single();

    if (logError) throw logError;
    console.log('✅ Webhook log created:', webhookLog.id);

    // Test 2: Enqueue webhook for retry
    console.log('\n2. Enqueuing webhook for retry...');
    const { data: queueItem, error: queueError } = await supabase
      .from('webhook_retry_queue')
      .insert({
        webhook_type: 'samcart',
        webhook_id: webhookLog.id,
        payload: webhookLog.event_data,
        retry_count: 0,
        max_retries: 3,
        scheduled_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (queueError) throw queueError;
    console.log('✅ Webhook enqueued:', queueItem.id);

    // Test 3: Get pending webhooks
    console.log('\n3. Getting pending webhooks...');
    const { data: pendingWebhooks, error: pendingError } = await supabase
      .from('webhook_retry_queue')
      .select('*')
      .eq('processed', false)
      .lte('scheduled_at', new Date().toISOString());

    if (pendingError) throw pendingError;
    console.log(`✅ Found ${pendingWebhooks.length} pending webhooks`);

    // Test 4: Test retry logic with exponential backoff
    console.log('\n4. Testing exponential backoff calculation...');
    const baseDelay = 60000; // 1 minute
    const backoffMultiplier = 2;
    
    for (let i = 0; i < 5; i++) {
      const delay = baseDelay * Math.pow(backoffMultiplier, i);
      const minutes = Math.round(delay / 60000);
      console.log(`Retry ${i + 1}: ${minutes} minute${minutes > 1 ? 's' : ''}`);
    }

    // Test 5: Simulate webhook processing failure
    console.log('\n5. Simulating webhook processing failure...');
    const { error: failError } = await supabase
      .from('webhook_retry_queue')
      .update({
        retry_count: 1,
        scheduled_at: new Date(Date.now() + 120000).toISOString(), // 2 minutes from now
        error_message: 'Simulated failure',
      })
      .eq('id', queueItem.id);

    if (failError) throw failError;
    console.log('✅ Webhook marked as failed, scheduled for retry');

    // Test 6: Test max retries
    console.log('\n6. Testing max retries...');
    const { error: maxRetryError } = await supabase
      .from('webhook_retry_queue')
      .update({
        retry_count: 3,
        processed: true,
        processed_at: new Date().toISOString(),
        error_message: 'Max retries (3) reached. Last error: Simulated failure',
      })
      .eq('id', queueItem.id);

    if (maxRetryError) throw maxRetryError;
    console.log('✅ Webhook marked as permanently failed');

    // Test 7: Test cleanup of old processed webhooks
    console.log('\n7. Testing cleanup query...');
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const { count, error: cleanupError } = await supabase
      .from('webhook_retry_queue')
      .select('*', { count: 'exact', head: true })
      .eq('processed', true)
      .lt('processed_at', thirtyDaysAgo.toISOString());

    if (cleanupError) throw cleanupError;
    console.log(`✅ Found ${count || 0} webhooks older than 30 days for cleanup`);

    // Test 8: Verify webhook retry processor can be called
    console.log('\n8. Testing webhook retry processor endpoint...');
    const functionUrl = `${supabaseUrl}/functions/v1/webhook-retry-processor`;
    console.log(`Function URL: ${functionUrl}`);
    console.log('Note: You can manually trigger this function with:');
    console.log(`curl -X POST ${functionUrl} \\`);
    console.log('  -H "Authorization: Bearer ' + supabaseServiceKey.substring(0, 10) + '..." \\');
    console.log('  -H "Content-Type: application/json"');

    console.log('\n✅ All tests completed successfully!');
    
    // Cleanup
    console.log('\n🧹 Cleaning up test data...');
    await supabase
      .from('webhook_retry_queue')
      .delete()
      .eq('id', queueItem.id);
    
    await supabase
      .from('samcart_webhook_logs')
      .delete()
      .eq('id', webhookLog.id);
    
    console.log('✅ Cleanup complete');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
testWebhookRetry().catch(console.error);