import { useState } from 'react';
import { Button } from '@/modules/shared/components/ui/button';
import { Share2, Copy, Check } from 'lucide-react';
import { useToast } from '@/modules/shared/components/ui/use-toast';

interface ShareButtonsProps {
  url: string;
  title: string;
  era?: string;
  className?: string;
}

export const ShareButtons = ({ url, title, era, className = '' }: ShareButtonsProps) => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const shareText = era
    ? `Check out my ${era} ebook on FlipMyEra! 🎵`
    : `Check out "${title}" on FlipMyEra! 🎵`;

  const encodedUrl = encodeURIComponent(url);
  const encodedText = encodeURIComponent(shareText);

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, text: shareText, url });
        return true;
      } catch {
        // User cancelled or error — fall through
      }
    }
    return false;
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast({ title: 'Link copied!', description: 'Share it with your friends.' });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: 'Failed to copy', variant: 'destructive' });
    }
  };

  const handleTwitterShare = async () => {
    if (await handleNativeShare()) return;
    window.open(
      `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
      '_blank',
      'noopener,noreferrer'
    );
  };

  const handleFacebookShare = async () => {
    if (await handleNativeShare()) return;
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      '_blank',
      'noopener,noreferrer'
    );
  };

  const handleWhatsAppShare = async () => {
    if (await handleNativeShare()) return;
    window.open(
      `https://wa.me/?text=${encodedText}%20${encodedUrl}`,
      '_blank',
      'noopener,noreferrer'
    );
  };

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      <Button variant="outline" size="sm" onClick={handleTwitterShare} aria-label="Share on Twitter">
        <Share2 className="h-4 w-4 mr-1" />
        Twitter/X
      </Button>
      <Button variant="outline" size="sm" onClick={handleFacebookShare} aria-label="Share on Facebook">
        <Share2 className="h-4 w-4 mr-1" />
        Facebook
      </Button>
      <Button variant="outline" size="sm" onClick={handleWhatsAppShare} aria-label="Share on WhatsApp">
        <Share2 className="h-4 w-4 mr-1" />
        WhatsApp
      </Button>
      <Button variant="outline" size="sm" onClick={handleCopyLink} aria-label="Copy link">
        {copied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
        {copied ? 'Copied!' : 'Copy Link'}
      </Button>
    </div>
  );
};

export default ShareButtons;
