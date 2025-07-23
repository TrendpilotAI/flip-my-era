import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/modules/shared/components/ui/card';
import { Button } from '@/modules/shared/components/ui/button';
import { Badge } from '@/modules/shared/components/ui/badge';
import { Progress } from '@/modules/shared/components/ui/progress';
import { useToast } from '@/modules/shared/hooks/use-toast';
import { useClerkAuth } from '@/modules/auth/contexts/ClerkAuthContext';
import { MemoryEnhancedEbookGenerator } from './MemoryEnhancedEbookGenerator';
import { CreditWallModal } from './CreditWallModal';
import { 
  BookOpen, 
  Lock, 
  Eye, 
  Coins, 
  CheckCircle, 
  Clock,
  Sparkles,
  Download,
  Share2
} from 'lucide-react';

interface Chapter {
  title: string;
  content: string;
  id: string;
}

interface CreditBasedEbookGeneratorProps {
  originalStory: string;
  storyId?: string;
  useTaylorSwiftThemes: boolean;
  selectedTheme: string;
  selectedFormat: string;
  onChaptersGenerated?: (chapters: Chapter[]) => void;
  onError?: (error: string) => void;
}

export const CreditBasedEbookGenerator: React.FC<CreditBasedEbookGeneratorProps> = ({
  originalStory,
  storyId,
  useTaylorSwiftThemes,
  selectedTheme,
  selectedFormat,
  onChaptersGenerated,
  onError
}) => {
  const { toast } = useToast();
  const { isAuthenticated, getToken } = useClerkAuth();
  
  // State management
  const [isGenerating, setIsGenerating] = useState(false);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [showCreditWall, setShowCreditWall] = useState(false);
  const [currentBalance, setCurrentBalance] = useState(0);
  const [progress, setProgress] = useState(0);
  const [currentMessage, setCurrentMessage] = useState('');
  
  // Fetch user's credit balance
  const fetchCreditBalance = async () => {
    if (!isAuthenticated) return;
    
    try {
      const token = await getToken({ template: 'supabase' });
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const response = await fetch(`${supabaseUrl}/functions/v1/credits`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setCurrentBalance(data.data?.balance?.balance || 0);
      } else {
        // In development, use mock data if Edge Functions are not available
        if (import.meta.env.DEV && response.status === 503) {
          console.log("Using mock credit balance for development");
          setCurrentBalance(5); // Mock balance for development
        }
      }
    } catch (error) {
      console.error('Error fetching credit balance:', error);
    }
  };

  useEffect(() => {
    fetchCreditBalance();
  }, [isAuthenticated, getToken]);

  const handleChaptersGenerated = (generatedChapters: Chapter[]) => {
    setChapters(generatedChapters);
    setIsGenerating(false);
    
    // Show credit wall after generation is complete
    setShowCreditWall(true);
    
    onChaptersGenerated?.(generatedChapters);
  };

  const handleGenerationError = (error: string) => {
    setIsGenerating(false);
    onError?.(error);
  };

  const handleGenerationProgress = (progressData: any) => {
    setProgress(progressData.progress || 0);
    setCurrentMessage(progressData.message || '');
  };

  const handleUnlockStory = () => {
    setIsUnlocked(true);
    setShowCreditWall(false);
    
    // Refresh credit balance after successful unlock
    fetchCreditBalance();
    
    toast({
      title: "Story Unlocked!",
      description: "You can now read the complete story.",
    });
  };

  const getPreviewContent = () => {
    if (chapters.length === 0) return '';
    
    // Get the first 100 words from the first chapter
    const firstChapter = chapters[0];
    const words = firstChapter.content.split(' ');
    const previewWords = words.slice(0, 100);
    return previewWords.join(' ') + (words.length > 100 ? '...' : '');
  };

  const getTotalWords = () => {
    return chapters.reduce((total, chapter) => {
      return total + chapter.content.split(' ').length;
    }, 0);
  };

  const getStoryTitle = () => {
    return chapters.length > 0 ? chapters[0].title : 'Your Story';
  };

  const downloadStory = () => {
    if (!isUnlocked) return;
    
    const storyText = chapters.map((chapter, index) => {
      return `Chapter ${index + 1}: ${chapter.title}\n\n${chapter.content}\n\n`;
    }).join('\n');
    
    const blob = new Blob([storyText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `story-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const shareStory = () => {
    if (!isUnlocked) return;
    
    const storyText = chapters.map((chapter, index) => {
      return `Chapter ${index + 1}: ${chapter.title}\n\n${chapter.content}`;
    }).join('\n\n');
    
    if (navigator.share) {
      navigator.share({
        title: getStoryTitle(),
        text: storyText,
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(storyText);
      toast({
        title: "Story Copied!",
        description: "Your story has been copied to clipboard.",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Generation Progress */}
      {isGenerating && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Generating Your Story
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>{currentMessage}</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Story Preview (when not unlocked) */}
      {chapters.length > 0 && !isUnlocked && !isGenerating && (
        <Card className="border-2 border-orange-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-orange-600" />
              Your Story Preview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="prose prose-sm max-w-none">
                <p className="text-gray-700 leading-relaxed">
                  {getPreviewContent()}
                </p>
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Lock className="w-4 h-4" />
                    <span>Content continues... ({getTotalWords() - 100} more words)</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-4 flex justify-center">
              <Button
                onClick={() => setShowCreditWall(true)}
                className="bg-gradient-to-r from-blue-500 to-purple-500 text-white"
              >
                <Eye className="w-4 h-4 mr-2" />
                Unlock Full Story
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Full Story (when unlocked) */}
      {chapters.length > 0 && isUnlocked && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Your Complete Story
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {chapters.map((chapter, index) => (
                <div key={chapter.id} className="border-b border-gray-200 pb-6 last:border-b-0">
                  <h3 className="text-xl font-semibold mb-4">{chapter.title}</h3>
                  <div className="prose prose-lg max-w-none">
                    {chapter.content.split('\n\n').map((paragraph, pIndex) => (
                      <p key={pIndex} className="mb-4 leading-relaxed">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </div>
              ))}
              
              {/* Action Buttons */}
              <div className="flex gap-3 pt-6 border-t border-gray-200">
                <Button onClick={downloadStory} className="flex-1">
                  <Download className="w-4 h-4 mr-2" />
                  Download Story
                </Button>
                <Button onClick={shareStory} variant="outline" className="flex-1">
                  <Share2 className="w-4 h-4 mr-2" />
                  Share Story
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Memory Enhanced Generator */}
      <MemoryEnhancedEbookGenerator
        originalStory={originalStory}
        storyId={storyId}
        useTaylorSwiftThemes={useTaylorSwiftThemes}
        selectedTheme={selectedTheme}
        selectedFormat={selectedFormat}
        onChaptersGenerated={handleChaptersGenerated}
        onError={handleGenerationError}
        onProgress={handleGenerationProgress}
        isGenerating={isGenerating}
        setIsGenerating={setIsGenerating}
      />

      {/* Credit Wall Modal */}
      <CreditWallModal
        isOpen={showCreditWall}
        onClose={() => setShowCreditWall(false)}
        onUnlock={handleUnlockStory}
        currentBalance={currentBalance}
        storyTitle={getStoryTitle()}
        previewContent={getPreviewContent()}
        totalChapters={chapters.length}
        totalWords={getTotalWords()}
        onBalanceRefresh={fetchCreditBalance}
      />
    </div>
  );
}; 