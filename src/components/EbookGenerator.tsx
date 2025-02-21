import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Book, Loader2, Image as ImageIcon, Share2, Save, Globe } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";
import { RunwareService } from "@/utils/runware";
import { supabase } from "@/integrations/supabase/client";
import { generateWithDeepseek } from "@/utils/deepseek";
import { generateWithGroq } from "@/utils/groq";

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
  const [generatedPrompt, setGeneratedPrompt] = useState("");
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
    content.innerHTML = `
      <h1>Original Story</h1>
      ${originalStory}
      ${chapters.map(chapter => `
        <h2>${chapter.title}</h2>
        ${chapter.content}
        ${chapter.imageUrl ? `<img src="${chapter.imageUrl}" alt="${chapter.title}" />` : ''}
      `).join('')}
    `;

    try {
      const blob = new Blob([content.innerHTML], { type: 'text/html' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'story.html';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Story Saved!",
        description: "Your story has been downloaded successfully.",
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
        <Button
          onClick={generateChapters}
          disabled={isGenerating}
          className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              Generating Chapters...
            </>
          ) : (
            <>
              <Book className="h-6 w-6 mr-2" />
              Generate Chapters
            </>
          )}
        </Button>
      ) : (
        <>
          <Button
            onClick={generateImages}
            disabled={isGeneratingImages || chapters.some(chapter => chapter.imageUrl)}
            className="w-full bg-gradient-to-r from-green-500 to-blue-500 text-white mb-8"
          >
            {isGeneratingImages ? (
              <>
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                Generating Illustrations...
              </>
            ) : chapters.some(chapter => chapter.imageUrl) ? (
              "Images Generated!"
            ) : (
              <>
                <ImageIcon className="h-6 w-6 mr-2" />
                Generate Images for All Chapters
              </>
            )}
          </Button>

          {chapters.map((chapter, index) => (
            <div
              key={index}
              className="bg-white/90 backdrop-blur-sm rounded-lg p-8 space-y-6 animate-fadeIn"
              style={{ animationDelay: `${index * 200}ms` }}
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-6">{chapter.title}</h2>
              <div className="prose prose-lg prose-pink max-w-none space-y-6">
                {chapter.content.split('\n\n').map((paragraph, pIndex) => (
                  <p key={pIndex} className="leading-relaxed">
                    {paragraph.startsWith('"') ? (
                      <span className="text-blue-600 italic">
                        {paragraph}
                      </span>
                    ) : (
                      paragraph
                    )}
                  </p>
                ))}
              </div>
              {chapter.imageUrl ? (
                <div className="mt-8">
                  <img
                    src={chapter.imageUrl}
                    alt={`Illustration for ${chapter.title}`}
                    className="w-full h-auto rounded-lg shadow-lg"
                  />
                </div>
              ) : (
                <div className="w-full h-48 bg-gray-200 rounded-lg flex items-center justify-center mt-8">
                  {isGeneratingImages ? (
                    <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                  ) : (
                    <ImageIcon className="h-8 w-8 text-gray-400" />
                  )}
                </div>
              )}
            </div>
          ))}

          <div className="flex flex-wrap gap-4 mt-8">
            <Button
              onClick={handleSaveAsPDF}
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
            >
              <Save className="h-5 w-5 mr-2" />
              Save as PDF
            </Button>
            <Button
              onClick={handlePublish}
              disabled={isPublishing}
              className="flex-1 bg-purple-500 hover:bg-purple-600 text-white"
            >
              <Globe className="h-5 w-5 mr-2" />
              {isPublishing ? "Publishing..." : "Publish Online"}
            </Button>
            <Button
              onClick={handleShare}
              className="flex-1 bg-green-500 hover:bg-green-600 text-white"
            >
              <Share2 className="h-5 w-5 mr-2" />
              Share Story
            </Button>
          </div>
        </>
      )}
    </div>
  );
};
