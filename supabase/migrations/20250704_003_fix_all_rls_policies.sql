-- Migration: Fix all RLS policies for Clerk authentication
-- Date: 2025-07-04

BEGIN;

-- Fix RLS policies for profiles table
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Allow all authenticated users to view profiles" ON profiles;
DROP POLICY IF EXISTS "Allow all authenticated users to insert profiles" ON profiles;
DROP POLICY IF EXISTS "Allow users to update their own profile" ON profiles;

-- Create new RLS policies for profiles that work with Clerk JWT
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (
    -- Allow if id matches the JWT sub claim (Clerk user ID)
    id = auth.jwt() ->> 'sub'
    OR
    -- Allow if id matches the JWT user_id claim (fallback)
    id = auth.jwt() ->> 'user_id'
    OR
    -- Allow if id matches the JWT userId claim (another fallback)
    id = auth.jwt() ->> 'userId'
  );

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (
    -- Ensure the id being inserted matches the authenticated user
    id = auth.jwt() ->> 'sub'
    OR
    id = auth.jwt() ->> 'user_id'
    OR
    id = auth.jwt() ->> 'userId'
  );

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (
    -- Allow if id matches the authenticated user
    id = auth.jwt() ->> 'sub'
    OR
    id = auth.jwt() ->> 'user_id'
    OR
    id = auth.jwt() ->> 'userId'
  );

-- Fix RLS policies for tiktok_shares table
DROP POLICY IF EXISTS "Allow authenticated users to create shares" ON tiktok_shares;
DROP POLICY IF EXISTS "Allow users to view their own shares" ON tiktok_shares;

CREATE POLICY "Allow authenticated users to create shares" ON tiktok_shares
  FOR INSERT WITH CHECK (
    -- Ensure the user_id being inserted matches the authenticated user
    user_id = auth.jwt() ->> 'sub'
    OR
    user_id = auth.jwt() ->> 'user_id'
    OR
    user_id = auth.jwt() ->> 'userId'
  );

CREATE POLICY "Allow users to view their own shares" ON tiktok_shares
  FOR SELECT USING (
    -- Allow if user_id matches the JWT sub claim (Clerk user ID)
    user_id = auth.jwt() ->> 'sub'
    OR
    -- Allow if user_id matches the JWT user_id claim (fallback)
    user_id = auth.jwt() ->> 'user_id'
    OR
    -- Allow if user_id matches the JWT userId claim (another fallback)
    user_id = auth.jwt() ->> 'userId'
  );

-- Fix RLS policies for user_credits table (if it exists)
DROP POLICY IF EXISTS "Users can view own credits" ON user_credits;
DROP POLICY IF EXISTS "Users can update own credits" ON user_credits;

CREATE POLICY "Users can view own credits" ON user_credits
  FOR SELECT USING (
    -- Allow if user_id matches the JWT sub claim (Clerk user ID)
    user_id = auth.jwt() ->> 'sub'
    OR
    -- Allow if user_id matches the JWT user_id claim (fallback)
    user_id = auth.jwt() ->> 'user_id'
    OR
    -- Allow if user_id matches the JWT userId claim (another fallback)
    user_id = auth.jwt() ->> 'userId'
  );

CREATE POLICY "Users can update own credits" ON user_credits
  FOR UPDATE USING (
    -- Allow if user_id matches the authenticated user
    user_id = auth.jwt() ->> 'sub'
    OR
    user_id = auth.jwt() ->> 'user_id'
    OR
    user_id = auth.jwt() ->> 'userId'
  );

-- Fix RLS policies for credit_transactions table (if it exists)
DROP POLICY IF EXISTS "Users can view own transactions" ON credit_transactions;
DROP POLICY IF EXISTS "Users can insert own transactions" ON credit_transactions;

CREATE POLICY "Users can view own transactions" ON credit_transactions
  FOR SELECT USING (
    -- Allow if user_id matches the JWT sub claim (Clerk user ID)
    user_id = auth.jwt() ->> 'sub'
    OR
    -- Allow if user_id matches the JWT user_id claim (fallback)
    user_id = auth.jwt() ->> 'user_id'
    OR
    -- Allow if user_id matches the JWT userId claim (another fallback)
    user_id = auth.jwt() ->> 'userId'
  );

CREATE POLICY "Users can insert own transactions" ON credit_transactions
  FOR INSERT WITH CHECK (
    -- Ensure the user_id being inserted matches the authenticated user
    user_id = auth.jwt() ->> 'sub'
    OR
    user_id = auth.jwt() ->> 'user_id'
    OR
    user_id = auth.jwt() ->> 'userId'
  );

-- Add service role policies for admin access to all tables
CREATE POLICY "Service role can manage all profiles" ON profiles
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage all tiktok shares" ON tiktok_shares
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage all user credits" ON user_credits
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage all credit transactions" ON credit_transactions
  FOR ALL USING (auth.role() = 'service_role');

COMMIT; 