BEGIN;

SELECT plan(25);

SELECT has_table('public', 'user_credits', 'user_credits table exists');
SELECT has_table('public', 'credit_transactions', 'credit_transactions table exists');

SELECT ok(
  (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.user_credits'::REGCLASS),
  'user_credits has row-level security enabled'
);
SELECT ok(
  (SELECT relforcerowsecurity FROM pg_class WHERE oid = 'public.user_credits'::REGCLASS),
  'user_credits forces row-level security'
);
SELECT ok(
  (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.credit_transactions'::REGCLASS),
  'credit_transactions has row-level security enabled'
);
SELECT ok(
  (SELECT relforcerowsecurity FROM pg_class WHERE oid = 'public.credit_transactions'::REGCLASS),
  'credit_transactions forces row-level security'
);

SELECT is(
  (
    SELECT ARRAY_AGG(policyname::TEXT ORDER BY policyname::TEXT)
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_credits'
  ),
  ARRAY['service_role_all']::TEXT[],
  'user_credits has only the service-role policy'
);
SELECT is(
  (
    SELECT ARRAY_AGG(policyname::TEXT ORDER BY policyname::TEXT)
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'credit_transactions'
  ),
  ARRAY['service_role_all']::TEXT[],
  'credit_transactions has only the service-role policy'
);

SELECT ok(
  NOT has_table_privilege('anon', 'public.user_credits', 'SELECT'),
  'anon cannot read credit balances'
);
SELECT ok(
  NOT has_table_privilege('authenticated', 'public.user_credits', 'SELECT'),
  'authenticated cannot read credit balances directly'
);
SELECT ok(
  NOT has_table_privilege('anon', 'public.credit_transactions', 'SELECT'),
  'anon cannot read the credit ledger'
);
SELECT ok(
  NOT has_table_privilege('authenticated', 'public.credit_transactions', 'SELECT'),
  'authenticated cannot read the credit ledger directly'
);

SELECT ok(
  has_table_privilege('service_role', 'public.user_credits', 'SELECT')
  AND has_table_privilege('service_role', 'public.user_credits', 'INSERT')
  AND has_table_privilege('service_role', 'public.user_credits', 'UPDATE')
  AND has_table_privilege('service_role', 'public.user_credits', 'DELETE'),
  'service_role can manage credit balances'
);
SELECT ok(
  has_table_privilege('service_role', 'public.credit_transactions', 'SELECT')
  AND has_table_privilege('service_role', 'public.credit_transactions', 'INSERT')
  AND has_table_privilege('service_role', 'public.credit_transactions', 'UPDATE')
  AND has_table_privilege('service_role', 'public.credit_transactions', 'DELETE'),
  'service_role can manage the credit ledger'
);

SELECT col_type_is('public', 'user_credits', 'balance', 'numeric(12,2)', 'balance is fractional-safe');
SELECT col_type_is('public', 'user_credits', 'total_earned', 'numeric(12,2)', 'total_earned is fractional-safe');
SELECT col_type_is('public', 'user_credits', 'total_spent', 'numeric(12,2)', 'total_spent is fractional-safe');
SELECT col_type_is('public', 'credit_transactions', 'amount', 'numeric(12,2)', 'ledger amount is signed numeric');
SELECT col_type_is('public', 'credit_transactions', 'balance_after_transaction', 'numeric(12,2)', 'ledger snapshot is numeric');
SELECT col_type_is('public', 'credit_transactions', 'credits', 'numeric(12,2)', 'legacy credits magnitude is numeric');

SELECT col_not_null('public', 'user_credits', 'user_id', 'credit balance ownership is required');
SELECT col_not_null('public', 'credit_transactions', 'user_id', 'ledger ownership is required');

SELECT ok(
  NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.credit_transactions'::REGCLASS
      AND conname = 'credit_transactions_credits_positive'
  ),
  'legacy positive-only credits constraint is removed'
);
SELECT ok(
  NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.credit_transactions'::REGCLASS
      AND conname = 'credit_transactions_type_allowed'
  ),
  'legacy transaction-type allowlist is removed'
);

SELECT ok(
  EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'credit_transactions'
      AND indexname = 'credit_transactions_idempotency_key_key'
      AND indexdef LIKE 'CREATE UNIQUE INDEX%'
  ),
  'credit transaction idempotency is enforced by a unique partial index'
);

SELECT * FROM finish();
ROLLBACK;
