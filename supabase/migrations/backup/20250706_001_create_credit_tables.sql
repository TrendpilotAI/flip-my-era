-- Migration: Create Credit Tables
-- Date: 2025-07-06

BEGIN;

-- Create user_credits table
CREATE TABLE IF NOT EXISTS public.user_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  
  -- Credit balance tracking
  balance INTEGER DEFAULT 0 NOT NULL CHECK (balance >= 0),
  total_earned INTEGER DEFAULT 0 NOT NULL,
  total_spent INTEGER DEFAULT 0 NOT NULL,
  
  -- Subscription information
  subscription_status TEXT DEFAULT 'none',
  subscription_type TEXT DEFAULT NULL,
  subscription_starts_at TIMESTAMP DEFAULT NULL,
  subscription_expires_at TIMESTAMP DEFAULT NULL,
  monthly_credit_allowance INTEGER DEFAULT 0,
  monthly_credits_used INTEGER DEFAULT 0,
  current_period_start TIMESTAMP DEFAULT NULL,
  current_period_end TIMESTAMP DEFAULT NULL,
  
  -- SamCart integration
  samcart_subscription_id VARCHAR(255) DEFAULT NULL,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create credit_transactions table
CREATE TABLE IF NOT EXISTS public.credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Transaction details
  amount INTEGER NOT NULL, -- positive for credits earned, negative for credits spent
  transaction_type TEXT NOT NULL,
  description TEXT NOT NULL,
  
  -- Reference information
  reference_id VARCHAR(255), -- SamCart order ID, ebook generation ID, etc.
  samcart_order_id VARCHAR(255),
  ebook_generation_id UUID,
  
  -- Transaction metadata
  metadata JSONB DEFAULT '{}',
  
  -- Balance after transaction (for audit trail)
  balance_after_transaction INTEGER NOT NULL,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_credits_user_id ON user_credits(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_type ON credit_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at ON credit_transactions(created_at DESC);

-- Enable RLS
ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_credits
CREATE POLICY "Users can view own credits" ON user_credits
  FOR SELECT USING (true);

CREATE POLICY "Users can update own credits" ON user_credits
  FOR UPDATE USING (true);

-- Create RLS policies for credit_transactions
CREATE POLICY "Users can view own transactions" ON credit_transactions
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own transactions" ON credit_transactions
  FOR INSERT WITH CHECK (true);

COMMIT; 