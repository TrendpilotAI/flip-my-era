
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { generateWithGroq } from '@/utils/groq';
import { supabase } from '@/integrations/supabase/client';
import { getStarSign, starSignCharacteristics } from '@/utils/starSigns';
import type { PersonalityTypeKey } from '@/types/personality';
import { personalityTypes } from '@/types/personality';

type GenderType = "same" | "flip" | "neutral";

export const useStoryGeneration = () => {
  const [name, setName] = useState("");
  const [date, setDate] = useState<Date>();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [personalityType, setPersonalityType] = useState<PersonalityTypeKey>("dreamer");
  const [gender, setGender] = useState<GenderType>("same");
  const [storyId, setStoryId] = useState<string>("");
  
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleStorySelect = async (story: any) => {
    setResult(story.initial_story);
    setStoryId(story.id);
  };

  const getRandomViralTropes = () => {
    const tropes = [
      "unexpected inheritance from a mysterious relative",
      "accidentally becoming a social media sensation",
      "mistaken identity leading to hilarious consequences",
      "finding a magical object in a thrift store",
      "becoming an accidental influencer",
      "starting a viral trend without meaning to",
      "getting involved in a celebrity's life through a series of coincidences",
      "discovering a hidden talent that goes viral",
      "accidentally solving a decades-old mystery",
      "becoming the subject of a viral meme"
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
      switch (gender) {
        case "flip":
          return "Write the story with the protagonist's gender flipped from their original gender, incorporating this change naturally into the narrative";
        case "neutral":
          return "Write the story using gender-neutral language and pronouns (they/them) for the protagonist";
        default:
          return "Maintain the protagonist's original gender identity in the story";
      }
    };

    const prompt = `Create a uniquely hilarious and viral-worthy story about ${name}${date ? ` (born ${date.toLocaleDateString()})` : ''} that blends their ${selectedPersonality.title.toLowerCase()} personality with unexpected plot twists and social media potential. ${getGenderContext()}.

Personality Foundation:
- Core traits: ${selectedPersonality.traits.join(", ")}
- Zodiac influence (${starSign}): ${starSignTraits}
- Character essence: ${selectedPersonality.description}

Viral Elements (incorporate organically):
- Primary plot twist: ${viralTropes[0]}
- Secondary element: ${viralTropes[1]}

Story Guidelines:
1. Blend modern humor with relatable moments that would make great TikTok or Instagram content
2. Include at least one "wait for it..." moment that would make readers want to share the story
3. Weave in subtle references to current pop culture and internet trends
4. Create memorable, quotable lines that could become memes
5. Include a surprising twist that connects to their zodiac traits
6. Make the story feel both personal and universally relatable

Style Requirements:
- Keep the tone light and entertaining while maintaining emotional authenticity
- Use vivid, sensory details that paint a picture
- Include dialogue that sounds natural and quotable
- Break the fourth wall occasionally with humorous asides
- Maintain a balance between humor and heart

The story should be 3 paragraphs long, each building on the previous one to create a satisfying arc that makes readers want to share it with their friends. Make it feel like a story that could go viral on social media while still being deeply personal to ${name}'s character.`;
    
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
