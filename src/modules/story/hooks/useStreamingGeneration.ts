import { useState, useCallback, useEffect } from "react";
import { useToast } from '@/modules/shared/hooks/use-toast';
import { useClerkAuth } from '@/modules/auth/contexts';
import { TaylorSwiftTheme, StoryFormat } from "@/modules/story/utils/storyPrompts";
import { extractImagePromptFromStream, ImagePrompt } from "@/modules/story/utils/imagePromptExtraction";
import { handleStreamingGenerationError, GenerationErrorContext, normalizeError } from '@/modules/shared/utils/errorHandlingUtils';

interface Chapter {
  title: string;
  content: string;
  streamingContent?: string;
  imageUrl?: string;
  id?: string;
  isStreaming?: boolean;
  imagePrompt?: ImagePrompt | null;
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
  imageGenerationStatus: Record<number, 'pending' | 'generating' | 'complete' | 'error'>;
  imageGenerationProgress: Record<number, number>;
}

interface StreamingGenerationOptions {
  originalStory: string;
  useTaylorSwiftThemes: boolean;
  selectedTheme?: TaylorSwiftTheme;
  selectedFormat?: StoryFormat;
  numChapters?: number;
  storyline?: {
    logline: string;
    threeActStructure: any;
    chapters: Array<{ number: number; title: string; summary: string; wordCountTarget: number }>;
    themes: string[];
    wordCountTotal: number;
  };
  onChapterComplete?: (chapter: Chapter) => void;
  onComplete?: (chapters: Chapter[]) => void;
  onError?: (error: string) => void;
  onImagePromptExtracted?: (prompt: ImagePrompt, chapterIndex: number) => void;
  onImageGenerationStart?: (chapterIndex: number) => void;
  onImageGenerationComplete?: (chapterIndex: number, imageUrl: string) => void;
  onImageGenerationError?: (chapterIndex: number, error: string) => void;
}

