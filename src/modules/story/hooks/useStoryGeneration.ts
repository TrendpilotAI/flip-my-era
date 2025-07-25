import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/modules/shared/hooks/use-toast';
import { generateWithGroq } from '@/modules/shared/utils/groq';
import { getStarSign } from '@/modules/user/utils/starSigns';
import type { PersonalityTypeKey } from '@/modules/story/types/personality';
import { personalityTypes } from '@/modules/story/types/personality';
import { detectGender, transformName } from '@/modules/user/utils/genderUtils';
import { getRandomViralTropes, getRandomSceneSettings, generateStoryPrompt } from '@/modules/story/utils/storyPrompts';
import { saveStory, getLocalStory, getUserPreferences } from '@/modules/story/utils/storyPersistence';
import { useClerkAuth } from '@/modules/auth/contexts/ClerkAuthContext';

type GenderType = "same" | "flip" | "neutral";

interface StoryState {
  content: string;
  id: string;
}

interface SavedStory {
  id?: string;
  storyId?: string;
  initial_story: string;
  [key: string]: string | number | boolean | undefined;
}

export const useStoryGeneration = (loadSavedStory: boolean = true) => {
  const { isAuthenticated, getToken } = useClerkAuth();
  const [name, setName] = useState("");
  const [transformedName, setTransformedName] = useState("");
  const [date, setDate] = useState<Date>();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [personalityType, setPersonalityType] = useState<PersonalityTypeKey>("dreamer");
  const [gender, setGender] = useState<GenderType>("same");
  const [location, setLocation] = useState("");
  const [characterDescription, setCharacterDescription] = useState("");
  const [plotDescription, setPlotDescription] = useState("");
  const [detectedGender, setDetectedGender] = useState<GenderInfo>({ gender: 'unknown', probability: 0 });
  const [storyId, setStoryId] = useState<string>("");
  const [previousStory, setPreviousStory] = useState<StoryState | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  
  const navigate = useNavigate();
  const { toast } = useToast();

  // Load saved preferences and story data on initial render
  useEffect(() => {
    const loadSavedData = () => {
      try {
        // Load user preferences
        const preferences = getUserPreferences();
        if (preferences) {
          if (preferences.name) setName(preferences.name);
          if (preferences.birth_date) setDate(new Date(preferences.birth_date));
          if (preferences.gender as GenderType) setGender(preferences.gender as GenderType);
          if (preferences.personalityType as PersonalityTypeKey) {
            setPersonalityType(preferences.personalityType as PersonalityTypeKey);
          }
          if (preferences.location) setLocation(preferences.location);
        }
        
        // Load the most recent story only if loadSavedStory is true
        if (loadSavedStory) {
          const savedStory = getLocalStory();
          if (savedStory) {
            setResult(savedStory.initial_story);
            if (savedStory.storyId) setStoryId(savedStory.storyId);
          }
        }
        
        console.log("Loaded saved preferences and story data");
      } catch (error) {
        console.error("Error loading saved data:", error);
      } finally {
        setIsInitialized(true);
      }
    };
    
    loadSavedData();
  }, [loadSavedStory]);

  useEffect(() => {
    if (name) {
      detectGender(name).then(setDetectedGender);
    }
  }, [name]);

  useEffect(() => {
    if (name && detectedGender) {
      const updateTransformedName = async () => {
        try {
          const newTransformedName = await transformName(name, detectedGender, gender);
          setTransformedName(newTransformedName);
        } catch (error: unknown) {
          console.error('Error transforming name:', error);
          // Fallback to original name if transformation fails
          setTransformedName(name);
        }
      };
      
      updateTransformedName();
    }
  }, [name, detectedGender, gender]);

  const handleStorySelect = async (story: SavedStory) => {
    setPreviousStory({ content: result, id: storyId });
    setResult(story.initial_story);
    setStoryId(story.id || story.storyId || '');
  };

  const handleSubmit = async () => {
    if (result && storyId) {
      setPreviousStory({ content: result, id: storyId });
    }

    setLoading(true);
    setResult("");
    const loadingToast = toast({
      title: "Accessing the multiverse...",
      description: "Scanning infinite realities for your alternate life...",
    });

    try {
      const starSign = date ? getStarSign(date) : null;
      const selectedPersonality = personalityTypes[personalityType];
      const viralTropes: string[] = getRandomViralTropes();
      const sceneSettings = getRandomSceneSettings();
      
      const prompt = generateStoryPrompt(
        transformedName,
        date,
        detectedGender,
        gender,
        starSign,
        selectedPersonality,
        viralTropes,
        sceneSettings,
        location,
        characterDescription,
        plotDescription
      );

      const story = await generateWithGroq(prompt);
      loadingToast.dismiss();
      
      if (story) {
        setResult(story);
        
        // Generate a new storyId immediately so we have it available
        const newStoryId = crypto.randomUUID();
        setStoryId(newStoryId);
        
        // Save additional data along with the story
        const additionalData = {
          transformedName,
          gender,
          personalityType,
          location,
          characterDescription,
          plotDescription
        };
        
        try {
          const authToken = isAuthenticated ? await getToken({ template: 'supabase' }) : undefined;
          const savedStory = await saveStory(story, name, date, prompt, additionalData, authToken);
          // Update storyId with the one from the server if available
          if (savedStory.id || savedStory.storyId) {
            setStoryId(savedStory.id || savedStory.storyId);
          }
          
          toast({
            title: "Alternate life discovered!",
            description: "Your parallel universe self has been revealed!",
          });
        } catch (saveError) {
          console.error("Error saving story:", saveError);
          
          // Still set the result but show an error about saving
          toast({
            title: "Story generated but not saved",
            description: "Your story was generated but couldn't be saved to your account. You can still view it now.",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error("Error generating story:", error);
      loadingToast.dismiss();
      
      // Handle specific API errors
      if (error instanceof Error) {
        if (error.message === 'GROQ_API_KEY_MISSING') {
          toast({
            title: "Service Unavailable",
            description: "Story generation service is currently unavailable. Please try again later.",
            variant: "destructive",
          });
        } else if (error.message === 'INVALID_API_KEY_FORMAT') {
          toast({
            title: "Service Error",
            description: "There was an issue with the story generation service. Please try again later.",
            variant: "destructive",
          });
        } else if (error.message === 'INVALID_API_KEY') {
          toast({
            title: "Service Error",
            description: "There was an issue with the story generation service. Please try again later.",
            variant: "destructive",
          });
        } else if (error.message === 'RATE_LIMIT_EXCEEDED') {
          toast({
            title: "Rate Limit Exceeded",
            description: "You've reached the rate limit. Please try again in a few minutes.",
            variant: "destructive",
          });
        } else if (error.message.startsWith('API_ERROR:')) {
          toast({
            title: "Service Error",
            description: "There was an issue with the story generation service. Please try again later.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Error",
            description: "Failed to generate your alternate life story. Please try again.",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Error",
          description: "Failed to generate your alternate life story. Please try again.",
          variant: "destructive",
        });
      }
    }
    setLoading(false);
  };

  const handleUndo = () => {
    if (previousStory) {
      setResult(previousStory.content);
      setStoryId(previousStory.id);
      setPreviousStory(null);
      toast({
        title: "Story restored",
        description: "Previous timeline has been restored.",
      });
    }
  };

  return {
    name,
    setName,
    transformedName,
    date,
    setDate,
    loading,
    result,
    personalityType,
    setPersonalityType,
    gender,
    setGender,
    location,
    setLocation,
    characterDescription,
    setCharacterDescription,
    plotDescription,
    setPlotDescription,
    storyId,
    previousStory,
    isAuthenticated,
    isInitialized,
    handleStorySelect,
    handleSubmit,
    handleUndo
  };
};
