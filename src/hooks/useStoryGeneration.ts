
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
      "an unexpected meet-cute that goes hilariously wrong before turning magical",
      "accidentally becoming a meme sensation while trying to impress a crush",
      "a sarcastic twist of fate that leads to finding true love",
      "a quirky misunderstanding that sparks a viral romance",
      "an embarrassing moment turned into an inspiring love story",
      "a witty comeback that changes everything",
      "finding love through a series of comedic mishaps",
      "a heartwarming redemption story with unexpected humor",
      "a chance encounter that becomes an internet phenomenon",
      "a dramatic confession gone viral for all the right reasons"
    ];
    const selected = new Set();
    while (selected.size < 2) {
      selected.add(tropes[Math.floor(Math.random() * tropes.length)]);
    }
    return Array.from(selected);
  };

  const getRandomEmotionalElements = () => {
    const elements = [
      "a bittersweet reunion that brings tears and laughter",
      "an unexpected act of kindness that changes multiple lives",
      "a moment of vulnerability that resonates with millions",
      "a heartfelt revelation that challenges everything",
      "a touching gesture that breaks the internet",
      "a profound realization wrapped in humor",
      "an epic romantic gesture with a twist of irony",
      "a deeply moving connection formed through shared laughter",
      "a powerful transformation sparked by a funny coincidence",
      "a life-changing decision made with both heart and humor"
    ];
    return elements[Math.floor(Math.random() * elements.length)];
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
    const emotionalElement = getRandomEmotionalElements();
    
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

    const prompt = `Create a captivating, humorous, and emotionally resonant story about ${name}${date ? ` (born ${date.toLocaleDateString()})` : ''} that perfectly balances wit, romance, and profound meaning. ${getGenderContext()}.

Story Structure:
1. Opening Hook: Begin with a witty, attention-grabbing moment that hints at deeper meaning
2. Rising Action: Build tension through a series of both humorous and touching events
3. Hero's Journey: Transform the protagonist through both laughter and tears
4. Plot Twist: Include a surprising revelation that's both funny and profound
5. Romantic Element: Weave in a unique love story that subverts expectations
6. Viral Moment: Create a scene that's simultaneously hilarious and deeply moving
7. Emotional Resolution: End with a powerful message that combines humor and heart

Character Foundation:
- Personality Type: ${selectedPersonality.title} (${selectedPersonality.traits.join(", ")})
- Zodiac Influence (${starSign}): ${starSignTraits}
- Character Essence: ${selectedPersonality.description}
- Emotional Core: ${emotionalElement}

Viral Elements:
- Primary Plot Device: ${viralTropes[0]}
- Secondary Element: ${viralTropes[1]}

Writing Guidelines:
1. Balance humor with genuine emotion
2. Include witty, quotable dialogue that also touches the heart
3. Create scenes that are both funny and profound
4. Add unexpected twists that make readers laugh and cry
5. Mix current trends with timeless emotional truths
6. End with a message that's both clever and deeply meaningful

Style Requirements:
- Blend humor and heart in every scene
- Include both laugh-out-loud moments and touching revelations
- Create moments that are simultaneously funny and profound
- Mix witty observations with emotional depth
- Balance romantic elements with comedic timing
- Add a dash of edgy humor while maintaining emotional authenticity
- Make the story both wildly entertaining and genuinely moving

The story should be 3 paragraphs long, perfectly balancing humor, romance, and emotional depth. Each paragraph should contain both witty observations and touching moments, creating a story that's impossible not to share because it makes readers feel everything!`;

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
