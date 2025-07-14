-- Migration 001: Add Stripe Integration
-- Date: 2025-07-05

BEGIN;

-- Add Stripe fields to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS stripe_subscription_id VARCHAR(255);

-- Add Stripe fields to user_credits table
ALTER TABLE user_credits 
ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS stripe_subscription_id VARCHAR(255);

-- Add Stripe fields to credit_transactions table
ALTER TABLE credit_transactions 
ADD COLUMN IF NOT EXISTS stripe_session_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS stripe_payment_intent VARCHAR(255);

-- Add Stripe fields to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS stripe_session_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS stripe_payment_intent VARCHAR(255),
ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255);

-- Create indexes for Stripe fields
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer_id ON profiles(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_user_credits_stripe_customer_id ON user_credits(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_stripe_session_id ON credit_transactions(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_orders_stripe_session_id ON orders(stripe_session_id);

-- Update transaction_type enum to include Stripe-specific types
ALTER TYPE transaction_type ADD VALUE IF NOT EXISTS 'stripe_credit_purchase';
ALTER TYPE transaction_type ADD VALUE IF NOT EXISTS 'stripe_subscription_activation';
ALTER TYPE transaction_type ADD VALUE IF NOT EXISTS 'stripe_subscription_renewal';

COMMIT; 