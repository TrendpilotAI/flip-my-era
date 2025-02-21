
import { Button } from "@/components/ui/button";
import { Save, Globe, Share2 } from "lucide-react";

interface ActionButtonsProps {
  onSave: () => void;
  onPublish: () => void;
  onShare: () => void;
  isPublishing: boolean;
}

export const ActionButtons = ({ onSave, onPublish, onShare, isPublishing }: ActionButtonsProps) => {
  return (
    <div className="flex flex-wrap gap-4 mt-8">
      <Button
        onClick={onSave}
        className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
      >
        <Save className="h-5 w-5 mr-2" />
        Save as PDF
      </Button>
      <Button
        onClick={onPublish}
        disabled={isPublishing}
        className="flex-1 bg-purple-500 hover:bg-purple-600 text-white"
      >
        <Globe className="h-5 w-5 mr-2" />
        {isPublishing ? "Publishing..." : "Publish Online"}
      </Button>
      <Button
        onClick={onShare}
        className="flex-1 bg-green-500 hover:bg-green-600 text-white"
      >
        <Share2 className="h-5 w-5 mr-2" />
        Share Story
      </Button>
    </div>
  );
};
