import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { useUser, useAuth as useClerkAuthHook, SignInButton, SignUpButton, UserButton } from "@clerk/clerk-react";
import { supabase, getSupabaseSession, signOutFromSupabase } from "@/core/integrations/supabase/client";

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  subscription_status?: "free" | "basic" | "premium";
  created_at?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, name?: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  refreshUser: () => Promise<void>;
  isNewUser: boolean;
  setIsNewUser: (value: boolean) => void;
  SignInButton: typeof SignInButton;
  SignUpButton: typeof SignUpButton;
  UserButton: typeof UserButton;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const ClerkAuthProvider = ({ children }: { children: ReactNode }) => {
  const { user: clerkUser, isLoaded } = useUser();
  const { signOut: clerkSignOut, getToken } = useClerkAuthHook();
  const [isNewUser, setIsNewUser] = useState(false);
  const [userProfile, setUserProfile] = useState<AuthUser | null>(null);

  // Create or update user profile in Supabase when Clerk user changes
  useEffect(() => {
    const syncUserProfile = async () => {
      if (clerkUser) {
        try {
          // Get Clerk session token for Supabase
          const clerkToken = await getToken();
          
          if (!clerkToken) {
            throw new Error("No Clerk token available");
          }

          // Sign in to Supabase using Clerk token
          const { data, error } = await supabase.auth.signInWithIdToken({
            provider: 'clerk',
            token: clerkToken,
          });

          if (error) {
            console.error("Error signing in to Supabase with Clerk token:", error);
            throw error;
          }

          if (!data.user) {
            throw new Error("No Supabase user returned after sign in");
          }

          // Check if user profile exists in Supabase
          const { data: existingProfile, error: fetchError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();

          if (fetchError && fetchError.code !== 'PGRST116') {
            throw fetchError;
          }

          if (!existingProfile) {
            // Profile doesn't exist, create it
            const { error: insertError } = await supabase
              .from('profiles')
              .insert({
                id: data.user.id,
                email: clerkUser.primaryEmailAddress?.emailAddress || "",
                name: clerkUser.fullName || clerkUser.primaryEmailAddress?.emailAddress?.split("@")[0],
                avatar_url: clerkUser.imageUrl,
                subscription_status: "free",
              });

            if (insertError) throw insertError;

            setIsNewUser(true);
            setUserProfile({
              id: data.user.id,
              email: clerkUser.primaryEmailAddress?.emailAddress || "",
              name: clerkUser.fullName || clerkUser.primaryEmailAddress?.emailAddress?.split("@")[0],
              avatar_url: clerkUser.imageUrl,
              subscription_status: "free",
              created_at: data.user.created_at,
            });
          } else {
            // Profile exists, update it with latest Clerk data
            const { error: updateError } = await supabase
              .from('profiles')
              .update({
                email: clerkUser.primaryEmailAddress?.emailAddress || "",
                name: clerkUser.fullName || clerkUser.primaryEmailAddress?.emailAddress?.split("@")[0],
                avatar_url: clerkUser.imageUrl,
              })
              .eq('id', data.user.id);

            if (updateError) throw updateError;

            setUserProfile({
              id: existingProfile.id,
              email: existingProfile.email,
              name: existingProfile.name,
              avatar_url: existingProfile.avatar_url,
              subscription_status: existingProfile.subscription_status || "free",
              created_at: existingProfile.created_at,
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
          });
        }
      } else {
        setUserProfile(null);
        setIsNewUser(false);
      }
    };

    if (isLoaded) {
      syncUserProfile();
    }
  }, [clerkUser, isLoaded, getToken]);

  // Use Supabase profile data if available, otherwise fall back to Clerk data
  const user: AuthUser | null = userProfile || (clerkUser ? {
    id: clerkUser.id,
    email: clerkUser.primaryEmailAddress?.emailAddress || "",
    name: clerkUser.fullName || clerkUser.primaryEmailAddress?.emailAddress?.split("@")[0],
    avatar_url: clerkUser.imageUrl,
    subscription_status: "free", // Default to free, can be updated from database
    created_at: clerkUser.createdAt ? new Date(clerkUser.createdAt).toISOString() : undefined,
  } : null);

  const refreshUser = useCallback(async () => {
    // Refresh user profile from Supabase
    if (clerkUser) {
      try {
        const session = await getSupabaseSession();
        if (!session?.user) return;

        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profile) {
          setUserProfile({
            id: profile.id,
            email: profile.email,
            name: profile.name,
            avatar_url: profile.avatar_url,
            subscription_status: profile.subscription_status || "free",
            created_at: profile.created_at,
          });
        }
      } catch (error) {
        console.error("Error refreshing user profile:", error);
      }
    }
  }, [clerkUser]);

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
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const handleSignInWithGoogle = async () => {
    // This will be handled by Clerk's SignInButton component with OAuth
    return { error: new Error("Use SignInButton component for Google authentication") };
  };

  const isLoading = !isLoaded;
  const isAuthenticated = !!user;

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    signIn: handleSignIn,
    signUp: handleSignUp,
    signOut: handleSignOut,
    signInWithGoogle: handleSignInWithGoogle,
    refreshUser,
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

export const useClerkAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useClerkAuth must be used within a ClerkAuthProvider');
  }
  return context;
};