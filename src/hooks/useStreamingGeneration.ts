import { useState, useCallback, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { TaylorSwiftTheme, StoryFormat } from "@/utils/storyPrompts";

interface Chapter {
  title: string;
  content: string;
  imageUrl?: string;
  id?: string;
}

interface StreamingState {
  isGenerating: boolean;
  currentChapter: number;
  totalChapters: number;
  progress: number;
  message: string;
  estimatedTimeRemaining?: number;
  isComplete: boolean;
  chapters: Chapter[];
}

interface StreamingGenerationOptions {
  originalStory: string;
  useTaylorSwiftThemes: boolean;
  selectedTheme?: TaylorSwiftTheme;
  selectedFormat?: StoryFormat;
  numChapters?: number;
  onChapterComplete?: (chapter: Chapter) => void;
  onComplete?: (chapters: Chapter[]) => void;
  onError?: (error: string) => void;
}

export const useStreamingGeneration = () => {
  const { toast } = useToast();
  const eventSourceRef = useRef<EventSource | null>(null);
  
  const [state, setState] = useState<StreamingState>({
    isGenerating: false,
    currentChapter: 0,
    totalChapters: 0,
    progress: 0,
    message: "",
    isComplete: false,
    chapters: []
  });

  const startGeneration = useCallback(async (options: StreamingGenerationOptions) => {
    const {
      originalStory,
      useTaylorSwiftThemes,
      selectedTheme,
      selectedFormat,
      numChapters,
      onChapterComplete,
      onComplete,
      onError
    } = options;

    // Reset state
    setState({
      isGenerating: true,
      currentChapter: 0,
      totalChapters: numChapters || 3,
      progress: 0,
      message: "Initializing...",
      isComplete: false,
      chapters: []
    });

    try {
      // Create EventSource for streaming
      const eventSource = new EventSource('/api/stream-chapters');
      eventSourceRef.current = eventSource;

      // Send generation request
      const response = await fetch('/api/stream-chapters', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          originalStory,
          useTaylorSwiftThemes,
          selectedTheme,
          selectedFormat,
          numChapters
        })
      });

      if (!response.ok) {
        throw new Error('Failed to start generation');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        const chapters: Chapter[] = [];
        
        const readStream = async () => {
          try {
            while (true) {
              const { done, value } = await reader.read();
              
              if (done) break;
              
              const chunk = decoder.decode(value);
              const lines = chunk.split('\n');
              
              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  try {
                    const data = JSON.parse(line.slice(6));
                    
                    switch (data.type) {
                      case 'progress':
                        setState(prev => ({
                          ...prev,
                          currentChapter: data.currentChapter || 0,
                          totalChapters: data.totalChapters || prev.totalChapters,
                          progress: data.progress || 0,
                          message: data.message || "",
                          estimatedTimeRemaining: data.estimatedTimeRemaining
                        }));
                        break;
                        
                      case 'chapter': {
                        const newChapter: Chapter = {
                          title: data.chapterTitle,
                          content: data.chapterContent,
                          id: `chapter-${data.currentChapter}`
                        };
                        
                        chapters.push(newChapter);
                        
                        setState(prev => ({
                          ...prev,
                          chapters: [...chapters],
                          currentChapter: data.currentChapter,
                          progress: data.progress || 0
                        }));
                        
                        onChapterComplete?.(newChapter);
                        
                        toast({
                          title: `Chapter ${data.currentChapter} Complete`,
                          description: `"${data.chapterTitle}" has been generated`,
                        });
                        break;
                      }
                        
                      case 'complete':
                        setState(prev => ({
                          ...prev,
                          isGenerating: false,
                          isComplete: true,
                          progress: 100,
                          message: "Generation complete!"
                        }));
                        
                        onComplete?.(chapters);
                        
                        toast({
                          title: "Story Generation Complete! ✨",
                          description: `All ${chapters.length} chapters have been generated successfully.`,
                        });
                        break;
                        
                      case 'error':
                        throw new Error(data.message || 'Generation failed');
                    }
                  } catch (parseError) {
                    console.error('Error parsing stream data:', parseError);
                  }
                }
              }
            }
          } catch (streamError) {
            console.error('Stream reading error:', streamError);
            throw streamError;
          }
        };

        await readStream();
      }

    } catch (error) {
      console.error('Streaming generation error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      setState(prev => ({
        ...prev,
        isGenerating: false,
        isComplete: false,
        message: `Error: ${errorMessage}`
      }));
      
      onError?.(errorMessage);
      
      toast({
        title: "Generation Failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  }, [toast]);

  const stopGeneration = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    
    setState(prev => ({
      ...prev,
      isGenerating: false,
      message: "Generation stopped"
    }));
    
    toast({
      title: "Generation Stopped",
      description: "Chapter generation has been cancelled.",
      variant: "destructive",
    });
  }, [toast]);

  const resetGeneration = useCallback(() => {
    setState({
      isGenerating: false,
      currentChapter: 0,
      totalChapters: 0,
      progress: 0,
      message: "",
      isComplete: false,
      chapters: []
    });
  }, []);

  return {
    ...state,
    startGeneration,
    stopGeneration,
    resetGeneration
  };
};