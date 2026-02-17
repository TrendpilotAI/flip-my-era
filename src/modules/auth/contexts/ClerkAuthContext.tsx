import { useEffect, useState, ReactNode, useCallback, useRef } from "react";
import { useUser, useAuth as useClerkAuthHook, SignInButton, SignUpButton, UserButton } from "@clerk/clerk-react";
import type { GetTokenOptions } from "@clerk/types";
import { supabase, signOutFromSupabase, createSupabaseClientWithClerkToken } from "@/core/integrations/supabase/client";
import { AuthContext, type AuthUser, type AuthContextType, type ProfileType } from './AuthContext';
import { sentryService } from '@/core/integrations/sentry';
import { posthogService, posthogEvents } from '@/core/integrations/posthog';

export const ClerkAuthProvider = ({ children }: { children: ReactNode }) => {
  const { user: clerkUser, isLoaded } = useUser();
  const { signOut: clerkSignOut, getToken } = useClerkAuthHook();
  const [isNewUser, setIsNewUser] = useState(false);
  const [userProfile, setUserProfile] = useState<AuthUser | null>(null);
  const [creditBalance, setCreditBalance] = useState<number | null>(null);
  
  // Track if initial sync has completed to prevent duplicate fetches
  const hasSyncedRef = useRef(false);
  const isFetchingCreditsRef = useRef(false);
  const lastCreditFetchTimeRef = useRef<number>(0);
  // Track clerk user ID to detect user changes
  const lastClerkUserIdRef = useRef<string | null>(null);

  // Cache TTL for credit balance (30 seconds)
  const CREDIT_CACHE_TTL_MS = 30000;

  // Fetch credit balance using Supabase client
  // FIXED: Stable callback - no state dependencies to prevent infinite loops
  // Added cache TTL to prevent excessive API calls
  const fetchCreditBalance = useCallback(async (forceRefresh = false): Promise<number> => {
    if (!clerkUser) {
      return 0;
    }

    // Prevent concurrent fetches
    if (isFetchingCreditsRef.current) {
      return creditBalance ?? 0;
    }

    // Check cache TTL - skip fetch if recently fetched (unless forced)
    const now = Date.now();
    if (!forceRefresh && lastCreditFetchTimeRef.current > 0) {
      const timeSinceLastFetch = now - lastCreditFetchTimeRef.current;
      if (timeSinceLastFetch < CREDIT_CACHE_TTL_MS) {
        return creditBalance ?? 0;
      }
    }

    isFetchingCreditsRef.current = true;

    try {
      // Get Clerk token for authentication with Supabase template
      const clerkToken = await getToken({ template: 'supabase' });

      if (!clerkToken) {
        isFetchingCreditsRef.current = false;
        return 0;
      }

      const { data, error } = await supabase.functions.invoke('credits', {
        method: 'GET',
        headers: { Authorization: `Bearer ${clerkToken}`, 'Content-Type': 'application/json' },
      });
      
      if (error) {
        console.error("Error fetching credit balance:", error);
        isFetchingCreditsRef.current = false;
        return 0;
      }
      
      if (!data) {
        console.warn("No data received from credits function");
        isFetchingCreditsRef.current = false;
        return 0;
      }
      
      // Handle different response formats
      let balance = 0;
      if (data.success && data.data?.balance) {
        if (typeof data.data.balance === 'number') {
          balance = data.data.balance;
        } else if (data.data.balance.balance) {
          balance = data.data.balance.balance;
        }
      } else if (data.balance) {
        balance = data.balance;
      }
      
      // Update credit balance state and cache timestamp
      setCreditBalance(balance);
      lastCreditFetchTimeRef.current = Date.now();

      // Persist the credit balance onto profiles.credits for dashboard queries
      // Do this in background without blocking
      const supabaseWithAuth = createSupabaseClientWithClerkToken(clerkToken);
      supabaseWithAuth
        .from('profiles')
        .update({ credits: balance })
        .eq('id', clerkUser.id)
        .then(() => {})
        .catch((e) => console.warn('Unable to persist credits to profiles table:', e));
      
      isFetchingCreditsRef.current = false;
      return balance;
    } catch (error) {
      console.error("Error fetching credit balance:", error);
      isFetchingCreditsRef.current = false;
      return 0;
    }
  }, [clerkUser, getToken]);

  // Create or update user profile in Supabase when Clerk user changes
  useEffect(() => {
    if (!isLoaded) return;

    const abortController = new AbortController();
    const { signal } = abortController;

    const syncUserProfile = async () => {
      if (clerkUser) {
        // Detect if user actually changed to avoid redundant syncs
        const userChanged = lastClerkUserIdRef.current !== clerkUser.id;
        if (!userChanged && hasSyncedRef.current) return;
        lastClerkUserIdRef.current = clerkUser.id;
        hasSyncedRef.current = true;

        try {
          const clerkToken = await getToken({ template: 'supabase' });
          if (signal.aborted) return;
          
          if (!clerkToken) {
            throw new Error("No Clerk token available");
          }

          const supabaseWithAuth = createSupabaseClientWithClerkToken(clerkToken);
          const clerkUserId = clerkUser.id;
          
          const { data: existingProfile, error: fetchError } = await supabaseWithAuth
            .from('profiles')
            .select('*')
            .eq('id', clerkUserId)
            .single();

          if (signal.aborted) return;

          if (fetchError && fetchError.code !== 'PGRST116') {
            throw fetchError;
          }

          if (!existingProfile) {
            const { error: insertError } = await supabaseWithAuth
              .from('profiles')
              .insert({
                id: clerkUserId,
                email: clerkUser.primaryEmailAddress?.emailAddress || "",
                name: clerkUser.fullName || clerkUser.primaryEmailAddress?.emailAddress?.split("@")[0],
                avatar_url: clerkUser.imageUrl,
                subscription_status: "free",
              });

            if (signal.aborted) return;
            if (insertError) throw insertError;

            // Grant 3 free credits to new users
            const FREE_SIGNUP_CREDITS = 3;
            try {
              await supabaseWithAuth
                .from('user_credits')
                .upsert({
                  user_id: clerkUserId,
                  balance: FREE_SIGNUP_CREDITS,
                  subscription_type: 'free',
                  updated_at: new Date().toISOString(),
                }, { onConflict: 'user_id' });

              await supabaseWithAuth
                .from('credit_transactions')
                .insert({
                  user_id: clerkUserId,
                  amount: FREE_SIGNUP_CREDITS,
                  transaction_type: 'signup_bonus',
                  description: 'Welcome bonus: 3 free credits on signup',
                  balance_after_transaction: FREE_SIGNUP_CREDITS,
                  metadata: { source: 'signup_bonus' },
                });
            } catch (creditError) {
              console.warn('Failed to grant signup credits:', creditError);
            }

            setIsNewUser(true);
            const newUserProfile = {
              id: clerkUserId,
              email: clerkUser.primaryEmailAddress?.emailAddress || "",
              name: clerkUser.fullName || clerkUser.primaryEmailAddress?.emailAddress?.split("@")[0],
              avatar_url: clerkUser.imageUrl,
              subscription_status: "free",
              created_at: clerkUser.createdAt ? new Date(clerkUser.createdAt).toISOString() : undefined,
              credits: FREE_SIGNUP_CREDITS
            };
            setUserProfile(newUserProfile);
            
            sentryService.setUser({
              id: clerkUserId,
              email: newUserProfile.email,
              username: newUserProfile.name,
            });
            sentryService.addBreadcrumb({
              category: 'auth',
              message: 'New user profile created',
              level: 'info',
              data: { userId: clerkUserId, isNewUser: true },
            });
            
            posthogService.identify(clerkUserId, {
              email: newUserProfile.email,
              name: newUserProfile.name,
              subscription_status: newUserProfile.subscription_status,
              credits: newUserProfile.credits || 0,
              created_at: newUserProfile.created_at,
            });
            posthogEvents.userSignedUp({
              userId: clerkUserId,
              email: newUserProfile.email,
              subscription_status: newUserProfile.subscription_status,
            });
          } else {
            const { error: updateError } = await supabaseWithAuth
              .from('profiles')
              .update({
                email: clerkUser.primaryEmailAddress?.emailAddress || "",
                name: clerkUser.fullName || clerkUser.primaryEmailAddress?.emailAddress?.split("@")[0],
                avatar_url: clerkUser.imageUrl,
              })
              .eq('id', clerkUserId);

            if (signal.aborted) return;
            if (updateError) throw updateError;

            const updatedUserProfile = {
              id: String(existingProfile.id),
              email: String(existingProfile.email),
              name: String(existingProfile.name),
              avatar_url: String(existingProfile.avatar_url),
              subscription_status: (existingProfile.subscription_status as "free" | "basic" | "premium") || "free",
              created_at: String(existingProfile.created_at),
              credits: existingProfile.credits || 0
            };
            setUserProfile(updatedUserProfile);
            
            sentryService.setUser({
              id: updatedUserProfile.id,
              email: updatedUserProfile.email,
              username: updatedUserProfile.name,
            });
            sentryService.addBreadcrumb({
              category: 'auth',
              message: 'User profile synced',
              level: 'info',
              data: { userId: updatedUserProfile.id },
            });
            
            posthogService.identify(updatedUserProfile.id, {
              email: updatedUserProfile.email,
              name: updatedUserProfile.name,
              subscription_status: updatedUserProfile.subscription_status,
              credits: updatedUserProfile.credits || 0,
              created_at: updatedUserProfile.created_at,
            });
            posthogEvents.userSignedIn({
              userId: updatedUserProfile.id,
              email: updatedUserProfile.email,
              subscription_status: updatedUserProfile.subscription_status,
            });
          }

          // Fetch credits after profile sync (only if not aborted)
          if (!signal.aborted) {
            fetchCreditBalance().catch(() => {});
          }
        } catch (error) {
          if (signal.aborted) return;
          console.error("Error syncing user profile:", error);
          setUserProfile({
            id: clerkUser.id,
            email: clerkUser.primaryEmailAddress?.emailAddress || "",
            name: clerkUser.fullName || clerkUser.primaryEmailAddress?.emailAddress?.split("@")[0],
            avatar_url: clerkUser.imageUrl,
            subscription_status: "free",
            created_at: clerkUser.createdAt ? new Date(clerkUser.createdAt).toISOString() : undefined,
            credits: 0
          });
        }
      } else {
        // User logged out
        lastClerkUserIdRef.current = null;
        hasSyncedRef.current = false;
        setUserProfile(null);
        setIsNewUser(false);
        setCreditBalance(null);
        lastCreditFetchTimeRef.current = 0;
        sentryService.setUser(null);
        sentryService.addBreadcrumb({
          category: 'auth',
          message: 'User signed out',
          level: 'info',
        });
        posthogService.reset();
        posthogEvents.userSignedOut();
      }
    };

    syncUserProfile();

    // Cleanup: abort in-flight requests on unmount or dependency change
    return () => {
      abortController.abort();
    };
  }, [clerkUser?.id, isLoaded, getToken, fetchCreditBalance]);

  // Periodically refresh token to prevent expiry (every 50 minutes, Clerk tokens last ~60min)
  useEffect(() => {
    if (!clerkUser) return;
    const TOKEN_REFRESH_INTERVAL_MS = 50 * 60 * 1000;
    const intervalId = setInterval(() => {
      getToken({ template: 'supabase' }).catch((err) => {
        console.warn('Token refresh failed:', err);
      });
    }, TOKEN_REFRESH_INTERVAL_MS);
    return () => clearInterval(intervalId);
  }, [clerkUser?.id, getToken]);

  // Use Supabase profile data if available, otherwise fall back to Clerk data
  const user: AuthUser | null = userProfile || (clerkUser ? {
    id: clerkUser.id,
    email: clerkUser.primaryEmailAddress?.emailAddress || "",
    name: clerkUser.fullName || clerkUser.primaryEmailAddress?.emailAddress?.split("@")[0],
    avatar_url: clerkUser.imageUrl,
    subscription_status: "free", // Default to free, can be updated from database
    created_at: clerkUser.createdAt ? new Date(clerkUser.createdAt).toISOString() : undefined,
    credits: creditBalance || 0
  } : null);

    const refreshUser = useCallback(async () => {
    // Refresh user profile from Supabase
    if (clerkUser) {
      try {
        // Get Clerk token for authentication with Supabase template
        const clerkToken = await getToken({ template: 'supabase' });
        if (!clerkToken) {
          console.warn("No Clerk token available for user refresh");
          return;
        }
        
        // Create authenticated Supabase client
        const supabaseWithAuth = createSupabaseClientWithClerkToken(clerkToken);
        
        const { data: profile } = await supabaseWithAuth
          .from('profiles')
          .select('*')
          .eq('id', clerkUser.id)
          .single();

        if (profile) {
          setUserProfile({
            id: String(profile.id),
            email: String(profile.email),
            name: String(profile.full_name || profile.name),
            avatar_url: String(profile.avatar_url),
            subscription_status: (profile.subscription_status as "free" | "basic" | "premium") || "free",
            created_at: String(profile.created_at),
            // Note: credits are handled separately via creditBalance state
            credits: profile.credits || 0
          });
        }
        
        // Also refresh credit balance
        fetchCreditBalance().catch(() => {});
      } catch (error) {
        console.error("Error refreshing user profile:", error);
      }
    }
    // FIXED: Removed creditBalance from dependencies to prevent re-renders
  }, [clerkUser, getToken, fetchCreditBalance]);

  const handleSignIn = async (email: string, password: string) => {
    // This will be handled by Clerk's SignInButton component
    // For programmatic sign-in, you would use Clerk's signIn method
    return { error: new Error("Use SignInButton component for authentication") };
  };

  const handleSignUp = async (email: string, password: string, name?: string) => {
    // This will be handled by Clerk's SignUpButton component
    // For programmatic sign-up, you would use Clerk's signUp method
    return { error: new Error("Use SignUpButton component for authentication") };
  };

  const handleSignOut = async () => {
    try {
      // Sign out from both Clerk and Supabase
      await signOutFromSupabase();
      await clerkSignOut();
      setUserProfile(null);
      setIsNewUser(false);
      setCreditBalance(null);
      
      // Clear Sentry user context
      sentryService.setUser(null);
      sentryService.addBreadcrumb({
        category: 'auth',
        message: 'User signed out',
        level: 'info',
      });
      
      // Reset PostHog user identification
      posthogService.reset();
      posthogEvents.userSignedOut();
      
      return { error: null };
    } catch (error) {
      sentryService.captureException(error instanceof Error ? error : new Error('Sign out failed'), {
        component: 'ClerkAuthContext',
        action: 'signOut',
      });
      return { error: error as Error };
    }
  };

  const handleSignInWithGoogle = async () => {
    // This will be handled by Clerk's SignInButton component with OAuth
    return { error: new Error("Use SignInButton component for Google authentication") };
  };

  const isLoading = !isLoaded;
  const isAuthenticated = !!user;

  // Wrap getToken to match the expected interface and allow template overrides
  const getTokenWrapper = useCallback(async (options?: GetTokenOptions): Promise<string | null> => {
    try {
      if (options) {
        return await getToken(options);
      }
      return await getToken({ template: 'supabase' });
    } catch (error) {
      console.error("Error getting token:", error);
      return null;
    }
  }, [getToken]);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    signIn: handleSignIn,
    signUp: handleSignUp,
    signOut: handleSignOut,
    signInWithGoogle: handleSignInWithGoogle,
    refreshUser,
    fetchCreditBalance,
    getToken: getTokenWrapper,
    isNewUser,
    setIsNewUser,
    SignInButton,
    SignUpButton,
    UserButton,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};