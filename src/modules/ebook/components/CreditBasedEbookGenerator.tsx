import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/modules/shared/components/ui/card';
import { Button } from '@/modules/shared/components/ui/button';
import { Badge } from '@/modules/shared/components/ui/badge';
import { Progress } from '@/modules/shared/components/ui/progress';
import { useToast } from '@/modules/shared/hooks/use-toast';
import { useClerkAuth } from '@/modules/auth/contexts/ClerkAuthContext';
import { MemoryEnhancedEbookGenerator } from './MemoryEnhancedEbookGenerator';

import { Textarea } from '@/modules/shared/components/ui/textarea';
import { 
  BookOpen, 
  Lock, 
  Coins, 
  CheckCircle, 
  Sparkles,
  PenLine,
  Save
} from 'lucide-react';

interface Chapter {
  title: string;
  content: string;
  id: string;
}

interface EbookDesignSettings {
  // Typography
  fontFamily: 'serif' | 'sans-serif' | 'monospace';
  fontSize: number; // 12-20px
  lineHeight: number; // 1.2-2.0
  letterSpacing: number; // -0.05 to 0.1em
  textColor: string; // Custom text color in hex format
  chapterHeadingColor: string; // Custom chapter heading color in hex format
  
  // Layout
  pageLayout: 'single' | 'double' | 'magazine';
  textAlignment: 'left' | 'center' | 'justify';
  marginTop: number; // 20-60px
  marginBottom: number; // 20-60px
  marginLeft: number; // 20-80px
  marginRight: number; // 20-80px
  
  // Cover Design
  coverStyle: 'minimal' | 'modern' | 'classic' | 'bold';
  colorScheme: 'purple-pink' | 'blue-green' | 'orange-red' | 'monochrome';
  
  // Chapter Settings
  chapterTitleSize: number; // 24-36px
  chapterSpacing: number; // 30-60px
  paragraphSpacing: number; // 12-24px
}

interface CreditBasedEbookGeneratorProps {
  originalStory: string;
  storyId?: string;
  useTaylorSwiftThemes: boolean;
  selectedTheme: string;
  selectedFormat: string;
  designSettings?: EbookDesignSettings;
  onChaptersGenerated?: (chapters: Chapter[], ebookId: string) => void;
  onError?: (error: string) => void;
}

