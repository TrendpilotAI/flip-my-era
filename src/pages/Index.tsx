
import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const getRandomElement = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

const professions = [
  "professional unicorn whisperer",
  "cloud architect for cotton candy buildings",
  "professional pillow tester",
  "reverse psychologist for stubborn plants",
  "professional bubble wrap popper",
  "chief meme officer",
  "professional cat video curator",
  "happiness consultant for grumpy socks",
];

const hobbies = [
  "collecting belly button lint in various colors",
  "teaching rocks to swim",
  "organizing cloud shapes by personality type",
  "translating cat meows into Shakespeare quotes",
  "knitting sweaters for naked trees",
  "practicing telepathy with houseplants",
  "professional procrastination coaching",
  "extreme ironing in unusual locations",
];

const pets = [
  "a philosophical goldfish named Plato",
  "a dramatic llama who thinks it's a ballet dancer",
  "a vegetarian shark named Tofu",
  "a claustrophobic butterfly named Space",
  "an insomniac owl called Dayshift",
  "a tone-deaf singing gecko",
  "a social media influencer hamster",
  "a retired circus penguin named Jazz",
];

const Index = () => {
  const [name, setName] = useState("");
  const [date, setDate] = useState<Date>();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const { toast } = useToast();

  const generateResult = () => {
    if (!name || !date) {
      if (!name && !date) {
        return "If you're too lazy to type anything, in your alternate life you'd be a professional couch quality inspector with a PhD in remote control physics!";
      }
      return "As a mysterious being of unknown origin, you'd be a professional cloud shape analyst specializing in finding shapes that look like famous historical figures!";
    }

    const profession = getRandomElement(professions);
    const hobby = getRandomElement(hobbies);
    const pet = getRandomElement(pets);

    const oppositeGender = name.toLowerCase().endsWith("a") ? "man" : "woman";
    return `In your alternate life as a ${oppositeGender}, you'd be a ${profession} who enjoys ${hobby} with ${pet}!`;
  };

  const handleSubmit = async () => {
    setLoading(true);
    const loadingToast = toast({
      title: "Accessing the multiverse...",
      description: "Scanning infinite realities for your alternate life...",
    });

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000));
    loadingToast.dismiss();
    
    const newResult = generateResult();
    setResult(newResult);
    setLoading(false);

    toast({
      title: "Alternate life discovered!",
      description: "Your parallel universe self has been revealed!",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-teal-50 py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-4 animate-fadeIn">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
            GenderFlipLife
          </h1>
          <p className="text-lg text-gray-600">
            Discover your absurd alternate life in a parallel universe!
          </p>
        </div>

        <div className="glass-card rounded-2xl p-8 space-y-6 animate-fadeIn [animation-delay:200ms]">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Name
              </label>
              <Input
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Birthday
              </label>
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                className="rounded-md border"
              />
            </div>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full btn-primary"
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
            <div className="mt-6 flex justify-end">
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
