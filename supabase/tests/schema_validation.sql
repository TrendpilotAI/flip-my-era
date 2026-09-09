BEGIN;

SELECT plan(101);

SELECT has_table('public', 'profiles', 'profiles table exists');
SELECT has_table('public', 'user_credits', 'user_credits table exists');
SELECT has_table('public', 'credit_transactions', 'credit_transactions table exists');
SELECT has_table('public', 'stories', 'stories table exists');
SELECT has_table('public', 'ebook_generations', 'ebook_generations table exists');
SELECT has_table('public', 'memory_books', 'memory_books table exists');
SELECT has_table('public', 'webhook_events', 'webhook_events table exists');
SELECT has_table('public', 'generation_requests', 'generation_requests table exists');
SELECT has_table('public', 'videos', 'videos table exists');
SELECT has_table('public', 'tiktok_shares', 'tiktok_shares table exists');
SELECT has_table('public', 'user_activities', 'user_activities table exists');
SELECT has_table('public', 'user', 'BetterAuth user table exists');
SELECT has_table('public', 'session', 'BetterAuth session table exists');
SELECT has_table('public', 'account', 'BetterAuth account table exists');
SELECT has_table('public', 'verification', 'BetterAuth verification table exists');
SELECT has_table('public', 'webhook_retry_queue', 'service-only webhook retry queue exists');

SELECT hasnt_table('public', 'books', 'unused books table is retired');
SELECT hasnt_table('public', 'chapters', 'unused chapters table is retired');
SELECT hasnt_table('public', 'chapter_images', 'unused chapter_images table is retired');
SELECT hasnt_table('public', 'payments', 'unused payments table is retired');
SELECT hasnt_table('public', 'published_stories', 'unused published_stories table is retired');
SELECT hasnt_table('public', 'credit_usage_logs', 'unused credit_usage_logs table is retired');
SELECT hasnt_table('public', 'samcart_webhook_logs', 'unused samcart_webhook_logs table is retired');

SELECT ok(to_regprocedure('public.enqueue_webhook_retry(character varying,uuid,jsonb,integer)') IS NULL,
  'unused enqueue_webhook_retry RPC is retired');
SELECT ok(to_regprocedure('public.get_pending_webhooks(integer)') IS NULL,
  'unused get_pending_webhooks RPC is retired');
SELECT ok(to_regprocedure('public.mark_webhook_processed(uuid,boolean,text)') IS NULL,
  'unused mark_webhook_processed RPC is retired');
SELECT ok(to_regprocedure('public.get_credit_usage_history(text,integer)') IS NULL,
  'unused get_credit_usage_history RPC is retired');
SELECT ok(to_regprocedure('public.get_user_credit_balance(text)') IS NULL,
  'unused get_user_credit_balance RPC is retired');
SELECT ok(to_regprocedure('public.get_user_usage_stats(text,integer)') IS NULL,
  'unused get_user_usage_stats RPC is retired');
SELECT ok(to_regprocedure('public.log_credit_usage(text,character varying,integer,uuid,character varying,jsonb)') IS NULL,
  'unused log_credit_usage RPC is retired');
SELECT ok(to_regprocedure('public.update_updated_at_column()') IS NULL,
  'superseded timestamp trigger helper is retired');

SELECT ok(
  (SELECT relrowsecurity AND relforcerowsecurity
   FROM pg_class
   WHERE oid = 'public.webhook_retry_queue'::REGCLASS),
  'webhook retry queue has forced RLS'
);

SELECT is(
  (SELECT COUNT(*)::INTEGER
   FROM pg_policies
   WHERE schemaname = 'public'
     AND tablename = 'webhook_retry_queue'
     AND policyname = 'service_role_all'
     AND roles = ARRAY['service_role']::NAME[]),
  1,
  'webhook retry queue has one service-role-only policy'
);

