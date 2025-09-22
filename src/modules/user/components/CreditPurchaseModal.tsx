// Credit Purchase Modal Component
// Modal for purchasing credits with different pricing tiers
// Phase 1A: Enhanced E-Book Generation System

import React, { useState } from 'react';
import { X, Coins, Crown, Zap, Check } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/modules/shared/components/ui/dialog';
import { Button } from '@/modules/shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shared/components/ui/card';
import { Badge } from '@/modules/shared/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useClerkAuth } from '@/modules/auth/contexts/ClerkAuthContext';
import { useToast } from '@/modules/shared/hooks/use-toast';

interface CreditPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  currentBalance: number;
}

interface PricingTier {
  id: string;
  name: string;
  credits: number | null; // null for unlimited
  price: number;
  originalPrice?: number;
  description: string;
  features: string[];
  popular?: boolean;
  type: 'credits' | 'subscription';
  billingCycle?: string;
  stripeProductId: string;
  stripePriceId: string;
}

const pricingTiers: PricingTier[] = [
  {
    id: 'starter-pack',
    name: '$25 Credit Pack',
    credits: 25,
    price: 25.00,
    description: 'Perfect for a story project',
    features: ['25 Credits', 'Never expires', 'Use anytime', '$1.00 per credit'],
    type: 'credits',
    stripeProductId: 'prod_T6Bh9entCOJCNA',
    stripePriceId: 'price_1S9zK25U03MNTw3qMH90DnC1',
  },
  {
    id: 'creator-pack',
    name: '$50 Credit Pack',
    credits: 55,
    price: 50.00,
    description: 'Best value for creators',
    features: ['55 Credits (10% bonus!)', 'Never expires', 'Most popular choice', '$0.91 per credit'],
    popular: true,
    type: 'credits',
    stripeProductId: 'prod_T6BhQaa0OH644p',
    stripePriceId: 'price_1S9zK25U03MNTw3qFkq00yiu',
  },
  {
    id: 'studio-pack',
    name: '$100 Credit Pack',
    credits: 120,
    price: 100.00,
    description: 'Maximum value pack',
    features: ['120 Credits (20% bonus!)', 'Never expires', 'Best long-term value', '$0.83 per credit'],
    type: 'credits',
    stripeProductId: 'prod_T6BhrpyA6MJQzK',
    stripePriceId: 'price_1S9zK35U03MNTw3qpmqEDL80',
  },
];

export const CreditPurchaseModal: React.FC<CreditPurchaseModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  currentBalance,
}) => {
  const [loading, setLoading] = useState<string | null>(null);
  const { user } = useClerkAuth();
  const { toast } = useToast();

  const handlePurchase = async (tier: PricingTier) => {
    setLoading(tier.id);

    try {
      // Validate user data before proceeding
      if (!user?.email) {
        throw new Error("User email is required for checkout");
      }

      toast({
        title: "Redirecting to secure checkout",
        description: "You'll be redirected to Stripe to complete your purchase securely.",
      });

      // Call Stripe checkout function for one-time credit purchases
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: {
          plan: tier.id,
          productType: 'credits',
          stripePriceId: tier.stripePriceId
        }
      });

      if (error) {
        throw new Error(error.message || 'Failed to create checkout session');
      }

      if (data?.url) {
        // Open Stripe checkout in new tab
        window.open(data.url, '_blank');
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error) {
      console.error('Error opening checkout:', error);

      // Show user-friendly error message
      const errorMessage = error instanceof Error
        ? error.message.includes('email')
          ? "Please ensure you're logged in with a valid email address."
          : error.message
        : "There was a problem initiating checkout. Please try again.";

      toast({
        title: "Checkout Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
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
          <DialogTitle className="flex items-center text-xl">
            <Zap className="w-5 h-5 mr-2" />
            Purchase Credits & Subscriptions
          </DialogTitle>
          <DialogDescription>
            Current balance: <strong>{currentBalance} credits</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          {pricingTiers.map((tier) => (
            <Card 
              key={tier.id} 
              className={`relative ${tier.popular ? 'ring-2 ring-primary' : ''}`}
            >
              {tier.popular && (
                <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                  Most Popular
                </Badge>
              )}
              
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    {getIcon(tier.type)}
                    <span className="ml-2">{tier.name}</span>
                  </div>
                  {tier.type === 'subscription' && (
                    <Crown className="w-4 h-4 text-yellow-500" />
                  )}
                </CardTitle>
                
                <div className="space-y-2">
                  <div className="text-2xl font-bold">
                    {formatPrice(tier.price)}
                    {tier.type === 'subscription' && (
                      <span className="text-sm font-normal text-muted-foreground">
                        /{tier.billingCycle}
                      </span>
                    )}
                  </div>
                  
                  {tier.originalPrice && (
                    <div className="text-sm text-muted-foreground">
                      <span className="line-through">{formatPrice(tier.originalPrice)}</span>
                      <span className="ml-2 text-green-600 font-medium">
                        Save {Math.round((1 - tier.price / tier.originalPrice) * 100)}%
                      </span>
                    </div>
                  )}
                  
                  <div className="text-lg font-semibold text-primary">
                    {getCreditText(tier.credits)}
                  </div>
                </div>
                
                <CardDescription>{tier.description}</CardDescription>
              </CardHeader>

              <CardContent className="pt-0">
                <ul className="space-y-2 mb-6">
                  {tier.features.map((feature, index) => (
                    <li key={index} className="flex items-center text-sm">
                      <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => handlePurchase(tier)}
                  disabled={!!loading}
                  className="w-full"
                  variant={tier.popular ? 'default' : 'outline'}
                >
                  {loading === tier.id ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                      Opening Checkout...
                    </div>
                  ) : (
                    `Purchase ${tier.name}`
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-6 p-4 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground">
            <strong>Note:</strong> Credits never expire and can be used anytime.
            Subscriptions provide unlimited access and can be cancelled at any time.
            All purchases are processed securely through Stripe.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreditPurchaseModal;