-- Repair/deploy memory_books for Community Gallery
-- Creates the table when earlier deployments skipped it and refreshes RLS so
-- published books are publicly readable while private books remain owner-only.

BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'book_status'
      AND n.nspname = 'public'
  ) THEN
    CREATE TYPE public.book_status AS ENUM (
      'draft',
      'generating',
      'processing',
      'completed',
      'published',
      'archived'
    );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.memory_books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  original_story_id TEXT,
  ebook_generation_id UUID,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  subtitle VARCHAR(255),
  author_name VARCHAR(255),
  chapters JSONB NOT NULL DEFAULT '[]'::jsonb,
  table_of_contents JSONB,
  cover_image_url TEXT,
  back_cover_text TEXT,
  generation_settings JSONB,
  style_preferences JSONB,
  image_style VARCHAR(100) DEFAULT 'children',
  mood VARCHAR(100) DEFAULT 'happy',
  target_age_group VARCHAR(50) DEFAULT 'children',
  page_count INTEGER,
  chapter_count INTEGER,
  word_count INTEGER,
  image_count INTEGER,
  status public.book_status NOT NULL DEFAULT 'draft'::public.book_status,
  generation_started_at TIMESTAMP WITH TIME ZONE,
  generation_completed_at TIMESTAMP WITH TIME ZONE,
  published_at TIMESTAMP WITH TIME ZONE,
  pdf_url TEXT,
  epub_url TEXT,
  mobi_url TEXT,
  images JSONB DEFAULT '[]'::jsonb,
  view_count INTEGER DEFAULT 0,
  download_count INTEGER DEFAULT 0,
  share_count INTEGER DEFAULT 0,
  rating_average DECIMAL(3,2) DEFAULT 0.00,
  rating_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.memory_books ADD COLUMN IF NOT EXISTS user_id TEXT;
ALTER TABLE public.memory_books ADD COLUMN IF NOT EXISTS original_story_id TEXT;
ALTER TABLE public.memory_books ADD COLUMN IF NOT EXISTS ebook_generation_id UUID;
ALTER TABLE public.memory_books ADD COLUMN IF NOT EXISTS title VARCHAR(255);
ALTER TABLE public.memory_books ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.memory_books ADD COLUMN IF NOT EXISTS subtitle VARCHAR(255);
ALTER TABLE public.memory_books ADD COLUMN IF NOT EXISTS author_name VARCHAR(255);
ALTER TABLE public.memory_books ADD COLUMN IF NOT EXISTS chapters JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.memory_books ADD COLUMN IF NOT EXISTS table_of_contents JSONB;
ALTER TABLE public.memory_books ADD COLUMN IF NOT EXISTS cover_image_url TEXT;
ALTER TABLE public.memory_books ADD COLUMN IF NOT EXISTS back_cover_text TEXT;
ALTER TABLE public.memory_books ADD COLUMN IF NOT EXISTS generation_settings JSONB;
ALTER TABLE public.memory_books ADD COLUMN IF NOT EXISTS style_preferences JSONB;
ALTER TABLE public.memory_books ADD COLUMN IF NOT EXISTS image_style VARCHAR(100) DEFAULT 'children';
ALTER TABLE public.memory_books ADD COLUMN IF NOT EXISTS mood VARCHAR(100) DEFAULT 'happy';
ALTER TABLE public.memory_books ADD COLUMN IF NOT EXISTS target_age_group VARCHAR(50) DEFAULT 'children';
ALTER TABLE public.memory_books ADD COLUMN IF NOT EXISTS page_count INTEGER;
ALTER TABLE public.memory_books ADD COLUMN IF NOT EXISTS chapter_count INTEGER;
ALTER TABLE public.memory_books ADD COLUMN IF NOT EXISTS word_count INTEGER;
ALTER TABLE public.memory_books ADD COLUMN IF NOT EXISTS image_count INTEGER;
ALTER TABLE public.memory_books ADD COLUMN IF NOT EXISTS status public.book_status DEFAULT 'draft'::public.book_status;
ALTER TABLE public.memory_books ADD COLUMN IF NOT EXISTS generation_started_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.memory_books ADD COLUMN IF NOT EXISTS generation_completed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.memory_books ADD COLUMN IF NOT EXISTS published_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.memory_books ADD COLUMN IF NOT EXISTS pdf_url TEXT;
ALTER TABLE public.memory_books ADD COLUMN IF NOT EXISTS epub_url TEXT;
ALTER TABLE public.memory_books ADD COLUMN IF NOT EXISTS mobi_url TEXT;
ALTER TABLE public.memory_books ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.memory_books ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;
ALTER TABLE public.memory_books ADD COLUMN IF NOT EXISTS download_count INTEGER DEFAULT 0;
ALTER TABLE public.memory_books ADD COLUMN IF NOT EXISTS share_count INTEGER DEFAULT 0;
ALTER TABLE public.memory_books ADD COLUMN IF NOT EXISTS rating_average DECIMAL(3,2) DEFAULT 0.00;
ALTER TABLE public.memory_books ADD COLUMN IF NOT EXISTS rating_count INTEGER DEFAULT 0;
ALTER TABLE public.memory_books ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());
ALTER TABLE public.memory_books ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

