-- pgTAP contract tests for the BetterAuth server-owned database boundary.
-- Run with: supabase test db supabase/tests/betterauth_profile_provisioning.sql
--
-- These are deliberately durable database invariants. Edge tests prove request
-- routing; this suite proves that a future browser or Edge regression cannot
-- make profile provisioning, credits, books, or Community visibility unsafe.

BEGIN;
SELECT plan(48);

-- BetterAuth's full local identity schema must be available after a clean
-- migration run. Opaque token verification depends on all four tables.
SELECT has_table('public', 'user', 'BetterAuth user table exists'); -- 1
SELECT has_table('public', 'session', 'BetterAuth session table exists'); -- 2
SELECT has_table('public', 'account', 'BetterAuth account table exists'); -- 3
SELECT has_table('public', 'verification', 'BetterAuth verification table exists'); -- 4
SELECT col_not_null('public', 'session', 'userId', 'BetterAuth sessions require an owner'); -- 5
SELECT col_not_null('public', 'session', 'token', 'BetterAuth sessions require an opaque token'); -- 6
SELECT col_not_null('public', 'session', 'expiresAt', 'BetterAuth sessions require expiry'); -- 7

SELECT ok(
  EXISTS (
    SELECT 1
    FROM pg_index AS i
    WHERE i.indrelid = to_regclass('public."session"')
      AND i.indisunique
      AND pg_get_indexdef(i.indexrelid) ILIKE '%(token)%'
  ),
  'opaque BetterAuth session tokens are uniquely indexed'
); -- 8

SELECT ok(
  EXISTS (
    SELECT 1
    FROM pg_index AS i
    WHERE i.indrelid = to_regclass('public."user"')
      AND i.indisunique
      AND pg_get_indexdef(i.indexrelid) ILIKE '%(email)%'
  ),
  'BetterAuth email identity is uniquely indexed'
); -- 9

-- The Edge Function must call one narrowly privileged, atomic RPC rather than
-- upserting profiles and credits in separate browser-visible requests.
SELECT has_function(
  'public',
  'provision_betterauth_profile',
  ARRAY['text'],
  'atomic BetterAuth profile provisioning RPC exists'
); -- 10

SELECT ok(
  EXISTS (
    SELECT 1
    FROM pg_proc AS p
    JOIN pg_namespace AS n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'provision_betterauth_profile'
      AND p.prosecdef
  ),
  'provisioning RPC is SECURITY DEFINER'
); -- 11

SELECT ok(
  (
    SELECT role.rolname
    FROM pg_proc AS p
    JOIN pg_namespace AS n ON n.oid = p.pronamespace
    JOIN pg_roles AS role ON role.oid = p.proowner
    WHERE n.nspname = 'public'
      AND p.proname = 'provision_betterauth_profile'
  ) NOT IN ('anon', 'authenticated', 'service_role', 'betterauth_app'),
  'provisioning RPC is owned by a non-browser, non-service-login database role'
); -- 12

SELECT is(
  (
    SELECT ARRAY_AGG(setting ORDER BY setting)
    FROM pg_proc AS p
    JOIN pg_namespace AS n ON n.oid = p.pronamespace
    CROSS JOIN LATERAL unnest(COALESCE(p.proconfig, ARRAY[]::TEXT[])) AS setting
    WHERE n.nspname = 'public'
      AND p.proname = 'provision_betterauth_profile'
  ),
  ARRAY['search_path=""']::TEXT[],
  'provisioning RPC pins an exact trusted search path'
); -- 13

SELECT ok(
  NOT EXISTS (
    SELECT 1
    FROM pg_proc AS p
    JOIN pg_namespace AS n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'provision_betterauth_profile'
      AND has_function_privilege('anon', p.oid, 'EXECUTE')
  ),
  'anon cannot call the provisioning RPC'
); -- 14

