
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Book, Loader2, Image as ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { generateStoryWithGroq } from "@/utils/groq";
import ReactMarkdown from "react-markdown";
import { RunwareService } from "@/utils/runware";
import { Input } from "@/components/ui/input";

interface Chapter {
  title: string;
  content: string;
  imageUrl?: string;
}

interface EbookGeneratorProps {
  originalStory: string;
}

export const EbookGenerator = ({ originalStory }: EbookGeneratorProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingImages, setIsGeneratingImages] = useState(false);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const { toast } = useToast();
  const [apiKey, setApiKey] = useState("");
  const [showApiKeyInput, setShowApiKeyInput] = useState(true);
  const [generatedPrompt, setGeneratedPrompt] = useState("");

  const handleSaveKey = () => {
    if (apiKey) {
      localStorage.setItem('RUNWARE_API_KEY', apiKey);
      setShowApiKeyInput(false);
      toast({
        title: "API Key Saved",
        description: "Your Runware API key has been saved successfully.",
      });
      
      // Generate the prompt after saving the API key
      const prompt = `Based on this story premise:\n\n${originalStory}\n\nGenerate 5 short, hilarious chapters that expand this into a novella. Each chapter should be 2-3 paragraphs long. Include chapter titles. Keep the same humorous tone. Format in markdown with # for chapter titles.`;
      setGeneratedPrompt(prompt);
    }
  };

  const generateChapters = async () => {
    if (!apiKey) {
      toast({
        title: "API Key Required",
        description: "Please enter your Runware API key first.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    const loadingToast = toast({
      title: "Creating your ebook chapters...",
      description: "Generating the story content...",
    });

    try {
      const chaptersContent = await generateStoryWithGroq(generatedPrompt, undefined);
      if (!chaptersContent) throw new Error("Failed to generate chapters");

      const chapterSections = chaptersContent.split(/(?=# )/g).filter(Boolean);
      
      const initialChapters = chapterSections.map(section => {
        const titleMatch = section.match(/# (.*)\n/);
        const title = titleMatch ? titleMatch[1] : "Untitled Chapter";
        const content = section.replace(/# .*\n/, "").trim();
        return { title, content };
      });

      setChapters(initialChapters);
      loadingToast.dismiss();
      toast({
        title: "Chapters Created!",
        description: "Now we can generate illustrations for each chapter.",
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

    setIsGeneratingImages(true);
    const runwareService = new RunwareService(apiKey);
    const updatedChapters = [...chapters];

    for (let i = 0; i < chapters.length; i++) {
      const chapter = chapters[i];
      const loadingToast = toast({
        title: `Generating illustration for Chapter ${i + 1}`,
        description: `Creating artwork for: ${chapter.title}`,
      });

      try {
        const illustration = await runwareService.generateImage({
          positivePrompt: `Cute, cartoonish illustration for book chapter: ${chapter.title}. Based on the content: ${chapter.content.substring(0, 100)}... Style: fun, whimsical, colorful, digital art`,
          numberResults: 1,
          outputFormat: "WEBP",
        });

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

  return (
    <div className="space-y-8">
      {showApiKeyInput && (
        <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">First, Enter Your Runware API Key</h3>
          <p className="text-gray-600">To generate chapter illustrations, you'll need a Runware API key. This will be saved for future use.</p>
          <Input
            type="password"
            placeholder="Enter your Runware API key"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />
          <div className="flex flex-col gap-2">
            <Button
              onClick={handleSaveKey}
              disabled={!apiKey}
              className="w-full"
            >
              Save API Key
            </Button>
            <a
              href="https://runware.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-500 hover:underline text-center"
            >
              Get your Runware API key here
            </a>
          </div>
        </div>
      )}

      {generatedPrompt && !chapters.length && (
        <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Story Generation Prompt</h3>
          <div className="bg-gray-100 p-4 rounded-lg">
            <pre className="whitespace-pre-wrap text-sm">{generatedPrompt}</pre>
          </div>
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
        </div>
      )}

      {chapters.length > 0 && (
        <div className="space-y-6">
          {!chapters.some(chapter => chapter.imageUrl) && (
            <Button
              onClick={generateImages}
              disabled={isGeneratingImages}
              className="w-full bg-gradient-to-r from-green-500 to-blue-500 text-white mb-8"
            >
              {isGeneratingImages ? (
                <>
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  Generating Illustrations...
                </>
              ) : (
                <>
                  <ImageIcon className="h-6 w-6 mr-2" />
                  Generate Chapter Illustrations
                </>
              )}
            </Button>
          )}

          {chapters.map((chapter, index) => (
            <div
              key={index}
              className="bg-white/90 backdrop-blur-sm rounded-lg p-6 space-y-6 animate-fadeIn"
              style={{ animationDelay: `${index * 200}ms` }}
            >
              <h2 className="text-2xl font-bold text-gray-900">{chapter.title}</h2>
              {chapter.imageUrl ? (
                <img
                  src={chapter.imageUrl}
                  alt={`Illustration for ${chapter.title}`}
                  className="w-full h-auto rounded-lg shadow-lg mb-6"
                />
              ) : (
                <div className="w-full h-48 bg-gray-200 rounded-lg flex items-center justify-center mb-6">
                  {isGeneratingImages ? (
                    <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                  ) : (
                    <ImageIcon className="h-8 w-8 text-gray-400" />
                  )}
                </div>
              )}
              <div className="prose prose-lg prose-pink max-w-none">
                <ReactMarkdown>{chapter.content}</ReactMarkdown>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
