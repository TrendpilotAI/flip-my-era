import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AuthUser, getCurrentUser, signIn, signUp, signOut, signInWithGoogle } from "@/utils/auth";

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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isNewUser, setIsNewUser] = useState(false);
  const [lastAuthEvent, setLastAuthEvent] = useState<string | null>(null);

  const refreshUser = useCallback(async () => {
    try {
      const { user: currentUser, error } = await getCurrentUser();
      
      if (error) {
        console.error("Error refreshing user:", error);
        return;
      }
      
      // If this is a new user (first sign in), mark them as new
      if (currentUser && !user && lastAuthEvent === "SIGNED_IN") {
        setIsNewUser(true);
      }
      
      setUser(currentUser);
    } catch (error) {
      console.error("Error in refreshUser:", error);
    }
  }, [user, lastAuthEvent]);

  useEffect(() => {
    // Check for user on initial load
    const initAuth = async () => {
      setIsLoading(true);
      try {
        await refreshUser();
      } catch (error) {
        console.error("Error initializing auth:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    // Set up auth state listener
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (import.meta.env.MODE === 'development') {
        console.log("Auth state change:", event);
      }
      
      setLastAuthEvent(event);
      
      // Handle different auth events
      switch (event) {
        case "SIGNED_IN":
          await refreshUser();
          break;
        case "SIGNED_OUT":
          setUser(null);
          setIsNewUser(false);
          break;
        case "USER_UPDATED":
          await refreshUser();
          break;
        case "PASSWORD_RECOVERY":
          // Handle password recovery if needed
          break;
        default:
          break;
      }
    });

    // Clean up the listener on unmount
    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [refreshUser]);

  const handleSignIn = async (email: string, password: string) => {
    const { user: authUser, error } = await signIn(email, password);
    if (!error && authUser) {
      setUser(authUser);
    }
    return { error };
  };

  const handleSignUp = async (email: string, password: string, name?: string) => {
    const { user: authUser, error } = await signUp(email, password, name);
    if (!error && authUser) {
      setUser(authUser);
      setIsNewUser(true);
    }
    return { error };
  };

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (!error) {
      setUser(null);
      setIsNewUser(false);
    }
    return { error };
  };

  const handleSignInWithGoogle = async () => {
    return await signInWithGoogle();
  };

  const value = {
    user,
    isLoading,
    isAuthenticated: !!user,
    signIn: handleSignIn,
    signUp: handleSignUp,
    signOut: handleSignOut,
    signInWithGoogle: handleSignInWithGoogle,
    refreshUser,
    isNewUser,
    setIsNewUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}; 