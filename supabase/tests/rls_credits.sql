-- pgTAP tests: RLS policies for credit-related tables
-- Run with: supabase test db

BEGIN;
SELECT plan(12);

-- ============================================================================
-- RLS IS ENABLED
-- ============================================================================

SELECT row_security_active('public.user_credits');
SELECT row_security_active('public.credit_transactions');

-- ============================================================================
-- USER_CREDITS POLICIES
-- ============================================================================

SELECT policies_are(
  'public', 'user_credits',
  ARRAY[
    'Users can view own credits',
    'Users can update own credits',
    'Service role can manage all user credits'
  ],
  'user_credits has expected RLS policies'
);

SELECT policy_roles_are('public', 'user_credits', 'Users can view own credits', ARRAY['authenticated']);
SELECT policy_cmd_is('public', 'user_credits', 'Users can view own credits', 'select');

SELECT policy_roles_are('public', 'user_credits', 'Users can update own credits', ARRAY['authenticated']);
SELECT policy_cmd_is('public', 'user_credits', 'Users can update own credits', 'update');

-- ============================================================================
-- CREDIT_TRANSACTIONS POLICIES
-- ============================================================================

SELECT policies_are(
  'public', 'credit_transactions',
  ARRAY[
    'Users can view own transactions',
    'Users can insert own transactions',
    'Service role can manage all credit transactions'
  ],
  'credit_transactions has expected RLS policies'
);

SELECT policy_roles_are('public', 'credit_transactions', 'Users can view own transactions', ARRAY['authenticated']);
SELECT policy_cmd_is('public', 'credit_transactions', 'Users can view own transactions', 'select');

SELECT policy_roles_are('public', 'credit_transactions', 'Users can insert own transactions', ARRAY['authenticated']);
SELECT policy_cmd_is('public', 'credit_transactions', 'Users can insert own transactions', 'insert');

SELECT * FROM finish();
ROLLBACK;
