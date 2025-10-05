# Samcart Webhook Handler

This Supabase Edge Function handles incoming webhooks from Samcart for order and subscription events.

## Overview

The Samcart webhook handler:
- Receives and validates incoming webhooks from Samcart
- Logs all webhook events for audit purposes
- Processes events based on type (order completed, subscription created, etc.)
- Implements retry logic for failed processing
- Updates user credits based on purchases and refunds

## Setup

1. Configure webhook URL in your Samcart dashboard:
   ```
   https://your-project.supabase.co/functions/v1/samcart-webhook
   ```

2. Ensure the following environment variables are set in your Supabase project:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SAMCART_WEBHOOK_SECRET` (optional, for webhook validation)

3. Deploy the function to Supabase:
```bash
supabase functions deploy samcart-webhook
```

## Usage

The function automatically receives webhooks from Samcart when events occur. No manual triggering is required.

## Supported Events

- `order_completed` - One-time purchase completed
- `subscription_created` - New subscription created
- `subscription_charged` - Subscription payment processed
- `subscription_cancelled` - Subscription cancelled
- `order_refunded` - Order refunded

## Webhook Validation (Optional)

If `SAMCART_WEBHOOK_SECRET` is set, the function will validate incoming webhooks using the signature in the `X-Samcart-Signature` header.

## Processing Logic

### Order/Subscription Creation
1. Finds user by email address
2. Determines credits based on product configuration
3. Creates credit transaction for the purchase
4. Logs the successful processing

### Cancellation/Refund
1. Finds user by email address
2. Determines credits to refund based on product
3. Creates refund transaction
4. Logs the successful processing

### Failed Processing
If any step fails, the webhook is:
1. Logged with the error details
2. Queued for retry with exponential backoff
3. Processed by the webhook-retry-processor function

## Database Tables

The handler interacts with:
- `samcart_webhook_logs` - Stores all webhook events
- `credit_transactions` - Manages user credits
- `users` - User information
- `webhook_retry_queue` - Queue for failed webhooks

## Error Handling

- All webhook events are logged regardless of processing success
- Failed webhooks are automatically queued for retry
- Maximum of 5 retry attempts with exponential backoff
- All errors are logged for debugging