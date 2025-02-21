
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { RunwareService } from "@/utils/runware";
import { supabase } from "@/integrations/supabase/client";
import { generateWithGroq } from "@/utils/groq";
import { ChapterView } from "./ebook/ChapterView";
import { ActionButtons } from "./ebook/ActionButtons";
import { GenerateButton } from "./ebook/GenerateButton";

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
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingImages, setIsGeneratingImages] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const { toast } = useToast();
  const [publishedUrl, setPublishedUrl] = useState("");

  const saveChapter = async (chapter: Chapter, index: number) => {
    const { data, error } = await supabase
      .from('chapters')
      .insert({
        story_id: storyId,
        title: chapter.title,
        content: chapter.content,
        chapter_number: index + 1
      })
      .select()
      .single();

    if (error) {
      console.error("Error saving chapter:", error);
      return null;
    }
    return data.id;
  };

  const saveChapterImage = async (chapterId: string, imageUrl: string, prompt: string) => {
    const { error } = await supabase
      .from('chapter_images')
      .insert({
        chapter_id: chapterId,
        image_url: imageUrl,
        prompt_used: prompt
      });

    if (error) {
      console.error("Error saving chapter image:", error);
    }
  };

  const generateChapters = async () => {
    if (!localStorage.getItem('GROQ_API_KEY')) {
      toast({
        title: "API Key Required",
        description: "Please configure your Groq API key in settings first.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    const loadingToast = toast({
      title: "Creating your ebook chapters...",
      description: "Generating the story content with Groq...",
    });

    try {
      const prompt = `Based on this story premise:\n\n${originalStory}\n\nGenerate 5 short, hilarious chapters that expand this into a novella. Each chapter should be 2-3 paragraphs long. Include chapter titles. Keep the same humorous tone. Format in markdown with # for chapter titles.`;
      const chaptersContent = await generateWithGroq(prompt);
      if (!chaptersContent) throw new Error("Failed to generate chapters");

      const chapterSections = chaptersContent.split(/(?=# )/g).filter(Boolean);
      
      const initialChapters = chapterSections.map(section => {
        const titleMatch = section.match(/# (.*)\n/);
        const title = titleMatch ? titleMatch[1] : "Untitled Chapter";
        const content = section.replace(/# .*\n/, "").trim();
        return { title, content };
      });

      const chaptersWithIds = await Promise.all(
        initialChapters.map(async (chapter, index) => {
          const chapterId = await saveChapter(chapter, index);
          return {
            ...chapter,
            id: chapterId
          };
        })
      );

      setChapters(chaptersWithIds);
      loadingToast.dismiss();
      toast({
        title: "Chapters Created!",
        description: "Your ebook chapters are ready. Click 'Generate Images' to add illustrations.",
      });
    } catch (error) {
      console.error("Error generating chapters:", error);
      toast({
        title: "Error",
        description: "Failed to generate the chapters. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const generateImages = async () => {
    if (!chapters.length) return;

    const runwareKey = localStorage.getItem('RUNWARE_API_KEY');
    if (!runwareKey) {
      toast({
        title: "API Key Required",
        description: "Please configure your Runware API key in settings first.",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingImages(true);
    const runwareService = new RunwareService(runwareKey);
    const updatedChapters = [...chapters];

    for (let i = 0; i < chapters.length; i++) {
      const chapter = chapters[i];
      const loadingToast = toast({
        title: `Generating illustration for Chapter ${i + 1}`,
        description: `Creating artwork for: ${chapter.title}`,
      });

      try {
        const basePrompt = "Create a photo-realistic, vibrant and happy scene with subtle whimsical elements that spark joy and escapism. The image should be cinematic, well-lit, with rich details and emotional depth.";
        const scenePrompt = `${basePrompt} Scene depicts: ${chapter.title}. Based on: ${chapter.content.substring(0, 150)}`;
        
        const illustration = await runwareService.generateImage({
          positivePrompt: scenePrompt,
          model: "flux:1@dev",
          numberResults: 1,
          outputFormat: "WEBP",
          CFGScale: 7.5,
          scheduler: "FlowMatchEulerDiscreteScheduler",
          strength: 0.85,
        });

        if (chapter.id) {
          await saveChapterImage(chapter.id, illustration.imageURL, scenePrompt);
        }

        updatedChapters[i] = {
          ...chapter,
          imageUrl: illustration.imageURL,
        };

        setChapters(updatedChapters);
        loadingToast.dismiss();
      } catch (error) {
        console.error("Failed to generate image for chapter:", error);
        toast({
          title: "Error",
          description: `Failed to generate image for Chapter ${i + 1}`,
          variant: "destructive",
        });
      }
    }

    setIsGeneratingImages(false);
    toast({
      title: "Ebook Complete!",
      description: "All chapters and illustrations have been generated!",
    });
  };

  const handleSaveAsPDF = async () => {
    const content = document.createElement('div');
    
    // Add CSS styles for PDF export
    const styles = `
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Dancing+Script:wght@400;700&display=swap');
        
        body {
          font-family: 'Inter', sans-serif;
          line-height: 1.6;
          max-width: 800px;
          margin: 0 auto;
          padding: 40px;
          color: #333;
        }
        
        h1 {
          font-size: 32px;
          font-weight: bold;
          text-align: center;
          margin: 40px 0;
          color: #8B5CF6;
          font-family: 'Inter', sans-serif;
          page-break-before: always;
          page-break-after: avoid;
        }
        
        h2 {
          font-size: 24px;
          font-weight: 600;
          margin: 30px 0;
          color: #7E69AB;
          page-break-before: always;
          page-break-after: avoid;
        }
        
        p {
          margin: 16px 0;
          text-align: justify;
          orphans: 3;
          widows: 3;
        }
        
        img {
          max-width: 100%;
          height: auto;
          margin: 20px auto;
          page-break-inside: avoid;
          border-radius: 8px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        
        .original-story {
          font-style: italic;
          color: #6B6B6B;
          margin: 30px 0;
          padding: 20px;
          border-left: 4px solid #D946EF;
          background-color: #fafafa;
        }
        
        .chapter {
          margin-bottom: 40px;
          page-break-before: always;
        }
        
        .book-title {
          text-align: center;
          font-size: 48px;
          font-weight: bold;
          color: #D946EF;
          margin: 60px 0;
          font-family: 'Dancing Script', cursive;
        }
        
        .cover-page {
          height: 100vh;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          text-align: center;
          page-break-after: always;
        }
      </style>
    `;

    content.innerHTML = `
      ${styles}
      <div class="cover-page">
        <h1 class="book-title">FlipMyEra Story</h1>
        <p style="font-family: 'Dancing Script', cursive; font-size: 24px; color: #7E69AB;">
          Your alternate timeline adventure
        </p>
      </div>
      
      <div class="original-story">
        <h2>Original Timeline</h2>
        <p>${originalStory}</p>
      </div>
      
      ${chapters.map((chapter, index) => `
        <div class="chapter">
          <h2>${chapter.title}</h2>
          ${chapter.content.split('\n\n').map(paragraph => `
            <p>${paragraph}</p>
          `).join('')}
          ${chapter.imageUrl ? `
            <img src="${chapter.imageUrl}" alt="${chapter.title}" style="page-break-inside: avoid;" />
          ` : ''}
        </div>
      `).join('')}
    `;

    try {
      const blob = new Blob([content.innerHTML], { type: 'text/html' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'FlipMyEra-Story.html';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Story Saved!",
        description: "Your story has been downloaded as a beautifully formatted document. Open it in a web browser and use the print function to save as PDF.",
      });
    } catch (error) {
      console.error("Error saving story:", error);
      toast({
        title: "Error",
        description: "Failed to save the story. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handlePublish = async () => {
    setIsPublishing(true);
    try {
      const jsonChapters = chapters.map(chapter => ({
        title: chapter.title,
        content: chapter.content,
        imageUrl: chapter.imageUrl || null,
        id: chapter.id || null
      }));

      const { data, error } = await supabase
        .from('published_stories')
        .insert({
          story_id: storyId,
          original_story: originalStory,
          chapters: jsonChapters
        })
        .select()
        .single();

      if (error) throw error;

      const publishUrl = `${window.location.origin}/published/${data.id}`;
      setPublishedUrl(publishUrl);

      toast({
        title: "Story Published!",
        description: "Your story is now available online.",
      });
    } catch (error) {
      console.error("Error publishing story:", error);
      toast({
        title: "Error",
        description: "Failed to publish the story. Please try again.",
        variant: "destructive",
      });
    }
    setIsPublishing(false);
  };

  const handleShare = async () => {
    const shareUrl = publishedUrl || window.location.href;
    const shareText = `Check out my alternate universe story: ${originalStory.substring(0, 100)}...`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My Alternate Universe Story',
          text: shareText,
          url: shareUrl,
        });
      } catch (error) {
        console.error("Error sharing:", error);
      }
    } else {
      navigator.clipboard.writeText(`${shareText}\n\n${shareUrl}`);
      toast({
        title: "Copied to clipboard!",
        description: "Share the link with your friends!",
      });
    }
  };

  return (
    <div className="space-y-8">
      {!chapters.length ? (
        <GenerateButton
          type="chapters"
          onClick={generateChapters}
          isGenerating={isGenerating}
        />
      ) : (
        <>
          <GenerateButton
            type="images"
            onClick={generateImages}
            isGenerating={isGeneratingImages}
            hasImages={chapters.some(chapter => chapter.imageUrl)}
          />

          {chapters.map((chapter, index) => (
            <ChapterView
              key={index}
              chapter={chapter}
              index={index}
              isGeneratingImages={isGeneratingImages}
            />
          ))}

          <ActionButtons
            onSave={handleSaveAsPDF}
            onPublish={handlePublish}
            onShare={handleShare}
            isPublishing={isPublishing}
          />
        </>
      )}
    </div>
  );
};
