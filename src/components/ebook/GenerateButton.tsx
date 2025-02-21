
import { Button } from "@/components/ui/button";
import { Book, Loader2, ImageIcon } from "lucide-react";

interface GenerateButtonProps {
  type: 'chapters' | 'images';
  onClick: () => void;
  isGenerating: boolean;
  hasImages?: boolean;
}

export const GenerateButton = ({ type, onClick, isGenerating, hasImages }: GenerateButtonProps) => {
  if (type === 'chapters') {
    return (
      <Button
        onClick={onClick}
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
    );
  }

  return (
    <Button
      onClick={onClick}
      disabled={isGenerating || hasImages}
      className="w-full bg-gradient-to-r from-green-500 to-blue-500 text-white mb-8"
    >
      {isGenerating ? (
        <>
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          Generating Illustrations...
        </>
      ) : hasImages ? (
        "Images Generated!"
      ) : (
        <>
          <ImageIcon className="h-6 w-6 mr-2" />
          Generate Images for All Chapters
        </>
      )}
    </Button>
  );
};
