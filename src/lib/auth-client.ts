/**
 * BetterAuth browser client.
 *
 * Import this (not auth-server.ts) from any React component or hook.
 *
 * The baseURL points to the same-origin Vercel Function for all /api/auth/* routes.
 */
import { createAuthClient } from 'better-auth/react';

function getBaseURL(): string {
  // In test environments window.location.origin may be empty or 'null'
  if (typeof window !== 'undefined' && window.location?.origin && window.location.origin !== 'null') {
    return window.location.origin;
  }
  // Fallback for SSR, tests, or environments without a DOM
  return import.meta.env?.VITE_APP_URL ?? 'https://flipmyera.com';
}

export const authClient = createAuthClient({
  baseURL: getBaseURL(),
});

export const googleAuthEnabled = import.meta.env.VITE_GOOGLE_AUTH_ENABLED === 'true';

// Convenience re-exports so consumers only need one import
export const {
  signIn,
  signUp,
  signOut,
  useSession,
  getSession,
} = authClient;
