
import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Repeat } from "lucide-react";

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

const locations = [
  "a treehouse village in the Swiss Alps",
  "a underwater bubble city in the Pacific",
  "a floating cloud castle above Manhattan",
  "a converted space station in orbit",
  "a giant mushroom house in the Amazon",
  "a rainbow-powered windmill in Holland",
  "a time-traveling train station in Tibet",
  "a candy cane lighthouse in Antarctica",
];

const loves = [
  "organizing sock puppet theater performances",
  "teaching squirrels to do synchronized swimming",
  "writing haikus for confused cacti",
  "collecting vintage raindrops in crystal vials",
  "painting portraits of shy vegetables",
  "composing lullabies for insomniac stars",
  "hosting tea parties for retired superheroes",
  "knitting sweaters for embarrassed flamingos",
];

const hates = [
  "when clouds forget their choreography",
  "misaligned rainbow spectrums",
  "when gravity takes itself too seriously",
  "unrhyming poetry written by robots",
  "when butterflies refuse to flutter in formation",
  "improperly folded origami dreams",
  "when time machines arrive fashionably late",
  "poorly coordinated meteor showers",
];

const foods = [
  "moonbeam soufflé with stardust sprinkles",
  "rainbow spaghetti with unicorn meatballs",
  "cloud cotton candy with silver linings",
  "dragon breath pizza with phoenix feather toppings",
  "mermaid tail sushi with golden seahorse sauce",
  "butterfly wing tacos with fairy dust salsa",
  "northern lights soup with aurora garnish",
  "time-traveling tiramisu that tastes like tomorrow",
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
    const location = getRandomElement(locations);
    const love = getRandomElement(loves);
    const hate = getRandomElement(hates);
    const food = getRandomElement(foods);
    const hobby = getRandomElement(hobbies);
    const pet = getRandomElement(pets);

    const oppositeGender = name.toLowerCase().endsWith("a") ? "man" : "woman";
    return `In your alternate life as a ${oppositeGender}, you live in ${location}. You work as a ${profession} and absolutely love ${love}. Your pet companion is ${pet}, who shares your passion for ${hobby}. You can't stand ${hate}, but you find comfort in your favorite food: ${food}. What a life!`;
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
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-purple-400 via-pink-500 to-red-500 py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-4 animate-fadeIn">
          <h1 className="text-4xl md:text-5xl font-bold text-white drop-shadow-lg">
            GenderFlipLife
          </h1>
          <p className="text-lg text-white/90">
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
                fromYear={1900}
                toYear={2024}
                captionLayout="dropdown"
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
