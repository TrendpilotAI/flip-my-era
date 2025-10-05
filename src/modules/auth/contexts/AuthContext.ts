import { createContext } from 'react';
import { SignInButton, SignUpButton, UserButton } from "@clerk/clerk-react";

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
export interface ProfileType {
  id: string;
  email: string;
  name: string;
  avatar_url: string;
  subscription_status: "free" | "basic" | "premium";
  created_at: string;
}

export interface AuthContextType {
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

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
