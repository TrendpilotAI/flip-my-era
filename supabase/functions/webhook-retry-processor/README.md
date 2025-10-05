# Webhook Retry Processor

This Supabase Edge Function processes webhooks that have been queued for retry due to previous failures.

## Overview

The webhook retry processor:
- Processes webhooks from the retry queue that are scheduled for execution
- Implements exponential backoff for retry attempts
- Handles different webhook types (currently supports Samcart webhooks)
- Updates webhook logs and credit transactions based on processing results

## Setup

1. Ensure the following environment variables are set in your Supabase project:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`

2. Deploy the function to Supabase:
```bash
supabase functions deploy webhook-retry-processor
```

## Usage

The function is designed to be triggered by a cron job or scheduled event. Call it with the service role key:

```bash
curl -X POST https://your-project.supabase.co/functions/v1/webhook-retry-processor \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json"
```

## Retry Logic

- Maximum retry attempts: 5 (configurable)
- Exponential backoff: 1 minute * 2^retry_count
- Maximum delay: 24 hours

## Supported Webhook Types

### Samcart Webhooks
- `subscription_created`
- `subscription_charged`
- `order_completed`
- `subscription_cancelled`
- `order_refunded`

## Database Tables

The processor interacts with:
- `webhook_retry_queue` - Queue of webhooks to retry
- `samcart_webhook_logs` - Log of Samcart webhook events
- `credit_transactions` - User credit transactions
- `users` - User information

## Error Handling

- Failed webhooks are re-queued with exponential backoff
- After maximum retries, webhooks are marked as permanently failed
- All errors are logged for debugging