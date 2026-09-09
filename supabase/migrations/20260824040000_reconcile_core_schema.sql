BEGIN;

SET LOCAL TIME ZONE 'UTC';

-- Legacy/partial-deploy views depend on columns normalized below. They are
-- derived objects only: the reviewed community projection is recreated by the
-- immediately following security migration, while user_credit_balances is
-- superseded by the canonical user_credits table and trusted credit RPCs.
DO $$
DECLARE
  derived_relation RECORD;
BEGIN
  FOR derived_relation IN
    SELECT c.relname, c.relkind
    FROM pg_class AS c
    JOIN pg_namespace AS n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname IN ('community_books', 'user_credit_balances')
      AND c.relkind IN ('v', 'm')
  LOOP
    EXECUTE FORMAT(
      'DROP %s public.%I',
      CASE WHEN derived_relation.relkind = 'm' THEN 'MATERIALIZED VIEW' ELSE 'VIEW' END,
      derived_relation.relname
    );
  END LOOP;
END
$$;

-- ---------------------------------------------------------------------------
-- Profiles: retain legacy identities while converging on the fields used by
-- BetterAuth provisioning, administration, checkout, and creator surfaces.
-- ---------------------------------------------------------------------------

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS name TEXT,
  ADD COLUMN IF NOT EXISTS full_name TEXT,
  ADD COLUMN IF NOT EXISTS username TEXT,
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS role TEXT,
  ADD COLUMN IF NOT EXISTS social_links JSONB,
  ADD COLUMN IF NOT EXISTS subscription_status TEXT,
  ADD COLUMN IF NOT EXISTS credits NUMERIC(12, 2),
  ADD COLUMN IF NOT EXISTS stories_count INTEGER,
  ADD COLUMN IF NOT EXISTS total_likes INTEGER,
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;

ALTER TABLE public.profiles
  ALTER COLUMN credits TYPE NUMERIC(12, 2) USING credits::NUMERIC(12, 2);

UPDATE public.profiles
SET name = COALESCE(name, full_name, ''),
    full_name = COALESCE(full_name, name, ''),
    role = COALESCE(NULLIF(BTRIM(role), ''), 'user'),
    social_links = COALESCE(social_links, '{}'::JSONB),
    subscription_status = COALESCE(NULLIF(BTRIM(subscription_status), ''), 'free'),
    credits = COALESCE(credits, 0),
    stories_count = COALESCE(stories_count, 0),
    total_likes = COALESCE(total_likes, 0),
    created_at = COALESCE(created_at, NOW()),
    updated_at = COALESCE(updated_at, NOW());

ALTER TABLE public.profiles
  ALTER COLUMN name SET DEFAULT '',
  ALTER COLUMN name SET NOT NULL,
  ALTER COLUMN full_name SET DEFAULT '',
  ALTER COLUMN full_name SET NOT NULL,
  ALTER COLUMN role SET DEFAULT 'user',
  ALTER COLUMN role SET NOT NULL,
  ALTER COLUMN social_links SET DEFAULT '{}'::JSONB,
  ALTER COLUMN social_links SET NOT NULL,
  ALTER COLUMN subscription_status SET DEFAULT 'free',
  ALTER COLUMN subscription_status SET NOT NULL,
  ALTER COLUMN credits SET DEFAULT 0,
  ALTER COLUMN credits SET NOT NULL,
  ALTER COLUMN stories_count SET DEFAULT 0,
  ALTER COLUMN stories_count SET NOT NULL,
  ALTER COLUMN total_likes SET DEFAULT 0,
  ALTER COLUMN total_likes SET NOT NULL,
  ALTER COLUMN created_at SET DEFAULT NOW(),
  ALTER COLUMN created_at SET NOT NULL,
  ALTER COLUMN updated_at SET DEFAULT NOW(),
  ALTER COLUMN updated_at SET NOT NULL;

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_credits_nonnegative,
  DROP CONSTRAINT IF EXISTS profiles_stories_count_nonnegative,
  DROP CONSTRAINT IF EXISTS profiles_total_likes_nonnegative,
  DROP CONSTRAINT IF EXISTS profiles_social_links_object;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_credits_nonnegative CHECK (credits >= 0),
  ADD CONSTRAINT profiles_stories_count_nonnegative CHECK (stories_count >= 0),
  ADD CONSTRAINT profiles_total_likes_nonnegative CHECK (total_likes >= 0),
  ADD CONSTRAINT profiles_social_links_object
    CHECK (jsonb_typeof(social_links) = 'object');

