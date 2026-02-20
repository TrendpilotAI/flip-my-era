-- pgTAP tests: Schema validation for critical tables
-- Run with: supabase test db

BEGIN;
SELECT plan(25);

-- ============================================================================
-- TABLE EXISTENCE TESTS
-- ============================================================================

SELECT has_table('public', 'profiles', 'profiles table exists');
SELECT has_table('public', 'user_credits', 'user_credits table exists');
SELECT has_table('public', 'credit_transactions', 'credit_transactions table exists');
SELECT has_table('public', 'ebook_generations', 'ebook_generations table exists');
SELECT has_table('public', 'memory_books', 'memory_books table exists');

-- ============================================================================
-- PROFILES TABLE COLUMNS
-- ============================================================================

SELECT has_column('public', 'profiles', 'id', 'profiles has id column');
SELECT has_column('public', 'profiles', 'email', 'profiles has email column');
SELECT has_column('public', 'profiles', 'subscription_status', 'profiles has subscription_status column');
SELECT has_column('public', 'profiles', 'credits', 'profiles has credits column');
SELECT col_type_is('public', 'profiles', 'id', 'text', 'profiles.id is TEXT (Clerk user IDs)');

-- ============================================================================
-- USER_CREDITS TABLE COLUMNS
-- ============================================================================

SELECT has_column('public', 'user_credits', 'user_id', 'user_credits has user_id column');
SELECT has_column('public', 'user_credits', 'balance', 'user_credits has balance column');
SELECT has_column('public', 'user_credits', 'subscription_status', 'user_credits has subscription_status column');
SELECT col_not_null('public', 'user_credits', 'balance', 'user_credits.balance is NOT NULL');

-- ============================================================================
-- CREDIT_TRANSACTIONS TABLE COLUMNS
-- ============================================================================

SELECT has_column('public', 'credit_transactions', 'user_id', 'credit_transactions has user_id column');
SELECT has_column('public', 'credit_transactions', 'amount', 'credit_transactions has amount column');
SELECT has_column('public', 'credit_transactions', 'transaction_type', 'credit_transactions has transaction_type column');
SELECT has_column('public', 'credit_transactions', 'balance_after_transaction', 'credit_transactions has balance_after_transaction column');
SELECT col_not_null('public', 'credit_transactions', 'amount', 'credit_transactions.amount is NOT NULL');

-- ============================================================================
-- FOREIGN KEY RELATIONSHIPS
-- ============================================================================

SELECT has_fk('public', 'user_credits', 'user_credits has foreign key');
SELECT has_fk('public', 'credit_transactions', 'credit_transactions has foreign key');

-- ============================================================================
-- INDEX EXISTENCE
-- ============================================================================

SELECT has_index('public', 'profiles', 'idx_profiles_email', 'profiles has email index');
SELECT has_index('public', 'user_credits', 'idx_user_credits_user_id', 'user_credits has user_id index');
SELECT has_index('public', 'credit_transactions', 'idx_credit_transactions_user_id', 'credit_transactions has user_id index');

-- ============================================================================
-- TRIGGER EXISTENCE
-- ============================================================================

SELECT has_trigger('public', 'user_credits', 'trigger_user_credits_updated_at', 'user_credits has updated_at trigger');

SELECT * FROM finish();
ROLLBACK;
