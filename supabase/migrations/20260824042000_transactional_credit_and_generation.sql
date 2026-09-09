BEGIN;

-- The core convergence migration creates the canonical numeric credit columns.
-- These additions make the shared transaction primitive usable by generation and
-- payment handlers without exposing direct ledger writes to browser roles.
ALTER TABLE public.credit_transactions
  ADD COLUMN IF NOT EXISTS idempotency_key TEXT,
  ADD COLUMN IF NOT EXISTS reference_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_session_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

-- Production inherited these narrow checks from an unrecorded legacy table
-- definition. Canonical signed amounts and explicit transaction names replace
-- the old positive-magnitude/four-value model.
ALTER TABLE public.credit_transactions
  DROP CONSTRAINT IF EXISTS credit_transactions_transaction_type_check,
  DROP CONSTRAINT IF EXISTS credit_transactions_credits_check;

CREATE UNIQUE INDEX IF NOT EXISTS credit_transactions_idempotency_key_key
  ON public.credit_transactions (idempotency_key)
  WHERE idempotency_key IS NOT NULL;

-- A legacy trigger recalculated balances after ledger inserts in some historical
-- installs. The functions below update the balance and ledger in one transaction,
-- so retaining that trigger would apply every transaction twice.
DROP TRIGGER IF EXISTS trigger_maintain_credit_balance ON public.credit_transactions;

CREATE TABLE IF NOT EXISTS public.generation_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idempotency_key TEXT NOT NULL,
  user_id TEXT NOT NULL,
  operation_type TEXT NOT NULL,
  credits_charged NUMERIC(12, 2) NOT NULL DEFAULT 0,
  transaction_id UUID REFERENCES public.credit_transactions(id),
  refund_transaction_id UUID REFERENCES public.credit_transactions(id),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'completed', 'failed')),
  response_cache JSONB,
  error_code TEXT,
  error_message TEXT,
  lease_token UUID,
  attempt_count INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '2 minutes',
  CONSTRAINT generation_requests_user_key_unique UNIQUE (user_id, idempotency_key)
);

ALTER TABLE public.generation_requests
  ADD COLUMN IF NOT EXISTS refund_transaction_id UUID REFERENCES public.credit_transactions(id),
  ADD COLUMN IF NOT EXISTS error_code TEXT,
  ADD COLUMN IF NOT EXISTS error_message TEXT,
  ADD COLUMN IF NOT EXISTS lease_token UUID,
  ADD COLUMN IF NOT EXISTS attempt_count INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS failed_at TIMESTAMPTZ;

ALTER TABLE public.generation_requests
  ALTER COLUMN expires_at SET DEFAULT NOW() + INTERVAL '2 minutes';

ALTER TABLE public.generation_requests
  DROP CONSTRAINT IF EXISTS generation_requests_attempt_count_positive;

ALTER TABLE public.generation_requests
  ADD CONSTRAINT generation_requests_attempt_count_positive CHECK (attempt_count > 0);

CREATE UNIQUE INDEX IF NOT EXISTS generation_requests_user_idempotency_key_key
  ON public.generation_requests (user_id, idempotency_key);

CREATE INDEX IF NOT EXISTS generation_requests_expires_at_idx
  ON public.generation_requests (expires_at);

CREATE INDEX IF NOT EXISTS generation_requests_user_status_idx
  ON public.generation_requests (user_id, status);

ALTER TABLE public.generation_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generation_requests FORCE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.generation_requests FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.generation_requests TO service_role;

