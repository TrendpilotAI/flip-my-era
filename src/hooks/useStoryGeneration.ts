import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { generateWithGroq } from '@/utils/groq';
import { supabase } from '@/integrations/supabase/client';
import { getStarSign, starSignCharacteristics } from '@/utils/starSigns';
import type { PersonalityTypeKey } from '@/types/personality';
import { personalityTypes } from '@/types/personality';
import { detectGender, getFlippedGender, transformName, GenderInfo } from '@/utils/genderUtils';

type GenderType = "same" | "flip" | "neutral";

export const useStoryGeneration = () => {
  const [name, setName] = useState("");
  const [transformedName, setTransformedName] = useState("");
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

  useEffect(() => {
    if (name && detectedGender) {
      const newTransformedName = transformName(name, detectedGender, gender);
      setTransformedName(newTransformedName);
    }
  }, [name, detectedGender, gender]);

  const handleStorySelect = async (story: any) => {
    setResult(story.initial_story);
    setStoryId(story.id);
  };

  const getRandomViralTropes = () => {
    const tropes = [
      "a breathtaking moment of serendipity",
      "an unforgettable twist of fate",
      "a chance encounter that changes everything",
      "a magical revelation under starlight",
      "an extraordinary coincidence that sparks wonder",
      "a beautiful misunderstanding that leads to love",
      "a moment of clarity amidst chaos",
      "a destined meeting in an unexpected place",
      "a life-changing decision made in a heartbeat",
      "a perfect alignment of cosmic events"
    ];
    const selected = new Set();
    while (selected.size < 2) {
      selected.add(tropes[Math.floor(Math.random() * tropes.length)]);
    }
    return Array.from(selected);
  };

  const getRandomSceneSettings = () => {
    const settings = [
      "a hidden garden blooming with fairy lights and midnight flowers",
      "a cozy bookstore café where time seems to stand still",
      "a rooftop overlooking a city painted in sunset hues",
      "a secret beach where the waves whisper ancient stories",
      "an enchanted forest path lined with glowing butterflies",
      "a vintage jazz club frozen in a golden era",
      "a charming street corner where magic feels possible",
      "a moonlit balcony overlooking a sleeping city",
      "a hidden courtyard filled with fairy lights and memories",
      "a mystical art gallery where paintings come alive"
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
          return `Write the story with the protagonist's name as ${transformedName} and gender as ${getFlippedGender(originalGender)}, incorporating this change naturally into the narrative. Use appropriate pronouns and gender-specific references throughout.`;
        case "neutral":
          return `Write the story with the protagonist's name as ${transformedName} using gender-neutral language and they/them pronouns throughout.`;
        default:
          return `Write the story with the protagonist's name as ${transformedName} and gender as ${originalGender}, using appropriate pronouns throughout.`;
      }
    };

    const prompt = `Create a beautifully written story about ${transformedName}${date ? ` (born ${date.toLocaleDateString()})` : ''} in the style of an enchanting novel, with rich descriptions and flowing narrative. ${getGenderContext()}.

Setting: ${sceneSettings}

Story Elements:
- Open with vivid, sensory descriptions that transport readers
- Use elegant, flowing prose that creates a dreamy atmosphere
- Include meaningful dialogue wrapped in descriptive narrative
- Paint pictures with words, focusing on emotions and atmosphere
- Create a story that feels like a cherished book passage

Character Elements:
- Personality: ${selectedPersonality.title} (${selectedPersonality.traits.join(", ")})
- Zodiac Influence: ${starSign ? `${starSign} - ${starSignTraits}` : 'Unknown'}
- Inner Voice: ${selectedPersonality.description}

Key Moments:
- Primary Scene: ${viralTropes[0]}
- Supporting Scene: ${viralTropes[1]}

Writing Style:
1. Use beautiful, descriptive prose
2. Integrate dialogue naturally within paragraphs
3. Create vivid imagery through careful word choice
4. Build emotional resonance through detailed observations
5. Maintain a dreamy, enchanting tone
6. Include poetic descriptions of settings and feelings

Structure:
First Paragraph: Set the scene with rich detail and introduce ${transformedName} through elegant description and meaningful action.

Second Paragraph: Develop the story through a mix of internal thoughts, external dialogue, and atmospheric description. Focus on the emotional journey and the magic of the moment.

Final Paragraph: Bring the story to a satisfying close with poetic imagery and profound realization, ending with a beautiful observation or meaningful exchange that lingers in the reader's mind.

Requirements:
- Write in flowing, novel-like prose
- Include natural dialogue within descriptive paragraphs
- Create cinematic imagery through words
- Build emotional depth through detailed observation
- Maintain an enchanting, uplifting tone
- End with a powerful, quotable moment

The story should read like a beloved passage from a beautiful book, with each paragraph building on the last to create a complete, shareable moment that captures both the magic of storytelling and the power of human connection.`;

    try {
      const story = await generateWithGroq(prompt);
      loadingToast.dismiss();
      
      if (story) {
        setResult(story);
        await saveStory(story, transformedName, date, prompt);
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
    transformedName,
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
