BEGIN;

SET LOCAL TIME ZONE 'UTC';

-- BetterAuth receives a group role only. A production login and its membership
-- are provisioned out-of-band so no database credential enters migration history.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'betterauth_app') THEN
    CREATE ROLE betterauth_app
      NOLOGIN
      NOSUPERUSER
      NOCREATEDB
      NOCREATEROLE
      NOREPLICATION
      NOBYPASSRLS;
  END IF;
END
$$;

-- ---------------------------------------------------------------------------
-- BetterAuth 1.5.4 core schema, including the configured user extensions.
-- Quoted camelCase names are part of BetterAuth's PostgreSQL contract.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public."user" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  name TEXT DEFAULT '',
  email TEXT NOT NULL,
  "emailVerified" BOOLEAN NOT NULL DEFAULT FALSE,
  image TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  avatar_url TEXT DEFAULT '',
  subscription_status TEXT DEFAULT 'free',
  credits INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public."session" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "userId" TEXT NOT NULL,
  token TEXT NOT NULL,
  "expiresAt" TIMESTAMPTZ NOT NULL,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public."account" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "userId" TEXT NOT NULL,
  "accountId" TEXT NOT NULL,
  "providerId" TEXT NOT NULL,
  "accessToken" TEXT,
  "refreshToken" TEXT,
  "idToken" TEXT,
  "accessTokenExpiresAt" TIMESTAMPTZ,
  "refreshTokenExpiresAt" TIMESTAMPTZ,
  scope TEXT,
  password TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public."verification" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  identifier TEXT NOT NULL,
  value TEXT NOT NULL,
  "expiresAt" TIMESTAMPTZ NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Make the migration convergent if a provider preview already created a subset
-- of the BetterAuth schema.
ALTER TABLE public."user"
  ADD COLUMN IF NOT EXISTS name TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS "emailVerified" BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS image TEXT,
  ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS avatar_url TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS credits INTEGER DEFAULT 0;

ALTER TABLE public."session"
  ADD COLUMN IF NOT EXISTS "userId" TEXT,
  ADD COLUMN IF NOT EXISTS token TEXT,
  ADD COLUMN IF NOT EXISTS "expiresAt" TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS "ipAddress" TEXT,
  ADD COLUMN IF NOT EXISTS "userAgent" TEXT,
  ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE public."account"
  ADD COLUMN IF NOT EXISTS "userId" TEXT,
  ADD COLUMN IF NOT EXISTS "accountId" TEXT,
  ADD COLUMN IF NOT EXISTS "providerId" TEXT,
  ADD COLUMN IF NOT EXISTS "accessToken" TEXT,
  ADD COLUMN IF NOT EXISTS "refreshToken" TEXT,
  ADD COLUMN IF NOT EXISTS "idToken" TEXT,
  ADD COLUMN IF NOT EXISTS "accessTokenExpiresAt" TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS "refreshTokenExpiresAt" TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS scope TEXT,
  ADD COLUMN IF NOT EXISTS password TEXT,
  ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE public."verification"
  ADD COLUMN IF NOT EXISTS identifier TEXT,
  ADD COLUMN IF NOT EXISTS value TEXT,
  ADD COLUMN IF NOT EXISTS "expiresAt" TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMPTZ DEFAULT NOW();

UPDATE public."user"
SET name = COALESCE(name, ''),
    "emailVerified" = COALESCE("emailVerified", FALSE),
    "createdAt" = COALESCE("createdAt", NOW()),
    "updatedAt" = COALESCE("updatedAt", NOW());

UPDATE public."session"
SET "createdAt" = COALESCE("createdAt", NOW()),
    "updatedAt" = COALESCE("updatedAt", NOW());

UPDATE public."account"
SET "createdAt" = COALESCE("createdAt", NOW()),
    "updatedAt" = COALESCE("updatedAt", NOW());

