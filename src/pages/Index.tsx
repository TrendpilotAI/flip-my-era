
import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Repeat } from "lucide-react";
import { generateStoryWithDeepSeek } from "@/utils/deepseek";

const Index = () => {
  const [name, setName] = useState("");
  const [date, setDate] = useState<Date>();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const { toast } = useToast();
  const [apiKeySet, setApiKeySet] = useState(!!localStorage.getItem('DEEPSEEK_API_KEY'));

  const handleSetApiKey = () => {
    const apiKey = prompt("Please enter your DeepSeek API key:");
    if (apiKey) {
      localStorage.setItem('DEEPSEEK_API_KEY', apiKey);
      setApiKeySet(true);
      toast({
        title: "API Key Saved",
        description: "Your DeepSeek API key has been saved successfully.",
      });
    }
  };

  const handleSubmit = async () => {
    if (!apiKeySet) {
      toast({
        title: "API Key Required",
        description: "Please set your DeepSeek API key first.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const loadingToast = toast({
      title: "Accessing the multiverse...",
      description: "Scanning infinite realities for your alternate life...",
    });

    const story = await generateStoryWithDeepSeek(name, date);
    loadingToast.dismiss();
    
    if (story) {
      setResult(story);
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

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-purple-400 via-pink-500 to-red-500 py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-4 animate-fadeIn">
          <h1 className="text-4xl md:text-5xl font-bold text-white drop-shadow-lg">
            GenderFlipLife
          </h1>
          <p className="text-lg text-white/90">
            Discover your absurd alternate life in a parallel universe!
          </p>
          {!apiKeySet && (
            <Button
              onClick={handleSetApiKey}
              variant="outline"
              className="bg-white/20 text-white hover:bg-white/30"
            >
              Set DeepSeek API Key
            </Button>
          )}
        </div>

        <div className="glass-card rounded-2xl p-8 space-y-6 animate-fadeIn [animation-delay:200ms] bg-white/95">
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
              <div className="flex justify-center w-full">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  className="rounded-md border-0"
                  defaultMonth={date || new Date(1990, 0)}
                  fromYear={1900}
                  toYear={new Date().getFullYear()}
                  captionLayout="dropdown"
                  showOutsideDays={false}
                  fixedWeeks
                  ISOWeek
                />
              </div>
            </div>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={loading || !apiKeySet}
            className="w-full btn-primary mt-6"
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
          <div className="glass-card rounded-2xl p-8 animate-fadeIn [animation-delay:400ms]">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Your Alternate Life
            </h2>
            <p className="text-lg text-gray-700 leading-relaxed">{result}</p>
            <div className="mt-6 flex justify-between items-center">
              <Button
                onClick={handleSubmit}
                className="text-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-4 rounded-lg font-bold hover:opacity-90 transition-opacity flex items-center gap-2"
              >
                <Repeat className="h-6 w-6" />
                Again!
              </Button>
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
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
