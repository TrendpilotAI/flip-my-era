-- Migration: Comprehensive RLS Setup for Clerk Authentication
-- Date: 2025-07-04

BEGIN;

-- Enable RLS on all tables that don't have it enabled yet
ALTER TABLE IF EXISTS profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS ebook_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS memory_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS tiktok_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS credit_transactions ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies to start fresh
-- Profiles table policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Allow all authenticated users to view profiles" ON profiles;
DROP POLICY IF EXISTS "Allow all authenticated users to insert profiles" ON profiles;
DROP POLICY IF EXISTS "Allow users to update their own profile" ON profiles;

-- Ebook generations table policies
DROP POLICY IF EXISTS "Users can view their own ebook generations" ON ebook_generations;
DROP POLICY IF EXISTS "Users can insert their own ebook generations" ON ebook_generations;
DROP POLICY IF EXISTS "Users can update their own ebook generations" ON ebook_generations;
DROP POLICY IF EXISTS "Users can delete their own ebook generations" ON ebook_generations;

-- Memory books table policies
DROP POLICY IF EXISTS "Users can view own books" ON memory_books;
DROP POLICY IF EXISTS "Users can insert own books" ON memory_books;
DROP POLICY IF EXISTS "Users can update own books" ON memory_books;
DROP POLICY IF EXISTS "Users can delete own books" ON memory_books;

-- TikTok shares table policies
DROP POLICY IF EXISTS "Allow authenticated users to create shares" ON tiktok_shares;
DROP POLICY IF EXISTS "Allow users to view their own shares" ON tiktok_shares;

-- User credits table policies
DROP POLICY IF EXISTS "Users can view own credits" ON user_credits;
DROP POLICY IF EXISTS "Users can update own credits" ON user_credits;

-- Credit transactions table policies
DROP POLICY IF EXISTS "Users can view own transactions" ON credit_transactions;
DROP POLICY IF EXISTS "Users can insert own transactions" ON credit_transactions;

-- Service role policies
DROP POLICY IF EXISTS "Service role can manage all profiles" ON profiles;
DROP POLICY IF EXISTS "Service role can manage all ebook generations" ON ebook_generations;
DROP POLICY IF EXISTS "Service role can manage all memory books" ON memory_books;
DROP POLICY IF EXISTS "Service role can manage all tiktok shares" ON tiktok_shares;
DROP POLICY IF EXISTS "Service role can manage all user credits" ON user_credits;
DROP POLICY IF EXISTS "Service role can manage all credit transactions" ON credit_transactions;

-- ============================================================================
-- PROFILES TABLE POLICIES
-- ============================================================================

-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT TO authenticated
  USING (
    id = auth.jwt() ->> 'sub'
    OR id = auth.jwt() ->> 'user_id'
    OR id = auth.jwt() ->> 'userId'
  );

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT TO authenticated
  WITH CHECK (
    id = auth.jwt() ->> 'sub'
    OR id = auth.jwt() ->> 'user_id'
    OR id = auth.jwt() ->> 'userId'
  );

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE TO authenticated
  USING (
    id = auth.jwt() ->> 'sub'
    OR id = auth.jwt() ->> 'user_id'
    OR id = auth.jwt() ->> 'userId'
  );

-- ============================================================================
-- EBOOK_GENERATIONS TABLE POLICIES
-- ============================================================================

-- Users can view their own ebook generations
CREATE POLICY "Users can view their own ebook generations" ON ebook_generations
  FOR SELECT TO authenticated
  USING (
    user_id = auth.jwt() ->> 'sub'
    OR user_id = auth.jwt() ->> 'user_id'
    OR user_id = auth.jwt() ->> 'userId'
  );

-- Users can insert their own ebook generations
CREATE POLICY "Users can insert their own ebook generations" ON ebook_generations
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.jwt() ->> 'sub'
    OR user_id = auth.jwt() ->> 'user_id'
    OR user_id = auth.jwt() ->> 'userId'
  );

-- Users can update their own ebook generations
CREATE POLICY "Users can update their own ebook generations" ON ebook_generations
  FOR UPDATE TO authenticated
  USING (
    user_id = auth.jwt() ->> 'sub'
    OR user_id = auth.jwt() ->> 'user_id'
    OR user_id = auth.jwt() ->> 'userId'
  );

-- Users can delete their own ebook generations
CREATE POLICY "Users can delete their own ebook generations" ON ebook_generations
  FOR DELETE TO authenticated
  USING (
    user_id = auth.jwt() ->> 'sub'
    OR user_id = auth.jwt() ->> 'user_id'
    OR user_id = auth.jwt() ->> 'userId'
  );

-- ============================================================================
-- MEMORY_BOOKS TABLE POLICIES
-- ============================================================================