export const CreditBasedEbookGenerator: React.FC<CreditBasedEbookGeneratorProps> = ({
  originalStory,
  storyId,
  useTaylorSwiftThemes,
  selectedTheme,
  selectedFormat,
  designSettings,
  onChaptersGenerated,
  onError
}) => {
  const { toast } = useToast();
  const { isAuthenticated, getToken } = useClerkAuth();
  
  // State management
  const [isGenerating, setIsGenerating] = useState(false);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [isUnlocked, setIsUnlocked] = useState(false);

  const [currentBalance, setCurrentBalance] = useState(0);
  const [progress, setProgress] = useState(0);
  const [currentMessage, setCurrentMessage] = useState('');
  const [storyPrompt, setStoryPrompt] = useState<string>(originalStory || '');
  
  // Update storyPrompt when originalStory changes
  useEffect(() => {
    if (originalStory) {
      setStoryPrompt(originalStory);
    }
  }, [originalStory]);
  
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

  const handleChaptersGenerated = (generatedChapters: Chapter[], ebookId: string) => {
    setChapters(generatedChapters);
    setIsGenerating(false);
    
    // Automatically unlock the story to display content
    setIsUnlocked(true);
    
    onChaptersGenerated?.(generatedChapters, ebookId);
  };

  const handleGenerationError = (error: string) => {
    setIsGenerating(false);
    onError?.(error);
  };

  const handleGenerationProgress = (progressData: any) => {
    setProgress(progressData.progress || 0);
    setCurrentMessage(progressData.message || '');
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

  const getDesignStyles = (): React.CSSProperties => {
    if (!designSettings) return {};
    
    return {
      fontFamily: designSettings.fontFamily === 'serif' ? 'Georgia, serif' : 
                  designSettings.fontFamily === 'sans-serif' ? 'Arial, sans-serif' : 
                  'Monaco, monospace',
      fontSize: `${designSettings.fontSize}px`,
      lineHeight: designSettings.lineHeight,
      letterSpacing: `${designSettings.letterSpacing}em`,
      textAlign: designSettings.textAlignment as any,
      marginTop: `${designSettings.marginTop}px`,
      marginBottom: `${designSettings.marginBottom}px`,
      marginLeft: `${designSettings.marginLeft}px`,
      marginRight: `${designSettings.marginRight}px`,
    };
  };

  const getColorSchemeColors = (scheme?: string) => {
    if (!scheme) return { primary: '#8B5CF6', secondary: '#EC4899' };
    
    switch (scheme) {
      case 'purple-pink':
        return { primary: '#8B5CF6', secondary: '#EC4899' };
      case 'blue-green':
        return { primary: '#3B82F6', secondary: '#10B981' };
      case 'orange-red':
        return { primary: '#F97316', secondary: '#EF4444' };
      case 'monochrome':
        return { primary: '#374151', secondary: '#6B7280' };
      default:
        return { primary: '#8B5CF6', secondary: '#EC4899' };
    }
  };



  return (
    <div className="space-y-6">

      {/* Story Prompt Input (when no original story is provided) */}
      {!originalStory && !isUnlocked && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PenLine className="w-5 h-5" />
              Enter Your Story Idea
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Describe your story idea, character, or setting. Our AI will use this as a starting point to create a complete story.
              </p>
              <Textarea
                placeholder="Describe your story idea or character... (e.g., 'A young wizard discovers they have the ability to talk to animals in a modern city setting')"
                value={storyPrompt}
                onChange={(e) => setStoryPrompt(e.target.value)}
                className="min-h-[120px]"
              />
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
              <div className="prose prose-sm max-w-none" style={getDesignStyles()}>
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
            

          </CardContent>
        </Card>
      )}

      {/* Full Story (when unlocked) */}
      {chapters.length > 0 && isUnlocked && (
        <Card className="bg-white shadow-xl border-0">
          <CardContent className="p-8">
            <div className="max-w-4xl mx-auto space-y-12" style={getDesignStyles()}>
              {/* Book Title */}
              <div className="text-center mb-8">
                <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4" style={{
                  color: getColorSchemeColors(designSettings?.colorScheme).primary
                }}>
                  {getStoryTitle()}
                </h1>
                <div className="w-24 h-1 mx-auto" style={{
                  background: `linear-gradient(to right, ${getColorSchemeColors(designSettings?.colorScheme).primary}, ${getColorSchemeColors(designSettings?.colorScheme).secondary})`
                }}></div>
              </div>
              
              {/* Chapters */}
              {chapters.map((chapter, index) => (
                <div key={chapter.id} className="space-y-6">
                  <h2 className="text-2xl md:text-3xl font-semibold text-gray-800 pb-4 border-b border-gray-100" style={{
                    fontSize: designSettings ? `${designSettings.chapterTitleSize}px` : '2rem',
                    marginBottom: designSettings ? `${designSettings.chapterSpacing}px` : '1.5rem',
                    color: designSettings?.chapterHeadingColor || '#8B5CF6'
                  }}>
                    {chapter.title}
                  </h2>
                  <div className="prose prose-lg max-w-none text-gray-700">
                    {chapter.content.split('\n\n').map((paragraph, pIndex) => (
                      <p key={pIndex} className="mb-6 leading-relaxed" style={{
                        marginBottom: designSettings ? `${designSettings.paragraphSpacing}px` : '1.5rem',
                        color: designSettings?.textColor || '#374151'
                      }}>
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </div>
              ))}
              
              {/* Save Button - Removed since saving is handled by MemoryEnhancedEbookGenerator */}
              <div className="flex justify-center pt-8 border-t border-gray-200">
                <Badge variant="secondary" className="px-4 py-2">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Story Generated Successfully
                </Badge>
              </div>

            </div>
          </CardContent>
        </Card>
      )}

      {/* Memory Enhanced Generator - Only show when not unlocked */}
      {!isUnlocked && (
        <MemoryEnhancedEbookGenerator
          originalStory={storyPrompt}
          storyId={storyId}
          useTaylorSwiftThemes={useTaylorSwiftThemes}
          selectedTheme={selectedTheme}
          selectedFormat={selectedFormat}
          designSettings={designSettings}
          onChaptersGenerated={handleChaptersGenerated}
          onError={handleGenerationError}
          onProgress={handleGenerationProgress}
          isGenerating={isGenerating}
          setIsGenerating={setIsGenerating}
        />
      )}


    </div>
  );
}; 