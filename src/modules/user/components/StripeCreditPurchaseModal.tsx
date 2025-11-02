import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/modules/shared/components/ui/dialog';
import { Button } from '@/modules/shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shared/components/ui/card';
import { Badge } from '@/modules/shared/components/ui/badge';
import { useToast } from '@/modules/shared/hooks/use-toast';
import { stripeClient } from '@/core/integrations/stripe/client';
import { useClerkAuth } from '@/modules/auth/contexts';
import { Coins, Crown, Check, Star, Zap } from 'lucide-react';

interface PricingTier {
  id: string;
  name: string;
  credits: number | null;
  price: number;
  originalPrice?: number;
  description: string;
  features: string[];
  type: 'credits' | 'subscription';
  billingCycle?: 'monthly' | 'annual';
  stripePriceId: string;
  popular?: boolean;
}

// Per-story pricing: $4.99 for short stories, $14.99 for novellas
const pricingTiers: PricingTier[] = [
  {
    id: 'short-story',
    name: 'Short Story',
    credits: null,
    price: 4.99,
    description: 'Perfect for quick reads',
    features: [
      '3 chapters (~5,000 words)',
      'Professional illustrations',
      'Taylor Swift-inspired themes',
      'Instant download',
      'PDF & ePub formats'
    ],
    type: 'credits',
    stripePriceId: import.meta.env.VITE_STRIPE_PRICE_SHORT_STORY || 'price_short_story',
    popular: true,
  },
  {
    id: 'novella',
    name: 'Novella',
    credits: null,
    price: 14.99,
    description: 'For longer, immersive stories',
    features: [
      '8 chapters (~15,000 words)',
      'Premium illustrations',
      'Taylor Swift-inspired themes',
      'Deeper character development',
      'Instant download',
      'PDF & ePub formats'
    ],
    type: 'credits',
    stripePriceId: import.meta.env.VITE_STRIPE_PRICE_NOVELLA || 'price_novella',
  },
];

interface StripeCreditPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  currentBalance: number;
}

export const StripeCreditPurchaseModal: React.FC<StripeCreditPurchaseModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  currentBalance,
}) => {
  const [loading, setLoading] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useClerkAuth();

  const handlePurchase = async (tier: PricingTier) => {
    if (!user?.email) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to purchase credits.",
        variant: "destructive",
      });
      return;
    }

    setLoading(tier.id);
    
    try {
      if (tier.type === 'credits') {
        // Handle credit purchase
        await stripeClient.redirectToCheckout({
          priceId: tier.stripePriceId,
          successUrl: `${window.location.origin}/checkout-success?type=credits&amount=${tier.credits}`,
          cancelUrl: window.location.href,
          customerEmail: user.email,
        });
      } else {
        // Handle subscription purchase
        await stripeClient.createSubscription({
          priceId: tier.stripePriceId,
          customerEmail: user.email,
          successUrl: `${window.location.origin}/checkout-success?type=subscription&plan=${tier.id}`,
          cancelUrl: window.location.href,
        });
      }
    } catch (error) {
      console.error('Error initiating Stripe checkout:', error);
      toast({
        title: "Checkout Error",
        description: error instanceof Error ? error.message : "Unable to proceed to checkout. Please try again.",
        variant: "destructive",
      });
      setLoading(null);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const getCreditText = (credits: number | null, tierName: string) => {
    if (credits === null) return tierName;
    return credits === 1 ? '1 Credit' : `${credits} Credits`;
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'subscription':
        return <Crown className="w-5 h-5" />;
      default:
        return <Coins className="w-5 h-5" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            Choose Your Story
          </DialogTitle>
          <DialogDescription className="text-center">
            Create a professionally illustrated ebook in minutes
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
          {pricingTiers.map((tier) => (
            <Card
              key={tier.id}
              className={`relative transition-all duration-200 hover:shadow-lg ${
                tier.popular ? 'ring-2 ring-primary shadow-lg' : ''
              }`}
            >
              {tier.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground px-3 py-1">
                    <Star className="w-3 h-3 mr-1" />
                    Most Popular
                  </Badge>
                </div>
              )}

              <CardHeader className="text-center pb-4">
                <div className="flex items-center justify-center mb-2">
                  {getIcon(tier.type)}
                </div>
                <CardTitle className="text-xl">{tier.name}</CardTitle>
                <CardDescription>{tier.description}</CardDescription>
                
                <div className="mt-4">
                  <div className="flex items-center justify-center space-x-2">
                    <span className="text-3xl font-bold">
                      {formatPrice(tier.price)}
                    </span>
                    {tier.originalPrice && (
                      <span className="text-lg text-muted-foreground line-through">
                        {formatPrice(tier.originalPrice)}
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {tier.type === 'subscription' ? (
                      <span>per {tier.billingCycle}</span>
                    ) : (
                      <span>one-time</span>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {tier.features.map((feature, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>

                <Button
                  className="w-full"
                  onClick={() => handlePurchase(tier)}
                  disabled={loading === tier.id}
                >
                  {loading === tier.id ? (
                    <>
                      <Zap className="w-4 h-4 mr-2 animate-pulse" />
                      Processing...
                    </>
                  ) : (
                    `Purchase ${getCreditText(tier.credits, tier.name)}`
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>All purchases are processed securely through Stripe</p>
          <p className="mt-1">One purchase = one complete illustrated ebook</p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
