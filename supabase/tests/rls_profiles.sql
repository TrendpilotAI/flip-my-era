BEGIN;

SELECT plan(12);

SELECT has_table('public', 'profiles', 'profiles table exists');

SELECT ok(
  (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.profiles'::REGCLASS),
  'profiles has row-level security enabled'
);

SELECT ok(
  (SELECT relforcerowsecurity FROM pg_class WHERE oid = 'public.profiles'::REGCLASS),
  'profiles forces row-level security for table owners'
);

SELECT is(
  (
    SELECT ARRAY_AGG(policyname::TEXT ORDER BY policyname::TEXT)
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'profiles'
  ),
  ARRAY['service_role_all']::TEXT[],
  'profiles has only the service-role policy'
);

SELECT is(
  (
    SELECT roles::TEXT
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'profiles'
      AND policyname = 'service_role_all'
  ),
  '{service_role}',
  'profiles policy is scoped to service_role'
);

SELECT is(
  (
    SELECT cmd
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'profiles'
      AND policyname = 'service_role_all'
  ),
  'ALL',
  'profiles service-role policy covers every command'
);

SELECT ok(
  NOT has_table_privilege('anon', 'public.profiles', 'SELECT'),
  'anon cannot read profiles'
);

SELECT ok(
  NOT has_table_privilege('authenticated', 'public.profiles', 'SELECT'),
  'authenticated cannot read profiles directly'
);

SELECT ok(
  NOT has_table_privilege('authenticated', 'public.profiles', 'UPDATE'),
  'authenticated cannot mutate profiles directly'
);

SELECT ok(
  has_table_privilege('service_role', 'public.profiles', 'SELECT'),
  'service_role can read profiles'
);

SELECT ok(
  has_table_privilege('service_role', 'public.profiles', 'INSERT')
  AND has_table_privilege('service_role', 'public.profiles', 'UPDATE')
  AND has_table_privilege('service_role', 'public.profiles', 'DELETE'),
  'service_role can manage profiles'
);

SELECT ok(
  NOT has_table_privilege('betterauth_app', 'public.profiles', 'SELECT'),
  'betterauth_app has no access to legacy profiles'
);

SELECT * FROM finish();
ROLLBACK;
