-- Migration 001: Create Credit System
-- Phase 1A: Enhanced E-Book Generation System
-- Date: 2025-06-29

BEGIN;

-- Create enums for credit system
CREATE TYPE subscription_status AS ENUM ('none', 'active', 'cancelled', 'expired', 'past_due');
CREATE TYPE subscription_type AS ENUM ('monthly', 'annual');
CREATE TYPE transaction_type AS ENUM (
  'purchase_single', 'purchase_bundle_3', 'purchase_bundle_5',
  'subscription_monthly', 'subscription_annual', 'subscription_renewal',
  'ebook_generation', 'refund', 'adjustment', 'monthly_allocation'
);

-- Create user_credits table
CREATE TABLE user_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  
  -- Credit balance tracking
  balance INTEGER DEFAULT 0 NOT NULL CHECK (balance >= 0),
  total_earned INTEGER DEFAULT 0 NOT NULL,
  total_spent INTEGER DEFAULT 0 NOT NULL,
  
  -- Subscription information
  subscription_status subscription_status DEFAULT 'none',
  subscription_type subscription_type DEFAULT NULL,
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
CREATE TABLE credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Transaction details
  amount INTEGER NOT NULL, -- positive for credits earned, negative for credits spent
  transaction_type transaction_type NOT NULL,
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

-- Create performance indexes
CREATE INDEX idx_user_credits_user_id ON user_credits(user_id);
CREATE INDEX idx_user_credits_subscription_status ON user_credits(subscription_status);
CREATE INDEX idx_user_credits_subscription_expires ON user_credits(subscription_expires_at);

CREATE INDEX idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX idx_credit_transactions_type ON credit_transactions(transaction_type);
CREATE INDEX idx_credit_transactions_created_at ON credit_transactions(created_at DESC);
CREATE INDEX idx_credit_transactions_reference_id ON credit_transactions(reference_id);
CREATE INDEX idx_credit_transactions_samcart_order ON credit_transactions(samcart_order_id);

-- Create trigger function for updating timestamps
CREATE OR REPLACE FUNCTION update_user_credits_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updating updated_at timestamp
CREATE TRIGGER trigger_user_credits_updated_at
    BEFORE UPDATE ON user_credits
    FOR EACH ROW EXECUTE FUNCTION update_user_credits_updated_at();

-- Create function to maintain credit balance integrity
CREATE OR REPLACE FUNCTION maintain_credit_balance()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the user's credit balance after each transaction
    UPDATE user_credits 
    SET 
        balance = GREATEST(0, (
            SELECT COALESCE(SUM(amount), 0) 
            FROM credit_transactions 
            WHERE user_id = NEW.user_id
        )),
        total_earned = (
            SELECT COALESCE(SUM(amount), 0) 
            FROM credit_transactions 
            WHERE user_id = NEW.user_id AND amount > 0
        ),
        total_spent = ABS((
            SELECT COALESCE(SUM(amount), 0) 
            FROM credit_transactions 
            WHERE user_id = NEW.user_id AND amount < 0
        ))
    WHERE user_id = NEW.user_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to maintain credit balance
CREATE TRIGGER trigger_maintain_credit_balance
    AFTER INSERT ON credit_transactions
    FOR EACH ROW EXECUTE FUNCTION maintain_credit_balance();

-- Create function to initialize user credits when user is created
CREATE OR REPLACE FUNCTION initialize_user_credits()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_credits (user_id) 
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-create user credits record for new users
CREATE TRIGGER trigger_initialize_user_credits
    AFTER INSERT ON profiles
    FOR EACH ROW EXECUTE FUNCTION initialize_user_credits();

-- Initialize credit records for existing users
INSERT INTO user_credits (user_id)
SELECT id FROM profiles
ON CONFLICT (user_id) DO NOTHING;

COMMIT;