SELECT ok(
  NOT EXISTS (
    SELECT 1
    FROM pg_proc AS p
    JOIN pg_namespace AS n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'provision_betterauth_profile'
      AND has_function_privilege('authenticated', p.oid, 'EXECUTE')
  ),
  'authenticated cannot call the provisioning RPC directly'
); -- 15

SELECT ok(
  EXISTS (
    SELECT 1
    FROM pg_proc AS p
    JOIN pg_namespace AS n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'provision_betterauth_profile'
      AND has_function_privilege('service_role', p.oid, 'EXECUTE')
  ),
  'service_role can call the provisioning RPC'
); -- 16

SELECT ok(
  NOT EXISTS (
    SELECT 1
    FROM pg_constraint AS c
    JOIN pg_class AS relation ON relation.oid = c.conrelid
    JOIN pg_namespace AS namespace ON namespace.oid = relation.relnamespace
    WHERE namespace.nspname = 'public'
      AND (
        c.conname ILIKE '%clerk%'
        OR pg_get_constraintdef(c.oid) ILIKE '%clerk%'
        OR pg_get_constraintdef(c.oid) ILIKE '%is_valid_clerk_user_id%'
      )
  ),
  'no Clerk-only ID constraint remains on any public table'
); -- 17

-- The book table remains private and versioned, while Community gets only a
-- reviewed projection of explicitly published records.
SELECT has_column(
  'public',
  'memory_books',
  'version',
  'memory_books exposes a persisted optimistic-concurrency version'
); -- 18

SELECT col_not_null(
  'public',
  'memory_books',
  'version',
  'memory_books.version is non-null'
); -- 19

SELECT ok(
  EXISTS (
    SELECT 1
    FROM pg_index AS i
    WHERE i.indrelid = to_regclass('public.memory_books')
      AND i.indisunique
      AND pg_get_indexdef(i.indexrelid) ILIKE '%ebook_generation_id%'
  ),
  'one canonical memory_books row may reference each ebook generation'
); -- 20

SELECT ok(
  EXISTS (
    SELECT 1
    FROM pg_constraint AS c
    WHERE c.conrelid = to_regclass('public.memory_books')
      AND c.contype = 'c'
      AND pg_get_constraintdef(c.oid) ILIKE '%published_at%'
      AND pg_get_constraintdef(c.oid) ILIKE '%published%'
  ),
  'a database constraint ties published state to published_at'
); -- 21

SELECT ok(
  EXISTS (
    SELECT 1
    FROM pg_class AS relation
    JOIN pg_namespace AS namespace ON namespace.oid = relation.relnamespace
    WHERE namespace.nspname = 'public'
      AND relation.relname = 'community_books'
      AND relation.relkind = 'v'
  ),
  'community_books is the public projection view'
); -- 22

SELECT is(
  (
    SELECT ARRAY_AGG(column_name::TEXT ORDER BY ordinal_position)
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'community_books'
  ),
  ARRAY[
    'id',
    'title',
    'subtitle',
    'author_name',
    'cover_image_url',
    'chapter_count',
    'word_count',
    'created_at',
    'published_at',
    'status'
  ]::TEXT[],
  'community_books exposes only reviewed metadata, never chapters, owners, or settings'
); -- 23

SELECT ok(
  has_table_privilege('anon', to_regclass('public.community_books'), 'SELECT')
  AND NOT has_table_privilege('anon', to_regclass('public.memory_books'), 'SELECT'),
  'anon can only read the Community projection, not the private base table'
); -- 24

SELECT ok(
  'security_barrier=true' = ANY(
    COALESCE(
      (SELECT reloptions FROM pg_class WHERE oid = to_regclass('public.community_books')),
      ARRAY[]::TEXT[]
    )
  ),
  'community_books is a security-barrier view'
); -- 25

