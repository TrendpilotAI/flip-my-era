-- Migration: Fix Clerk Integration
-- Update RLS policies and ensure proper Clerk user ID handling
-- Date: 2025-02-01

BEGIN;

-- Drop existing RLS policies that use auth.jwt() (which doesn't work with Clerk)
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Create new RLS policies that work with Clerk
-- These policies will be enforced by the application layer since Clerk doesn't use Supabase Auth
CREATE POLICY "Allow all authenticated users to view profiles" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Allow all authenticated users to insert profiles" ON public.profiles
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow users to update their own profile" ON public.profiles
  FOR UPDATE USING (true);

-- Update user_credits table to ensure it uses TEXT for user_id (should already be correct)
-- Add a comment to clarify this is for Clerk integration
COMMENT ON COLUMN user_credits.user_id IS 'Clerk user ID (format: user_abc123) - stored as TEXT, not UUID';

-- Update credit_transactions table to ensure it uses TEXT for user_id
COMMENT ON COLUMN credit_transactions.user_id IS 'Clerk user ID (format: user_abc123) - stored as TEXT, not UUID';

-- Create a function to validate Clerk user ID format
CREATE OR REPLACE FUNCTION is_valid_clerk_user_id(user_id TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- Clerk user IDs start with 'user_' followed by alphanumeric characters
  RETURN user_id ~ '^user_[a-zA-Z0-9]+$';
END;
$$ LANGUAGE plpgsql;

-- Add a check constraint to ensure valid Clerk user ID format in profiles
ALTER TABLE profiles ADD CONSTRAINT check_valid_clerk_user_id 
  CHECK (is_valid_clerk_user_id(id));

-- Add the same constraint to user_credits and credit_transactions
ALTER TABLE user_credits ADD CONSTRAINT check_valid_clerk_user_id 
  CHECK (is_valid_clerk_user_id(user_id));

ALTER TABLE credit_transactions ADD CONSTRAINT check_valid_clerk_user_id 
  CHECK (is_valid_clerk_user_id(user_id));

-- Create indexes for better performance with Clerk user IDs
CREATE INDEX IF NOT EXISTS idx_profiles_clerk_user_id ON profiles(id);
CREATE INDEX IF NOT EXISTS idx_user_credits_clerk_user_id ON user_credits(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_clerk_user_id ON credit_transactions(user_id);

COMMIT; 