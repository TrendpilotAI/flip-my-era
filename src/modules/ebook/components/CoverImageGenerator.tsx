import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/modules/shared/components/ui/card';
import { Button } from '@/modules/shared/components/ui/button';
import { Input } from '@/modules/shared/components/ui/input';
import { Textarea } from '@/modules/shared/components/ui/textarea';
import { Label } from '@/modules/shared/components/ui/label';
import { Badge } from '@/modules/shared/components/ui/badge';
import { Progress } from '@/modules/shared/components/ui/progress';
import { Alert, AlertDescription } from '@/modules/shared/components/ui/alert';
import { useToast } from '@/modules/shared/hooks/use-toast';
import { useClerkAuth } from '@/modules/auth/contexts/ClerkAuthContext';
import { generateImage } from '@/modules/story/services/ai';
import { saveCoverImageToEbook, updateCoverImageUrl } from '../utils/imageStorage';
import { 
  Image as ImageIcon, 
  Wand2, 
  Download, 
  RefreshCw, 
  Palette,
  BookOpen,
  Sparkles,
  Eye,
  Save
} from 'lucide-react';

interface CoverImageGeneratorProps {
  storyText: string;
  bookTitle: string;
  authorName?: string;
  genre?: string;
  mood?: string;
  ebookId?: string; // Add ebookId for saving to database
  onImageGenerated?: (imageUrl: string, prompt: string) => void;
  onError?: (error: string) => void;
}

interface CoverStyle {
  id: string;
  name: string;
  description: string;
  prompt: string;
}

const COVER_STYLES: CoverStyle[] = [
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Clean, simple design with elegant typography',
    prompt: 'minimalist book cover design, clean typography, simple geometric shapes, modern aesthetic, professional'
  },
  {
    id: 'classic',
    name: 'Classic',
    description: 'Traditional, timeless design with ornate elements',
    prompt: 'classic book cover design, ornate borders, vintage typography, traditional publishing style, elegant'
  },
  {
    id: 'modern',
    name: 'Modern',
    description: 'Contemporary design with bold colors and graphics',
    prompt: 'modern book cover design, bold colors, contemporary graphics, sleek typography, eye-catching'
  },
  {
    id: 'artistic',
    name: 'Artistic',
    description: 'Creative, artistic design with unique visual elements',
    prompt: 'artistic book cover design, creative illustration, unique visual elements, expressive colors, imaginative'
  },
  {
    id: 'fantasy',
    name: 'Fantasy',
    description: 'Magical, mystical design with fantasy elements',
    prompt: 'fantasy book cover design, magical elements, mystical atmosphere, enchanted imagery, otherworldly'
  },
  {
    id: 'romance',
    name: 'Romance',
    description: 'Romantic design with soft colors and emotional imagery',
    prompt: 'romance book cover design, soft colors, emotional imagery, romantic atmosphere, heartwarming'
  }
];