UPDATE public.memory_books
SET chapters = '[]'::jsonb
WHERE chapters IS NULL;

UPDATE public.memory_books
SET status = 'draft'
WHERE status IS NULL;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.memory_books WHERE user_id IS NULL) THEN
    ALTER TABLE public.memory_books ALTER COLUMN user_id SET NOT NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.memory_books WHERE title IS NULL) THEN
    ALTER TABLE public.memory_books ALTER COLUMN title SET NOT NULL;
  END IF;
END $$;

ALTER TABLE public.memory_books ALTER COLUMN chapters SET DEFAULT '[]'::jsonb;
ALTER TABLE public.memory_books ALTER COLUMN chapters SET NOT NULL;
ALTER TABLE public.memory_books ALTER COLUMN status SET DEFAULT 'draft';
ALTER TABLE public.memory_books ALTER COLUMN status SET NOT NULL;
ALTER TABLE public.memory_books ALTER COLUMN created_at SET DEFAULT timezone('utc'::text, now());
ALTER TABLE public.memory_books ALTER COLUMN created_at SET NOT NULL;
ALTER TABLE public.memory_books ALTER COLUMN updated_at SET DEFAULT timezone('utc'::text, now());
ALTER TABLE public.memory_books ALTER COLUMN updated_at SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'memory_books_user_id_fkey'
      AND conrelid = 'public.memory_books'::regclass
  ) THEN
    ALTER TABLE public.memory_books
      ADD CONSTRAINT memory_books_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE
      NOT VALID;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'memory_books_ebook_generation_id_fkey'
      AND conrelid = 'public.memory_books'::regclass
  ) THEN
    ALTER TABLE public.memory_books
      ADD CONSTRAINT memory_books_ebook_generation_id_fkey
      FOREIGN KEY (ebook_generation_id) REFERENCES public.ebook_generations(id) ON DELETE SET NULL
      NOT VALID;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_memory_books_user_id ON public.memory_books(user_id);
CREATE INDEX IF NOT EXISTS idx_memory_books_status ON public.memory_books(status);
CREATE INDEX IF NOT EXISTS idx_memory_books_created_at ON public.memory_books(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_memory_books_published_at
  ON public.memory_books(published_at DESC)
  WHERE published_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_memory_books_user_status ON public.memory_books(user_id, status);
CREATE INDEX IF NOT EXISTS idx_memory_books_rating
  ON public.memory_books(rating_average DESC, rating_count DESC);

CREATE OR REPLACE FUNCTION public.update_memory_books_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_memory_books_updated_at ON public.memory_books;
CREATE TRIGGER trigger_memory_books_updated_at
  BEFORE UPDATE ON public.memory_books
  FOR EACH ROW EXECUTE FUNCTION public.update_memory_books_updated_at();

ALTER TABLE public.memory_books ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view published books" ON public.memory_books;
DROP POLICY IF EXISTS "Public can view published memory books" ON public.memory_books;
DROP POLICY IF EXISTS "Users can view own books" ON public.memory_books;
DROP POLICY IF EXISTS "Users can insert own books" ON public.memory_books;
DROP POLICY IF EXISTS "Users can update own books" ON public.memory_books;
DROP POLICY IF EXISTS "Users can delete own books" ON public.memory_books;
DROP POLICY IF EXISTS "Service role can manage all memory books" ON public.memory_books;

CREATE POLICY "Public can view published memory books" ON public.memory_books
  FOR SELECT TO anon, authenticated
  USING (status::text = 'published');

CREATE POLICY "Users can view own books" ON public.memory_books
  FOR SELECT TO authenticated
  USING (
    user_id = auth.jwt() ->> 'sub'
    OR user_id = auth.jwt() ->> 'user_id'
    OR user_id = auth.jwt() ->> 'userId'
  );

CREATE POLICY "Users can insert own books" ON public.memory_books
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.jwt() ->> 'sub'
    OR user_id = auth.jwt() ->> 'user_id'
    OR user_id = auth.jwt() ->> 'userId'
  );

CREATE POLICY "Users can update own books" ON public.memory_books
  FOR UPDATE TO authenticated
  USING (
    user_id = auth.jwt() ->> 'sub'
    OR user_id = auth.jwt() ->> 'user_id'
    OR user_id = auth.jwt() ->> 'userId'
  )
  WITH CHECK (
    user_id = auth.jwt() ->> 'sub'
    OR user_id = auth.jwt() ->> 'user_id'
    OR user_id = auth.jwt() ->> 'userId'
  );

CREATE POLICY "Users can delete own books" ON public.memory_books
  FOR DELETE TO authenticated
  USING (
    user_id = auth.jwt() ->> 'sub'
    OR user_id = auth.jwt() ->> 'user_id'
    OR user_id = auth.jwt() ->> 'userId'
  );

CREATE POLICY "Service role can manage all memory books" ON public.memory_books
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

COMMIT;
