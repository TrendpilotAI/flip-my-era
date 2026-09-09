/**
 * BetterAuth server configuration.
 *
 * This module is imported by the Vercel Function handler (`api/auth/[...path].ts`).
 * It must NOT be imported by any browser-side code — Vite's build will tree-shake it
 * out because it is never reachable from the SPA entry point, but to be safe the file
 * only imports Node/Deno-compatible modules.
 *
 * Environment variables (set in Vercel / local development):
 *   DATABASE_URL          — Postgres connection string (Supabase pooler recommended)
 *   DATABASE_CA_CERT      — Trusted Postgres CA as PEM, escaped PEM, or base64:PEM
 *   BETTER_AUTH_SECRET    — 32+ char random secret for signing tokens
 *   BETTER_AUTH_URL       — Public base URL of the app (defaults to the Vercel deploy URL)
 *   GOOGLE_CLIENT_ID      — OAuth2 client id
 *   GOOGLE_CLIENT_SECRET  — OAuth2 client secret
 */
import { betterAuth } from 'better-auth';
import { Pool } from 'pg';
import { getBetterAuthTrustedOrigins, getBetterAuthUrl } from './deployment-url.js';
import { createPostgresPoolConfig } from './postgres-pool-config.js';

// ---------------------------------------------------------------------------
// Database adapter
// ---------------------------------------------------------------------------

function createPool() {
  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL or POSTGRES_URL environment variable is required for BetterAuth');
  }
  return new Pool(createPostgresPoolConfig(connectionString, process.env.DATABASE_CA_CERT));
}

const betterAuthUrl = getBetterAuthUrl();
const trustedOrigins = getBetterAuthTrustedOrigins(betterAuthUrl);
const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

// ---------------------------------------------------------------------------
// Auth instance
// ---------------------------------------------------------------------------

export const auth = betterAuth({
  // BetterAuth's built-in Postgres adapter (no Drizzle/Prisma needed)
  database: createPool(),

  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: betterAuthUrl,
  basePath: '/api/auth',
  trustedOrigins,

  // ---------------------------------------------------------------------------
  // Email + password
  // ---------------------------------------------------------------------------
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    autoSignIn: true,
  },

  // ---------------------------------------------------------------------------
  // Social providers
  // ---------------------------------------------------------------------------
  socialProviders: googleClientId && googleClientSecret
    ? {
        google: {
          clientId: googleClientId,
          clientSecret: googleClientSecret,
          redirectURI: `${betterAuthUrl}/api/auth/callback/google`,
        },
      }
    : {},

  // ---------------------------------------------------------------------------
  // Session configuration
  // ---------------------------------------------------------------------------
  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days
    updateAge: 60 * 60 * 24,       // refresh if older than 1 day
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5 min client-side cookie cache
    },
  },

  // ---------------------------------------------------------------------------
  // User model extensions
  // ---------------------------------------------------------------------------
  user: {
    additionalFields: {
      avatar_url: {
        type: 'string',
        input: false,
        required: false,
        defaultValue: '',
      },
      subscription_status: {
        type: 'string',
        input: false,
        required: false,
        defaultValue: 'free',
      },
      credits: {
        type: 'number',
        input: false,
        required: false,
        defaultValue: 0,
      },
    },
  },

  // ---------------------------------------------------------------------------
  // Advanced
  // ---------------------------------------------------------------------------
  advanced: {
    generateId: false, // use Postgres uuid_generate_v4() / gen_random_uuid()
    crossSubDomainCookies: {
      enabled: false,
    },
  },
});

export type Auth = typeof auth;
