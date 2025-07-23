import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/modules/shared/components/ui/dialog';
import { Button } from '@/modules/shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shared/components/ui/card';
import { Badge } from '@/modules/shared/components/ui/badge';
import { useToast } from '@/modules/shared/hooks/use-toast';
import { useClerkAuth } from '@/modules/auth/contexts/ClerkAuthContext';
import { StripeCreditPurchaseModal } from '@/modules/user/components/StripeCreditPurchaseModal';
import { 
  BookOpen, 
  Lock, 
  Eye, 
  Coins, 
  Crown, 
  Check, 
  Star, 
  Zap,
  Sparkles
} from 'lucide-react';

interface CreditWallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUnlock: () => void;
  currentBalance: number;
  storyTitle: string;
  previewContent: string;
  totalChapters: number;
  totalWords: number;
  onBalanceRefresh?: () => void;
}

export const CreditWallModal: React.FC<CreditWallModalProps> = ({
  isOpen,
  onClose,
  onUnlock,
  currentBalance,
  storyTitle,
  previewContent,
  totalChapters,
  totalWords,
  onBalanceRefresh,
}) => {
  const { toast } = useToast();
  const { isAuthenticated, getToken } = useClerkAuth();
  const [showPurchaseModal, setShowPurchaseModal] = React.useState(false);

  const handleUnlockWithCredits = async () => {
    if (currentBalance < 1) {
      toast({
        title: "Insufficient Credits",
        description: "You need at least 1 credit to unlock the full story. Please purchase credits first.",
        variant: "destructive",
      });
      setShowPurchaseModal(true);
      return;
    }

    try {
      // Get authentication token
      const token = await getToken({ template: 'supabase' });
      
      if (!token) {
        toast({
          title: "Authentication Error",
          description: "Please sign in again to continue.",
          variant: "destructive",
        });
        return;
      }

      // Call credit validation endpoint
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const response = await fetch(`${supabaseUrl}/functions/v1/credits-validate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          credits_required: 1,
          story_type: 'ebook_generation',
        }),
      });

      if (!response.ok) {
        // In development, allow unlock if Edge Functions are not available
        if (import.meta.env.DEV && response.status === 503) {
          console.log("Using mock credit validation for development");
          onUnlock();
          toast({
            title: "Story Unlocked! (Development Mode)",
            description: "You can now read the complete story.",
          });
          return;
        }
        
        throw new Error('Failed to validate credits');
      }

      const result = await response.json();
      
      if (result.success && result.data.has_sufficient_credits) {
        onUnlock();
        
        // Refresh credit balance after successful unlock
        if (onBalanceRefresh) {
          onBalanceRefresh();
        }
        
        toast({
          title: "Story Unlocked!",
          description: "You can now read the complete story.",
        });
      } else {
        toast({
          title: "Insufficient Credits",
          description: "You need at least 1 credit to unlock the full story.",
          variant: "destructive",
        });
        setShowPurchaseModal(true);
      }
    } catch (error) {
      console.error('Error validating credits:', error);
      toast({
        title: "Error",
        description: "Unable to validate credits. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handlePurchaseCredits = () => {
    setShowPurchaseModal(true);
  };

  const formatWordCount = (count: number) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center flex items-center justify-center gap-2">
              <Lock className="w-6 h-6 text-orange-500" />
              Unlock Your Complete Story
            </DialogTitle>
            <DialogDescription className="text-center text-gray-600">
              Your story has been generated! Use 1 credit to unlock the full {totalChapters} chapters.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            {/* Story Preview */}
            <Card className="border-2 border-orange-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-orange-600" />
                  Story Preview
                </CardTitle>
                <CardDescription>
                  First 100 words of "{storyTitle}"
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="prose prose-sm max-w-none">
                    <p className="text-gray-700 leading-relaxed">
                      {previewContent}
                    </p>
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Lock className="w-4 h-4" />
                        <span>Content continues... ({formatWordCount(totalWords - 100)} more words)</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="font-semibold text-blue-700">{totalChapters}</div>
                    <div className="text-blue-600">Chapters</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="font-semibold text-green-700">{formatWordCount(totalWords)}</div>
                    <div className="text-green-600">Total Words</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Unlock Options */}
            <Card className="border-2 border-blue-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-blue-600" />
                  Unlock Options
                </CardTitle>
                <CardDescription>
                  Choose how you'd like to unlock your complete story
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Current Balance */}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Coins className="w-4 h-4 text-yellow-600" />
                    <span className="font-medium">Current Balance</span>
                  </div>
                  <Badge variant={currentBalance >= 1 ? "default" : "destructive"}>
                    {currentBalance} credits
                  </Badge>
                </div>

                {/* Unlock with Credits */}
                <Button
                  onClick={handleUnlockWithCredits}
                  disabled={currentBalance < 1}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Unlock with 1 Credit
                </Button>

                {/* Purchase Credits */}
                <Button
                  onClick={handlePurchaseCredits}
                  variant="outline"
                  className="w-full"
                >
                  <Coins className="w-4 h-4 mr-2" />
                  Purchase Credits
                </Button>

                {/* Features */}
                <div className="space-y-2 pt-4 border-t border-gray-200">
                  <h4 className="font-medium text-gray-900">What you'll get:</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-green-500" />
                      <span>Complete {totalChapters} chapters</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-green-500" />
                      <span>Full story with {formatWordCount(totalWords)} words</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-green-500" />
                      <span>Download as text file</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-green-500" />
                      <span>Share on social media</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-6 text-center text-sm text-gray-500">
            <p>Your story is ready! Unlock it now to read the complete adventure.</p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Credit Purchase Modal */}
      <StripeCreditPurchaseModal
        isOpen={showPurchaseModal}
        onClose={() => setShowPurchaseModal(false)}
        onSuccess={() => {
          setShowPurchaseModal(false);
          // Refresh the credit balance
          if (onBalanceRefresh) {
            onBalanceRefresh();
          } else {
            // Fallback to page reload
            setTimeout(() => {
              window.location.reload();
            }, 1000);
          }
        }}
        currentBalance={currentBalance}
      />
    </>
  );
}; 