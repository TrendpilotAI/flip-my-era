/**
 * BetterAuth server configuration.
 *
 * This module is imported by the Netlify Function handler (`netlify/functions/auth.ts`).
 * It must NOT be imported by any browser-side code — Vite's build will tree-shake it
 * out because it is never reachable from the SPA entry point, but to be safe the file
 * only imports Node/Deno-compatible modules.
 *
 * Environment variables (set in Netlify dashboard / .env):
 *   DATABASE_URL          — Postgres connection string (Supabase pooler recommended)
 *   BETTER_AUTH_SECRET    — 32+ char random secret for signing tokens
 *   BETTER_AUTH_URL       — Public base URL of the app (e.g. https://flipmyera.com)
 *   GOOGLE_CLIENT_ID      — OAuth2 client id
 *   GOOGLE_CLIENT_SECRET  — OAuth2 client secret
 */
import { betterAuth } from 'better-auth';
import { Pool } from 'pg';

// ---------------------------------------------------------------------------
// Database adapter
// ---------------------------------------------------------------------------

function createPool() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is required for BetterAuth');
  }
  return new Pool({ connectionString, max: 5, idleTimeoutMillis: 30_000 });
}

// ---------------------------------------------------------------------------
// Auth instance
// ---------------------------------------------------------------------------

export const auth = betterAuth({
  database: {
    // BetterAuth's built-in Postgres adapter (no Drizzle/Prisma needed)
    type: 'pg',
    pool: createPool(),
  },

  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.BETTER_AUTH_URL || 'https://flipmyera.com',
  basePath: '/api/auth',

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
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      redirectURI: `${process.env.BETTER_AUTH_URL || 'https://flipmyera.com'}/api/auth/callback/google`,
    },
  },

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
      name: {
        type: 'string',
        required: false,
        defaultValue: '',
      },
      avatar_url: {
        type: 'string',
        required: false,
        defaultValue: '',
      },
      subscription_status: {
        type: 'string',
        required: false,
        defaultValue: 'free',
      },
      credits: {
        type: 'number',
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
