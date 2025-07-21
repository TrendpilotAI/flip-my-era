CREATE OR REPLACE FUNCTION update_user_credits(p_user_id UUID, p_credit_amount INT)
RETURNS VOID AS $$
BEGIN
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
    INSERT INTO public.user_credits (user_id, balance, total_earned)
    VALUES (p_user_id, p_credit_amount, p_credit_amount);
  END IF;
END;
$$ LANGUAGE plpgsql; 