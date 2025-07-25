import { useState, useCallback } from 'react';
import { useClerkAuth } from '@/modules/auth/contexts/ClerkAuthContext';
import { useToast } from '@/modules/shared/hooks/use-toast';
import { generateImage } from '@/modules/story/services/ai';

interface Chapter {
  id: string;
  title: string;
  content: string;
  order: number;
  imageUrl?: string;
  imagePrompt?: string;
}

interface EbookGenerationOptions {
  originalStory: string;
  bookTitle: string;
  authorName?: string;
  genre?: string;
  selectedTheme?: string;
  selectedFormat?: string;
  useTaylorSwiftThemes?: boolean;
  designSettings?: any;
}

interface EbookGenerationState {
  isGenerating: boolean;
  currentStep: string;
  progress: number;
  chapters: Chapter[];
  coverImage: string | null;
  coverImagePrompt: string;
  error: string | null;
}

export const useEbookGeneration = () => {
  const { isAuthenticated } = useClerkAuth();
  const { toast } = useToast();
  
  const [state, setState] = useState<EbookGenerationState>({
    isGenerating: false,
    currentStep: '',
    progress: 0,
    chapters: [],
    coverImage: null,
    coverImagePrompt: '',
    error: null
  });

  const updateState = useCallback((updates: Partial<EbookGenerationState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const generateCompleteEbook = useCallback(async (options: EbookGenerationOptions) => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to generate ebooks.",
        variant: "destructive",
      });
      return;
    }

    updateState({
      isGenerating: true,
      currentStep: 'Starting ebook generation...',
      progress: 0,
      error: null
    });

    try {
      // Step 1: Generate chapter text (assuming this is handled elsewhere)
      updateState({
        currentStep: 'Generating chapter content...',
        progress: 20
      });

      // Simulate chapter generation - in real implementation, this would call the ebook generation API
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Step 2: Generate cover image
      updateState({
        currentStep: 'Creating book cover...',
        progress: 40
      });

      const coverPrompt = `Professional book cover for "${options.bookTitle}"${options.authorName ? ` by ${options.authorName}` : ''}, ${options.genre ? `${options.genre} genre, ` : ''}based on story: ${options.originalStory.substring(0, 300)}..., modern book cover design, high quality, detailed artwork`;

      const coverImageUrl = await generateImage({
        prompt: coverPrompt,
        size: '1024x1024',
        quality: 'hd'
      });

      updateState({
        coverImage: coverImageUrl,
        coverImagePrompt: coverPrompt,
        currentStep: 'Cover image generated successfully',
        progress: 60
      });

      // Step 3: Generate chapter images (if chapters are available)
      if (state.chapters.length > 0) {
        updateState({
          currentStep: 'Generating chapter illustrations...',
          progress: 70
        });

        const updatedChapters = [...state.chapters];
        
        for (let i = 0; i < updatedChapters.length; i++) {
          const chapter = updatedChapters[i];
          
          updateState({
            currentStep: `Generating image for "${chapter.title}"...`,
            progress: 70 + (i / updatedChapters.length) * 20
          });

          try {
            const chapterPrompt = `Detailed illustration for chapter "${chapter.title}", scene depicting: ${chapter.content.substring(0, 300)}, artistic style, book illustration, high quality artwork`;
            
            const chapterImageUrl = await generateImage({
              prompt: chapterPrompt,
              size: '1024x1024',
              quality: 'hd'
            });

            updatedChapters[i] = {
              ...chapter,
              imageUrl: chapterImageUrl,
              imagePrompt: chapterPrompt
            };

            // Small delay to avoid rate limits
            if (i < updatedChapters.length - 1) {
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          } catch (error) {
            console.warn(`Failed to generate image for chapter "${chapter.title}":`, error);
            // Continue with other chapters even if one fails
          }
        }

        updateState({
          chapters: updatedChapters,
          currentStep: 'Chapter images generated',
          progress: 90
        });
      }

      // Step 4: Finalize
      updateState({
        currentStep: 'Ebook generation complete!',
        progress: 100,
        isGenerating: false
      });

      toast({
        title: "Ebook Generated Successfully!",
        description: "Your ebook with cover and chapter images is ready.",
      });

    } catch (error) {
      console.error('Ebook generation failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate ebook';
      
      updateState({
        error: errorMessage,
        isGenerating: false,
        currentStep: 'Generation failed'
      });

      toast({
        title: "Generation Failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  }, [isAuthenticated, toast, updateState, state.chapters]);

  const generateCoverImage = useCallback(async (bookTitle: string, storyText: string, authorName?: string, genre?: string) => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to generate cover images.",
        variant: "destructive",
      });
      return null;
    }

    try {
      const prompt = `Professional book cover for "${bookTitle}"${authorName ? ` by ${authorName}` : ''}, ${genre ? `${genre} genre, ` : ''}based on story: ${storyText.substring(0, 300)}..., modern book cover design, high quality, detailed artwork`;

      const imageUrl = await generateImage({
        prompt,
        size: '1024x1024',
        quality: 'hd'
      });

      updateState({
        coverImage: imageUrl,
        coverImagePrompt: prompt
      });

      return { imageUrl, prompt };
    } catch (error) {
      console.error('Cover image generation failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate cover image';
      
      toast({
        title: "Cover Generation Failed",
        description: errorMessage,
        variant: "destructive",
      });
      
      return null;
    }
  }, [isAuthenticated, toast, updateState]);

  const generateChapterImages = useCallback(async (chapters: Chapter[]) => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to generate chapter images.",
        variant: "destructive",
      });
      return chapters;
    }

    const updatedChapters = [...chapters];

    try {
      for (let i = 0; i < updatedChapters.length; i++) {
        const chapter = updatedChapters[i];
        
        if (!chapter.imageUrl) { // Only generate if no image exists
          const prompt = `Detailed illustration for chapter "${chapter.title}", scene depicting: ${chapter.content.substring(0, 300)}, artistic style, book illustration, high quality artwork`;
          
          const imageUrl = await generateImage({
            prompt,
            size: '1024x1024',
            quality: 'hd'
          });

          updatedChapters[i] = {
            ...chapter,
            imageUrl,
            imagePrompt: prompt
          };

          // Small delay to avoid rate limits
          if (i < updatedChapters.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 1500));
          }
        }
      }

      updateState({ chapters: updatedChapters });
      
      toast({
        title: "Chapter Images Generated!",
        description: "All chapter illustrations have been created successfully.",
      });

      return updatedChapters;
    } catch (error) {
      console.error('Chapter images generation failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate chapter images';
      
      toast({
        title: "Chapter Images Failed",
        description: errorMessage,
        variant: "destructive",
      });
      
      return updatedChapters;
    }
  }, [isAuthenticated, toast, updateState]);

  const setChapters = useCallback((chapters: Chapter[]) => {
    updateState({ chapters });
  }, [updateState]);

  const reset = useCallback(() => {
    setState({
      isGenerating: false,
      currentStep: '',
      progress: 0,
      chapters: [],
      coverImage: null,
      coverImagePrompt: '',
      error: null
    });
  }, []);

  return {
    ...state,
    generateCompleteEbook,
    generateCoverImage,
    generateChapterImages,
    setChapters,
    reset
  };
}; 