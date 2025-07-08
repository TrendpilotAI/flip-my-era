-- Migration: Fix RLS policies for ebook_generations and memory_books tables with Clerk authentication
-- Date: 2025-07-04

BEGIN;

-- Fix RLS policies for ebook_generations table
-- Drop existing RLS policies
DROP POLICY IF EXISTS "Users can view their own ebook generations" ON ebook_generations;
DROP POLICY IF EXISTS "Users can insert their own ebook generations" ON ebook_generations;
DROP POLICY IF EXISTS "Users can update their own ebook generations" ON ebook_generations;
DROP POLICY IF EXISTS "Users can delete their own ebook generations" ON ebook_generations;

-- Create new RLS policies that work with Clerk JWT
-- These policies will allow users to access their own ebook generations
-- The user_id field contains the Clerk user ID (e.g., 'user_2zFAK78eCctIYm4mAd07mDWhNoA')

-- Policy for viewing own ebook generations
CREATE POLICY "Users can view their own ebook generations" ON ebook_generations
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

-- Policy for inserting own ebook generations
CREATE POLICY "Users can insert their own ebook generations" ON ebook_generations
  FOR INSERT WITH CHECK (
    -- Ensure the user_id being inserted matches the authenticated user
    user_id = auth.jwt() ->> 'sub'
    OR
    user_id = auth.jwt() ->> 'user_id'
    OR
    user_id = auth.jwt() ->> 'userId'
  );

-- Policy for updating own ebook generations
CREATE POLICY "Users can update their own ebook generations" ON ebook_generations
  FOR UPDATE USING (
    -- Allow if user_id matches the authenticated user
    user_id = auth.jwt() ->> 'sub'
    OR
    user_id = auth.jwt() ->> 'user_id'
    OR
    user_id = auth.jwt() ->> 'userId'
  );

-- Policy for deleting own ebook generations
CREATE POLICY "Users can delete their own ebook generations" ON ebook_generations
  FOR DELETE USING (
    -- Allow if user_id matches the authenticated user
    user_id = auth.jwt() ->> 'sub'
    OR
    user_id = auth.jwt() ->> 'user_id'
    OR
    user_id = auth.jwt() ->> 'userId'
  );

-- Also create a policy for service role access (for admin functions)
-- This allows the service role to bypass RLS for admin operations
CREATE POLICY "Service role can manage all ebook generations" ON ebook_generations
  FOR ALL USING (
    -- Allow service role to bypass RLS
    auth.role() = 'service_role'
  );

-- Fix RLS policies for memory_books table
-- Drop existing RLS policies
DROP POLICY IF EXISTS "Users can view own books" ON memory_books;
DROP POLICY IF EXISTS "Users can insert own books" ON memory_books;
DROP POLICY IF EXISTS "Users can update own books" ON memory_books;
DROP POLICY IF EXISTS "Users can delete own books" ON memory_books;

-- Create new RLS policies for memory_books that work with Clerk JWT
CREATE POLICY "Users can view own books" ON memory_books
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

CREATE POLICY "Users can insert own books" ON memory_books
  FOR INSERT WITH CHECK (
    -- Ensure the user_id being inserted matches the authenticated user
    user_id = auth.jwt() ->> 'sub'
    OR
    user_id = auth.jwt() ->> 'user_id'
    OR
    user_id = auth.jwt() ->> 'userId'
  );

CREATE POLICY "Users can update own books" ON memory_books
  FOR UPDATE USING (
    -- Allow if user_id matches the authenticated user
    user_id = auth.jwt() ->> 'sub'
    OR
    user_id = auth.jwt() ->> 'user_id'
    OR
    user_id = auth.jwt() ->> 'userId'
  );

CREATE POLICY "Users can delete own books" ON memory_books
  FOR DELETE USING (
    -- Allow if user_id matches the authenticated user
    user_id = auth.jwt() ->> 'sub'
    OR
    user_id = auth.jwt() ->> 'user_id'
    OR
    user_id = auth.jwt() ->> 'userId'
  );

-- Also create a policy for service role access for memory_books
CREATE POLICY "Service role can manage all memory books" ON memory_books
  FOR ALL USING (
    -- Allow service role to bypass RLS
    auth.role() = 'service_role'
  );

COMMIT; 