/**
 * Supabase Auth Module
 * Replaces Clerk authentication with native Supabase Auth
 *
 * Memory-leak & race-condition fixes (2026-02-28):
 *  - AbortController on all async ops inside useEffect / syncUserProfile
 *  - Proper cleanup functions returned from every useEffect
 *  - isMountedRef guards prevent state updates after unmount
 *  - useMemo wraps context value to prevent unnecessary re-renders
 *  - Token refresh mechanism with expiry handling
 */
import {
  useEffect,
  useState,
  useCallback,
  useRef,
  useMemo,
  createContext,
  useContext,
  type ReactNode,
} from 'react';
import { createElement } from 'react';
import { supabase } from './client';
import type { Session, User as SupabaseUser } from '@supabase/supabase-js';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  subscription_status?: 'free' | 'basic' | 'premium';
  created_at?: string;
  credits?: number;
}

export interface ProfileType {
  id: string;
  email: string;
  name: string;
  avatar_url: string;
  subscription_status: 'free' | 'basic' | 'premium';
  created_at: string;
}

export interface AuthContextType {
  user: AuthUser | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isSignedIn: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, name?: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  refreshUser: () => Promise<void>;
  fetchCreditBalance: (forceRefresh?: boolean) => Promise<number>;
  getToken: () => Promise<string | null>;
  isNewUser: boolean;
  setIsNewUser: (value: boolean) => void;
}

// ─── Auth Functions ──────────────────────────────────────────────────────────

export async function signUpWithEmail(email: string, password: string, name?: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: name },
    },
  });
  return { data, error };
}

export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  return { data, error };
}

export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });
  return { data, error };
}

export async function signOutUser() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

export async function resetPassword(email: string) {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });
  return { data, error };
}

export async function updatePassword(newPassword: string) {
  const { data, error } = await supabase.auth.updateUser({ password: newPassword });
  return { data, error };
}

export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

export async function getAccessToken(): Promise<string | null> {
  const session = await getSession();
  return session?.access_token ?? null;
}

// ─── Token expiry helpers ─────────────────────────────────────────────────────

/** Returns true when a session token will expire within `bufferMs` ms */
function isTokenExpiringSoon(session: Session, bufferMs = 60_000): boolean {
  if (!session.expires_at) return false;
  return session.expires_at * 1000 - Date.now() < bufferMs;
}

// ─── Context ─────────────────────────────────────────────────────────────────

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useSupabaseAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useSupabaseAuth must be used within a SupabaseAuthProvider');
  }
  return context;
}

// Alias for backward compatibility
export const useAuth = useSupabaseAuth;

// ─── Provider ────────────────────────────────────────────────────────────────