CREATE INDEX IF NOT EXISTS idx_profiles_email_lower
  ON public.profiles (LOWER(email))
  WHERE email IS NOT NULL AND BTRIM(email) <> '';

CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_lower_uidx
  ON public.profiles (LOWER(username))
  WHERE username IS NOT NULL AND BTRIM(username) <> '';

CREATE UNIQUE INDEX IF NOT EXISTS profiles_stripe_customer_id_uidx
  ON public.profiles (stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL AND BTRIM(stripe_customer_id) <> '';

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles (role);

-- ---------------------------------------------------------------------------
-- Credit balances: use one fractional-safe balance row per profile.
-- ---------------------------------------------------------------------------

ALTER TABLE public.user_credits
  ADD COLUMN IF NOT EXISTS user_id TEXT,
  ADD COLUMN IF NOT EXISTS balance NUMERIC(12, 2),
  ADD COLUMN IF NOT EXISTS total_earned NUMERIC(12, 2),
  ADD COLUMN IF NOT EXISTS total_spent NUMERIC(12, 2),
  ADD COLUMN IF NOT EXISTS subscription_status TEXT,
  ADD COLUMN IF NOT EXISTS subscription_type TEXT,
  ADD COLUMN IF NOT EXISTS subscription_starts_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS monthly_credit_allowance NUMERIC(12, 2),
  ADD COLUMN IF NOT EXISTS monthly_credits_used NUMERIC(12, 2),
  ADD COLUMN IF NOT EXISTS current_period_start TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS samcart_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;

ALTER TABLE public.user_credits
  DROP CONSTRAINT IF EXISTS user_credits_balance_check,
  DROP CONSTRAINT IF EXISTS user_credits_balance_nonnegative,
  DROP CONSTRAINT IF EXISTS user_credits_total_earned_nonnegative,
  DROP CONSTRAINT IF EXISTS user_credits_total_spent_nonnegative,
  DROP CONSTRAINT IF EXISTS user_credits_monthly_allowance_nonnegative,
  DROP CONSTRAINT IF EXISTS user_credits_monthly_used_nonnegative;

ALTER TABLE public.user_credits
  ALTER COLUMN balance TYPE NUMERIC(12, 2) USING balance::NUMERIC(12, 2),
  ALTER COLUMN total_earned TYPE NUMERIC(12, 2) USING total_earned::NUMERIC(12, 2),
  ALTER COLUMN total_spent TYPE NUMERIC(12, 2) USING total_spent::NUMERIC(12, 2),
  ALTER COLUMN monthly_credit_allowance TYPE NUMERIC(12, 2)
    USING monthly_credit_allowance::NUMERIC(12, 2),
  ALTER COLUMN monthly_credits_used TYPE NUMERIC(12, 2)
    USING monthly_credits_used::NUMERIC(12, 2),
  ALTER COLUMN subscription_starts_at TYPE TIMESTAMPTZ
    USING subscription_starts_at AT TIME ZONE 'UTC',
  ALTER COLUMN subscription_expires_at TYPE TIMESTAMPTZ
    USING subscription_expires_at AT TIME ZONE 'UTC',
  ALTER COLUMN current_period_start TYPE TIMESTAMPTZ
    USING current_period_start AT TIME ZONE 'UTC',
  ALTER COLUMN current_period_end TYPE TIMESTAMPTZ
    USING current_period_end AT TIME ZONE 'UTC',
  ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC',
  ALTER COLUMN updated_at TYPE TIMESTAMPTZ USING updated_at AT TIME ZONE 'UTC';

UPDATE public.user_credits
SET balance = COALESCE(balance, 0),
    total_earned = COALESCE(total_earned, 0),
    total_spent = COALESCE(total_spent, 0),
    monthly_credit_allowance = COALESCE(monthly_credit_allowance, 0),
    monthly_credits_used = COALESCE(monthly_credits_used, 0),
    subscription_status = COALESCE(NULLIF(BTRIM(subscription_status), ''), 'none'),
    created_at = COALESCE(created_at, NOW()),
    updated_at = COALESCE(updated_at, NOW());

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.user_credits WHERE user_id IS NULL) THEN
    RAISE EXCEPTION 'user_credits contains rows without user_id; repair ownership before applying this migration';
  END IF;
END
$$;