-- A BetterAuth-shaped ID must provision a profile from the authoritative user
-- table, grant exactly three credits, and create exactly one bonus ledger row.
SELECT lives_ok(
$test$
DO $body$
DECLARE
  v_user_id TEXT := 'ba-pgtap-normal-provision';
  v_profile JSONB;
  v_credits INTEGER;
  v_created BOOLEAN;
  v_bonus_count INTEGER;
  v_balance NUMERIC;
BEGIN
  INSERT INTO public."user" (id, email, name, image, "emailVerified")
  VALUES (v_user_id, 'normal-provision@example.invalid', 'Normal Provision', 'https://example.invalid/normal.png', TRUE);

  SELECT profile, credits, created
    INTO v_profile, v_credits, v_created
    FROM public.provision_betterauth_profile(v_user_id);

  IF v_created IS DISTINCT FROM TRUE
     OR v_credits IS DISTINCT FROM 3
     OR v_profile ->> 'id' IS DISTINCT FROM v_user_id
     OR v_profile ->> 'email' IS DISTINCT FROM 'normal-provision@example.invalid'
     OR v_profile ->> 'name' IS DISTINCT FROM 'Normal Provision'
     OR v_profile ->> 'avatar_url' IS DISTINCT FROM 'https://example.invalid/normal.png' THEN
    RAISE EXCEPTION 'first BetterAuth provision did not return authoritative profile and three-credit grant';
  END IF;

  SELECT balance INTO v_balance FROM public.user_credits WHERE user_id = v_user_id;
  SELECT COUNT(*) INTO v_bonus_count
    FROM public.credit_transactions
   WHERE user_id = v_user_id
     AND transaction_type = 'bonus'
     AND amount = 3
     AND credits = 3
     AND balance_after_transaction = 3
     AND metadata @> '{"source":"signup_bonus"}'::JSONB;

  IF v_balance IS DISTINCT FROM 3 OR v_bonus_count IS DISTINCT FROM 1 THEN
    RAISE EXCEPTION 'first BetterAuth provision did not persist exactly one three-credit signup bonus';
  END IF;
END
$body$;
$test$,
  'a BetterAuth-shaped ID receives one authoritative profile and exactly three signup credits'
); -- 26

SELECT lives_ok(
$test$
DO $body$
DECLARE
  v_user_id TEXT := 'ba-pgtap-reprovision';
  v_credits INTEGER;
  v_created BOOLEAN;
  v_bonus_count INTEGER;
  v_profile_status TEXT;
  v_profile_credits NUMERIC;
BEGIN
  INSERT INTO public."user" (id, email, name, image, "emailVerified")
  VALUES (v_user_id, 'reprovision@example.invalid', 'Reprovision', 'https://example.invalid/reprovision.png', TRUE);
  PERFORM * FROM public.provision_betterauth_profile(v_user_id);

  UPDATE public.profiles
     SET subscription_status = 'premium', credits = 41
   WHERE id = v_user_id;
  UPDATE public.user_credits
     SET balance = 41, total_earned = 41, subscription_status = 'active'
   WHERE user_id = v_user_id;

  SELECT credits, created
    INTO v_credits, v_created
    FROM public.provision_betterauth_profile(v_user_id);
  SELECT subscription_status, credits
    INTO v_profile_status, v_profile_credits
    FROM public.profiles
   WHERE id = v_user_id;
  SELECT COUNT(*) INTO v_bonus_count
    FROM public.credit_transactions
   WHERE user_id = v_user_id
     AND transaction_type = 'bonus'
     AND metadata @> '{"source":"signup_bonus"}'::JSONB;

  IF v_created IS DISTINCT FROM FALSE
     OR v_credits IS DISTINCT FROM 41
     OR v_profile_status IS DISTINCT FROM 'premium'
     OR v_profile_credits IS DISTINCT FROM 41
     OR v_bonus_count IS DISTINCT FROM 1 THEN
    RAISE EXCEPTION 'reprovision overwrote paid state or duplicated the signup bonus';
  END IF;
END
$body$;
$test$,
  'reprovision preserves paid subscription state and cannot duplicate the signup bonus'
); -- 27

