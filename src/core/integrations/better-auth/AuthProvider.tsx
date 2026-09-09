/**
 * BetterAuth AuthProvider
 *
 * Implements the exact same `AuthContextType` interface that was provided by the
 * Supabase Auth provider so that all 25+ consumer files continue to work
 * unchanged. The context shape, hook names, and export names are kept identical.
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
import { invokeAuthenticatedFunction } from '@/core/integrations/supabase/client';

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
  access_token: string;        // maps to BetterAuth auth token for Edge Function calls
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

type BetterAuthClientSessionData = typeof authClient.$Infer.Session;
type BetterAuthClientUser = BetterAuthClientSessionData['user'];
type BetterAuthClientSessionRecord = BetterAuthClientSessionData['session'];
type SubscriptionStatus = NonNullable<AuthUser['subscription_status']>;

interface BetterAuthClientError {
  message?: string;
  status?: number;
  statusText?: string;
  code?: string;
}

interface BetterAuthActionResult {
  error?: BetterAuthClientError | null;
}

interface ProfileRow {
  id: string | number;
  email?: string | null;
  full_name?: string | null;
  name?: string | null;
  avatar_url?: string | null;
  subscription_status?: string | null;
  created_at?: string | null;
  credits?: number | null;
}

interface ProfileProvisionResponse {
  profile?: ProfileRow | null;
  credits?: number;
  created?: boolean;
}

interface CreditBalanceResponse {
  success?: boolean;
  data?: {
    balance?: number | { balance?: number };
  };
  balance?: number;
}

async function provisionCurrentProfile(): Promise<ProfileProvisionResponse> {
  const { data, error } = await invokeAuthenticatedFunction<ProfileProvisionResponse>(
    'provision-profile',
    { method: 'POST' },
  );
  if (error) throw error;
  if (!data?.profile) throw new Error('Profile provisioning returned no profile');
  return data;
}

function getBetterAuthUserName(user: BetterAuthClientUser): string {
  return user.name || user.email?.split('@')[0] || '';
}

function getBetterAuthAvatarUrl(user: BetterAuthClientUser): string {
  return user.image ?? '';
}

function getBetterAuthCreatedAt(user: BetterAuthClientUser): string {
  return user.createdAt?.toString() || new Date().toISOString();
}

function toUnixSeconds(date?: BetterAuthClientSessionRecord['expiresAt']): number | undefined {
  return date ? Math.floor(new Date(date).getTime() / 1000) : undefined;
}

function normalizeSubscriptionStatus(status: ProfileRow['subscription_status']): SubscriptionStatus {
  return status === 'basic' || status === 'premium' || status === 'free' ? status : 'free';
}

function profileRowToAuthUser(profile: ProfileRow): AuthUser {
  return {
    id: String(profile.id),
    email: String(profile.email ?? ''),
    name: String(profile.full_name ?? profile.name ?? ''),
    avatar_url: String(profile.avatar_url ?? ''),
    subscription_status: normalizeSubscriptionStatus(profile.subscription_status),
    created_at: String(profile.created_at ?? ''),
    credits: profile.credits ?? 0,
  };
}

function betterAuthUserToAuthUser(user: BetterAuthClientUser, credits = 0): AuthUser {
  return {
    id: user.id,
    email: user.email || '',
    name: getBetterAuthUserName(user),
    avatar_url: getBetterAuthAvatarUrl(user),
    subscription_status: 'free',
    created_at: getBetterAuthCreatedAt(user),
    credits,
  };
}

function getActionError(result: BetterAuthActionResult, fallbackMessage: string): Error | null {
  return result.error ? new Error(result.error.message || fallbackMessage) : null;
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
export const useClerkAuth = useBetterAuth;
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
  // BetterAuth exposes the auth token as `session.token`; the context keeps the
  // old `access_token` name for existing Edge Function callers.
  const getToken = useCallback(async (): Promise<string | null> => {
    try {
      const session = await authClient.getSession();
      const data = session.data;
      if (!data) return null;
      return data.session.token ?? null;
    } catch {
      return null;
    }
  }, []);

  // Build a minimal session-like object so consumers that access `session.access_token` work
  const session = useMemo<BetterAuthSession | null>(() => {
    if (!baSession?.user) return null;
    return {
      access_token: baSession.session?.token ?? '',
      user: {
        id: baSession.user.id,
        email: baSession.user.email,
      },
      expires_at: toUnixSeconds(baSession.session?.expiresAt),
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

      const { data, error } = await invokeAuthenticatedFunction<CreditBalanceResponse>('credits', {
        method: 'GET',
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
        const provisionedProfile = await provisionCurrentProfile();

        if (cancelled) return;
        const provisioned = provisionedProfile.profile;
        if (!provisioned || String(provisioned.id) !== u.id) {
          throw new Error('Profile provisioning returned an invalid profile');
        }

        if (isMountedRef.current) {
          setIsNewUser(provisionedProfile.created === true);
          setUserProfile(profileRowToAuthUser(provisioned));
          setCreditBalance(provisionedProfile.credits ?? provisioned.credits ?? 0);
        }
      } catch (err) {
        if (!cancelled && isMountedRef.current) {
          console.error('[BetterAuth] Error syncing user profile:', err);
          setUserProfile(betterAuthUserToAuthUser(u));
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
    return betterAuthUserToAuthUser(baSession.user, creditBalance || 0);
  }, [baSession, userProfile, creditBalance]);

  // ── Auth action handlers ──────────────────────────────────────────────────

  const handleSignIn = useCallback(async (email: string, password: string) => {
    try {
      const result = await authClient.signIn.email({ email, password });
      return { error: getActionError(result, 'Sign in failed') };
    } catch (err) {
      return { error: err instanceof Error ? err : new Error('Sign in failed') };
    }
  }, []);

  const handleSignUp = useCallback(async (email: string, password: string, name?: string) => {
    try {
      const result = await authClient.signUp.email({ email, password, name: name || '' });
      return { error: getActionError(result, 'Sign up failed') };
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
    const data = await provisionCurrentProfile();
    if (!data.profile || String(data.profile.id) !== baSession.user.id) {
      throw new Error('Profile provisioning returned an invalid profile');
    }

    if (isMountedRef.current) {
      setUserProfile(profileRowToAuthUser(data.profile));
      if (data.credits !== undefined) setCreditBalance(data.credits);
      if (data.created !== undefined) setIsNewUser(data.created);
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

/** Backward-compatible provider aliases retained for older auth imports */
export { BetterAuthProvider as SupabaseAuthProvider };
export { BetterAuthProvider as ClerkAuthProvider };
