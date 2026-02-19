-- Webhook events table for idempotency
-- Prevents duplicate processing of Stripe webhook events
CREATE TABLE IF NOT EXISTS webhook_events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  stripe_event_id text NOT NULL UNIQUE,
  event_type text NOT NULL,
  processed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_webhook_events_stripe_event_id ON webhook_events(stripe_event_id);

-- Auto-cleanup: remove events older than 90 days (optional cron)
-- This keeps the table manageable while maintaining idempotency for Stripe's retry window
