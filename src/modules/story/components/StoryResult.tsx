import { Button } from '@/modules/shared/components/ui/button';
import { Repeat, Undo, Download, Share2, ArrowLeft } from "lucide-react";
import { StreamingText } from './StreamingText';
import ReactMarkdown from "react-markdown";
import { useToast } from '@/modules/shared/hooks/use-toast';
import { findRelevantSong } from "@/modules/story/utils/taylorSwiftSongs";
import { MoralSection } from "./MoralSection";
import { EnhancedSongPreview } from "./EnhancedSongPreview";
import { useNavigate } from "react-router-dom";
import { supabase } from '@/core/integrations/supabase/client';
import { useState, useEffect } from "react";
import { CreditBasedEbookGenerator } from "@/modules/ebook/components/CreditBasedEbookGenerator";
import { useClerkAuth } from '@/modules/auth/contexts/ClerkAuthContext';
import { DownloadShareModal } from '@/modules/shared/components/DownloadShareModal';
import { useTheme } from '@/modules/shared/contexts/ThemeContext';
import { useThemeColors } from '@/modules/shared/utils/themeUtils';

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
  console.log('StoryResult rendered with:', { result, storyId });
  
  // Early return with error message if no result
  if (!result) {
    return (
      <div className="glass-card rounded-2xl p-8 animate-fadeIn bg-white/90 backdrop-blur-lg border border-gray-200 shadow-xl">
        <p className="text-red-600">No story content available to display.</p>
      </div>
    );
  }
  const { toast } = useToast();
  const navigate = useNavigate();
  const { isAuthenticated } = useClerkAuth();
  const { currentTheme } = useTheme();
  const themeColors = useThemeColors();
  const relevantSong = findRelevantSong(result);
  const [showMemoryEnhancedGenerator, setShowMemoryEnhancedGenerator] = useState(false);
  const [showDownloadShareModal, setShowDownloadShareModal] = useState(false);
  // Generate a temporary ID if storyId is not provided
  const effectiveStoryId = storyId || crypto.randomUUID();

  // Apply theme colors to drop-cap via CSS custom properties
  useEffect(() => {
    document.documentElement.style.setProperty('--drop-cap-color', themeColors.primary);
  }, [themeColors.primary]);

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
          storyId: effectiveStoryId
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

  // Extract title from the story content with improved logic
  const getStoryTitle = (content: string) => {
    const lines = content.split('\n').filter(line => line.trim());
    if (lines.length === 0) return "Untitled Story";
    
    const firstLine = lines[0].trim();
    
    // Check for markdown title format
    if (firstLine.startsWith('#')) {
      return firstLine.replace(/^#+\s*/, '');
    }
    
    // Check if first line looks like a title (contains colon, is shorter than typical paragraph)
    if (firstLine.includes(':') && firstLine.length < 100) {
      return firstLine;
    }
    
    // Check if first line is significantly shorter than the second line (title-like)
    if (lines.length > 1) {
      const secondLine = lines[1].trim();
      if (firstLine.length < secondLine.length * 0.6 && firstLine.length < 80) {
        return firstLine;
      }
    }
    
    // Fallback: use first line but limit to reasonable title length
    return firstLine.length > 60 ? firstLine.slice(0, 60) + '...' : firstLine;
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
    if (!content) return '';
    
    // Split content into lines and remove empty ones
    const lines = content.split('\n').filter(line => line.trim());
    if (lines.length === 0) return '';
    
    let contentStart = 0;
    const firstLine = lines[0].trim();
    
    // Skip markdown headings and empty lines
    if (firstLine.startsWith('#')) {
      contentStart = 1;
      while (contentStart < lines.length && !lines[contentStart].trim()) {
        contentStart++;
      }
    }
    
    // Join the remaining lines
    const storyContent = lines.slice(contentStart).join('\n').trim();
    console.log('Processed story content:', {
      originalLength: content.length,
      processedLength: storyContent.length,
      firstLine: storyContent.substring(0, 100) + '...'
    });
    
    return storyContent;
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
          storyId={effectiveStoryId}
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

  // Helper function to enhance the first sentence
  const enhanceFirstSentence = (content: string) => {
    if (!content) return null;
    
    // Split into sentences more reliably
    const sentences = content.split(/(?<=[.!?])\s+/).filter(s => s.trim());
    if (sentences.length === 0) return content;
    
    const firstSentence = sentences[0].trim();
    const restOfContent = sentences.slice(1).join(' ').trim();
    
    console.log('Enhancing content:', {
      firstSentence: firstSentence.substring(0, 50) + '...',
      hasRestOfContent: Boolean(restOfContent),
      restContentLength: restOfContent.length
    });
    
    return (
      <>
        <p 
          className="text-xl md:text-2xl leading-9 font-medium mb-8 first:mt-0 text-justify drop-cap text-gray-900"
          style={{ color: currentTheme.colors?.foreground || 'inherit' }}
        >
          {firstSentence}
        </p>
        {restOfContent && (
          <ReactMarkdown
            components={{
              p: ({ children }) => (
                <p 
                  className="text-lg leading-8 mb-6 first:mt-0 last:mb-0 text-justify text-gray-900"
                  style={{ color: currentTheme.colors?.foreground || 'inherit' }}
                >
                  {children}
                </p>
              ),
              strong: ({ children }) => (
                <strong style={{ color: themeColors.primary }} className="font-semibold">{children}</strong>
              ),
              em: ({ children }) => (
                <em style={{ color: themeColors.secondary }} className="italic">{children}</em>
              ),
              // Handle any remaining headings in content
              h1: ({ children }) => (
                <h2 
                  className="text-2xl font-bold mt-8 mb-4"
                  style={{ color: currentTheme.colors.foreground }}
                >
                  {children}
                </h2>
              ),
              h2: ({ children }) => (
                <h3 
                  className="text-xl font-semibold mt-6 mb-3"
                  style={{ color: currentTheme.colors.foreground }}
                >
                  {children}
                </h3>
              ),
            }}
          >
            {restOfContent}
          </ReactMarkdown>
        )}
      </>
    );
  };

  return (
    <div className="glass-card rounded-2xl p-8 animate-fadeIn [animation-delay:400ms] bg-white/90 backdrop-blur-lg border border-gray-200 shadow-xl">
      {/* Title Section - Made much more prominent */}
      <div className="text-center mb-10 pb-8 border-b border-gray-200">
        <h1 
          className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 leading-tight bg-clip-text text-transparent"
          style={{ 
            background: `linear-gradient(to right, ${themeColors.primary}, ${themeColors.secondary}, ${themeColors.accent})`
          }}
        >
          {getStoryTitle(result)}
        </h1>
        <p 
          className="text-lg md:text-xl italic font-medium"
          style={{ color: themeColors.primary }}
        >
          {getEraDescription(result)}
        </p>
      </div>
      
      {/* Story Content - Enhanced paragraph formatting with distinguished first sentence */}
      <div className="max-w-none mb-8 text-gray-900">
        <StreamingText
          text={result}
          speed={20}
          className="prose prose-lg max-w-none"
          wordByWord={false}
        />
      </div>

      <div className="flex flex-wrap gap-4 items-center justify-between mb-8 pt-4 border-t border-gray-200">
        <div className="flex gap-2">
          {hasPreviousStory && onUndoClick && (
            <Button
              onClick={onUndoClick}
              variant="outline"
              className="text-lg border-gray-200 hover:bg-gray-50 flex items-center gap-2"
            >
              <Undo className="h-5 w-5" />
              Undo
            </Button>
          )}
          {onUndoClick && (
            <Button
              onClick={onUndoClick}
              variant="outline"
              className="text-lg border-gray-200 hover:bg-gray-50 flex items-center gap-2"
            >
              <ArrowLeft className="h-5 w-5" />
              Back to Planning
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
                🧠 Create E-Memory Book (Spend Credits)
              </Button>
            </div>
            <p className="text-sm text-gray-600">
              Transform your story into a beautifully illustrated book with perfect continuity
            </p>
            <div className="text-xs text-blue-600 bg-blue-50 p-3 rounded-lg max-w-2xl mx-auto">
              <strong>Advanced AI:</strong> Our memory-enhanced system maintains character consistency, 
              eliminates repetition, and creates perfectly coherent multi-chapter stories. 
              <span className="block mt-1 font-semibold">You can also create an E-Book directly from the dashboard without generating a story first!</span>
            </div>
          </div>
        </>
      )}

      {/* Download & Share Modal */}
      <DownloadShareModal
        isOpen={showDownloadShareModal}
        onClose={() => setShowDownloadShareModal(false)}
        content={{
          id: effectiveStoryId,
          title: getStoryTitle(result),
          content: getStoryContent(result),
          type: 'story',
          author: 'FlipMyEra User'
        }}
      />
    </div>
  );
};