UPDATE public."verification"
SET "createdAt" = COALESCE("createdAt", NOW()),
    "updatedAt" = COALESCE("updatedAt", NOW());

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public."user"
    WHERE name IS NULL OR email IS NULL OR "emailVerified" IS NULL
       OR "createdAt" IS NULL OR "updatedAt" IS NULL
  ) OR EXISTS (
    SELECT 1 FROM public."session"
    WHERE "userId" IS NULL OR token IS NULL OR "expiresAt" IS NULL
       OR "createdAt" IS NULL OR "updatedAt" IS NULL
  ) OR EXISTS (
    SELECT 1 FROM public."account"
    WHERE "userId" IS NULL OR "accountId" IS NULL OR "providerId" IS NULL
       OR "createdAt" IS NULL OR "updatedAt" IS NULL
  ) OR EXISTS (
    SELECT 1 FROM public."verification"
    WHERE identifier IS NULL OR value IS NULL OR "expiresAt" IS NULL
       OR "createdAt" IS NULL OR "updatedAt" IS NULL
  ) THEN
    RAISE EXCEPTION 'existing BetterAuth tables contain rows that violate the 1.5.4 contract';
  END IF;
END
$$;

ALTER TABLE public."user"
  ALTER COLUMN id SET DEFAULT gen_random_uuid()::TEXT,
  ALTER COLUMN email SET NOT NULL,
  ALTER COLUMN "emailVerified" SET DEFAULT FALSE,
  ALTER COLUMN "emailVerified" SET NOT NULL,
  ALTER COLUMN "createdAt" SET DEFAULT NOW(),
  ALTER COLUMN "createdAt" SET NOT NULL,
  ALTER COLUMN "updatedAt" SET DEFAULT NOW(),
  ALTER COLUMN "updatedAt" SET NOT NULL,
  ALTER COLUMN name SET DEFAULT '',
  ALTER COLUMN name SET NOT NULL,
  ALTER COLUMN avatar_url SET DEFAULT '',
  ALTER COLUMN subscription_status SET DEFAULT 'free',
  ALTER COLUMN credits SET DEFAULT 0;

ALTER TABLE public."session"
  ALTER COLUMN id SET DEFAULT gen_random_uuid()::TEXT,
  ALTER COLUMN "userId" SET NOT NULL,
  ALTER COLUMN token SET NOT NULL,
  ALTER COLUMN "expiresAt" SET NOT NULL,
  ALTER COLUMN "createdAt" SET DEFAULT NOW(),
  ALTER COLUMN "createdAt" SET NOT NULL,
  ALTER COLUMN "updatedAt" SET DEFAULT NOW(),
  ALTER COLUMN "updatedAt" SET NOT NULL;

ALTER TABLE public."account"
  ALTER COLUMN id SET DEFAULT gen_random_uuid()::TEXT,
  ALTER COLUMN "userId" SET NOT NULL,
  ALTER COLUMN "accountId" SET NOT NULL,
  ALTER COLUMN "providerId" SET NOT NULL,
  ALTER COLUMN "createdAt" SET DEFAULT NOW(),
  ALTER COLUMN "createdAt" SET NOT NULL,
  ALTER COLUMN "updatedAt" SET DEFAULT NOW(),
  ALTER COLUMN "updatedAt" SET NOT NULL;

ALTER TABLE public."verification"
  ALTER COLUMN id SET DEFAULT gen_random_uuid()::TEXT,
  ALTER COLUMN identifier SET NOT NULL,
  ALTER COLUMN value SET NOT NULL,
  ALTER COLUMN "expiresAt" SET NOT NULL,
  ALTER COLUMN "createdAt" SET DEFAULT NOW(),
  ALTER COLUMN "createdAt" SET NOT NULL,
  ALTER COLUMN "updatedAt" SET DEFAULT NOW(),
  ALTER COLUMN "updatedAt" SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS user_email_uidx
  ON public."user" (email);