SELECT ok(
  ARRAY[
    'created_at', 'error_message', 'id', 'max_retries', 'payload',
    'processed', 'processed_at', 'retry_count', 'scheduled_at',
    'updated_at', 'webhook_id', 'webhook_type'
  ]::TEXT[] = COALESCE(
    (
      SELECT ARRAY_AGG(column_name::TEXT ORDER BY column_name)
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'webhook_retry_queue'
    ),
    ARRAY[]::TEXT[]
  ),
  'webhook retry queue has only its canonical columns'
);

SELECT is(
  (SELECT COUNT(*)::INTEGER
   FROM pg_constraint
   WHERE conrelid = 'public.webhook_retry_queue'::REGCLASS
     AND conname IN (
       'webhook_retry_queue_retry_count_nonnegative',
       'webhook_retry_queue_max_retries_nonnegative'
     )),
  2,
  'webhook retry queue enforces nonnegative retry limits'
);

SELECT ok(
  ARRAY[
    'id', 'email', 'name', 'full_name', 'username', 'bio', 'avatar_url',
    'role', 'social_links', 'subscription_status', 'credits', 'stories_count',
    'total_likes', 'stripe_customer_id', 'created_at', 'updated_at'
  ]::TEXT[] <@ COALESCE(
    (
      SELECT ARRAY_AGG(column_name::TEXT)
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'profiles'
    ),
    ARRAY[]::TEXT[]
  ),
  'profiles contains the first-principles application contract'
);

SELECT col_type_is('public', 'profiles', 'credits', 'numeric(12,2)', 'profile credits are numeric');

SELECT ok(
  ARRAY[
    'user_id', 'balance', 'total_earned', 'total_spent', 'subscription_status',
    'subscription_type', 'monthly_credit_allowance', 'monthly_credits_used',
    'current_period_start', 'current_period_end', 'stripe_subscription_id',
    'created_at', 'updated_at'
  ]::TEXT[] <@ COALESCE(
    (
      SELECT ARRAY_AGG(column_name::TEXT)
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'user_credits'
    ),
    ARRAY[]::TEXT[]
  ),
  'user_credits contains balance, subscription, and allocation fields'
);

SELECT col_type_is('public', 'user_credits', 'balance', 'numeric(12,2)', 'user credit balance is numeric');

SELECT ok(
  ARRAY[
    'user_id', 'amount', 'transaction_type', 'description',
    'balance_after_transaction', 'metadata', 'credits', 'amount_cents',
    'stripe_session_id', 'stripe_payment_intent_id',
    'stripe_subscription_id', 'idempotency_key', 'created_at', 'updated_at'
  ]::TEXT[] <@ COALESCE(
    (
      SELECT ARRAY_AGG(column_name::TEXT)
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'credit_transactions'
    ),
    ARRAY[]::TEXT[]
  ),
  'credit_transactions contains the signed ledger and provider keys'
);

SELECT col_type_is('public', 'credit_transactions', 'amount', 'numeric(12,2)', 'credit transaction amount is numeric');

SELECT ok(
  NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'credit_transactions'
      AND column_name = 'type'
  ),
  'obsolete credit transaction type alias is removed'
);

SELECT ok(
  (SELECT is_nullable = 'YES'
   FROM information_schema.columns
   WHERE table_schema = 'public'
     AND table_name = 'credit_transactions'
     AND column_name = 'credits'),
  'legacy credits magnitude is nullable'
);

SELECT ok(
  2 = (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'stories'
      AND column_name IN ('user_id', 'initial_story')
      AND column_default IS NULL
  ),
  'stories no longer has literal NOT NULL defaults'
);

SELECT ok(
  2 = (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'stories'
      AND column_name IN ('character_description', 'plot_description')
      AND data_type = 'text'
  ),
  'legacy story description fields are preserved on every install path'
);

SELECT ok(
  2 = (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'stories'
      AND column_name IN ('name', 'created_at')
      AND is_nullable = 'NO'
  ),
  'story identity and creation time are required'
);

SELECT ok(
  (SELECT column_default IS NULL
   FROM information_schema.columns
   WHERE table_schema = 'public'
     AND table_name = 'stories'
     AND column_name = 'generation_completed_at'),
  'story completion time has no implicit default'
);