ALTER TABLE public.user_credits
  ALTER COLUMN user_id SET NOT NULL,
  ALTER COLUMN balance SET DEFAULT 0,
  ALTER COLUMN balance SET NOT NULL,
  ALTER COLUMN total_earned SET DEFAULT 0,
  ALTER COLUMN total_earned SET NOT NULL,
  ALTER COLUMN total_spent SET DEFAULT 0,
  ALTER COLUMN total_spent SET NOT NULL,
  ALTER COLUMN subscription_status SET DEFAULT 'none',
  ALTER COLUMN subscription_status SET NOT NULL,
  ALTER COLUMN monthly_credit_allowance SET DEFAULT 0,
  ALTER COLUMN monthly_credit_allowance SET NOT NULL,
  ALTER COLUMN monthly_credits_used SET DEFAULT 0,
  ALTER COLUMN monthly_credits_used SET NOT NULL,
  ALTER COLUMN created_at SET DEFAULT NOW(),
  ALTER COLUMN created_at SET NOT NULL,
  ALTER COLUMN updated_at SET DEFAULT NOW(),
  ALTER COLUMN updated_at SET NOT NULL;

ALTER TABLE public.user_credits
  ADD CONSTRAINT user_credits_balance_nonnegative CHECK (balance >= 0),
  ADD CONSTRAINT user_credits_total_earned_nonnegative CHECK (total_earned >= 0),
  ADD CONSTRAINT user_credits_total_spent_nonnegative CHECK (total_spent >= 0),
  ADD CONSTRAINT user_credits_monthly_allowance_nonnegative
    CHECK (monthly_credit_allowance >= 0),
  ADD CONSTRAINT user_credits_monthly_used_nonnegative
    CHECK (monthly_credits_used >= 0);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.user_credits'::REGCLASS
      AND contype = 'f'
      AND confrelid = 'public.profiles'::REGCLASS
  ) THEN
    ALTER TABLE public.user_credits
      ADD CONSTRAINT user_credits_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE
      NOT VALID;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.user_credits'::REGCLASS
      AND conname = 'user_credits_user_id_fkey'
      AND NOT convalidated
  ) THEN
    ALTER TABLE public.user_credits
      VALIDATE CONSTRAINT user_credits_user_id_fkey;
  END IF;
END
$$;

CREATE UNIQUE INDEX IF NOT EXISTS user_credits_user_id_uidx
  ON public.user_credits (user_id);

CREATE INDEX IF NOT EXISTS idx_user_credits_stripe_subscription_id
  ON public.user_credits (stripe_subscription_id)
  WHERE stripe_subscription_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- Credit ledger: amount is the canonical signed delta. The legacy credits
-- magnitude remains nullable during the transition so existing integrations
-- can be retired without losing historical data.
-- ---------------------------------------------------------------------------

ALTER TABLE public.credit_transactions
  ADD COLUMN IF NOT EXISTS user_id TEXT,
  ADD COLUMN IF NOT EXISTS amount NUMERIC(12, 2),
  ADD COLUMN IF NOT EXISTS transaction_type TEXT,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS balance_after_transaction NUMERIC(12, 2),
  ADD COLUMN IF NOT EXISTS metadata JSONB,
  ADD COLUMN IF NOT EXISTS credits NUMERIC(12, 2),
  ADD COLUMN IF NOT EXISTS amount_cents INTEGER,
  ADD COLUMN IF NOT EXISTS stripe_session_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS idempotency_key TEXT,
  ADD COLUMN IF NOT EXISTS reference_id TEXT,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;

ALTER TABLE public.credit_transactions
  DROP CONSTRAINT IF EXISTS credit_transactions_credits_positive,
  DROP CONSTRAINT IF EXISTS credit_transactions_type_allowed;

ALTER TABLE public.credit_transactions
  ALTER COLUMN amount TYPE NUMERIC(12, 2) USING amount::NUMERIC(12, 2),
  ALTER COLUMN balance_after_transaction TYPE NUMERIC(12, 2)
    USING balance_after_transaction::NUMERIC(12, 2),
  ALTER COLUMN credits TYPE NUMERIC(12, 2) USING credits::NUMERIC(12, 2),
  ALTER COLUMN transaction_type TYPE TEXT USING transaction_type::TEXT,
  ALTER COLUMN stripe_session_id TYPE TEXT USING stripe_session_id::TEXT,
  ALTER COLUMN reference_id TYPE TEXT USING reference_id::TEXT,
  ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC',
  ALTER COLUMN updated_at TYPE TIMESTAMPTZ USING updated_at AT TIME ZONE 'UTC';

