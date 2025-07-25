import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/modules/shared/components/ui/card';
import { Button } from '@/modules/shared/components/ui/button';
import { Badge } from '@/modules/shared/components/ui/badge';
import { Alert, AlertDescription } from '@/modules/shared/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/modules/shared/components/ui/tabs';
import { useToast } from '@/modules/shared/hooks/use-toast';
import { EbookPreview } from './EbookPreview';
import { CoverImageGenerator } from './CoverImageGenerator';
import { ChapterImageGenerator } from './ChapterImageGenerator';
import { useEbookData } from '../hooks/useEbookData';
import { generateImage } from '@/modules/story/services/ai';
import { saveCoverImageToEbook, saveChapterImageToEbook, updateCoverImageUrl } from '../utils/imageStorage';
import { useClerkAuth } from '@/modules/auth/contexts/ClerkAuthContext';
import { 
  BookOpen, 
  Eye, 
  Download, 
  Share2, 
  Image as ImageIcon,
  Wand2,
  CheckCircle,
  AlertCircle,
  Loader2,
  Zap
} from 'lucide-react';

interface EbookPublishPreviewProps {
  ebookId: string;
  onDownload?: () => void;
  onShare?: () => void;
  className?: string;
}

export const EbookPublishPreview: React.FC<EbookPublishPreviewProps> = ({
  ebookId,
  onDownload,
  onShare,
  className
}) => {
  const { toast } = useToast();
  const { isAuthenticated, getToken } = useClerkAuth();
  const { ebookData, loading, error, refetch } = useEbookData(ebookId);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStep, setCurrentStep] = useState('');
  const [progress, setProgress] = useState(0);
  const [activeTab, setActiveTab] = useState('preview');

  const handleCoverImageGenerated = (imageUrl: string, prompt: string) => {
    toast({
      title: "Cover Generated!",
      description: "Your book cover has been created and saved.",
    });
    // Refresh the ebook data to show the new cover
    refetch();
  };

  const handleChapterImageGenerated = (chapterId: string, imageUrl: string, prompt: string) => {
    toast({
      title: "Chapter Image Generated!",
      description: "Chapter illustration has been created and saved.",
    });
    // Refresh the ebook data to show the new image
    refetch();
  };

  const handleError = (error: string) => {
    toast({
      title: "Generation Error",
      description: error,
      variant: "destructive",
    });
  };

  const handleGenerateCompleteEbook = async () => {
    if (!ebookData || !isAuthenticated) return;

    try {
      setIsGenerating(true);
      setProgress(0);
      setCurrentStep('Starting complete ebook generation...');

      const token = await getToken({ template: 'supabase' });
      if (!token) {
        throw new Error('Authentication token not available');
      }

      let currentProgress = 10;
      setProgress(currentProgress);

      // Check if cover image is missing and generate it
      const hasCover = !!ebookData.cover_image_url || 
        ebookData.images?.some(img => img.type === 'cover');
      
      if (!hasCover) {
        setCurrentStep('Generating book cover...');
        setProgress(20);

        const coverPrompt = `Professional book cover for "${ebookData.title}"${ebookData.author_name ? ` by ${ebookData.author_name}` : ''}, based on story: ${ebookData.chapters.map(ch => ch.content).join(' ').substring(0, 300)}..., modern book cover design, high quality, detailed artwork`;

        const coverImageUrl = await generateImage({
          prompt: coverPrompt,
          size: '1024x1024',
          quality: 'hd'
        });

        await saveCoverImageToEbook(ebookId, coverImageUrl, coverPrompt, token);
        await updateCoverImageUrl(ebookId, coverImageUrl, token);
        currentProgress = 50;
        setProgress(currentProgress);
        setCurrentStep('Cover image generated successfully');
      } else {
        currentProgress = 50;
        setProgress(currentProgress);
        setCurrentStep('Cover image already exists, skipping...');
      }

      // Generate missing chapter images
      const chaptersNeedingImages = ebookData.chapters.filter(chapter => 
        !chapter.imageUrl && 
        !ebookData.images?.some(img => img.chapter_id === chapter.id && img.type === 'chapter')
      );

      if (chaptersNeedingImages.length > 0) {
        setCurrentStep('Generating chapter illustrations...');
        
        for (let i = 0; i < chaptersNeedingImages.length; i++) {
          const chapter = chaptersNeedingImages[i];
          const progressIncrement = (40 / chaptersNeedingImages.length);
          
          setCurrentStep(`Generating image for "${chapter.title}"...`);
          setProgress(currentProgress + (i * progressIncrement));

          try {
            const chapterPrompt = `Detailed illustration for chapter "${chapter.title}", scene depicting: ${chapter.content.substring(0, 300)}, artistic style, book illustration, high quality artwork`;
            
            const chapterImageUrl = await generateImage({
              prompt: chapterPrompt,
              size: '1024x1024',
              quality: 'hd'
            });

            await saveChapterImageToEbook(ebookId, chapter.id, chapterImageUrl, chapterPrompt, token);

            // Small delay to avoid rate limits
            if (i < chaptersNeedingImages.length - 1) {
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          } catch (error) {
            console.warn(`Failed to generate image for chapter "${chapter.title}":`, error);
            // Continue with other chapters even if one fails
          }
        }
        
        currentProgress = 90;
        setProgress(currentProgress);
      } else {
        currentProgress = 90;
        setProgress(currentProgress);
        setCurrentStep('All chapter images already exist, skipping...');
      }

      // Finalize
      setCurrentStep('Complete ebook generation finished!');
      setProgress(100);

      toast({
        title: "Complete Ebook Generated!",
        description: "Your ebook with cover and chapter images is ready.",
      });

      // Refresh the data after generation
      setTimeout(() => {
        refetch();
        setIsGenerating(false);
      }, 1000);

    } catch (error) {
      console.error('Complete ebook generation failed:', error);
      setIsGenerating(false);
      toast({
        title: "Generation Failed",
        description: "Failed to generate complete ebook. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-center space-y-4">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-purple-600" />
            <p className="text-gray-600">Loading your ebook...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !ebookData) {
    return (
      <Card className={className}>
        <CardContent className="p-8">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error || 'Failed to load ebook data. Please try again.'}
            </AlertDescription>
          </Alert>
          <Button 
            onClick={refetch} 
            className="mt-4"
            variant="outline"
          >
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Calculate completion status
  const hasContent = ebookData.chapters.length > 0;
  const hasCover = !!ebookData.cover_image_url || 
    ebookData.images?.some(img => img.type === 'cover');
  const chaptersWithImages = ebookData.chapters.filter(chapter => 
    chapter.imageUrl || 
    ebookData.images?.some(img => img.chapter_id === chapter.id && img.type === 'chapter')
  );
  const imageCompletionRate = ebookData.chapters.length > 0 
    ? (chaptersWithImages.length / ebookData.chapters.length) * 100 
    : 0;

  // Check if we need to show the generate complete ebook button
  const needsCompleteGeneration = hasContent && (!hasCover || imageCompletionRate < 100);
  const isReadyToPublish = ebookData.status === 'completed' && hasCover && imageCompletionRate === 100;

  return (
    <div className={className}>
      {/* Status Overview */}
      <Card className="mb-6 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-purple-900">
            <BookOpen className="w-5 h-5" />
            Publish Your Ebook
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${hasContent ? 'bg-green-100' : 'bg-gray-100'}`}>
                {hasContent ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-gray-400" />
                )}
              </div>
              <div>
                <p className="font-medium text-gray-900">Content</p>
                <p className="text-sm text-gray-600">
                  {ebookData.chapters.length} chapters
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${hasCover ? 'bg-green-100' : 'bg-yellow-100'}`}>
                {hasCover ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <ImageIcon className="w-5 h-5 text-yellow-600" />
                )}
              </div>
              <div>
                <p className="font-medium text-gray-900">Cover Image</p>
                <p className="text-sm text-gray-600">
                  {hasCover ? 'Ready' : 'Generate cover'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${imageCompletionRate === 100 ? 'bg-green-100' : 'bg-yellow-100'}`}>
                {imageCompletionRate === 100 ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <ImageIcon className="w-5 h-5 text-yellow-600" />
                )}
              </div>
              <div>
                <p className="font-medium text-gray-900">Chapter Images</p>
                <p className="text-sm text-gray-600">
                  {chaptersWithImages.length} of {ebookData.chapters.length} complete
                </p>
              </div>
            </div>
          </div>
          
          {/* Generate Complete Ebook Button */}
          {needsCompleteGeneration && !isGenerating && (
            <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-blue-900 mb-1">Generate Complete Ebook</h3>
                  <p className="text-sm text-blue-700">
                    Combine your content with cover and chapter images to create the final ebook.
                  </p>
                </div>
                <Button 
                  onClick={handleGenerateCompleteEbook}
                  className="bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600"
                  size="lg"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Generate Complete Ebook
                </Button>
              </div>
            </div>
          )}

          {/* Generation Progress */}
          {isGenerating && (
            <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-3 mb-3">
                <Loader2 className="w-5 h-5 animate-spin text-green-600" />
                <div>
                  <h3 className="font-semibold text-green-900">Generating Your Complete Ebook</h3>
                  <p className="text-sm text-green-700">{currentStep}</p>
                </div>
              </div>
              <div className="w-full bg-green-100 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-green-600 mt-1">{Math.round(progress)}% complete</p>
            </div>
          )}
          
          {isReadyToPublish && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="font-medium text-green-800">Ready to Publish!</span>
              </div>
              <p className="text-sm text-green-700 mt-1">
                Your ebook is complete with all content and images.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="preview" className="flex items-center gap-2">
            <Eye className="w-4 h-4" />
            Preview
          </TabsTrigger>
          <TabsTrigger value="cover" className="flex items-center gap-2">
            <ImageIcon className="w-4 h-4" />
            Cover Image
          </TabsTrigger>
          <TabsTrigger value="illustrations" className="flex items-center gap-2">
            <Wand2 className="w-4 h-4" />
            Chapter Images
          </TabsTrigger>
        </TabsList>

        <TabsContent value="preview" className="mt-6">
          <EbookPreview
            ebookData={ebookData}
            onDownload={onDownload}
            onShare={onShare}
          />
        </TabsContent>

        <TabsContent value="cover" className="mt-6">
          <CoverImageGenerator
            storyText={ebookData.chapters.map(ch => ch.content).join('\n\n')}
            bookTitle={ebookData.title}
            authorName={ebookData.author_name}
            ebookId={ebookId}
            onImageGenerated={handleCoverImageGenerated}
            onError={handleError}
          />
        </TabsContent>

        <TabsContent value="illustrations" className="mt-6">
          <ChapterImageGenerator
            chapters={ebookData.chapters}
            bookTitle={ebookData.title}
            ebookId={ebookId}
            onChapterImageGenerated={handleChapterImageGenerated}
            onError={handleError}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}; 