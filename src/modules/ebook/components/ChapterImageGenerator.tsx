import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/modules/shared/components/ui/card';
import { Button } from '@/modules/shared/components/ui/button';
import { Textarea } from '@/modules/shared/components/ui/textarea';
import { Label } from '@/modules/shared/components/ui/label';
import { Badge } from '@/modules/shared/components/ui/badge';
import { Progress } from '@/modules/shared/components/ui/progress';
import { Alert, AlertDescription } from '@/modules/shared/components/ui/alert';
import { Switch } from '@/modules/shared/components/ui/switch';
import { useToast } from '@/modules/shared/hooks/use-toast';
import { useClerkAuth } from '@/modules/auth/contexts/ClerkAuthContext';
import { generateImage } from '@/modules/story/services/ai';
import { saveChapterImageToEbook } from '../utils/imageStorage';
import { 
  Image as ImageIcon, 
  Wand2, 
  Download, 
  RefreshCw
} from 'lucide-react';

interface Chapter {
  title: string;
  content: string;
  id: string;
  imageUrl?: string;
  imagePrompt?: string;
}

interface ChapterImageGeneratorProps {
  chapters: Chapter[];
  onChapterImageGenerated?: (chapterId: string, imageUrl: string, prompt: string) => void;
  onError?: (error: string) => void;
  bookTitle?: string;
  genre?: string;
  mood?: string;
  ebookId?: string; // Add ebookId for saving to database
}

const IMAGE_STYLES = [
  { id: 'illustration', name: 'Illustration', prompt: 'detailed illustration, artistic style, book illustration' },
  { id: 'realistic', name: 'Realistic', prompt: 'photorealistic, high quality photography, detailed scene' },
  { id: 'watercolor', name: 'Watercolor', prompt: 'watercolor painting, soft colors, artistic brushstrokes' },
  { id: 'sketch', name: 'Sketch', prompt: 'pencil sketch, hand-drawn, artistic sketching' }
];

export const ChapterImageGenerator: React.FC<ChapterImageGeneratorProps> = ({
  chapters,
  onChapterImageGenerated,
  onError,
  bookTitle,
  genre,
  mood,
  ebookId
}) => {
  const { toast } = useToast();
  const { isAuthenticated, getToken } = useClerkAuth();
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingChapterId, setGeneratingChapterId] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<string>('illustration');
  const [generationProgress, setGenerationProgress] = useState(0);

  const generateChapterPrompt = (chapter: Chapter) => {
    const selectedStyleData = IMAGE_STYLES.find(s => s.id === selectedStyle);
    const stylePrompt = selectedStyleData?.prompt || '';
    const contentExcerpt = chapter.content.substring(0, 300);
    
    return `${stylePrompt}, chapter illustration for "${chapter.title}", scene depicting: ${contentExcerpt}, high quality, detailed artwork`;
  };

  const handleGenerateChapterImage = async (chapter: Chapter) => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to generate chapter images.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setGeneratingChapterId(chapter.id);
    setGenerationProgress(0);

    try {
      // Progress simulation
      for (let i = 25; i <= 75; i += 25) {
        setGenerationProgress(i);
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      const prompt = generateChapterPrompt(chapter);
      const imageUrl = await generateImage({
        prompt,
        size: '1024x1024',
        quality: 'hd'
      });

      setGenerationProgress(100);
      
      // Save image to database if ebookId is provided
      if (ebookId && getToken) {
        try {
          const token = await getToken({ template: 'supabase' });
          if (token) {
            await saveChapterImageToEbook(ebookId, chapter.id, imageUrl, prompt, token);
            console.log('Chapter image saved to database');
          }
        } catch (saveError) {
          console.error('Failed to save chapter image to database:', saveError);
          // Don't show error to user as the image was still generated successfully
        }
      }
      
      if (onChapterImageGenerated) {
        onChapterImageGenerated(chapter.id, imageUrl, prompt);
      }

      toast({
        title: "Chapter Image Generated!",
        description: `Image for "${chapter.title}" created successfully.`,
      });

    } catch (error) {
      console.error('Chapter image generation failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate chapter image';
      
      if (onError) {
        onError(errorMessage);
      }
      
      toast({
        title: "Generation Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
      setGeneratingChapterId(null);
      setTimeout(() => setGenerationProgress(0), 2000);
    }
  };

  const handleDownloadImage = (chapter: Chapter) => {
    if (!chapter.imageUrl) return;
    
    const link = document.createElement('a');
    link.href = chapter.imageUrl;
    link.download = `${chapter.title.replace(/[^a-z0-9]/gi, '_')}_chapter_image.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <Card className="bg-white/90 backdrop-blur-lg border border-gray-200 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Chapter Image Generator
          </CardTitle>
          <p className="text-sm text-gray-600">
            Generate illustrations for each chapter to enhance your ebook
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Style Selection */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Image Style</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {IMAGE_STYLES.map((style) => (
                <button
                  key={style.id}
                  onClick={() => setSelectedStyle(style.id)}
                  className={`p-3 rounded-lg border-2 text-left transition-all ${
                    selectedStyle === style.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium text-sm">{style.name}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Generation Progress */}
          {isGenerating && (
            <div className="space-y-3">
              <Progress value={generationProgress} className="w-full" />
              <p className="text-sm text-gray-600 flex items-center gap-2">
                <RefreshCw className="h-4 w-4 animate-spin" />
                Generating image for: {chapters.find(c => c.id === generatingChapterId)?.title}
              </p>
            </div>
          )}

          {/* Chapter List */}
          <div className="space-y-4">
            <Label className="text-base font-medium">Chapters ({chapters.length})</Label>
            <div className="space-y-3">
              {chapters.map((chapter, index) => (
                <Card key={chapter.id} className="border border-gray-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <Badge variant="outline" className="text-xs">
                          Ch. {index + 1}
                        </Badge>
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{chapter.title}</h4>
                          <p className="text-xs text-gray-500 mt-1">
                            {chapter.content.substring(0, 100)}...
                          </p>
                        </div>
                        {chapter.imageUrl && (
                          <Badge variant="default" className="text-xs bg-green-100 text-green-700">
                            Image Ready
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {chapter.imageUrl && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDownloadImage(chapter)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          onClick={() => handleGenerateChapterImage(chapter)}
                          disabled={isGenerating && generatingChapterId === chapter.id}
                          className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                        >
                          {isGenerating && generatingChapterId === chapter.id ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : chapter.imageUrl ? (
                            <RefreshCw className="h-4 w-4" />
                          ) : (
                            <Wand2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Generated Image Display */}
                    {chapter.imageUrl && (
                      <div className="mt-4 space-y-2">
                        <img
                          src={chapter.imageUrl}
                          alt={`Illustration for ${chapter.title}`}
                          className="w-full max-w-sm rounded-lg shadow-md"
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {!isAuthenticated && (
            <Alert>
              <AlertDescription>
                Sign in to generate custom images for your ebook chapters.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}; 