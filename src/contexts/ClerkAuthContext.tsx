import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { useUser, useAuth as useClerkAuthHook, SignInButton, SignUpButton, UserButton } from "@clerk/clerk-react";
import { supabase } from "@/integrations/supabase/client";

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  subscription_status?: "free" | "basic" | "premium";
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
  const { signOut: clerkSignOut } = useClerkAuthHook();
  const [isNewUser, setIsNewUser] = useState(false);
  const [userProfile, setUserProfile] = useState<AuthUser | null>(null);

  // Create or update user profile in Supabase when Clerk user changes
  useEffect(() => {
    const syncUserProfile = async () => {
      if (clerkUser) {
        try {
          // Check if user profile exists in Supabase
          const { data: existingProfile, error: fetchError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', clerkUser.id)
            .single();

          if (fetchError) {
            if (fetchError.code === 'PGRST116') {
              // Profile doesn't exist, try to create it
              const { error: insertError } = await supabase
                .from('profiles')
                .insert({
                  id: clerkUser.id,
                  email: clerkUser.primaryEmailAddress?.emailAddress || "",
                  name: clerkUser.fullName || clerkUser.primaryEmailAddress?.emailAddress?.split("@")[0],
                  avatar_url: clerkUser.imageUrl,
                  subscription_status: "free",
                });

              if (insertError) {
                console.error("Error creating user profile:", insertError);
                // Fall back to Clerk data if Supabase fails
                setUserProfile({
                  id: clerkUser.id,
                  email: clerkUser.primaryEmailAddress?.emailAddress || "",
                  name: clerkUser.fullName || clerkUser.primaryEmailAddress?.emailAddress?.split("@")[0],
                  avatar_url: clerkUser.imageUrl,
                  subscription_status: "free",
                });
              } else {
                setIsNewUser(true);
                setUserProfile({
                  id: clerkUser.id,
                  email: clerkUser.primaryEmailAddress?.emailAddress || "",
                  name: clerkUser.fullName || clerkUser.primaryEmailAddress?.emailAddress?.split("@")[0],
                  avatar_url: clerkUser.imageUrl,
                  subscription_status: "free",
                });
              }
            } else {
              // Other error (like 401), fall back to Clerk data
              console.warn("Supabase profile sync failed, using Clerk data:", fetchError);
              setUserProfile({
                id: clerkUser.id,
                email: clerkUser.primaryEmailAddress?.emailAddress || "",
                name: clerkUser.fullName || clerkUser.primaryEmailAddress?.emailAddress?.split("@")[0],
                avatar_url: clerkUser.imageUrl,
                subscription_status: "free",
              });
            }
          } else if (existingProfile) {
            // Profile exists, update it with latest Clerk data
            const { error: updateError } = await supabase
              .from('profiles')
              .update({
                email: clerkUser.primaryEmailAddress?.emailAddress || "",
                name: clerkUser.fullName || clerkUser.primaryEmailAddress?.emailAddress?.split("@")[0],
                avatar_url: clerkUser.imageUrl,
              })
              .eq('id', clerkUser.id);

            if (updateError) {
              console.error("Error updating user profile:", updateError);
            }

            setUserProfile({
              id: existingProfile.id,
              email: existingProfile.email,
              name: existingProfile.name,
              avatar_url: existingProfile.avatar_url,
              subscription_status: existingProfile.subscription_status || "free",
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
  }, [clerkUser, isLoaded]);

  // Use Supabase profile data if available, otherwise fall back to Clerk data
  const user: AuthUser | null = userProfile || (clerkUser ? {
    id: clerkUser.id,
    email: clerkUser.primaryEmailAddress?.emailAddress || "",
    name: clerkUser.fullName || clerkUser.primaryEmailAddress?.emailAddress?.split("@")[0],
    avatar_url: clerkUser.imageUrl,
    subscription_status: "free", // Default to free, can be updated from database
  } : null);

  const refreshUser = useCallback(async () => {
    // Refresh user profile from Supabase
    if (clerkUser) {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', clerkUser.id)
          .single();

        if (profile) {
          setUserProfile({
            id: profile.id,
            email: profile.email,
            name: profile.name,
            avatar_url: profile.avatar_url,
            subscription_status: profile.subscription_status || "free",
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

  const value = {
    user,
    isLoading: !isLoaded,
    isAuthenticated: !!user,
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

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useClerkAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useClerkAuth must be used within a ClerkAuthProvider");
  }
  return context;
}; 