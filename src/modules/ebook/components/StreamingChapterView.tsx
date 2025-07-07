import { useState, useEffect } from "react";
import { StreamingText } from '@/modules/story/components/StreamingText';
import { Card, CardContent, CardHeader, CardTitle } from '@/modules/shared/components/ui/card';
import { Button } from '@/modules/shared/components/ui/button';
import { 
  Sparkles, 
  Heart, 
  Star, 
  Music,
  Eye,
  EyeOff,
  ImageIcon,
  Loader2
} from "lucide-react";
import { cn } from '@/core/lib/utils';

interface Chapter {
  title: string;
  content: string;
  imageUrl?: string;
  id?: string;
}

interface StreamingChapterViewProps {
  chapter: Chapter;
  index: number;
  isGeneratingImages?: boolean;
  useTaylorSwiftThemes?: boolean;
  showStreamingText?: boolean;
  onStreamingComplete?: () => void;
}

export const StreamingChapterView = ({ 
  chapter, 
  index, 
  isGeneratingImages = false,
  useTaylorSwiftThemes = true,
  showStreamingText = true,
  onStreamingComplete
}: StreamingChapterViewProps) => {
  const [showFullContent, setShowFullContent] = useState(!showStreamingText);
  const [streamingComplete, setStreamingComplete] = useState(!showStreamingText);
  const [sparkles, setSparkles] = useState<Array<{ id: number; x: number; y: number; delay: number }>>([]);

  // Generate sparkles for Taylor Swift theme
  useEffect(() => {
    if (useTaylorSwiftThemes && streamingComplete) {
      const newSparkles = Array.from({ length: 4 }, (_, i) => ({
        id: Date.now() + i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        delay: Math.random() * 2
      }));
      setSparkles(newSparkles);
    }
  }, [streamingComplete, useTaylorSwiftThemes]);

  const handleStreamingComplete = () => {
    setStreamingComplete(true);
    onStreamingComplete?.();
  };

  const getThemeIcon = () => {
    if (!useTaylorSwiftThemes) return <Star className="h-5 w-5 text-blue-500" />;
    
    const icons = [
      <Heart className="h-5 w-5 text-pink-500" />,
      <Star className="h-5 w-5 text-yellow-500" />,
      <Music className="h-5 w-5 text-purple-500" />,
      <Sparkles className="h-5 w-5 text-blue-500" />
    ];
    return icons[index % icons.length];
  };

  const getThemeGradient = () => {
    if (!useTaylorSwiftThemes) return "from-blue-50 to-gray-50";
    
    const gradients = [
      "from-pink-50 via-purple-50 to-blue-50",
      "from-yellow-50 via-orange-50 to-pink-50",
      "from-purple-50 via-blue-50 to-indigo-50",
      "from-blue-50 via-cyan-50 to-teal-50"
    ];
    return gradients[index % gradients.length];
  };

  return (
    <Card 
      className={cn(
        "relative overflow-hidden transition-all duration-700 ease-out",
        `bg-gradient-to-br ${getThemeGradient()}`,
        useTaylorSwiftThemes ? "border-purple-200" : "border-blue-200",
        streamingComplete && "shadow-lg"
      )}
      style={{ 
        animationDelay: `${index * 300}ms`,
        animation: "slideInFromBottom 0.8s ease-out forwards"
      }}
    >
      {/* Floating sparkles for Taylor Swift theme */}
      {useTaylorSwiftThemes && streamingComplete && sparkles.map((sparkle) => (
        <div
          key={sparkle.id}
          className="absolute pointer-events-none z-10"
          style={{
            left: `${sparkle.x}%`,
            top: `${sparkle.y}%`,
            animationDelay: `${sparkle.delay}s`
          }}
        >
          <Sparkles 
            className="h-2 w-2 text-purple-300 animate-pulse opacity-40" 
            style={{
              animation: `pulse 2s infinite ${sparkle.delay}s, float 4s ease-in-out infinite ${sparkle.delay}s`
            }}
          />
        </div>
      ))}

      <CardHeader className="pb-4">
        <CardTitle className={cn(
          "flex items-center space-x-3 text-xl font-bold transition-colors duration-500",
          useTaylorSwiftThemes ? "text-purple-800" : "text-blue-800"
        )}>
          {getThemeIcon()}
          <span>{chapter.title}</span>
          {showStreamingText && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFullContent(!showFullContent)}
              className="ml-auto"
            >
              {showFullContent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Chapter Content */}
        <div className="prose prose-lg max-w-none">
          {showStreamingText && !showFullContent ? (
            <StreamingText
              text={chapter.content}
              speed={25}
              wordByWord={false}
              onComplete={handleStreamingComplete}
              className={cn(
                "leading-relaxed text-gray-800",
                useTaylorSwiftThemes && "prose-purple"
              )}
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
                  {paragraph}
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
                className="w-full h-auto rounded-lg shadow-lg transition-transform duration-300 group-hover:scale-[1.02]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
          ) : (
            <div className={cn(
              "w-full h-48 rounded-lg flex items-center justify-center border-2 border-dashed transition-all duration-300",
              isGeneratingImages 
                ? useTaylorSwiftThemes 
                  ? "bg-purple-50 border-purple-200" 
                  : "bg-blue-50 border-blue-200"
                : "bg-gray-100 border-gray-300"
            )}>
              {isGeneratingImages ? (
                <div className="flex flex-col items-center space-y-2">
                  <Loader2 className={cn(
                    "h-8 w-8 animate-spin",
                    useTaylorSwiftThemes ? "text-purple-500" : "text-blue-500"
                  )} />
                  <span className={cn(
                    "text-sm font-medium",
                    useTaylorSwiftThemes ? "text-purple-600" : "text-blue-600"
                  )}>
                    Creating magical illustration...
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center space-y-2 text-gray-400">
                  <ImageIcon className="h-8 w-8" />
                  <span className="text-sm">Illustration will appear here</span>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>

      {/* Completion glow effect */}
      {streamingComplete && (
        <div className="absolute inset-0 pointer-events-none">
          <div className={cn(
            "absolute inset-0 rounded-lg",
            useTaylorSwiftThemes 
              ? "bg-gradient-to-r from-purple-400/10 via-pink-400/10 to-blue-400/10" 
              : "bg-gradient-to-r from-blue-400/10 via-cyan-400/10 to-teal-400/10",
            "animate-pulse"
          )} />
        </div>
      )}
    </Card>
  );
};