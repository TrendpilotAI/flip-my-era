import { useState, useEffect } from "react";
import { Card, CardContent } from '@/modules/shared/components/ui/card';
import { Button } from '@/modules/shared/components/ui/button';
import { 
  Sparkles, 
  Heart, 
  Star, 
  Music,
  Download,
  Share,
  Trophy
} from "lucide-react";
import { cn } from '@/core/lib/utils';

interface CompletionCelebrationProps {
  isVisible: boolean;
  useTaylorSwiftThemes?: boolean;
  chaptersGenerated: number;
  onDownload?: () => void;
  onShare?: () => void;
  onClose?: () => void;
}

export const CompletionCelebration = ({
  isVisible,
  useTaylorSwiftThemes = true,
  chaptersGenerated,
  onDownload,
  onShare,
  onClose
}: CompletionCelebrationProps) => {
  const [confetti, setConfetti] = useState<Array<{ id: number; x: number; delay: number; icon: React.ReactNode }>>([]);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    if (isVisible) {
      // Create confetti elements
      const confettiElements = Array.from({ length: 20 }, (_, i) => {
        const icons = useTaylorSwiftThemes 
          ? [<Heart key={i} />, <Star key={i} />, <Music key={i} />, <Sparkles key={i} />]
          : [<Star key={i} />, <Sparkles key={i} />];
        
        return {
          id: i,
          x: Math.random() * 100,
          delay: Math.random() * 2,
          icon: icons[Math.floor(Math.random() * icons.length)]
        };
      });
      
      setConfetti(confettiElements);
      
      // Show content after brief delay
      setTimeout(() => setShowContent(true), 500);
      
      // Play celebration sound (if browser supports it)
      try {
        const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const audioContext = new AudioContextClass();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
        oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1); // E5
        oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.2); // G5
        
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
      } catch (error) {
        console.log('Audio not supported or blocked:', error);
      }
    }
  }, [isVisible, useTaylorSwiftThemes]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      {/* Confetti */}
      {confetti.map((piece) => (
        <div
          key={piece.id}
          className="fixed text-2xl animate-confetti pointer-events-none"
          style={{
            left: `${piece.x}%`,
            top: '100%',
            animationDelay: `${piece.delay}s`,
            color: useTaylorSwiftThemes ? 
              ['#f59e0b', '#ec4899', '#8b5cf6', '#06d6a0'][piece.id % 4] : 
              '#8b5cf6'
          }}
        >
          {piece.icon}
        </div>
      ))}

      {/* Celebration Card */}
      <Card 
        className={cn(
          "relative overflow-hidden max-w-lg w-full mx-4 border-0 shadow-2xl transition-all duration-700",
          useTaylorSwiftThemes 
            ? "bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50" 
            : "bg-gradient-to-br from-blue-50 to-white",
          showContent ? "scale-100 opacity-100" : "scale-95 opacity-0"
        )}
      >
        {/* Animated background */}
        <div className={cn(
          "absolute inset-0 opacity-20",
          useTaylorSwiftThemes ? "taylor-gradient-bg" : "bg-gradient-to-r from-blue-400 to-purple-400"
        )} />
        
        <CardContent className="relative p-8 text-center space-y-6">
          {/* Trophy and title */}
          <div className="space-y-4">
            <div className={cn(
              "inline-flex items-center justify-center w-16 h-16 rounded-full",
              useTaylorSwiftThemes 
                ? "bg-gradient-to-r from-purple-400 to-pink-400" 
                : "bg-gradient-to-r from-blue-400 to-purple-400"
            )}>
              <Trophy className="h-8 w-8 text-white" />
            </div>
            
            <div className="space-y-2">
              <h2 className={cn(
                "text-3xl font-bold",
                useTaylorSwiftThemes ? "text-purple-800" : "text-blue-800"
              )}>
                Story Complete! ✨
              </h2>
              <p className="text-gray-600">
                Your {chaptersGenerated}-chapter {useTaylorSwiftThemes ? 'Taylor Swift-inspired' : ''} story 
                has been generated successfully!
              </p>
            </div>
          </div>

          {/* Success stats */}
          <div className={cn(
            "p-4 rounded-lg",
            useTaylorSwiftThemes 
              ? "bg-gradient-to-r from-purple-100 to-pink-100" 
              : "bg-blue-100"
          )}>
            <div className="flex items-center justify-center space-x-6 text-sm">
              <div className="text-center">
                <div className={cn(
                  "text-2xl font-bold",
                  useTaylorSwiftThemes ? "text-purple-600" : "text-blue-600"
                )}>
                  {chaptersGenerated}
                </div>
                <div className="text-gray-600">Chapters</div>
              </div>
              <div className="text-center">
                <div className={cn(
                  "text-2xl font-bold",
                  useTaylorSwiftThemes ? "text-pink-600" : "text-blue-600"
                )}>
                  100%
                </div>
                <div className="text-gray-600">Complete</div>
              </div>
              <div className="text-center">
                <div className={cn(
                  "text-2xl font-bold",
                  useTaylorSwiftThemes ? "text-blue-600" : "text-purple-600"
                )}>
                  ⭐
                </div>
                <div className="text-gray-600">Ready</div>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex space-x-3">
            <Button
              onClick={onDownload}
              className={cn(
                "flex-1",
                useTaylorSwiftThemes 
                  ? "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600" 
                  : "bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
              )}
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button
              onClick={onShare}
              variant="outline"
              className="flex-1"
            >
              <Share className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>

          {/* Close button */}
          <Button
            onClick={onClose}
            variant="ghost"
            className="text-gray-500 hover:text-gray-700"
          >
            Continue Editing
          </Button>

          {/* Floating sparkles */}
          {useTaylorSwiftThemes && (
            <div className="absolute inset-0 pointer-events-none">
              {Array.from({ length: 8 }, (_, i) => (
                <div
                  key={i}
                  className="absolute animate-float"
                  style={{
                    left: `${10 + (i * 12)}%`,
                    top: `${20 + ((i % 3) * 20)}%`,
                    animationDelay: `${i * 0.5}s`
                  }}
                >
                  <Sparkles className="h-3 w-3 text-purple-300 animate-sparkle" />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};