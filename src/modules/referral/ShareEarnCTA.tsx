import { useState } from 'react';
import { Card, CardContent } from '@/modules/shared/components/ui/card';
import { Button } from '@/modules/shared/components/ui/button';
import { Copy, Check, Gift, Sparkles } from 'lucide-react';
import { useReferral } from './ReferralSystem';
import { ShareButtons } from '@/modules/sharing/ShareButtons';
import { useToast } from '@/modules/shared/components/ui/use-toast';

interface ShareEarnCTAProps {
  ebookId?: string;
  ebookTitle?: string;
  era?: string;
  className?: string;
}

export const ShareEarnCTA = ({ ebookId, ebookTitle, era, className = '' }: ShareEarnCTAProps) => {
  const { referralLink, stats } = useReferral();
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const ebookShareUrl = ebookId
    ? `${window.location.origin}/ebook/${ebookId}/preview`
    : referralLink || window.location.origin;

  const handleCopyReferral = async () => {
    if (!referralLink) return;
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      toast({ title: 'Referral link copied!' });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: 'Failed to copy', variant: 'destructive' });
    }
  };

  return (
    <Card className={`border-primary/20 bg-gradient-to-br from-primary/5 to-purple-500/5 ${className}`}>
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-lg">Share & Earn Credits</h3>
        </div>

        <p className="text-sm text-muted-foreground">
          Share your ebook and invite friends. You both get 1 bonus credit when they sign up!
        </p>

        {/* Share the ebook */}
        {ebookId && (
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase text-muted-foreground">Share this ebook</p>
            <ShareButtons
              url={ebookShareUrl}
              title={ebookTitle || 'My FlipMyEra Ebook'}
              era={era}
            />
          </div>
        )}

        {/* Referral link */}
        {referralLink && (
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase text-muted-foreground">Your referral link</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-muted px-3 py-2 rounded text-xs truncate">
                {referralLink}
              </code>
              <Button variant="outline" size="sm" onClick={handleCopyReferral}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        )}

        {/* Credits earned */}
        {stats.earnedCredits > 0 && (
          <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
            <Gift className="h-4 w-4" />
            <span>You've earned {stats.earnedCredits} credit{stats.earnedCredits !== 1 ? 's' : ''} from referrals!</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ShareEarnCTA;
