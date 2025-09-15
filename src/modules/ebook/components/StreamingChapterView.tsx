import { useState, useEffect } from "react";
import { StreamingText } from '@/modules/story/components/StreamingText';
import { Card, CardContent, CardHeader, CardTitle } from '@/modules/shared/components/ui/card';
import { Button } from '@/modules/shared/components/ui/button';
import { ImageSkeleton } from '@/modules/shared/components/ui/image-skeleton';
import {
  Sparkles,
  Heart,
  Star,
  Music,
  Eye,
  EyeOff
} from "lucide-react";
import { cn } from '@/core/lib/utils';

interface Chapter {
  title: string;
  content: string;
  streamingContent?: string;
  imageUrl?: string;
  id?: string;
  isStreaming?: boolean;
}

interface StreamingChapterViewProps {
  chapter: Chapter;
  index: number;
  isGeneratingImages?: boolean;
  useTaylorSwiftThemes?: boolean;
  showStreamingText?: boolean;
  onStreamingComplete?: () => void;
  imageGenerationStatus?: 'pending' | 'generating' | 'complete' | 'error';
  imageGenerationProgress?: number;
}

export const StreamingChapterView = ({
  chapter,
  index,
  isGeneratingImages = false,
  useTaylorSwiftThemes = true,
  showStreamingText = true,
  onStreamingComplete,
  imageGenerationStatus,
  imageGenerationProgress = 0
}: StreamingChapterViewProps) => {
  const [showFullContent, setShowFullContent] = useState(!showStreamingText);
  const [streamingComplete, setStreamingComplete] = useState(!showStreamingText);

  useEffect(() => {
    if (streamingComplete && onStreamingComplete) {
      onStreamingComplete();
    }
  }, [streamingComplete, onStreamingComplete]);

  const getThemeIcon = () => {
    if (!useTaylorSwiftThemes) {
      return <Star className="h-6 w-6" />;
    }
    
    const icons = [
      <Heart className="h-6 w-6" key="heart" />,
      <Star className="h-6 w-6" key="star" />,
      <Sparkles className="h-6 w-6" key="sparkles" />,
      <Music className="h-6 w-6" key="music" />
    ];
    return icons[index % icons.length];
  };

  const getThemeColors = () => {
    if (!useTaylorSwiftThemes) {
      return {
        card: "bg-white/95 border-blue-200",
        header: "bg-gradient-to-r from-blue-500 to-blue-600",
        accent: "text-blue-600"
      };
    }
    
    const themes = [
      {
        card: "bg-white/95 border-pink-200",
        header: "bg-gradient-to-r from-pink-500 to-rose-500",
        accent: "text-pink-600"
      },
      {
        card: "bg-white/95 border-purple-200", 
        header: "bg-gradient-to-r from-purple-500 to-indigo-500",
        accent: "text-purple-600"
      },
      {
        card: "bg-white/95 border-amber-200",
        header: "bg-gradient-to-r from-amber-500 to-orange-500", 
        accent: "text-amber-600"
      },
      {
        card: "bg-white/95 border-emerald-200",
        header: "bg-gradient-to-r from-emerald-500 to-teal-500",
        accent: "text-emerald-600"
      }
    ];
    return themes[index % themes.length];
  };

  const themeColors = getThemeColors();

  return (
    <Card className={cn(
      "w-full max-w-4xl mx-auto shadow-xl backdrop-blur-sm transition-all duration-500 hover:shadow-2xl",
      themeColors.card,
      "animate-fadeIn"
    )} style={{ animationDelay: `${index * 300}ms` }}>
      <CardHeader className={cn(
        "text-white relative overflow-hidden",
        themeColors.header
      )}>
        <div className="absolute inset-0 bg-black/10"></div>
        <CardTitle className={cn(
          "relative z-10 flex items-center space-x-3 text-xl font-bold",
          useTaylorSwiftThemes ? "text-white" : "text-white"
        )}>
          {getThemeIcon()}
          <span>
            {chapter.isStreaming && !chapter.title ? (
              <span className="flex items-center space-x-2">
                <span>Chapter {index + 1}</span>
                <div className="animate-pulse w-2 h-2 bg-white rounded-full"></div>
              </span>
            ) : (
              chapter.title || `Chapter ${index + 1}`
            )}
          </span>
          {showStreamingText && !chapter.isStreaming && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFullContent(!showFullContent)}
              className="ml-auto text-white/80 hover:text-white hover:bg-white/20"
            >
              {showFullContent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              <span className="ml-1 text-xs">
                {showFullContent ? "Hide" : "Show"} Full
              </span>
            </Button>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Chapter Content */}
        <div className="prose prose-lg max-w-none">
          {chapter.isStreaming ? (
            // Show streaming content as it comes in
            <div className="space-y-4 leading-relaxed text-gray-800">
              <div className="flex items-center space-x-2 mb-4">
                <div className="animate-pulse w-2 h-2 bg-purple-500 rounded-full"></div>
                <span className="text-sm text-purple-600 font-medium">Writing chapter...</span>
              </div>
              {(chapter.streamingContent || '').split('\n\n').map((paragraph, pIndex) => (
                <p
                  key={pIndex}
                  className={cn(
                    "transition-all duration-300",
                    paragraph.startsWith('"') && "text-blue-600 italic font-medium"
                  )}
                >
                  {paragraph}
                </p>
              ))}
              {/* Streaming cursor */}
              <span className="inline-block w-2 h-5 bg-purple-500 animate-pulse ml-1"></span>
            </div>
          ) : showStreamingText && !showFullContent ? (
            <StreamingText
              text={chapter.content}
              speed={25}
              className="space-y-4 leading-relaxed text-gray-800"
              onComplete={() => setStreamingComplete(true)}
              highlightDialogue={true}
              useTaylorSwiftThemes={useTaylorSwiftThemes}
            />
          ) : (
            <div className="space-y-4 leading-relaxed text-gray-800">
              {chapter.content.split('\n\n').map((paragraph, pIndex) => (
                <p
                  key={pIndex}
                  className={cn(
                    "transition-all duration-300",
                    paragraph.startsWith('"') && "text-blue-600 italic font-medium"
                  )}
                  style={{
                    animationDelay: `${pIndex * 100}ms`,
                    animation: showFullContent ? "fadeIn 0.5s ease-out forwards" : undefined
                  }}
                >
                  {paragraph.startsWith('"') ? (
                    <span className="relative">
                      <span className="absolute -left-2 text-2xl text-blue-400 opacity-50">"</span>
                      {paragraph.slice(1, -1)}
                      <span className="absolute -right-2 text-2xl text-blue-400 opacity-50">"</span>
                    </span>
                  ) : (
                    paragraph
                  )}
                </p>
              ))}
            </div>
          )}
        </div>

        {/* Chapter Image */}
        <div className="mt-8">
          {chapter.imageUrl ? (
            <div className="relative group">
              <img
                src={chapter.imageUrl}
                alt={`Illustration for ${chapter.title}`}
                className="w-full h-auto rounded-lg shadow-lg transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
          ) : imageGenerationStatus === 'generating' ? (
            <div className="relative w-full">
              <ImageSkeleton
                aspectRatio="video"
                useTaylorSwiftThemes={useTaylorSwiftThemes}
                showLabel={true}
                className="w-full"
              />
              <div className="absolute inset-0 bg-black/20 rounded-lg flex items-center justify-center">
                <div className="bg-white/90 rounded-lg p-4 text-center">
                  <div className="text-sm font-medium text-gray-700 mb-2">
                    Generating illustration...
                  </div>
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${imageGenerationProgress}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {imageGenerationProgress}% complete
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <ImageSkeleton
              aspectRatio="video"
              useTaylorSwiftThemes={useTaylorSwiftThemes}
              showLabel={isGeneratingImages}
              className="w-full"
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
};