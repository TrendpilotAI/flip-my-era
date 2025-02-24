
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles, User } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { StoriesList } from "@/components/StoriesList";
import { StarSignDisplay } from "./StarSignDisplay";
import { PersonalitySelector } from "./PersonalitySelector";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import type { PersonalityTypeKey } from "@/types/personality";
import { supabase } from "@/integrations/supabase/client";
import { AuthDialog } from "./AuthDialog";
import { useEffect, useState } from "react";

type GenderType = "same" | "flip" | "neutral";

interface StoryFormProps {
  name: string;
  setName: (name: string) => void;
  date: Date | undefined;
  setDate: (date: Date | undefined) => void;
  loading: boolean;
  handleSubmit: () => void;
  handleStorySelect: (story: any) => void;
  personalityTypes: any;
  personalityType: PersonalityTypeKey;
  setPersonalityType: (type: PersonalityTypeKey) => void;
  gender: GenderType;
  setGender: (gender: GenderType) => void;
}

export const StoryForm = ({
  name,
  setName,
  date,
  setDate,
  loading,
  handleSubmit,
  handleStorySelect,
  personalityTypes,
  personalityType,
  setPersonalityType,
  gender,
  setGender
}: StoryFormProps) => {
  const [isSignedIn, setIsSignedIn] = useState(false);

  useEffect(() => {
    // Check initial auth state
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsSignedIn(!!session);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsSignedIn(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedDate = e.target.valueAsDate;
    setDate(selectedDate || undefined);
  };

  return (
    <div className="glass-card rounded-2xl p-8 space-y-6 animate-fadeIn [animation-delay:200ms] bg-white/90 backdrop-blur-lg border border-[#E5DEFF]/50 shadow-xl">
      <div className="space-y-4">
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-[#4A4A4A] flex items-center gap-2">
              Discover Your Alternate Timeline
              <Sparkles className="h-5 w-5 text-purple-500" />
            </h2>
            <p className="text-purple-600 italic">Where your story gets its glitter filter...</p>
          </div>
          {isSignedIn ? (
            <Button 
              variant="outline" 
              className="border-[#E5DEFF] hover:bg-[#E5DEFF]/10 transition-all duration-300 group"
            >
              <User className="h-4 w-4 text-purple-500 mr-2" />
              <span>Signed In</span>
            </Button>
          ) : (
            <AuthDialog
              trigger={
                <Button 
                  variant="outline" 
                  className="border-[#E5DEFF] hover:bg-[#E5DEFF]/10 transition-all duration-300 hover:scale-105 group"
                >
                  <span className="mr-2">Return to Your Era</span>
                  <Sparkles className="h-4 w-4 text-purple-500 group-hover:animate-pulse" />
                </Button>
              }
            />
          )}
        </div>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <label className="block text-base font-medium text-[#4A4A4A] flex items-center gap-2">
            <span>Your Main Character Name</span>
            <Sparkles className="h-4 w-4 text-purple-500" />
          </label>
          <Input 
            placeholder="Enter your character name" 
            value={name} 
            onChange={e => setName(e.target.value)} 
            className="input-field text-base py-2 border-[#E5DEFF] focus:border-[#FFDEE2]"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-base font-medium text-[#4A4A4A] flex items-center gap-2">
            <span>Your Character's Origin Story</span>
            <Sparkles className="h-4 w-4 text-purple-500" />
          </label>
          <div className="space-y-4">
            <Input 
              type="date" 
              onChange={handleDateChange} 
              className="input-field text-base py-2 border-[#E5DEFF] focus:border-[#FFDEE2]" 
              max={new Date().toISOString().split('T')[0]} 
            />
            {date && <StarSignDisplay date={date} />}
          </div>
        </div>

        <div className="space-y-4">
          <label className="block text-base font-medium text-[#4A4A4A] flex items-center gap-2">
            <span>Gender in Your Story</span>
            <Sparkles className="h-4 w-4 text-purple-500" />
          </label>
          <RadioGroup 
            value={gender} 
            onValueChange={(value: GenderType) => setGender(value)} 
            className="grid grid-cols-3 gap-4"
          >
            <div className="flex items-center space-x-2 rounded-lg border p-4 cursor-pointer hover:bg-[#E5DEFF]/10">
              <RadioGroupItem value="same" id="same" />
              <Label htmlFor="same">Keep Same</Label>
            </div>
            <div className="flex items-center space-x-2 rounded-lg border p-4 cursor-pointer hover:bg-[#E5DEFF]/10">
              <RadioGroupItem value="flip" id="flip" />
              <Label htmlFor="flip">Flip It!</Label>
            </div>
            <div className="flex items-center space-x-2 rounded-lg border p-4 cursor-pointer hover:bg-[#E5DEFF]/10">
              <RadioGroupItem value="neutral" id="neutral" />
              <Label htmlFor="neutral">Gender Neutral</Label>
            </div>
          </RadioGroup>
        </div>

        <PersonalitySelector personalityTypes={personalityTypes} selectedType={personalityType} onSelect={setPersonalityType} />
      </div>

      <Button 
        onClick={handleSubmit} 
        disabled={loading || !name} 
        className="w-full bg-gradient-to-r from-[#E5DEFF] to-[#FFDEE2] text-[#4A4A4A] hover:opacity-90 transition-opacity"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Time Traveling...
          </>
        ) : "Flip My Era"}
      </Button>
    </div>
  );
};
