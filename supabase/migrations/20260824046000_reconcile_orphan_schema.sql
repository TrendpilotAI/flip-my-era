-- Reconcile objects left behind by historical migrations whose ledger entries
-- did not describe the production schema. Keep only the retry queue that has a
-- live Edge Function caller; retire empty, unreferenced tables and RPCs.

DO $$
DECLARE
  candidate_table TEXT;
  contains_rows BOOLEAN;
BEGIN
  FOREACH candidate_table IN ARRAY ARRAY[
    'chapter_images',
    'chapters',
    'books',
    'payments',
    'published_stories',
    'credit_usage_logs',
    'samcart_webhook_logs'
  ]
  LOOP
    IF pg_catalog.to_regclass(pg_catalog.format('public.%I', candidate_table)) IS NOT NULL THEN
      EXECUTE pg_catalog.format(
        'SELECT EXISTS (SELECT 1 FROM public.%I LIMIT 1)',
        candidate_table
      ) INTO contains_rows;

      IF contains_rows THEN
        RAISE EXCEPTION
          'refusing to retire non-empty historical table public.%',
          candidate_table;
      END IF;
    END IF;
  END LOOP;
END
$$;

DROP TABLE IF EXISTS
  public.chapter_images,
  public.chapters,
  public.books,
  public.payments,
  public.published_stories;

DROP FUNCTION IF EXISTS public.get_credit_usage_history(TEXT, INTEGER);
DROP FUNCTION IF EXISTS public.get_user_credit_balance(TEXT);
DROP FUNCTION IF EXISTS public.get_user_usage_stats(TEXT, INTEGER);
DROP FUNCTION IF EXISTS public.log_credit_usage(TEXT, CHARACTER VARYING, INTEGER, UUID, CHARACTER VARYING, JSONB);

DROP TABLE IF EXISTS public.credit_usage_logs;
DROP TABLE IF EXISTS public.samcart_webhook_logs;

CREATE TABLE IF NOT EXISTS public.webhook_retry_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_type VARCHAR(100) NOT NULL,
  webhook_id UUID NOT NULL,
  payload JSONB NOT NULL,
  retry_count INTEGER NOT NULL DEFAULT 0,
  max_retries INTEGER NOT NULL DEFAULT 5,
  scheduled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed BOOLEAN NOT NULL DEFAULT FALSE,
  processed_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

UPDATE public.webhook_retry_queue
SET retry_count = COALESCE(retry_count, 0),
    max_retries = COALESCE(max_retries, 5),
    scheduled_at = COALESCE(scheduled_at, NOW()),
    processed = COALESCE(processed, FALSE),
    created_at = COALESCE(created_at, NOW()),
    updated_at = COALESCE(updated_at, NOW());

ALTER TABLE public.webhook_retry_queue
  ALTER COLUMN retry_count SET DEFAULT 0,
  ALTER COLUMN retry_count SET NOT NULL,
  ALTER COLUMN max_retries SET DEFAULT 5,
  ALTER COLUMN max_retries SET NOT NULL,
  ALTER COLUMN scheduled_at SET DEFAULT NOW(),
  ALTER COLUMN scheduled_at SET NOT NULL,
  ALTER COLUMN processed SET DEFAULT FALSE,
  ALTER COLUMN processed SET NOT NULL,
  ALTER COLUMN created_at SET DEFAULT NOW(),
  ALTER COLUMN created_at SET NOT NULL,
  ALTER COLUMN updated_at SET DEFAULT NOW(),
  ALTER COLUMN updated_at SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.webhook_retry_queue'::REGCLASS
      AND conname = 'webhook_retry_queue_retry_count_nonnegative'
  ) THEN
    ALTER TABLE public.webhook_retry_queue
      ADD CONSTRAINT webhook_retry_queue_retry_count_nonnegative
      CHECK (retry_count >= 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.webhook_retry_queue'::REGCLASS
      AND conname = 'webhook_retry_queue_max_retries_nonnegative'
  ) THEN
    ALTER TABLE public.webhook_retry_queue
      ADD CONSTRAINT webhook_retry_queue_max_retries_nonnegative
      CHECK (max_retries >= 0);
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_webhook_retry_queue_scheduled_at
  ON public.webhook_retry_queue (scheduled_at)
  WHERE processed = FALSE;
CREATE INDEX IF NOT EXISTS idx_webhook_retry_queue_webhook_type
  ON public.webhook_retry_queue (webhook_type);
CREATE INDEX IF NOT EXISTS idx_webhook_retry_queue_processed
  ON public.webhook_retry_queue (processed);

DROP TRIGGER IF EXISTS update_webhook_retry_queue_updated_at
  ON public.webhook_retry_queue;
DROP TRIGGER IF EXISTS set_webhook_retry_queue_updated_at_utc
  ON public.webhook_retry_queue;

DROP FUNCTION IF EXISTS public.enqueue_webhook_retry(CHARACTER VARYING, UUID, JSONB, INTEGER);
DROP FUNCTION IF EXISTS public.get_pending_webhooks(INTEGER);
DROP FUNCTION IF EXISTS public.mark_webhook_processed(UUID, BOOLEAN, TEXT);
DROP FUNCTION IF EXISTS public.update_updated_at_column();

CREATE TRIGGER set_webhook_retry_queue_updated_at_utc
BEFORE UPDATE ON public.webhook_retry_queue
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_utc();

ALTER TABLE public.webhook_retry_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_retry_queue FORCE ROW LEVEL SECURITY;

DO $$
DECLARE
  existing_policy RECORD;
BEGIN
  FOR existing_policy IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'webhook_retry_queue'
  LOOP
    EXECUTE FORMAT(
      'DROP POLICY IF EXISTS %I ON public.webhook_retry_queue',
      existing_policy.policyname
    );
  END LOOP;
END
$$;

CREATE POLICY service_role_all ON public.webhook_retry_queue
  FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);

REVOKE ALL ON TABLE public.webhook_retry_queue FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.webhook_retry_queue TO service_role;

COMMENT ON TABLE public.webhook_retry_queue IS
  'Service-only retry queue used by the webhook-retry-processor Edge Function.';
