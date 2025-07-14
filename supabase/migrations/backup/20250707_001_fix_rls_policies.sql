-- Migration: Fix RLS Policies for Clerk Authentication
-- Date: 2025-07-07
-- This migration fixes the RLS policies to work properly with Clerk authentication

BEGIN;

-- ============================================================================
-- FIX USER_CREDITS TABLE POLICIES
-- ============================================================================

-- Drop existing policies for user_credits
DROP POLICY IF EXISTS "Users can view own credits" ON user_credits;
DROP POLICY IF EXISTS "Users can update own credits" ON user_credits;
DROP POLICY IF EXISTS "Users can insert own credits" ON user_credits;

-- Create new policies that work with Clerk JWT tokens
CREATE POLICY "Users can view own credits" ON user_credits
  FOR SELECT TO authenticated
  USING (
    user_id = auth.jwt() ->> 'sub'
    OR user_id = auth.jwt() ->> 'user_id'
    OR user_id = auth.jwt() ->> 'userId'
  );

CREATE POLICY "Users can update own credits" ON user_credits
  FOR UPDATE TO authenticated
  USING (
    user_id = auth.jwt() ->> 'sub'
    OR user_id = auth.jwt() ->> 'user_id'
    OR user_id = auth.jwt() ->> 'userId'
  );

CREATE POLICY "Users can insert own credits" ON user_credits
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.jwt() ->> 'sub'
    OR user_id = auth.jwt() ->> 'user_id'
    OR user_id = auth.jwt() ->> 'userId'
  );

-- ============================================================================
-- ADD STORIES TABLE POLICIES (missing from comprehensive setup)
-- ============================================================================

-- Drop existing policies for stories (if any)
DROP POLICY IF EXISTS "Users can view own stories" ON stories;
DROP POLICY IF EXISTS "Users can insert own stories" ON stories;
DROP POLICY IF EXISTS "Users can update own stories" ON stories;
DROP POLICY IF EXISTS "Users can delete own stories" ON stories;

-- Create new policies for stories table
CREATE POLICY "Users can view own stories" ON stories
  FOR SELECT TO authenticated
  USING (
    user_id = auth.jwt() ->> 'sub'
    OR user_id = auth.jwt() ->> 'user_id'
    OR user_id = auth.jwt() ->> 'userId'
  );

CREATE POLICY "Users can insert own stories" ON stories
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.jwt() ->> 'sub'
    OR user_id = auth.jwt() ->> 'user_id'
    OR user_id = auth.jwt() ->> 'userId'
  );

CREATE POLICY "Users can update own stories" ON stories
  FOR UPDATE TO authenticated
  USING (
    user_id = auth.jwt() ->> 'sub'
    OR user_id = auth.jwt() ->> 'user_id'
    OR user_id = auth.jwt() ->> 'userId'
  );

CREATE POLICY "Users can delete own stories" ON stories
  FOR DELETE TO authenticated
  USING (
    user_id = auth.jwt() ->> 'sub'
    OR user_id = auth.jwt() ->> 'user_id'
    OR user_id = auth.jwt() ->> 'userId'
  );

-- ============================================================================
-- ADD SERVICE ROLE POLICIES FOR STORIES
-- ============================================================================

-- Service role can manage all stories (for admin functions)
CREATE POLICY "Service role can manage all stories" ON stories
  FOR ALL TO service_role
  USING (true);

-- ============================================================================
-- ADD PUBLIC READ POLICY FOR STORIES (optional)
-- ============================================================================

-- Allow public read access to published stories
CREATE POLICY "Public can view published stories" ON stories
  FOR SELECT TO anon, authenticated
  USING (status = 'published');

COMMIT; 