BEGIN;

SELECT plan(18);

SELECT has_table('public', 'memory_books', 'memory_books table exists');

SELECT ok(
  EXISTS (
    SELECT 1
    FROM pg_class AS c
    JOIN pg_namespace AS n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname = 'community_books'
      AND c.relkind = 'v'
  ),
  'community_books is a view'
);

SELECT ok(
  (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.memory_books'::REGCLASS),
  'memory_books has row-level security enabled'
);

SELECT ok(
  (SELECT relforcerowsecurity FROM pg_class WHERE oid = 'public.memory_books'::REGCLASS),
  'memory_books forces row-level security'
);

SELECT is(
  (
    SELECT ARRAY_AGG(policyname::TEXT ORDER BY policyname::TEXT)
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'memory_books'
  ),
  ARRAY['service_role_all']::TEXT[],
  'memory_books has only the service-role policy'
);

SELECT ok(
  NOT has_table_privilege('anon', 'public.memory_books', 'SELECT'),
  'anon cannot select the memory_books base table'
);

SELECT ok(
  NOT has_table_privilege('authenticated', 'public.memory_books', 'SELECT'),
  'authenticated cannot select the memory_books base table'
);

SELECT ok(
  has_table_privilege('service_role', 'public.memory_books', 'SELECT')
  AND has_table_privilege('service_role', 'public.memory_books', 'INSERT')
  AND has_table_privilege('service_role', 'public.memory_books', 'UPDATE')
  AND has_table_privilege('service_role', 'public.memory_books', 'DELETE'),
  'service_role can manage private memory books'
);

SELECT ok(
  has_table_privilege('anon', 'public.community_books', 'SELECT'),
  'anon can read the community projection'
);

SELECT ok(
  has_table_privilege('authenticated', 'public.community_books', 'SELECT'),
  'authenticated can read the community projection'
);

SELECT ok(
  NOT has_table_privilege('anon', 'public.community_books', 'INSERT'),
  'anon cannot mutate the community projection'
);

SELECT is(
  (
    SELECT ARRAY_AGG(column_name::TEXT ORDER BY ordinal_position)
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_books'
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
  'community_books exposes only the reviewed public projection'
);

SELECT ok(
  'security_barrier=true' = ANY(
    COALESCE(
      (SELECT reloptions FROM pg_class WHERE oid = 'public.community_books'::REGCLASS),
      ARRAY[]::TEXT[]
    )
  ),
  'community_books is a security-barrier view'
);

SELECT ok(
  NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_books' AND column_name = 'user_id'
  ),
  'community_books excludes ownership identifiers'
);

SELECT ok(
  NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_books' AND column_name = 'chapters'
  ),
  'community_books excludes generated chapter content'
);

SELECT ok(
  NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'community_books' AND column_name = 'pdf_url'
  ),
  'community_books excludes private file URLs'
);

INSERT INTO public.profiles (id, email, name)
VALUES ('pgtap-community-owner', 'community-owner@example.invalid', 'Community Owner');

INSERT INTO public.memory_books (
  id, user_id, title, author_name, chapters, status, published_at
)
VALUES
  (
    '00000000-0000-4000-8000-000000000001',
    'pgtap-community-owner',
    'Private pgTAP Book',
    'pgTAP Community Author',
    '[]'::JSONB,
    'draft',
    NULL
  ),
  (
    '00000000-0000-4000-8000-000000000002',
    'pgtap-community-owner',
    'Published pgTAP Book',
    'pgTAP Community Author',
    '[]'::JSONB,
    'published',
    NOW()
  );

SELECT results_eq(
  $$
    SELECT id::TEXT
    FROM public.community_books
    WHERE author_name = 'pgTAP Community Author'
    ORDER BY id
  $$,
  $$ VALUES ('00000000-0000-4000-8000-000000000002'::TEXT) $$,
  'community_books returns published rows and filters private rows'
);

SELECT is(
  (
    SELECT COUNT(*)::INTEGER
    FROM public.community_books
    WHERE author_name = 'pgTAP Community Author'
  ),
  1,
  'exactly one fixture is publicly visible'
);

SELECT * FROM finish();
ROLLBACK;
