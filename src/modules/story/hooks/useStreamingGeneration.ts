import { useState, useCallback, useEffect, useRef } from "react";
import { useToast } from '@/modules/shared/hooks/use-toast';
import { useClerkAuth } from '@/modules/auth/contexts';
import { TaylorSwiftTheme, StoryFormat } from "@/modules/story/utils/storyPrompts";
import { extractImagePromptFromStream, ImagePrompt } from "@/modules/story/utils/imagePromptExtraction";
import { handleStreamingGenerationError, GenerationErrorContext, normalizeError } from '@/modules/shared/utils/errorHandlingUtils';
import { sentryService } from '@/core/integrations/sentry';
import { posthogEvents } from '@/core/integrations/posthog';

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
  idempotencyKey?: string;
  originalStory: string;
  useTaylorSwiftThemes: boolean;
  selectedTheme?: TaylorSwiftTheme;
  selectedFormat?: StoryFormat;
  numChapters?: number;
  storyline?: {
    logline: string;
    threeActStructure: unknown;
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

interface StreamEvent {
  type: 'status' | 'progress' | 'chapter' | 'complete' | 'error';
  status?: 'claimed' | 'replay';
  replay?: boolean;
  currentChapter?: number;
  totalChapters?: number;
  chapterTitle?: string;
  chapterContent?: string;
  progress?: number;
  message?: string;
  code?: string;
  estimatedTimeRemaining?: number;
}

interface StreamErrorResponse {
  error?: string;
  status?: 'in_progress' | 'insufficient' | 'failed';
  message?: string;
  current_balance?: number;
  required?: number;
  retry_after?: number;
}

function createGenerationIdempotencyKey(): string {
  return `stream-chapters:${crypto.randomUUID()}`;
}

function getStreamResponseError(status: number, payload: StreamErrorResponse): string {
  if (status === 402 || payload.error === 'INSUFFICIENT_CREDITS' || payload.status === 'insufficient') {
    const balance = typeof payload.current_balance === 'number' ? ` Current balance: ${payload.current_balance}.` : '';
    const required = typeof payload.required === 'number' ? ` Required: ${payload.required}.` : '';
    return `Insufficient credits to generate chapters.${balance}${required}`;
  }

  if (status === 409 && (payload.error === 'GENERATION_IN_PROGRESS' || payload.status === 'in_progress')) {
    const retry = typeof payload.retry_after === 'number' ? ` Try again in about ${payload.retry_after} seconds.` : '';
    return `This chapter generation is already in progress.${retry}`;
  }

  if (status === 409 && (payload.error === 'REQUEST_PREVIOUSLY_FAILED' || payload.status === 'failed')) {
    return 'The previous chapter generation attempt failed. Start a new attempt to retry.';
  }

  if (status === 401) return 'Authentication failed. Please sign in and try again.';
  if (status === 403) return 'Access denied. Please check your permissions.';
  if (status === 429) return 'Rate limit exceeded. Please wait a moment and try again.';
  if (status >= 500) return payload.message || 'Server error. Please try again later.';
  return payload.message || 'Invalid request. Please check your settings and try again.';
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

  const abortControllerRef = useRef<AbortController | null>(null);
  const [imageGenerationQueue, setImageGenerationQueue] = useState<Set<number>>(new Set());

  // Mock image generation function - this would be replaced with actual image generation API
  const generateImageForChapter = useCallback(async (chapterIndex: number, imagePrompt: ImagePrompt) => {
    try {
      // Check if aborted before starting
      if (abortControllerRef.current?.signal.aborted) {
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
        if (abortControllerRef.current?.signal.aborted) {
          throw new Error('Image generation aborted');
        }
        
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate processing time
        
        // Check abort signal after waiting
        if (abortControllerRef.current?.signal.aborted) {
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
      if (abortControllerRef.current?.signal.aborted) {
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
  }, []);

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
    const idempotencyKey = options.idempotencyKey ?? createGenerationIdempotencyKey();

    // Add breadcrumb for generation start
    sentryService.addBreadcrumb({
      category: 'story-generation',
      message: 'Story generation started',
      level: 'info',
      data: { 
        format: selectedFormat,
        numChapters: numChapters || 3,
        hasStoryline: !!options.storyline,
      },
    });
    
    posthogEvents.storyGenerationStarted({
      format: selectedFormat,
      numChapters: numChapters || 3,
      hasStoryline: !!options.storyline,
      era: options.storyline ? undefined : undefined, // Can be added if available
    });

    const transaction = sentryService.startTransaction('story-generation', 'story.generate');
    transaction.setTag('format', selectedFormat || 'unknown');
    transaction.setTag('numChapters', String(numChapters || 3));

    // Track chapters completed for error reporting
    let chaptersCompleted = 0;

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
      
      // Prepare headers
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '',
      };
      
      if (clerkToken) {
        headers['Authorization'] = `Bearer ${clerkToken}`;
      }
      
      // Send generation request with proper authentication
      // Use production URL directly since Edge Functions are deployed
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const functionUrl = `${supabaseUrl}/functions/v1/stream-chapters`;
      
      // Create a new AbortController for this request
      const controller = new AbortController();
      abortControllerRef.current = controller;
      
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          originalStory,
          useTaylorSwiftThemes,
          selectedTheme,
          selectedFormat,
          numChapters,
          storyline: options.storyline,
          idempotencyKey,
        }),
        signal: controller.signal
      });


      if (!response.ok) {
        const errorText = await response.text();
        console.error('Streaming response error:', response.status, errorText);

        let errorPayload: StreamErrorResponse = {};
        try {
          errorPayload = JSON.parse(errorText) as StreamErrorResponse;
        } catch {
          // Non-JSON upstream responses still receive a status-specific message.
        }

        if (response.status === 402 || errorPayload.status === 'insufficient') {
          window.dispatchEvent(new CustomEvent('credits:exhausted', {
            detail: { balance: errorPayload.current_balance ?? 0 },
          }));
        }

        throw new Error(getStreamResponseError(response.status, errorPayload));
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        const chapters: Chapter[] = [];
        let receivedCompletion = false;

        const handleStreamEvent = (data: StreamEvent) => {
          switch (data.type) {
            case 'status':
              setState(prev => ({
                ...prev,
                totalChapters: data.totalChapters ?? prev.totalChapters,
                message: data.status === 'replay'
                  ? 'Restoring your completed chapters...'
                  : (data.message ?? prev.message),
              }));
              break;

            case 'progress':
              setState(prev => ({
                ...prev,
                currentChapter: data.currentChapter ?? 0,
                totalChapters: data.totalChapters ?? prev.totalChapters,
                progress: data.progress ?? 0,
                message: data.message ?? '',
                estimatedTimeRemaining: data.estimatedTimeRemaining,
              }));
              break;

            case 'chapter': {
              if (
                typeof data.currentChapter !== 'number'
                || typeof data.chapterTitle !== 'string'
                || typeof data.chapterContent !== 'string'
              ) {
                throw new Error('Received an invalid chapter from the generation stream');
              }

              const newChapter: Chapter = {
                title: data.chapterTitle,
                content: data.chapterContent,
                id: `chapter-${data.currentChapter}`,
              };
              const chapterIndex = Math.max(0, data.currentChapter - 1);
              chapters[chapterIndex] = newChapter;
              const completedChapters = chapters.filter(Boolean);
              chaptersCompleted = completedChapters.length;

              setState(prev => ({
                ...prev,
                chapters: [...completedChapters],
                currentChapter: data.currentChapter ?? prev.currentChapter,
                progress: data.progress ?? prev.progress,
              }));

              sentryService.addBreadcrumb({
                category: 'story-generation',
                message: `Chapter ${data.currentChapter} completed`,
                level: 'info',
                data: {
                  chapterNumber: data.currentChapter,
                  chapterTitle: data.chapterTitle,
                  totalChapters: data.totalChapters ?? numChapters ?? 3,
                  progress: data.progress ?? 0,
                  replay: data.replay === true,
                },
              });

              if (!data.replay) {
                posthogEvents.chapterCompleted(
                  data.currentChapter,
                  data.totalChapters ?? numChapters ?? 3,
                  { chapterTitle: data.chapterTitle, format: selectedFormat },
                );
              }

              onChapterComplete?.(newChapter);
              toast({
                title: data.replay ? `Chapter ${data.currentChapter} Restored` : `Chapter ${data.currentChapter} Complete`,
                description: `"${data.chapterTitle}" ${data.replay ? 'was restored' : 'has been generated'}`,
              });
              break;
            }

            case 'complete':
              receivedCompletion = true;
              setState(prev => ({
                ...prev,
                isGenerating: false,
                isComplete: true,
                progress: 100,
                message: data.replay ? 'Generation restored!' : 'Generation complete!',
              }));

              sentryService.addBreadcrumb({
                category: 'story-generation',
                message: data.replay ? 'Story generation replay restored' : 'Story generation completed successfully',
                level: 'info',
                data: { totalChapters: chapters.length, format: selectedFormat, replay: data.replay === true },
              });
              transaction.finish();

              if (!data.replay) {
                posthogEvents.storyGenerationCompleted({
                  totalChapters: chapters.length,
                  format: selectedFormat,
                });
              }

              onComplete?.(chapters.filter(Boolean));
              toast({
                title: data.replay ? 'Story Restored' : 'Story Generation Complete',
                description: `All ${chaptersCompleted} chapters ${data.replay ? 'were restored' : 'were generated successfully'}.`,
              });
              break;

            case 'error':
              sentryService.addBreadcrumb({
                category: 'story-generation',
                message: 'Streaming error received from server',
                level: 'error',
                data: { errorMessage: data.message, errorCode: data.code },
              });
              throw new Error(data.message || 'Chapter generation failed');
          }
        };

        const processLine = (line: string) => {
          if (!line.startsWith('data:')) return;
          const eventJson = line.slice(5).trim();
          if (!eventJson) return;

          let data: StreamEvent;
          try {
            data = JSON.parse(eventJson) as StreamEvent;
          } catch (parseError) {
            console.error('Ignoring malformed stream event:', parseError, line);
            return;
          }
          handleStreamEvent(data);
        };

        let buffer = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split(/\r?\n/);
          buffer = lines.pop() ?? '';
          lines.forEach(processLine);
        }

        buffer += decoder.decode();
        if (buffer.trim()) processLine(buffer.trim());
        if (!receivedCompletion) {
          throw new Error('Chapter generation stream ended before completion');
        }
      } else {
        throw new Error('No response body available for streaming');
      }

    } catch (error) {
      transaction.finish();
      
      // Check if the error is due to abort
      if (error instanceof Error && error.name === 'AbortError') {
        sentryService.addBreadcrumb({
          category: 'story-generation',
          message: 'Story generation aborted by user',
          level: 'info',
          data: { 
            chaptersCompleted,
            format: selectedFormat,
          },
        });
        
        posthogEvents.storyGenerationAborted({
          chaptersCompleted,
          format: selectedFormat,
        });
        
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
      
      // Capture error in Sentry
      sentryService.captureException(error instanceof Error ? error : new Error(errorMessage), {
        component: 'useStreamingGeneration',
        format: selectedFormat,
        numChapters: numChapters || 3,
        chaptersCompleted,
      });
      
      sentryService.addBreadcrumb({
        category: 'story-generation',
        message: 'Story generation failed',
        level: 'error',
        data: { 
          errorMessage,
          format: selectedFormat,
          chaptersCompleted,
        },
      });
      
      posthogEvents.storyGenerationFailed(errorMessage, {
        format: selectedFormat,
        chaptersCompleted,
        numChapters: numChapters || 3,
      });
      
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
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
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
    // Abort any ongoing request when resetting
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
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
  }, []);

  // Cleanup effect to abort request on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    ...state,
    startGeneration,
    stopGeneration,
    resetGeneration
  };
};
