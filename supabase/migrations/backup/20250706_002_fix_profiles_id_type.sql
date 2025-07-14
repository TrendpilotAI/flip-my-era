-- Migration: Fix profiles.id type conversion
-- Date: 2025-07-06

BEGIN;

-- First, drop all RLS policies that depend on the id column
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Now convert the id column from UUID to TEXT
ALTER TABLE profiles ALTER COLUMN id TYPE TEXT;

-- Recreate the RLS policies with the correct column type
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.jwt() ->> 'sub' = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.jwt() ->> 'sub' = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.jwt() ->> 'sub' = id);

COMMIT; 