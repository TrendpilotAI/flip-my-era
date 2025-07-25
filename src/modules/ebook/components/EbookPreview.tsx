import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/modules/shared/components/ui/card';
import { Button } from '@/modules/shared/components/ui/button';
import { Badge } from '@/modules/shared/components/ui/badge';
import { ScrollArea } from '@/modules/shared/components/ui/scroll-area';
import { Separator } from '@/modules/shared/components/ui/separator';
import { useToast } from '@/modules/shared/hooks/use-toast';
import { 
  BookOpen, 
  Eye, 
  Download, 
  Share2, 
  ChevronLeft, 
  ChevronRight,
  ZoomIn,
  ImageIcon,
  Loader2
} from 'lucide-react';
import { cn } from '@/core/lib/utils';

interface Chapter {
  id: string;
  title: string;
  content: string;
  imageUrl?: string;
}

interface EbookData {
  id: string;
  title: string;
  subtitle?: string;
  author_name?: string;
  description?: string;
  cover_image_url?: string;
  chapters: Chapter[];
  images?: Array<{
    chapter_id?: string;
    type: 'cover' | 'chapter';
    url: string;
    prompt?: string;
    generated_at?: string;
  }>;
  created_at: string;
  status: string;
}

interface EbookPreviewProps {
  ebookData: EbookData;
  onDownload?: () => void;
  onShare?: () => void;
  className?: string;
}

