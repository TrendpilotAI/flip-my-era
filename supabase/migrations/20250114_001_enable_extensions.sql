-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "pgcrypto" SCHEMA extensions;

-- Create public schema wrapper for uuid_generate_v4 (Postgres 17 compatibility)
-- The extension installs into the extensions schema, but migrations reference it unqualified
CREATE OR REPLACE FUNCTION public.uuid_generate_v4()
RETURNS uuid
LANGUAGE sql
AS $$ SELECT extensions.uuid_generate_v4(); $$;
