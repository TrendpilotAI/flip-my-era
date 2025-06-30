import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  Clock,
  BookOpen,
  Heart,
  Star,
  Music,
  Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ReadingProgressProps {
  currentChapter: number;
  totalChapters: number;
  progress: number;
  readingTime: number;
  useTaylorSwiftThemes?: boolean;
  darkMode?: boolean;
}

export const ReadingProgress = ({
  currentChapter,
  totalChapters,
  progress,
  readingTime,
  useTaylorSwiftThemes = true,
  darkMode = false
}: ReadingProgressProps) => {
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const getProgressIcon = () => {
    if (!useTaylorSwiftThemes) return <BookOpen className="h-4 w-4 text-blue-500" />;
    
    const icons = [
      <Heart className="h-4 w-4 text-pink-500" />,
      <Star className="h-4 w-4 text-yellow-500" />,
      <Music className="h-4 w-4 text-purple-500" />,
      <Sparkles className="h-4 w-4 text-blue-500" />
    ];
    return icons[currentChapter % icons.length];
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          {getProgressIcon()}
          <span className={cn(
            "text-sm font-medium",
            darkMode ? "text-gray-200" : "text-gray-700"
          )}>
            Chapter {currentChapter} of {totalChapters}
          </span>
        </div>
        
        <div className="flex items-center space-x-4 text-sm">
          <div className="flex items-center space-x-1">
            <Clock className="h-3 w-3 text-gray-400" />
            <span className={cn(
              darkMode ? "text-gray-300" : "text-gray-600"
            )}>
              {formatTime(readingTime)}
            </span>
          </div>
          <span className={cn(
            "font-medium",
            useTaylorSwiftThemes ? "text-purple-600 dark:text-purple-400" : "text-blue-600 dark:text-blue-400"
          )}>
            {Math.round(progress)}%
          </span>
        </div>
      </div>
      
      <Progress 
        value={progress} 
        className={cn(
          "h-2 transition-all duration-300",
          useTaylorSwiftThemes && "data-[state=complete]:bg-gradient-to-r from-purple-500 to-pink-500"
        )}
      />
      
      {/* Floating sparkles for Taylor Swift theme */}
      {useTaylorSwiftThemes && progress > 0 && (
        <div className="relative mt-1">
          <div className="absolute left-0 -top-1 animate-pulse delay-0">
            <Sparkles className="h-2 w-2 text-purple-400 opacity-60" />
          </div>
          <div className="absolute left-1/4 -top-2 animate-pulse delay-300">
            <Star className="h-2 w-2 text-yellow-400 opacity-60" />
          </div>
          <div className="absolute left-2/3 -top-1 animate-pulse delay-700">
            <Heart className="h-2 w-2 text-pink-400 opacity-60" />
          </div>
        </div>
      )}
    </div>
  );
};