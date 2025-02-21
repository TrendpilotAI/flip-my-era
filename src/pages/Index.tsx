
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { generateWithGroq } from "@/utils/groq";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { StoryForm } from "@/components/StoryForm";
import { StoryResult } from "@/components/StoryResult";

const personalityTypes = {
  "dreamer": {
    title: "The Dreamer",
    traits: ["Imaginative", "Creative", "Idealistic"],
    description: "Always looking for new possibilities and meanings in life"
  },
  "adventurer": {
    title: "The Adventurer",
    traits: ["Spontaneous", "Energetic", "Risk-taking"],
    description: "Seeking thrills and new experiences"
  },
  "analyst": {
    title: "The Analyst",
    traits: ["Logical", "Strategic", "Detail-oriented"],
    description: "Finding patterns and solving complex problems"
  },
  "nurturer": {
    title: "The Nurturer",
    traits: ["Empathetic", "Supportive", "Compassionate"],
    description: "Taking care of others and building connections"
  },
  "achiever": {
    title: "The Achiever",
    traits: ["Ambitious", "Determined", "Goal-oriented"],
    description: "Striving for success and recognition"
  }
};

const Index = () => {
  const [name, setName] = useState("");
  const [date, setDate] = useState<Date>();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [personalityType, setPersonalityType] = useState<keyof typeof personalityTypes>("dreamer");
  const { toast } = useToast();
  const [storyId, setStoryId] = useState<string>("");
  const navigate = useNavigate();

  useEffect(() => {
    checkApiKeys();
  }, []);

  const checkApiKeys = async () => {
    const { data } = await supabase
      .from('api_settings')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!data?.groq_api_key || !data?.runware_api_key) {
      toast({
        title: "API Keys Required",
        description: "Please configure your API keys in settings first.",
        variant: "destructive",
      });
      navigate('/settings');
    } else {
      localStorage.setItem('GROQ_API_KEY', data.groq_api_key);
      localStorage.setItem('RUNWARE_API_KEY', data.runware_api_key);
    }
  };

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
    
    const prompt = `Create a hilarious story about ${name}${date ? ` (born ${date.toLocaleDateString()})` : ''} in an alternate universe. They are ${selectedPersonality.title.toLowerCase()}, characterized by being ${selectedPersonality.traits.join(", ")}. Include their zodiac sign (${starSign}) characteristics: ${starSignTraits}. The story should include:
- An absurd career twist that combines their ${selectedPersonality.title.toLowerCase()} personality (${selectedPersonality.description}) with their star sign traits
- A ridiculous hobby that reflects both their personality type and zodiac characteristics
- An unexpected viral moment that showcases their unique combination of ${selectedPersonality.title.toLowerCase()} tendencies and astrological nature
- A celebrity encounter gone wrong that highlights how their personality type and star sign interact in chaos
Make it silly and super shareable! Max 3 paragraphs.`;
    
    try {
      const story = await generateWithGroq(prompt);
      loadingToast.dismiss();
      
      if (story) {
        setResult(story);
        
        const { data, error } = await supabase
          .from('stories')
          .insert({
            name,
            birth_date: date?.toISOString(),
            initial_story: story,
            prompt
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

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-[#E5DEFF] via-[#FFDEE2] to-[#D3E4FD] py-12 px-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <img
          src="https://images.unsplash.com/photo-1518112166137-85f9979a43aa"
          alt=""
          className="absolute -right-20 -top-20 w-64 h-64 object-cover rounded-full opacity-20 rotate-12 transform scale-75 blur-sm"
        />
        <img
          src="https://images.unsplash.com/photo-1517457373958-b7bdd4587205"
          alt=""
          className="absolute -left-32 top-1/3 w-96 h-96 object-cover rounded-full opacity-20 -rotate-12 transform scale-75 blur-sm"
        />
        <img
          src="https://images.unsplash.com/photo-1565945887714-d5139f4eb0ce"
          alt=""
          className="absolute -right-40 bottom-1/4 w-80 h-80 object-cover rounded-full opacity-20 rotate-45 transform scale-75 blur-sm"
        />
      </div>

      <div className="max

w-4xl mx-auto space-y-8 relative z-10">
        <div className="text-center space-y-4 animate-fadeIn">
          <h1 className="text-4xl md:text-5xl font-bold text-[#4A4A4A] drop-shadow-lg">
            FlipMyEra
          </h1>
          <p className="text-lg text-[#6B6B6B]">
            Travel back to a more hopeful timeline ✨
          </p>
        </div>

        <StoryForm
          name={name}
          setName={setName}
          date={date}
          setDate={setDate}
          loading={loading}
          handleSubmit={handleSubmit}
          handleStorySelect={handleStorySelect}
          personalityTypes={personalityTypes}
          personalityType={personalityType}
          setPersonalityType={setPersonalityType}
        />

        {result && (
          <StoryResult
            result={result}
            storyId={storyId}
            onRegenerateClick={handleSubmit}
          />
        )}
      </div>
    </div>
  );
};

export default Index;
