import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { RunwareService } from "@/utils/runware";
import { supabase } from "@/integrations/supabase/client";
import { generateWithGroq } from "@/utils/groq";
import { ChapterView } from "./ebook/ChapterView";
import { ActionButtons } from "./ebook/ActionButtons";
import { GenerateButton } from "./ebook/GenerateButton";
import { Button } from "@/components/ui/button";
import { Book, Download, Loader2 } from "lucide-react";
import { generateChapters, generateImage } from "@/services/ai";

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
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [isGeneratingChapters, setIsGeneratingChapters] = useState(false);
  const [isGeneratingImages, setIsGeneratingImages] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [hasImages, setHasImages] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState<number | null>(null);

  const generateChaptersFromStory = async () => {
    setIsGeneratingChapters(true);
    
    try {
      // Use our AI service to generate chapters
      const generatedChapters = await generateChapters(originalStory, 3);
      
      // Map the generated chapters to our Chapter interface
      const formattedChapters: Chapter[] = generatedChapters.map((chapter, index) => ({
        title: chapter.title,
        content: chapter.content,
        id: `${storyId}-ch${index + 1}`
      }));
      
      setChapters(formattedChapters);
      
      toast({
        title: "Chapters Generated",
        description: "Your story has been transformed into an illustrated book format.",
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
      // Generate images for each chapter sequentially
      const updatedChapters = [...chapters];
      
      for (let i = 0; i < chapters.length; i++) {
        setCurrentImageIndex(i);
        const chapter = chapters[i];
        
        // Create a prompt based on the chapter content
        const imagePrompt = `Create a children's book illustration for a chapter titled "${chapter.title}". 
                            The illustration should be colorful, engaging, and appropriate for children.
                            Chapter content: ${chapter.content.substring(0, 300)}...`;
        
        try {
          // Use our AI service to generate an image
          const imageUrl = await generateImage({
            prompt: imagePrompt
          });
          
          // Update the chapter with the image URL
          updatedChapters[i] = {
            ...chapter,
            imageUrl
          };
          
          // Update chapters state to show progress
          setChapters([...updatedChapters]);
        } catch (imageError) {
          console.error(`Error generating image for chapter ${i + 1}:`, imageError);
          // Continue with next chapter even if one fails
        }
      }
      
      setHasImages(true);
      setCurrentImageIndex(null);
      
      toast({
        title: "Images Generated",
        description: "Beautiful illustrations have been created for your story.",
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
      {chapters.length === 0 ? (
        <div className="bg-white/90 backdrop-blur-sm rounded-lg p-8 text-center space-y-6">
          <Book className="h-16 w-16 mx-auto text-primary/80" />
          <h3 className="text-xl font-semibold text-gray-800">
            Transform Your Story into an Illustrated Book
          </h3>
          <p className="text-gray-600 max-w-md mx-auto">
            Our AI will transform your story into a beautifully illustrated children's book with multiple chapters.
          </p>
          <GenerateButton 
            type="chapters" 
            onClick={generateChaptersFromStory} 
            isGenerating={isGeneratingChapters} 
          />
        </div>
      ) : (
        <div className="space-y-8">
          <GenerateButton 
            type="images" 
            onClick={generateImagesForChapters} 
            isGenerating={isGeneratingImages}
            hasImages={hasImages}
          />
          
          <div className="space-y-12">
            {chapters.map((chapter, index) => (
              <ChapterView 
                key={chapter.id || index}
                chapter={chapter}
                index={index}
                isGeneratingImages={isGeneratingImages && (currentImageIndex === index || currentImageIndex === null)}
              />
            ))}
          </div>
          
          <ActionButtons 
            onSave={handleSave}
            onPublish={handlePublish}
            onShare={handleShare}
            isPublishing={isPublishing}
          />
        </div>
      )}
    </div>
  );
};
