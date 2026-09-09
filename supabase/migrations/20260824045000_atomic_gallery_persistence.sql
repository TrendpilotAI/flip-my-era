BEGIN;

SET LOCAL TIME ZONE 'UTC';

-- A generated ebook and its private library record are one unit of work. Keep
-- the browser-facing idempotency contract on the generation row so retries can
-- be compared and replayed without issuing another debit or partial insert.
ALTER TABLE public.ebook_generations
  ADD COLUMN IF NOT EXISTS persistence_idempotency_key TEXT,
  ADD COLUMN IF NOT EXISTS persistence_payload_hash TEXT;

UPDATE public.ebook_generations
SET transaction_id = NULL
WHERE transaction_id IS NOT NULL
  AND BTRIM(transaction_id) = '';

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.ebook_generations
    WHERE transaction_id IS NOT NULL
    GROUP BY transaction_id
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION
      'ebook_generations contains a debit reused by more than one generation';
  END IF;
END
$$;

ALTER TABLE public.ebook_generations
  DROP CONSTRAINT IF EXISTS ebook_generations_persistence_key_length,
  DROP CONSTRAINT IF EXISTS ebook_generations_persistence_hash_format;

ALTER TABLE public.ebook_generations
  ADD CONSTRAINT ebook_generations_persistence_key_length
    CHECK (
      persistence_idempotency_key IS NULL
      OR LENGTH(BTRIM(persistence_idempotency_key)) BETWEEN 1 AND 200
    ),
  ADD CONSTRAINT ebook_generations_persistence_hash_format
    CHECK (
      persistence_payload_hash IS NULL
      OR persistence_payload_hash ~ '^[0-9a-f]{64}$'
    );

