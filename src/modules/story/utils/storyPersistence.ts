import { supabase, createSupabaseClientWithClerkToken } from '@/core/integrations/supabase/client';
import { useClerkAuth } from '@/modules/auth/contexts/ClerkAuthContext';

// Local storage keys
const STORY_DATA_KEY = 'flip_my_era_story_data';
const USER_PREFERENCES_KEY = 'flip_my_era_user_preferences';

// Types
interface StoryData {
  name: string;
  birth_date?: string;
  initial_story: string;
  prompt?: string;
  storyId?: string;
  transformedName?: string;
  gender?: string;
  personalityType?: string;
  location?: string;
}

interface UserPreferences {
  name: string;
  birth_date?: string;
  gender?: string;
  personalityType?: string;
  location?: string;
}

interface AdditionalStoryData {
  transformedName?: string;
  gender?: string;
  personalityType?: string;
  location?: string;
  [key: string]: string | number | boolean | undefined; // More specific types for additional properties
}

// Save story to Supabase and localStorage
export const saveStory = async (story: string, name: string, date?: Date, prompt?: string, additionalData?: AdditionalStoryData) => {
  try {
    // First try to save to Supabase if user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    
    let savedData;
    
    if (session) {
      // User is authenticated, save to Supabase
      const { data, error } = await supabase
        .from('stories')
        .insert({
          name,
          birth_date: date?.toISOString(),
          initial_story: story,
          prompt: prompt,
          user_id: session.user.id,
          ...additionalData
        })
        .select()
        .single();

      if (error) {
        console.error("Error saving story to Supabase:", error);
        // Continue to save locally even if Supabase fails
      } else {
        savedData = data;
        console.log("Story saved to Supabase:", data);
      }
    }
    
    // Always save to localStorage as backup
    const storyData: StoryData = {
      name,
      birth_date: date?.toISOString(),
      initial_story: story,
      prompt,
      storyId: savedData?.id || crypto.randomUUID(),
      ...additionalData
    };
    
    localStorage.setItem(STORY_DATA_KEY, JSON.stringify(storyData));
    console.log("Story saved to localStorage");
    
    // Save user preferences for future use
    const userPreferences: UserPreferences = {
      name,
      birth_date: date?.toISOString(),
      gender: additionalData?.gender,
      personalityType: additionalData?.personalityType,
      location: additionalData?.location
    };
    
    localStorage.setItem(USER_PREFERENCES_KEY, JSON.stringify(userPreferences));
    
    return savedData || storyData;
  } catch (error) {
    console.error("Error in saveStory:", error);
    throw error;
  }
};

// Get the most recent story from localStorage
export const getLocalStory = (): StoryData | null => {
  try {
    const storyData = localStorage.getItem(STORY_DATA_KEY);
    if (!storyData) return null;
    
    const parsedData = JSON.parse(storyData);
    
    // Check if the storyId is in the old "local-" format and clear it
    if (parsedData.storyId && parsedData.storyId.startsWith('local-')) {
      console.log('Clearing old localStorage data with invalid ID format');
      localStorage.removeItem(STORY_DATA_KEY);
      return null;
    }
    
    return parsedData;
  } catch (error) {
    console.error("Error retrieving local story:", error);
    return null;
  }
};

// Get user preferences from localStorage
export const getUserPreferences = (): UserPreferences | null => {
  try {
    const preferences = localStorage.getItem(USER_PREFERENCES_KEY);
    return preferences ? JSON.parse(preferences) : null;
  } catch (error) {
    console.error("Error retrieving user preferences:", error);
    return null;
  }
};

// Get all user stories from Supabase
export const getUserStories = async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      console.log("No active session, returning local story only");
      const localStory = getLocalStory();
      return localStory ? [localStory] : [];
    }
    
    const { data, error } = await supabase
      .from('stories')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error("Error fetching user stories:", error);
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error("Error in getUserStories:", error);
    throw error;
  }
};

// Get a specific story by ID
export const getStoryById = async (storyId: string) => {
  // First try to fetch from Supabase
  try {
    const { data, error } = await supabase
      .from('stories')
      .select('*')
      .eq('id', storyId)
      .single();
      
    if (!error && data) {
      return data;
    }
  } catch (error) {
    console.error("Error fetching story from Supabase:", error);
  }
  
  // If not found in Supabase, check local storage
  const localStory = getLocalStory();
  return localStory?.storyId === storyId ? localStory : null;
};

// Update user subscription status
export const updateSubscription = async (userId: string, subscriptionStatus: "free" | "basic" | "premium") => {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ subscription_status: subscriptionStatus })
      .eq('id', userId);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error("Error updating subscription:", error);
    return { error: error as Error };
  }
};

// Add credits to user account (for credit-based purchases)
export const addCreditsToUser = async (
  userId: string, 
  creditAmount: number, 
  purchaseType: string = "credit_purchase",
  sessionToken?: string
) => {
  try {
    // Use authenticated Supabase client if session token is provided
    const supabaseClient = sessionToken 
      ? createSupabaseClientWithClerkToken(sessionToken)
      : supabase;
    
    // First, get or create user's credit record
    const { data: creditData, error: creditError } = await supabaseClient
      .from('user_credits')
      .select('balance, total_earned')
      .eq('user_id', userId)
      .single();

    let currentBalance = 0;
    let totalEarned = 0;

    if (creditError && creditError.code === 'PGRST116') {
      // No credit record exists, create one
      const { data: newCredit, error: createError } = await supabaseClient
        .from('user_credits')
        .insert({
          user_id: userId,
          balance: creditAmount,
          total_earned: creditAmount,
          total_spent: 0
        })
        .select('balance, total_earned')
        .single();

      if (createError) throw createError;
      currentBalance = newCredit.balance as number;
      totalEarned = newCredit.total_earned as number;
    } else if (!creditError) {
      // Update existing credit record
      currentBalance = (creditData.balance as number) + creditAmount;
      totalEarned = ((creditData.total_earned as number) || 0) + creditAmount;

      const { error: updateError } = await supabaseClient
        .from('user_credits')
        .update({
          balance: currentBalance,
          total_earned: totalEarned,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (updateError) throw updateError;
    } else {
      throw creditError;
    }

    // Create credit transaction record
    const { error: transactionError } = await supabaseClient
      .from('credit_transactions')
      .insert({
        user_id: userId,
        amount: creditAmount,
        transaction_type: 'purchase',  // Changed from 'purchase_single' to 'purchase'
        description: `${purchaseType}: ${creditAmount} credit${creditAmount > 1 ? 's' : ''} added`,
        balance_after_transaction: currentBalance,
        metadata: {
          purchase_type: purchaseType,
          credits_added: creditAmount
        }
      });

    if (transactionError) throw transactionError;

    return { error: null, newBalance: currentBalance };
  } catch (error) {
    console.error("Error adding credits to user:", error);
    return { error: error as Error };
  }
};
