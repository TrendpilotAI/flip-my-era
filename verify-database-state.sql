-- ============================================
-- Supabase Database Verification Script
-- Run this in your Supabase SQL Editor to check current state
-- ============================================

-- Check if all required tables exist
WITH required_tables AS (
  SELECT unnest(ARRAY[
    'profiles',
    'stories', 
    'ebook_generations',
    'credit_transactions',
    'user_credits',
    'tiktok_shares',
    'user_activities'
  ]) AS table_name
),
existing_tables AS (
  SELECT table_name 
  FROM information_schema.tables 
  WHERE table_schema = 'public'
)
SELECT 
  rt.table_name,
  CASE 
    WHEN et.table_name IS NOT NULL THEN '✅ Exists'
    ELSE '❌ Missing'
  END AS status
FROM required_tables rt
LEFT JOIN existing_tables et ON rt.table_name = et.table_name
ORDER BY rt.table_name;

-- Check profiles table structure
SELECT '--- PROFILES TABLE STRUCTURE ---' as info;
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
ORDER BY ordinal_position;

-- Check if profiles table uses TEXT for id (Clerk compatibility)
SELECT '--- CLERK COMPATIBILITY CHECK ---' as info;
SELECT 
  CASE 
    WHEN data_type = 'text' THEN '✅ Profiles.id is TEXT (Clerk compatible)'
    ELSE '❌ Profiles.id is ' || data_type || ' (needs to be TEXT for Clerk)'
  END AS clerk_compatibility
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
  AND column_name = 'id';

-- Check stories table for is_public column
SELECT '--- STORIES PUBLIC SHARING CHECK ---' as info;
SELECT 
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ Stories.is_public column exists'
    ELSE '❌ Stories.is_public column missing'
  END AS public_sharing_status
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'stories'
  AND column_name = 'is_public';

-- Check RLS policies
SELECT '--- ROW LEVEL SECURITY POLICIES ---' as info;
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Check if RLS is enabled on tables
SELECT '--- RLS ENABLED STATUS ---' as info;
SELECT 
  schemaname,
  tablename,
  CASE 
    WHEN rowsecurity THEN '✅ RLS Enabled'
    ELSE '❌ RLS Disabled'
  END AS rls_status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'profiles',
    'stories',
    'ebook_generations',
    'credit_transactions',
    'user_credits',
    'tiktok_shares'
  )
ORDER BY tablename;

-- Check indexes for performance
SELECT '--- PERFORMANCE INDEXES ---' as info;
SELECT 
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN (
    'profiles',
    'stories',
    'ebook_generations',
    'credit_transactions',
    'user_credits'
  )
ORDER BY tablename, indexname;

-- Check foreign key constraints
SELECT '--- FOREIGN KEY CONSTRAINTS ---' as info;
SELECT
  tc.table_name,
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_schema = 'public'
ORDER BY tc.table_name;

-- Check for any recent errors in migrations
SELECT '--- MIGRATION CHECK ---' as info;
SELECT 
  CASE 
    WHEN COUNT(*) > 0 THEN 'ℹ️ Found ' || COUNT(*) || ' migration records'
    ELSE '⚠️ No migration history found (might be normal if using SQL Editor)'
  END AS migration_status
FROM information_schema.tables
WHERE table_schema = 'supabase_migrations'
  AND table_name = 'schema_migrations';

-- Summary
SELECT '--- DEPLOYMENT STATUS SUMMARY ---' as info;
WITH status_checks AS (
  SELECT 
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') as has_profiles,
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'stories') as has_stories,
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ebook_generations') as has_ebooks,
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_credits') as has_credits,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'stories' AND column_name = 'is_public') as has_public_stories,
    (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public') as policy_count
)
SELECT 
  CASE 
    WHEN has_profiles > 0 AND has_stories > 0 AND has_ebooks > 0 AND has_credits > 0 
         AND has_public_stories > 0 AND policy_count > 10
    THEN '✅ Database appears fully configured!'
    WHEN has_profiles > 0 AND has_stories > 0 
    THEN '⚠️ Database partially configured - some tables/features missing'
    ELSE '❌ Database needs configuration - run APPLY_MIGRATIONS.sql'
  END AS overall_status,
  has_profiles || ' profiles, ' || 
  has_stories || ' stories, ' || 
  has_ebooks || ' ebooks, ' || 
  has_credits || ' credits, ' ||
  policy_count || ' RLS policies' AS details
FROM status_checks;