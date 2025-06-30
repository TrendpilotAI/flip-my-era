import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  X,
  BookOpen,
  ChevronRight,
  Clock,
  Heart,
  Star,
  Music,
  Sparkles,
  List
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Chapter {
  title: string;
  content: string;
  imageUrl?: string;
  id?: string;
}

interface BookNavigationProps {
  chapters: Chapter[];
  currentChapter: number;
  onChapterSelect: (chapterIndex: number) => void;
  onClose: () => void;
  useTaylorSwiftThemes?: boolean;
  darkMode?: boolean;
}

export const BookNavigation = ({
  chapters,
  currentChapter,
  onChapterSelect,
  onClose,
  useTaylorSwiftThemes = true,
  darkMode = false
}: BookNavigationProps) => {
  const [hoveredChapter, setHoveredChapter] = useState<number | null>(null);

  const estimateReadingTime = (content: string) => {
    const wordsPerMinute = 200;
    const words = content.split(' ').length;
    return Math.ceil(words / wordsPerMinute);
  };

  const getChapterIcon = (index: number) => {
    if (!useTaylorSwiftThemes) return <BookOpen className="h-4 w-4 text-blue-500" />;
    
    const icons = [
      <Heart className="h-4 w-4 text-pink-500" />,
      <Star className="h-4 w-4 text-yellow-500" />,
      <Music className="h-4 w-4 text-purple-500" />,
      <Sparkles className="h-4 w-4 text-blue-500" />
    ];
    return icons[index % icons.length];
  };

  const getProgressColor = (index: number) => {
    if (index < currentChapter) {
      return useTaylorSwiftThemes ? "bg-purple-500" : "bg-blue-500";
    } else if (index === currentChapter) {
      return useTaylorSwiftThemes ? "bg-pink-500" : "bg-blue-600";
    } else {
      return darkMode ? "bg-gray-600" : "bg-gray-300";
    }
  };

  const totalReadingTime = chapters.reduce((total, chapter) => 
    total + estimateReadingTime(chapter.content), 0
  );

  return (
    <Card className={cn(
      "h-full border-0 rounded-none transition-all duration-300",
      darkMode 
        ? "bg-black/40 backdrop-blur-md border-r border-white/10" 
        : "bg-white/90 backdrop-blur-md border-r border-gray-200"
    )}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className={cn(
            "flex items-center space-x-2 text-lg",
            darkMode ? "text-white" : "text-gray-900",
            useTaylorSwiftThemes && "text-purple-700 dark:text-purple-300"
          )}>
            <List className="h-5 w-5" />
            <span>Table of Contents</span>
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className={cn(
              "transition-colors",
              useTaylorSwiftThemes ? "text-purple-600 hover:text-purple-700" : "text-blue-600 hover:text-blue-700"
            )}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Reading Progress Summary */}
        <div className={cn(
          "p-3 rounded-lg mt-4",
          darkMode ? "bg-white/10" : "bg-gray-100"
        )}>
          <div className="flex items-center justify-between text-sm">
            <span className={cn(darkMode ? "text-gray-300" : "text-gray-600")}>
              Progress
            </span>
            <span className={cn(
              "font-medium",
              useTaylorSwiftThemes ? "text-purple-600 dark:text-purple-400" : "text-blue-600 dark:text-blue-400"
            )}>
              {currentChapter + 1} of {chapters.length}
            </span>
          </div>
          <div className="mt-2 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className={cn(
                "h-2 rounded-full transition-all duration-300",
                useTaylorSwiftThemes ? "bg-gradient-to-r from-purple-500 to-pink-500" : "bg-blue-500"
              )}
              style={{ width: `${((currentChapter + 1) / chapters.length) * 100}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-2 text-xs">
            <div className="flex items-center space-x-1">
              <Clock className="h-3 w-3" />
              <span className={cn(darkMode ? "text-gray-400" : "text-gray-500")}>
                ~{totalReadingTime} min total
              </span>
            </div>
            <span className={cn(darkMode ? "text-gray-400" : "text-gray-500")}>
              {Math.round(((currentChapter + 1) / chapters.length) * 100)}% complete
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-4 pb-4">
        <ScrollArea className="h-[calc(100vh-200px)]">
          <div className="space-y-2">
            {chapters.map((chapter, index) => (
              <div
                key={chapter.id || index}
                className={cn(
                  "relative p-3 rounded-lg cursor-pointer transition-all duration-200",
                  index === currentChapter && (
                    darkMode 
                      ? "bg-white/20 border border-white/30" 
                      : "bg-blue-50 border border-blue-200"
                  ),
                  index !== currentChapter && (
                    darkMode 
                      ? "hover:bg-white/10" 
                      : "hover:bg-gray-50"
                  )
                )}
                onClick={() => onChapterSelect(index)}
                onMouseEnter={() => setHoveredChapter(index)}
                onMouseLeave={() => setHoveredChapter(null)}
              >
                {/* Progress indicator */}
                <div className="absolute left-0 top-0 bottom-0 w-1 rounded-r">
                  <div 
                    className={cn(
                      "w-full h-full rounded-r transition-all duration-300",
                      getProgressColor(index)
                    )}
                  />
                </div>

                <div className="ml-3 flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-1">
                    {getChapterIcon(index)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className={cn(
                        "text-sm font-medium truncate",
                        index === currentChapter 
                          ? (useTaylorSwiftThemes ? "text-purple-700 dark:text-purple-300" : "text-blue-700 dark:text-blue-300")
                          : (darkMode ? "text-white" : "text-gray-900")
                      )}>
                        {chapter.title}
                      </h3>
                      {(hoveredChapter === index || index === currentChapter) && (
                        <ChevronRight className="h-4 w-4 flex-shrink-0 ml-2" />
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between mt-1">
                      <span className={cn(
                        "text-xs",
                        darkMode ? "text-gray-400" : "text-gray-500"
                      )}>
                        Chapter {index + 1}
                      </span>
                      <div className="flex items-center space-x-1 text-xs">
                        <Clock className="h-3 w-3" />
                        <span className={cn(
                          darkMode ? "text-gray-400" : "text-gray-500"
                        )}>
                          {estimateReadingTime(chapter.content)}m
                        </span>
                      </div>
                    </div>

                    {/* Chapter preview */}
                    {hoveredChapter === index && (
                      <p className={cn(
                        "text-xs mt-2 line-clamp-2 transition-all duration-200",
                        darkMode ? "text-gray-300" : "text-gray-600"
                      )}>
                        {chapter.content.substring(0, 100)}...
                      </p>
                    )}

                    {/* Status indicators */}
                    <div className="flex items-center space-x-2 mt-2">
                      {index < currentChapter && (
                        <div className="flex items-center space-x-1">
                          <div className="w-2 h-2 bg-green-500 rounded-full" />
                          <span className="text-xs text-green-600 dark:text-green-400">
                            Read
                          </span>
                        </div>
                      )}
                      {index === currentChapter && (
                        <div className="flex items-center space-x-1">
                          <div className={cn(
                            "w-2 h-2 rounded-full animate-pulse",
                            useTaylorSwiftThemes ? "bg-pink-500" : "bg-blue-500"
                          )} />
                          <span className={cn(
                            "text-xs",
                            useTaylorSwiftThemes ? "text-pink-600 dark:text-pink-400" : "text-blue-600 dark:text-blue-400"
                          )}>
                            Current
                          </span>
                        </div>
                      )}
                      {chapter.imageUrl && (
                        <div className="flex items-center space-x-1">
                          <div className="w-2 h-2 bg-purple-500 rounded-full" />
                          <span className="text-xs text-purple-600 dark:text-purple-400">
                            Illustrated
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};