-- pgTAP tests: RLS policies for profiles table
-- Run with: supabase test db

BEGIN;
SELECT plan(8);

-- ============================================================================
-- RLS IS ENABLED
-- ============================================================================

SELECT row_security_active('public.profiles');

-- ============================================================================
-- POLICY EXISTENCE
-- ============================================================================

SELECT policies_are(
  'public', 'profiles',
  ARRAY[
    'Users can view own profile',
    'Users can insert own profile',
    'Users can update own profile',
    'Service role can manage all profiles'
  ],
  'profiles has expected RLS policies'
);

-- ============================================================================
-- POLICY DETAILS
-- ============================================================================

SELECT policy_roles_are('public', 'profiles', 'Users can view own profile', ARRAY['authenticated']);
SELECT policy_cmd_is('public', 'profiles', 'Users can view own profile', 'select');

SELECT policy_roles_are('public', 'profiles', 'Users can insert own profile', ARRAY['authenticated']);
SELECT policy_cmd_is('public', 'profiles', 'Users can insert own profile', 'insert');

SELECT policy_roles_are('public', 'profiles', 'Users can update own profile', ARRAY['authenticated']);
SELECT policy_cmd_is('public', 'profiles', 'Users can update own profile', 'update');

SELECT * FROM finish();
ROLLBACK;
