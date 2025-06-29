import { supabase } from '@/integrations/supabase/client';

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
      storyId: savedData?.id || `local-${Date.now()}`,
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
    return storyData ? JSON.parse(storyData) : null;
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
  // Check if it's a local story ID
  if (storyId.startsWith('local-')) {
    const localStory = getLocalStory();
    return localStory?.storyId === storyId ? localStory : null;
  }
  
  // Otherwise fetch from Supabase
  try {
    const { data, error } = await supabase
      .from('stories')
      .select('*')
      .eq('id', storyId)
      .single();
      
    if (error) {
      console.error("Error fetching story by ID:", error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error("Error in getStoryById:", error);
    throw error;
  }
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
