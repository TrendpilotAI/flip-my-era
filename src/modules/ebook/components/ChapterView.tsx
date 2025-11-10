
import { Book, ImageIcon, Loader2, Lock } from "lucide-react";
import { Button } from '@/modules/shared/components/ui/button';

interface Chapter {
  title: string;
  content: string;
  imageUrl?: string;
  id?: string;
}

interface ChapterViewProps {
  chapter: Chapter;
  index: number;
  isGeneratingImages: boolean;
  isLocked?: boolean;
  onRequestUnlock?: () => void;
}

export const ChapterView = ({ chapter, index, isGeneratingImages, isLocked = false, onRequestUnlock }: ChapterViewProps) => {
  const paragraphs = chapter.content.split('\n\n');
  const visibleParagraphs = isLocked ? paragraphs.slice(0, 1) : paragraphs;

  return (
    <div
      className="bg-white/90 backdrop-blur-sm rounded-lg p-8 space-y-6 animate-fadeIn"
      style={{ animationDelay: `${index * 200}ms` }}
      role="article"
      aria-label={`Chapter ${index + 1}: ${chapter.title}`}
    >
      <h2 className="text-2xl font-bold text-gray-900 mb-6">{chapter.title}</h2>
      <div className="prose prose-lg prose-pink max-w-none space-y-6">
        {visibleParagraphs.map((paragraph, pIndex) => (
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
      {chapter.imageUrl && !isLocked ? (
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
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" role="img" aria-label="Loading illustration" />
          ) : (
            <ImageIcon className="h-8 w-8 text-gray-400" role="img" aria-label="Image placeholder" />
          )}
        </div>
      )}

      {isLocked && (
        <div className="mt-6 p-5 rounded-lg border border-dashed border-orange-300 bg-orange-50 flex flex-col gap-3">
          <div className="flex items-center gap-2 text-orange-700">
            <Lock className="h-5 w-5" />
            <span className="font-semibold">Unlock the full chapter</span>
          </div>
          <p className="text-sm text-orange-600">
            Use a credit to reveal the remaining story, download options, and premium illustrations.
          </p>
          <Button
            variant="secondary"
            className="self-start bg-orange-500 hover:bg-orange-600 text-white"
            onClick={() => onRequestUnlock?.()}
          >
            Unlock story
          </Button>
        </div>
      )}
    </div>
  );
};