export function SupabaseAuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isNewUser, setIsNewUser] = useState(false);
  const [creditBalance, setCreditBalance] = useState<number | null>(null);

  // ── Stable refs (never cause re-renders) ──────────────────────────────────
  const isMountedRef = useRef(true);
  const hasSyncedRef = useRef(false);
  const isFetchingCreditsRef = useRef(false);
  const lastCreditFetchTimeRef = useRef<number>(0);
  const lastUserIdRef = useRef<string | null>(null);
  const syncAbortRef = useRef<AbortController | null>(null);
  const tokenRefreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const CREDIT_CACHE_TTL_MS = 30_000;

  // ── Credit balance fetch ──────────────────────────────────────────────────
  const fetchCreditBalance = useCallback(async (forceRefresh = false): Promise<number> => {
    const { data: { session: currentSession } } = await supabase.auth.getSession();
    if (!currentSession?.user) return 0;
    if (isFetchingCreditsRef.current) return creditBalance ?? 0;

    const now = Date.now();
    if (
      !forceRefresh &&
      lastCreditFetchTimeRef.current > 0 &&
      now - lastCreditFetchTimeRef.current < CREDIT_CACHE_TTL_MS
    ) {
      return creditBalance ?? 0;
    }

    isFetchingCreditsRef.current = true;
    try {
      const token = currentSession.access_token;
      const { data, error } = await supabase.functions.invoke('credits', {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });

      if (error || !data) {
        return 0;
      }

      let balance = 0;
      if (data.success && data.data?.balance) {
        balance = typeof data.data.balance === 'number' ? data.data.balance : (data.data.balance.balance || 0);
      } else if (data.balance) {
        balance = data.balance;
      }

      if (isMountedRef.current) {
        setCreditBalance(balance);
        lastCreditFetchTimeRef.current = Date.now();
      }

      // Persist to profiles in background (fire-and-forget, not awaited)
      supabase
        .from('profiles')
        .update({ credits: balance })
        .eq('id', currentSession.user.id)
        .then(() => {})
        .catch(() => {});

      return balance;
    } catch {
      return 0;
    } finally {
      isFetchingCreditsRef.current = false;
    }
  }, [creditBalance]);

  // ── User profile sync — with AbortController ──────────────────────────────
  const syncUserProfile = useCallback(async (
    supabaseUser: SupabaseUser,
    signal?: AbortSignal,
  ) => {
    const userChanged = lastUserIdRef.current !== supabaseUser.id;
    if (!userChanged && hasSyncedRef.current) return;
    lastUserIdRef.current = supabaseUser.id;
    hasSyncedRef.current = true;

    const aborted = () => signal?.aborted;

    try {
      if (aborted()) return;
      const { data: existingProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', supabaseUser.id)
        .single();

      if (aborted()) return;
      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      if (!existingProfile) {
        // ── New user — create profile ────────────────────────────────────────
        const FREE_SIGNUP_CREDITS = 3;
        if (aborted()) return;
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: supabaseUser.id,
            email: supabaseUser.email || '',
            name: supabaseUser.user_metadata?.full_name || supabaseUser.email?.split('@')[0] || '',
            avatar_url: supabaseUser.user_metadata?.avatar_url || '',
            subscription_status: 'free',
          });
        if (insertError) throw insertError;

        if (!aborted()) {
          try {
            await supabase.from('user_credits').upsert(
              {
                user_id: supabaseUser.id,
                balance: FREE_SIGNUP_CREDITS,
                subscription_type: 'free',
                updated_at: new Date().toISOString(),
              },
              { onConflict: 'user_id' },
            );

            if (!aborted()) {
              await supabase.from('credit_transactions').insert({
                user_id: supabaseUser.id,
                amount: FREE_SIGNUP_CREDITS,
                transaction_type: 'signup_bonus',
                description: 'Welcome bonus: 3 free credits on signup',
                balance_after_transaction: FREE_SIGNUP_CREDITS,
                metadata: { source: 'signup_bonus' },
              });
            }
          } catch (e) {
            console.warn('Failed to grant signup credits:', e);
          }
        }

        if (!aborted() && isMountedRef.current) {
          setIsNewUser(true);
          setUserProfile({
            id: supabaseUser.id,
            email: supabaseUser.email || '',
            name: supabaseUser.user_metadata?.full_name || supabaseUser.email?.split('@')[0] || '',
            avatar_url: supabaseUser.user_metadata?.avatar_url || '',
            subscription_status: 'free',
            created_at: supabaseUser.created_at,
            credits: FREE_SIGNUP_CREDITS,
          });
        }
      } else {
        // ── Existing user — update profile ───────────────────────────────────
        if (aborted()) return;
        await supabase
          .from('profiles')
          .update({
            email: supabaseUser.email || '',
            name: supabaseUser.user_metadata?.full_name || existingProfile.name,
            avatar_url: supabaseUser.user_metadata?.avatar_url || existingProfile.avatar_url,
          })
          .eq('id', supabaseUser.id);

        if (!aborted() && isMountedRef.current) {
          setUserProfile({
            id: String(existingProfile.id),
            email: String(existingProfile.email),
            name: String(existingProfile.name),
            avatar_url: String(existingProfile.avatar_url),
            subscription_status: (existingProfile.subscription_status as 'free' | 'basic' | 'premium') || 'free',
            created_at: String(existingProfile.created_at),
            credits: existingProfile.credits || 0,
          });
        }
      }
    } catch (error) {
      if (!aborted() && isMountedRef.current) {
        console.error('Error syncing user profile:', error);
        setUserProfile({
          id: supabaseUser.id,
          email: supabaseUser.email || '',
          name: supabaseUser.user_metadata?.full_name || supabaseUser.email?.split('@')[0] || '',
          avatar_url: supabaseUser.user_metadata?.avatar_url || '',
          subscription_status: 'free',
          created_at: supabaseUser.created_at,
          credits: 0,
        });
      }
    }
  }, []);

  // ── Token refresh scheduling ──────────────────────────────────────────────
  const scheduleTokenRefresh = useCallback((currentSession: Session) => {
    if (tokenRefreshTimerRef.current) {
      clearTimeout(tokenRefreshTimerRef.current);
    }
    if (!currentSession.expires_at) return;

    // Refresh 60 s before expiry
    const msUntilExpiry = currentSession.expires_at * 1000 - Date.now();
    const refreshIn = Math.max(0, msUntilExpiry - 60_000);

    tokenRefreshTimerRef.current = setTimeout(async () => {
      if (!isMountedRef.current) return;
      const { data, error } = await supabase.auth.refreshSession();
      if (!error && data.session && isMountedRef.current) {
        setSession(data.session);
        scheduleTokenRefresh(data.session);
      }
    }, refreshIn);
  }, []);

  // ── Main auth initialisation effect ──────────────────────────────────────
  useEffect(() => {
    isMountedRef.current = true;

    const initSession = async () => {
      const { data: { session: initialSession } } = await supabase.auth.getSession();
      if (!isMountedRef.current) return;

      setSession(initialSession);

      if (initialSession?.user) {
        // Cancel any previous in-flight sync
        syncAbortRef.current?.abort();
        syncAbortRef.current = new AbortController();
        await syncUserProfile(initialSession.user, syncAbortRef.current.signal);
        if (isMountedRef.current) scheduleTokenRefresh(initialSession);
      }

      if (isMountedRef.current) setIsLoading(false);
    };

    initSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (!isMountedRef.current) return;

      setSession(newSession);

      if (newSession?.user) {
        // Abort any in-flight previous sync before starting a new one
        syncAbortRef.current?.abort();
        syncAbortRef.current = new AbortController();
        await syncUserProfile(newSession.user, syncAbortRef.current.signal);

        if (isMountedRef.current) {
          scheduleTokenRefresh(newSession);

          // Proactively refresh if the new session is already near expiry
          if (isTokenExpiringSoon(newSession)) {
            const { data, error } = await supabase.auth.refreshSession();
            if (!error && data.session && isMountedRef.current) {
              setSession(data.session);
              scheduleTokenRefresh(data.session);
            }
          }
        }
      } else {
        syncAbortRef.current?.abort();
        syncAbortRef.current = null;
        if (tokenRefreshTimerRef.current) {
          clearTimeout(tokenRefreshTimerRef.current);
          tokenRefreshTimerRef.current = null;
        }
        lastUserIdRef.current = null;
        hasSyncedRef.current = false;
        if (isMountedRef.current) {
          setUserProfile(null);
          setIsNewUser(false);
          setCreditBalance(null);
          lastCreditFetchTimeRef.current = 0;
        }
      }
    });

    return () => {
      isMountedRef.current = false;
      subscription.unsubscribe();
      syncAbortRef.current?.abort();
      syncAbortRef.current = null;
      if (tokenRefreshTimerRef.current) {
        clearTimeout(tokenRefreshTimerRef.current);
        tokenRefreshTimerRef.current = null;
      }
    };
  }, [syncUserProfile, scheduleTokenRefresh]);

  // ── Fetch credits after profile sync ─────────────────────────────────────
  useEffect(() => {
    if (!userProfile || !session) return;

    let cancelled = false;
    fetchCreditBalance().catch(() => {});

    return () => {
      cancelled = true; // signals caller intent; actual guard is isMountedRef
      void cancelled; // suppress unused-var lint
    };
  }, [userProfile?.id, session?.access_token]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Auth action handlers ──────────────────────────────────────────────────

  const handleSignIn = useCallback(async (email: string, password: string) => {
    const { error } = await signInWithEmail(email, password);
    return { error: error ? new Error(error.message) : null };
  }, []);

  const handleSignUp = useCallback(async (email: string, password: string, name?: string) => {
    const { error } = await signUpWithEmail(email, password, name);
    return { error: error ? new Error(error.message) : null };
  }, []);

  const handleSignOut = useCallback(async () => {
    const { error } = await signOutUser();
    if (!error && isMountedRef.current) {
      setUserProfile(null);
      setIsNewUser(false);
      setCreditBalance(null);
    }
    return { error: error ? new Error(error.message) : null };
  }, []);

  const handleSignInWithGoogle = useCallback(async () => {
    const { error } = await signInWithGoogle();
    return { error: error ? new Error(error.message) : null };
  }, []);

  const refreshUser = useCallback(async () => {
    if (!session?.user) return;

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (profile && isMountedRef.current) {
      setUserProfile({
        id: String(profile.id),
        email: String(profile.email),
        name: String(profile.full_name || profile.name),
        avatar_url: String(profile.avatar_url),
        subscription_status: (profile.subscription_status as 'free' | 'basic' | 'premium') || 'free',
        created_at: String(profile.created_at),
        credits: profile.credits || 0,
      });
    }
    fetchCreditBalance().catch(() => {});
  }, [session, fetchCreditBalance]);

  const getToken = useCallback(async (): Promise<string | null> => {
    const { data: { session: s } } = await supabase.auth.getSession();
    return s?.access_token ?? null;
  }, []);

  // ── Derived user (fallback to raw session data while profile loads) ───────
  const user = userProfile || (session?.user
    ? {
        id: session.user.id,
        email: session.user.email || '',
        name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || '',
        avatar_url: session.user.user_metadata?.avatar_url || '',
        subscription_status: 'free' as const,
        created_at: session.user.created_at,
        credits: creditBalance || 0,
      }
    : null);

  // ── Context value — memoised to prevent unnecessary consumer re-renders ───
  const value = useMemo<AuthContextType>(
    () => ({
      user,
      session,
      isLoading,
      isAuthenticated: !!user,
      isSignedIn: !!user,
      signIn: handleSignIn,
      signUp: handleSignUp,
      signOut: handleSignOut,
      signInWithGoogle: handleSignInWithGoogle,
      refreshUser,
      fetchCreditBalance,
      getToken,
      isNewUser,
      setIsNewUser,
    }),
    // Stable callbacks from useCallback are safe to include; primitive values
    // like isLoading / isNewUser cause rerenders only when they actually change.
    [
      user,
      session,
      isLoading,
      handleSignIn,
      handleSignUp,
      handleSignOut,
      handleSignInWithGoogle,
      refreshUser,
      fetchCreditBalance,
      getToken,
      isNewUser,
    ],
  );

  return createElement(AuthContext.Provider, { value }, children);
}
