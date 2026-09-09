import {
  getOwnStory,
  listOwnStories,
  saveOwnStory,
} from '@/core/integrations/supabase/userData';
import { getSession } from '@/lib/auth-client';

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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function hasBetterAuthSession(sessionResult: unknown): boolean {
  if (!isRecord(sessionResult) || !isRecord(sessionResult.data)) return false;
  if (!isRecord(sessionResult.data.user)) return false;
  return typeof sessionResult.data.session === 'object' && sessionResult.data.session !== null;
}

// Save story to Supabase and localStorage
export const saveStory = async (story: string, name: string, date?: Date, prompt?: string, additionalData?: AdditionalStoryData) => {
  try {
    // First try to save to Supabase if user is authenticated
    const sessionResult = await getSession();

    let savedData;

    if (hasBetterAuthSession(sessionResult)) {
      try {
        savedData = await saveOwnStory({
          name,
          birthDate: date?.toISOString(),
          initialStory: story,
          prompt,
          transformedName: additionalData?.transformedName,
          gender: additionalData?.gender,
          personalityType: additionalData?.personalityType,
          location: additionalData?.location,
        });
        console.log("Story saved to Supabase");
      } catch (error) {
        console.error("Error saving story to Supabase:", error);
        // Continue to save locally even if Supabase fails
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
    const sessionResult = await getSession();

    if (!hasBetterAuthSession(sessionResult)) {
      console.log("No active session, returning local story only");
      const localStory = getLocalStory();
      return localStory ? [localStory] : [];
    }

    return await listOwnStories();
  } catch (error) {
    console.error("Error in getUserStories:", error);
    throw error;
  }
};

// Get a specific story by ID
export const getStoryById = async (storyId: string) => {
  // First try to fetch from Supabase
  try {
    const data = await getOwnStory(storyId);
    if (data) return data;
  } catch (error) {
    console.error("Error fetching story from Supabase:", error);
  }
  
  // If not found in Supabase, check local storage
  const localStory = getLocalStory();
  return localStory?.storyId === storyId ? localStory : null;
};

// Update user subscription status
export const updateSubscription = async (userId: string, subscriptionStatus: "free" | "basic" | "premium") => {
  void userId;
  void subscriptionStatus;
  const error = new Error('Subscription status can only be updated by the billing service');
  console.error("Error updating subscription:", error);
  return { error };
};