-- Users can view their own books
CREATE POLICY "Users can view own books" ON memory_books
  FOR SELECT TO authenticated
  USING (
    user_id = auth.jwt() ->> 'sub'
    OR user_id = auth.jwt() ->> 'user_id'
    OR user_id = auth.jwt() ->> 'userId'
  );

-- Users can insert their own books
CREATE POLICY "Users can insert own books" ON memory_books
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.jwt() ->> 'sub'
    OR user_id = auth.jwt() ->> 'user_id'
    OR user_id = auth.jwt() ->> 'userId'
  );

-- Users can update their own books
CREATE POLICY "Users can update own books" ON memory_books
  FOR UPDATE TO authenticated
  USING (
    user_id = auth.jwt() ->> 'sub'
    OR user_id = auth.jwt() ->> 'user_id'
    OR user_id = auth.jwt() ->> 'userId'
  );

-- Users can delete their own books
CREATE POLICY "Users can delete own books" ON memory_books
  FOR DELETE TO authenticated
  USING (
    user_id = auth.jwt() ->> 'sub'
    OR user_id = auth.jwt() ->> 'user_id'
    OR user_id = auth.jwt() ->> 'userId'
  );

-- ============================================================================
-- TIKTOK_SHARES TABLE POLICIES
-- ============================================================================

-- Users can view their own shares
CREATE POLICY "Allow users to view their own shares" ON tiktok_shares
  FOR SELECT TO authenticated
  USING (
    user_id = auth.jwt() ->> 'sub'
    OR user_id = auth.jwt() ->> 'user_id'
    OR user_id = auth.jwt() ->> 'userId'
  );

-- Users can insert their own shares
CREATE POLICY "Allow authenticated users to create shares" ON tiktok_shares
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.jwt() ->> 'sub'
    OR user_id = auth.jwt() ->> 'user_id'
    OR user_id = auth.jwt() ->> 'userId'
  );

-- ============================================================================
-- USER_CREDITS TABLE POLICIES
-- ============================================================================

-- Users can view their own credits
CREATE POLICY "Users can view own credits" ON user_credits
  FOR SELECT TO authenticated
  USING (
    user_id = auth.jwt() ->> 'sub'
    OR user_id = auth.jwt() ->> 'user_id'
    OR user_id = auth.jwt() ->> 'userId'
  );

-- Users can update their own credits
CREATE POLICY "Users can update own credits" ON user_credits
  FOR UPDATE TO authenticated
  USING (
    user_id = auth.jwt() ->> 'sub'
    OR user_id = auth.jwt() ->> 'user_id'
    OR user_id = auth.jwt() ->> 'userId'
  );

-- ============================================================================
-- CREDIT_TRANSACTIONS TABLE POLICIES
-- ============================================================================

-- Users can view their own transactions
CREATE POLICY "Users can view own transactions" ON credit_transactions
  FOR SELECT TO authenticated
  USING (
    user_id = auth.jwt() ->> 'sub'
    OR user_id = auth.jwt() ->> 'user_id'
    OR user_id = auth.jwt() ->> 'userId'
  );

-- Users can insert their own transactions
CREATE POLICY "Users can insert own transactions" ON credit_transactions
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.jwt() ->> 'sub'
    OR user_id = auth.jwt() ->> 'user_id'
    OR user_id = auth.jwt() ->> 'userId'
  );

-- ============================================================================
-- SERVICE ROLE POLICIES (for admin functions)
-- ============================================================================

-- Service role can manage all profiles
CREATE POLICY "Service role can manage all profiles" ON profiles
  FOR ALL TO service_role
  USING (true);

-- Service role can manage all ebook generations
CREATE POLICY "Service role can manage all ebook generations" ON ebook_generations
  FOR ALL TO service_role
  USING (true);

-- Service role can manage all memory books
CREATE POLICY "Service role can manage all memory books" ON memory_books
  FOR ALL TO service_role
  USING (true);

-- Service role can manage all tiktok shares
CREATE POLICY "Service role can manage all tiktok shares" ON tiktok_shares
  FOR ALL TO service_role
  USING (true);

-- Service role can manage all user credits
CREATE POLICY "Service role can manage all user credits" ON user_credits
  FOR ALL TO service_role
  USING (true);

-- Service role can manage all credit transactions
CREATE POLICY "Service role can manage all credit transactions" ON credit_transactions
  FOR ALL TO service_role
  USING (true);

-- ============================================================================
-- PUBLIC READ POLICIES (optional - for public data)
-- ============================================================================

-- Allow public read access to published memory books
CREATE POLICY "Public can view published books" ON memory_books
  FOR SELECT TO anon, authenticated
  USING (status = 'published');

COMMIT; 