-- This trigger injects a ledger failure after the RPC has begun writing. The
-- assertion proves the RPC is one transaction, unlike independent browser upserts.
SELECT lives_ok(
$test$
DO $body$
DECLARE
  v_user_id TEXT := 'ba-pgtap-atomic-failure';
  v_failed BOOLEAN := FALSE;
BEGIN
  INSERT INTO public."user" (id, email, name, image, "emailVerified")
  VALUES (v_user_id, 'atomic-failure@example.invalid', 'Atomic Failure', 'https://example.invalid/atomic.png', TRUE);

  CREATE FUNCTION public.pgtap_force_signup_ledger_failure()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  AS $trigger$
  BEGIN
    IF NEW.user_id = 'ba-pgtap-atomic-failure'
       AND NEW.metadata @> '{"source":"signup_bonus"}'::JSONB THEN
      RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'forced signup ledger failure';
    END IF;
    RETURN NEW;
  END;
  $trigger$;

  CREATE TRIGGER pgtap_force_signup_ledger_failure
  BEFORE INSERT ON public.credit_transactions
  FOR EACH ROW EXECUTE FUNCTION public.pgtap_force_signup_ledger_failure();

  BEGIN
    PERFORM * FROM public.provision_betterauth_profile(v_user_id);
    RAISE EXCEPTION 'provision unexpectedly completed despite forced ledger failure';
  EXCEPTION
    WHEN SQLSTATE 'P0001' THEN
      IF SQLERRM IS DISTINCT FROM 'forced signup ledger failure' THEN
        RAISE;
      END IF;
      v_failed := TRUE;
  END;

  DROP TRIGGER pgtap_force_signup_ledger_failure ON public.credit_transactions;
  DROP FUNCTION public.pgtap_force_signup_ledger_failure();

  IF NOT v_failed
     OR EXISTS (SELECT 1 FROM public.profiles WHERE id = v_user_id)
     OR EXISTS (SELECT 1 FROM public.user_credits WHERE user_id = v_user_id)
     OR EXISTS (SELECT 1 FROM public.credit_transactions WHERE user_id = v_user_id) THEN
    RAISE EXCEPTION 'forced ledger failure left partial profile, balance, or bonus state';
  END IF;
END
$body$;
$test$,
  'a forced signup-ledger failure rolls back profile, balance, and bonus atomically'
); -- 28

SELECT lives_ok(
$test$
DO $body$
BEGIN
  INSERT INTO public."user" (id, email, name, "emailVerified")
  VALUES ('ba-pgtap-publish-owner', 'publish-owner@example.invalid', 'Publish Owner', TRUE);
  INSERT INTO public.profiles (id, email, name)
  VALUES ('ba-pgtap-publish-owner', 'publish-owner@example.invalid', 'Publish Owner');
  INSERT INTO public.memory_books (id, user_id, title, chapters, status, published_at)
  VALUES ('00000000-0000-4000-8000-000000000101', 'ba-pgtap-publish-owner', 'Completed Book', '[]'::JSONB, 'completed', NULL);
END
$body$;
$test$,
  'completed books may be stored privately with no publication timestamp'
); -- 29

SELECT is(
  (SELECT version FROM public.memory_books WHERE id = '00000000-0000-4000-8000-000000000101'),
  1::BIGINT,
  'new private books begin at optimistic-concurrency version one'
); -- 30

SELECT lives_ok(
$test$
DO $body$
BEGIN
  BEGIN
    INSERT INTO public.memory_books (id, user_id, title, chapters, status, published_at)
    VALUES ('00000000-0000-4000-8000-000000000102', 'ba-pgtap-publish-owner', 'Invalid Published Book', '[]'::JSONB, 'published', NULL);
    RAISE EXCEPTION 'published book without published_at was accepted';
  EXCEPTION
    WHEN check_violation THEN NULL;
  END;
END
$body$;
$test$,
  'published books without published_at are rejected at the database boundary'
); -- 31

