
import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Repeat } from "lucide-react";
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
              <div className="flex justify-center w-full">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  className="rounded-md border-0"
                  classNames={{
                    months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                    month: "space-y-4",
                    caption: "flex justify-center pt-1 relative items-center px-8",
                    caption_label: "text-sm font-medium",
                    nav: "space-x-1 flex items-center",
                    nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
                    nav_button_previous: "absolute left-1",
                    nav_button_next: "absolute right-1",
                    table: "w-full border-collapse space-y-1",
                    head_row: "flex",
                    head_cell: "text-muted-foreground rounded-md w-8 font-normal text-[0.8rem]",
                    row: "flex w-full mt-2",
                    cell: "text-center text-sm relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20 p-0",
                    day: "h-8 w-8 p-0 font-normal",
                    day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                    day_today: "bg-accent text-accent-foreground",
                    day_outside: "text-muted-foreground opacity-50",
                    day_disabled: "text-muted-foreground opacity-50",
                    day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
                    day_hidden: "invisible",
                  }}
                  defaultMonth={date || new Date(1990, 0)}
                  fromYear={1900}
                  toYear={new Date().getFullYear()}
                  captionLayout="dropdown"
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
            <div className="prose prose-lg prose-pink max-w-none">
              <ReactMarkdown>{result}</ReactMarkdown>
            </div>
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
