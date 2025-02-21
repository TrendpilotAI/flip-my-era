
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
      "unexpected rise to viral fame through a misunderstanding",
      "dramatic public redemption after a viral mishap",
      "accidental social media influence leading to a movement",
      "mysterious stranger changing everything overnight",
      "plot twist revealing hidden talents that shock everyone",
      "redemption arc that inspires millions online",
      "going from rock bottom to trending worldwide",
      "viral video that changes the trajectory of life",
      "unexpected heroic moment caught on camera",
      "shocking family secret revealed through DNA test"
    ];
    const selected = new Set();
    while (selected.size < 2) {
      selected.add(tropes[Math.floor(Math.random() * tropes.length)]);
    }
    return Array.from(selected);
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

    const prompt = `Create an emotionally powerful and highly shareable story about ${name}${date ? ` (born ${date.toLocaleDateString()})` : ''} that will resonate deeply with social media audiences. ${getGenderContext()}.

Story Structure:
1. Opening Hook: Start with an attention-grabbing moment that makes readers need to know what happens next
2. Rising Action: Build tension through a series of increasingly dramatic events
3. Hero's Journey: Transform the protagonist from ordinary to extraordinary
4. Plot Twist: Include a shocking revelation that changes everything
5. Redemption Arc: Show a powerful journey of growth and transformation
6. Viral Moment: Incorporate a highly shareable, memorable scene
7. Emotional Resolution: End with a powerful message that inspires sharing

Character Foundation:
- Personality Type: ${selectedPersonality.title} (${selectedPersonality.traits.join(", ")})
- Zodiac Influence (${starSign}): ${starSignTraits}
- Character Essence: ${selectedPersonality.description}

Viral Elements:
- Primary Plot Device: ${viralTropes[0]}
- Secondary Element: ${viralTropes[1]}

Writing Guidelines:
1. Create strong emotional peaks and valleys
2. Include highly quotable dialogue
3. Write visually descriptive scenes perfect for TikTok adaptation
4. Add unexpected twists that make readers gasp
5. Incorporate current social media trends and cultural references
6. End with a powerful message that resonates universally

Style Requirements:
- Use vivid, emotional language that creates strong mental images
- Include dialogue that sounds authentic and memorable
- Create "share-worthy" moments that readers will want to discuss
- Maintain a balance between drama and authenticity
- Write in a way that feels both personal and universally relatable

The story should be 3 paragraphs long, following a clear dramatic arc that builds to an emotional climax. Make it impossible not to share!`;
    
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
