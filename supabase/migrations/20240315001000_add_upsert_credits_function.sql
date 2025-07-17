-- Migration: Add upsert_user_credits function
-- Date: 2024-03-15

BEGIN;

-- Create function to handle atomic upsert of user credits
CREATE OR REPLACE FUNCTION public.upsert_user_credits(
  p_user_id TEXT,
  p_balance INTEGER,
  p_total_earned INTEGER
) RETURNS void AS $$
BEGIN
  INSERT INTO public.user_credits (
    user_id,
    balance,
    total_earned,
    updated_at
  ) VALUES (
    p_user_id,
    p_balance,
    p_total_earned,
    NOW()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    balance = EXCLUDED.balance,
    total_earned = EXCLUDED.total_earned,
    updated_at = EXCLUDED.updated_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment to function
COMMENT ON FUNCTION public.upsert_user_credits IS 'Atomically upserts user credits with proper conflict handling';

COMMIT; 