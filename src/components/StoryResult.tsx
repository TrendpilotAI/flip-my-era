import { Button } from "@/components/ui/button";
import { Repeat, Undo, Volume2, VolumeX } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useToast } from "@/hooks/use-toast";
import { findRelevantSong } from "@/utils/taylorSwiftSongs";
import { MoralSection } from "./story/MoralSection";
import { TikTokShareSection } from "./story/TikTokShareSection";
import { SongPreviewSection } from "./story/SongPreviewSection";
import { IllustratedStorySection } from "./story/IllustratedStorySection";
import { EnhancedSongPreview } from "./story/EnhancedSongPreview";
import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

interface StoryResultProps {
  result: string;
  storyId: string;
  onRegenerateClick: () => void;
  onUndoClick?: () => void;
  hasPreviousStory?: boolean;
}

export const StoryResult = ({ 
  result, 
  storyId, 
  onRegenerateClick,
  onUndoClick,
  hasPreviousStory 
}: StoryResultProps) => {
  const { toast } = useToast();
  const relevantSong = findRelevantSong(result);
  const [isNarrating, setIsNarrating] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleNarration = async () => {
    if (isNarrating && audioRef.current) {
      audioRef.current.pause();
      setIsNarrating(false);
      return;
    }

    const loadingToast = toast({
      title: "Preparing narration...",
      description: "Getting ready to tell your bedtime story...",
    });

    try {
      console.log('Calling text-to-speech function...');
      const { data, error } = await supabase.functions.invoke('text-to-speech', {
        body: { text: result.slice(0, 4000) }
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw error;
      }

      if (!data?.audioContent) {
        throw new Error('No audio content received');
      }

      console.log('Received audio content, creating audio element...');
      const audio = new Audio(`data:audio/mp3;base64,${data.audioContent}`);
      audioRef.current = audio;
      
      audio.onended = () => {
        setIsNarrating(false);
      };

      audio.onerror = (e) => {
        console.error('Audio playback error:', e);
        setIsNarrating(false);
        toast({
          title: "Playback failed",
          description: "There was an error playing the narration.",
          variant: "destructive",
        });
      };

      setIsNarrating(true);
      await audio.play();
      
      loadingToast.dismiss();
      toast({
        title: "Story time!",
        description: "Sit back and enjoy your bedtime story...",
      });
    } catch (error) {
      console.error('Narration error:', error);
      loadingToast.dismiss();
      setIsNarrating(false);
      toast({
        title: "Narration failed",
        description: error.message || "Sorry, I couldn't tell the story right now. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="glass-card rounded-2xl p-8 animate-fadeIn [animation-delay:400ms] bg-white/90 backdrop-blur-lg border border-[#E5DEFF]/50 shadow-xl">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold text-[#4A4A4A]">
          Your Pre-2020 Timeline
        </h2>
        <Button
          onClick={handleNarration}
          variant="outline"
          className={`text-lg border-[#E5DEFF] hover:bg-[#E5DEFF]/10 flex items-center gap-2 ${
            isNarrating ? 'bg-[#E5DEFF]/20' : ''
          }`}
        >
          {isNarrating ? (
            <>
              <VolumeX className="h-5 w-5" />
              Stop Narration
            </>
          ) : (
            <>
              <Volume2 className="h-5 w-5" />
              Read as Bedtime Story
            </>
          )}
        </Button>
      </div>
      
      <div className="prose prose-lg prose-pink max-w-none mb-8">
        <ReactMarkdown>{result}</ReactMarkdown>
      </div>

      <div className="flex flex-wrap gap-4 items-center justify-between mb-8 pt-4 border-t border-[#E5DEFF]">
        <div className="flex gap-2">
          <Button
            onClick={onRegenerateClick}
            className="text-lg bg-gradient-to-r from-[#E5DEFF] to-[#FFDEE2] text-[#4A4A4A] 
              px-8 py-4 rounded-lg font-bold hover:opacity-90 transition-opacity flex items-center gap-2"
          >
            <Repeat className="h-6 w-6" />
            Try Another Timeline!
          </Button>
          {hasPreviousStory && onUndoClick && (
            <Button
              onClick={onUndoClick}
              variant="outline"
              className="text-lg border-[#E5DEFF] hover:bg-[#E5DEFF]/10 flex items-center gap-2"
            >
              <Undo className="h-5 w-5" />
              Undo
            </Button>
          )}
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

      {result && (
        <>
          <MoralSection story={result} />
          <EnhancedSongPreview story={result} />
          <TikTokShareSection 
            story={result} 
            songUrl={relevantSong?.spotifyUrl} 
          />
          <IllustratedStorySection story={result} storyId={storyId} />
        </>
      )}
    </div>
  );
};