SELECT ok(
  2 = (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'ebook_generations'
      AND column_name IN ('user_id', 'title')
      AND column_default IS NULL
  ),
  'ebook_generations no longer has literal Not Null defaults'
);

SELECT col_type_is('public', 'memory_books', 'version', 'bigint', 'memory_books has an optimistic version');

SELECT col_type_is('public', 'memory_books', 'status', 'text', 'memory book status is portable text');

SELECT ok(
  3 = (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'memory_books'
      AND column_name IN ('view_count', 'download_count', 'share_count')
      AND data_type = 'bigint'
  ),
  'memory book counters use one bigint contract'
);

SELECT ok(
  3 = (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'memory_books'
      AND column_name IN (
        'table_of_contents', 'generation_settings', 'style_preferences'
      )
      AND column_default IS NOT NULL
  ),
  'memory book JSON collections have stable defaults'
);

SELECT ok(
  EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.memory_books'::REGCLASS
      AND conname = 'memory_books_status_allowed'
      AND contype = 'c'
  ),
  'memory book status values are constrained'
);

SELECT ok(
  NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.memory_books'::REGCLASS
      AND conname IN (
        'memory_books_user_id_fkey',
        'memory_books_ebook_generation_id_fkey'
      )
      AND NOT convalidated
  ),
  'memory book foreign keys are validated'
);

SELECT ok(
  EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'webhook_events'
      AND indexname = 'webhook_events_stripe_event_id_uidx'
      AND indexdef LIKE 'CREATE UNIQUE INDEX%'
  ),
  'Stripe event IDs are unique'
);

SELECT ok(
  EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.generation_requests'::REGCLASS
      AND conname = 'generation_requests_user_key_unique'
      AND contype = 'u'
  ),
  'generation idempotency is unique per user'
);

SELECT ok(
  ARRAY[
    'idempotency_key', 'user_id', 'operation_type', 'credits_charged',
    'transaction_id', 'refund_transaction_id', 'status', 'response_cache',
    'error_code', 'error_message', 'completed_at', 'failed_at', 'expires_at'
  ]::TEXT[] <@ COALESCE(
    (
      SELECT ARRAY_AGG(column_name::TEXT)
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'generation_requests'
    ),
    ARRAY[]::TEXT[]
  ),
  'generation_requests contains claim, completion, failure, and refund state'
);

SELECT ok(
  ARRAY['user_id', 'filename', 'template', 'text_prompt', 'status', 'video_url']::TEXT[]
    <@ COALESCE(
      (
        SELECT ARRAY_AGG(column_name::TEXT)
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'videos'
      ),
      ARRAY[]::TEXT[]
    ),
  'videos supports the active generation function'
);

SELECT ok(
  ARRAY['text_snippet', 'video_url', 'music_url', 'share_id']::TEXT[]
    <@ COALESCE(
      (
        SELECT ARRAY_AGG(column_name::TEXT)
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'tiktok_shares'
      ),
      ARRAY[]::TEXT[]
    ),
  'tiktok_shares contains active analytics fields'
);

SELECT ok(
  7 = (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'tiktok_shares'
      AND column_name IN (
        'metadata', 'view_count', 'like_count', 'comment_count',
        'share_count', 'created_at', 'updated_at'
      )
      AND is_nullable = 'NO'
  ),
  'TikTok analytics defaults cannot decay back to null'
);

SELECT ok(
  9 = (
    SELECT COUNT(*)
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND indexname IN (
        'idx_credit_transactions_created_at',
        'idx_credit_transactions_type',
        'idx_ebook_generations_created_at',
        'idx_ebook_generations_status',
        'idx_ebook_generations_user_id',
        'idx_stories_is_public',
        'idx_stories_status',
        'idx_tiktok_shares_story_id',
        'idx_tiktok_shares_user_id'
      )
  ),
  'fresh and upgraded installs share the historical query indexes'
);

SELECT ok(
  ARRAY[
    'id', 'user_id', 'activity_type', 'activity_data', 'resource_type',
    'resource_id', 'created_at'
  ]::TEXT[] <@ COALESCE(
    (
      SELECT ARRAY_AGG(column_name::TEXT)
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'user_activities'
    ),
    ARRAY[]::TEXT[]
  ),
  'user_activities contains the trusted analytics contract'
);