SELECT lives_ok(
$test$
DO $body$
BEGIN
  BEGIN
    INSERT INTO public.memory_books (id, user_id, title, chapters, status, published_at)
    VALUES ('00000000-0000-4000-8000-000000000103', 'ba-pgtap-publish-owner', 'Invalid Completed Book', '[]'::JSONB, 'completed', NOW());
    RAISE EXCEPTION 'private completed book retained a publication timestamp';
  EXCEPTION
    WHEN check_violation THEN NULL;
  END;
END
$body$;
$test$,
  'completed books with published_at are rejected at the database boundary'
); -- 32

SELECT ok(
  NOT EXISTS (
    SELECT 1
    FROM pg_policies AS policy
    WHERE policy.schemaname = 'public'
      AND policy.tablename = 'memory_books'
      AND policy.roles && ARRAY['anon'::NAME, 'authenticated'::NAME]
  ),
  'private memory books have no browser-role row policy'
); -- 33

SELECT ok(
  EXISTS (
    SELECT 1
    FROM pg_policies AS policy
    WHERE policy.schemaname = 'public'
      AND policy.tablename = 'memory_books'
      AND policy.policyname = 'service_role_all'
      AND policy.roles = ARRAY['service_role']::NAME[]
  ),
  'only the trusted service role has a memory_books row policy'
); -- 34

SELECT col_not_null(
  'public',
  'user',
  'name',
  'BetterAuth 1.5.4 requires user.name'
); -- 35

SELECT ok(
  NOT has_schema_privilege('anon', 'public', 'CREATE')
  AND NOT has_schema_privilege('authenticated', 'public', 'CREATE'),
  'browser roles cannot create shadowing objects in the public schema'
); -- 36

-- Every cross-boundary owner key remains BetterAuth's opaque text identifier.
-- UUID/Clerk-shaped checks here would make a valid BetterAuth user unwriteable.
SELECT col_type_is('public', 'profiles', 'id', 'text', 'profiles use BetterAuth text IDs'); -- 37
SELECT col_type_is('public', 'user_credits', 'user_id', 'text', 'credit balances use BetterAuth text IDs'); -- 38
SELECT col_type_is('public', 'memory_books', 'user_id', 'text', 'private books use BetterAuth text IDs'); -- 39
SELECT col_type_is('public', 'credit_transactions', 'user_id', 'text', 'credit ledger uses BetterAuth text IDs'); -- 40

SELECT ok(
  NOT EXISTS (
    SELECT 1
    FROM pg_proc AS p
    JOIN pg_namespace AS n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prokind = 'f'
      AND (p.proname ILIKE '%clerk%' OR pg_get_functiondef(p.oid) ILIKE '%clerk%')
  ),
  'no callable public function retains Clerk-only validation logic'
); -- 41

SELECT has_column(
  'public',
  'profiles',
  'stripe_customer_id',
  'each BetterAuth profile stores its own Stripe customer ID'
); -- 42

-- The gallery gateway must be a single server-owned database operation: the
-- function receives a verified owner and validated debit id, then writes the
-- canonical generation and memory book together.  Browser roles cannot call it.
SELECT has_function(
  'public',
  'persist_betterauth_generated_book',
  ARRAY['text', 'uuid', 'text', 'jsonb', 'jsonb'],
  'atomic gallery persistence RPC exists'
); -- 43