UPDATE public.credit_transactions
SET amount = CASE
      WHEN amount IS NOT NULL THEN amount
      WHEN transaction_type IN ('usage', 'ebook_generation', 'refund')
        THEN -ABS(credits)
      ELSE ABS(credits)
    END
WHERE amount IS NULL;

UPDATE public.credit_transactions
SET credits = ABS(amount)
WHERE credits IS NULL AND amount IS NOT NULL;

UPDATE public.credit_transactions
SET description = COALESCE(description, 'Legacy credit transaction'),
    balance_after_transaction = COALESCE(balance_after_transaction, 0),
    metadata = COALESCE(metadata, '{}'::JSONB),
    created_at = COALESCE(created_at, NOW()),
    updated_at = COALESCE(updated_at, created_at, NOW());

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.credit_transactions
    WHERE user_id IS NULL OR amount IS NULL OR transaction_type IS NULL
  ) THEN
    RAISE EXCEPTION 'credit_transactions contains incomplete ownership or amount data; repair rows before applying this migration';
  END IF;
END
$$;

ALTER TABLE public.credit_transactions
  ALTER COLUMN user_id SET NOT NULL,
  ALTER COLUMN amount SET NOT NULL,
  ALTER COLUMN transaction_type SET NOT NULL,
  ALTER COLUMN description SET NOT NULL,
  ALTER COLUMN balance_after_transaction SET NOT NULL,
  ALTER COLUMN metadata SET DEFAULT '{}'::JSONB,
  ALTER COLUMN metadata SET NOT NULL,
  ALTER COLUMN credits DROP NOT NULL,
  ALTER COLUMN created_at SET DEFAULT NOW(),
  ALTER COLUMN created_at SET NOT NULL,
  ALTER COLUMN updated_at SET DEFAULT NOW(),
  ALTER COLUMN updated_at SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS credit_transactions_idempotency_key_key
  ON public.credit_transactions (idempotency_key)
  WHERE idempotency_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_credit_transactions_stripe_payment_intent_id
  ON public.credit_transactions (stripe_payment_intent_id)
  WHERE stripe_payment_intent_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_credit_transactions_stripe_subscription_id
  ON public.credit_transactions (stripe_subscription_id)
  WHERE stripe_subscription_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_created_at
  ON public.credit_transactions (user_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- Story and eBook provenance tables. Drop only the two accidental literal
-- defaults; existing row values are deliberately left untouched.
-- ---------------------------------------------------------------------------

ALTER TABLE public.stories
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS personality_type TEXT,
  ADD COLUMN IF NOT EXISTS era TEXT,
  ADD COLUMN IF NOT EXISTS location TEXT,
  ADD COLUMN IF NOT EXISTS gender TEXT,
  ADD COLUMN IF NOT EXISTS transformed_name TEXT,
  ADD COLUMN IF NOT EXISTS prompt_data JSONB,
  ADD COLUMN IF NOT EXISTS generation_settings JSONB,
  ADD COLUMN IF NOT EXISTS word_count INTEGER,
  ADD COLUMN IF NOT EXISTS reading_time_minutes INTEGER,
  ADD COLUMN IF NOT EXISTS content_rating TEXT DEFAULT 'general',
  ADD COLUMN IF NOT EXISTS tags TEXT[],
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'completed',
  ADD COLUMN IF NOT EXISTS generation_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS generation_completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS like_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS share_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE public.stories
  ALTER COLUMN user_id DROP DEFAULT,
  ALTER COLUMN initial_story DROP DEFAULT,
  ALTER COLUMN generation_started_at TYPE TIMESTAMPTZ
    USING generation_started_at AT TIME ZONE 'UTC',
  ALTER COLUMN generation_completed_at TYPE TIMESTAMPTZ
    USING generation_completed_at AT TIME ZONE 'UTC',
  ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC',
  ALTER COLUMN updated_at TYPE TIMESTAMPTZ USING updated_at AT TIME ZONE 'UTC',
  ALTER COLUMN created_at SET DEFAULT NOW(),
  ALTER COLUMN updated_at SET DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_stories_user_created_at
  ON public.stories (user_id, created_at DESC);

ALTER TABLE public.ebook_generations
  ADD COLUMN IF NOT EXISTS story_id TEXT,
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS content TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS credits_used NUMERIC(12, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS paid_with_credits BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS transaction_id TEXT,
  ADD COLUMN IF NOT EXISTS story_type TEXT,
  ADD COLUMN IF NOT EXISTS chapter_count BIGINT,
  ADD COLUMN IF NOT EXISTS word_count BIGINT,
  ADD COLUMN IF NOT EXISTS total_tokens_used BIGINT,
  ADD COLUMN IF NOT EXISTS estimated_cost_usd NUMERIC(12, 4),
  ADD COLUMN IF NOT EXISTS story_purchase_id UUID,
  ADD COLUMN IF NOT EXISTS share_count BIGINT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS generation_completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE public.ebook_generations
  ALTER COLUMN user_id DROP DEFAULT,
  ALTER COLUMN title DROP DEFAULT,
  ALTER COLUMN credits_used TYPE NUMERIC(12, 2)
    USING credits_used::NUMERIC(12, 2),
  ALTER COLUMN published_at TYPE TIMESTAMPTZ
    USING published_at AT TIME ZONE 'UTC',
  ALTER COLUMN generation_completed_at TYPE TIMESTAMPTZ
    USING generation_completed_at AT TIME ZONE 'UTC',
  ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC',
  ALTER COLUMN updated_at TYPE TIMESTAMPTZ USING updated_at AT TIME ZONE 'UTC',
  ALTER COLUMN created_at SET DEFAULT NOW(),
  ALTER COLUMN updated_at SET DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_ebook_generations_user_created_at
  ON public.ebook_generations (user_id, created_at DESC);

ALTER TABLE public.memory_books
  ADD COLUMN IF NOT EXISTS ebook_generation_id UUID,
  ADD COLUMN IF NOT EXISTS version BIGINT NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE public.memory_books
  ALTER COLUMN published_at TYPE TIMESTAMPTZ
    USING published_at AT TIME ZONE 'UTC',
  ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC',
  ALTER COLUMN updated_at TYPE TIMESTAMPTZ USING updated_at AT TIME ZONE 'UTC',
  ALTER COLUMN created_at SET DEFAULT NOW(),
  ALTER COLUMN updated_at SET DEFAULT NOW();

ALTER TABLE public.memory_books
  DROP CONSTRAINT IF EXISTS memory_books_version_positive,
  DROP CONSTRAINT IF EXISTS memory_books_published_requires_timestamp;

UPDATE public.memory_books
SET published_at = COALESCE(updated_at, created_at, NOW())
WHERE status::TEXT = 'published'
  AND published_at IS NULL;

ALTER TABLE public.memory_books
  ADD CONSTRAINT memory_books_version_positive CHECK (version > 0),
  ADD CONSTRAINT memory_books_published_requires_timestamp
    CHECK ((status::TEXT = 'published') = (published_at IS NOT NULL));

CREATE UNIQUE INDEX IF NOT EXISTS memory_books_ebook_generation_id_uidx
  ON public.memory_books (ebook_generation_id)
  WHERE ebook_generation_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_memory_books_community
  ON public.memory_books (status, published_at DESC, created_at DESC);

-- ---------------------------------------------------------------------------
-- Durable external-event and generation state.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'processing',
  payload JSONB,
  attempt_count INTEGER NOT NULL DEFAULT 1,
  last_error TEXT,
  claimed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT webhook_events_status_allowed
    CHECK (status IN ('processing', 'completed', 'failed')),
  CONSTRAINT webhook_events_attempt_count_positive CHECK (attempt_count > 0)
);

ALTER TABLE public.webhook_events
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'processing',
  ADD COLUMN IF NOT EXISTS payload JSONB,
  ADD COLUMN IF NOT EXISTS attempt_count INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS last_error TEXT,
  ADD COLUMN IF NOT EXISTS claimed_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS processed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

UPDATE public.webhook_events
SET status = COALESCE(NULLIF(BTRIM(status), ''),
                      CASE WHEN processed_at IS NULL THEN 'processing' ELSE 'completed' END),
    attempt_count = COALESCE(attempt_count, 1),
    claimed_at = COALESCE(claimed_at, created_at, NOW()),
    created_at = COALESCE(created_at, NOW()),
    updated_at = COALESCE(updated_at, created_at, NOW());

ALTER TABLE public.webhook_events
  ALTER COLUMN status SET DEFAULT 'processing',
  ALTER COLUMN status SET NOT NULL,
  ALTER COLUMN attempt_count SET DEFAULT 1,
  ALTER COLUMN attempt_count SET NOT NULL,
  ALTER COLUMN claimed_at SET DEFAULT NOW(),
  ALTER COLUMN claimed_at SET NOT NULL,
  ALTER COLUMN created_at SET DEFAULT NOW(),
  ALTER COLUMN created_at SET NOT NULL,
  ALTER COLUMN updated_at SET DEFAULT NOW(),
  ALTER COLUMN updated_at SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS webhook_events_stripe_event_id_uidx
  ON public.webhook_events (stripe_event_id);

CREATE INDEX IF NOT EXISTS webhook_events_status_created_at_idx
  ON public.webhook_events (status, created_at);

CREATE TABLE IF NOT EXISTS public.generation_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idempotency_key TEXT NOT NULL,
  user_id TEXT NOT NULL,
  operation_type TEXT NOT NULL,
  credits_charged NUMERIC(12, 2) NOT NULL DEFAULT 0,
  transaction_id UUID REFERENCES public.credit_transactions(id),
  refund_transaction_id UUID REFERENCES public.credit_transactions(id),
  status TEXT NOT NULL DEFAULT 'pending',
  response_cache JSONB,
  error_code TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '24 hours',
  CONSTRAINT generation_requests_status_allowed
    CHECK (status IN ('pending', 'completed', 'failed')),
  CONSTRAINT generation_requests_credits_nonnegative CHECK (credits_charged >= 0),
  CONSTRAINT generation_requests_user_key_unique UNIQUE (user_id, idempotency_key),
  CONSTRAINT generation_requests_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS generation_requests_expires_at_idx
  ON public.generation_requests (expires_at);

CREATE INDEX IF NOT EXISTS generation_requests_user_status_idx
  ON public.generation_requests (user_id, status);

-- The video function is deployed and writes this tracking record even though
-- the generation backend is still intentionally minimal.
CREATE TABLE IF NOT EXISTS public.videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  template TEXT NOT NULL,
  text_prompt TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'processing',
  video_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT videos_status_allowed
    CHECK (status IN ('processing', 'completed', 'failed'))
);