SELECT ok(
  to_regprocedure('public.set_updated_at_utc()') IS NOT NULL,
  'common UTC updated_at trigger function exists'
);

SELECT is(
  (
    SELECT COUNT(*)::INTEGER
    FROM pg_trigger AS trigger
    JOIN pg_class AS relation ON relation.oid = trigger.tgrelid
    JOIN pg_namespace AS namespace ON namespace.oid = relation.relnamespace
    WHERE namespace.nspname = 'public'
      AND relation.relname IN (
        'profiles', 'user_credits', 'credit_transactions', 'stories',
        'ebook_generations', 'memory_books', 'webhook_events',
        'generation_requests', 'videos', 'tiktok_shares'
      )
      AND trigger.tgname = 'set_updated_at_utc'
      AND NOT trigger.tgisinternal
  ),
  10,
  'all reconciled snake_case tables use the common timestamp trigger'
);

SELECT ok(
  ARRAY[
    'id', 'name', 'email', 'emailVerified', 'image', 'createdAt', 'updatedAt',
    'avatar_url', 'subscription_status', 'credits'
  ]::TEXT[] <@ COALESCE(
    (
      SELECT ARRAY_AGG(column_name::TEXT)
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'user'
    ),
    ARRAY[]::TEXT[]
  ),
  'BetterAuth user columns match the configured 1.5.4 model'
);

SELECT ok(
  ARRAY[
    'id', 'userId', 'token', 'expiresAt', 'ipAddress', 'userAgent',
    'createdAt', 'updatedAt'
  ]::TEXT[] <@ COALESCE(
    (
      SELECT ARRAY_AGG(column_name::TEXT)
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'session'
    ),
    ARRAY[]::TEXT[]
  ),
  'BetterAuth session columns match the 1.5.4 model'
);

SELECT ok(
  ARRAY[
    'id', 'userId', 'accountId', 'providerId', 'accessToken', 'refreshToken',
    'idToken', 'accessTokenExpiresAt', 'refreshTokenExpiresAt', 'scope',
    'password', 'createdAt', 'updatedAt'
  ]::TEXT[] <@ COALESCE(
    (
      SELECT ARRAY_AGG(column_name::TEXT)
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'account'
    ),
    ARRAY[]::TEXT[]
  ),
  'BetterAuth account columns match the 1.5.4 model'
);

SELECT ok(
  ARRAY['id', 'identifier', 'value', 'expiresAt', 'createdAt', 'updatedAt']::TEXT[]
    <@ COALESCE(
      (
        SELECT ARRAY_AGG(column_name::TEXT)
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'verification'
      ),
      ARRAY[]::TEXT[]
    ),
  'BetterAuth verification columns match the 1.5.4 model'
);

SELECT ok(
  EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public' AND tablename = 'user'
      AND indexname = 'user_email_uidx' AND indexdef LIKE 'CREATE UNIQUE INDEX%'
  ),
  'BetterAuth user email is unique'
);

SELECT ok(
  EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public' AND tablename = 'session'
      AND indexname = 'session_token_uidx' AND indexdef LIKE 'CREATE UNIQUE INDEX%'
  ),
  'BetterAuth session token is unique'
);

SELECT ok(
  EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public."session"'::REGCLASS
      AND confrelid = 'public."user"'::REGCLASS
      AND contype = 'f'
  ),
  'BetterAuth session belongs to a user'
);

SELECT ok(
  EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public."account"'::REGCLASS
      AND confrelid = 'public."user"'::REGCLASS
      AND contype = 'f'
  ),
  'BetterAuth account belongs to a user'
);

SELECT ok(
  to_regprocedure('public.set_betterauth_updated_at_utc()') IS NOT NULL,
  'BetterAuth timestamp trigger function exists'
);