SELECT lives_ok(
$test$
DO $body$
DECLARE
  v_user_id TEXT := 'ba-pgtap-gallery-atomic';
  v_request_id UUID := gen_random_uuid();
  v_transaction_id UUID;
  v_result RECORD;
  v_generation_count INTEGER;
  v_book_count INTEGER;
BEGIN
  INSERT INTO public."user" (id, email, name, "emailVerified")
  VALUES (v_user_id, 'gallery-atomic@example.invalid', 'Gallery Atomic', TRUE);
  PERFORM * FROM public.provision_betterauth_profile(v_user_id);

  INSERT INTO public.credit_transactions (
    user_id, amount, credits, transaction_type, description,
    balance_after_transaction, metadata, idempotency_key
  )
  VALUES (
    v_user_id, -1, 1, 'chapter_generation', 'reserved gallery generation debit', 2,
    '{"source":"gallery_reservation"}'::JSONB,
    'generation:' || v_request_id::TEXT || ':charge'
  )
  RETURNING id INTO v_transaction_id;

  INSERT INTO public.generation_requests (
    id, idempotency_key, user_id, operation_type, credits_charged,
    transaction_id, status, response_cache, completed_at
  ) VALUES (
    v_request_id, 'pgtap-gallery-replay', v_user_id, 'chapter_generation', 1,
    v_transaction_id, 'completed', '{"chapters":[]}'::JSONB, NOW()
  );

  SELECT * INTO v_result
    FROM public.persist_betterauth_generated_book(
      v_user_id,
      v_transaction_id,
      'pgtap-gallery-replay',
      '{"title":"Atomic generation","content":"[]","credits_used":1,"paid_with_credits":true}'::JSONB,
      '{"title":"Atomic book","chapters":[]}'::JSONB
    );

  SELECT COUNT(*) INTO v_generation_count
    FROM public.ebook_generations
   WHERE user_id = v_user_id AND transaction_id = v_transaction_id::TEXT;
  SELECT COUNT(*) INTO v_book_count
    FROM public.memory_books
   WHERE user_id = v_user_id;

  IF v_generation_count <> 1 OR v_book_count <> 1 THEN
    RAISE EXCEPTION 'gallery persistence did not atomically create one generation and one private book';
  END IF;
END
$body$;
$test$,
  'gallery persistence atomically creates a caller-owned generation and private book'
); -- 44

SELECT lives_ok(
$test$
DO $body$
DECLARE
  v_user_id TEXT := 'ba-pgtap-gallery-rollback';
  v_request_id UUID := gen_random_uuid();
  v_transaction_id UUID;
  v_failed BOOLEAN := FALSE;
BEGIN
  INSERT INTO public."user" (id, email, name, "emailVerified")
  VALUES (v_user_id, 'gallery-rollback@example.invalid', 'Gallery Rollback', TRUE);
  PERFORM * FROM public.provision_betterauth_profile(v_user_id);

  INSERT INTO public.credit_transactions (
    user_id, amount, credits, transaction_type, description,
    balance_after_transaction, metadata, idempotency_key
  )
  VALUES (
    v_user_id, -1, 1, 'chapter_generation', 'reserved rollback debit', 2,
    '{"source":"gallery_reservation"}'::JSONB,
    'generation:' || v_request_id::TEXT || ':charge'
  )
  RETURNING id INTO v_transaction_id;

  INSERT INTO public.generation_requests (
    id, idempotency_key, user_id, operation_type, credits_charged,
    transaction_id, status, response_cache, completed_at
  ) VALUES (
    v_request_id, 'pgtap-gallery-rollback', v_user_id, 'chapter_generation', 1,
    v_transaction_id, 'completed', '{"chapters":[]}'::JSONB, NOW()
  );

  CREATE FUNCTION public.pgtap_force_gallery_book_failure()
  RETURNS TRIGGER LANGUAGE plpgsql AS $trigger$
  BEGIN
    IF NEW.user_id = 'ba-pgtap-gallery-rollback' THEN
      RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'forced gallery book failure';
    END IF;
    RETURN NEW;
  END;
  $trigger$;
  CREATE TRIGGER pgtap_force_gallery_book_failure
    BEFORE INSERT ON public.memory_books
    FOR EACH ROW EXECUTE FUNCTION public.pgtap_force_gallery_book_failure();

  BEGIN
    PERFORM * FROM public.persist_betterauth_generated_book(
      v_user_id,
      v_transaction_id,
      'pgtap-gallery-rollback',
      '{"title":"Rollback generation","content":"[]","credits_used":1,"paid_with_credits":true}'::JSONB,
      '{"title":"Rollback book","chapters":[]}'::JSONB
    );
    RAISE EXCEPTION 'gallery persistence unexpectedly survived a forced book failure';
  EXCEPTION WHEN SQLSTATE 'P0001' THEN
    IF SQLERRM IS DISTINCT FROM 'forced gallery book failure' THEN RAISE; END IF;
    v_failed := TRUE;
  END;

  DROP TRIGGER pgtap_force_gallery_book_failure ON public.memory_books;
  DROP FUNCTION public.pgtap_force_gallery_book_failure();

  IF NOT v_failed
     OR EXISTS (SELECT 1 FROM public.ebook_generations WHERE user_id = v_user_id)
     OR EXISTS (SELECT 1 FROM public.memory_books WHERE user_id = v_user_id)
     OR (SELECT balance FROM public.user_credits WHERE user_id = v_user_id) IS DISTINCT FROM 3 THEN
    RAISE EXCEPTION 'gallery book failure left a generation, book, or charged balance behind';
  END IF;
END
$body$;
$test$,
  'an injected gallery persistence failure rolls back the generation, book, and debit'
); -- 45

