
import { Book, ImageIcon, Loader2 } from "lucide-react";

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
}

export const ChapterView = ({ chapter, index, isGeneratingImages }: ChapterViewProps) => {
  return (
    <div
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
  );
};