CREATE OR REPLACE FUNCTION public.apply_credit_transaction(
  p_user_id TEXT,
  p_amount NUMERIC,
  p_transaction_type TEXT,
  p_description TEXT,
  p_metadata JSONB DEFAULT '{}'::JSONB,
  p_idempotency_key TEXT DEFAULT NULL,
  p_reference_id TEXT DEFAULT NULL,
  p_stripe_session_id TEXT DEFAULT NULL,
  p_stripe_payment_intent_id TEXT DEFAULT NULL,
  p_stripe_subscription_id TEXT DEFAULT NULL
)
RETURNS TABLE (
  success BOOLEAN,
  new_balance NUMERIC,
  transaction_id UUID,
  is_replay BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_amount NUMERIC(12, 2);
  v_current_balance NUMERIC(12, 2);
  v_new_balance NUMERIC(12, 2);
  v_transaction_id UUID;
  v_existing public.credit_transactions%ROWTYPE;
BEGIN
  IF p_user_id IS NULL OR pg_catalog.btrim(p_user_id) = '' THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'p_user_id is required';
  END IF;

  IF p_amount IS NULL THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'p_amount is required';
  END IF;

  v_amount := p_amount::NUMERIC(12, 2);
  IF v_amount <> p_amount THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'p_amount supports at most two decimal places';
  END IF;

  IF p_transaction_type IS NULL OR pg_catalog.btrim(p_transaction_type) = '' THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'p_transaction_type is required';
  END IF;

  IF p_description IS NULL OR pg_catalog.btrim(p_description) = '' THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'p_description is required';
  END IF;

  IF p_idempotency_key IS NOT NULL THEN
    IF pg_catalog.btrim(p_idempotency_key) = '' OR pg_catalog.length(p_idempotency_key) > 255 THEN
      RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'p_idempotency_key must contain 1 to 255 characters';
    END IF;

    -- Serialize globally by key, including callers operating on different users.
    PERFORM pg_catalog.pg_advisory_xact_lock(
      pg_catalog.hashtextextended('credit:' || p_idempotency_key, 0)
    );

    SELECT ct.*
      INTO v_existing
      FROM public.credit_transactions AS ct
     WHERE ct.idempotency_key = p_idempotency_key;

    IF FOUND THEN
      IF v_existing.user_id IS DISTINCT FROM p_user_id
         OR v_existing.amount IS DISTINCT FROM v_amount
         OR v_existing.transaction_type IS DISTINCT FROM p_transaction_type THEN
        RAISE EXCEPTION USING
          ERRCODE = '22023',
          MESSAGE = 'idempotency key was already used for a different credit transaction';
      END IF;

      RETURN QUERY
      SELECT TRUE,
             v_existing.balance_after_transaction::NUMERIC,
             v_existing.id,
             TRUE;
      RETURN;
    END IF;
  END IF;

  INSERT INTO public.user_credits (
    user_id,
    balance,
    total_earned,
    total_spent,
    created_at,
    updated_at
  )
  VALUES (p_user_id, 0, 0, 0, NOW(), NOW())
  ON CONFLICT (user_id) DO NOTHING;

  SELECT uc.balance
    INTO v_current_balance
    FROM public.user_credits AS uc
   WHERE uc.user_id = p_user_id
   FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'unable to create or lock user credit balance';
  END IF;

  -- Recheck after the user balance lock. This also protects installations where
  -- the unique index was created after older concurrent callers began work.
  IF p_idempotency_key IS NOT NULL THEN
    SELECT ct.*
      INTO v_existing
      FROM public.credit_transactions AS ct
     WHERE ct.idempotency_key = p_idempotency_key;

    IF FOUND THEN
      IF v_existing.user_id IS DISTINCT FROM p_user_id
         OR v_existing.amount IS DISTINCT FROM v_amount
         OR v_existing.transaction_type IS DISTINCT FROM p_transaction_type THEN
        RAISE EXCEPTION USING
          ERRCODE = '22023',
          MESSAGE = 'idempotency key was already used for a different credit transaction';
      END IF;

      RETURN QUERY
      SELECT TRUE,
             v_existing.balance_after_transaction::NUMERIC,
             v_existing.id,
             TRUE;
      RETURN;
    END IF;
  END IF;

  v_new_balance := v_current_balance + v_amount;
  IF v_new_balance < 0 THEN
    RETURN QUERY SELECT FALSE, v_current_balance::NUMERIC, NULL::UUID, FALSE;
    RETURN;
  END IF;

  UPDATE public.user_credits
     SET balance = v_new_balance,
         total_earned = COALESCE(total_earned, 0) + GREATEST(v_amount, 0),
         total_spent = COALESCE(total_spent, 0) + GREATEST(-v_amount, 0),
         updated_at = NOW()
   WHERE user_id = p_user_id;

  INSERT INTO public.credit_transactions (
    user_id,
    amount,
    transaction_type,
    description,
    balance_after_transaction,
    metadata,
    idempotency_key,
    reference_id,
    stripe_session_id,
    stripe_payment_intent_id,
    stripe_subscription_id
  )
  VALUES (
    p_user_id,
    v_amount,
    p_transaction_type,
    p_description,
    v_new_balance,
    COALESCE(p_metadata, '{}'::JSONB),
    p_idempotency_key,
    p_reference_id,
    p_stripe_session_id,
    p_stripe_payment_intent_id,
    p_stripe_subscription_id
  )
  RETURNING id INTO v_transaction_id;

  RETURN QUERY SELECT TRUE, v_new_balance::NUMERIC, v_transaction_id, FALSE;
END;
$$;

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
SET search_path = ''
AS $$
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'p_amount must be greater than zero';
  END IF;

  RETURN QUERY
  SELECT result.success,
         result.new_balance,
         result.transaction_id
    FROM public.apply_credit_transaction(
      p_user_id => p_user_id,
      p_amount => -p_amount,
      p_transaction_type => COALESCE(
        NULLIF(p_metadata ->> 'transaction_type', ''),
        NULLIF(p_metadata ->> 'operation_type', ''),
        'usage'
      ),
      p_description => p_description,
      p_metadata => COALESCE(p_metadata, '{}'::JSONB),
      p_idempotency_key => NULLIF(p_metadata ->> 'idempotency_key', ''),
      p_reference_id => NULLIF(p_metadata ->> 'reference_id', '')
    ) AS result;
END;
$$;

DROP FUNCTION IF EXISTS public.claim_generation_request(TEXT, TEXT, TEXT, NUMERIC, JSONB);

CREATE FUNCTION public.claim_generation_request(
  p_user_id TEXT,
  p_idempotency_key TEXT,
  p_operation_type TEXT,
  p_credits NUMERIC,
  p_metadata JSONB DEFAULT '{}'::JSONB
)
RETURNS TABLE (
  request_id UUID,
  outcome TEXT,
  status TEXT,
  transaction_id UUID,
  credits_charged NUMERIC,
  current_balance NUMERIC,
  response_cache JSONB,
  lease_token UUID,
  lease_expires_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_request public.generation_requests%ROWTYPE;
  v_credit RECORD;
  v_credit_key TEXT;
  v_balance NUMERIC;
  v_lease_token UUID;
BEGIN
  IF p_user_id IS NULL OR pg_catalog.btrim(p_user_id) = '' THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'p_user_id is required';
  END IF;

  IF p_idempotency_key IS NULL
     OR pg_catalog.btrim(p_idempotency_key) = ''
     OR pg_catalog.length(p_idempotency_key) > 200 THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'p_idempotency_key must contain 1 to 200 characters';
  END IF;

  IF p_operation_type IS NULL OR pg_catalog.btrim(p_operation_type) = '' THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'p_operation_type is required';
  END IF;

  IF p_credits IS NULL OR p_credits <= 0 OR p_credits::NUMERIC(12, 2) <> p_credits THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'p_credits must be positive with at most two decimal places';
  END IF;

  PERFORM pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('generation:' || p_user_id || ':' || p_idempotency_key, 0)
  );

  SELECT gr.*
    INTO v_request
    FROM public.generation_requests AS gr
   WHERE gr.user_id = p_user_id
     AND gr.idempotency_key = p_idempotency_key
   FOR UPDATE;

  IF FOUND THEN
    IF v_request.operation_type IS DISTINCT FROM p_operation_type
       OR v_request.credits_charged IS DISTINCT FROM p_credits::NUMERIC(12, 2) THEN
      RAISE EXCEPTION USING
        ERRCODE = '22023',
        MESSAGE = 'idempotency key was already used for a different generation request';
    END IF;

    IF v_request.status = 'pending'
       AND v_request.expires_at <= pg_catalog.clock_timestamp()
       AND v_request.transaction_id IS NULL THEN
      -- A historical partial row has no charge to reclaim. Remove it and use
      -- the normal first-claim path below so a charge is created atomically.
      DELETE FROM public.generation_requests WHERE id = v_request.id;
    ELSIF v_request.status = 'pending'
          AND v_request.expires_at <= pg_catalog.clock_timestamp() THEN
      v_lease_token := pg_catalog.gen_random_uuid();
      UPDATE public.generation_requests
         SET lease_token = v_lease_token,
             attempt_count = attempt_count + 1,
             expires_at = pg_catalog.clock_timestamp() + INTERVAL '2 minutes',
             updated_at = pg_catalog.clock_timestamp()
       WHERE id = v_request.id
       RETURNING * INTO v_request;

      SELECT uc.balance
        INTO v_balance
        FROM public.user_credits AS uc
       WHERE uc.user_id = p_user_id;

      -- Reclaim the existing charge. No ledger mutation occurs here.
      RETURN QUERY
      SELECT v_request.id,
             'claimed'::TEXT,
             v_request.status,
             v_request.transaction_id,
             v_request.credits_charged::NUMERIC,
             COALESCE(v_balance, 0)::NUMERIC,
             NULL::JSONB,
             v_request.lease_token,
             v_request.expires_at;
      RETURN;
    ELSE
      SELECT uc.balance
        INTO v_balance
        FROM public.user_credits AS uc
       WHERE uc.user_id = p_user_id;

      RETURN QUERY
      SELECT v_request.id,
             CASE v_request.status
               WHEN 'completed' THEN 'replay'
               WHEN 'pending' THEN 'in_progress'
               ELSE 'failed'
             END,
             v_request.status,
             v_request.transaction_id,
             v_request.credits_charged::NUMERIC,
             COALESCE(v_balance, 0)::NUMERIC,
             v_request.response_cache,
             v_request.lease_token,
             v_request.expires_at;
      RETURN;
    END IF;
  END IF;

  v_lease_token := pg_catalog.gen_random_uuid();

  INSERT INTO public.generation_requests (
    idempotency_key,
    user_id,
    operation_type,
    credits_charged,
    status,
    lease_token,
    attempt_count,
    expires_at
  )
  VALUES (
    p_idempotency_key,
    p_user_id,
    p_operation_type,
    p_credits,
    'pending',
    v_lease_token,
    1,
    pg_catalog.clock_timestamp() + INTERVAL '2 minutes'
  )
  RETURNING * INTO v_request;

  v_credit_key := 'generation:' || v_request.id::TEXT || ':charge';

  SELECT *
    INTO v_credit
    FROM public.apply_credit_transaction(
      p_user_id => p_user_id,
      p_amount => -p_credits,
      p_transaction_type => p_operation_type,
      p_description => 'Credit charge for ' || p_operation_type,
      p_metadata => COALESCE(p_metadata, '{}'::JSONB) || pg_catalog.jsonb_build_object(
        'generation_request_id', v_request.id,
        'idempotency_key', p_idempotency_key,
        'operation_type', p_operation_type
      ),
      p_idempotency_key => v_credit_key,
      p_reference_id => v_request.id::TEXT
    );

  IF NOT v_credit.success THEN
    DELETE FROM public.generation_requests WHERE id = v_request.id;
    RETURN QUERY
    SELECT NULL::UUID,
           'insufficient'::TEXT,
           'failed'::TEXT,
           NULL::UUID,
           p_credits::NUMERIC,
           v_credit.new_balance::NUMERIC,
           NULL::JSONB,
           NULL::UUID,
           NULL::TIMESTAMPTZ;
    RETURN;
  END IF;

  UPDATE public.generation_requests
     SET transaction_id = v_credit.transaction_id,
         updated_at = NOW()
   WHERE id = v_request.id;

  RETURN QUERY
  SELECT v_request.id,
         'claimed'::TEXT,
         'pending'::TEXT,
         v_credit.transaction_id,
         p_credits::NUMERIC,
         v_credit.new_balance::NUMERIC,
         NULL::JSONB,
         v_request.lease_token,
         v_request.expires_at;
END;
$$;

DROP FUNCTION IF EXISTS public.complete_generation_request(TEXT, TEXT, JSONB);

CREATE FUNCTION public.complete_generation_request(
  p_user_id TEXT,
  p_idempotency_key TEXT,
  p_response_cache JSONB,
  p_lease_token UUID
)
RETURNS TABLE (
  success BOOLEAN,
  is_replay BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_request public.generation_requests%ROWTYPE;
BEGIN
  IF p_response_cache IS NULL THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'p_response_cache is required';
  END IF;

  IF p_lease_token IS NULL THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'p_lease_token is required';
  END IF;

  PERFORM pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('generation:' || p_user_id || ':' || p_idempotency_key, 0)
  );

  SELECT gr.*
    INTO v_request
    FROM public.generation_requests AS gr
   WHERE gr.user_id = p_user_id
     AND gr.idempotency_key = p_idempotency_key
   FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, FALSE;
    RETURN;
  END IF;

  IF v_request.status = 'completed' THEN
    RETURN QUERY SELECT TRUE, TRUE;
    RETURN;
  END IF;

  IF v_request.status <> 'pending' OR v_request.lease_token IS DISTINCT FROM p_lease_token THEN
    RETURN QUERY SELECT FALSE, FALSE;
    RETURN;
  END IF;

  UPDATE public.generation_requests
     SET status = 'completed',
         response_cache = p_response_cache,
         error_code = NULL,
         error_message = NULL,
         lease_token = NULL,
         completed_at = NOW(),
         expires_at = NOW() + INTERVAL '24 hours',
         updated_at = NOW()
   WHERE id = v_request.id;

  RETURN QUERY SELECT TRUE, FALSE;
END;
$$;

DROP FUNCTION IF EXISTS public.fail_generation_request(TEXT, TEXT, TEXT, TEXT);

CREATE FUNCTION public.fail_generation_request(
  p_user_id TEXT,
  p_idempotency_key TEXT,
  p_lease_token UUID,
  p_error_code TEXT DEFAULT 'GENERATION_FAILED',
  p_error_message TEXT DEFAULT NULL
)
RETURNS TABLE (
  success BOOLEAN,
  refunded BOOLEAN,
  refund_transaction_id UUID,
  new_balance NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_request public.generation_requests%ROWTYPE;
  v_refund RECORD;
  v_refund_transaction_id UUID;
  v_balance NUMERIC;
BEGIN
  PERFORM pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('generation:' || p_user_id || ':' || p_idempotency_key, 0)
  );

  SELECT gr.*
    INTO v_request
    FROM public.generation_requests AS gr
   WHERE gr.user_id = p_user_id
     AND gr.idempotency_key = p_idempotency_key
   FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, FALSE, NULL::UUID, NULL::NUMERIC;
    RETURN;
  END IF;

  SELECT uc.balance
    INTO v_balance
    FROM public.user_credits AS uc
   WHERE uc.user_id = p_user_id;

  IF v_request.status = 'completed' THEN
    RETURN QUERY SELECT FALSE, FALSE, NULL::UUID, v_balance;
    RETURN;
  END IF;

  IF v_request.status = 'failed' THEN
    RETURN QUERY
    SELECT TRUE,
           v_request.refund_transaction_id IS NOT NULL,
           v_request.refund_transaction_id,
           v_balance;
    RETURN;
  END IF;

  IF v_request.lease_token IS DISTINCT FROM p_lease_token THEN
    RETURN QUERY SELECT FALSE, FALSE, NULL::UUID, v_balance;
    RETURN;
  END IF;

  IF v_request.transaction_id IS NOT NULL AND v_request.credits_charged > 0 THEN
    SELECT *
      INTO v_refund
      FROM public.apply_credit_transaction(
        p_user_id => p_user_id,
        p_amount => v_request.credits_charged,
        p_transaction_type => 'generation_refund',
        p_description => 'Refund for failed ' || v_request.operation_type,
        p_metadata => pg_catalog.jsonb_build_object(
          'generation_request_id', v_request.id,
          'original_transaction_id', v_request.transaction_id,
          'idempotency_key', p_idempotency_key,
          'error_code', COALESCE(p_error_code, 'GENERATION_FAILED')
        ),
        p_idempotency_key => 'generation:' || v_request.id::TEXT || ':refund',
        p_reference_id => v_request.transaction_id::TEXT
      );

    IF NOT v_refund.success THEN
      RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'unable to refund failed generation request';
    END IF;
    v_balance := v_refund.new_balance;
    v_refund_transaction_id := v_refund.transaction_id;
  END IF;

  UPDATE public.generation_requests
     SET status = 'failed',
         refund_transaction_id = v_refund_transaction_id,
         error_code = COALESCE(p_error_code, 'GENERATION_FAILED'),
         error_message = p_error_message,
         lease_token = NULL,
         failed_at = NOW(),
         expires_at = NOW() + INTERVAL '24 hours',
         updated_at = NOW()
   WHERE id = v_request.id;

  RETURN QUERY
  SELECT TRUE,
         v_refund_transaction_id IS NOT NULL,
         v_refund_transaction_id,
         v_balance;
END;
$$;

REVOKE ALL ON FUNCTION public.apply_credit_transaction(
  TEXT, NUMERIC, TEXT, TEXT, JSONB, TEXT, TEXT, TEXT, TEXT, TEXT
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.apply_credit_transaction(
  TEXT, NUMERIC, TEXT, TEXT, JSONB, TEXT, TEXT, TEXT, TEXT, TEXT
) TO service_role;

REVOKE ALL ON FUNCTION public.deduct_credits(TEXT, NUMERIC, TEXT, JSONB)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.deduct_credits(TEXT, NUMERIC, TEXT, JSONB)
  TO service_role;

REVOKE ALL ON FUNCTION public.claim_generation_request(TEXT, TEXT, TEXT, NUMERIC, JSONB)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_generation_request(TEXT, TEXT, TEXT, NUMERIC, JSONB)
  TO service_role;

REVOKE ALL ON FUNCTION public.complete_generation_request(TEXT, TEXT, JSONB, UUID)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.complete_generation_request(TEXT, TEXT, JSONB, UUID)
  TO service_role;

REVOKE ALL ON FUNCTION public.fail_generation_request(TEXT, TEXT, UUID, TEXT, TEXT)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fail_generation_request(TEXT, TEXT, UUID, TEXT, TEXT)
  TO service_role;

COMMENT ON FUNCTION public.apply_credit_transaction(
  TEXT, NUMERIC, TEXT, TEXT, JSONB, TEXT, TEXT, TEXT, TEXT, TEXT
) IS 'Atomically applies a signed credit amount and writes an idempotent ledger entry.';

COMMENT ON TABLE public.generation_requests IS
  'Transactional idempotency state for externally generated content.';

COMMIT;
