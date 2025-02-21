
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { generateWithGroq } from '@/utils/groq';
import { supabase } from '@/integrations/supabase/client';
import { getStarSign, starSignCharacteristics } from '@/utils/starSigns';
import type { PersonalityTypeKey } from '@/types/personality';
import { personalityTypes } from '@/types/personality';
import { detectGender, getFlippedGender, GenderInfo } from '@/utils/genderUtils';

type GenderType = "same" | "flip" | "neutral";

export const useStoryGeneration = () => {
  const [name, setName] = useState("");
  const [date, setDate] = useState<Date>();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [personalityType, setPersonalityType] = useState<PersonalityTypeKey>("dreamer");
  const [gender, setGender] = useState<GenderType>("same");
  const [detectedGender, setDetectedGender] = useState<GenderInfo>({ gender: 'unknown', probability: 0 });
  const [storyId, setStoryId] = useState<string>("");
  
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (name) {
      detectGender(name).then(setDetectedGender);
    }
  }, [name]);

  const handleStorySelect = async (story: any) => {
    setResult(story.initial_story);
    setStoryId(story.id);
  };

  const getRandomViralTropes = () => {
    const tropes = [
      "an epic monologue that unexpectedly goes viral",
      "a witty exchange that becomes the internet's favorite quote",
      "a dramatic scene worthy of a Netflix adaptation",
      "a meet-cute straight out of a romantic comedy",
      "a perfectly timed one-liner that changes everything",
      "a heartfelt confession that resonates worldwide",
      "a quirky dialogue that spawns countless memes",
      "a poetic moment captured in perfect timing",
      "a cinematic scene that feels like a movie script",
      "a theatrical twist that leaves audiences breathless"
    ];
    const selected = new Set();
    while (selected.size < 2) {
      selected.add(tropes[Math.floor(Math.random() * tropes.length)]);
    }
    return Array.from(selected);
  };

  const getRandomSceneSettings = () => {
    const settings = [
      "a fairy-lit rooftop at sunset",
      "a bustling coffee shop during golden hour",
      "a secret garden hidden in plain sight",
      "a vintage bookstore with a magical secret",
      "a rainy street with neon reflections",
      "a dreamy beach at twilight",
      "an enchanted city park at midnight",
      "a cozy apartment with string lights",
      "a charming old theater with history",
      "a whimsical art gallery opening"
    ];
    return settings[Math.floor(Math.random() * settings.length)];
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

    setLoading(true);
    const loadingToast = toast({
      title: "Accessing the multiverse...",
      description: "Scanning infinite realities for your alternate life...",
    });

    const starSign = date ? getStarSign(date) : null;
    const starSignTraits = starSign ? starSignCharacteristics[starSign].traits.join(", ") : "";
    const selectedPersonality = personalityTypes[personalityType];
    const viralTropes = getRandomViralTropes();
    const sceneSettings = getRandomSceneSettings();
    
    const getGenderContext = () => {
      const originalGender = detectedGender.gender;
      switch (gender) {
        case "flip":
          return `Write the story with the protagonist's gender as ${getFlippedGender(originalGender)}, incorporating this change naturally into the narrative. Use appropriate pronouns and gender-specific references throughout.`;
        case "neutral":
          return "Write the story using gender-neutral language and they/them pronouns for the protagonist";
        default:
          return `Write the story with the protagonist's gender as ${originalGender}, using appropriate pronouns throughout.`;
      }
    };

    const prompt = `Create a captivating, cinematic story about ${name}${date ? ` (born ${date.toLocaleDateString()})` : ''} written in a dynamic, script-like style with engaging dialogue and vivid scene descriptions. ${getGenderContext()}.

Setting: ${sceneSettings}

Story Structure:
[Set the scene with rich, atmospheric details]

Act 1: The Setup
- Open with a vivid scene description
- Introduce ${name} through action and dialogue
- Establish the dreamy, magical atmosphere

Example format:
[Scene description in italics]
Character: "Dialogue in quotes"
*Action or emotional beat in asterisks*
[Atmospheric details in brackets]

Act 2: The Journey
- Mix dialogue with internal monologue
- Create cinematic moments
- Build emotional resonance through interaction

Act 3: The Resolution
- Deliver powerful dialogue
- Create a visually stunning climax
- End with both words and atmosphere

Character Elements:
- Personality: ${selectedPersonality.title} (${selectedPersonality.traits.join(", ")})
- Zodiac Influence: ${starSign ? `${starSign} - ${starSignTraits}` : 'Unknown'}
- Character Voice: ${selectedPersonality.description}

Viral Moments:
- Primary Scene: ${viralTropes[0]}
- Supporting Scene: ${viralTropes[1]}

Writing Style:
1. Use script-like formatting for dialogue
2. Include atmospheric scene descriptions in brackets
3. Add emotional beats and actions in asterisks
4. Create quotable lines of dialogue
5. Mix narrative with theatrical elements
6. Balance dreamy atmosphere with genuine emotion

Requirements:
- Write in a format that mixes narrative with script elements
- Include at least 3 pieces of memorable dialogue
- Create vivid scene descriptions
- Add stage directions for emotional moments
- Maintain an uplifting, magical tone
- End with a powerful line of dialogue or poetic description

The story should be structured in 3 acts, each with a mix of dialogue, scene description, and emotional beats. Make it feel like a beautiful scene from a movie or play while maintaining its shareability and emotional impact.`;

    try {
      const story = await generateWithGroq(prompt);
      loadingToast.dismiss();
      
      if (story) {
        setResult(story);
        await saveStory(story, name, date, prompt);
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

  const saveStory = async (story: string, name: string, date?: Date, prompt?: string) => {
    const { data, error } = await supabase
      .from('stories')
      .insert({
        name,
        birth_date: date?.toISOString(),
        initial_story: story,
        prompt: prompt
      })
      .select()
      .single();

    if (error) {
      console.error("Error saving story:", error);
      toast({
        title: "Error",
        description: "Failed to save your story. But you can still continue.",
        variant: "destructive",
      });
    } else {
      setStoryId(data.id);
    }
  };

  return {
    name,
    setName,
    date,
    setDate,
    loading,
    result,
    personalityType,
    setPersonalityType,
    gender,
    setGender,
    storyId,
    handleStorySelect,
    handleSubmit
  };
};