export const useStreamingGeneration = () => {
  const { toast } = useToast();
  const { getToken } = useClerkAuth();
  
  const [state, setState] = useState<StreamingState>({
    isGenerating: false,
    currentChapter: 0,
    totalChapters: 0,
    progress: 0,
    message: "",
    isComplete: false,
    chapters: [],
    imageGenerationStatus: {},
    imageGenerationProgress: {}
  });

  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [imageGenerationQueue, setImageGenerationQueue] = useState<Set<number>>(new Set());

  // Mock image generation function - this would be replaced with actual image generation API
  const generateImageForChapter = useCallback(async (chapterIndex: number, imagePrompt: ImagePrompt) => {
    try {
      // Check if aborted before starting
      if (abortController?.signal.aborted) {
        throw new Error('Image generation aborted');
      }

      // Update status to generating
      setState(prev => ({
        ...prev,
        imageGenerationStatus: {
          ...prev.imageGenerationStatus,
          [chapterIndex]: 'generating'
        },
        imageGenerationProgress: {
          ...prev.imageGenerationProgress,
          [chapterIndex]: 0
        }
      }));

      // Simulate image generation progress
      for (let progress = 0; progress <= 100; progress += 20) {
        // Check abort signal before each progress update
        if (abortController?.signal.aborted) {
          throw new Error('Image generation aborted');
        }
        
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate processing time
        
        // Check abort signal after waiting
        if (abortController?.signal.aborted) {
          throw new Error('Image generation aborted');
        }
        
        setState(prev => ({
          ...prev,
          imageGenerationProgress: {
            ...prev.imageGenerationProgress,
            [chapterIndex]: progress
          }
        }));
      }

      // Check abort signal before final operations
      if (abortController?.signal.aborted) {
        throw new Error('Image generation aborted');
      }

      // Simulate successful image generation
      const mockImageUrl = `https://via.placeholder.com/800x600/4F46E5/FFFFFF?text=Chapter+${chapterIndex + 1}+Image`;
      
      setState(prev => ({
        ...prev,
        chapters: prev.chapters.map((chapter, index) =>
          index === chapterIndex
            ? { ...chapter, imageUrl: mockImageUrl }
            : chapter
        ),
        imageGenerationStatus: {
          ...prev.imageGenerationStatus,
          [chapterIndex]: 'complete'
        }
      }));

      return mockImageUrl;
    } catch (error) {
      console.error(`Image generation failed for chapter ${chapterIndex}:`, error);
      
      setState(prev => ({
        ...prev,
        imageGenerationStatus: {
          ...prev.imageGenerationStatus,
          [chapterIndex]: 'error'
        }
      }));
      
      throw error;
    }
  }, [abortController]);

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
      chapters: [],
      imageGenerationStatus: {},
      imageGenerationProgress: {}
    });

    try {
      // Get Clerk token for authentication
      const clerkToken = await getToken();
      console.log('Clerk token retrieved:', clerkToken ? 'Token exists' : 'No token');
      
      // Prepare headers
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '',
      };
      
      if (clerkToken) {
        headers['Authorization'] = `Bearer ${clerkToken}`;
        console.log('Making request with authentication');
      } else {
        console.log('Making request without authentication (fallback)');
      }
      
      // Send generation request with proper authentication
      // Use production URL directly since Edge Functions are deployed
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const functionUrl = `${supabaseUrl}/functions/v1/stream-chapters`;
      
      console.log('Calling function URL:', functionUrl);
      
      // Create a new AbortController for this request
      const controller = new AbortController();
      setAbortController(controller);
      
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          originalStory,
          useTaylorSwiftThemes,
          selectedTheme,
          selectedFormat,
          numChapters,
          storyline: options.storyline
        }),
        signal: controller.signal
      });

      console.log('Response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Streaming response error:', response.status, errorText);
        
        // Provide more specific error messages based on status code
        let errorMessage = 'Failed to start generation';
        if (response.status === 401) {
          errorMessage = 'Authentication failed. Please sign in and try again.';
        } else if (response.status === 403) {
          errorMessage = 'Access denied. Please check your permissions.';
        } else if (response.status === 429) {
          errorMessage = 'Rate limit exceeded. Please wait a moment and try again.';
        } else if (response.status === 500) {
          errorMessage = 'Server error. Please try again later.';
        } else if (response.status >= 400 && response.status < 500) {
          errorMessage = 'Invalid request. Please check your settings and try again.';
        }
        
        throw new Error(`${errorMessage} (${response.status})`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        const chapters: Chapter[] = [];
        
        const readStream = async () => {
          let buffer = ''; // Buffer for incomplete lines
          
          try {
            while (true) {
              const { done, value } = await reader.read();
              
              if (done) break;
              
              const chunk = decoder.decode(value);
              buffer += chunk;
              
              // Split by newlines and process complete lines
              const lines = buffer.split('\n');
              buffer = lines.pop() || ''; // Keep the last incomplete line in buffer
              
              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  try {
                    // Clean the line before parsing
                    const cleanLine = line.slice(6).trim();
                    if (!cleanLine) return; // Skip empty lines
                    
                    const data = JSON.parse(cleanLine);
                    console.log('Received streaming data:', data);
                    
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
                        console.error('Streaming error received:', data.message);
                        throw new Error(data.message || 'Generation failed');
                    }
                  } catch (parseError) {
                    console.error('Error parsing stream data:', parseError);
                    console.error('Raw line:', line);
                    console.error('Line length:', line.length);
                    console.error('Line slice (6):', line.slice(6));
                    
                    // Try to extract more information about the problematic content
                    if (line.includes('chapterContent')) {
                      const contentMatch = line.match(/"chapterContent":"([^"]*)"/);
                      if (contentMatch) {
                        console.error('Problematic content preview:', contentMatch[1].substring(0, 100));
                      }
                    }
                    
                    // Don't throw here, just log and continue to avoid breaking the stream
                    // The backend should handle serialization issues and send proper error events
                    console.warn('Continuing stream despite parse error');
                  }
                }
              }
            }
            
            // Process any remaining buffer content
            if (buffer.trim()) {
              const line = buffer.trim();
              if (line.startsWith('data: ')) {
                try {
                  const cleanLine = line.slice(6).trim();
                  if (cleanLine) {
                    const data = JSON.parse(cleanLine);
                    console.log('Received final streaming data:', data);
                    
                    // Handle the final data based on its type
                    switch (data.type) {
                      case 'complete':
                        setState(prev => ({
                          ...prev,
                          isGenerating: false,
                          isComplete: true,
                          progress: 100,
                          message: "Generation complete!"
                        }));
                        onComplete?.(chapters);
                        break;
                      case 'error':
                        console.error('Final streaming error received:', data.message);
                        throw new Error(data.message || 'Generation failed');
                    }
                  }
                } catch (parseError) {
                  console.error('Error parsing final stream data:', parseError);
                  // Don't throw here either, just log the error
                  console.warn('Continuing despite final parse error');
                }
              }
            }
          } catch (streamError) {
            console.error('Stream reading error:', streamError);
            throw streamError;
          }
        };

        await readStream();
      } else {
        throw new Error('No response body available for streaming');
      }

    } catch (error) {
      // Check if the error is due to abort
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Generation aborted by user');
        setState(prev => ({
          ...prev,
          isGenerating: false,
          isComplete: false,
          message: 'Generation cancelled'
        }));
        return;
      }
      
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
  }, [toast, getToken]);

  const stopGeneration = useCallback(() => {
    // Abort the fetch request if it's in progress
    if (abortController) {
      abortController.abort();
      setAbortController(null);
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
  }, [abortController, toast]);

  const resetGeneration = useCallback(() => {
    // Abort any ongoing request when resetting
    if (abortController) {
      abortController.abort();
      setAbortController(null);
    }
    
    setState({
      isGenerating: false,
      currentChapter: 0,
      totalChapters: 0,
      progress: 0,
      message: "",
      isComplete: false,
      chapters: [],
      imageGenerationStatus: {},
      imageGenerationProgress: {}
    });
  }, [abortController]);

  // Cleanup effect to abort request on unmount
  useEffect(() => {
    return () => {
      if (abortController) {
        abortController.abort();
      }
    };
  }, [abortController]);

  return {
    ...state,
    startGeneration,
    stopGeneration,
    resetGeneration
  };
};