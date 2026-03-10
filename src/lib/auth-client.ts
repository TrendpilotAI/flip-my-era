/**
 * BetterAuth browser client.
 *
 * Import this (not auth-server.ts) from any React component or hook.
 *
 * The baseURL points to the Netlify Function that proxies all /api/auth/* routes.
 */
import { createAuthClient } from 'better-auth/react';

export const authClient = createAuthClient({
  baseURL: typeof window !== 'undefined'
    ? window.location.origin          // works for any deployment (local / prod)
    : (import.meta.env.VITE_APP_URL ?? 'https://flipmyera.com'),
});

// Convenience re-exports so consumers only need one import
export const {
  signIn,
  signUp,
  signOut,
  useSession,
  getSession,
} = authClient;