CREATE INDEX IF NOT EXISTS videos_user_created_at_idx
  ON public.videos (user_id, created_at DESC);

-- TikTok analytics historically existed only in production. Recreate its
-- structural contract on fresh installs and tolerate anonymous share events.
CREATE TABLE IF NOT EXISTS public.tiktok_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT REFERENCES public.profiles(id) ON DELETE CASCADE,
  story_id UUID REFERENCES public.stories(id) ON DELETE CASCADE,
  share_url TEXT,
  share_id TEXT,
  platform TEXT DEFAULT 'tiktok',
  text_snippet TEXT,
  video_url TEXT,
  music_url TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  view_count INTEGER NOT NULL DEFAULT 0,
  like_count INTEGER NOT NULL DEFAULT 0,
  comment_count INTEGER NOT NULL DEFAULT 0,
  share_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.tiktok_shares
  ADD COLUMN IF NOT EXISTS share_url TEXT,
  ADD COLUMN IF NOT EXISTS share_id TEXT,
  ADD COLUMN IF NOT EXISTS platform TEXT DEFAULT 'tiktok',
  ADD COLUMN IF NOT EXISTS text_snippet TEXT,
  ADD COLUMN IF NOT EXISTS video_url TEXT,
  ADD COLUMN IF NOT EXISTS music_url TEXT,
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::JSONB,
  ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS like_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS comment_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS share_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE public.tiktok_shares
  ALTER COLUMN user_id DROP NOT NULL,
  ALTER COLUMN metadata SET DEFAULT '{}'::JSONB,
  ALTER COLUMN created_at SET DEFAULT NOW(),
  ALTER COLUMN updated_at SET DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_tiktok_shares_created_at
  ON public.tiktok_shares (created_at DESC);

