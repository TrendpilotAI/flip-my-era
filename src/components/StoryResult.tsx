
import { Button } from "@/components/ui/button";
import { Repeat, Undo } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useToast } from "@/hooks/use-toast";
import { findRelevantSong } from "@/utils/taylorSwiftSongs";
import { MoralSection } from "./story/MoralSection";
import { EnhancedSongPreview } from "./story/EnhancedSongPreview";
import { useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();
  const relevantSong = findRelevantSong(result);

  const handleCreateEbook = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to create your E-Memory Book.",
      });
      navigate("/auth");
      return;
    }
    
    toast({
      title: "Coming Soon!",
      description: "Create an account to generate your full E-Memory Book.",
    });
  };

  // Extract title from the first line if it starts with #
  const getStoryTitle = (content: string) => {
    const firstLine = content.split('\n')[0];
    return firstLine.startsWith('#') ? firstLine.replace(/^#\s*/, '') : firstLine.slice(0, 50);
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

  // Remove the title from the story content since we'll display it separately
  const getStoryContent = (content: string) => {
    const lines = content.split('\n');
    if (lines[0].startsWith('#')) {
      return lines.slice(1).join('\n').trim();
    }
    return content;
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
      
      <div className="prose prose-lg prose-pink max-w-none mb-8 font-serif leading-relaxed space-y-6">
        <ReactMarkdown
          components={{
            p: ({ children }) => (
              <p className="text-lg leading-relaxed text-gray-700 mb-6">{children}</p>
            ),
            strong: ({ children }) => (
              <strong className="text-purple-700">{children}</strong>
            ),
          }}
        >
          {getStoryContent(result)}
        </ReactMarkdown>
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
          <MoralSection story={getStoryContent(result)} />
          <EnhancedSongPreview story={getStoryContent(result)} />
          
          <div className="mt-12 text-center">
            <Button 
              className="w-full max-w-2xl text-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white 
                py-6 rounded-xl font-bold hover:opacity-90 transition-opacity shadow-lg"
              onClick={handleCreateEbook}
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
