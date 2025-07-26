import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/modules/shared/components/ui/card';
import { Button } from '@/modules/shared/components/ui/button';
import { Badge } from '@/modules/shared/components/ui/badge';
import { Alert, AlertDescription } from '@/modules/shared/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/modules/shared/components/ui/tabs';
import { ScrollArea } from '@/modules/shared/components/ui/scroll-area';
import { Separator } from '@/modules/shared/components/ui/separator';
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
  Zap,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  Settings
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
  const [currentPage, setCurrentPage] = useState(0); // 0 = cover, 1+ = chapters
  const [imageZoomed, setImageZoomed] = useState(false);
  const [zoomedImageUrl, setZoomedImageUrl] = useState<string | null>(null);
  const [showImageGeneration, setShowImageGeneration] = useState(false);
  const [showDebugInfo, setShowDebugInfo] = useState(false);

  const handleCoverImageGenerated = async (imageUrl: string, prompt: string) => {
    // Save generated cover image to database
    try {
      const token = await getToken({ template: 'supabase' });
      if (token) {
        await saveCoverImageToEbook(ebookId, imageUrl, prompt, token);
      }
    } catch (error) {
      console.error('Error saving cover image:', error);
    }
    toast({
      title: "Cover Generated!",
      description: "Your book cover has been created and saved.",
    });
    await refetch();
  };

  const handleChapterImageGenerated = async (chapterId: string, imageUrl: string, prompt: string) => {
    // Save generated chapter image to database
    try {
      const token = await getToken({ template: 'supabase' });
      if (token) {
        await saveChapterImageToEbook(ebookId, chapterId, imageUrl, prompt, token);
      }
    } catch (error) {
      console.error('Error saving chapter image:', error);
    }
    toast({
      title: "Chapter Image Generated!",
      description: "Chapter illustration has been created and saved.",
    });
    await refetch();
  };

  const handleError = (error: string) => {
    toast({
      title: "Generation Error",
      description: error,
      variant: "destructive",
    });
  };

  const handleImageZoom = (imageUrl: string) => {
    setZoomedImageUrl(imageUrl);
    setImageZoomed(true);
  };

  const handleDownload = () => {
    if (onDownload) {
      onDownload();
    } else {
      toast({
        title: "Download Feature",
        description: "Download functionality will be available soon.",
        variant: "default",
      });
    }
  };

  const handleShare = () => {
    if (onShare) {
      onShare();
    } else {
      toast({
        title: "Share Feature",
        description: "Share functionality will be available soon.",
        variant: "default",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
        <span className="ml-2 text-gray-600">Loading ebook...</span>
      </div>
    );
  }

  if (error || !ebookData) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load ebook data: {error || 'Ebook not found'}
        </AlertDescription>
      </Alert>
    );
  }

  console.log('🔍 DEBUGGING: EbookPublishPreview - ebookData:', ebookData);
  console.log('🔍 DEBUGGING: EbookPublishPreview - ebookData.images:', ebookData.images);
  console.log('🔍 DEBUGGING: EbookPublishPreview - ebookData.cover_image_url:', ebookData.cover_image_url);
  console.log('🔍 DEBUGGING: EbookPublishPreview - ebookData.chapters:', ebookData.chapters);

  // Helper function to extract image URL from any image object
  const extractImageUrl = (imageObj: any): string | undefined => {
    if (!imageObj) return undefined;
    // Prioritize 'imageUrl' field since that's what stream-chapters-enhanced stores
    return imageObj.imageUrl || imageObj.url || imageObj.image_url;
  };

  // Update the image handling logic to support streaming-generated and manual images
  const chaptersWithImages = ebookData.chapters.map((chapter, index) => {
    // Find streaming-generated image by chapterNumber
    const streamingImage = ebookData.images?.find(
      img => img.chapterNumber === index + 1 && img.type === 'chapter_illustration'
    );
    // Find manually-generated image by chapter_id
    const manualImage = ebookData.images?.find(
      img => (img as any).chapter_id === chapter.id && img.type === 'chapter'
    );
    // Also check for any image with matching chapter number (fallback)
    const fallbackImage = ebookData.images?.find(
      img => (img as any).chapterNumber === index + 1
    );
    // Check for any image that might be associated with this chapter
    const anyChapterImage = ebookData.images?.find(
      img => img.type === 'chapter' || img.type === 'chapter_illustration'
    );
    
    // More robust image matching
    // Try to find any image that could be associated with this chapter
    const chapterImage = ebookData.images?.find(img => {
      // Check if it's a chapter image (updated to include 'chapter_illustration' type)
      if (img.type !== 'chapter' && img.type !== 'chapter_illustration') {
        return false;
      }
      
      // Try multiple matching strategies
      return (
        // Exact chapter_id match (for manually generated images)
        img.chapter_id === chapter.id ||
        // Chapter number match (1-based index) - primary method for stream-generated images
        img.chapterNumber === index + 1 ||
        // Chapter title match (case insensitive)
        (img.chapterTitle && img.chapterTitle.toLowerCase() === chapter.title.toLowerCase()) ||
        // Fallback: any chapter image if this is the first chapter and no other chapter has an image
        (index === 0 && !ebookData.images?.some(otherImg => 
          (otherImg.type === 'chapter' || otherImg.type === 'chapter_illustration') && otherImg !== img
        ))
      );
    });
    
    // Also try to find any image by chapter number as a fallback
    const chapterImageByNumber = ebookData.images?.find(img => 
      (img.type === 'chapter' || img.type === 'chapter_illustration') && img.chapterNumber === index + 1
    );
    
    // Try all possible image sources in order of preference
    const imageUrl =
      extractImageUrl(chapterImage) || // Try our improved matching first
      extractImageUrl(chapterImageByNumber) || // Try by chapter number
      extractImageUrl(streamingImage) ||
      extractImageUrl(manualImage) ||
      extractImageUrl(fallbackImage) ||
      extractImageUrl(anyChapterImage);
    
    return {
      ...chapter,
      imageUrl
    };
  });

  // Get cover image from cover_image_url field first, then from images array
  const coverImage = ebookData.cover_image_url || 
    extractImageUrl(ebookData.images?.find(img => img.type === 'cover'));

  const totalPages = chaptersWithImages.length + 1; // +1 for cover

  const handlePreviousPage = () => {
    setCurrentPage(Math.max(0, currentPage - 1));
  };

  const handleNextPage = () => {
    setCurrentPage(Math.min(totalPages - 1, currentPage + 1));
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* Header with book info and actions */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{ebookData.title}</h1>
          {ebookData.subtitle && (
            <p className="text-lg text-gray-600 mt-1">{ebookData.subtitle}</p>
          )}
          {ebookData.author_name && (
            <p className="text-sm text-gray-500 mt-1">by {ebookData.author_name}</p>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => setShowDebugInfo(!showDebugInfo)}
            className="flex items-center gap-2"
          >
            <Eye className="w-4 h-4" />
            {showDebugInfo ? 'Hide' : 'Show'} Debug Info
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowImageGeneration(!showImageGeneration)}
            className="flex items-center gap-2"
          >
            <Settings className="w-4 h-4" />
            {showImageGeneration ? 'Hide' : 'Show'} Image Tools
          </Button>
          <Button onClick={handleDownload} className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            Download
          </Button>
          <Button onClick={handleShare} variant="outline" className="flex items-center gap-2">
            <Share2 className="w-4 h-4" />
            Share
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Book Preview - Main Area */}
        <div className="lg:col-span-3">
          <Card className="bg-white shadow-lg">
            <CardContent className="p-0">
              {/* Navigation */}
              <div className="flex items-center justify-between p-4 border-b bg-gray-50">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePreviousPage}
                    disabled={currentPage === 0}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages - 1}
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="text-sm text-gray-600">
                  Page {currentPage + 1} of {totalPages}
                </div>
              </div>

              {/* Book Content */}
              <div className="min-h-[600px] p-8">
                {currentPage === 0 ? (
                  // Cover Page
                  <div className="text-center space-y-6">
                    {coverImage && (
                      <div className="mb-8">
                        <img
                          src={coverImage}
                          alt="Book Cover"
                          className="max-w-md mx-auto rounded-lg shadow-lg cursor-pointer hover:shadow-xl transition-shadow"
                          onClick={() => handleImageZoom(coverImage)}
                        />
                      </div>
                    )}
                    
                    <div className="space-y-4">
                      <h1 className="text-4xl font-bold text-gray-900">{ebookData.title}</h1>
                      {ebookData.subtitle && (
                        <h2 className="text-2xl text-gray-600">{ebookData.subtitle}</h2>
                      )}
                      {ebookData.author_name && (
                        <p className="text-xl text-gray-700">by {ebookData.author_name}</p>
                      )}
                      {ebookData.description && (
                        <p className="text-gray-600 max-w-2xl mx-auto leading-relaxed">
                          {ebookData.description}
                        </p>
                      )}
                    </div>
                    
                    {!coverImage && (
                      <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-8 max-w-md mx-auto">
                        <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-500">No cover image generated yet</p>
                      </div>
                    )}
                  </div>
                ) : (
                  // Chapter Page
                  (() => {
                    const chapter = chaptersWithImages[currentPage - 1];
                    if (!chapter) return null;
                    
                    return (
                      <div className="space-y-6">
                        <div className="text-center">
                          <h2 className="text-3xl font-bold text-gray-900 mb-4">
                            {chapter.title}
                          </h2>
                          
                          {chapter.imageUrl && (
                            <div className="mb-8">
                              <img
                                src={chapter.imageUrl}
                                alt={`Illustration for ${chapter.title}`}
                                className="max-w-lg mx-auto rounded-lg shadow-lg cursor-pointer hover:shadow-xl transition-shadow"
                                onClick={() => handleImageZoom(chapter.imageUrl!)}
                              />
                            </div>
                          )}
                        </div>
                        
                        <div className="prose prose-lg max-w-none">
                          {chapter.content.split('\n\n').map((paragraph, index) => (
                            <p key={index} className="mb-4 leading-relaxed text-gray-800">
                              {paragraph}
                            </p>
                          ))}
                        </div>
                        
                        {!chapter.imageUrl && (
                          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
                            <ImageIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                            <p className="text-gray-500 text-sm">No illustration generated for this chapter yet</p>
                          </div>
                        )}
                      </div>
                    );
                  })()
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Table of Contents and Stats */}
        <div className="lg:col-span-1 space-y-6">
          {/* Table of Contents */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                Contents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <button
                  onClick={() => setCurrentPage(0)}
                  className={`w-full text-left p-2 rounded text-sm transition-colors ${
                    currentPage === 0 
                      ? 'bg-purple-100 text-purple-800 font-medium' 
                      : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  Cover Page
                </button>
                
                {chaptersWithImages.map((chapter, index) => (
                  <button
                    key={chapter.id}
                    onClick={() => setCurrentPage(index + 1)}
                    className={`w-full text-left p-2 rounded text-sm transition-colors ${
                      currentPage === index + 1 
                        ? 'bg-purple-100 text-purple-800 font-medium' 
                        : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="truncate">{chapter.title}</span>
                      {chapter.imageUrl && (
                        <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0 ml-1" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Book Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Book Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Chapters:</span>
                <span className="font-medium">{chaptersWithImages.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Word Count:</span>
                <span className="font-medium">
                  {ebookData.word_count || 
                    chaptersWithImages.reduce((total, ch) => total + (ch.content?.split(' ').length || 0), 0)
                  }
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Images:</span>
                <span className="font-medium">
                  {(coverImage ? 1 : 0) + chaptersWithImages.filter(ch => ch.imageUrl).length} / {chaptersWithImages.length + 1}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Status:</span>
                <Badge variant={ebookData.status === 'completed' ? 'default' : 'secondary'}>
                  {ebookData.status}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Debug Info Panel - Collapsible */}
      {showDebugInfo && (
        <Card className="bg-yellow-50 border-yellow-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-900">
              <Eye className="w-5 h-5" />
              Debug Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-yellow-900 mb-2">Raw Ebook Data:</h4>
                <pre className="bg-white p-3 rounded border text-xs overflow-auto max-h-40">
                  {JSON.stringify(ebookData, null, 2)}
                </pre>
              </div>
              
              <div>
                <h4 className="font-medium text-yellow-900 mb-2">Images Array:</h4>
                <pre className="bg-white p-3 rounded border text-xs overflow-auto max-h-40">
                  {JSON.stringify(ebookData.images, null, 2)}
                </pre>
              </div>
              
              <div>
                <h4 className="font-medium text-yellow-900 mb-2">Cover Image URL:</h4>
                <p className="bg-white p-3 rounded border text-sm break-all">
                  {ebookData.cover_image_url || 'No cover image URL found'}
                </p>
              </div>
              
              <div>
                <h4 className="font-medium text-yellow-900 mb-2">Chapters with Images:</h4>
                <pre className="bg-white p-3 rounded border text-xs overflow-auto max-h-40">
                  {JSON.stringify(chaptersWithImages.map(ch => ({
                    title: ch.title,
                    imageUrl: ch.imageUrl,
                    id: ch.id
                  })), null, 2)}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Image Generation Tools - Collapsible */}
      {showImageGeneration && (
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <Wand2 className="w-5 h-5" />
              Image Generation Tools
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="cover" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="cover">Cover Image</TabsTrigger>
                <TabsTrigger value="chapters">Chapter Images</TabsTrigger>
              </TabsList>
              
              <TabsContent value="cover" className="mt-4">
                <CoverImageGenerator
                  storyText={ebookData.chapters.map(ch => ch.content).join('\n\n')}
                  bookTitle={ebookData.title}
                  authorName={ebookData.author_name}
                  ebookId={ebookId}
                  onImageGenerated={handleCoverImageGenerated}
                  onError={handleError}
                />
              </TabsContent>
              
              <TabsContent value="chapters" className="mt-4">
                <ChapterImageGenerator
                  chapters={ebookData.chapters}
                  bookTitle={ebookData.title}
                  ebookId={ebookId}
                  onChapterImageGenerated={handleChapterImageGenerated}
                  onError={handleError}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Image Zoom Modal */}
      {imageZoomed && zoomedImageUrl && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setImageZoomed(false)}
        >
          <div className="relative max-w-4xl max-h-full">
            <img
              src={zoomedImageUrl}
              alt="Zoomed image"
              className="max-w-full max-h-full object-contain rounded-lg"
            />
            <Button
              variant="outline"
              size="sm"
              className="absolute top-4 right-4 bg-white"
              onClick={() => setImageZoomed(false)}
            >
              Close
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}; 