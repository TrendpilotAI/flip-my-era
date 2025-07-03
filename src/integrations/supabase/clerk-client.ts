// Clerk-Supabase Integration Client
// Based on official Clerk documentation: https://clerk.com/docs/integrations/databases/supabase
// This client properly handles Clerk user IDs as TEXT fields in Supabase

import { createClient } from '@supabase/supabase-js';
import { useSession } from '@clerk/clerk-react';

// Environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY!;

// Create a custom Supabase client that injects the Clerk session token
export function createClerkSupabaseClient() {
  return createClient(supabaseUrl, supabaseAnonKey, {
    async accessToken() {
      // Get the current session from Clerk
      const session = await window.Clerk?.session;
      return session?.getToken() ?? null;
    },
  });
}

// Hook for using Clerk-Supabase client in React components
export function useClerkSupabaseClient() {
  const { session } = useSession();
  
  return createClient(supabaseUrl, supabaseAnonKey, {
    async accessToken() {
      return session?.getToken() ?? null;
    },
  });
}

// Utility function to ensure Clerk user ID is properly formatted
export function validateClerkUserId(userId: string): boolean {
  // Clerk user IDs start with 'user_' followed by alphanumeric characters
  return /^user_[a-zA-Z0-9]+$/.test(userId);
}

// Utility function to create a profile for a new Clerk user
export async function createUserProfile(userId: string, userData: {
  email: string;
  name?: string;
  avatar_url?: string;
}) {
  if (!validateClerkUserId(userId)) {
    throw new Error('Invalid Clerk user ID format');
  }

  const supabase = createClerkSupabaseClient();
  
  const { data, error } = await supabase
    .from('profiles')
    .insert({
      id: userId, // Use Clerk user ID as TEXT primary key
      email: userData.email,
      name: userData.name,
      avatar_url: userData.avatar_url,
      subscription_status: 'free',
      credits: 0
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating user profile:', error);
    throw error;
  }

  return data;
}

// Utility function to get user profile by Clerk user ID
export async function getUserProfile(userId: string) {
  if (!validateClerkUserId(userId)) {
    throw new Error('Invalid Clerk user ID format');
  }

  const supabase = createClerkSupabaseClient();
  
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId) // Query by Clerk user ID (TEXT field)
    .single();

  if (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }

  return data;
}

// Utility function to update user profile
export async function updateUserProfile(userId: string, updates: {
  name?: string;
  avatar_url?: string;
  subscription_status?: string;
  credits?: number;
}) {
  if (!validateClerkUserId(userId)) {
    throw new Error('Invalid Clerk user ID format');
  }

  const supabase = createClerkSupabaseClient();
  
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId) // Update by Clerk user ID (TEXT field)
    .select()
    .single();

  if (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }

  return data;
}

// Utility function to get user credits
export async function getUserCredits(userId: string) {
  if (!validateClerkUserId(userId)) {
    throw new Error('Invalid Clerk user ID format');
  }

  const supabase = createClerkSupabaseClient();
  
  const { data, error } = await supabase
    .from('user_credits')
    .select('*')
    .eq('user_id', userId) // Query by Clerk user ID (TEXT field)
    .single();

  if (error) {
    console.error('Error fetching user credits:', error);
    throw error;
  }

  return data;
}

// Utility function to get user credit transactions
export async function getUserCreditTransactions(userId: string, limit = 10) {
  if (!validateClerkUserId(userId)) {
    throw new Error('Invalid Clerk user ID format');
  }

  const supabase = createClerkSupabaseClient();
  
  const { data, error } = await supabase
    .from('credit_transactions')
    .select('*')
    .eq('user_id', userId) // Query by Clerk user ID (TEXT field)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching credit transactions:', error);
    throw error;
  }

  return data;
}

// Export the base client for direct use
export const supabase = createClerkSupabaseClient(); 