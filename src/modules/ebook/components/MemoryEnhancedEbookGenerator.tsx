// Memory-Enhanced Ebook Generator
// Integrates the new memory system for improved story continuity

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/modules/shared/components/ui/card';
import { Button } from '@/modules/shared/components/ui/button';
import { Badge } from '@/modules/shared/components/ui/badge';
import { Alert, AlertDescription } from '@/modules/shared/components/ui/alert';
import { Progress } from '@/modules/shared/components/ui/progress';
import { Switch } from '@/modules/shared/components/ui/switch';
import { Label } from '@/modules/shared/components/ui/label';
import { useToast } from '@/modules/shared/hooks/use-toast';
import { useClerkAuth } from '@/modules/auth/contexts/ClerkAuthContext';
import { 
  createMemoryEnhancedAI, 
  isMemoryEnhancementAvailable,
  estimateMemoryUsage,
  formatMemoryWarning,
  generateOutlinePreview,
  generateUUID,
  type StoryOutline,
  type MemoryWarning,
  type EnhancedChapterProgress
} from '@/modules/story/services/memory-enhanced-ai';
import { 
  Brain, 
  BookOpen, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Users, 
  Map,
  Lightbulb,
  TrendingUp,
  Zap,
  Eye,
  Download
} from 'lucide-react';

interface Chapter {
  title: string;
  content: string;
  id: string;
}

interface MemoryEnhancedEbookGeneratorProps {
  originalStory: string;
  storyId?: string;
  useTaylorSwiftThemes: boolean;
  selectedTheme: string;
  selectedFormat: string;
  onChaptersGenerated?: (chapters: Chapter[]) => void;
  onError?: (error: string) => void;
  onProgress?: (progressData: any) => void;
  isGenerating?: boolean;
  setIsGenerating?: (generating: boolean) => void;
}