CREATE UNIQUE INDEX IF NOT EXISTS session_token_uidx
  ON public."session" (token);

CREATE INDEX IF NOT EXISTS session_userId_idx
  ON public."session" ("userId");

CREATE UNIQUE INDEX IF NOT EXISTS account_provider_account_uidx
  ON public."account" ("providerId", "accountId");

CREATE INDEX IF NOT EXISTS account_userId_idx
  ON public."account" ("userId");

CREATE INDEX IF NOT EXISTS verification_identifier_idx
  ON public."verification" (identifier);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public."session"'::REGCLASS
      AND contype = 'f'
      AND confrelid = 'public."user"'::REGCLASS
  ) THEN
    ALTER TABLE public."session"
      ADD CONSTRAINT session_userId_fkey
      FOREIGN KEY ("userId") REFERENCES public."user"(id) ON DELETE CASCADE
      NOT VALID;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public."account"'::REGCLASS
      AND contype = 'f'
      AND confrelid = 'public."user"'::REGCLASS
  ) THEN
    ALTER TABLE public."account"
      ADD CONSTRAINT account_userId_fkey
      FOREIGN KEY ("userId") REFERENCES public."user"(id) ON DELETE CASCADE
      NOT VALID;
  END IF;

  ALTER TABLE public."session" VALIDATE CONSTRAINT session_userId_fkey;
  ALTER TABLE public."account" VALIDATE CONSTRAINT account_userId_fkey;
END
$$;

CREATE OR REPLACE FUNCTION public.set_betterauth_updated_at_utc()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW."updatedAt" = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;

DO $$
DECLARE
  target_table TEXT;
BEGIN
  FOREACH target_table IN ARRAY ARRAY['user', 'session', 'account', 'verification']
  LOOP
    EXECUTE FORMAT(
      'DROP TRIGGER IF EXISTS set_betterauth_updated_at_utc ON public.%I',
      target_table
    );
    EXECUTE FORMAT(
      'CREATE TRIGGER set_betterauth_updated_at_utc BEFORE UPDATE ON public.%I '
      'FOR EACH ROW EXECUTE FUNCTION public.set_betterauth_updated_at_utc()',
      target_table
    );
  END LOOP;
END
$$;

-- Provision the application profile, opening credit balance, and signup ledger
-- entry as one transaction. The BetterAuth user row is the only identity source;
-- callers provide only the already-verified user id.
DROP FUNCTION IF EXISTS public.provision_betterauth_profile(TEXT);

CREATE FUNCTION public.provision_betterauth_profile(p_user_id TEXT)
RETURNS TABLE(profile JSONB, credits NUMERIC, created BOOLEAN)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  identity_user public."user"%ROWTYPE;
  profile_row public.profiles%ROWTYPE;
  profile_created BOOLEAN := FALSE;
  credits_created BOOLEAN := FALSE;
  credit_balance NUMERIC(12, 2);
  canonical_name TEXT;
  canonical_avatar_url TEXT;
