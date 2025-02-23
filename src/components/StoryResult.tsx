
import { Button } from "@/components/ui/button";
import { Repeat, Undo } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useToast } from "@/hooks/use-toast";
import { findRelevantSong } from "@/utils/taylorSwiftSongs";
import { MoralSection } from "./story/MoralSection";
import { EnhancedSongPreview } from "./story/EnhancedSongPreview";

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

  // Extract a title from the story content
  const getStoryTitle = (content: string) => {
    const firstLine = content.split('\n')[0];
    return firstLine.replace(/^#\s*/, '').slice(0, 50);
  };

  // Get era description based on story content
  const getEraDescription = (content: string) => {
    if (content.toLowerCase().includes('90s')) {
      return "Journey back to the vibrant era of the 1990s";
    } else if (content.toLowerCase().includes('80s')) {
      return "Step into the bold and colorful world of the 1980s";
    } else {
      return "Experience your life in a simpler, pre-2020 timeline";
    }
  };

  return (
    <div className="glass-card rounded-2xl p-8 animate-fadeIn [animation-delay:400ms] bg-white/90 backdrop-blur-lg border border-[#E5DEFF]/50 shadow-xl">
      <div className="text-center mb-8 pb-6 border-b border-[#E5DEFF]">
        <h2 className="text-3xl font-bold text-[#4A4A4A] mb-2">
          {getStoryTitle(result)}
        </h2>
        <p className="text-lg text-purple-600 italic">
          {getEraDescription(result)}
        </p>
      </div>
      
      <div className="prose prose-lg prose-pink max-w-none mb-8 font-serif leading-relaxed">
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
            Try Another Timeline
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
      </div>

      {result && (
        <>
          <MoralSection story={result} />
          <EnhancedSongPreview story={result} />
          
          <div className="mt-12 text-center">
            <Button 
              className="w-full max-w-2xl text-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white 
                py-6 rounded-xl font-bold hover:opacity-90 transition-opacity shadow-lg"
              onClick={() => {
                toast({
                  title: "Coming Soon!",
                  description: "Create an account to generate your full E-Memory Book.",
                });
              }}
            >
              Create my Personalized Era E-Memory Book
            </Button>
            <p className="mt-4 text-sm text-gray-600">
              Transform this preview into a complete, personalized memory book
            </p>
          </div>
        </>
      )}
    </div>
  );
};
