
import { Button } from "@/components/ui/button";
import { Repeat } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useToast } from "@/hooks/use-toast";
import { findRelevantSong } from "@/utils/taylorSwiftSongs";
import { MoralSection } from "./story/MoralSection";
import { TikTokShareSection } from "./story/TikTokShareSection";
import { SongPreviewSection } from "./story/SongPreviewSection";
import { IllustratedStorySection } from "./story/IllustratedStorySection";

interface StoryResultProps {
  result: string;
  storyId: string;
  onRegenerateClick: () => void;
}

export const StoryResult = ({ result, storyId, onRegenerateClick }: StoryResultProps) => {
  const { toast } = useToast();
  const relevantSong = findRelevantSong(result);

  return (
    <div className="glass-card rounded-2xl p-8 animate-fadeIn [animation-delay:400ms] bg-white/90 backdrop-blur-lg border border-[#E5DEFF]/50 shadow-xl">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold text-[#4A4A4A]">
          Your Pre-2020 Timeline
        </h2>
      </div>
      
      {/* Story Content */}
      <div className="prose prose-lg prose-pink max-w-none mb-8">
        <ReactMarkdown>{result}</ReactMarkdown>
      </div>

      {/* Actions Section */}
      <div className="flex flex-wrap gap-4 items-center justify-between mb-8 pt-4 border-t border-[#E5DEFF]">
        <Button
          onClick={onRegenerateClick}
          className="text-lg bg-gradient-to-r from-[#E5DEFF] to-[#FFDEE2] text-[#4A4A4A] 
            px-8 py-4 rounded-lg font-bold hover:opacity-90 transition-opacity flex items-center gap-2"
        >
          <Repeat className="h-6 w-6" />
          Try Another Timeline!
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            navigator.clipboard.writeText(result);
            toast({
              title: "Copied to clipboard!",
              description: "Share your alternate timeline with friends!",
            });
          }}
          className="text-sm border-[#E5DEFF] hover:bg-[#E5DEFF]/10"
        >
          Share Story
        </Button>
      </div>

      {result && (
        <>
          <MoralSection story={result} />
          <TikTokShareSection 
            story={result} 
            songUrl={relevantSong?.spotifyUrl} 
          />
          <SongPreviewSection story={result} />
          <IllustratedStorySection story={result} storyId={storyId} />
        </>
      )}
    </div>
  );
};
