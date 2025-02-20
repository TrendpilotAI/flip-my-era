import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Book, Loader2 } from "lucide-react";
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
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const { toast } = useToast();
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('RUNWARE_API_KEY') || "");
  const [showApiKeyInput, setShowApiKeyInput] = useState(() => !localStorage.getItem('RUNWARE_API_KEY'));

  const handleSaveKey = () => {
    if (apiKey) {
      localStorage.setItem('RUNWARE_API_KEY', apiKey);
      setShowApiKeyInput(false);
      toast({
        title: "API Key Saved",
        description: "Your Runware API key has been saved successfully.",
      });
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
      title: "Creating your ebook...",
      description: "Generating chapters and illustrations...",
    });

    try {
      const chapterPrompt = `Based on this story premise:\n\n${originalStory}\n\nGenerate 5 short, hilarious chapters that expand this into a novella. Each chapter should be 2-3 paragraphs long. Include chapter titles. Keep the same humorous tone. Format in markdown with # for chapter titles.`;
      
      const chaptersContent = await generateStoryWithGroq(chapterPrompt, undefined);
      if (!chaptersContent) throw new Error("Failed to generate chapters");

      const chapterSections = chaptersContent.split(/(?=# )/g).filter(Boolean);
      
      const runwareService = new RunwareService(apiKey);

      const processedChapters: Chapter[] = [];
      for (const section of chapterSections) {
        const titleMatch = section.match(/# (.*)\n/);
        const title = titleMatch ? titleMatch[1] : "Untitled Chapter";
        const content = section.replace(/# .*\n/, "").trim();

        try {
          const illustration = await runwareService.generateImage({
            positivePrompt: `Cute, cartoonish illustration for book chapter: ${title}. Based on the content: ${content.substring(0, 100)}... Style: fun, whimsical, colorful, digital art`,
            numberResults: 1,
            outputFormat: "WEBP",
          });

          processedChapters.push({
            title,
            content,
            imageUrl: illustration.imageURL,
          });
        } catch (error) {
          console.error("Failed to generate image for chapter:", error);
          processedChapters.push({ title, content });
        }
      }

      setChapters(processedChapters);
      loadingToast.dismiss();
      toast({
        title: "Ebook Created!",
        description: "Your hilarious ebook is ready to read!",
      });
    } catch (error) {
      console.error("Error generating ebook:", error);
      toast({
        title: "Error",
        description: "Failed to generate the ebook. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
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

      <Button
        onClick={generateChapters}
        disabled={isGenerating || !apiKey}
        className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white px-8 py-4 rounded-lg font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
      >
        {isGenerating ? (
          <>
            <Loader2 className="h-6 w-6 animate-spin" />
            Creating Your Ebook...
          </>
        ) : (
          <>
            <Book className="h-6 w-6" />
            Create an Ebook
          </>
        )}
      </Button>

      {chapters.length > 0 && (
        <div className="space-y-12">
          {chapters.map((chapter, index) => (
            <div
              key={index}
              className="bg-white/90 backdrop-blur-sm rounded-lg p-6 space-y-6 animate-fadeIn"
              style={{ animationDelay: `${index * 200}ms` }}
            >
              <h2 className="text-2xl font-bold text-gray-900">{chapter.title}</h2>
              {chapter.imageUrl && (
                <img
                  src={chapter.imageUrl}
                  alt={`Illustration for ${chapter.title}`}
                  className="w-full h-auto rounded-lg shadow-lg mb-6"
                />
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
