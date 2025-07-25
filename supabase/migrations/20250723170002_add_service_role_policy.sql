-- Migration: Add Service Role Policy for Stories Table
-- This migration adds a policy to allow the service role to insert stories on behalf of users

BEGIN;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Service role can insert stories for any user" ON stories;
DROP POLICY IF EXISTS "Service role can manage all stories" ON stories;

-- Add policy for service role to insert stories for any user
CREATE POLICY "Service role can insert stories for any user" ON stories
    FOR INSERT TO service_role
    WITH CHECK (true);

-- Ensure service role has all permissions
CREATE POLICY "Service role can manage all stories" ON stories
    FOR ALL TO service_role
    USING (true);

COMMIT; 