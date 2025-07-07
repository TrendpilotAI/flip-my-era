import { useState, useEffect } from "react";
import { cn } from '@/core/lib/utils';

interface StreamingTextProps {
  text: string;
  speed?: number; // milliseconds per character
  onComplete?: () => void;
  className?: string;
  startDelay?: number; // delay before starting
  wordByWord?: boolean; // stream word by word instead of character by character
}

export const StreamingText = ({ 
  text, 
  speed = 20, 
  onComplete, 
  className,
  startDelay = 0,
  wordByWord = false
}: StreamingTextProps) => {
  const [displayedText, setDisplayedText] = useState("");
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (!text) return;

    let timeoutId: NodeJS.Timeout;
    let currentIndex = 0;
    
    const startStreaming = () => {
      if (wordByWord) {
        const words = text.split(' ');
        
        const streamWord = () => {
          if (currentIndex < words.length) {
            setDisplayedText(words.slice(0, currentIndex + 1).join(' '));
            currentIndex++;
            timeoutId = setTimeout(streamWord, speed * 3); // Slower for word-by-word
          } else {
            setIsComplete(true);
            onComplete?.();
          }
        };
        
        streamWord();
      } else {
        const streamCharacter = () => {
          if (currentIndex < text.length) {
            setDisplayedText(text.slice(0, currentIndex + 1));
            currentIndex++;
            timeoutId = setTimeout(streamCharacter, speed);
          } else {
            setIsComplete(true);
            onComplete?.();
          }
        };
        
        streamCharacter();
      }
    };

    // Start streaming after delay
    if (startDelay > 0) {
      timeoutId = setTimeout(startStreaming, startDelay);
    } else {
      startStreaming();
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [text, speed, onComplete, startDelay, wordByWord]);

  return (
    <div className={cn("relative", className)}>
      <span className="whitespace-pre-wrap">
        {displayedText}
        {!isComplete && (
          <span className="animate-pulse text-purple-500">|</span>
        )}
      </span>
    </div>
  );
};