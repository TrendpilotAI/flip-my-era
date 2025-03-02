import { createContext, useContext, useEffect, useState, ReactNode } from "react";
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

  const refreshUser = async () => {
    const { user: currentUser } = await getCurrentUser();
    
    // If this is a new user (first sign in), mark them as new
    if (currentUser && !user && lastAuthEvent === "SIGNED_IN") {
      setIsNewUser(true);
    }
    
    setUser(currentUser);
    return;
  };

  useEffect(() => {
    // Check for user on initial load
    const initAuth = async () => {
      setIsLoading(true);
      await refreshUser();
      setIsLoading(false);
    };

    initAuth();

    // Set up auth state listener
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state change:", event);
      setLastAuthEvent(event);
      
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        await refreshUser();
      } else if (event === "SIGNED_OUT") {
        setUser(null);
        setIsNewUser(false);
      }
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

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