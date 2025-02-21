
import { Button } from "@/components/ui/button";
import { Repeat, TiktokIcon } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { EbookGenerator } from "@/components/EbookGenerator";
import { useToast } from "@/hooks/use-toast";

interface StoryResultProps {
  result: string;
  storyId: string;
  onRegenerateClick: () => void;
}

export const StoryResult = ({ result, storyId, onRegenerateClick }: StoryResultProps) => {
  const { toast } = useToast();

  const handleTikTokShare = async () => {
    toast({
      title: "Coming Soon!",
      description: "TikTok video generation will be available in a future update. For now, you can copy the story and create your own TikTok video!",
    });
  };

  return (
    <div className="glass-card rounded-2xl p-8 animate-fadeIn [animation-delay:400ms] bg-white/90 backdrop-blur-lg border border-[#E5DEFF]/50 shadow-xl">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold text-[#4A4A4A]">
          Your Pre-2020 Timeline
        </h2>
      </div>
      <div className="prose prose-lg prose-pink max-w-none">
        <ReactMarkdown>{result}</ReactMarkdown>
      </div>
      <div className="mt-6 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex gap-2">
          <Button
            onClick={onRegenerateClick}
            className="text-lg bg-gradient-to-r from-[#E5DEFF] to-[#FFDEE2] text-[#4A4A4A] px-8 py-4 rounded-lg font-bold hover:opacity-90 transition-opacity flex items-center gap-2"
          >
            <Repeat className="h-6 w-6" />
            Try Another Timeline!
          </Button>
          <Button
            onClick={handleTikTokShare}
            className="text-lg bg-black text-white px-8 py-4 rounded-lg font-bold hover:opacity-90 transition-opacity flex items-center gap-2"
          >
            <TiktokIcon className="h-6 w-6" />
            Make TikTok
          </Button>
        </div>
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

      <div className="mt-12">
        <h3 className="text-xl font-semibold text-[#4A4A4A] mb-6">
          Create an Illustrated Story
        </h3>
        <EbookGenerator originalStory={result} storyId={storyId} />
      </div>
    </div>
  );
};
