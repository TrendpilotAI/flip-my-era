import { Button } from '@/modules/shared/components/ui/button';
import { Repeat, Undo, Download, Share2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useToast } from '@/modules/shared/hooks/use-toast';
import { findRelevantSong } from "@/modules/story/utils/taylorSwiftSongs";
import { MoralSection } from "./MoralSection";
import { EnhancedSongPreview } from "./EnhancedSongPreview";
import { useNavigate } from "react-router-dom";
import { supabase } from '@/core/integrations/supabase/client';
import { useState } from "react";
import { CreditBasedEbookGenerator } from "@/modules/ebook/components/CreditBasedEbookGenerator";
import { useClerkAuth } from '@/modules/auth/contexts/ClerkAuthContext';
import { DownloadShareModal } from '@/modules/shared/components/DownloadShareModal';

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
  const { isAuthenticated } = useClerkAuth();
  const relevantSong = findRelevantSong(result);
  const [showMemoryEnhancedGenerator, setShowMemoryEnhancedGenerator] = useState(false);
  const [showDownloadShareModal, setShowDownloadShareModal] = useState(false);

  const handleCreateMemoryEnhancedEbook = async () => {
    try {
      if (!isAuthenticated) {
        // Determine if we're in development or production
        const isDevelopment = import.meta.env.DEV;
        
        // Save the current path, ensuring we use the correct port in development
        const currentPath = window.location.pathname;
        const returnPath = isDevelopment 
          ? `${window.location.pathname}`
          : currentPath;
        
        // Save the return path in session storage
        sessionStorage.setItem('auth_return_path', JSON.stringify({
          returnTo: returnPath,
          storyId: storyId
        }));
        
        toast({
          title: "Authentication Required",
          description: "Please sign in to create your E-Memory Book.",
        });
        navigate("/auth");
        return;
      }
      
      // User is authenticated, show the memory-enhanced generator
      setShowMemoryEnhancedGenerator(true);
      
      toast({
        title: "Memory-Enhanced E-Book Generator Ready",
        description: "Now you can create your personalized illustrated story with perfect continuity!",
      });
    } catch (error) {
      console.error("Error checking authentication:", error);
      toast({
        title: "Something went wrong",
        description: "Please try again or refresh the page.",
        variant: "destructive",
      });
    }
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

  // If showing the memory-enhanced generator, render it instead of the story preview
  if (showMemoryEnhancedGenerator) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold text-gray-900">🧠 Memory-Enhanced E-Book Generation</h2>
          <Button 
            variant="outline" 
            onClick={() => setShowMemoryEnhancedGenerator(false)}
          >
            ← Back to Story
          </Button>
        </div>
        <CreditBasedEbookGenerator
          originalStory={result}
          storyId={storyId}
          useTaylorSwiftThemes={true}
          selectedTheme="coming-of-age"
          selectedFormat="short-story"
          onChaptersGenerated={(chapters) => {
            console.log('Credit-based chapters generated:', chapters);
            toast({
              title: "Success!",
              description: `Generated ${chapters.length} chapters with credit-based system.`,
            });
          }}
          onError={(error) => {
            console.error('Credit-based generation error:', error);
            toast({
              title: "Generation Error",
              description: error,
              variant: "destructive",
            });
          }}
        />
      </div>
    );
  }

  return (
    <div className="glass-card rounded-2xl p-8 animate-fadeIn [animation-delay:400ms] bg-white/90 backdrop-blur-lg border border-[#E5DEFF]/50 shadow-xl">
      {/* Title Section - Made more prominent */}
      <div className="text-center mb-8 pb-6 border-b border-[#E5DEFF]">
        <h1 className="text-2xl md:text-3xl font-bold text-[#2D2D2D] mb-3 leading-tight">
          {getStoryTitle(result)}
        </h1>
        <p className="text-base text-purple-600 italic font-medium">
          {getEraDescription(result)}
        </p>
      </div>
      
      {/* Story Content - Normal text formatting */}
      <div className="max-w-none mb-6">
        <ReactMarkdown
          components={{
            p: ({ children }) => (
              <p className="text-base leading-7 text-gray-700 mb-4 first:mt-0">{children}</p>
            ),
            strong: ({ children }) => (
              <strong className="text-purple-700 font-semibold">{children}</strong>
            ),
            em: ({ children }) => (
              <em className="text-purple-600 italic">{children}</em>
            ),
            // Handle any remaining headings in content
            h1: ({ children }) => (
              <h2 className="text-xl font-bold text-gray-900 mt-6 mb-3">{children}</h2>
            ),
            h2: ({ children }) => (
              <h3 className="text-lg font-semibold text-gray-900 mt-5 mb-2">{children}</h3>
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
          <Button
            onClick={() => setShowDownloadShareModal(true)}
            variant="outline"
            className="text-lg border-blue-300 hover:bg-blue-50 text-blue-600 flex items-center gap-2"
          >
            <Download className="h-5 w-5" />
            Download & Share
          </Button>
        </div>
      </div>

      {result && (
        <>
          <MoralSection story={getStoryContent(result)} />
          <EnhancedSongPreview story={getStoryContent(result)} />
          
          <div className="mt-12 text-center space-y-4">
            <div className="flex justify-center">
              <Button 
                className="max-w-md text-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white 
                  px-8 py-4 rounded-xl font-bold hover:opacity-90 transition-opacity shadow-lg"
                onClick={handleCreateMemoryEnhancedEbook}
              >
                🧠 Create E-Memory Book
              </Button>
            </div>
            <p className="text-sm text-gray-600">
              Transform your story into a beautifully illustrated book with perfect continuity
            </p>
            <div className="text-xs text-blue-600 bg-blue-50 p-3 rounded-lg max-w-2xl mx-auto">
              <strong>Advanced AI:</strong> Our memory-enhanced system maintains character consistency, 
              eliminates repetition, and creates perfectly coherent multi-chapter stories.
            </div>
          </div>
        </>
      )}

      {/* Download & Share Modal */}
      <DownloadShareModal
        isOpen={showDownloadShareModal}
        onClose={() => setShowDownloadShareModal(false)}
        content={{
          id: storyId,
          title: getStoryTitle(result),
          content: getStoryContent(result),
          type: 'story',
          author: 'FlipMyEra User'
        }}
      />
    </div>
  );
};
