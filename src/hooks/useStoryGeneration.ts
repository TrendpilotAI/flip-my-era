
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { generateWithGroq } from '@/utils/groq';
import { getStarSign } from '@/utils/starSigns';
import type { PersonalityTypeKey } from '@/types/personality';
import { personalityTypes } from '@/types/personality';
import { detectGender, transformName, GenderInfo } from '@/utils/genderUtils';
import { getRandomViralTropes, getRandomSceneSettings, generateStoryPrompt } from '@/utils/storyPrompts';
import { saveStory } from '@/utils/storyPersistence';

type GenderType = "same" | "flip" | "neutral";

interface StoryState {
  content: string;
  id: string;
}

export const useStoryGeneration = () => {
  const [name, setName] = useState("");
  const [transformedName, setTransformedName] = useState("");
  const [date, setDate] = useState<Date>();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [personalityType, setPersonalityType] = useState<PersonalityTypeKey>("dreamer");
  const [gender, setGender] = useState<GenderType>("same");
  const [location, setLocation] = useState("");
  const [detectedGender, setDetectedGender] = useState<GenderInfo>({ gender: 'unknown', probability: 0 });
  const [storyId, setStoryId] = useState<string>("");
  const [previousStory, setPreviousStory] = useState<StoryState | null>(null);
  
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (name) {
      detectGender(name).then(setDetectedGender);
    }
  }, [name]);

  useEffect(() => {
    if (name && detectedGender) {
      const newTransformedName = transformName(name, detectedGender, gender);
      setTransformedName(newTransformedName);
    }
  }, [name, detectedGender, gender]);

  const handleStorySelect = async (story: any) => {
    setPreviousStory({ content: result, id: storyId });
    setResult(story.initial_story);
    setStoryId(story.id);
  };

  const handleSubmit = async () => {
    if (!localStorage.getItem('GROQ_API_KEY')) {
      toast({
        title: "API Key Required",
        description: "Please configure your API keys in settings first.",
        variant: "destructive",
      });
      navigate('/settings');
      return;
    }

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
        location
      );

      const story = await generateWithGroq(prompt);
      loadingToast.dismiss();
      
      if (story) {
        setResult(story);
        const savedStory = await saveStory(story, transformedName, date, prompt);
        setStoryId(savedStory.id);
        toast({
          title: "Alternate life discovered!",
          description: "Your parallel universe self has been revealed!",
        });
      }
    } catch (error) {
      console.error("Error generating story:", error);
      loadingToast.dismiss();
      toast({
        title: "Error",
        description: "Failed to generate your alternate life story. Please try again.",
        variant: "destructive",
      });
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
    storyId,
    previousStory,
    handleStorySelect,
    handleSubmit,
    handleUndo
  };
};
