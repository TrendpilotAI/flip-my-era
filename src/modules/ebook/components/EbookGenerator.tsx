import { useState } from "react";
import { useToast } from '@/modules/shared/hooks/use-toast';
import { supabase } from '@/core/integrations/supabase/client';
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
import { cn } from '@/core/lib/utils';
import { generateChapters, generateTaylorSwiftChapters, generateEbookIllustration, generateTaylorSwiftIllustration } from "@/modules/story/services/ai";
import { samcartClient } from '@/core/integrations/samcart/client';
import { CreditBalance } from "@/modules/user/components/CreditBalance";
import { CreditPurchaseModal } from "@/modules/user/components/CreditPurchaseModal";
import { useAuth } from "@clerk/clerk-react";
import { Alert, AlertDescription } from '@/modules/shared/components/ui/alert';
import { useStreamingGeneration } from "@/modules/story/hooks/useStreamingGeneration";
import {
  TaylorSwiftTheme,
  StoryFormat,
  taylorSwiftThemes,
  storyFormats
} from "@/modules/story/utils/storyPrompts";

interface Chapter {
  title: string;
  content: string;
  imageUrl?: string;
  id?: string;
}

interface EbookGeneratorProps {
  originalStory: string;
  storyId: string;
}

export const EbookGenerator = ({ originalStory, storyId }: EbookGeneratorProps) => {
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
  
  // Initialize streaming generation hook
  const streaming = useStreamingGeneration();

  // Credit validation function
  const validateCredits = async (creditsRequired: number = 1): Promise<{ success: boolean; transactionId?: string; bypassCredits?: boolean }> => {
    if (!isSignedIn) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to generate ebooks.",
        variant: "destructive",
      });
      return { success: false };
    }

    try {
      const token = await getToken({ template: 'supabase' });
      
      const { data, error } = await supabase.functions.invoke('credits-validate', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: {
          credits_required: creditsRequired,
          story_type: 'ebook',
          generation_id: storyId,
        },
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
          return { success: true, transactionId: transaction_id, bypassCredits: bypass_credits };
        } else {
          // Show credit purchase modal
          setShowCreditModal(true);
          toast({
            title: "Insufficient Credits",
            description: `You need ${creditsRequired} credit(s) to generate this ebook. Current balance: ${current_balance}`,
            variant: "destructive",
          });
          return { success: false };
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
    // Validate credits before generation
    const creditValidation = await validateCredits(1);
    if (!creditValidation.success) {
      return;
    }

    // Start streaming generation
    streaming.startGeneration({
      originalStory,
      useTaylorSwiftThemes,
      selectedTheme,
      selectedFormat,
      numChapters: storyFormats[selectedFormat].chapters,
      onChapterComplete: (chapter) => {
        // Chapter completed callback
        console.log('Chapter completed:', chapter.title);
      },
      onComplete: async (generatedChapters) => {
        // All chapters completed
        setChapters(generatedChapters);
        
        // Show celebration
        setShowCelebration(true);
        
        // Create ebook generation record in database
        if (creditValidation.transactionId) {
          try {
            const storyType = useTaylorSwiftThemes ? `taylor-swift-${selectedTheme}-${selectedFormat}` : 'ebook';
            const { error: ebookError } = await supabase
              .from('ebook_generations')
              .insert({
                user_id: isSignedIn ? (await getToken({ template: 'supabase' })) : null,
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
              });

            if (ebookError) {
              console.error('Error creating ebook generation record:', ebookError);
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
    // Validate credits before generation
    const creditValidation = await validateCredits(1);
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
          const { error: ebookError } = await supabase
            .from('ebook_generations')
            .insert({
              user_id: isSignedIn ? (await getToken({ template: 'supabase' })) : null,
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
            });

          if (ebookError) {
            console.error('Error creating ebook generation record:', ebookError);
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

  const handleSave = () => {
    toast({
      title: "Saving PDF",
      description: "Your illustrated story is being prepared for download.",
    });
    
    // In a real implementation, this would generate and download a PDF
    setTimeout(() => {
      toast({
        title: "PDF Ready",
        description: "Your illustrated story has been saved as a PDF.",
      });
    }, 2000);
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
                  Cost: 1 credit per ebook generation
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
          <div className="space-y-4">
            {/* Read Book Button - Phase 1E Enhancement */}
            <div className="text-center">
              <Button
                size="lg"
                className={cn(
                  "w-full max-w-md mx-auto text-lg font-semibold py-4 transition-all duration-300",
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
              <p className="text-sm text-gray-600 mt-2">
                Experience your story with our immersive book-style reader
              </p>
            </div>
            
            <ActionButtons
              onSave={handleSave}
              onPublish={handlePublish}
              onShare={handleShare}
              isPublishing={isPublishing}
            />
          </div>
          <Button
            className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white"
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
      )}

      {/* Credit Purchase Modal */}
      <CreditPurchaseModal
        isOpen={showCreditModal}
        onClose={() => setShowCreditModal(false)}
        onSuccess={handleCreditPurchaseSuccess}
        currentBalance={creditBalance}
      />

      {/* Completion Celebration */}
      <CompletionCelebration
        isVisible={showCelebration}
        useTaylorSwiftThemes={useTaylorSwiftThemes}
        chaptersGenerated={(enableStreamingGeneration ? streaming.chapters : chapters).length}
        onDownload={handleSave}
        onShare={handleShare}
        onClose={() => setShowCelebration(false)}
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