BEGIN
  IF p_user_id IS NULL OR BTRIM(p_user_id) = '' THEN
    RAISE EXCEPTION 'BetterAuth user id is required'
      USING ERRCODE = '22023';
  END IF;

  PERFORM pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(p_user_id, 0)
  );

  SELECT *
    INTO identity_user
    FROM public."user"
   WHERE id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'BetterAuth user % does not exist', p_user_id
      USING ERRCODE = '23503';
  END IF;

  canonical_name := COALESCE(
    NULLIF(BTRIM(identity_user.name), ''),
    NULLIF(SPLIT_PART(identity_user.email, '@', 1), ''),
    ''
  );
  canonical_avatar_url := COALESCE(
    NULLIF(BTRIM(identity_user.image), ''),
    NULLIF(BTRIM(identity_user.avatar_url), ''),
    ''
  );

  INSERT INTO public.profiles (
    id,
    email,
    name,
    full_name,
    avatar_url,
    subscription_status
  )
  VALUES (
    identity_user.id,
    identity_user.email,
    canonical_name,
    canonical_name,
    canonical_avatar_url,
    COALESCE(NULLIF(BTRIM(identity_user.subscription_status), ''), 'free')
  )
  ON CONFLICT (id) DO NOTHING
  RETURNING TRUE INTO profile_created;

  profile_created := COALESCE(profile_created, FALSE);

  UPDATE public.profiles
     SET email = identity_user.email,
         name = canonical_name,
         avatar_url = canonical_avatar_url
   WHERE id = identity_user.id
  RETURNING * INTO profile_row;

  INSERT INTO public.user_credits (
    user_id,
    balance,
    total_earned,
    total_spent,
    subscription_status
  )
  VALUES (identity_user.id, 3, 3, 0, 'none')
  ON CONFLICT (user_id) DO NOTHING
  RETURNING TRUE INTO credits_created;

  credits_created := COALESCE(credits_created, FALSE);

  SELECT balance
    INTO credit_balance
    FROM public.user_credits
   WHERE user_id = identity_user.id;

  IF credits_created THEN
    INSERT INTO public.credit_transactions (
      user_id,
      amount,
      credits,
      transaction_type,
      description,
      balance_after_transaction,
      metadata,
      idempotency_key
    )
    VALUES (
      identity_user.id,
      3,
      3,
      'bonus',
      'Welcome bonus: 3 free credits on signup',
      credit_balance,
      '{"source":"signup_bonus"}'::JSONB,
      'signup_bonus:' || identity_user.id
    )
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN QUERY
  SELECT pg_catalog.to_jsonb(profile_row), credit_balance, profile_created;
END
$$;

-- ---------------------------------------------------------------------------
-- Private-by-default data plane. BetterAuth opaque tokens are authenticated in
-- trusted server code, so browser roles receive no direct base-table access.
-- ---------------------------------------------------------------------------

REVOKE CREATE ON SCHEMA public FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

DO $$
DECLARE
  target_table RECORD;
  existing_policy RECORD;
BEGIN
  FOR target_table IN
    SELECT c.relname
    FROM pg_class AS c
    JOIN pg_namespace AS n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind IN ('r', 'p')
  LOOP
    FOR existing_policy IN
      SELECT policyname
      FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = target_table.relname
    LOOP
      EXECUTE FORMAT(
        'DROP POLICY %I ON public.%I',
        existing_policy.policyname,
        target_table.relname
      );
    END LOOP;

    EXECUTE FORMAT('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', target_table.relname);
    EXECUTE FORMAT('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY', target_table.relname);
    EXECUTE FORMAT(
      'REVOKE ALL PRIVILEGES ON TABLE public.%I FROM PUBLIC, anon, authenticated',
      target_table.relname
    );
    EXECUTE FORMAT(
      'GRANT ALL PRIVILEGES ON TABLE public.%I TO service_role',
      target_table.relname
    );
    EXECUTE FORMAT(
      'CREATE POLICY service_role_all ON public.%I '
      'FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE)',
      target_table.relname
    );

    IF target_table.relname IN ('user', 'session', 'account', 'verification') THEN
      EXECUTE FORMAT(
        'CREATE POLICY betterauth_app_all ON public.%I '
        'FOR ALL TO betterauth_app USING (TRUE) WITH CHECK (TRUE)',
        target_table.relname
      );
    END IF;
  END LOOP;
END
$$;

-- Existing public views may summarize private records. Revoke them all before
-- exposing the one reviewed community projection below.
DO $$
DECLARE
  target_view RECORD;
