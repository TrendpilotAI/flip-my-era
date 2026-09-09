BEGIN;

SET LOCAL TIME ZONE 'UTC';

-- Fresh installs historically ran a destructive 2025 bootstrap, while the
-- production ledger skipped it and later repaired individual tables. Normalize
-- the surviving compatibility shapes so both paths expose one schema contract.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'credit_transactions'
      AND column_name = 'type'
  ) THEN
    IF EXISTS (
      SELECT 1
      FROM public.credit_transactions
      WHERE type IS NOT NULL
        AND transaction_type IS DISTINCT FROM type
    ) THEN
      RAISE EXCEPTION
        'credit_transactions.type conflicts with transaction_type; reconcile the legacy values before migration';
    END IF;

    ALTER TABLE public.credit_transactions DROP COLUMN type;
  END IF;
END
$$;

ALTER TABLE public.stories
  ADD COLUMN IF NOT EXISTS character_description TEXT,
  ADD COLUMN IF NOT EXISTS plot_description TEXT;

UPDATE public.stories
SET name = COALESCE(
      NULLIF(BTRIM(name), ''),
      NULLIF(BTRIM(transformed_name), ''),
      NULLIF(BTRIM(title), ''),
      'Untitled Story'
    ),
    created_at = COALESCE(created_at, NOW());

ALTER TABLE public.stories
  ALTER COLUMN name SET NOT NULL,
  ALTER COLUMN created_at SET DEFAULT NOW(),
  ALTER COLUMN created_at SET NOT NULL,
  ALTER COLUMN generation_completed_at DROP DEFAULT;

DROP VIEW IF EXISTS public.community_books;

ALTER TABLE public.memory_books
  DROP CONSTRAINT IF EXISTS memory_books_status_allowed,
  DROP CONSTRAINT IF EXISTS memory_books_published_requires_timestamp;

ALTER TABLE public.memory_books
  ALTER COLUMN status DROP DEFAULT,
  ALTER COLUMN title TYPE TEXT USING title::TEXT,
  ALTER COLUMN subtitle TYPE TEXT USING subtitle::TEXT,
  ALTER COLUMN author_name TYPE TEXT USING author_name::TEXT,
  ALTER COLUMN image_style TYPE TEXT USING image_style::TEXT,
  ALTER COLUMN mood TYPE TEXT USING mood::TEXT,
  ALTER COLUMN status TYPE TEXT USING status::TEXT,
  ALTER COLUMN view_count TYPE BIGINT USING view_count::BIGINT,
  ALTER COLUMN download_count TYPE BIGINT USING download_count::BIGINT,
  ALTER COLUMN share_count TYPE BIGINT USING share_count::BIGINT;

ALTER TABLE public.memory_books
  ALTER COLUMN table_of_contents SET DEFAULT '[]'::JSONB,
  ALTER COLUMN generation_settings SET DEFAULT '{}'::JSONB,
  ALTER COLUMN style_preferences SET DEFAULT '{}'::JSONB,
  ALTER COLUMN image_style DROP DEFAULT,
  ALTER COLUMN mood DROP DEFAULT,
  ALTER COLUMN status SET DEFAULT 'draft',
  ALTER COLUMN status SET NOT NULL,
  ALTER COLUMN view_count SET DEFAULT 0,
  ALTER COLUMN download_count SET DEFAULT 0,
  ALTER COLUMN share_count SET DEFAULT 0,
  ALTER COLUMN rating_average SET DEFAULT 0;

ALTER TABLE public.memory_books
  ADD CONSTRAINT memory_books_status_allowed
    CHECK (status IN (
      'draft', 'generating', 'processing', 'completed', 'published', 'archived'
    )),
  ADD CONSTRAINT memory_books_published_requires_timestamp
    CHECK ((status = 'published') = (published_at IS NOT NULL));

DO $$
DECLARE
  constraint_name TEXT;
BEGIN
  FOREACH constraint_name IN ARRAY ARRAY[
    'memory_books_user_id_fkey',
    'memory_books_ebook_generation_id_fkey'
  ]
  LOOP
    IF EXISTS (
      SELECT 1
      FROM pg_constraint
      WHERE conrelid = 'public.memory_books'::REGCLASS
        AND conname = constraint_name
        AND NOT convalidated
    ) THEN
      EXECUTE FORMAT(
        'ALTER TABLE public.memory_books VALIDATE CONSTRAINT %I',
        constraint_name
      );
    END IF;
  END LOOP;
END
$$;

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
WHERE status = 'published';

REVOKE ALL PRIVILEGES ON TABLE public.community_books FROM PUBLIC;
GRANT SELECT ON TABLE public.community_books TO anon, authenticated, service_role;

COMMENT ON VIEW public.community_books IS
  'Fixed public projection of published memory books; excludes ownership, content, settings, and private file URLs.';

UPDATE public.tiktok_shares
SET metadata = COALESCE(metadata, '{}'::JSONB),
    view_count = COALESCE(view_count, 0),
    like_count = COALESCE(like_count, 0),
    comment_count = COALESCE(comment_count, 0),
    share_count = COALESCE(share_count, 0),
    created_at = COALESCE(created_at, NOW()),
    updated_at = COALESCE(updated_at, created_at, NOW());

ALTER TABLE public.tiktok_shares
  ALTER COLUMN metadata SET DEFAULT '{}'::JSONB,
  ALTER COLUMN metadata SET NOT NULL,
  ALTER COLUMN view_count SET DEFAULT 0,
  ALTER COLUMN view_count SET NOT NULL,
  ALTER COLUMN like_count SET DEFAULT 0,
  ALTER COLUMN like_count SET NOT NULL,
  ALTER COLUMN comment_count SET DEFAULT 0,
  ALTER COLUMN comment_count SET NOT NULL,
  ALTER COLUMN share_count SET DEFAULT 0,
  ALTER COLUMN share_count SET NOT NULL,
  ALTER COLUMN created_at SET DEFAULT NOW(),
  ALTER COLUMN created_at SET NOT NULL,
  ALTER COLUMN updated_at SET DEFAULT NOW(),
  ALTER COLUMN updated_at SET NOT NULL;

-- Preserve the useful access paths accumulated by each historical branch so a
-- fresh install and an upgraded production database also converge on indexes.
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at
  ON public.credit_transactions (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_type
  ON public.credit_transactions (transaction_type);
CREATE INDEX IF NOT EXISTS idx_ebook_generations_created_at
  ON public.ebook_generations (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ebook_generations_status
  ON public.ebook_generations (status);
CREATE INDEX IF NOT EXISTS idx_ebook_generations_user_id
  ON public.ebook_generations (user_id);
CREATE INDEX IF NOT EXISTS idx_stories_is_public
  ON public.stories (is_public);
CREATE INDEX IF NOT EXISTS idx_stories_status
  ON public.stories (status);
CREATE INDEX IF NOT EXISTS idx_tiktok_shares_story_id
  ON public.tiktok_shares (story_id);
CREATE INDEX IF NOT EXISTS idx_tiktok_shares_user_id
  ON public.tiktok_shares (user_id);

COMMIT;
