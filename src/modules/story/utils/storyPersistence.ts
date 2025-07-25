import { supabase, createSupabaseClientWithClerkToken } from '@/core/integrations/supabase/client';
import { useClerkAuth } from '@/modules/auth/contexts/ClerkAuthContext';

// Edge function URLs
const SAVE_STORY_FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/save-story`;
const GET_USER_STORIES_FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-user-stories`;

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

// Save story to Supabase via edge function and localStorage
export const saveStory = async (story: string, name: string, date?: Date, prompt?: string, additionalData?: AdditionalStoryData, authToken?: string) => {
  try {
    let savedData;
    // Generate a UUID for the story if we don't have one from the server
    const localStoryId = crypto.randomUUID();
    
    // Try to save to Supabase via edge function if user is authenticated
    if (authToken) {
      try {
        console.log("Saving story to Supabase with auth token...");
        // User is authenticated, save to Supabase via edge function
        const response = await fetch(SAVE_STORY_FUNCTION_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            name,
            initial_story: story,
            birth_date: date?.toISOString(),
            prompt,
            ...additionalData
          })
        });

        const responseData = await response.json();

        if (response.ok) {
          savedData = responseData.story;
          console.log("Story saved to Supabase:", savedData);
        } else {
          const errorMessage = responseData.error || 'Unknown error';
          const errorDetails = responseData.details || {};
          console.error(`Error saving story to Supabase (${response.status}):`, errorMessage, errorDetails);
          
          // Throw a more detailed error
          throw new Error(`Failed to save story: ${errorMessage}`);
        }
      } catch (error) {
        console.error("Error calling save-story edge function:", error);
        throw error; // Re-throw to be caught by the outer try/catch
      }
    } else {
      console.log("No auth token provided, saving to localStorage only");
    }
    
    // Always save to localStorage as backup
    const storyData: StoryData = {
      name,
      birth_date: date?.toISOString(),
      initial_story: story,
      prompt,
      storyId: savedData?.id || localStoryId,
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
    
    // Ensure we return an object with either the server-generated ID or our local UUID
    return savedData || { 
      id: localStoryId,
      storyId: localStoryId,
      ...storyData
    };
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

// Get all user stories from Supabase via edge function
export const getUserStories = async (authToken?: string) => {
  try {
    if (!authToken) {
      console.log("No auth token, returning local story only");
      const localStory = getLocalStory();
      return localStory ? [localStory] : [];
    }
    
    const response = await fetch(GET_USER_STORIES_FUNCTION_URL, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });

    if (response.ok) {
      const result = await response.json();
      return result.stories || [];
    } else {
      console.error("Error fetching user stories:", response.statusText);
      // Fallback to local story
      const localStory = getLocalStory();
      return localStory ? [localStory] : [];
    }
  } catch (error) {
    console.error("Error in getUserStories:", error);
    // Fallback to local story
    const localStory = getLocalStory();
    return localStory ? [localStory] : [];
  }
};

// Get a specific story by ID
export const getStoryById = async (storyId: string, authToken?: string) => {
  // First try to fetch from Supabase via edge function
  if (authToken) {
    try {
      const response = await fetch(`${GET_USER_STORIES_FUNCTION_URL}?storyId=${storyId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.story) {
          return result.story;
        }
      }
    } catch (error) {
      console.error("Error fetching story from Supabase:", error);
    }
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
