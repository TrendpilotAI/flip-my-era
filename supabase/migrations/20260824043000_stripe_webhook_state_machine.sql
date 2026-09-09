BEGIN;

ALTER TABLE public.webhook_events
  ADD COLUMN IF NOT EXISTS status TEXT,
  ADD COLUMN IF NOT EXISTS attempt_count INTEGER,
  ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_error TEXT,
  ADD COLUMN IF NOT EXISTS payload_sha256 TEXT,
  ADD COLUMN IF NOT EXISTS event_metadata JSONB,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS processed_at TIMESTAMPTZ;

-- Historical rows used processed_at as both the claim and completion marker.
-- Preserve that timestamp as completed for compatibility, while all new claims
-- remain explicitly processing until complete_webhook_event is called.
ALTER TABLE public.webhook_events
  ALTER COLUMN processed_at DROP NOT NULL,
  ALTER COLUMN processed_at DROP DEFAULT;

UPDATE public.webhook_events
   SET status = CASE
         WHEN processed_at IS NOT NULL OR status = 'completed' THEN 'completed'
         WHEN status IN ('processing', 'failed') THEN status
         ELSE 'failed'
       END,
       attempt_count = GREATEST(COALESCE(attempt_count, 0), 1),
       started_at = COALESCE(started_at, created_at, processed_at, NOW()),
       completed_at = CASE
         WHEN processed_at IS NOT NULL OR status = 'completed'
           THEN COALESCE(completed_at, processed_at, created_at, NOW())
         ELSE completed_at
       END,
       last_error = CASE
         WHEN processed_at IS NULL AND status IS NULL
           THEN COALESCE(last_error, 'Legacy event had no completion timestamp')
         ELSE last_error
       END,
       event_metadata = COALESCE(event_metadata, '{}'::JSONB),
       updated_at = COALESCE(updated_at, completed_at, processed_at, created_at, NOW());

ALTER TABLE public.webhook_events
  ALTER COLUMN status SET DEFAULT 'processing',
  ALTER COLUMN status SET NOT NULL,
  ALTER COLUMN attempt_count SET DEFAULT 1,
  ALTER COLUMN attempt_count SET NOT NULL,
  ALTER COLUMN started_at SET DEFAULT NOW(),
  ALTER COLUMN started_at SET NOT NULL,
  ALTER COLUMN event_metadata SET DEFAULT '{}'::JSONB,
  ALTER COLUMN event_metadata SET NOT NULL,
  ALTER COLUMN updated_at SET DEFAULT NOW(),
  ALTER COLUMN updated_at SET NOT NULL;

ALTER TABLE public.webhook_events
  DROP CONSTRAINT IF EXISTS webhook_events_status_check,
  DROP CONSTRAINT IF EXISTS webhook_events_status_allowed,
  DROP CONSTRAINT IF EXISTS webhook_events_attempt_count_check,
  DROP CONSTRAINT IF EXISTS webhook_events_attempt_count_positive,
  DROP CONSTRAINT IF EXISTS webhook_events_payload_sha256_check,
  DROP CONSTRAINT IF EXISTS webhook_events_completed_at_check;

ALTER TABLE public.webhook_events
  ADD CONSTRAINT webhook_events_status_check
    CHECK (status IN ('processing', 'completed', 'failed')),
  ADD CONSTRAINT webhook_events_attempt_count_check
    CHECK (attempt_count > 0),
  ADD CONSTRAINT webhook_events_payload_sha256_check
    CHECK (payload_sha256 IS NULL OR payload_sha256 ~ '^[0-9a-f]{64}$'),
  ADD CONSTRAINT webhook_events_completed_at_check
    CHECK (status <> 'completed' OR completed_at IS NOT NULL);

CREATE UNIQUE INDEX IF NOT EXISTS webhook_events_stripe_event_id_key
  ON public.webhook_events (stripe_event_id);

CREATE INDEX IF NOT EXISTS webhook_events_status_updated_at_idx
  ON public.webhook_events (status, updated_at);

CREATE INDEX IF NOT EXISTS webhook_events_processing_lease_idx
  ON public.webhook_events (started_at)
  WHERE status = 'processing';

ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_events FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role manages webhook events" ON public.webhook_events;
CREATE POLICY "Service role manages webhook events"
  ON public.webhook_events
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

REVOKE ALL ON TABLE public.webhook_events FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.webhook_events TO service_role;

