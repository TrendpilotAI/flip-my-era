import { Button } from '@/modules/shared/components/ui/button';
import { Undo, Download, ArrowLeft } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useToast } from '@/modules/shared/hooks/use-toast';
import { MoralSection } from "./MoralSection";
import { EnhancedSongPreview } from "./EnhancedSongPreview";
import { useNavigate } from "react-router-dom";
import { supabase } from '@/core/integrations/supabase/client';
import { useState, useMemo } from "react";
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
      <div className="glass-card rounded-2xl p-8 animate-fadeIn bg-white/95 backdrop-blur border border-gray-200 shadow-xl">
        <p className="text-red-600">No story content available to display.</p>
      </div>
    );
  }
  const { toast } = useToast();
  const navigate = useNavigate();
  const { isAuthenticated } = useClerkAuth();
  const { currentTheme } = useTheme();
  const themeColors = useThemeColors();
  const [showMemoryEnhancedGenerator, setShowMemoryEnhancedGenerator] = useState(false);
  const [showDownloadShareModal, setShowDownloadShareModal] = useState(false);
  const effectiveStoryId = storyId || crypto.randomUUID();

  // New: deterministic parsing of title and content from raw story text
  const { title, content } = useMemo(() => {
    // Normalize line endings and trim
    const normalized = result.replace(/\r\n?/g, '\n').trim();

    // Work line-by-line so we can handle a title followed immediately by content
    const allLines = normalized.split('\n');
    const nonEmptyLines = allLines.map(l => l.trim());

    let computedTitle = 'Untitled Story';
    let contentStartLine = 0;
    let derivedFromFirstSentence = false;

    // Find first non-empty line
    let i = 0;
    while (i < nonEmptyLines.length && nonEmptyLines[i] === '') i++;

    if (i < nonEmptyLines.length) {
      const firstLine = nonEmptyLines[i];
      if (/^#+\s+/.test(firstLine)) {
        // Markdown heading
        computedTitle = firstLine.replace(/^#+\s+/, '').trim();
        contentStartLine = i + 1;
      } else if (firstLine.length <= 90 && /[.?!]$/.test(firstLine) === false) {
        // Short heading-like line
        computedTitle = firstLine;
        contentStartLine = i + 1;
      } else {
        // Derive title from first sentence of the remaining text
        const remainder = nonEmptyLines.slice(i).join('\n');
        const firstSentence = remainder.split(/(?<=[.!?])\s+/)[0];
        computedTitle = firstSentence.length > 90 ? `${firstSentence.slice(0, 90)}...` : firstSentence;
        contentStartLine = i; // start from same place, but we'll remove the first sentence below
        derivedFromFirstSentence = true;
      }
    }

    // Build content from contentStartLine to end
    let rebuilt = allLines.slice(contentStartLine).join('\n');

    // If we derived the title from the first sentence, remove that sentence from the content
    if (derivedFromFirstSentence) {
      const match = rebuilt.match(/^(.*?[.!?])(\s+|$)/s);
      if (match) {
        rebuilt = rebuilt.slice(match[0].length);
      }
    }

    // Cleanup: remove heading markers and collapse extra blank lines
    rebuilt = rebuilt
      .replace(/^#{1,6}\s+/gm, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    return { title: computedTitle || 'Untitled Story', content: rebuilt };
  }, [result]);

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

  return (
    <div className="glass-card rounded-2xl p-8 animate-fadeIn [animation-delay:200ms] bg-white/95 backdrop-blur border border-gray-200 shadow-xl text-gray-900">
      {/* Title */}
      <div className="text-center mb-8">
        <h1 
          className="story-title text-3xl md:text-5xl font-extrabold tracking-tight mb-2"
          style={{ color: currentTheme.colors?.foreground || '#111827' }}
        >
          {title}
        </h1>
      </div>

      {/* Story Content - enforce smaller paragraph typography regardless of parent */}
      <div className="story-content max-w-none mb-8">
        <ReactMarkdown
          components={{
            p: ({ children }) => (
              <p className="text-base md:text-lg leading-7 md:leading-8 mb-6 break-words text-justify">{children}</p>
            ),
            h1: ({ children }) => (
              <h2 className="text-xl md:text-2xl font-bold mt-6 mb-3">{children}</h2>
            ),
            h2: ({ children }) => (
              <h3 className="text-lg md:text-xl font-semibold mt-5 mb-2">{children}</h3>
            ),
            h3: ({ children }) => (
              <h4 className="text-base md:text-lg font-semibold mt-4 mb-2">{children}</h4>
            ),
            li: ({ children }) => (
              <li className="text-base md:text-lg leading-7 md:leading-8 mb-2">{children}</li>
            ),
            strong: ({ children }) => (
              <strong style={{ color: themeColors.primary }} className="font-semibold">{children}</strong>
            ),
            em: ({ children }) => (
              <em style={{ color: themeColors.secondary }} className="italic">{children}</em>
            )
          }}
        >
          {content}
        </ReactMarkdown>
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

      {content && (
        <>
          <MoralSection story={content} />
          <EnhancedSongPreview story={content} />
          
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
          title: title,
          content: content,
          type: 'story',
          author: 'FlipMyEra User'
        }}
      />
    </div>
  );
};