CREATE UNIQUE INDEX IF NOT EXISTS ebook_generations_persistence_key_uidx
  ON public.ebook_generations (user_id, persistence_idempotency_key)
  WHERE persistence_idempotency_key IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS ebook_generations_transaction_id_uidx
  ON public.ebook_generations (transaction_id)
  WHERE transaction_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.persist_betterauth_generated_book(
  p_user_id TEXT,
  p_transaction_id UUID,
  p_idempotency_key TEXT,
  p_generation JSONB,
  p_book JSONB
)
RETURNS TABLE (
  generation JSONB,
  book JSONB,
  created BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_request_transaction_id UUID;
  v_transaction_id UUID;
  v_transaction_owner TEXT;
  v_transaction_amount NUMERIC(12, 2);
  v_payload_hash TEXT;
  v_generation_title TEXT;
  v_generation_content TEXT;
  v_book_title TEXT;
  v_story_id TEXT;
  v_original_story_id TEXT;
  v_credits_used NUMERIC(12, 2);
  v_paid_with_credits BOOLEAN;
  v_chapter_count BIGINT;
  v_word_count BIGINT;
  v_generation public.ebook_generations%ROWTYPE;
  v_book public.memory_books%ROWTYPE;
  v_created BOOLEAN := FALSE;
BEGIN
  IF p_user_id IS NULL OR pg_catalog.btrim(p_user_id) = '' THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'p_user_id is required';
  END IF;

  IF p_idempotency_key IS NULL
     OR pg_catalog.btrim(p_idempotency_key) = ''
     OR pg_catalog.length(p_idempotency_key) > 200 THEN
    RAISE EXCEPTION USING
      ERRCODE = '22023',
      MESSAGE = 'p_idempotency_key must contain 1 to 200 characters';
  END IF;

  IF pg_catalog.jsonb_typeof(p_generation) IS DISTINCT FROM 'object'
     OR pg_catalog.jsonb_typeof(p_book) IS DISTINCT FROM 'object' THEN
    RAISE EXCEPTION USING
      ERRCODE = '22023',
      MESSAGE = 'generation and book must be JSON objects';
  END IF;

  v_generation_title := NULLIF(pg_catalog.btrim(p_generation ->> 'title'), '');
  v_generation_content := p_generation ->> 'content';
  v_book_title := COALESCE(
    NULLIF(pg_catalog.btrim(p_book ->> 'title'), ''),
    v_generation_title
  );

  IF v_generation_title IS NULL OR pg_catalog.length(v_generation_title) > 255 THEN
    RAISE EXCEPTION USING
      ERRCODE = '22023',
      MESSAGE = 'generation.title must contain 1 to 255 characters';
  END IF;

  IF v_generation_content IS NULL THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'generation.content is required';
  END IF;

  IF v_book_title IS NULL OR pg_catalog.length(v_book_title) > 255 THEN
    RAISE EXCEPTION USING
      ERRCODE = '22023',
      MESSAGE = 'book.title must contain 1 to 255 characters';
  END IF;

  IF pg_catalog.jsonb_typeof(p_book -> 'chapters') IS DISTINCT FROM 'array' THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'book.chapters must be an array';
  END IF;

  v_story_id := NULLIF(p_generation ->> 'story_id', '');
  v_original_story_id := COALESCE(
    NULLIF(p_book ->> 'original_story_id', ''),
    v_story_id
  );
  v_credits_used := COALESCE(NULLIF(p_generation ->> 'credits_used', '')::NUMERIC(12, 2), 0);
  v_paid_with_credits := COALESCE((p_generation ->> 'paid_with_credits')::BOOLEAN, FALSE);
  v_chapter_count := NULLIF(p_generation ->> 'chapter_count', '')::BIGINT;
  v_word_count := NULLIF(p_generation ->> 'word_count', '')::BIGINT;

  IF v_credits_used < 0
     OR (v_chapter_count IS NOT NULL AND v_chapter_count < 0)
     OR (v_word_count IS NOT NULL AND v_word_count < 0) THEN
    RAISE EXCEPTION USING
      ERRCODE = '22023',
      MESSAGE = 'credit and content counters cannot be negative';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_user_id) THEN
    RAISE EXCEPTION USING ERRCODE = '23503', MESSAGE = 'profile does not exist';
  END IF;

  IF v_story_id IS NOT NULL AND NOT EXISTS (
    SELECT 1
    FROM public.stories
    WHERE id::TEXT = v_story_id
      AND user_id = p_user_id
  ) THEN
    RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'story does not belong to caller';
  END IF;

  IF v_original_story_id IS NOT NULL AND NOT EXISTS (
    SELECT 1
    FROM public.stories
    WHERE id::TEXT = v_original_story_id
      AND user_id = p_user_id
  ) THEN
    RAISE EXCEPTION USING
      ERRCODE = '42501',
      MESSAGE = 'original story does not belong to caller';
  END IF;

  SELECT request.transaction_id
    INTO v_request_transaction_id
    FROM public.generation_requests AS request
   WHERE request.user_id = p_user_id
     AND request.idempotency_key = p_idempotency_key
     AND request.status = 'completed';

  IF p_transaction_id IS NOT NULL
     AND v_request_transaction_id IS NOT NULL
     AND p_transaction_id IS DISTINCT FROM v_request_transaction_id THEN
    RAISE EXCEPTION USING
      ERRCODE = '23505',
      MESSAGE = 'idempotency key is linked to a different debit';
  END IF;

  v_transaction_id := COALESCE(p_transaction_id, v_request_transaction_id);

  IF v_transaction_id IS NOT NULL THEN
    SELECT credit_row.user_id, credit_row.amount
      INTO v_transaction_owner, v_transaction_amount
      FROM public.credit_transactions AS credit_row
     WHERE credit_row.id = v_transaction_id;

    IF NOT FOUND OR v_transaction_owner IS DISTINCT FROM p_user_id THEN
      RAISE EXCEPTION USING
        ERRCODE = '42501',
        MESSAGE = 'credit transaction does not belong to caller';
    END IF;

    IF v_transaction_amount >= 0 THEN
      RAISE EXCEPTION USING
        ERRCODE = '22023',
        MESSAGE = 'credit transaction must be a debit';
    END IF;
  END IF;

  IF v_paid_with_credits AND v_credits_used > 0 THEN
    IF v_transaction_id IS NULL THEN
      RAISE EXCEPTION USING
        ERRCODE = '22023',
        MESSAGE = 'a paid generation requires a debit transaction';
    END IF;

    IF pg_catalog.abs(v_transaction_amount) IS DISTINCT FROM v_credits_used THEN
      RAISE EXCEPTION USING
        ERRCODE = '22023',
        MESSAGE = 'generation credit cost does not match the debit';
    END IF;
  END IF;

  v_payload_hash := pg_catalog.encode(
    extensions.digest(
      pg_catalog.jsonb_build_object(
        'generation', p_generation - ARRAY['id', 'user_id', 'userId', 'owner_id', 'ownerId'],
        'book', p_book - ARRAY['id', 'user_id', 'userId', 'owner_id', 'ownerId']
      )::TEXT,
      'sha256'
    ),
    'hex'
  );

  PERFORM pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      'gallery:' || p_user_id || ':' || p_idempotency_key,
      0
    )
  );

  SELECT generation_row.*
    INTO v_generation
    FROM public.ebook_generations AS generation_row
   WHERE generation_row.user_id = p_user_id
     AND generation_row.persistence_idempotency_key = p_idempotency_key
   FOR UPDATE;

  IF FOUND THEN
    IF v_generation.persistence_payload_hash IS DISTINCT FROM v_payload_hash
       OR v_generation.transaction_id IS DISTINCT FROM v_transaction_id::TEXT THEN
      RAISE EXCEPTION USING
        ERRCODE = '23505',
        MESSAGE = 'idempotency key was already used for different gallery content';
    END IF;
  ELSE
    IF v_transaction_id IS NOT NULL AND EXISTS (
      SELECT 1
      FROM public.ebook_generations
      WHERE transaction_id = v_transaction_id::TEXT
    ) THEN
      RAISE EXCEPTION USING
        ERRCODE = '23505',
        MESSAGE = 'credit transaction was already consumed by another generation';
    END IF;

    INSERT INTO public.ebook_generations (
      user_id,
      story_id,
      title,
      content,
      status,
      credits_used,
      paid_with_credits,
      transaction_id,
      story_type,
      chapter_count,
      word_count,
      generation_completed_at,
      persistence_idempotency_key,
      persistence_payload_hash
    )
    VALUES (
      p_user_id,
      v_story_id,
      v_generation_title,
      v_generation_content,
      'completed',
      v_credits_used,
      v_paid_with_credits,
      v_transaction_id::TEXT,
      NULLIF(p_generation ->> 'story_type', ''),
      v_chapter_count,
      v_word_count,
      NOW(),
      p_idempotency_key,
      v_payload_hash
    )
    RETURNING * INTO v_generation;

    v_created := TRUE;
  END IF;

  SELECT book_row.*
    INTO v_book
    FROM public.memory_books AS book_row
   WHERE book_row.ebook_generation_id = v_generation.id
   FOR UPDATE;

  IF FOUND THEN
    IF v_book.user_id IS DISTINCT FROM p_user_id THEN
      RAISE EXCEPTION USING
        ERRCODE = '23505',
        MESSAGE = 'generation is already linked to another owner';
    END IF;
  ELSE
    INSERT INTO public.memory_books (
      user_id,
      original_story_id,
      ebook_generation_id,
      title,
      description,
      subtitle,
      author_name,
      chapters,
      table_of_contents,
      cover_image_url,
      generation_settings,
      style_preferences,
      chapter_count,
      word_count,
      status,
      generation_completed_at,
      published_at
    )
    VALUES (
      p_user_id,
      v_original_story_id,
      v_generation.id,
      v_book_title,
      NULLIF(p_book ->> 'description', ''),
      NULLIF(p_book ->> 'subtitle', ''),
      NULLIF(p_book ->> 'author_name', ''),
      p_book -> 'chapters',
      COALESCE(p_book -> 'table_of_contents', '[]'::JSONB),
      NULLIF(p_book ->> 'cover_image_url', ''),
      COALESCE(p_book -> 'generation_settings', '{}'::JSONB),
      COALESCE(p_book -> 'style_preferences', '{}'::JSONB),
      COALESCE(NULLIF(p_book ->> 'chapter_count', '')::INTEGER, v_chapter_count::INTEGER),
      COALESCE(NULLIF(p_book ->> 'word_count', '')::INTEGER, v_word_count::INTEGER),
      'completed',
      NOW(),
      NULL
    )
    RETURNING * INTO v_book;
  END IF;

  RETURN QUERY
  SELECT pg_catalog.to_jsonb(v_generation), pg_catalog.to_jsonb(v_book), v_created;
END;
$$;

REVOKE ALL PRIVILEGES ON FUNCTION public.persist_betterauth_generated_book(
  TEXT, UUID, TEXT, JSONB, JSONB
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.persist_betterauth_generated_book(
  TEXT, UUID, TEXT, JSONB, JSONB
) TO service_role;

COMMENT ON FUNCTION public.persist_betterauth_generated_book(
  TEXT, UUID, TEXT, JSONB, JSONB
) IS
  'Atomically persists one caller-owned ebook generation and private memory book with replay-safe debit linkage.';

COMMIT;
