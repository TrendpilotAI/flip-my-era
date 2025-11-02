import { useState, useEffect } from "react";
import { useToast } from '@/modules/shared/hooks/use-toast';
import { calculateCreditCost, type CreditCostParams } from '@/modules/shared/utils/creditPricing';
import { supabase, createSupabaseClientWithClerkToken } from '@/core/integrations/supabase/client';
import { generateWithGroq } from "@/modules/shared/utils/groq";
import { ChapterView } from "./ChapterView";
import { StreamingChapterView } from "./StreamingChapterView";
import { StreamingProgress } from "./StreamingProgress";
import { CompletionCelebration } from "./CompletionCelebration";
import { ActionButtons } from "./ActionButtons";
import { GenerateButton } from "./GenerateButton";
import { BookReader } from "./BookReader";
import { Button } from '@/modules/shared/components/ui/button';
import { Switch } from '@/modules/shared/components/ui/switch';
import { Label } from '@/modules/shared/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/modules/shared/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shared/components/ui/card';
import { Book, Download, Loader2, Sparkles, AlertTriangle, Heart, Users, Zap, Star, Pause, Play, RotateCcw } from "lucide-react";
import { cn, extractUserIdFromToken } from '@/core/lib/utils';
import { generateChapters, generateTaylorSwiftChapters, generateEbookIllustration, generateTaylorSwiftIllustration } from "@/modules/story/services/ai";
import { samcartClient } from '@/core/integrations/samcart/client';
import { CreditBalance } from "@/modules/user/components/CreditBalance";
import { CreditPurchaseModal } from "@/modules/user/components/CreditPurchaseModal";
import { CreditWallModal } from "./CreditWallModal";
import { useAuth } from "@clerk/clerk-react";
import { Alert, AlertDescription } from '@/modules/shared/components/ui/alert';
import { useStreamingGeneration } from "@/modules/story/hooks/useStreamingGeneration";
import {
  TaylorSwiftTheme,
  StoryFormat,
  taylorSwiftThemes,
  storyFormats
} from "@/modules/story/utils/storyPrompts";
import { downloadEbook } from '@/modules/shared/utils/downloadUtils';
import { Pencil } from 'lucide-react';

interface Chapter {
  title: string;
  content: string;
  imageUrl?: string;
  id?: string;
}

interface EbookGeneratorProps {
  originalStory: string;
  storyId: string;
  storyline?: {
    logline: string;
    threeActStructure: unknown;
    chapters: Array<{ number: number; title: string; summary: string; wordCountTarget: number }>;
    themes: string[];
    wordCountTotal: number;
  };
  storyFormat?: 'preview' | 'short-story' | 'novella';
}

