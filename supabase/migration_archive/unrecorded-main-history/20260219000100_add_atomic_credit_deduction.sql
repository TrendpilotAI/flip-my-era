-- Atomic credit deduction function to prevent double-spend race conditions.
-- Uses a single UPDATE with a WHERE balance >= $required guard, eliminating
-- the TOCTOU window from the previous read-then-write pattern.

CREATE OR REPLACE FUNCTION public.deduct_credits(
  p_user_id TEXT,
  p_amount NUMERIC,
  p_description TEXT DEFAULT 'Credit deduction',
  p_metadata JSONB DEFAULT '{}'::JSONB
)
RETURNS TABLE (
  success BOOLEAN,
  new_balance NUMERIC,
  transaction_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_balance NUMERIC;
  v_total_spent NUMERIC;
  v_subscription_type TEXT;
  v_txn_id UUID;
BEGIN
  -- Atomic: deduct credits only if balance is sufficient
  UPDATE user_credits
  SET
    balance = balance - p_amount,
    total_spent = COALESCE(total_spent, 0) + p_amount,
    updated_at = NOW()
  WHERE user_id = p_user_id
    AND balance >= p_amount
  RETURNING balance, total_spent, subscription_type
  INTO v_new_balance, v_total_spent, v_subscription_type;

  -- If no rows updated, insufficient credits
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, NULL::NUMERIC, NULL::UUID;
    RETURN;
  END IF;

  -- Record the transaction
  INSERT INTO credit_transactions (
    user_id,
    amount,
    transaction_type,
    description,
    balance_after_transaction,
    metadata
  ) VALUES (
    p_user_id,
    -p_amount,
    'ebook_generation',
    p_description,
    v_new_balance,
    p_metadata
  )
  RETURNING id INTO v_txn_id;

  RETURN QUERY SELECT TRUE, v_new_balance, v_txn_id;
END;
$$;