BEGIN
  FOR target_view IN
    SELECT c.relname, c.relkind
    FROM pg_class AS c
    JOIN pg_namespace AS n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind IN ('v', 'm')
  LOOP
    EXECUTE FORMAT(
      'REVOKE ALL PRIVILEGES ON %s public.%I FROM PUBLIC, anon, authenticated',
      CASE WHEN target_view.relkind = 'm' THEN 'MATERIALIZED VIEW' ELSE 'TABLE' END,
      target_view.relname
    );
    EXECUTE FORMAT(
      'GRANT SELECT ON %s public.%I TO service_role',
      CASE WHEN target_view.relkind = 'm' THEN 'MATERIALIZED VIEW' ELSE 'TABLE' END,
      target_view.relname
    );
  END LOOP;
END
$$;

DROP VIEW IF EXISTS public.community_books;

CREATE VIEW public.community_books
WITH (security_barrier = TRUE, security_invoker = FALSE)
AS
SELECT
  id,
  title,
  subtitle,
  author_name,
  cover_image_url,
  chapter_count,
  word_count,
  created_at,
  published_at,
  status
FROM public.memory_books
WHERE status::TEXT = 'published';

REVOKE ALL PRIVILEGES ON TABLE public.community_books FROM PUBLIC;
GRANT SELECT ON TABLE public.community_books TO anon, authenticated, service_role;

COMMENT ON VIEW public.community_books IS
  'Fixed public projection of published memory books; excludes ownership, content, settings, and private file URLs.';

-- Remove callable access to historical SECURITY DEFINER helpers and mutators.
-- Later migrations must explicitly grant only the functions they introduce.
DO $$
DECLARE
  target_function RECORD;
BEGIN
  FOR target_function IN
    SELECT p.proname, pg_get_function_identity_arguments(p.oid) AS arguments
    FROM pg_proc AS p
    JOIN pg_namespace AS n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prokind = 'f'
  LOOP
    EXECUTE FORMAT(
      'REVOKE ALL PRIVILEGES ON FUNCTION public.%I(%s) FROM PUBLIC, anon, authenticated',
      target_function.proname,
      target_function.arguments
    );
    EXECUTE FORMAT(
      'GRANT EXECUTE ON FUNCTION public.%I(%s) TO service_role',
      target_function.proname,
      target_function.arguments
    );
  END LOOP;
END
$$;

REVOKE ALL PRIVILEGES ON SCHEMA public FROM betterauth_app;
GRANT USAGE ON SCHEMA public TO betterauth_app;

GRANT SELECT, INSERT, UPDATE, DELETE
  ON TABLE public."user", public."session", public."account", public."verification"
  TO betterauth_app;

-- UUID defaults currently need no sequences. This covers a provider-created
-- serial identity without granting access to unrelated application sequences.
DO $$
DECLARE
  auth_sequence RECORD;
BEGIN
  FOR auth_sequence IN
    SELECT DISTINCT sequence_ns.nspname AS schema_name,
                    sequence_class.relname AS sequence_name
    FROM pg_depend AS dependency
    JOIN pg_class AS sequence_class
      ON sequence_class.oid = dependency.objid
     AND sequence_class.relkind = 'S'
    JOIN pg_namespace AS sequence_ns
      ON sequence_ns.oid = sequence_class.relnamespace
    JOIN pg_class AS table_class
      ON table_class.oid = dependency.refobjid
    JOIN pg_namespace AS table_ns
      ON table_ns.oid = table_class.relnamespace
    WHERE table_ns.nspname = 'public'
      AND table_class.relname IN ('user', 'session', 'account', 'verification')
  LOOP
    EXECUTE FORMAT(
      'GRANT USAGE, SELECT ON SEQUENCE %I.%I TO betterauth_app',
      auth_sequence.schema_name,
      auth_sequence.sequence_name
    );
  END LOOP;
END
$$;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  REVOKE ALL PRIVILEGES ON TABLES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  REVOKE ALL PRIVILEGES ON FUNCTIONS FROM PUBLIC, anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL PRIVILEGES ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT EXECUTE ON FUNCTIONS TO service_role;

COMMIT;
