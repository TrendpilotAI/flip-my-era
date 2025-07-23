-- Fix function overloading issue and ensure proper credit allocation
-- This migration removes any duplicate functions and creates a single, correct version

-- First, drop any existing versions of the function to resolve overloading
DROP FUNCTION IF EXISTS update_user_credits(TEXT, INT);
DROP FUNCTION IF EXISTS update_user_credits(UUID, INT);

-- Create the definitive version that accepts TEXT user IDs (for Clerk compatibility)
CREATE OR REPLACE FUNCTION update_user_credits(p_user_id TEXT, p_credit_amount INT)
RETURNS VOID AS $$
BEGIN
  -- Log the function call for debugging
  RAISE NOTICE 'update_user_credits called with user_id: %, credit_amount: %', p_user_id, p_credit_amount;
  
  -- Validate inputs
  IF p_user_id IS NULL OR p_user_id = '' THEN
    RAISE EXCEPTION 'User ID cannot be null or empty';
  END IF;
  
  IF p_credit_amount <= 0 THEN
    RAISE EXCEPTION 'Credit amount must be positive, got: %', p_credit_amount;
  END IF;
  
  -- Atomically update the user's credit balance
  UPDATE public.user_credits
  SET
    balance = balance + p_credit_amount,
    total_earned = total_earned + p_credit_amount,
    updated_at = NOW()
  WHERE user_id = p_user_id;

  -- If no row was updated, it means the user doesn't have a credit record yet.
  -- In this case, create a new record for them.
  IF NOT FOUND THEN
    RAISE NOTICE 'Creating new credit record for user: %', p_user_id;
    INSERT INTO public.user_credits (user_id, balance, total_earned, total_spent)
    VALUES (p_user_id, p_credit_amount, p_credit_amount, 0);
  ELSE
    RAISE NOTICE 'Updated existing credit record for user: %, added: % credits', p_user_id, p_credit_amount;
  END IF;
  
  -- Log the final balance for verification
  DECLARE
    final_balance INT;
  BEGIN
    SELECT balance INTO final_balance FROM public.user_credits WHERE user_id = p_user_id;
    RAISE NOTICE 'Final balance for user %: %', p_user_id, final_balance;
  END;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION update_user_credits(TEXT, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION update_user_credits(TEXT, INT) TO service_role;

-- Add stripe_session_id column back to credit_transactions if it doesn't exist
ALTER TABLE public.credit_transactions
ADD COLUMN IF NOT EXISTS stripe_session_id VARCHAR(255);

-- Add type column back to credit_transactions if it doesn't exist
ALTER TABLE public.credit_transactions
ADD COLUMN IF NOT EXISTS type TEXT;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_credits_user_id ON public.user_credits(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON public.credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_stripe_session ON public.credit_transactions(stripe_session_id);