export const EbookPreview: React.FC<EbookPreviewProps> = ({
  ebookData,
  onDownload,
  onShare,
  className
}) => {
  const { toast } = useToast();
  const [currentPage, setCurrentPage] = useState(0); // 0 = cover, 1+ = chapters
  const [imageZoomed, setImageZoomed] = useState(false);
  const [zoomedImageUrl, setZoomedImageUrl] = useState<string | null>(null);

  // Merge chapter images from the images array
  const chaptersWithImages = ebookData.chapters.map(chapter => {
    const chapterImage = ebookData.images?.find(
      img => img.chapter_id === chapter.id && img.type === 'chapter'
    );
    return {
      ...chapter,
      imageUrl: chapterImage?.url || chapter.imageUrl
    };
  });

  const coverImage = ebookData.cover_image_url || 
    ebookData.images?.find(img => img.type === 'cover')?.url;

  const totalPages = chaptersWithImages.length + 1; // +1 for cover

  const handleImageZoom = (imageUrl: string) => {
    setZoomedImageUrl(imageUrl);
    setImageZoomed(true);
  };

  const handlePreviousPage = () => {
    setCurrentPage(Math.max(0, currentPage - 1));
  };

  const handleNextPage = () => {
    setCurrentPage(Math.min(totalPages - 1, currentPage + 1));
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

  return (
    <div className={cn("w-full max-w-6xl mx-auto space-y-6", className)}>
      {/* Header with book info and actions */}
      <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-2">
              <CardTitle className="text-2xl md:text-3xl text-purple-900">
                {ebookData.title}
              </CardTitle>
              {ebookData.subtitle && (
                <p className="text-lg text-purple-700">{ebookData.subtitle}</p>
              )}
              {ebookData.author_name && (
                <p className="text-purple-600">by {ebookData.author_name}</p>
              )}
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                  {chaptersWithImages.length} Chapters
                </Badge>
                <Badge variant="outline" className="border-purple-300 text-purple-700">
                  {ebookData.status === 'completed' ? 'Ready' : 'In Progress'}
                </Badge>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleShare}
                className="border-purple-300 text-purple-700 hover:bg-purple-50"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
              <Button 
                size="sm" 
                onClick={handleDownload}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Main preview area */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Table of Contents */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Contents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96">
              <div className="space-y-2">
                {/* Cover page */}
                <button
                  onClick={() => setCurrentPage(0)}
                  className={cn(
                    "w-full text-left p-3 rounded-lg transition-colors",
                    currentPage === 0 
                      ? "bg-purple-100 text-purple-900 border border-purple-300" 
                      : "hover:bg-gray-50"
                  )}
                >
                  <div className="font-medium">Cover Page</div>
                  <div className="text-sm text-gray-500">Title & Cover Image</div>
                </button>
                
                <Separator />
                
                {/* Chapters */}
                {chaptersWithImages.map((chapter, index) => (
                  <button
                    key={chapter.id}
                    onClick={() => setCurrentPage(index + 1)}
                    className={cn(
                      "w-full text-left p-3 rounded-lg transition-colors",
                      currentPage === index + 1 
                        ? "bg-purple-100 text-purple-900 border border-purple-300" 
                        : "hover:bg-gray-50"
                    )}
                  >
                    <div className="font-medium">Chapter {index + 1}</div>
                    <div className="text-sm text-gray-500 truncate">
                      {chapter.title}
                    </div>
                    {chapter.imageUrl && (
                      <div className="flex items-center gap-1 mt-1">
                        <ImageIcon className="w-3 h-3 text-green-600" />
                        <span className="text-xs text-green-600">Has Image</span>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Preview content */}
        <div className="lg:col-span-3">
          <Card className="min-h-[600px]">
            <CardContent className="p-8">
              {/* Cover page */}
              {currentPage === 0 && (
                <div className="text-center space-y-8">
                  {coverImage ? (
                    <div className="max-w-md mx-auto">
                      <img
                        src={coverImage}
                        alt="Book Cover"
                        className="w-full h-auto rounded-lg shadow-xl cursor-pointer transition-transform hover:scale-105"
                        onClick={() => handleImageZoom(coverImage)}
                      />
                    </div>
                  ) : (
                    <div className="max-w-md mx-auto h-96 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg flex items-center justify-center border-2 border-dashed border-purple-300">
                      <div className="text-center">
                        <ImageIcon className="w-16 h-16 text-purple-400 mx-auto mb-4" />
                        <p className="text-purple-600">Cover image will appear here</p>
                      </div>
                    </div>
                  )}
                  
                  <div className="space-y-4">
                    <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
                      {ebookData.title}
                    </h1>
                    {ebookData.subtitle && (
                      <h2 className="text-xl md:text-2xl text-gray-600">
                        {ebookData.subtitle}
                      </h2>
                    )}
                    {ebookData.author_name && (
                      <p className="text-lg text-gray-700">
                        by {ebookData.author_name}
                      </p>
                    )}
                    {ebookData.description && (
                      <p className="text-gray-600 max-w-2xl mx-auto leading-relaxed">
                        {ebookData.description}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Chapter pages */}
              {currentPage > 0 && (
                <div className="space-y-8">
                  {(() => {
                    const chapter = chaptersWithImages[currentPage - 1];
                    if (!chapter) return null;

                    return (
                      <>
                        <div className="text-center border-b border-gray-200 pb-6">
                          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                            Chapter {currentPage}
                          </h1>
                          <h2 className="text-xl md:text-2xl text-gray-700">
                            {chapter.title}
                          </h2>
                        </div>

                        {chapter.imageUrl && (
                          <div className="text-center mb-8">
                            <img
                              src={chapter.imageUrl}
                              alt={`Illustration for ${chapter.title}`}
                              className="max-w-full h-auto rounded-lg shadow-lg cursor-pointer transition-transform hover:scale-105 mx-auto"
                              style={{ maxHeight: '400px' }}
                              onClick={() => handleImageZoom(chapter.imageUrl!)}
                            />
                          </div>
                        )}

                        <div className="prose prose-lg max-w-none">
                          {chapter.content.split('\n\n').map((paragraph, index) => (
                            <p key={index} className="mb-6 leading-relaxed text-gray-800">
                              {paragraph}
                            </p>
                          ))}
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-6">
            <Button
              variant="outline"
              onClick={handlePreviousPage}
              disabled={currentPage === 0}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </Button>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">
                Page {currentPage + 1} of {totalPages}
              </span>
            </div>
            
            <Button
              variant="outline"
              onClick={handleNextPage}
              disabled={currentPage === totalPages - 1}
              className="flex items-center gap-2"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Image zoom modal */}
      {imageZoomed && zoomedImageUrl && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setImageZoomed(false)}
        >
          <div className="relative max-w-[90vw] max-h-[90vh]">
            <img
              src={zoomedImageUrl}
              alt="Zoomed image"
              className="max-w-full max-h-full object-contain rounded-lg"
            />
            <Button
              variant="secondary"
              size="sm"
              className="absolute top-4 right-4"
              onClick={() => setImageZoomed(false)}
            >
              ✕
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}; 