-- ============================================================================
-- BetterAuth required tables
-- Replaces Supabase Auth (auth.users) as the identity layer.
-- BetterAuth uses its own schema (`public` tables, not `auth.*`).
-- https://www.better-auth.com/docs/concepts/database
-- ============================================================================

-- Enable uuid extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------------------
-- user
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "user" (
  id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  name          TEXT NOT NULL DEFAULT '',
  email         TEXT NOT NULL UNIQUE,
  "emailVerified" BOOLEAN NOT NULL DEFAULT FALSE,
  image         TEXT,
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Custom fields (mirror what was in profiles)
  avatar_url            TEXT DEFAULT '',
  subscription_status   TEXT NOT NULL DEFAULT 'free'
                          CHECK (subscription_status IN ('free', 'basic', 'premium')),
  credits               INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_user_email ON "user" (email);

-- ---------------------------------------------------------------------------
-- session
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "session" (
  id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "userId"    TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  token       TEXT NOT NULL UNIQUE,
  "expiresAt" TIMESTAMPTZ NOT NULL,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_session_token   ON "session" (token);
CREATE INDEX IF NOT EXISTS idx_session_user_id ON "session" ("userId");

-- ---------------------------------------------------------------------------
-- account  (OAuth + credential linking)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "account" (
  id                    TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "userId"              TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  "accountId"           TEXT NOT NULL,
  "providerId"          TEXT NOT NULL,
  "accessToken"         TEXT,
  "refreshToken"        TEXT,
  "accessTokenExpiresAt" TIMESTAMPTZ,
  "refreshTokenExpiresAt" TIMESTAMPTZ,
  scope                 TEXT,
  "idToken"             TEXT,
  password              TEXT,
  "createdAt"           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE ("providerId", "accountId")
);

CREATE INDEX IF NOT EXISTS idx_account_user_id ON "account" ("userId");

-- ---------------------------------------------------------------------------
-- verification  (email verification tokens, password reset, etc.)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "verification" (
  id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  identifier  TEXT NOT NULL,
  value       TEXT NOT NULL,
  "expiresAt" TIMESTAMPTZ NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_verification_identifier ON "verification" (identifier);

-- ---------------------------------------------------------------------------
-- Row Level Security (optional but recommended)
-- BetterAuth operates server-side with service-role, so RLS here is permissive.
-- ---------------------------------------------------------------------------

ALTER TABLE "user"         ENABLE ROW LEVEL SECURITY;
ALTER TABLE "session"      ENABLE ROW LEVEL SECURITY;
ALTER TABLE "account"      ENABLE ROW LEVEL SECURITY;
ALTER TABLE "verification" ENABLE ROW LEVEL SECURITY;

-- Service-role bypass (used by BetterAuth Netlify Function)
CREATE POLICY "betterauth_service_all" ON "user"
  FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);

CREATE POLICY "betterauth_service_all" ON "session"
  FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);

CREATE POLICY "betterauth_service_all" ON "account"
  FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);

CREATE POLICY "betterauth_service_all" ON "verification"
  FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);

-- ---------------------------------------------------------------------------
-- updatedAt trigger helper
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_user_updated_at
  BEFORE UPDATE ON "user"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_session_updated_at
  BEFORE UPDATE ON "session"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_account_updated_at
  BEFORE UPDATE ON "account"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_verification_updated_at
  BEFORE UPDATE ON "verification"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
