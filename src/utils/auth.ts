import { supabase } from "@/integrations/supabase/client";      
import { User, Session } from "@supabase/supabase-js";

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  subscription_status?: "free" | "basic" | "premium";
}

// Sign up with email and password
export const signUp = async (email: string, password: string, name?: string): Promise<{ user: AuthUser | null; error: Error | null }> => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
        },
      },
    });

    if (error) throw error;

    if (data.user) {
      // Create a user profile in the profiles table
      const { error: profileError } = await supabase
        .from("profiles")
        .insert({
          id: data.user.id,
          email: data.user.email,
          name: name || data.user.email?.split("@")[0],
          subscription_status: "free",
        });

      if (profileError) throw profileError;

      return {
        user: {
          id: data.user.id,
          email: data.user.email || "",
          name: name || data.user.email?.split("@")[0],
          subscription_status: "free",
        },
        error: null,
      };
    }

    return { user: null, error: new Error("User creation failed") };
  } catch (error) {
    console.error("Sign up error:", error);
    return { user: null, error: error as Error };
  }
};

// Sign in with email and password
export const signIn = async (email: string, password: string): Promise<{ user: AuthUser | null; error: Error | null }> => {
  try {
    console.log("Attempting to sign in with email:", email);
    
    // First try with default options
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("Sign in error:", error);
      
      // If the error is related to captcha, try a different approach
      if (error.message.includes("captcha") || error.message.includes("Captcha")) {
        console.log("Captcha error detected, trying alternative sign-in method");
        
        // Try signing in with email OTP as a fallback
        const { error: otpError } = await supabase.auth.signInWithOtp({
          email,
          options: {
            shouldCreateUser: false,
          }
        });
        
        if (otpError) {
          console.error("OTP sign in error:", otpError);
          throw otpError;
        }
        
        return { 
          user: null, 
          error: new Error("A magic link has been sent to your email. Please check your inbox to complete sign-in.") 
        };
      }
      
      throw error;
    }

    if (data.user) {
      // Get user profile data
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", data.user.id)
        .single();

      if (profileError && profileError.code !== "PGRST116") throw profileError;

      return {
        user: {
          id: data.user.id,
          email: data.user.email || "",
          name: profileData?.name || data.user.email?.split("@")[0],
          avatar_url: profileData?.avatar_url,
          subscription_status: profileData?.subscription_status || "free",
        },
        error: null,
      };
    }

    return { user: null, error: new Error("Sign in failed") };
  } catch (error) {
    console.error("Sign in error:", error);
    return { user: null, error: error as Error };
  }
};

// Sign in with Google
export const signInWithGoogle = async (): Promise<{ error: Error | null }> => {
  try {
    console.log("Starting Google sign-in process");
    
    // Determine if we're in development or production
    const isDevelopment = import.meta.env.DEV;
    
    // Use a specific redirect URL for development
    const redirectUrl = isDevelopment 
      ? `${window.location.protocol}//${window.location.hostname}:${window.location.port}/auth/callback`
      : `${window.location.origin}/auth/callback`;
    
    console.log("Using redirect URL:", redirectUrl);
    
    // Instead of using the default Supabase OAuth flow, we'll construct a Google OAuth URL directly
    // This will bypass the Supabase domain being shown to the user
    
    // Get the Google auth URL from Supabase but don't redirect yet
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: redirectUrl,
        skipBrowserRedirect: true, // Important: don't redirect automatically
        queryParams: {
          access_type: 'offline',
          prompt: 'consent'
        }
      }
    });
    
    if (error) {
      console.error("Google sign-in error details:", error);
      throw new Error(`Google authentication failed: ${error.message}. Please try again or use another sign-in method.`);
    }
    
    // If we have a URL, redirect to it manually
    if (data?.url) {
      console.log("Redirecting to Google OAuth URL:", data.url);
      // This will show the Google consent screen directly without showing the Supabase domain
      window.location.href = data.url;
    } else {
      throw new Error("Failed to get authentication URL from provider");
    }

    return { error: null };
  } catch (error) {
    console.error("Google sign in error:", error);
    return { error: error as Error };
  }
};

// Sign out
export const signOut = async (): Promise<{ error: Error | null }> => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error(`Sign out failed: ${error.message}. Please try again or refresh the page.`);
    return { error: null };
  } catch (error) {
    console.error("Sign out error:", error);
    return { error: error as Error };
  }
};

// Get current user
export const getCurrentUser = async (): Promise<{ user: AuthUser | null; error: Error | null }> => {
  try {
    const { data, error } = await supabase.auth.getUser();
    
    if (error) throw error;
    
    if (data.user) {
      // Get user profile data
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", data.user.id)
        .single();

      if (profileError && profileError.code !== "PGRST116") throw profileError;

      return {
        user: {
          id: data.user.id,
          email: data.user.email || "",
          name: profileData?.name || data.user.email?.split("@")[0],
          avatar_url: profileData?.avatar_url,
          subscription_status: profileData?.subscription_status || "free",
        },
        error: null,
      };
    }

    return { user: null, error: null };
  } catch (error) {
    console.error("Get current user error:", error);
    return { user: null, error: error as Error };
  }
};

// Reset password
export const resetPassword = async (email: string): Promise<{ error: Error | null }> => {
  try {
    // Determine if we're in development or production
    const isDevelopment = import.meta.env.DEV;
    
    // Use a specific redirect URL for development
    const redirectUrl = isDevelopment 
      ? `${window.location.protocol}//${window.location.hostname}:${window.location.port}/reset-password`
      : `${window.location.origin}/reset-password`;
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });
    
    if (error) throw error;
    
    return { error: null };
  } catch (error) {
    console.error("Reset password error:", error);
    return { error: error as Error };
  }
};

// Update user profile
export const updateProfile = async (
  userId: string,
  updates: { name?: string; avatar_url?: string }
): Promise<{ error: Error | null }> => {
  try {
    const { error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", userId);
    
    if (error) throw error;
    
    return { error: null };
  } catch (error) {
    console.error("Update profile error:", error);
    return { error: error as Error };
  }
};

// Update subscription status
export const updateSubscription = async (
  userId: string,
  status: "free" | "basic" | "premium"
): Promise<{ error: Error | null }> => {
  try {
    const { error } = await supabase
      .from("profiles")
      .update({ subscription_status: status })
      .eq("id", userId);
    
    if (error) throw error;
    
    return { error: null };
  } catch (error) {
    console.error("Update subscription error:", error);
    return { error: error as Error };
  }
}; 