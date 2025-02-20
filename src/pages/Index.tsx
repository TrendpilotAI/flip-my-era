
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Repeat, Book } from "lucide-react";
import { generateStoryWithGroq } from "@/utils/groq";
import ReactMarkdown from "react-markdown";

const Index = () => {
  const [name, setName] = useState("");
  const [date, setDate] = useState<Date>();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const { toast } = useToast();
  const [apiKeySet, setApiKeySet] = useState(!!localStorage.getItem('GROQ_API_KEY'));

  const handleSetApiKey = () => {
    const apiKey = prompt("Please enter your Groq API key:");
    if (apiKey) {
      localStorage.setItem('GROQ_API_KEY', apiKey);
      setApiKeySet(true);
      toast({
        title: "API Key Saved",
        description: "Your Groq API key has been saved successfully.",
      });
    }
  };

  const handleSubmit = async () => {
    if (!apiKeySet) {
      toast({
        title: "API Key Required",
        description: "Please set your Groq API key first.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const loadingToast = toast({
      title: "Accessing the multiverse...",
      description: "Scanning infinite realities for your alternate life...",
    });

    const story = await generateStoryWithGroq(name, date);
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

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedDate = e.target.valueAsDate;
    setDate(selectedDate || undefined);
  };

  const handleEbookPrompt = () => {
    const ebookPrompt = `Create a full ebook based on the following story premise:\n\n${result}\n\nExpand this into a complete novella with:\n- Detailed character development\n- Rich world-building\n- Multiple engaging plot arcs\n- Vivid descriptions\n- Meaningful dialogue\n- Emotional depth\n- A satisfying conclusion`;
    
    navigator.clipboard.writeText(ebookPrompt);
    toast({
      title: "Ebook Prompt Created!",
      description: "The expanded story prompt has been copied to your clipboard. Use this with your favorite AI writing tool to generate a full ebook!",
    });
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
              Set Groq API Key
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
              <Input
                type="date"
                onChange={handleDateChange}
                className="input-field text-base py-2"
                max={new Date().toISOString().split('T')[0]}
              />
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
                <Button
                  onClick={handleEbookPrompt}
                  className="text-lg bg-gradient-to-r from-blue-500 to-purple-500 text-white px-8 py-4 rounded-lg font-bold hover:opacity-90 transition-opacity flex items-center gap-2"
                >
                  <Book className="h-6 w-6" />
                  Create Ebook Prompt
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
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