-- Download and share activity is recorded through a trusted RPC so browser
-- code never receives write access to analytics rows or aggregate counters.
CREATE TABLE IF NOT EXISTS public.user_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  activity_data JSONB NOT NULL DEFAULT '{}'::JSONB,
  resource_type TEXT NOT NULL,
  resource_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS user_activities_user_created_at_idx
  ON public.user_activities (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS user_activities_type_created_at_idx
  ON public.user_activities (activity_type, created_at DESC);

CREATE INDEX IF NOT EXISTS user_activities_resource_idx
  ON public.user_activities (resource_type, resource_id);

ALTER TABLE public.user_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activities FORCE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public.user_activities
  FROM PUBLIC, anon, authenticated;
GRANT ALL PRIVILEGES ON TABLE public.user_activities TO service_role;

DROP POLICY IF EXISTS service_role_all ON public.user_activities;
CREATE POLICY service_role_all
  ON public.user_activities
  FOR ALL TO service_role
  USING (TRUE)
  WITH CHECK (TRUE);

CREATE OR REPLACE FUNCTION public.record_user_activity(
  p_user_id TEXT,
  p_activity_type TEXT,
  p_resource_type TEXT,
  p_resource_id TEXT,
  p_activity_data JSONB DEFAULT '{}'::JSONB
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  affected_rows INTEGER;
BEGIN
  IF p_user_id IS NULL OR BTRIM(p_user_id) = ''
     OR p_resource_id IS NULL OR BTRIM(p_resource_id) = ''
     OR p_resource_type NOT IN ('story', 'ebook') THEN
    RETURN FALSE;
  END IF;

  IF p_activity_type NOT IN ('download', 'share') THEN
    RETURN FALSE;
  END IF;

  IF p_resource_type = 'ebook' THEN
    IF p_activity_type = 'download' THEN
      UPDATE public.memory_books
         SET download_count = COALESCE(download_count, 0) + 1
       WHERE id::TEXT = p_resource_id
         AND user_id = p_user_id;
    ELSE
      UPDATE public.memory_books
         SET share_count = COALESCE(share_count, 0) + 1
       WHERE id::TEXT = p_resource_id
         AND user_id = p_user_id;
    END IF;

    GET DIAGNOSTICS affected_rows = ROW_COUNT;
  ELSIF p_activity_type = 'share' THEN
    UPDATE public.stories
       SET share_count = COALESCE(share_count, 0) + 1
     WHERE id::TEXT = p_resource_id
       AND user_id = p_user_id;

    GET DIAGNOSTICS affected_rows = ROW_COUNT;
  ELSE
    SELECT COUNT(*)::INTEGER
      INTO affected_rows
      FROM public.stories
     WHERE id::TEXT = p_resource_id
       AND user_id = p_user_id;
  END IF;

  IF affected_rows <> 1 THEN
    RETURN FALSE;
  END IF;

  INSERT INTO public.user_activities (
    user_id,
    activity_type,
    activity_data,
    resource_type,
    resource_id
  )
  VALUES (
    p_user_id,
    p_activity_type,
    COALESCE(p_activity_data, '{}'::JSONB),
    p_resource_type,
    p_resource_id
  );

  RETURN TRUE;
END;
$$;

REVOKE ALL PRIVILEGES ON FUNCTION public.record_user_activity(
  TEXT, TEXT, TEXT, TEXT, JSONB
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_user_activity(
  TEXT, TEXT, TEXT, TEXT, JSONB
) TO service_role;

-- ---------------------------------------------------------------------------
-- One timestamp implementation for every reconciled snake_case table.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.set_updated_at_utc()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_profiles_updated_at ON public.profiles;
DROP TRIGGER IF EXISTS update_credit_transactions_updated_at ON public.credit_transactions;
DROP TRIGGER IF EXISTS update_ebook_generations_updated_at ON public.ebook_generations;
DROP TRIGGER IF EXISTS update_stories_updated_at ON public.stories;
DROP TRIGGER IF EXISTS trigger_memory_books_updated_at ON public.memory_books;

DO $$
DECLARE
  target_table TEXT;
BEGIN
  FOREACH target_table IN ARRAY ARRAY[
    'profiles',
    'user_credits',
    'credit_transactions',
    'stories',
    'ebook_generations',
    'memory_books',
    'webhook_events',
    'generation_requests',
    'videos',
    'tiktok_shares'
  ]
  LOOP
    EXECUTE FORMAT(
      'DROP TRIGGER IF EXISTS set_updated_at_utc ON public.%I',
      target_table
    );
    EXECUTE FORMAT(
      'CREATE TRIGGER set_updated_at_utc BEFORE UPDATE ON public.%I '
      'FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_utc()',
      target_table
    );
  END LOOP;
END
$$;

COMMIT;