export const EbookGenerator = ({ originalStory, storyId, storyline, storyFormat }: EbookGeneratorProps) => {
  const { toast } = useToast();
  const { isSignedIn, getToken } = useAuth();
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [isGeneratingChapters, setIsGeneratingChapters] = useState(false);
  const [isGeneratingImages, setIsGeneratingImages] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [hasImages, setHasImages] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState<number | null>(null);
  const [useEnhancedPrompts, setUseEnhancedPrompts] = useState(true);
  
  // Taylor Swift theme and format selection
  const [selectedTheme, setSelectedTheme] = useState<TaylorSwiftTheme>('coming-of-age');
  const [selectedFormat, setSelectedFormat] = useState<StoryFormat>('short-story');
  const [useTaylorSwiftThemes, setUseTaylorSwiftThemes] = useState(true);
  
  // Credit system state
  const [creditBalance, setCreditBalance] = useState<number>(0);
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [hasUnlimitedSubscription, setHasUnlimitedSubscription] = useState(false);
  const [currentTransactionId, setCurrentTransactionId] = useState<string | null>(null);
  
  // Streaming generation state
  const [enableStreamingGeneration, setEnableStreamingGeneration] = useState(true);
  const [showStreamingText, setShowStreamingText] = useState(true);
  const [showCelebration, setShowCelebration] = useState(false);
  
  // Book reading state
  const [showBookReader, setShowBookReader] = useState(false);
  
  // Credit wall state (freemium model)
  const [showCreditWall, setShowCreditWall] = useState(false);
  const [isContentUnlocked, setIsContentUnlocked] = useState(false);

  // Lock background scroll when BookReader is open
  useEffect(() => {
    if (showBookReader) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showBookReader]);
  
  // Initialize streaming generation hook
  const streaming = useStreamingGeneration();

  // Credit validation function with new pricing system
  const validateCredits = async (operations: CreditCostParams[]): Promise<{ success: boolean; transactionId?: string; bypassCredits?: boolean; totalCost?: number }> => {
    if (!isSignedIn) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to generate ebooks.",
        variant: "destructive",
      });
      return { success: false };
    }

    try {
      console.log('🔍 EbookGenerator: Starting credit validation...');
      console.log('🔍 EbookGenerator: isSignedIn:', isSignedIn);
      console.log('🔍 EbookGenerator: Operations:', operations);

      const token = await getToken({ template: 'supabase' });
      console.log('🔍 EbookGenerator: Token received:', token ? 'YES (length: ' + token.length + ')' : 'NO');
      console.log('🔍 EbookGenerator: Token preview:', token ? token.substring(0, 20) + '...' : 'null');

      // Calculate total cost using new pricing system
      const costResult = operations.length === 1
        ? calculateCreditCost(operations[0])
        : { totalCost: operations.reduce((sum, op) => sum + calculateCreditCost(op).totalCost, 0) };

      const { data, error } = await supabase.functions.invoke('credits-validate', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operations: operations,
          generation_id: storyId,
        }),
      });

      if (error) {
        console.error('Error validating credits:', error);
        toast({
          title: "Credit Validation Failed",
          description: "Unable to verify your credit balance. Please try again.",
          variant: "destructive",
        });
        return { success: false };
      }

      if (data?.success && data?.data) {
        const { has_sufficient_credits, current_balance, subscription_type, transaction_id, bypass_credits } = data.data;
        
        // Update local state
        setCreditBalance(current_balance);
        setHasUnlimitedSubscription(subscription_type === 'monthly_unlimited' || subscription_type === 'annual_unlimited');

        if (has_sufficient_credits) {
          if (transaction_id) {
            setCurrentTransactionId(transaction_id);
          }
          return { success: true, transactionId: transaction_id, bypassCredits: bypass_credits, totalCost: costResult.totalCost };
        } else {
          // Show credit purchase modal
          setShowCreditModal(true);
          toast({
            title: "Insufficient Credits",
            description: `You need ${costResult.totalCost} credit(s) to generate this ebook. Current balance: ${current_balance}`,
            variant: "destructive",
          });
          return { success: false, totalCost: costResult.totalCost };
        }
      } else {
        toast({
          title: "Credit Validation Error",
          description: data?.error || "Unknown error occurred during credit validation.",
          variant: "destructive",
        });
        return { success: false };
      }
    } catch (err) {
      console.error('Credit validation error:', err);
      toast({
        title: "Connection Error",
        description: "Failed to connect to credit service. Please try again.",
        variant: "destructive",
      });
      return { success: false };
    }
  };

  const handleCreditPurchaseSuccess = () => {
    setShowCreditModal(false);
    // Refresh credit balance will happen automatically via CreditBalance component
    toast({
      title: "Credits Purchased",
      description: "Your credits have been added successfully. You can now generate your ebook.",
    });
  };

  const generateChaptersWithStreaming = async () => {
    // Validate credits before generation using new pricing system
    const operations: CreditCostParams[] = [{
      operationType: 'chapter_generation',
      modelQuality: 'advanced', // Use advanced model for ebooks
      quantity: 1
    }];
    const creditValidation = await validateCredits(operations);
    if (!creditValidation.success) {
      return;
    }

    // Start streaming generation
    streaming.startGeneration({
      originalStory,
      useTaylorSwiftThemes,
      selectedTheme,
      selectedFormat,
      numChapters: storyFormat === 'preview' ? 1 : storyFormat === 'short-story' ? 5 : storyline?.chapters.length || storyFormats[selectedFormat].chapters,
      storyline: storyline,
      onChapterComplete: (chapter) => {
        // Chapter completed callback
        console.log('Chapter completed:', chapter.title);
      },
      onComplete: async (generatedChapters) => {
        // All chapters completed
        setChapters(generatedChapters);
        
        // Show credit wall modal for freemium monetization
        setShowCreditWall(true);
        setIsContentUnlocked(false); // Reset unlock status for new generation
        
        // Show celebration
        setShowCelebration(true);
        
        // Create ebook generation record in database
        if (creditValidation.transactionId) {
          try {
            const storyType = useTaylorSwiftThemes ? `taylor-swift-${selectedTheme}-${selectedFormat}` : 'ebook';
            const token = isSignedIn ? await getToken({ template: 'supabase' }) : null;
            const userId = token ? extractUserIdFromToken(token) : null;
            
            if (!token || !userId) {
              console.error('No token or user ID available for database operation');
              return;
            }
            
            // Create authenticated Supabase client
            const supabaseWithAuth = createSupabaseClientWithClerkToken(token);
            
            console.log('Attempting to save ebook generation record:', {
              user_id: userId,
              story_id: storyId,
              title: `${useTaylorSwiftThemes ? `${taylorSwiftThemes[selectedTheme].title} ` : ''}${storyFormats[selectedFormat].name}: ${generatedChapters[0]?.title || 'Untitled'}`,
              chapter_count: generatedChapters.length,
              word_count: generatedChapters.reduce((total, ch) => total + ch.content.length, 0)
            });
            
            const { data: ebookGeneration, error: ebookError } = await supabaseWithAuth
              .from('ebook_generations')
              .insert({
                user_id: userId,
                story_id: storyId,
                title: `${useTaylorSwiftThemes ? `${taylorSwiftThemes[selectedTheme].title} ` : ''}${storyFormats[selectedFormat].name}: ${generatedChapters[0]?.title || 'Untitled'}`,
                content: JSON.stringify(generatedChapters),
                status: 'completed',
                credits_used: creditValidation.bypassCredits ? 0 : 1,
                paid_with_credits: !creditValidation.bypassCredits,
                transaction_id: creditValidation.transactionId,
                story_type: storyType,
                chapter_count: generatedChapters.length,
                word_count: generatedChapters.reduce((total, ch) => total + ch.content.length, 0)
              })
              .select()
              .single();

            if (ebookError) {
              console.error('Error creating ebook generation record:', ebookError);
            } else {
              console.log('Successfully saved ebook generation record:', ebookGeneration);
              // Save the actual book to ebook_generations table for user access
              const { error: memoryBookError } = await supabaseWithAuth
                .from('ebook_generations')
                .insert({
                  user_id: userId,
                  original_story_id: storyId,
                  ebook_generation_id: ebookGeneration.id,
                  title: `${useTaylorSwiftThemes ? `${taylorSwiftThemes[selectedTheme].title} ` : ''}${storyFormats[selectedFormat].name}: ${generatedChapters[0]?.title || 'Untitled'}`,
                  description: `A ${storyFormats[selectedFormat].name.toLowerCase()}${useTaylorSwiftThemes ? ` with ${taylorSwiftThemes[selectedTheme].title.toLowerCase()} themes` : ''} generated from your story.`,
                  chapters: generatedChapters,
                  chapter_count: generatedChapters.length,
                  word_count: generatedChapters.reduce((total, ch) => total + ch.content.length, 0),
                  generation_settings: {
                    useTaylorSwiftThemes,
                    selectedTheme,
                    selectedFormat,
                    storyType
                  },
                  style_preferences: {
                    image_style: 'children',
                    mood: 'happy',
                    target_age_group: 'children'
                  },
                  status: 'completed',
                  generation_completed_at: new Date().toISOString()
                });

              if (memoryBookError) {
                console.error('Error saving book to memory:', memoryBookError);
              } else {
                toast({
                  title: "Book Saved",
                  description: "Your book has been saved and is now available in your library.",
                });
              }
            }
          } catch (dbError) {
            console.error('Database error:', dbError);
          }
        }
      },
      onError: (error) => {
        console.error('Streaming generation error:', error);
      }
    });
  };

  const generateChaptersFromStory = async () => {
    // Validate credits before generation using new pricing system
    const operations: CreditCostParams[] = [{
      operationType: 'chapter_generation',
      modelQuality: 'advanced', // Use advanced model for ebooks
      quantity: 1
    }];
    const creditValidation = await validateCredits(operations);
    if (!creditValidation.success) {
      return;
    }

    setIsGeneratingChapters(true);
    
    try {
      // Choose generation method based on theme selection
      const generatedChapters = useTaylorSwiftThemes
        ? await generateTaylorSwiftChapters(originalStory, selectedTheme, selectedFormat, storyFormats[selectedFormat].chapters)
        : await generateChapters(originalStory, storyFormats[selectedFormat].chapters);
      
      // Map the generated chapters to our Chapter interface
      const formattedChapters: Chapter[] = generatedChapters.map((chapter, index) => ({
        title: chapter.title,
        content: chapter.content,
        id: `${storyId}-ch${index + 1}`
      }));
      
      setChapters(formattedChapters);

      // Create ebook generation record in database
      if (creditValidation.transactionId) {
        try {
          const storyType = useTaylorSwiftThemes ? `taylor-swift-${selectedTheme}-${selectedFormat}` : 'ebook';
          const token = isSignedIn ? await getToken({ template: 'supabase' }) : null;
          const userId = token ? extractUserIdFromToken(token) : null;
          
          if (!token || !userId) {
            console.error('No token or user ID available for database operation');
            return;
          }
          
          // Create authenticated Supabase client
          const supabaseWithAuth = createSupabaseClientWithClerkToken(token);
          
          const { data: ebookGeneration, error: ebookError } = await supabaseWithAuth
            .from('ebook_generations')
            .insert({
              user_id: userId,
              story_id: storyId,
              title: `${useTaylorSwiftThemes ? `${taylorSwiftThemes[selectedTheme].title} ` : ''}${storyFormats[selectedFormat].name}: ${formattedChapters[0]?.title || 'Untitled'}`,
              content: JSON.stringify(formattedChapters),
              status: 'completed',
              credits_used: creditValidation.bypassCredits ? 0 : 1,
              paid_with_credits: !creditValidation.bypassCredits,
              transaction_id: creditValidation.transactionId,
              story_type: storyType,
              chapter_count: formattedChapters.length,
              word_count: formattedChapters.reduce((total, ch) => total + ch.content.length, 0)
            })
            .select()
            .single();

          if (ebookError) {
            console.error('Error creating ebook generation record:', ebookError);
          } else {
            // Save the actual book to ebook_generations table for user access
            const { error: memoryBookError } = await supabaseWithAuth
              .from('ebook_generations')
              .insert({
                user_id: userId,
                original_story_id: storyId,
                ebook_generation_id: ebookGeneration.id,
                title: `${useTaylorSwiftThemes ? `${taylorSwiftThemes[selectedTheme].title} ` : ''}${storyFormats[selectedFormat].name}: ${formattedChapters[0]?.title || 'Untitled'}`,
                description: `A ${storyFormats[selectedFormat].name.toLowerCase()}${useTaylorSwiftThemes ? ` with ${taylorSwiftThemes[selectedTheme].title.toLowerCase()} themes` : ''} generated from your story.`,
                chapters: formattedChapters,
                chapter_count: formattedChapters.length,
                word_count: formattedChapters.reduce((total, ch) => total + ch.content.length, 0),
                generation_settings: {
                  useTaylorSwiftThemes,
                  selectedTheme,
                  selectedFormat,
                  storyType
                },
                style_preferences: {
                  image_style: 'children',
                  mood: 'happy',
                  target_age_group: 'children'
                },
                status: 'completed',
                generation_completed_at: new Date().toISOString()
              });

            if (memoryBookError) {
              console.error('Error saving book to memory:', memoryBookError);
            } else {
              toast({
                title: "Book Saved",
                description: "Your book has been saved and is now available in your library.",
              });
            }
          }
        } catch (dbError) {
          console.error('Database error:', dbError);
        }
      }
      
      const creditType = creditValidation.bypassCredits ? "unlimited subscription" : "credit";
      const themeDescription = useTaylorSwiftThemes ? ` with ${taylorSwiftThemes[selectedTheme].title.toLowerCase()} themes` : '';
      toast({
        title: "Chapters Generated",
        description: `Your ${storyFormats[selectedFormat].name.toLowerCase()}${themeDescription} has been created using your ${creditType}.`,
      });
    } catch (error) {
      console.error("Error generating chapters:", error);
      toast({
        title: "Generation Failed",
        description: "There was an error generating your chapters. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingChapters(false);
    }
  };

  const generateImagesForChapters = async () => {
    if (chapters.length === 0) {
      toast({
        title: "No Chapters",
        description: "Please generate chapters first before creating illustrations.",
        variant: "destructive",
      });
      return;
    }
    
    setIsGeneratingImages(true);
    
    try {
      // Generate images for each chapter sequentially using RUNWARE Flux1.1 Pro
      const updatedChapters = [...chapters];
      
      for (let i = 0; i < chapters.length; i++) {
        setCurrentImageIndex(i);
        const chapter = chapters[i];
        
        try {
          let imageUrl: string;
          
          if (useTaylorSwiftThemes) {
            // Use Taylor Swift-themed image generation with mood detection
            imageUrl = await generateTaylorSwiftIllustration({
              chapterTitle: chapter.title,
              chapterContent: chapter.content,
              theme: selectedTheme,
              useEnhancedPrompts: useEnhancedPrompts
            });
          } else {
            // Use standard ebook illustration generation
            imageUrl = await generateEbookIllustration({
              chapterTitle: chapter.title,
              chapterContent: chapter.content,
              style: 'children', // Default to children's style
              mood: 'happy', // Default to happy mood
              useEnhancedPrompts: useEnhancedPrompts
            });
          }
          
          // Update the chapter with the image URL
          updatedChapters[i] = {
            ...chapter,
            imageUrl
          };
          
          // Update chapters state to show progress
          setChapters([...updatedChapters]);
          
          const promptType = useEnhancedPrompts ? "AI-enhanced" : "standard";
          const themeType = useTaylorSwiftThemes ? `Taylor Swift ${selectedTheme.replace('-', ' ')} themed` : "standard";
          toast({
            title: `Illustration ${i + 1} Generated`,
            description: `Created beautiful ${themeType} illustration for "${chapter.title}" using Flux1.1 Pro with ${promptType} prompts.`,
          });
        } catch (imageError) {
          console.error(`Error generating image for chapter ${i + 1}:`, imageError);
          toast({
            title: `Illustration ${i + 1} Failed`,
            description: `Could not generate illustration for "${chapter.title}". Continuing with next chapter.`,
            variant: "destructive",
          });
          // Continue with next chapter even if one fails
        }
      }
      
      setHasImages(true);
      setCurrentImageIndex(null);
      
      const promptType = useEnhancedPrompts ? "AI-enhanced" : "standard";
      toast({
        title: "All Illustrations Generated",
        description: `Beautiful illustrations have been created for your story using RUNWARE Flux1.1 Pro with ${promptType} prompts.`,
      });
    } catch (error) {
      console.error("Error generating images:", error);
      toast({
        title: "Image Generation Failed",
        description: "There was an error generating your illustrations. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingImages(false);
      setCurrentImageIndex(null);
    }
  };

  const handleSave = async () => {
    toast({
      title: "Saving PDF",
      description: "Your illustrated story is being prepared for download.",
    });
    try {
      await downloadEbook(
        `${useTaylorSwiftThemes ? `${taylorSwiftThemes[selectedTheme].title} ` : ''}${storyFormats[selectedFormat].name}: ${chapters[0]?.title || 'Untitled'}`,
        chapters,
        {
          format: 'pdf',
          includeMetadata: true,
          includeCoverPage: true,
          fontSize: 12,
          fontFamily: 'helvetica',
          pageSize: 'A4',
        },
        storyId
      );
      toast({
        title: "PDF Ready",
        description: "Your illustrated story has been saved as a PDF.",
      });
    } catch (err) {
      toast({
        title: "PDF Download Failed",
        description: "There was an error generating your PDF. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handlePublish = async () => {
    setIsPublishing(true);
    
    try {
      // In a real implementation, this would publish the story to a platform
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Story Published",
        description: "Your illustrated story is now available online!",
      });
    } catch (error) {
      toast({
        title: "Publishing Failed",
        description: "There was an error publishing your story. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsPublishing(false);
    }
  };

  const handleShare = () => {
    // In a real implementation, this would open a share dialog
    toast({
      title: "Share Your Story",
      description: "Sharing options would appear here in the final implementation.",
    });
  };

  // Helper functions for Credit Wall Modal
  const getPreviewContent = () => {
    if (chapters.length === 0) return '';
    const firstChapter = chapters[0];
    const words = firstChapter.content.split(' ');
    const previewWords = words.slice(0, 100);
    return previewWords.join(' ') + (words.length > 100 ? '...' : '');
  };

  const getTotalWords = () => {
    return chapters.reduce((total, chapter) => {
      return total + chapter.content.split(' ').length;
    }, 0);
  };

  const getStoryTitle = () => {
    return chapters.length > 0 ? chapters[0].title : 'Your Story';
  };

  const handleUnlockContent = () => {
    setIsContentUnlocked(true);
    setShowCreditWall(false);
    toast({
      title: "Content Unlocked!",
      description: "Enjoy your complete story!",
    });
  };

  const handleCreditBalanceRefresh = async () => {
    // Refresh credit balance after purchase
    try {
      const token = await getToken({ template: 'supabase' });
      const { data } = await supabase.functions.invoke('credits', {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (data?.data?.balance) {
        setCreditBalance(data.data.balance.balance || 0);
      }
    } catch (error) {
      console.error('Error refreshing credit balance:', error);
    }
  };

  return (
    <div className="space-y-8">
      {/* Credit Balance Widget */}
      {isSignedIn && (
        <CreditBalance
          onBalanceChange={setCreditBalance}
          className="max-w-sm"
        />
      )}

      {/* Credit Insufficient Warning */}
      {isSignedIn && !hasUnlimitedSubscription && creditBalance === 0 && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            You have 0 credits remaining. Purchase credits to generate ebooks.
            <Button
              variant="link"
              className="p-0 h-auto ml-2 text-orange-600 hover:text-orange-700"
              onClick={() => setShowCreditModal(true)}
            >
              Buy Credits
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {chapters.length === 0 ? (
        <div className="space-y-6">
          {/* Taylor Swift Theme Toggle */}
          <Card className="bg-white/90 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Star className="h-5 w-5 text-purple-500" />
                  <div>
                    <CardTitle className="text-lg">Taylor Swift-Inspired Themes</CardTitle>
                    <CardDescription>
                      Create stories inspired by Taylor Swift's emotional storytelling
                    </CardDescription>
                  </div>
                </div>
                <Switch
                  checked={useTaylorSwiftThemes}
                  onCheckedChange={setUseTaylorSwiftThemes}
                />
              </div>
            </CardHeader>
            
            {useTaylorSwiftThemes && (
              <CardContent className="space-y-4">
                {/* Theme Selection */}
                <div className="space-y-2">
                  <Label htmlFor="theme-select">Story Theme</Label>
                  <Select value={selectedTheme} onValueChange={(value: TaylorSwiftTheme) => setSelectedTheme(value)}>
                    <SelectTrigger id="theme-select">
                      <SelectValue placeholder="Select a theme" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(taylorSwiftThemes).map(([key, theme]) => (
                        <SelectItem key={key} value={key}>
                          <div className="flex items-center space-x-2">
                            {key === 'coming-of-age' && <Zap className="h-4 w-4 text-blue-500" />}
                            {key === 'first-love' && <Heart className="h-4 w-4 text-pink-500" />}
                            {key === 'heartbreak' && <Sparkles className="h-4 w-4 text-purple-500" />}
                            {key === 'friendship' && <Users className="h-4 w-4 text-green-500" />}
                            <span>{theme.title}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-gray-600">
                    {taylorSwiftThemes[selectedTheme].description}
                  </p>
                </div>

                {/* Format Selection */}
                <div className="space-y-2">
                  <Label htmlFor="format-select">Story Format</Label>
                  <Select value={selectedFormat} onValueChange={(value: StoryFormat) => setSelectedFormat(value)}>
                    <SelectTrigger id="format-select">
                      <SelectValue placeholder="Select a format" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(storyFormats).map(([key, format]) => (
                        <SelectItem key={key} value={key}>
                          <div className="flex flex-col">
                            <span className="font-medium">{format.name}</span>
                            <span className="text-xs text-gray-500">{format.targetLength}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-gray-600">
                    {storyFormats[selectedFormat].description}
                  </p>
                </div>

                {/* Theme Inspiration */}
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-3 rounded-lg">
                  <p className="text-sm font-medium text-gray-700 mb-1">Taylor Swift Song Inspirations:</p>
                  <p className="text-xs text-gray-600">
                    {taylorSwiftThemes[selectedTheme].inspirations.join(' • ')}
                  </p>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Streaming Generation Toggle */}
          <Card className="bg-white/90 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Sparkles className="h-5 w-5 text-blue-500" />
                  <div>
                    <CardTitle className="text-lg">Fast Streaming Generation</CardTitle>
                    <CardDescription>
                      Watch your story come to life with real-time chapter streaming
                    </CardDescription>
                  </div>
                </div>
                <Switch
                  checked={enableStreamingGeneration}
                  onCheckedChange={setEnableStreamingGeneration}
                />
              </div>
            </CardHeader>
            
            {enableStreamingGeneration && (
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Play className="h-4 w-4 text-green-500" />
                    <div>
                      <Label htmlFor="streaming-text" className="text-sm font-medium text-gray-700">
                        Show Streaming Text
                      </Label>
                      <p className="text-xs text-gray-500">
                        Display text appearing character by character as it's generated
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="streaming-text"
                    checked={showStreamingText}
                    onCheckedChange={setShowStreamingText}
                  />
                </div>
              </CardContent>
            )}
          </Card>

          {/* Generation Section */}
          <div className="bg-white/90 backdrop-blur-sm rounded-lg p-8 text-center space-y-6">
            <Book className="h-16 w-16 mx-auto text-primary/80" />
            <h3 className="text-xl font-semibold text-gray-800">
              {useTaylorSwiftThemes
                ? `Create Your ${taylorSwiftThemes[selectedTheme].title} ${storyFormats[selectedFormat].name}`
                : 'Transform Your Story into an Illustrated Book'
              }
            </h3>
            <p className="text-gray-600 max-w-md mx-auto">
              {useTaylorSwiftThemes ? (
                <>
                  Our AI will create a {storyFormats[selectedFormat].name.toLowerCase()} with {taylorSwiftThemes[selectedTheme].title.toLowerCase()} themes,
                  inspired by Taylor Swift's emotional storytelling style, with {storyFormats[selectedFormat].chapters} beautifully illustrated chapters.
                </>
              ) : (
                <>
                  Our AI will transform your story into a beautifully illustrated children's book with multiple chapters using RUNWARE Flux1.1 Pro.
                </>
              )}
              {isSignedIn && !hasUnlimitedSubscription && (
                <span className="block mt-2 text-sm font-medium">
                  Cost: ~3 credits per ebook (story + chapters + illustrations)
                </span>
              )}
            </p>
            <div className="space-y-4">
              <GenerateButton
                type="chapters"
                onClick={enableStreamingGeneration ? generateChaptersWithStreaming : generateChaptersFromStory}
                isGenerating={enableStreamingGeneration ? streaming.isGenerating : isGeneratingChapters}
              />
              
              {enableStreamingGeneration && streaming.isGenerating && (
                <div className="flex items-center justify-center space-x-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={streaming.stopGeneration}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Pause className="h-4 w-4 mr-2" />
                    Stop Generation
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={streaming.resetGeneration}
                    className="text-gray-600 hover:text-gray-700"
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reset
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Streaming Progress Display */}
          {enableStreamingGeneration && streaming.isGenerating && (
            <StreamingProgress
              currentChapter={streaming.currentChapter}
              totalChapters={streaming.totalChapters}
              progress={streaming.progress}
              message={streaming.message}
              estimatedTimeRemaining={streaming.estimatedTimeRemaining}
              isComplete={streaming.isComplete}
              useTaylorSwiftThemes={useTaylorSwiftThemes}
            />
          )}

          {/* AI-Enhanced Prompts Toggle */}
          <div className="bg-white/90 backdrop-blur-sm rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Sparkles className="h-5 w-5 text-yellow-500" />
                <div>
                  <Label htmlFor="enhanced-prompts" className="text-sm font-medium text-gray-700">
                    AI-Enhanced Prompts
                  </Label>
                  <p className="text-xs text-gray-500">
                    Use Groq AI to create highly detailed, optimized prompts for better illustrations
                  </p>
                </div>
              </div>
              <Switch
                id="enhanced-prompts"
                checked={useEnhancedPrompts}
                onCheckedChange={setUseEnhancedPrompts}
              />
            </div>
          </div>

          <GenerateButton
            type="images"
            onClick={generateImagesForChapters}
            isGenerating={isGeneratingImages}
            hasImages={hasImages}
          />
          
          <div className="space-y-12">
            {(enableStreamingGeneration ? streaming.chapters : chapters).map((chapter, index) => (
              enableStreamingGeneration ? (
                <StreamingChapterView
                  key={chapter.id || index}
                  chapter={chapter}
                  index={index}
                  isGeneratingImages={isGeneratingImages && (currentImageIndex === index || currentImageIndex === null)}
                  useTaylorSwiftThemes={useTaylorSwiftThemes}
                  showStreamingText={showStreamingText}
                />
              ) : (
                <ChapterView
                  key={chapter.id || index}
                  chapter={chapter}
                  index={index}
                  isGeneratingImages={isGeneratingImages && (currentImageIndex === index || currentImageIndex === null)}
                />
              )
            ))}
          </div>
          
          {/* Enhanced Action Buttons with Book Reader */}
          <div className="flex flex-col gap-4 w-full max-w-2xl mx-auto mt-8">
            <Button
              size="lg"
              className={cn(
                "w-full text-lg font-semibold py-4 transition-all duration-300 rounded-full",
                useTaylorSwiftThemes
                  ? "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl"
                  : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl"
              )}
              onClick={() => setShowBookReader(true)}
            >
              <Book className="h-5 w-5 mr-2" />
              Read Your Book
              {useTaylorSwiftThemes && <Sparkles className="h-4 w-4 ml-2" />}
            </Button>
            <ActionButtons
              onSave={handleSave}
              onPublish={handlePublish}
              onShare={handleShare}
              isPublishing={isPublishing}
              content={{
                id: storyId,
                title: `${useTaylorSwiftThemes ? `${taylorSwiftThemes[selectedTheme].title} ` : ''}${storyFormats[selectedFormat].name}: ${chapters[0]?.title || 'Untitled'}`,
                content: chapters,
                type: 'ebook',
                author: 'FlipMyEra User'
              }}
              showDownloadShare={true}
            />
            <Button
              className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-full text-lg font-semibold py-4"
              size="lg"
              onClick={() => {
                try {
                  const productId = import.meta.env.VITE_SAMCART_EBOOK_PRODUCT_ID || 'ebook-product-id';
                  samcartClient.redirectToCheckout({
                    productId,
                    redirectUrl: `${window.location.origin}/checkout/success`,
                    cancelUrl: window.location.href
                  });
                } catch (error) {
                  console.error('Failed to redirect to checkout:', error);
                  toast({
                    title: "Checkout Error",
                    description: "Unable to proceed to checkout. Please try again.",
                    variant: "destructive",
                  });
                }
              }}
            >
              Buy this Ebook with SamCart
            </Button>
          </div>
        </div>
      )}

      {/* Credit Purchase Modal */}
      <CreditPurchaseModal
        isOpen={showCreditModal}
        onClose={() => setShowCreditModal(false)}
        onSuccess={handleCreditPurchaseSuccess}
        currentBalance={creditBalance}
      />

      {/* Credit Wall Modal - Freemium Monetization */}
      <CreditWallModal
        isOpen={showCreditWall}
        onClose={() => setShowCreditWall(false)}
        onUnlock={handleUnlockContent}
        currentBalance={creditBalance}
        storyTitle={getStoryTitle()}
        previewContent={getPreviewContent()}
        totalChapters={chapters.length}
        totalWords={getTotalWords()}
        onBalanceRefresh={handleCreditBalanceRefresh}
      />

      {/* Completion Celebration */}
      <CompletionCelebration
        isVisible={showCelebration}
        useTaylorSwiftThemes={useTaylorSwiftThemes}
        chaptersGenerated={(enableStreamingGeneration ? streaming.chapters : chapters).length}
        onDownload={handleSave}
        onShare={handleShare}
        onClose={() => setShowCelebration(false)}
        renderContinueEditingButton={
          () => (
            <Button
              onClick={() => setShowCelebration(false)}
              variant="outline"
              size="lg"
              className="w-full mt-2 rounded-full border-2 border-blue-400 text-blue-700 hover:bg-blue-50 flex items-center justify-center gap-2"
            >
              <Pencil className="h-5 w-5 mr-2" />
              Continue Editing
            </Button>
          )
        }
      />

      {/* Phase 1E: Book-Style Reading Interface */}
      {showBookReader && chapters.length > 0 && (
        <div className="fixed inset-0 z-50">
          <BookReader
            chapters={enableStreamingGeneration ? streaming.chapters : chapters}
            useTaylorSwiftThemes={useTaylorSwiftThemes}
            onClose={() => setShowBookReader(false)}
            initialChapter={0}
          />
        </div>
      )}
    </div>
  );
};