export const CoverImageGenerator: React.FC<CoverImageGeneratorProps> = ({
  storyText,
  bookTitle,
  authorName,
  genre,
  mood,
  ebookId,
  onImageGenerated,
  onError
}) => {
  const { toast } = useToast();
  const { isAuthenticated, getToken } = useClerkAuth();
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<string>('modern');
  const [customPrompt, setCustomPrompt] = useState('');
  const [useCustomPrompt, setUseCustomPrompt] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');

  // Auto-generate initial prompt based on story
  useEffect(() => {
    if (storyText && bookTitle) {
      const storyExcerpt = storyText.substring(0, 200);
      const autoPrompt = `Book cover for "${bookTitle}"${authorName ? ` by ${authorName}` : ''}, ${genre ? `${genre} genre, ` : ''}based on story: ${storyExcerpt}...`;
      setCustomPrompt(autoPrompt);
    }
  }, [storyText, bookTitle, authorName, genre]);

  const generateCoverPrompt = () => {
    if (useCustomPrompt && customPrompt.trim()) {
      return customPrompt.trim();
    }

    const selectedStyleData = COVER_STYLES.find(s => s.id === selectedStyle);
    const stylePrompt = selectedStyleData?.prompt || '';
    
    const storyExcerpt = storyText.substring(0, 300);
    const moodText = mood ? `, ${mood} mood` : '';
    const genreText = genre ? `, ${genre} genre` : '';
    
    return `${stylePrompt}, book cover for "${bookTitle}"${authorName ? ` by ${authorName}` : ''}${genreText}${moodText}, inspired by: ${storyExcerpt}, professional book cover design, high quality, detailed artwork, book spine visible, 3D mockup style`;
  };

  const handleGenerateImage = async () => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to generate cover images.",
        variant: "destructive",
      });
      return;
    }

    if (!bookTitle.trim()) {
      toast({
        title: "Book Title Required",
        description: "Please provide a book title to generate a cover.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setGenerationProgress(0);
    setCurrentStep('Preparing image generation...');

    try {
      // Simulate progress steps
      const progressSteps = [
        { progress: 20, step: 'Analyzing story content...' },
        { progress: 40, step: 'Creating visual concept...' },
        { progress: 60, step: 'Generating cover design...' },
        { progress: 80, step: 'Finalizing artwork...' },
        { progress: 100, step: 'Complete!' }
      ];

      for (const { progress, step } of progressSteps.slice(0, -1)) {
        setGenerationProgress(progress);
        setCurrentStep(step);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      const prompt = generateCoverPrompt();
      console.log('Generating cover with prompt:', prompt);

      const imageUrl = await generateImage({
        prompt,
        size: '1024x1024',
        quality: 'hd'
      });

      setGeneratedImage(imageUrl);
      setGenerationProgress(100);
      setCurrentStep('Complete!');
      
      // Save image to database if ebookId is provided
      if (ebookId && getToken) {
        try {
          const token = await getToken({ template: 'supabase' });
          if (token) {
            // Save to images array
            await saveCoverImageToEbook(ebookId, imageUrl, prompt, token);
            // Also update the cover_image_url field
            await updateCoverImageUrl(ebookId, imageUrl, token);
            console.log('Cover image saved to database');
          }
        } catch (saveError) {
          console.error('Failed to save cover image to database:', saveError);
          // Don't show error to user as the image was still generated successfully
        }
      }
      
      if (onImageGenerated) {
        onImageGenerated(imageUrl, prompt);
      }

      toast({
        title: "Cover Generated!",
        description: "Your book cover has been successfully created.",
      });

    } catch (error) {
      console.error('Cover generation failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate cover image';
      
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
      setTimeout(() => {
        setGenerationProgress(0);
        setCurrentStep('');
      }, 2000);
    }
  };

  const handleDownloadImage = () => {
    if (!generatedImage) return;
    
    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = `${bookTitle.replace(/[^a-z0-9]/gi, '_')}_cover.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleRegenerateImage = () => {
    setGeneratedImage(null);
    handleGenerateImage();
  };

  return (
    <div className="space-y-6">
      <Card className="bg-white/90 backdrop-blur-lg border border-gray-200 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Cover Image Generator
          </CardTitle>
          <p className="text-sm text-gray-600">
            Create a professional book cover based on your story content
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Style Selection */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Cover Style</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {COVER_STYLES.map((style) => (
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
                  <div className="text-xs text-gray-500 mt-1">{style.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Prompt Option */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="useCustomPrompt"
                checked={useCustomPrompt}
                onChange={(e) => setUseCustomPrompt(e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="useCustomPrompt">Use custom prompt</Label>
            </div>
            
            {useCustomPrompt && (
              <Textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="Describe the cover you want to generate..."
                className="min-h-[100px]"
              />
            )}
          </div>

          {/* Generation Progress */}
          {isGenerating && (
            <div className="space-y-3">
              <Progress value={generationProgress} className="w-full" />
              <p className="text-sm text-gray-600 flex items-center gap-2">
                <RefreshCw className="h-4 w-4 animate-spin" />
                {currentStep}
              </p>
            </div>
          )}

          {/* Generated Image Display */}
          {generatedImage && !isGenerating && (
            <div className="space-y-4">
              <div className="relative">
                <img
                  src={generatedImage}
                  alt="Generated book cover"
                  className="w-full max-w-md mx-auto rounded-lg shadow-lg"
                />
                <div className="absolute top-2 right-2 space-x-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={handleDownloadImage}
                    className="bg-white/90 hover:bg-white"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={handleRegenerateImage}
                    className="bg-white/90 hover:bg-white"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Generate Button */}
          <Button
            onClick={generatedImage ? handleRegenerateImage : handleGenerateImage}
            disabled={isGenerating || !bookTitle.trim()}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Generating Cover...
              </>
            ) : generatedImage ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Regenerate Cover
              </>
            ) : (
              <>
                <Wand2 className="h-4 w-4 mr-2" />
                Generate Cover
              </>
            )}
          </Button>

          {!isAuthenticated && (
            <Alert>
              <AlertDescription>
                Sign in to generate custom book covers for your ebooks.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}; 