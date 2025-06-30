import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Heart,
  Star,
  Music,
  Sparkles,
  Image as ImageIcon,
  ZoomIn,
  ZoomOut,
  BookOpen
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Chapter {
  title: string;
  content: string;
  imageUrl?: string;
  id?: string;
}

interface ReadingPrefs {
  fontSize: 'small' | 'medium' | 'large' | 'xl';
  fontFamily: 'serif' | 'sans' | 'mono';
  lineHeight: 'tight' | 'normal' | 'relaxed';
  darkMode: boolean;
  pageTransition: 'slide' | 'fade' | 'flip';
  textToSpeech: boolean;
  autoBookmark: boolean;
}

interface BookPageViewProps {
  chapter: Chapter;
  chapterIndex: number;
  preferences: ReadingPrefs;
  useTaylorSwiftThemes?: boolean;
  onPageChange?: (pageIndex: number) => void;
}

export const BookPageView = ({
  chapter,
  chapterIndex,
  preferences,
  useTaylorSwiftThemes = true,
  onPageChange
}: BookPageViewProps) => {
  const [imageZoomed, setImageZoomed] = useState(false);
  const [readingStartTime, setReadingStartTime] = useState<number>(Date.now());
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setReadingStartTime(Date.now());
  }, [chapterIndex]);

  const getFontSizeClass = () => {
    switch (preferences.fontSize) {
      case 'small': return 'text-sm';
      case 'medium': return 'text-base';
      case 'large': return 'text-lg';
      case 'xl': return 'text-xl';
      default: return 'text-base';
    }
  };

  const getFontFamilyClass = () => {
    switch (preferences.fontFamily) {
      case 'serif': return 'font-serif';
      case 'sans': return 'font-sans';
      case 'mono': return 'font-mono';
      default: return 'font-serif';
    }
  };

  const getLineHeightClass = () => {
    switch (preferences.lineHeight) {
      case 'tight': return 'leading-tight';
      case 'normal': return 'leading-normal';
      case 'relaxed': return 'leading-relaxed';
      default: return 'leading-normal';
    }
  };

  const getThemeIcon = () => {
    if (!useTaylorSwiftThemes) return <Star className="h-5 w-5 text-blue-500" />;
    
    const icons = [
      <Heart className="h-5 w-5 text-pink-500" />,
      <Star className="h-5 w-5 text-yellow-500" />,
      <Music className="h-5 w-5 text-purple-500" />,
      <Sparkles className="h-5 w-5 text-blue-500" />
    ];
    return icons[chapterIndex % icons.length];
  };

  const getThemeGradient = () => {
    if (!useTaylorSwiftThemes) {
      return preferences.darkMode 
        ? "from-gray-800 to-gray-900" 
        : "from-blue-50 to-gray-50";
    }
    
    const gradients = [
      preferences.darkMode 
        ? "from-purple-900 via-pink-900 to-blue-900"
        : "from-pink-50 via-purple-50 to-blue-50",
      preferences.darkMode
        ? "from-yellow-900 via-orange-900 to-pink-900"
        : "from-yellow-50 via-orange-50 to-pink-50",
      preferences.darkMode
        ? "from-purple-900 via-blue-900 to-indigo-900"
        : "from-purple-50 via-blue-50 to-indigo-50",
      preferences.darkMode
        ? "from-blue-900 via-cyan-900 to-teal-900"
        : "from-blue-50 via-cyan-50 to-teal-50"
    ];
    return gradients[chapterIndex % gradients.length];
  };

  const estimateReadingTime = (text: string) => {
    const wordsPerMinute = 200;
    const words = text.split(' ').length;
    return Math.ceil(words / wordsPerMinute);
  };

  const formatContent = (content: string) => {
    return content.split('\n\n').map((paragraph, index) => (
      <p 
        key={index} 
        className={cn(
          "mb-6 first:mt-0 last:mb-0 transition-all duration-300",
          paragraph.startsWith('"') && "italic font-medium",
          useTaylorSwiftThemes && paragraph.startsWith('"') && "text-purple-600 dark:text-purple-400"
        )}
      >
        {paragraph}
      </p>
    ));
  };

  if (!chapter) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <BookOpen className="h-12 w-12 mx-auto text-gray-400" />
          <p className="text-gray-500">No chapter selected</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "min-h-screen transition-all duration-700",
      `bg-gradient-to-br ${getThemeGradient()}`
    )}>
      {/* Chapter Header */}
      <div className="sticky top-0 z-20 backdrop-blur-md border-b">
        <div className={cn(
          "px-6 py-4 transition-colors duration-300",
          preferences.darkMode 
            ? "bg-black/20 border-white/10" 
            : "bg-white/80 border-gray-200"
        )}>
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {getThemeIcon()}
                <div>
                  <h1 className={cn(
                    "text-2xl font-bold transition-colors duration-300",
                    preferences.darkMode ? "text-white" : "text-gray-900",
                    useTaylorSwiftThemes && "text-purple-800 dark:text-purple-200"
                  )}>
                    {chapter.title}
                  </h1>
                  <p className={cn(
                    "text-sm transition-colors duration-300",
                    preferences.darkMode ? "text-gray-300" : "text-gray-600"
                  )}>
                    Chapter {chapterIndex + 1} • {estimateReadingTime(chapter.content)} min read
                  </p>
                </div>
              </div>
              
              {/* Floating sparkles for Taylor Swift theme */}
              {useTaylorSwiftThemes && (
                <div className="relative">
                  <div className="absolute -top-2 -right-2 animate-pulse">
                    <Sparkles className="h-4 w-4 text-purple-400" />
                  </div>
                  <div className="absolute -top-4 right-4 animate-pulse delay-300">
                    <Star className="h-3 w-3 text-yellow-400" />
                  </div>
                  <div className="absolute top-2 -right-4 animate-pulse delay-700">
                    <Heart className="h-3 w-3 text-pink-400" />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <Card className={cn(
            "transition-all duration-300 border-0 shadow-2xl",
            preferences.darkMode 
              ? "bg-black/30 backdrop-blur-md" 
              : "bg-white/90 backdrop-blur-md"
          )}>
            <CardContent className="p-8 md:p-12">
              {/* Chapter Image */}
              {chapter.imageUrl && (
                <div className="mb-8">
                  <div 
                    className={cn(
                      "relative group cursor-pointer transition-all duration-300",
                      imageZoomed ? "fixed inset-4 z-50 bg-black/90 flex items-center justify-center" : ""
                    )}
                    onClick={() => setImageZoomed(!imageZoomed)}
                  >
                    <img
                      src={chapter.imageUrl}
                      alt={`Illustration for ${chapter.title}`}
                      className={cn(
                        "transition-all duration-300 rounded-lg shadow-lg",
                        imageZoomed 
                          ? "max-h-[90vh] max-w-[90vw] object-contain" 
                          : "w-full h-auto group-hover:scale-[1.02]"
                      )}
                    />
                    
                    {!imageZoomed && (
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <ZoomIn className="h-8 w-8 text-white" />
                      </div>
                    )}
                    
                    {imageZoomed && (
                      <Button
                        className="absolute top-4 right-4 z-10"
                        onClick={(e) => {
                          e.stopPropagation();
                          setImageZoomed(false);
                        }}
                      >
                        <ZoomOut className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {/* Chapter Content */}
              <div 
                ref={contentRef}
                className={cn(
                  "prose max-w-none transition-all duration-300",
                  getFontSizeClass(),
                  getFontFamilyClass(),
                  getLineHeightClass(),
                  preferences.darkMode 
                    ? "prose-invert prose-headings:text-white prose-p:text-gray-200" 
                    : "prose-gray",
                  useTaylorSwiftThemes && "prose-purple"
                )}
              >
                {formatContent(chapter.content)}
              </div>

              {/* Chapter End Decoration */}
              <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-center space-x-2">
                  {useTaylorSwiftThemes ? (
                    <>
                      <Heart className="h-4 w-4 text-pink-400" />
                      <Star className="h-4 w-4 text-yellow-400" />
                      <Music className="h-4 w-4 text-purple-400" />
                      <Sparkles className="h-4 w-4 text-blue-400" />
                    </>
                  ) : (
                    <>
                      <Star className="h-4 w-4 text-blue-400" />
                      <Star className="h-4 w-4 text-blue-400" />
                      <Star className="h-4 w-4 text-blue-400" />
                    </>
                  )}
                </div>
                <p className={cn(
                  "text-center text-sm mt-4 italic",
                  preferences.darkMode ? "text-gray-400" : "text-gray-500"
                )}>
                  End of Chapter {chapterIndex + 1}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bottom spacing for controls */}
      <div className="h-20"></div>
    </div>
  );
};