SELECT is(
  (
    SELECT COUNT(*)::INTEGER
    FROM pg_trigger AS trigger
    JOIN pg_class AS relation ON relation.oid = trigger.tgrelid
    JOIN pg_namespace AS namespace ON namespace.oid = relation.relnamespace
    WHERE namespace.nspname = 'public'
      AND relation.relname IN ('user', 'session', 'account', 'verification')
      AND trigger.tgname = 'set_betterauth_updated_at_utc'
      AND NOT trigger.tgisinternal
  ),
  4,
  'all BetterAuth tables use the camelCase timestamp trigger'
);

SELECT ok(
  EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'betterauth_app'),
  'betterauth_app capability role exists'
);

SELECT ok(
  NOT (SELECT rolcanlogin FROM pg_roles WHERE rolname = 'betterauth_app'),
  'betterauth_app cannot log in'
);

SELECT ok(
  NOT (SELECT rolbypassrls FROM pg_roles WHERE rolname = 'betterauth_app'),
  'betterauth_app cannot bypass row-level security'
);

SELECT ok(
  (
    SELECT BOOL_AND(
      has_table_privilege('betterauth_app', FORMAT('public.%I', table_name), 'SELECT')
      AND has_table_privilege('betterauth_app', FORMAT('public.%I', table_name), 'INSERT')
      AND has_table_privilege('betterauth_app', FORMAT('public.%I', table_name), 'UPDATE')
      AND has_table_privilege('betterauth_app', FORMAT('public.%I', table_name), 'DELETE')
    )
    FROM UNNEST(ARRAY['user', 'session', 'account', 'verification']) AS table_name
  ),
  'betterauth_app has DML access to exactly its four auth tables'
);

SELECT ok(
  (
    SELECT BOOL_AND(
      NOT has_table_privilege('betterauth_app', FORMAT('public.%I', table_name), 'TRUNCATE')
    )
    FROM UNNEST(ARRAY['user', 'session', 'account', 'verification']) AS table_name
  ),
  'betterauth_app has no destructive table privileges'
);

SELECT ok(
  has_schema_privilege('betterauth_app', 'public', 'USAGE')
  AND NOT has_schema_privilege('betterauth_app', 'public', 'CREATE'),
  'betterauth_app can use but cannot create in public'
);

SELECT ok(
  NOT has_function_privilege(
    'betterauth_app',
    'public.set_betterauth_updated_at_utc()',
    'EXECUTE'
  ),
  'betterauth_app has no direct function execution grants'
);

SELECT is(
  (
    SELECT COUNT(*)::INTEGER
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('user', 'session', 'account', 'verification')
      AND policyname = 'betterauth_app_all'
      AND roles = ARRAY['betterauth_app']::NAME[]
  ),
  4,
  'betterauth_app has one role-scoped policy on each auth table'
);

SELECT ok(
  has_table_privilege('service_role', 'public.session', 'SELECT'),
  'service_role retains session lookup access for Edge authentication'
);

SELECT ok(
  to_regprocedure('public.record_user_activity(text,text,text,text,jsonb)') IS NOT NULL,
  'record_user_activity RPC exists'
);

SELECT ok(
  NOT has_function_privilege(
    'anon',
    'public.record_user_activity(text,text,text,text,jsonb)',
    'EXECUTE'
  ),
  'anon cannot record user activity'
);

SELECT ok(
  NOT has_function_privilege(
    'authenticated',
    'public.record_user_activity(text,text,text,text,jsonb)',
    'EXECUTE'
  ),
  'authenticated cannot call the trusted activity RPC directly'
);

SELECT ok(
  has_function_privilege(
    'service_role',
    'public.record_user_activity(text,text,text,text,jsonb)',
    'EXECUTE'
  ),
  'service_role can call the trusted activity RPC'
);

INSERT INTO public.profiles (id, email, name)
VALUES ('pgtap-activity-owner', 'activity-owner@example.invalid', 'Activity Owner');

INSERT INTO public.memory_books (
  id, user_id, title, chapters, status
)
VALUES (
  '00000000-0000-4000-8000-000000000010',
  'pgtap-activity-owner',
  'Activity pgTAP Book',
  '[]'::JSONB,
  'draft'
);

