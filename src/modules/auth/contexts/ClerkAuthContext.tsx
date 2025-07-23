import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { useUser, useAuth as useClerkAuthHook, SignInButton, SignUpButton, UserButton } from "@clerk/clerk-react";
import { supabase, getSupabaseSession, signOutFromSupabase, createSupabaseClientWithClerkToken, clearAuthenticatedInstance } from "@/core/integrations/supabase/client";

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  subscription_status?: "free" | "basic" | "premium";
  created_at?: string;
  credits?: number;
}

// Define the Supabase profile type
interface ProfileType {
  id: string;
  email: string;
  name: string;
  avatar_url: string;
  subscription_status: "free" | "basic" | "premium";
  created_at: string;
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
  fetchCreditBalance: () => Promise<number>;
  getToken: (options?: { template?: string }) => Promise<string | null>;
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
  const [creditBalance, setCreditBalance] = useState<number | null>(null);

  // Fetch credit balance using Supabase client
  const fetchCreditBalance = useCallback(async (): Promise<number> => {
    if (!clerkUser) return 0;
    
    try {
      console.log("Fetching credit balance...");
      
      // Get Clerk token for authentication
      const clerkToken = await getToken({ template: 'supabase' });
      if (!clerkToken) {
        console.warn("No Clerk token available for credit balance fetch");
        return 0;
      }
      
      // Create authenticated Supabase client
      const supabaseWithAuth = createSupabaseClientWithClerkToken(clerkToken);
      
      // Call the credits function using fetch
      const response = await fetch('/api/functions/credits', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${clerkToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.error("Error fetching credit balance:", response.status, response.statusText);
        
        // In development, return mock data if Edge Functions are not available
        if (import.meta.env.DEV && response.status === 503) {
          console.log("Using mock credit balance for development");
          const mockBalance = 5; // Mock balance for development
          setCreditBalance(mockBalance);
          return mockBalance;
        }
        
        return 0;
      }

      const data = await response.json();
      
      if (!data?.success || !data?.data?.balance) {
        console.warn("No credit balance data received");
        
        // In development, return mock data if no real data
        if (import.meta.env.DEV) {
          console.log("Using mock credit balance for development");
          const mockBalance = 5; // Mock balance for development
          setCreditBalance(mockBalance);
          return mockBalance;
        }
        
        return 0;
      }
      
      const balance = data.data.balance.balance || 0;
      console.log("Credit balance fetched:", balance);
      setCreditBalance(balance);
      
      return balance;
    } catch (error) {
      console.error("Error fetching credit balance:", error);
      return 0;
    }
  }, [clerkUser]);

  // Fetch credit balance when user is loaded
  useEffect(() => {
    if (clerkUser && isLoaded) {
      fetchCreditBalance();
    }
  }, [clerkUser, isLoaded, fetchCreditBalance]);

  // Update user profile with credit balance when it changes
  useEffect(() => {
    if (userProfile && creditBalance !== null) {
      setUserProfile(prevProfile => ({
        ...prevProfile,
        credits: creditBalance
      }));
    }
  }, [creditBalance]);

  // Create or update user profile in Supabase when Clerk user changes
  useEffect(() => {
    const syncUserProfile = async () => {
      if (clerkUser) {
        try {
          // For native integration, we use the regular Clerk session token
          const clerkToken = await getToken({ template: 'supabase' });
          
          if (!clerkToken) {
            throw new Error("No Clerk token available");
          }

          // Create a Supabase client with the Clerk token
          // This is the recommended approach for native integration
          const supabaseWithAuth = createSupabaseClientWithClerkToken(clerkToken);
          
          console.log("Supabase client created with Clerk token");

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
            setUserProfile({
              id: clerkUserId,
              email: clerkUser.primaryEmailAddress?.emailAddress || "",
              name: clerkUser.fullName || clerkUser.primaryEmailAddress?.emailAddress?.split("@")[0],
              avatar_url: clerkUser.imageUrl,
              subscription_status: "free",
              created_at: clerkUser.createdAt ? new Date(clerkUser.createdAt).toISOString() : undefined,
              credits: 0 // Will be updated separately by fetchCreditBalance
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

            setUserProfile({
              id: String(existingProfile.id),
              email: String(existingProfile.email),
              name: String(existingProfile.name),
              avatar_url: String(existingProfile.avatar_url),
              subscription_status: (existingProfile.subscription_status as "free" | "basic" | "premium") || "free",
              created_at: String(existingProfile.created_at),
              credits: 0 // Will be updated separately by fetchCreditBalance
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
            credits: 0 // Will be updated separately by fetchCreditBalance
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
    created_at: clerkUser.createdAt ? new Date(clerkUser.createdAt).toISOString() : undefined,
    credits: creditBalance || 0
  } : null);

    const refreshUser = useCallback(async () => {
    // Refresh user profile from Supabase
    if (clerkUser) {
      try {
        // Get Clerk token for authentication
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
            name: String(profile.name),
            avatar_url: String(profile.avatar_url),
            subscription_status: (profile.subscription_status as "free" | "basic" | "premium") || "free",
            created_at: String(profile.created_at),
            credits: 0 // Will be updated separately by fetchCreditBalance
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
      setCreditBalance(null);
      // Clear the authenticated Supabase instance to prevent multiple instances
      clearAuthenticatedInstance();
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
    fetchCreditBalance,
    getToken,
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