CREATE OR REPLACE FUNCTION public.claim_webhook_event(
  p_stripe_event_id TEXT,
  p_event_type TEXT,
  p_payload_sha256 TEXT DEFAULT NULL,
  p_event_metadata JSONB DEFAULT '{}'::JSONB
)
RETURNS TABLE (
  claimed BOOLEAN,
  event_status TEXT,
  attempt_count INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_event public.webhook_events%ROWTYPE;
BEGIN
  IF p_stripe_event_id IS NULL
     OR pg_catalog.btrim(p_stripe_event_id) = ''
     OR pg_catalog.length(p_stripe_event_id) > 255 THEN
    RAISE EXCEPTION USING
      ERRCODE = '22023',
      MESSAGE = 'p_stripe_event_id must contain 1 to 255 characters';
  END IF;

  IF p_event_type IS NULL
     OR pg_catalog.btrim(p_event_type) = ''
     OR pg_catalog.length(p_event_type) > 255 THEN
    RAISE EXCEPTION USING
      ERRCODE = '22023',
      MESSAGE = 'p_event_type must contain 1 to 255 characters';
  END IF;

  IF p_payload_sha256 IS NOT NULL
     AND p_payload_sha256 !~ '^[0-9a-f]{64}$' THEN
    RAISE EXCEPTION USING
      ERRCODE = '22023',
      MESSAGE = 'p_payload_sha256 must be a lowercase SHA-256 hex digest';
  END IF;

  PERFORM pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('stripe-webhook:' || p_stripe_event_id, 0)
  );

  SELECT event_row.*
    INTO v_event
    FROM public.webhook_events AS event_row
   WHERE event_row.stripe_event_id = p_stripe_event_id
   FOR UPDATE;

  IF NOT FOUND THEN
    INSERT INTO public.webhook_events (
      stripe_event_id,
      event_type,
      status,
      attempt_count,
      started_at,
      completed_at,
      processed_at,
      last_error,
      payload_sha256,
      event_metadata,
      updated_at
    )
    VALUES (
      p_stripe_event_id,
      p_event_type,
      'processing',
      1,
      pg_catalog.clock_timestamp(),
      NULL,
      NULL,
      NULL,
      p_payload_sha256,
      COALESCE(p_event_metadata, '{}'::JSONB),
      pg_catalog.clock_timestamp()
    )
    RETURNING * INTO v_event;

    RETURN QUERY SELECT TRUE, v_event.status, v_event.attempt_count;
    RETURN;
  END IF;

  IF v_event.event_type IS DISTINCT FROM p_event_type THEN
    RAISE EXCEPTION USING
      ERRCODE = '22023',
      MESSAGE = 'Stripe event ID was already used for a different event type';
  END IF;

  IF v_event.payload_sha256 IS NOT NULL
     AND p_payload_sha256 IS NOT NULL
     AND v_event.payload_sha256 IS DISTINCT FROM p_payload_sha256 THEN
    RAISE EXCEPTION USING
      ERRCODE = '22023',
      MESSAGE = 'Stripe event ID was already used for a different payload';
  END IF;

  -- A processing claim is a 15-minute lease. This keeps concurrent deliveries
  -- out while allowing Stripe to recover an event after a worker crashes.
  IF v_event.status = 'failed'
     OR (
       v_event.status = 'processing'
       AND v_event.started_at <= pg_catalog.clock_timestamp() - INTERVAL '15 minutes'
     ) THEN
    UPDATE public.webhook_events AS event_row
       SET status = 'processing',
           attempt_count = event_row.attempt_count + 1,
           started_at = pg_catalog.clock_timestamp(),
           claimed_at = pg_catalog.clock_timestamp(),
           completed_at = NULL,
           processed_at = NULL,
           last_error = NULL,
           payload_sha256 = COALESCE(event_row.payload_sha256, p_payload_sha256),
           event_metadata = event_row.event_metadata || COALESCE(p_event_metadata, '{}'::JSONB),
           updated_at = pg_catalog.clock_timestamp()
     WHERE event_row.id = v_event.id
     RETURNING * INTO v_event;

    RETURN QUERY SELECT TRUE, v_event.status, v_event.attempt_count;
    RETURN;
  END IF;

  RETURN QUERY SELECT FALSE, v_event.status, v_event.attempt_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.complete_webhook_event(
  p_stripe_event_id TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_status TEXT;
BEGIN
  PERFORM pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('stripe-webhook:' || p_stripe_event_id, 0)
  );

  SELECT event_row.status
    INTO v_status
    FROM public.webhook_events AS event_row
   WHERE event_row.stripe_event_id = p_stripe_event_id
   FOR UPDATE;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  IF v_status = 'completed' THEN
    RETURN TRUE;
  END IF;

  IF v_status <> 'processing' THEN
    RETURN FALSE;
  END IF;

  UPDATE public.webhook_events AS event_row
     SET status = 'completed',
         completed_at = pg_catalog.clock_timestamp(),
         processed_at = pg_catalog.clock_timestamp(),
         last_error = NULL,
         updated_at = pg_catalog.clock_timestamp()
   WHERE event_row.stripe_event_id = p_stripe_event_id;

  RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION public.fail_webhook_event(
  p_stripe_event_id TEXT,
  p_last_error TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_status TEXT;
BEGIN
  PERFORM pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('stripe-webhook:' || p_stripe_event_id, 0)
  );

  SELECT event_row.status
    INTO v_status
    FROM public.webhook_events AS event_row
   WHERE event_row.stripe_event_id = p_stripe_event_id
   FOR UPDATE;

  IF NOT FOUND OR v_status <> 'processing' THEN
    RETURN FALSE;
  END IF;

  UPDATE public.webhook_events AS event_row
     SET status = 'failed',
         completed_at = NULL,
         processed_at = NULL,
         last_error = pg_catalog.left(
           COALESCE(NULLIF(p_last_error, ''), 'Unknown webhook processing error'),
           4000
         ),
         updated_at = pg_catalog.clock_timestamp()
   WHERE event_row.stripe_event_id = p_stripe_event_id;

  RETURN TRUE;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_webhook_event(TEXT, TEXT, TEXT, JSONB)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_webhook_event(TEXT, TEXT, TEXT, JSONB)
  TO service_role;

REVOKE ALL ON FUNCTION public.complete_webhook_event(TEXT)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.complete_webhook_event(TEXT)
  TO service_role;

REVOKE ALL ON FUNCTION public.fail_webhook_event(TEXT, TEXT)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fail_webhook_event(TEXT, TEXT)
  TO service_role;

COMMENT ON COLUMN public.webhook_events.processed_at IS
  'Deprecated compatibility timestamp. It is set only when an event completes.';
COMMENT ON TABLE public.webhook_events IS
  'Retry-safe Stripe webhook processing state. Failed events and processing leases older than 15 minutes may be reclaimed; completed events are immutable.';

COMMIT;
