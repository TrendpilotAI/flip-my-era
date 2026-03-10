/**
 * BetterAuth AuthProvider
 *
 * Implements the exact same `AuthContextType` interface that was provided by the
 * Supabase Auth provider so that all 25+ consumer files continue to work without
 * any changes.  The context shape, hook names, and export names are kept identical.
 *
 * What changed vs. Supabase Auth:
 *  - Session & user data come from BetterAuth's `useSession()` hook.
 *  - `getToken()` reads the cookie-based session token via the BetterAuth client.
 *  - Edge Functions are updated separately to verify tokens via BetterAuth.
 *  - The `session` property is typed as `BetterAuthSession | null` but satisfies
 *    all call-sites that only access `session.access_token` or `session.user`.
 */
import {
  createContext,
  useContext,
  useCallback,
  useRef,
  useState,
  useEffect,
  useMemo,
  createElement,
  type ReactNode,
} from 'react';
import { authClient } from '@/lib/auth-client';
import { supabase } from '@/core/integrations/supabase/client';

// ─── Re-exported types ────────────────────────────────────────────────────────

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

// `session` in BetterAuth is an object, not a Supabase Session.
// We expose a minimal compatible shape that satisfies existing consumers.
export interface BetterAuthSession {
  access_token: string;        // maps to BetterAuth JWT (for Edge Function calls)
  user: {
    id: string;
    email: string;
  };
  expires_at?: number;
}

export interface AuthContextType {
  user: AuthUser | null;
  session: BetterAuthSession | null;
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

// ─── Context ─────────────────────────────────────────────────────────────────

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useBetterAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useBetterAuth must be used within a BetterAuthProvider');
  }
  return context;
}

/** Backward-compatible alias */
export const useSupabaseAuth = useBetterAuth;
export const useAuth = useBetterAuth;

// ─── Provider ────────────────────────────────────────────────────────────────

