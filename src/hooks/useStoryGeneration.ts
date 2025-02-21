import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { generateWithGroq } from '@/utils/groq';
import { supabase } from '@/integrations/supabase/client';
import { getStarSign, starSignCharacteristics } from '@/utils/starSigns';
import type { PersonalityTypeKey } from '@/types/personality';
import { personalityTypes } from '@/types/personality';

export const useStoryGeneration = () => {
  const [name, setName] = useState("");
  const [date, setDate] = useState<Date>();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [personalityType, setPersonalityType] = useState<PersonalityTypeKey>("dreamer");
  const [storyId, setStoryId] = useState<string>("");
  
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleStorySelect = async (story: any) => {
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

    setLoading(true);
    const loadingToast = toast({
      title: "Accessing the multiverse...",
      description: "Scanning infinite realities for your alternate life...",
    });

    const starSign = date ? getStarSign(date) : null;
    const starSignTraits = starSign ? starSignCharacteristics[starSign].traits.join(", ") : "";
    const selectedPersonality = personalityTypes[personalityType];
    
    const prompt = `Create an enchanting and emotionally resonant story about ${name}${date ? ` (born ${date.toLocaleDateString()})` : ''} that deeply reflects their inner world as ${selectedPersonality.title.toLowerCase()}. Their personality shines through as someone who is ${selectedPersonality.traits.join(", ")}, while their zodiac sign (${starSign}) adds layers of ${starSignTraits} to their character.

Weave together these elements in a way that feels both magical and deeply authentic:

For a ${selectedPersonality.title.toLowerCase()}, create:
- A pivotal moment of transformation that perfectly embodies their ${selectedPersonality.description}. Perhaps it happens during a quiet dawn or in a cozy coffee shop where the scent of cinnamon and old books mingles with possibility
- An unexpected passion that emerges from their unique way of seeing the world - ${selectedPersonality.traits[0]} souls often find beauty in overlooked places, like antique music boxes or forgotten garden paths
- A serendipitous encounter that challenges them to embrace their ${selectedPersonality.traits[1]} nature - maybe involving a mysterious diary entry or a chance meeting on a train platform at dusk
- A moment of recognition where their ${selectedPersonality.traits[2]} spirit helps them discover something extraordinary in the ordinary

Include subtle references to:
- The way seasons mirror their emotional journey (autumn leaves dancing as they make a life-changing decision, or winter frost patterns speaking to their analytical mind)
- Small, magical details that feel deeply personal (handwritten notes in margin of old books, the way streetlights reflect in puddles, the sound of wind chimes at midnight)
- The courage it takes to be authentically yourself, especially when that self is beautifully different

Make the story feel like a cherished memory that's both deeply personal and universally relatable, as if we're all just one magical moment away from discovering our true path. Keep it to 3 paragraphs, each one building on the emotional resonance of their personality type and zodiac traits.`;
    
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
    storyId,
    handleStorySelect,
    handleSubmit
  };
};
