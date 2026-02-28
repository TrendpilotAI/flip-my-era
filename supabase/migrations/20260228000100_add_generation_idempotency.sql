-- Generation requests idempotency table
-- Prevents double-charging from double-clicks or network retries.
-- The idempotency_key is generated client-side (UUID v4) and scoped to a user+operation.

CREATE TABLE IF NOT EXISTS public.generation_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idempotency_key TEXT NOT NULL,
  user_id TEXT NOT NULL,
  operation_type TEXT NOT NULL,          -- 'story_generation' | 'storyline_generation'
  credits_charged NUMERIC NOT NULL DEFAULT 0,
  transaction_id UUID REFERENCES public.credit_transactions(id),
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'completed' | 'failed'
  response_cache JSONB,                  -- cached response for idempotent replay
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '24 hours'
);

-- Unique constraint: one request per idempotency key per user
CREATE UNIQUE INDEX IF NOT EXISTS generation_requests_idempotency_key_user_id_idx
  ON public.generation_requests (idempotency_key, user_id);

-- Index for cleanup queries
CREATE INDEX IF NOT EXISTS generation_requests_expires_at_idx
  ON public.generation_requests (expires_at);

-- RLS: users can only see their own generation requests
ALTER TABLE public.generation_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own generation requests"
  ON public.generation_requests FOR SELECT
  USING (user_id = auth.uid()::TEXT);

-- Service role bypasses RLS (used by Edge Functions)
-- No INSERT/UPDATE policies needed since Edge Functions use service role key

-- Auto-cleanup: delete expired records older than 25 hours
-- (Stripe webhook idempotency window is 24 hours)
CREATE OR REPLACE FUNCTION public.cleanup_expired_generation_requests()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.generation_requests
  WHERE expires_at < NOW();
END;
$$;

COMMENT ON TABLE public.generation_requests IS
  'Idempotency log for story/storyline generation. Prevents double-charging on retry/double-click.';
