
import { Button } from "@/components/ui/button";
import { Repeat, Video, Music, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { EbookGenerator } from "@/components/EbookGenerator";
import { useToast } from "@/hooks/use-toast";
import { findRelevantSong, openSongInPreferredPlatform } from "@/utils/taylorSwiftSongs";
import { shareToTikTok, TIKTOK_TEMPLATES } from "@/utils/tiktokShare";
import { useEffect, useRef } from "react";

interface StoryResultProps {
  result: string;
  storyId: string;
  onRegenerateClick: () => void;
}

export const StoryResult = ({ result, storyId, onRegenerateClick }: StoryResultProps) => {
  const { toast } = useToast();
  const relevantSong = findRelevantSong(result);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (relevantSong) {
      // Create and play audio when component mounts or result changes
      audioRef.current = new Audio(relevantSong.previewUrl);
      audioRef.current.volume = 0.3; // Set a reasonable volume
      audioRef.current.play().catch(error => {
        console.log("Autoplay prevented:", error);
        toast({
          title: "Music Available",
          description: `Click to play "${relevantSong.title}" which matches your story's mood!`,
        });
      });
    }

    // Cleanup function to stop audio when component unmounts or result changes
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [result, relevantSong]);

  const handleTikTokShare = async () => {
    try {
      const songDetails = relevantSong ? {
        musicUrl: relevantSong.spotifyUrl,
      } : {};

      await shareToTikTok({
        text: result.slice(0, 300) + "...",
        hashtags: ["alternateTimeline", "whatIf", "storytelling"],
        template: 'story',
        ...songDetails,
      });
      
      toast({
        title: "Opening TikTok",
        description: "Your story video is being created! Add final touches in TikTok.",
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
          {/* Moral of the Story Section */}
          <div className="mt-12 p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-100">
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

          {/* TikTok Template Selection */}
          <div className="mt-8 p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-100">
            <div className="flex items-center gap-2 mb-6">
              <Video className="h-6 w-6 text-purple-500" />
              <h3 className="text-xl font-semibold text-[#4A4A4A]">
                Share Your Story
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {Object.entries(TIKTOK_TEMPLATES).map(([key, template]) => (
                <button
                  key={key}
                  onClick={() => handleTikTokShare()}
                  className="group relative p-6 rounded-xl bg-white border border-purple-100 shadow-sm 
                    hover:shadow-md transition-all duration-300 hover:border-purple-200 
                    hover:transform hover:-translate-y-1"
                >
                  <div className="space-y-3">
                    <h4 className="font-semibold text-lg text-[#4A4A4A] group-hover:text-purple-600 
                      transition-colors">{template.name}</h4>
                    <p className="text-sm text-gray-600 leading-relaxed">{template.description}</p>
                    <div className="flex items-center gap-2 text-xs text-purple-500 font-medium pt-2">
                      <Video className="h-4 w-4" />
                      <span>{template.duration}s</span>
                    </div>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 to-pink-500/0 
                    group-hover:from-purple-500/5 group-hover:to-pink-500/5 rounded-xl transition-all 
                    duration-300" />
                </button>
              ))}
            </div>
          </div>

          {/* Song Section */}
          {relevantSong && (
            <div className="mt-8 p-6 bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl border border-pink-100">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-gray-600">{relevantSong.mood}</p>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => {
                        if (audioRef.current?.paused) {
                          audioRef.current?.play();
                        } else {
                          audioRef.current?.pause();
                        }
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-full hover:bg-purple-200 transition-colors"
                    >
                      <Music className="h-5 w-5" />
                      <span className="font-medium">Preview</span>
                    </button>
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
            </div>
          )}

          {/* Illustrated Story Section */}
          <div className="mt-12">
            <h3 className="text-xl font-semibold text-[#4A4A4A] mb-6">
              Create an Illustrated Story
            </h3>
            <EbookGenerator originalStory={result} storyId={storyId} />
          </div>
        </>
      )}
    </div>
  );
};
