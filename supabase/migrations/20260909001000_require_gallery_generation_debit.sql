BEGIN;

SET LOCAL TIME ZONE 'UTC';

-- Preserve the original atomic writer as a private implementation detail. The
-- public service-role RPC below first proves that generation completed through
-- the canonical charged request state machine.
ALTER FUNCTION public.persist_betterauth_generated_book(
  TEXT, UUID, TEXT, JSONB, JSONB
) RENAME TO persist_betterauth_generated_book_unchecked;

REVOKE ALL PRIVILEGES ON FUNCTION public.persist_betterauth_generated_book_unchecked(
  TEXT, UUID, TEXT, JSONB, JSONB
) FROM PUBLIC, anon, authenticated, service_role;

CREATE FUNCTION public.persist_betterauth_generated_book(
  p_user_id TEXT,
  p_transaction_id UUID,
  p_idempotency_key TEXT,
  p_generation JSONB,
  p_book JSONB
)
RETURNS TABLE (
  generation JSONB,
  book JSONB,
  created BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_request_id UUID;
  v_request_transaction_id UUID;
  v_credits_charged NUMERIC(12, 2);
  v_transaction_amount NUMERIC(12, 2);
  v_payload_credits NUMERIC(12, 2);
  v_paid_with_credits BOOLEAN;
BEGIN
  IF pg_catalog.jsonb_typeof(p_generation) IS DISTINCT FROM 'object' THEN
    RAISE EXCEPTION USING
      ERRCODE = '22023',
      MESSAGE = 'generation must be a JSON object';
  END IF;

  SELECT request.id,
         request.transaction_id,
         request.credits_charged,
         transaction.amount
    INTO v_request_id,
         v_request_transaction_id,
         v_credits_charged,
         v_transaction_amount
    FROM public.generation_requests AS request
    JOIN public.credit_transactions AS transaction
      ON transaction.id = request.transaction_id
     AND transaction.user_id = request.user_id
     AND transaction.transaction_type = request.operation_type
     AND transaction.idempotency_key = 'generation:' || request.id::TEXT || ':charge'
   WHERE request.user_id = p_user_id
     AND request.idempotency_key = p_idempotency_key
     AND request.operation_type = 'chapter_generation'
     AND request.status = 'completed';

  IF NOT FOUND
     OR v_request_transaction_id IS NULL
     OR v_credits_charged <= 0
     OR v_transaction_amount IS DISTINCT FROM -v_credits_charged THEN
    RAISE EXCEPTION USING
      ERRCODE = '42501',
      MESSAGE = 'a completed charged generation is required before persistence';
  END IF;

  IF p_transaction_id IS NOT NULL
     AND p_transaction_id IS DISTINCT FROM v_request_transaction_id THEN
    RAISE EXCEPTION USING
      ERRCODE = '23505',
      MESSAGE = 'idempotency key is linked to a different debit';
  END IF;

  BEGIN
    v_payload_credits := NULLIF(p_generation ->> 'credits_used', '')::NUMERIC(12, 2);
    v_paid_with_credits := (p_generation ->> 'paid_with_credits')::BOOLEAN;
  EXCEPTION
    WHEN invalid_text_representation OR numeric_value_out_of_range THEN
      RAISE EXCEPTION USING
        ERRCODE = '22023',
        MESSAGE = 'generation payment metadata is invalid';
  END;

  IF v_payload_credits IS DISTINCT FROM v_credits_charged
     OR v_paid_with_credits IS DISTINCT FROM TRUE THEN
    RAISE EXCEPTION USING
      ERRCODE = '22023',
      MESSAGE = 'generation payment metadata does not match the completed charge';
  END IF;

  RETURN QUERY
  SELECT result.generation, result.book, result.created
    FROM public.persist_betterauth_generated_book_unchecked(
      p_user_id,
      v_request_transaction_id,
      p_idempotency_key,
      p_generation,
      p_book
    ) AS result;
END;
$$;

REVOKE ALL PRIVILEGES ON FUNCTION public.persist_betterauth_generated_book(
  TEXT, UUID, TEXT, JSONB, JSONB
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.persist_betterauth_generated_book(
  TEXT, UUID, TEXT, JSONB, JSONB
) TO service_role;

COMMENT ON FUNCTION public.persist_betterauth_generated_book(
  TEXT, UUID, TEXT, JSONB, JSONB
) IS
  'Persists one generated ebook only after its canonical generation request completed with a matching debit.';

COMMENT ON FUNCTION public.persist_betterauth_generated_book_unchecked(
  TEXT, UUID, TEXT, JSONB, JSONB
) IS
  'Private atomic gallery writer; callable only through persist_betterauth_generated_book.';

COMMIT;
