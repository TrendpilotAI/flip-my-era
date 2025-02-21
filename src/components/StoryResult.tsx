import { Button } from "@/components/ui/button";
import { Repeat, Video, Music, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { EbookGenerator } from "@/components/EbookGenerator";
import { useToast } from "@/hooks/use-toast";
import { findRelevantSong, openSongInPreferredPlatform } from "@/utils/taylorSwiftSongs";
import { shareToTikTok } from "@/utils/tiktokShare";

interface StoryResultProps {
  result: string;
  storyId: string;
  onRegenerateClick: () => void;
}

export const StoryResult = ({ result, storyId, onRegenerateClick }: StoryResultProps) => {
  const { toast } = useToast();
  const relevantSong = findRelevantSong(result);

  const handleTikTokShare = async () => {
    try {
      await shareToTikTok({
        text: result.slice(0, 300) + "...", // TikTok has character limits
        hashtags: ["alternateTimeline", "whatIf", "storytelling"],
      });
      
      toast({
        title: "Opening TikTok",
        description: "Create your video with the story text!",
      });
    } catch (error) {
      toast({
        title: "Couldn't open TikTok",
        description: "Please try copying the story and sharing manually.",
        variant: "destructive",
      });
    }
  };

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
    <div className="glass-card rounded-2xl p-8 animate-fadeIn [animation-delay:400ms] bg-white/90 backdrop-blur-lg border border-[#E5DEFF]/50 shadow-xl">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold text-[#4A4A4A]">
          Your Pre-2020 Timeline
        </h2>
      </div>
      <div className="prose prose-lg prose-pink max-w-none">
        <ReactMarkdown>{result}</ReactMarkdown>
      </div>

      <div className="mt-8 p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-100">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-6 w-6 text-purple-500" />
          <h3 className="text-xl font-semibold text-[#4A4A4A]">
            Moral of the Story
          </h3>
        </div>
        <p className="text-gray-700 italic">
          {getMoralOfStory(result)}
        </p>
      </div>

      {relevantSong && (
        <div className="mt-8 p-6 bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl border border-pink-100">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-gray-600">{relevantSong.mood}</p>
              <button
                onClick={() => openSongInPreferredPlatform(relevantSong)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-400 to-purple-500 text-white rounded-full hover:opacity-90 transition-opacity"
              >
                <Music className="h-5 w-5" />
                <span className="font-semibold">Listen to "{relevantSong.title}"</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mt-12">
        <h3 className="text-xl font-semibold text-[#4A4A4A] mb-6">
          Create an Illustrated Story
        </h3>
        <EbookGenerator originalStory={result} storyId={storyId} />
      </div>

      <div className="mt-8 pt-8 border-t border-[#E5DEFF]">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <Button
            onClick={onRegenerateClick}
            className="text-lg bg-gradient-to-r from-[#E5DEFF] to-[#FFDEE2] text-[#4A4A4A] px-8 py-4 rounded-lg font-bold hover:opacity-90 transition-opacity flex items-center gap-2"
          >
            <Repeat className="h-6 w-6" />
            Try Another Timeline!
          </Button>
          <div className="flex gap-2">
            <Button
              onClick={handleTikTokShare}
              variant="outline"
              className="text-sm border-[#E5DEFF] hover:bg-[#E5DEFF]/10"
            >
              <Video className="h-4 w-4 mr-2" />
              Make TikTok
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
        </div>
      </div>
    </div>
  );
};
