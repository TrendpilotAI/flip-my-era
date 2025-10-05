import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from "react";
import { useUser, useAuth as useClerkAuthHook, SignInButton, SignUpButton, UserButton } from "@clerk/clerk-react";
import { supabase, getSupabaseSession, signOutFromSupabase, createSupabaseClientWithClerkToken } from "@/core/integrations/supabase/client";

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
  getToken: () => Promise<string | null>;
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
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  
  // Use refs to track mounted state and abort controllers
  const isMountedRef = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);
  const creditFetchControllerRef = useRef<AbortController | null>(null);

  // Cleanup function for component unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      // Cancel any pending requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (creditFetchControllerRef.current) {
        creditFetchControllerRef.current.abort();
      }
    };
  }, []);

  // Fetch credit balance using Supabase client with proper error handling and cancellation
  const fetchCreditBalance = useCallback(async (): Promise<number> => {
    if (!clerkUser) {
      console.log("No Clerk user available for credit balance fetch");
      return 0;
    }
    
    // Cancel any previous credit fetch
    if (creditFetchControllerRef.current) {
      creditFetchControllerRef.current.abort();
    }
    
    // Create new abort controller for this request
    creditFetchControllerRef.current = new AbortController();
    
    try {
      console.log("Fetching credit balance for user:", clerkUser.id);
      
      // Get Clerk token for authentication with Supabase template
      const clerkToken = await getToken({ template: 'supabase' });
      if (!clerkToken) {
        console.warn("No Clerk token available for credit balance fetch");
        return 0;
      }
      
      // Check if component is still mounted
      if (!isMountedRef.current) {
        return 0;
      }
      
      console.log("Got Clerk token, creating Supabase client...");
      
      // Use the regular supabase client with proper headers
      const { data, error } = await supabase.functions.invoke('credits', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${clerkToken}`,
        },
      });
      
      // Check if request was aborted or component unmounted
      if (!isMountedRef.current) {
        return 0;
      }
      
      if (error) {
        // Check if error is due to abort
        if (error.name === 'AbortError') {
          console.log("Credit balance fetch was cancelled");
          return creditBalance || 0;
        }
        
        console.error("Error fetching credit balance:", error);
        // Try to extract more specific error information
        if (error.message) {
          console.error("Error message:", error.message);
        }
        if (error.context) {
          console.error("Error context:", error.context);
        }
        return creditBalance || 0; // Return cached value on error
      }
      
      if (!data) {
        console.warn("No data received from credits function");
        return creditBalance || 0;
      }
      
      console.log("Credits function response:", data);
      
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
      
      console.log("Credit balance fetched:", balance);
      
      // Only update state if component is still mounted
      if (isMountedRef.current) {
        setCreditBalance(balance);
        
        // Update the user profile with the credit balance
        if (userProfile) {
          setUserProfile(prev => prev ? {
            ...prev,
            credits: balance
          } : null);
        }
      }
      
      return balance;
    } catch (error) {
      console.error("Error fetching credit balance:", error);
      if (error instanceof Error) {
        console.error("Error details:", error.message, error.stack);
      }
      return creditBalance || 0;
    } finally {
      // Clear the controller reference
      if (creditFetchControllerRef.current === creditFetchControllerRef.current) {
        creditFetchControllerRef.current = null;
      }
    }
  }, [clerkUser, userProfile, getToken, creditBalance]);

  // Create or update user profile in Supabase when Clerk user changes
  useEffect(() => {
    // Cancel any previous sync operation
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Create new abort controller for this sync
    abortControllerRef.current = new AbortController();
    
    const syncUserProfile = async () => {
      if (!clerkUser) {
        setUserProfile(null);
        setIsNewUser(false);
        return;
      }
      
      setIsProfileLoading(true);
      
      try {
        // For native integration, we use the Clerk token with Supabase template
        const clerkToken = await getToken({ template: 'supabase' });
        
        if (!clerkToken) {
          throw new Error("No Clerk token available");
        }
        
        // Check if component is still mounted
        if (!isMountedRef.current) {
          return;
        }

        // Create a Supabase client with the Clerk token
        // This requires proper Clerk-Supabase JWT integration
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
        
        // Check if component is still mounted
        if (!isMountedRef.current) {
          return;
        }

        if (fetchError && fetchError.code !== 'PGRST116') {
          throw fetchError;
        }

        if (!existingProfile) {
          // Profile doesn't exist, create it
          const newProfile = {
            id: clerkUserId,
            email: clerkUser.primaryEmailAddress?.emailAddress || "",
            name: clerkUser.fullName || clerkUser.primaryEmailAddress?.emailAddress?.split("@")[0],
            avatar_url: clerkUser.imageUrl,
            subscription_status: "free" as const,
          };
          
          const { error: insertError } = await supabaseWithAuth
            .from('profiles')
            .insert(newProfile);

          if (insertError) throw insertError;
          
          // Check if component is still mounted before updating state
          if (isMountedRef.current) {
            setIsNewUser(true);
            setUserProfile({
              ...newProfile,
              created_at: clerkUser.createdAt ? new Date(clerkUser.createdAt).toISOString() : undefined,
              credits: 0
            });
          }
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
          
          // Check if component is still mounted before updating state
          if (isMountedRef.current) {
            setUserProfile({
              id: String(existingProfile.id),
              email: String(existingProfile.email),
              name: String(existingProfile.name),
              avatar_url: String(existingProfile.avatar_url),
              subscription_status: (existingProfile.subscription_status as "free" | "basic" | "premium") || "free",
              created_at: String(existingProfile.created_at),
              credits: creditBalance || 0
            });
          }
        }
      } catch (error) {
        // Check if error is due to abort
        if (error instanceof Error && error.name === 'AbortError') {
          console.log("User profile sync was cancelled");
          return;
        }
        
        console.error("Error syncing user profile:", error);
        // Fall back to Clerk data on any error
        if (isMountedRef.current) {
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
      } finally {
        if (isMountedRef.current) {
          setIsProfileLoading(false);
        }
      }
    };

    if (isLoaded) {
      syncUserProfile();
    }
    
    // Cleanup function
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [clerkUser, isLoaded, getToken, creditBalance]);

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
    if (!clerkUser || !isMountedRef.current) {
      return;
    }
    
    try {
      // Get Clerk token for authentication with Supabase template
      const clerkToken = await getToken({ template: 'supabase' });
      if (!clerkToken) {
        console.warn("No Clerk token available for user refresh");
        return;
      }
      
      // Check if component is still mounted
      if (!isMountedRef.current) {
        return;
      }
      
      // Create authenticated Supabase client
      const supabaseWithAuth = createSupabaseClientWithClerkToken(clerkToken);
      
      const { data: profile } = await supabaseWithAuth
        .from('profiles')
        .select('*')
        .eq('id', clerkUser.id)
        .single();
      
      // Check if component is still mounted before updating state
      if (profile && isMountedRef.current) {
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
      // Cancel any pending operations
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (creditFetchControllerRef.current) {
        creditFetchControllerRef.current.abort();
      }
      
      // Sign out from both Clerk and Supabase
      await signOutFromSupabase();
      await clerkSignOut();
      
      // Clear state
      setUserProfile(null);
      setIsNewUser(false);
      setCreditBalance(null);
      
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const handleSignInWithGoogle = async () => {
    // This will be handled by Clerk's SignInButton component with OAuth
    return { error: new Error("Use SignInButton component for Google authentication") };
  };

  const isLoading = !isLoaded || isProfileLoading;
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