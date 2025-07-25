import { useState, useEffect } from "react";
import { Progress } from '@/modules/shared/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/modules/shared/components/ui/card';
import { 
  Sparkles, 
  Heart, 
  Star, 
  Music,
  BookOpen,
  CheckCircle,
  Loader2
} from "lucide-react";
import { cn } from '@/core/lib/utils';

interface StreamingProgressProps {
  currentChapter: number;
  totalChapters: number;
  progress: number;
  message: string;
  chapterTitle?: string;
  estimatedTimeRemaining?: number;
  isComplete?: boolean;
  useTaylorSwiftThemes?: boolean;
}

export const StreamingProgress = ({
  currentChapter,
  totalChapters,
  progress,
  message,
  chapterTitle,
  estimatedTimeRemaining,
  isComplete,
  useTaylorSwiftThemes = true
}: StreamingProgressProps) => {
  const [sparkles, setSparkles] = useState<Array<{ id: number; x: number; y: number; delay: number }>>([]);

  // Generate floating sparkles for Taylor Swift theme
  useEffect(() => {
    if (useTaylorSwiftThemes && progress > 0) {
      const newSparkles = Array.from({ length: 6 }, (_, i) => ({
        id: Date.now() + i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        delay: Math.random() * 2
      }));
      setSparkles(newSparkles);
    }
  }, [currentChapter, useTaylorSwiftThemes]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getProgressIcon = () => {
    if (isComplete) return <CheckCircle className="h-5 w-5 text-green-500" />;
    if (progress > 0) return <Loader2 className="h-5 w-5 text-purple-500 animate-spin" />;
    return <BookOpen className="h-5 w-5 text-blue-500" />;
  };

  const getThemeIcon = () => {
    if (useTaylorSwiftThemes) {
      if (currentChapter <= totalChapters / 4) return <Star className="h-4 w-4 text-yellow-400" />;
      if (currentChapter <= totalChapters / 2) return <Heart className="h-4 w-4 text-pink-400" />;
      if (currentChapter <= (totalChapters * 3) / 4) return <Music className="h-4 w-4 text-purple-400" />;
      return <Sparkles className="h-4 w-4 text-blue-400" />;
    }
    return <BookOpen className="h-4 w-4 text-blue-400" />;
  };

  return (
    <Card className={cn(
      "relative overflow-hidden transition-all duration-500",
      useTaylorSwiftThemes 
        ? "bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 border-purple-200" 
        : "bg-white border-gray-200",
      isComplete && "ring-2 ring-green-400 ring-opacity-50"
    )}>
      {/* Floating sparkles for Taylor Swift theme */}
      {useTaylorSwiftThemes && sparkles.map((sparkle) => (
        <div
          key={sparkle.id}
          className="absolute pointer-events-none"
          style={{
            left: `${sparkle.x}%`,
            top: `${sparkle.y}%`,
            animationDelay: `${sparkle.delay}s`
          }}
        >
          <Sparkles 
            className="h-3 w-3 text-purple-300 animate-pulse opacity-60" 
            style={{
              animation: `pulse 2s infinite ${sparkle.delay}s, float 3s ease-in-out infinite ${sparkle.delay}s`
            }}
          />
        </div>
      ))}

      <CardHeader className="pb-3">
        <CardTitle className="flex items-center space-x-2 text-lg">
          {getProgressIcon()}
          <span>
            {isComplete 
              ? "Generation Complete! ✨" 
              : `Generating Chapter ${currentChapter} of ${totalChapters}`
            }
          </span>
          {getThemeIcon()}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress 
            value={progress} 
            className={cn(
              "h-3 transition-all duration-500",
              useTaylorSwiftThemes && "bg-gradient-to-r from-purple-100 to-pink-100"
            )}
          />
        </div>

        {/* Current Status */}
        <div className="flex items-center space-x-2 text-sm">
          <div className={cn(
            "flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium",
            isComplete 
              ? "bg-green-100 text-green-700" 
              : useTaylorSwiftThemes 
                ? "bg-purple-100 text-purple-700" 
                : "bg-blue-100 text-blue-700"
          )}>
            {getThemeIcon()}
            <span>{message}</span>
          </div>
        </div>

        {/* Chapter Title */}
        {chapterTitle && (
          <div className="p-3 bg-white/60 rounded-lg border border-purple-100">
            <p className="text-sm font-medium text-gray-700 mb-1">Current Chapter:</p>
            <p className={cn(
              "text-lg font-semibold",
              useTaylorSwiftThemes ? "text-purple-700" : "text-blue-700"
            )}>
              {chapterTitle}
            </p>
          </div>
        )}



        {/* Chapter Progress Indicators */}
        <div className="flex space-x-1 overflow-x-auto py-2">
          {Array.from({ length: totalChapters }, (_, i) => {
            const chapterNum = i + 1;
            const isCurrentOrComplete = chapterNum <= currentChapter;
            const isCurrent = chapterNum === currentChapter && !isComplete;
            
            return (
              <div
                key={chapterNum}
                className={cn(
                  "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium border-2 transition-all duration-300",
                  isCurrentOrComplete
                    ? useTaylorSwiftThemes
                      ? "bg-gradient-to-br from-purple-400 to-pink-400 text-white border-purple-300"
                      : "bg-blue-500 text-white border-blue-400"
                    : "bg-gray-100 text-gray-400 border-gray-200",
                  isCurrent && "ring-2 ring-purple-300 ring-opacity-50 animate-pulse"
                )}
              >
                {isCurrentOrComplete && chapterNum < currentChapter ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  chapterNum
                )}
              </div>
            );
          })}
        </div>
      </CardContent>

      {/* Completion celebration effect */}
      {isComplete && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-r from-green-400/20 via-blue-400/20 to-purple-400/20 animate-pulse" />
          {/* Celebration sparkles */}
          {Array.from({ length: 12 }, (_, i) => (
            <div
              key={i}
              className="absolute"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`
              }}
            >
              <Star className="h-2 w-2 text-yellow-400 animate-ping" />
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};