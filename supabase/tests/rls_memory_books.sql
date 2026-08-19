-- pgTAP tests: RLS policies for memory_books table
-- Run with: supabase test db

BEGIN;
SELECT plan(12);

-- ============================================================================
-- TABLE, RLS, AND POLICY EXISTENCE
-- ============================================================================

SELECT has_table('public', 'memory_books', 'memory_books table exists');
SELECT row_security_active('public.memory_books');

SELECT policies_are(
  'public', 'memory_books',
  ARRAY[
    'Public can view published memory books',
    'Users can view own books',
    'Users can insert own books',
    'Users can update own books',
    'Users can delete own books',
    'Service role can manage all memory books'
  ],
  'memory_books has expected RLS policies'
);

-- ============================================================================
-- POLICY DETAILS
-- ============================================================================

SELECT policy_roles_are('public', 'memory_books', 'Public can view published memory books', ARRAY['anon', 'authenticated']);
SELECT policy_cmd_is('public', 'memory_books', 'Public can view published memory books', 'select');

SELECT policy_roles_are('public', 'memory_books', 'Users can view own books', ARRAY['authenticated']);
SELECT policy_cmd_is('public', 'memory_books', 'Users can view own books', 'select');

SELECT policy_roles_are('public', 'memory_books', 'Users can insert own books', ARRAY['authenticated']);
SELECT policy_cmd_is('public', 'memory_books', 'Users can insert own books', 'insert');

SELECT policy_roles_are('public', 'memory_books', 'Users can update own books', ARRAY['authenticated']);
SELECT policy_cmd_is('public', 'memory_books', 'Users can update own books', 'update');

SELECT policy_cmd_is('public', 'memory_books', 'Service role can manage all memory books', 'all');

SELECT * FROM finish();
ROLLBACK;
