
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Repeat } from "lucide-react";
import { generateWithDeepseek } from "@/utils/deepseek";
import ReactMarkdown from "react-markdown";
import { EbookGenerator } from "@/components/EbookGenerator";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

const getStarSign = (date: Date) => {
  const month = date.getMonth() + 1;
  const day = date.getDate();

  if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return "Aries";
  if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return "Taurus";
  if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return "Gemini";
  if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return "Cancer";
  if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return "Leo";
  if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return "Virgo";
  if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return "Libra";
  if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return "Scorpio";
  if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return "Sagittarius";
  if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return "Capricorn";
  if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return "Aquarius";
  return "Pisces";
};

const StarSignIcon = ({ sign }: { sign: string }) => {
  const commonClasses = "w-12 h-12 text-purple-600";
  
  return (
    <div className="flex items-center justify-center">
      <svg className={commonClasses} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {sign === "Aries" && (
          <path d="M12 2 C 8 8, 8 16, 12 20 M12 2 C 16 8, 16 16, 12 20 M12 20 L12 22" />
        )}
        {sign === "Taurus" && (
          <path d="M6 4 C 10 4, 12 8, 12 12 C 12 16, 10 20, 6 20 M18 4 C 14 4, 12 8, 12 12" />
        )}
        {sign === "Gemini" && (
          <path d="M6 4 L6 20 M18 4 L18 20 M6 12 L18 12" />
        )}
        {sign === "Cancer" && (
          <path d="M12 2 C 6 2, 6 12, 12 12 C 18 12, 18 22, 12 22" />
        )}
        {sign === "Leo" && (
          <path d="M12 2 C 6 2, 6 12, 12 12 C 18 12, 18 2, 12 2 M12 12 L12 22" />
        )}
        {sign === "Virgo" && (
          <path d="M6 4 C 12 4, 12 20, 18 20" />
        )}
        {sign === "Libra" && (
          <path d="M6 12 L18 12 M12 12 L12 20 M8 16 L16 16" />
        )}
        {sign === "Scorpio" && (
          <path d="M6 12 C 12 12, 12 20, 18 20 M18 20 L20 18 L18 16" />
        )}
        {sign === "Sagittarius" && (
          <path d="M6 18 L18 6 M18 6 L14 6 M18 6 L18 10" />
        )}
        {sign === "Capricorn" && (
          <path d="M6 4 C 12 4, 12 20, 18 20" />
        )}
        {sign === "Aquarius" && (
          <path d="M6 12 L18 12 M6 16 L18 16" />
        )}
        {sign === "Pisces" && (
          <path d="M6 12 C 10 12, 10 4, 6 4 C 2 4, 2 12, 6 12 M18 12 C 14 12, 14 20, 18 20 C 22 20, 22 12, 18 12 M6 12 L18 12" />
        )}
      </svg>
    </div>
  );
};

const Index = () => {
  const [name, setName] = useState("");
  const [date, setDate] = useState<Date>();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
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

    if (!data?.deepseek_api_key || !data?.runware_api_key) {
      toast({
        title: "API Keys Required",
        description: "Please configure your API keys in settings first.",
        variant: "destructive",
      });
      navigate('/settings');
    } else {
      localStorage.setItem('DEEPSEEK_API_KEY', data.deepseek_api_key);
      localStorage.setItem('RUNWARE_API_KEY', data.runware_api_key);
    }
  };

  const handleSubmit = async () => {
    if (!localStorage.getItem('DEEPSEEK_API_KEY')) {
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

    const prompt = `Create a hilarious story about ${name}${date ? ` (born ${date.toLocaleDateString()})` : ''} in an alternate universe where they're the opposite gender. Include:\n- An absurd career twist\n- A ridiculous hobby\n- An unexpected viral moment\n- A celebrity encounter gone wrong\nMake it silly and super shareable! Max 3 paragraphs.`;
    
    const story = await generateWithDeepseek(prompt);
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
    } else {
      toast({
        title: "Error",
        description: "Failed to generate your alternate life story. Please try again.",
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedDate = e.target.valueAsDate;
    setDate(selectedDate || undefined);
  };

  const starSign = date ? getStarSign(date) : null;

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-purple-400 via-pink-500 to-red-500 py-12 px-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <img
          src="https://images.unsplash.com/photo-1535268647677-300dbf3d78d1"
          alt=""
          className="absolute -right-20 -top-20 w-64 h-64 object-cover rounded-full opacity-20 rotate-12 transform scale-75"
        />
        <img
          src="https://images.unsplash.com/photo-1582562124811-c09040d0a901"
          alt=""
          className="absolute -left-32 top-1/3 w-96 h-96 object-cover rounded-full opacity-20 -rotate-12 transform scale-75"
        />
        <img
          src="https://images.unsplash.com/photo-1535268647677-300dbf3d78d1"
          alt=""
          className="absolute -right-40 bottom-1/4 w-80 h-80 object-cover rounded-full opacity-20 rotate-45 transform scale-75"
        />
      </div>

      <div className="max-w-4xl mx-auto space-y-8 relative z-10">
        <div className="text-center space-y-4 animate-fadeIn">
          <h1 className="text-4xl md:text-5xl font-bold text-white drop-shadow-lg">
            GenderFlipLife
          </h1>
          <p className="text-lg text-white/90">
            Discover your absurd alternate life in a parallel universe!
          </p>
        </div>

        <div className="glass-card rounded-2xl p-8 space-y-6 animate-fadeIn [animation-delay:200ms] bg-white/95 backdrop-blur-lg">
          <h2 className="text-xl font-semibold text-gray-900">Enter Your Details</h2>
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="block text-base font-medium text-gray-700">
                Your Name
              </label>
              <Input
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-field text-base py-2"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-base font-medium text-gray-700">
                Your Birthday
              </label>
              <Input
                type="date"
                onChange={handleDateChange}
                className="input-field text-base py-2"
                max={new Date().toISOString().split('T')[0]}
              />
            </div>

            {starSign && (
              <div className="mt-6 text-center animate-fadeIn">
                <div className="text-lg font-medium text-gray-700">Your Star Sign</div>
                <div className="mt-2">
                  <StarSignIcon sign={starSign} />
                </div>
                <div className="mt-2 text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 text-transparent bg-clip-text">
                  {starSign}
                </div>
              </div>
            )}
          </div>

          <Button
            onClick={handleSubmit}
            disabled={loading || !name}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Flipping Your Life...
              </>
            ) : (
              "Flip Your Life!"
            )}
          </Button>
        </div>

        {result && (
          <div className="glass-card rounded-2xl p-8 animate-fadeIn [animation-delay:400ms] bg-white/95 backdrop-blur-lg">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Your Alternate Life
            </h2>
            <div className="prose prose-lg prose-pink max-w-none">
              <ReactMarkdown>{result}</ReactMarkdown>
            </div>
            <div className="mt-6 flex flex-wrap gap-4 items-center justify-between">
              <div className="flex gap-2">
                <Button
                  onClick={handleSubmit}
                  className="text-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-4 rounded-lg font-bold hover:opacity-90 transition-opacity flex items-center gap-2"
                >
                  <Repeat className="h-6 w-6" />
                  Again!
                </Button>
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(result);
                  toast({
                    title: "Copied to clipboard!",
                    description: "Share your alternate life with friends!",
                  });
                }}
                className="text-sm"
              >
                Share Result
              </Button>
            </div>

            <div className="mt-12">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">
                Create an Illustrated Ebook
              </h3>
              <EbookGenerator originalStory={result} storyId={storyId} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
