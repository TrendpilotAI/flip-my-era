
import { useState } from 'react';
import { Button } from '@/modules/shared/components/ui/button';
import { Save, Globe, Share2, Download } from "lucide-react";
import { DownloadShareModal } from '@/modules/shared/components/DownloadShareModal';
import { useToast } from '@/modules/shared/hooks/use-toast';
import type { Chapter } from '@/modules/shared/utils/downloadUtils';

interface ActionButtonsProps {
  onSave?: () => void;
  onPublish?: () => void;
  onShare?: () => void;
  isPublishing?: boolean;
  // New props for enhanced functionality
  content?: {
    id: string;
    title: string;
    content: string | Chapter[];
    type: 'story' | 'ebook';
    author?: string;
    url?: string;
    imageUrl?: string;
  };
  showDownloadShare?: boolean;
  isLocked?: boolean;
  onLockedAction?: () => void;
}

export const ActionButtons = ({ 
  onSave, 
  onPublish, 
  onShare, 
  isPublishing = false,
  content,
  showDownloadShare = true,
  isLocked = false,
  onLockedAction,
}: ActionButtonsProps) => {
  const { toast } = useToast();
  const [showModal, setShowModal] = useState(false);

  const handleLockedAction = () => {
    if (onLockedAction) {
      onLockedAction();
    } else {
      toast({
        title: "Unlock required",
        description: "Use a credit to unlock your story before sharing or downloading.",
        variant: "default",
      });
    }
  };

  const handleSave = () => {
    if (isLocked) {
      handleLockedAction();
      return;
    }

    if (onSave) {
      onSave();
    } else if (content && showDownloadShare) {
      setShowModal(true);
    } else {
      toast({
        title: "Save Feature",
        description: "Save functionality will be implemented soon.",
      });
    }
  };

  const handlePublish = () => {
    if (isLocked) {
      handleLockedAction();
      return;
    }

    if (onPublish) {
      onPublish();
    } else {
      toast({
        title: "Publish Feature",
        description: "Publishing functionality will be implemented soon.",
      });
    }
  };

  const handleShare = () => {
    if (isLocked) {
      handleLockedAction();
      return;
    }

    if (onShare) {
      onShare();
    } else if (content && showDownloadShare) {
      setShowModal(true);
    } else {
      toast({
        title: "Share Feature",
        description: "Sharing functionality will be implemented soon.",
      });
    }
  };

  return (
    <>
      <div className="flex flex-wrap gap-4 mt-8">
        {showDownloadShare && content ? (
          <Button
            onClick={() => {
              if (isLocked) {
                handleLockedAction();
                return;
              }
              setShowModal(true);
            }}
            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
          >
            <Download className="h-5 w-5 mr-2" />
            Download & Share
          </Button>
        ) : (
          <>
            <Button
              onClick={handleSave}
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
            >
              <Save className="h-5 w-5 mr-2" />
              Save as PDF
            </Button>
            <Button
              onClick={handleShare}
              className="flex-1 bg-green-500 hover:bg-green-600 text-white"
            >
              <Share2 className="h-5 w-5 mr-2" />
              Share Story
            </Button>
          </>
        )}
        
        <Button
          onClick={handlePublish}
          disabled={isPublishing}
          className="flex-1 bg-purple-500 hover:bg-purple-600 text-white"
        >
          <Globe className="h-5 w-5 mr-2" />
          {isPublishing ? "Publishing..." : "Publish Online"}
        </Button>
      </div>

      {content && showDownloadShare && (
        <DownloadShareModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          content={content}
        />
      )}
    </>
  );
};
