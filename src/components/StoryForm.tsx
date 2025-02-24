import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { StoriesList } from "@/components/StoriesList";
import { StarSignDisplay } from "./StarSignDisplay";
import { PersonalitySelector } from "./PersonalitySelector";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import type { PersonalityTypeKey } from "@/types/personality";
import { supabase } from "@/integrations/supabase/client";
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
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedDate = e.target.valueAsDate;
    setDate(selectedDate || undefined);
  };
  return <div className="glass-card rounded-2xl p-8 space-y-6 animate-fadeIn [animation-delay:200ms] bg-white/90 backdrop-blur-lg border border-[#E5DEFF]/50 shadow-xl">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-[#4A4A4A]">Discover Your Alternate Timeline</h2>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" className="border-[#E5DEFF] hover:bg-[#E5DEFF]/10" onClick={async () => {
            const {
              data: {
                session
              }
            } = await supabase.auth.getSession();
            if (!session) {
              window.location.href = "/auth";
              return;
            }
          }}>
              Load Saved Story
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Your Saved Stories</DialogTitle>
            </DialogHeader>
            <StoriesList onStorySelect={handleStorySelect} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <label className="block text-base font-medium text-[#4A4A4A]">
            Your Name
          </label>
          <Input placeholder="Enter your name" value={name} onChange={e => setName(e.target.value)} className="input-field text-base py-2 border-[#E5DEFF] focus:border-[#FFDEE2]" />
        </div>

        <div className="space-y-2">
          <label className="block text-base font-medium text-[#4A4A4A]">Your Character's Origin Story</label>
          <Input type="date" onChange={handleDateChange} className="input-field text-base py-2 border-[#E5DEFF] focus:border-[#FFDEE2]" max={new Date().toISOString().split('T')[0]} />
        </div>

        <div className="space-y-4">
          <label className="block text-base font-medium text-[#4A4A4A]">
            Gender in Your Story
          </label>
          <RadioGroup value={gender} onValueChange={(value: GenderType) => setGender(value)} className="grid grid-cols-3 gap-4">
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

        {date && <StarSignDisplay date={date} />}
      </div>

      <Button onClick={handleSubmit} disabled={loading || !name} className="w-full bg-gradient-to-r from-[#E5DEFF] to-[#FFDEE2] text-[#4A4A4A] hover:opacity-90 transition-opacity">
        {loading ? <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Time Traveling...
          </> : "Take Me Back!"}
      </Button>
    </div>;
};