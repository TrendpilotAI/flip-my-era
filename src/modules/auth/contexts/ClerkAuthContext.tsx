import { useEffect, useState, ReactNode, useCallback } from "react";
import { useUser, useAuth as useClerkAuthHook, SignInButton, SignUpButton, UserButton } from "@clerk/clerk-react";
import type { GetTokenOptions } from "@clerk/types";
import { supabase, getSupabaseSession, signOutFromSupabase, createSupabaseClientWithClerkToken } from "@/core/integrations/supabase/client";
import { AuthContext, type AuthUser, type AuthContextType, type ProfileType } from './AuthContext';
import { sentryService } from '@/core/integrations/sentry';
import { posthogService, posthogEvents } from '@/core/integrations/posthog';

export const ClerkAuthProvider = ({ children }: { children: ReactNode }) => {
  const { user: clerkUser, isLoaded } = useUser();
  const { signOut: clerkSignOut, getToken } = useClerkAuthHook();
  const [isNewUser, setIsNewUser] = useState(false);
  const [userProfile, setUserProfile] = useState<AuthUser | null>(null);
  const [creditBalance, setCreditBalance] = useState<number | null>(null);

  // Fetch credit balance using Supabase client
  const fetchCreditBalance = useCallback(async (): Promise<number> => {
    if (!clerkUser) {
      return 0;
    }

    try {
      // Get Clerk token for authentication with Supabase template
      const clerkToken = await getToken({ template: 'supabase' });

      if (!clerkToken) {
        return 0;
      }

      const { data, error } = await supabase.functions.invoke('credits', {
        method: 'GET',
        headers: { Authorization: `Bearer ${clerkToken}`, 'Content-Type': 'application/json' },
      });
      
      if (error) {
        console.error("Error fetching credit balance:", error);
        // Try to extract more specific error information
        if (error.message) {
          console.error("Error message:", error.message);
        }
        if (error.context) {
          console.error("Error context:", error.context);
        }
        return 0;
      }
      
      if (!data) {
        console.warn("No data received from credits function");
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
      setCreditBalance(balance);

      // Update the user profile state with the credit balance
      if (userProfile) {
        setUserProfile({
          ...userProfile,
          credits: balance,
        });
      }

      // Persist the credit balance onto profiles.credits for dashboard queries
      try {
        const supabaseWithAuth = createSupabaseClientWithClerkToken(clerkToken);
        await supabaseWithAuth
          .from('profiles')
          .update({ credits: balance })
          .eq('id', clerkUser.id);
      } catch (e) {
        console.warn('Unable to persist credits to profiles table:', e);
      }
      
      return balance;
    } catch (error) {
      console.error("Error fetching credit balance:", error);
      if (error instanceof Error) {
        console.error("Error details:", error.message, error.stack);
      }
      return 0;
    }
  }, [clerkUser, userProfile, getToken]);

  // Create or update user profile in Supabase when Clerk user changes
  useEffect(() => {
    const syncUserProfile = async () => {
      if (clerkUser) {
        try {
          // For native integration, we use the Clerk token with Supabase template
          const clerkToken = await getToken({ template: 'supabase' });
          
          if (!clerkToken) {
            throw new Error("No Clerk token available");
          }

          // Create a Supabase client with the Clerk token
          // This requires proper Clerk-Supabase JWT integration
          const supabaseWithAuth = createSupabaseClientWithClerkToken(clerkToken);
          

          // For native integration, we work directly with Clerk user data
          // and use the Clerk user ID for database operations
          const clerkUserId = clerkUser.id;
          
          // Check if user profile exists in Supabase
          const { data: existingProfile, error: fetchError } = await supabaseWithAuth
            .from('profiles')
            .select('*')
            .eq('id', clerkUserId)
            .single();

          if (fetchError && fetchError.code !== 'PGRST116') {
            throw fetchError;
          }

          if (!existingProfile) {
            // Profile doesn't exist, create it
            const { error: insertError } = await supabaseWithAuth
              .from('profiles')
              .insert({
                id: clerkUserId,
                email: clerkUser.primaryEmailAddress?.emailAddress || "",
                name: clerkUser.fullName || clerkUser.primaryEmailAddress?.emailAddress?.split("@")[0],
                avatar_url: clerkUser.imageUrl,
                subscription_status: "free",
              });

            if (insertError) throw insertError;

            setIsNewUser(true);
            const newUserProfile = {
              id: clerkUserId,
              email: clerkUser.primaryEmailAddress?.emailAddress || "",
              name: clerkUser.fullName || clerkUser.primaryEmailAddress?.emailAddress?.split("@")[0],
              avatar_url: clerkUser.imageUrl,
              subscription_status: "free",
              created_at: clerkUser.createdAt ? new Date(clerkUser.createdAt).toISOString() : undefined,
              credits: creditBalance || 0
            };
            setUserProfile(newUserProfile);
            
            // Set Sentry user context for new user
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
            
            // Identify user in PostHog
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
            // Profile exists, update it with latest Clerk data
            const { error: updateError } = await supabaseWithAuth
              .from('profiles')
              .update({
                email: clerkUser.primaryEmailAddress?.emailAddress || "",
                name: clerkUser.fullName || clerkUser.primaryEmailAddress?.emailAddress?.split("@")[0],
                avatar_url: clerkUser.imageUrl,
              })
              .eq('id', clerkUserId);

            if (updateError) throw updateError;

            const updatedUserProfile = {
              id: String(existingProfile.id),
              email: String(existingProfile.email),
              name: String(existingProfile.name),
              avatar_url: String(existingProfile.avatar_url),
              subscription_status: (existingProfile.subscription_status as "free" | "basic" | "premium") || "free",
              created_at: String(existingProfile.created_at),
              credits: creditBalance || 0
            };
            setUserProfile(updatedUserProfile);
            
            // Set Sentry user context for existing user
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
            
            // Identify user in PostHog
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
        } catch (error) {
          console.error("Error syncing user profile:", error);
          // Fall back to Clerk data on any error
          setUserProfile({
            id: clerkUser.id,
            email: clerkUser.primaryEmailAddress?.emailAddress || "",
            name: clerkUser.fullName || clerkUser.primaryEmailAddress?.emailAddress?.split("@")[0],
            avatar_url: clerkUser.imageUrl,
            subscription_status: "free",
            created_at: clerkUser.createdAt ? new Date(clerkUser.createdAt).toISOString() : undefined,
            credits: creditBalance || 0
          });
        }
      } else {
        setUserProfile(null);
        setIsNewUser(false);
        // Clear Sentry user context on sign out
        sentryService.setUser(null);
        sentryService.addBreadcrumb({
          category: 'auth',
          message: 'User signed out',
          level: 'info',
        });
        
        // Reset PostHog user identification
        posthogService.reset();
        posthogEvents.userSignedOut();
      }
    };

    if (isLoaded) {
      syncUserProfile().finally(() => {
        // After syncing profile, fetch and persist credit balance
        fetchCreditBalance().catch(() => {});
      });
    }
  }, [clerkUser, isLoaded, getToken, creditBalance, fetchCreditBalance]);

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
            credits: creditBalance || 0
          });
        }
      } catch (error) {
        console.error("Error refreshing user profile:", error);
      }
    }
  }, [clerkUser, creditBalance, getToken]);

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