INSERT INTO public.stories (
  id, user_id, name, initial_story, status
)
VALUES (
  '00000000-0000-4000-8000-000000000011',
  'pgtap-activity-owner',
  'Activity Story',
  'A story used to verify activity ownership.',
  'completed'
);

SET LOCAL ROLE service_role;

SELECT ok(
  public.record_user_activity(
    'pgtap-activity-owner',
    'download',
    'ebook',
    '00000000-0000-4000-8000-000000000010',
    '{"format":"pdf"}'::JSONB
  ),
  'owned download activity succeeds'
);

RESET ROLE;

SELECT is(
  (SELECT download_count::BIGINT FROM public.memory_books
   WHERE id = '00000000-0000-4000-8000-000000000010'),
  1::BIGINT,
  'download activity increments the canonical counter once'
);

SELECT is(
  (SELECT COUNT(*)::INTEGER FROM public.user_activities
   WHERE resource_id = '00000000-0000-4000-8000-000000000010'),
  1,
  'download activity writes one audit row'
);

SET LOCAL ROLE service_role;

SELECT ok(
  NOT public.record_user_activity(
    'different-user',
    'download',
    'ebook',
    '00000000-0000-4000-8000-000000000010',
    '{}'::JSONB
  ),
  'foreign activity fails closed'
);

RESET ROLE;

SELECT is(
  (SELECT COUNT(*)::INTEGER FROM public.user_activities
   WHERE resource_id = '00000000-0000-4000-8000-000000000010'),
  1,
  'foreign activity creates no audit row'
);

SET LOCAL ROLE service_role;

SELECT ok(
  public.record_user_activity(
    'pgtap-activity-owner',
    'share',
    'ebook',
    '00000000-0000-4000-8000-000000000010',
    '{"platform":"test"}'::JSONB
  ),
  'owned share activity succeeds'
);

RESET ROLE;

SELECT is(
  (SELECT share_count::BIGINT FROM public.memory_books
   WHERE id = '00000000-0000-4000-8000-000000000010'),
  1::BIGINT,
  'share activity increments the canonical counter once'
);

SELECT is(
  (SELECT COUNT(*)::INTEGER FROM public.user_activities
   WHERE resource_id = '00000000-0000-4000-8000-000000000010'),
  2,
  'download and share create two audit rows'
);

SET LOCAL ROLE service_role;

SELECT ok(
  NOT public.record_user_activity(
    'pgtap-activity-owner',
    'unsupported',
    'ebook',
    '00000000-0000-4000-8000-000000000010',
    '{}'::JSONB
  ),
  'unsupported activity type fails closed'
);

RESET ROLE;

SELECT ok(
  (SELECT download_count = 1 AND share_count = 1
   FROM public.memory_books
   WHERE id = '00000000-0000-4000-8000-000000000010'),
  'failed activity leaves both counters unchanged'
);

SET LOCAL ROLE service_role;

SELECT ok(
  public.record_user_activity(
    'pgtap-activity-owner',
    'share',
    'story',
    '00000000-0000-4000-8000-000000000011',
    '{"platform":"test"}'::JSONB
  ),
  'owned story share succeeds'
);

RESET ROLE;

SELECT is(
  (SELECT share_count FROM public.stories
   WHERE id = '00000000-0000-4000-8000-000000000011'),
  1,
  'story share increments stories.share_count once'
);

SET LOCAL ROLE service_role;

SELECT ok(
  public.record_user_activity(
    'pgtap-activity-owner',
    'download',
    'story',
    '00000000-0000-4000-8000-000000000011',
    '{"format":"txt"}'::JSONB
  ),
  'owned story download is logged'
);

RESET ROLE;

SELECT ok(
  (SELECT share_count = 1 FROM public.stories
   WHERE id = '00000000-0000-4000-8000-000000000011')
  AND (
    SELECT COUNT(*) = 2
    FROM public.user_activities
    WHERE resource_type = 'story'
      AND resource_id = '00000000-0000-4000-8000-000000000011'
  ),
  'story download does not change shares and both story activities are audited'
);

SELECT * FROM finish();
ROLLBACK;