SELECT lives_ok(
$test$
DO $body$
DECLARE
  v_user_id TEXT := 'ba-pgtap-gallery-unproven';
  v_transaction_id UUID;
  v_rejected BOOLEAN := FALSE;
BEGIN
  INSERT INTO public."user" (id, email, name, "emailVerified")
  VALUES (v_user_id, 'gallery-unproven@example.invalid', 'Gallery Unproven', TRUE);
  PERFORM * FROM public.provision_betterauth_profile(v_user_id);

  INSERT INTO public.credit_transactions (
    user_id, amount, credits, transaction_type, description,
    balance_after_transaction, metadata, idempotency_key
  ) VALUES (
    v_user_id, -1, 1, 'chapter_generation', 'unproven gallery debit', 2,
    '{}'::JSONB, 'unproven-gallery-debit'
  ) RETURNING id INTO v_transaction_id;

  BEGIN
    PERFORM * FROM public.persist_betterauth_generated_book(
      v_user_id,
      v_transaction_id,
      'missing-generation-request',
      '{"title":"Unproven generation","content":"[]","credits_used":1,"paid_with_credits":true}'::JSONB,
      '{"title":"Unproven book","chapters":[]}'::JSONB
    );
  EXCEPTION WHEN insufficient_privilege THEN
    v_rejected := TRUE;
  END;

  IF NOT v_rejected
     OR EXISTS (SELECT 1 FROM public.ebook_generations WHERE user_id = v_user_id)
     OR EXISTS (SELECT 1 FROM public.memory_books WHERE user_id = v_user_id) THEN
    RAISE EXCEPTION 'gallery persistence accepted an unproven client-supplied debit';
  END IF;
END
$body$;
$test$,
  'gallery persistence rejects a debit without a completed generation request'
); -- 46

SELECT throws_ok(
  $$SET LOCAL ROLE anon; SELECT id FROM public.memory_books LIMIT 1;$$,
  '42501',
  NULL,
  'anonymous database requests cannot read private memory_books rows'
); -- 47

SELECT throws_ok(
  $$SET LOCAL ROLE anon; INSERT INTO public.memory_books (user_id, title, chapters, status) VALUES ('ba-anon', 'forbidden', '[]'::JSONB, 'completed');$$,
  '42501',
  NULL,
  'anonymous database requests cannot create private memory_books rows'
); -- 48

SELECT * FROM finish();
ROLLBACK;
