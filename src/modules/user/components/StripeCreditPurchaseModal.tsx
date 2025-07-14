import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/modules/shared/components/ui/dialog';
import { Button } from '@/modules/shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shared/components/ui/card';
import { Badge } from '@/modules/shared/components/ui/badge';
import { useToast } from '@/modules/shared/hooks/use-toast';
import { stripeClient } from '@/core/integrations/stripe/client';
import { useAuth } from '@clerk/clerk-react';
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

const pricingTiers: PricingTier[] = [
  {
    id: 'single',
    name: 'Single Credit',
    credits: 1,
    price: 2.99,
    description: 'Perfect for trying out our service',
    features: ['1 E-book Generation', 'Full Quality Output', 'Instant Download'],
    type: 'credits',
    stripePriceId: 'price_1Rk4JDQH2CPu3kDwaJ9W1TDW', // 1 credit price ID
  },
  {
    id: 'bundle-3',
    name: '3-Credit Bundle',
    credits: 3,
    price: 7.99,
    originalPrice: 8.97,
    description: 'Save 11% with this bundle',
    features: ['3 E-book Generations', 'Full Quality Output', 'Instant Downloads', 'Best Value for Casual Users'],
    type: 'credits',
    stripePriceId: 'price_1Rk4JDQH2CPu3kDwnWUmRgHb', // 3 credit price ID
  },
  {
    id: 'bundle-5',
    name: '5-Credit Bundle',
    credits: 5,
    price: 12.99,
    originalPrice: 14.95,
    description: 'Save 13% with this bundle',
    features: ['5 E-book Generations', 'Full Quality Output', 'Instant Downloads', 'Best Value for Power Users'],
    type: 'credits',
    stripePriceId: 'price_1Rk4JEQH2CPu3kDwf1ymmbqt', // 5 credit price ID
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
  const { user } = useAuth();

  const handlePurchase = async (tier: PricingTier) => {
    setLoading(tier.id);
    
    try {
      if (tier.type === 'credits') {
        // Handle credit purchase
        await stripeClient.redirectToCheckout({
          priceId: tier.stripePriceId,
          successUrl: `${window.location.origin}/checkout/success?type=credits&amount=${tier.credits}`,
          cancelUrl: window.location.href,
          customerEmail: user?.emailAddresses?.[0]?.emailAddress,
        });
      } else {
        // Handle subscription purchase
        await stripeClient.createSubscription({
          priceId: tier.stripePriceId,
          customerEmail: user?.emailAddresses?.[0]?.emailAddress || '',
          successUrl: `${window.location.origin}/checkout/success?type=subscription&plan=${tier.id}`,
          cancelUrl: window.location.href,
        });
      }
    } catch (error) {
      console.error('Error initiating Stripe checkout:', error);
      toast({
        title: "Checkout Error",
        description: "Unable to proceed to checkout. Please try again.",
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

  const getCreditText = (credits: number | null) => {
    if (credits === null) return 'Unlimited';
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
            Purchase Credits & Subscriptions
          </DialogTitle>
          <DialogDescription className="text-center text-gray-600">
            Choose the plan that works best for you
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
          {pricingTiers.map((tier) => (
            <Card
              key={tier.id}
              className={`relative transition-all duration-200 hover:shadow-lg ${
                tier.popular ? 'ring-2 ring-blue-500 shadow-lg' : ''
              }`}
            >
              {tier.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-blue-500 text-white px-3 py-1">
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
                      <span className="text-lg text-gray-500 line-through">
                        {formatPrice(tier.originalPrice)}
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
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
                      <span className="text-sm text-gray-700">{feature}</span>
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
                    `Purchase ${getCreditText(tier.credits)}`
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>All purchases are processed securely through Stripe</p>
          <p className="mt-1">Current balance: {currentBalance} credits</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 