export const MemoryEnhancedEbookGenerator: React.FC<MemoryEnhancedEbookGeneratorProps> = ({
  originalStory,
  storyId,
  useTaylorSwiftThemes,
  selectedTheme,
  selectedFormat,
  onChaptersGenerated,
  onError,
  onProgress,
  isGenerating: externalIsGenerating,
  setIsGenerating: externalSetIsGenerating
}) => {
  const { toast } = useToast();
  const { getToken, isAuthenticated } = useClerkAuth();
  
  // State management
  const [internalIsGenerating, setInternalIsGenerating] = useState(false);
  const isGenerating = externalIsGenerating !== undefined ? externalIsGenerating : internalIsGenerating;
  const setIsGenerating = externalSetIsGenerating || setInternalIsGenerating;
  const [useMemorySystem, setUseMemorySystem] = useState(true);
  const [progress, setProgress] = useState(0);
  const [currentMessage, setCurrentMessage] = useState('');
  const [currentChapter, setCurrentChapter] = useState(0);
  const [totalChapters, setTotalChapters] = useState(0);
  const [estimatedTime, setEstimatedTime] = useState<number | undefined>();
  
  // Memory system state
  const [storyOutline, setStoryOutline] = useState<StoryOutline | null>(null);
  const [memoryWarnings, setMemoryWarnings] = useState<MemoryWarning[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  
  // Reading interface state
  const [showReader, setShowReader] = useState(false);
  const [currentChapterIndex, setCurrentChapterIndex] = useState(0);
  
  // Story formats configuration
  const storyFormats = {
    'short-story': { chapters: 3, name: 'Short Story' },
    'novella': { chapters: 8, name: 'Novella' },
    'children-book': { chapters: 5, name: 'Children\'s Book' }
  };

  const currentFormat = storyFormats[selectedFormat as keyof typeof storyFormats] || storyFormats['short-story'];
  const memoryUsage = estimateMemoryUsage(currentFormat.chapters, selectedFormat);

  const handleGenerateWithMemory = async () => {
    if (!originalStory.trim()) {
      toast({
        title: "No Story Content",
        description: "Please provide a story to generate chapters from.",
        variant: "destructive",
      });
      return;
    }

    if (!storyId) {
      toast({
        title: "Missing Story ID",
        description: "Please generate a story first before creating an ebook.",
        variant: "destructive",
      });
      return;
    }



    setIsGenerating(true);
    setProgress(0);
    setCurrentMessage('Initializing memory-enhanced generation...');
    setChapters([]);
    setStoryOutline(null);
    setMemoryWarnings([]);

    try {
      // Get authentication token
      const token = isAuthenticated ? await getToken({ template: 'supabase' }) : null;
      
      // Create memory-enhanced AI instance
      const memoryAI = createMemoryEnhancedAI(token || undefined);

      // Generate a unique ID for this ebook generation
      const uniqueEbookGenerationId = generateUUID();
      
      // Start enhanced generation
      await memoryAI.generateEnhancedStory({
        originalStory,
        useTaylorSwiftThemes,
        selectedTheme,
        selectedFormat,
        numChapters: currentFormat.chapters,
        ebookGenerationId: uniqueEbookGenerationId,
        useEnhancedMemory: useMemorySystem,
        
        onProgress: (progressData: EnhancedChapterProgress) => {
          setProgress(progressData.progress || 0);
          setCurrentMessage(progressData.message || '');
          setCurrentChapter(progressData.currentChapter || 0);
          setTotalChapters(progressData.totalChapters || currentFormat.chapters);
          setEstimatedTime(progressData.estimatedTimeRemaining);
          
          // Call external progress handler if provided
          onProgress?.(progressData);
        },
        
        onOutlineGenerated: (outline: StoryOutline) => {
          setStoryOutline(outline);
          toast({
            title: "Story Outline Created",
            description: `"${outline.book_title}" - Ready for chapter generation`,
          });
        },
        
        onChapterComplete: (chapter: { title: string; content: string }) => {
          const newChapter: Chapter = {
            ...chapter,
            id: `chapter-${Date.now()}-${Math.random()}`
          };
          
          setChapters(prev => [...prev, newChapter]);
          
          toast({
            title: `Chapter Complete`,
            description: `"${chapter.title}" has been generated`,
          });
        },
        
        onMemoryWarning: (warning: MemoryWarning) => {
          setMemoryWarnings(prev => [...prev, warning]);
          
          const warningMessage = formatMemoryWarning(warning);
          if (warningMessage) {
            toast({
              title: "Memory System Alert",
              description: warningMessage,
              variant: "destructive",
            });
          }
        },
        
        onComplete: (generatedChapters: Array<{ title: string; content: string }>) => {
          const formattedChapters: Chapter[] = generatedChapters.map((chapter, index) => ({
            ...chapter,
            id: `chapter-${index + 1}-${Date.now()}`
          }));
          
          setChapters(formattedChapters);
          onChaptersGenerated?.(formattedChapters);
          
          toast({
            title: "Generation Complete!",
            description: `Successfully generated ${generatedChapters.length} chapters with enhanced memory system.`,
          });
        },
        
        onError: (error: string) => {
          console.error('Memory-enhanced generation error:', error);
          onError?.(error);
          
          toast({
            title: "Generation Failed",
            description: error,
            variant: "destructive",
          });
        }
      });

    } catch (error) {
      console.error('Generation error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      onError?.(errorMessage);
      
      toast({
        title: "Generation Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
      setCurrentMessage('');
    }
  };

  const formatEstimatedTime = (seconds: number): string => {
    if (seconds < 60) {
      return `${Math.round(seconds)}s`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return `${minutes}m ${remainingSeconds}s`;
  };

  const handleReadStory = () => {
    setShowReader(true);
    setCurrentChapterIndex(0);
  };

  const handleNextChapter = () => {
    if (currentChapterIndex < chapters.length - 1) {
      setCurrentChapterIndex(currentChapterIndex + 1);
    }
  };

  const handlePrevChapter = () => {
    if (currentChapterIndex > 0) {
      setCurrentChapterIndex(currentChapterIndex - 1);
    }
  };

  const handleCloseReader = () => {
    setShowReader(false);
    setCurrentChapterIndex(0);
  };

  const downloadStory = () => {
    const storyText = chapters.map((chapter, index) => {
      return `Chapter ${index + 1}: ${chapter.title}\n\n${chapter.content}\n\n`;
    }).join('\n');
    
    const blob = new Blob([storyText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `memory-enhanced-story-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Memory System Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5" />
            Memory-Enhanced Generation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="memory-system"
              checked={useMemorySystem}
              onCheckedChange={setUseMemorySystem}
              disabled={!isMemoryEnhancementAvailable()}
            />
            <Label htmlFor="memory-system">
              Enable Enhanced Memory System
            </Label>
            <Badge variant="secondary" className="ml-2">
              <Zap className="w-3 h-3 mr-1" />
              Advanced
            </Badge>
          </div>
          
          {useMemorySystem && (
            <div className="bg-blue-50 p-4 rounded-lg space-y-3">
              <h4 className="font-medium text-blue-900">Memory System Features:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-blue-600" />
                  <span>Story Outline Planning</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                  <span>Rolling Chapter Memory</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-600" />
                  <span>Character State Tracking</span>
                </div>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-blue-600" />
                  <span>Repetition Detection</span>
                </div>
              </div>
              
              <div className="pt-2 border-t border-blue-200">
                <div className="text-sm text-blue-700">
                  <strong>Estimated Memory Usage:</strong> ~{memoryUsage.totalEstimatedTokens} tokens
                </div>
                <div className="text-xs text-blue-600 mt-1">
                  Outline: {memoryUsage.outlineTokens} • Summaries: {memoryUsage.summaryTokens} • State: {memoryUsage.stateTokens}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Story Outline Preview */}
      {storyOutline && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Map className="w-5 h-5" />
              Story Outline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <h3 className="text-lg font-semibold">{storyOutline.book_title}</h3>
                {storyOutline.book_description && (
                  <p className="text-gray-600 mt-1">{storyOutline.book_description}</p>
                )}
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Chapters ({storyOutline.total_chapters}):</h4>
                <div className="space-y-1">
                  {storyOutline.chapter_titles.map((title, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">
                        {index + 1}
                      </span>
                      <span>{title}</span>
                      {index < chapters.length && (
                        <CheckCircle className="w-4 h-4 text-green-500 ml-auto" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
              
              {storyOutline.key_themes.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Key Themes:</h4>
                  <div className="flex flex-wrap gap-2">
                    {storyOutline.key_themes.map((theme, index) => (
                      <Badge key={index} variant="outline">
                        <Lightbulb className="w-3 h-3 mr-1" />
                        {theme}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Memory Warnings */}
      {memoryWarnings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-600">
              <AlertTriangle className="w-5 h-5" />
              Memory System Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {memoryWarnings.map((warning, index) => (
                <Alert key={index} className="border-orange-200">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    {formatMemoryWarning(warning)}
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Generation Progress */}
      {isGenerating && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Generation Progress
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
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Current Chapter:</span>
                <div className="font-medium">{currentChapter} of {totalChapters}</div>
              </div>
              <div>
                <span className="text-gray-600">Chapters Complete:</span>
                <div className="font-medium">{chapters.length}</div>
              </div>
              <div>
                <span className="text-gray-600">Memory Alerts:</span>
                <div className="font-medium">{memoryWarnings.length}</div>
              </div>
              <div>
                <span className="text-gray-600">Est. Time:</span>
                <div className="font-medium">
                  {estimatedTime ? formatEstimatedTime(estimatedTime) : '--'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Generate Button */}
      <div className="flex justify-center">
        <Button
          onClick={handleGenerateWithMemory}
          disabled={isGenerating || !originalStory.trim()}
          size="lg"
          className="px-8"
        >
          {isGenerating ? (
            <>
              <Clock className="w-4 h-4 mr-2 animate-spin" />
              Generating with Memory System...
            </>
          ) : (
            <>
              <Brain className="w-4 h-4 mr-2" />
              Generate {currentFormat.name} ({currentFormat.chapters} chapters)
            </>
          )}
        </Button>
      </div>

      {/* Generated Chapters Summary */}
      {chapters.length > 0 && !isGenerating && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Generated Chapters ({chapters.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {chapters.map((chapter, index) => (
                <div key={chapter.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <span className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </span>
                  <div className="flex-1">
                    <h4 className="font-medium">{chapter.title}</h4>
                    <p className="text-sm text-gray-600">
                      {chapter.content.split(' ').length} words
                    </p>
                  </div>
                  <CheckCircle className="w-5 h-5 text-green-500" />
                </div>
              ))}
              
              {/* Reading Actions */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <Button onClick={handleReadStory} className="flex-1">
                  <Eye className="w-4 h-4 mr-2" />
                  Read Story
                </Button>
                <Button onClick={downloadStory} variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Story Reader Modal */}
      {showReader && chapters.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col">
            {/* Reader Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h2 className="text-xl font-semibold">Memory-Enhanced Story</h2>
                <p className="text-gray-600">
                  Chapter {currentChapterIndex + 1} of {chapters.length}
                </p>
              </div>
              <div className="flex gap-2">
                <Button onClick={downloadStory} variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
                <Button onClick={handleCloseReader} variant="outline" size="sm">
                  Close
                </Button>
              </div>
            </div>

            {/* Reader Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="max-w-3xl mx-auto">
                <h1 className="text-3xl font-bold mb-6 text-center">
                  {chapters[currentChapterIndex].title}
                </h1>
                <div className="prose prose-lg max-w-none">
                  {chapters[currentChapterIndex].content.split('\n').map((paragraph, index) => (
                    <p key={index} className="mb-4 leading-relaxed">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>
            </div>

            {/* Reader Navigation */}
            <div className="flex items-center justify-between p-6 border-t bg-gray-50">
              <Button 
                onClick={handlePrevChapter} 
                disabled={currentChapterIndex === 0}
                variant="outline"
              >
                Previous Chapter
              </Button>
              
              <div className="flex gap-2">
                {chapters.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentChapterIndex(index)}
                    className={`w-3 h-3 rounded-full ${
                      index === currentChapterIndex 
                        ? 'bg-blue-600' 
                        : 'bg-gray-300 hover:bg-gray-400'
                    }`}
                  />
                ))}
              </div>
              
              <Button 
                onClick={handleNextChapter} 
                disabled={currentChapterIndex === chapters.length - 1}
                variant="outline"
              >
                Next Chapter
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 