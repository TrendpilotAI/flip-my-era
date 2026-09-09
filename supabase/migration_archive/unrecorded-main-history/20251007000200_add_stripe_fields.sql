-- Migration: Add Stripe-specific fields
-- Date: 2025-10-07
-- Purpose: Support Stripe payment integration

BEGIN;

-- Add Stripe-specific fields to credit_transactions
ALTER TABLE credit_transactions 
ADD COLUMN IF NOT EXISTS stripe_session_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_credit_transactions_stripe 
ON credit_transactions(stripe_session_id, stripe_payment_intent_id);

-- Add Stripe customer ID to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT UNIQUE;

-- Add index for Stripe customer lookups
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer 
ON profiles(stripe_customer_id);

-- Add comment for documentation
COMMENT ON COLUMN profiles.stripe_customer_id IS 'Stripe customer ID for payment processing';
COMMENT ON COLUMN credit_transactions.stripe_session_id IS 'Stripe checkout session ID';
COMMENT ON COLUMN credit_transactions.stripe_payment_intent_id IS 'Stripe payment intent ID';
COMMENT ON COLUMN credit_transactions.stripe_subscription_id IS 'Stripe subscription ID';

COMMIT;
