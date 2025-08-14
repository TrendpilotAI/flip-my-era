import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useEbookData } from '@/modules/ebook/hooks/useEbookData';
import { BookReader } from '@/modules/ebook/components/BookReader';
import { Button } from '@/modules/shared/components/ui/button';
import { useTheme } from '@/modules/shared/contexts/ThemeContext';
import { useThemeColors } from '@/modules/shared/utils/themeUtils';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/modules/shared/components/ui/card';

const EbookViewer: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { ebookData, loading, error } = useEbookData(id || null);
  const { currentTheme } = useTheme();
  const themeColors = useThemeColors();

  if (loading) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{ background: currentTheme.images.backgroundPattern }}
      >
        <Card className="p-8">
          <CardContent className="flex flex-col items-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin" style={{ color: themeColors.primary }} />
            <p className="text-gray-600">Loading your ebook...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !ebookData) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center px-4"
        style={{ background: currentTheme.images.backgroundPattern }}
      >
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Ebook Not Found</h2>
            <p className="text-gray-600 mb-6">
              {error || "The ebook you're looking for doesn't exist or you don't have permission to view it."}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                variant="outline"
                onClick={() => navigate(-1)}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Go Back
              </Button>
              <Button
                onClick={() => navigate('/dashboard')}
                className="text-white"
                style={{ background: `linear-gradient(to right, ${themeColors.primary}, ${themeColors.secondary})` }}
              >
                Return to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Transform the ebook data to match BookReader's expected format
  const chapters = ebookData.chapters.map(chapter => ({
    title: chapter.title,
    content: chapter.content,
    imageUrl: chapter.imageUrl,
    id: chapter.id
  }));

  return (
    <div className="fixed inset-0 z-50">
      <BookReader
        chapters={chapters}
        useTaylorSwiftThemes={false} // You can make this configurable based on ebook data
        designSettings={{
          fontFamily: 'serif',
          fontSize: 16,
          lineHeight: 1.6,
          letterSpacing: 0,
          textColor: currentTheme.colors.foreground,
          chapterHeadingColor: currentTheme.colors.primary,
          backgroundColor: currentTheme.colors.background,
          pageBackgroundColor: currentTheme.colors.card,
          accentColor: currentTheme.colors.primary
        }}
        onClose={() => navigate('/past-generations')}
        initialChapter={0}
      />
    </div>
  );
};

export default EbookViewer; 