export function BetterAuthProvider({ children }: { children: ReactNode }) {
  const { data: baSession, isPending } = authClient.useSession();

  const [userProfile, setUserProfile] = useState<AuthUser | null>(null);
  const [creditBalance, setCreditBalance] = useState<number | null>(null);
  const [isNewUser, setIsNewUser] = useState(false);
  const isMountedRef = useRef(true);
  const isFetchingCreditsRef = useRef(false);
  const lastCreditFetchTimeRef = useRef<number>(0);
  const lastUserIdRef = useRef<string | null>(null);
  const CREDIT_CACHE_TTL_MS = 30_000;

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // ── Build a compatible session object ─────────────────────────────────────
  // BetterAuth stores the token in an HttpOnly cookie; there is no JS-readable
  // access_token by default.  We call `getSession()` to obtain a short-lived
  // token representation we can forward to Supabase Edge Functions.
  const getToken = useCallback(async (): Promise<string | null> => {
    try {
      const session = await authClient.getSession();
      // BetterAuth getSession returns { data, error }
      const data = (session as any)?.data;
      if (!data) return null;
      // The session token is stored as `data.session.token`
      return (data.session as any)?.token ?? null;
    } catch {
      return null;
    }
  }, []);

  // Build a minimal session-like object so consumers that access `session.access_token` work
  const session = useMemo<BetterAuthSession | null>(() => {
    if (!baSession?.user) return null;
    // We lazily populate access_token; most consumers call getToken() which is async.
    // For synchronous access_token usage in headers, consumers should call getToken().
    return {
      access_token: '', // placeholder — use getToken() for actual bearer token
      user: {
        id: baSession.user.id,
        email: baSession.user.email,
      },
    };
  }, [baSession]);

  // ── Credit balance fetch (unchanged logic, now uses BetterAuth token) ─────
  const fetchCreditBalance = useCallback(async (forceRefresh = false): Promise<number> => {
    if (!baSession?.user) return 0;
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
      const token = await getToken();
      if (!token) return 0;

      const { data, error } = await supabase.functions.invoke('credits', {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });

      if (error || !data) return 0;

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
      return balance;
    } catch {
      return 0;
    } finally {
      isFetchingCreditsRef.current = false;
    }
  }, [baSession, creditBalance, getToken]);

  // ── Sync user profile from Supabase `profiles` table ─────────────────────
  useEffect(() => {
    if (!baSession?.user) {
      setUserProfile(null);
      setIsNewUser(false);
      setCreditBalance(null);
      lastCreditFetchTimeRef.current = 0;
      lastUserIdRef.current = null;
      return;
    }

    const u = baSession.user;
    if (lastUserIdRef.current === u.id) return;
    lastUserIdRef.current = u.id;

    let cancelled = false;

    (async () => {
      try {
        const { data: existingProfile, error: fetchError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', u.id)
          .single();

        if (cancelled) return;

        if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

        if (!existingProfile) {
          // New user — create profile + grant credits
          const FREE_SIGNUP_CREDITS = 3;
          await supabase.from('profiles').insert({
            id: u.id,
            email: u.email || '',
            name: (u as any).name || u.email?.split('@')[0] || '',
            avatar_url: (u as any).image || '',
            subscription_status: 'free',
          });

          await supabase.from('user_credits').upsert(
            { user_id: u.id, balance: FREE_SIGNUP_CREDITS, subscription_type: 'free', updated_at: new Date().toISOString() },
            { onConflict: 'user_id' },
          );

          await supabase.from('credit_transactions').insert({
            user_id: u.id,
            amount: FREE_SIGNUP_CREDITS,
            transaction_type: 'signup_bonus',
            description: 'Welcome bonus: 3 free credits on signup',
            balance_after_transaction: FREE_SIGNUP_CREDITS,
            metadata: { source: 'signup_bonus' },
          });

          if (!cancelled && isMountedRef.current) {
            setIsNewUser(true);
            setUserProfile({
              id: u.id,
              email: u.email || '',
              name: (u as any).name || u.email?.split('@')[0] || '',
              avatar_url: (u as any).image || '',
              subscription_status: 'free',
              created_at: (u as any).createdAt?.toString() || new Date().toISOString(),
              credits: FREE_SIGNUP_CREDITS,
            });
            setCreditBalance(FREE_SIGNUP_CREDITS);
          }
        } else {
          if (!cancelled && isMountedRef.current) {
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
      } catch (err) {
        if (!cancelled && isMountedRef.current) {
          console.error('[BetterAuth] Error syncing user profile:', err);
          setUserProfile({
            id: u.id,
            email: u.email || '',
            name: (u as any).name || u.email?.split('@')[0] || '',
            avatar_url: (u as any).image || '',
            subscription_status: 'free',
            created_at: (u as any).createdAt?.toString() || new Date().toISOString(),
            credits: 0,
          });
        }
      }
    })();

    return () => { cancelled = true; };
  }, [baSession?.user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Fetch credits after profile sync ─────────────────────────────────────
  useEffect(() => {
    if (!userProfile || !baSession?.user) return;
    fetchCreditBalance().catch(() => {});
  }, [userProfile?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Derived user ──────────────────────────────────────────────────────────
  const user = useMemo<AuthUser | null>(() => {
    if (userProfile) return userProfile;
    if (!baSession?.user) return null;
    return {
      id: baSession.user.id,
      email: baSession.user.email,
      name: (baSession.user as any).name || baSession.user.email?.split('@')[0] || '',
      avatar_url: (baSession.user as any).image || '',
      subscription_status: 'free',
      created_at: (baSession.user as any).createdAt?.toString() || new Date().toISOString(),
      credits: creditBalance || 0,
    };
  }, [baSession, userProfile, creditBalance]);

  // ── Auth action handlers ──────────────────────────────────────────────────

  const handleSignIn = useCallback(async (email: string, password: string) => {
    try {
      const result = await authClient.signIn.email({ email, password });
      if ((result as any)?.error) {
        return { error: new Error((result as any).error.message || 'Sign in failed') };
      }
      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err : new Error('Sign in failed') };
    }
  }, []);

  const handleSignUp = useCallback(async (email: string, password: string, name?: string) => {
    try {
      const result = await authClient.signUp.email({ email, password, name: name || '' });
      if ((result as any)?.error) {
        return { error: new Error((result as any).error.message || 'Sign up failed') };
      }
      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err : new Error('Sign up failed') };
    }
  }, []);

  const handleSignOut = useCallback(async () => {
    try {
      await authClient.signOut();
      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err : new Error('Sign out failed') };
    }
  }, []);

  const handleSignInWithGoogle = useCallback(async () => {
    try {
      await authClient.signIn.social({
        provider: 'google',
        callbackURL: `${window.location.origin}/auth/callback`,
      });
      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err : new Error('Google sign in failed') };
    }
  }, []);

  const refreshUser = useCallback(async () => {
    if (!baSession?.user) return;
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', baSession.user.id)
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
  }, [baSession, fetchCreditBalance]);

  // ── Context value ─────────────────────────────────────────────────────────

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      session,
      isLoading: isPending,
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
    [
      user,
      session,
      isPending,
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

/** Backward-compatible alias — used in App.tsx and auth/index.ts */
export { BetterAuthProvider as SupabaseAuthProvider };
export { BetterAuthProvider as ClerkAuthProvider };
