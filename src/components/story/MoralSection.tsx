
import { Sparkles } from "lucide-react";

interface MoralSectionProps {
  story: string;
}

export const MoralSection = ({ story }: MoralSectionProps) => {
  const getMoralOfStory = (story: string): string => {
    if (story.toLowerCase().includes("dream") || story.toLowerCase().includes("goal")) {
      return "Never be afraid to dream big and chase your goals. Your unique path is what makes your story special.";
    } else if (story.toLowerCase().includes("friend") || story.toLowerCase().includes("community")) {
      return "True connections and authentic friendships can transform your life in unexpected ways.";
    } else if (story.toLowerCase().includes("challenge") || story.toLowerCase().includes("overcome")) {
      return "Every challenge you face is an opportunity to grow stronger and discover your true potential.";
    } else if (story.toLowerCase().includes("change") || story.toLowerCase().includes("transform")) {
      return "Embrace change as a catalyst for growth. Your ability to adapt is your superpower.";
    } else {
      return "Your unique journey shapes who you are. Trust yourself and keep writing your own story.";
    }
  };

  return (
    <div className="mt-12 p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-100">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="h-6 w-6 text-purple-500" />
        <h3 className="text-xl font-semibold text-[#4A4A4A]">
          Moral of the Story
        </h3>
      </div>
      <p className="text-gray-700 italic">
        {getMoralOfStory(story)}
      </p>
    </div>
  );
};
