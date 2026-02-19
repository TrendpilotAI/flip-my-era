// Credit Purchase Modal Component
// Updated for tiered pricing: Single / Album / Tour credit packs

import React, { useState } from 'react';
import { Coins, Crown, Zap, Check, Disc3, Music, ShoppingBag } from 'lucide-react';
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
import { useClerkAuth } from '@/modules/auth/contexts';
import { useToast } from '@/modules/shared/hooks/use-toast';
import { STRIPE_PRODUCTS } from '@/config/stripe-products';

interface CreditPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  currentBalance: number;
}

export interface PricingTier {
  id: string;
  name: string;
  credits: number | null;
  price: number;
  originalPrice?: number;
  description: string;
  features: string[];
  popular?: boolean;
  bestValue?: boolean;
  type: 'credits' | 'subscription';
  billingCycle?: string;
  stripeProductId: string;
  stripePriceId: string;
}

// À la carte credit packs from centralized config
export const pricingTiers: PricingTier[] = [
  {
    id: 'single',
    name: STRIPE_PRODUCTS.credits.single.name!,
    credits: STRIPE_PRODUCTS.credits.single.credits,
    price: STRIPE_PRODUCTS.credits.single.price,
    description: STRIPE_PRODUCTS.credits.single.description!,
    features: ['5 Credits', 'Never expires', 'Use anytime', '$0.60 per credit'],
    type: 'credits',
    stripeProductId: STRIPE_PRODUCTS.credits.single.productId,
    stripePriceId: STRIPE_PRODUCTS.credits.single.priceId,
  },
  {
    id: 'album',
    name: STRIPE_PRODUCTS.credits.album.name!,
    credits: STRIPE_PRODUCTS.credits.album.credits,
    price: STRIPE_PRODUCTS.credits.album.price,
    description: STRIPE_PRODUCTS.credits.album.description!,
    features: ['20 Credits', 'Never expires', 'Great for a full project', '$0.50 per credit'],
    popular: true,
    type: 'credits',
    stripeProductId: STRIPE_PRODUCTS.credits.album.productId,
    stripePriceId: STRIPE_PRODUCTS.credits.album.priceId,
  },
  {
    id: 'tour',
    name: STRIPE_PRODUCTS.credits.tour.name!,
    credits: STRIPE_PRODUCTS.credits.tour.credits,
    price: STRIPE_PRODUCTS.credits.tour.price,
    description: STRIPE_PRODUCTS.credits.tour.description!,
    features: ['50 Credits', 'Never expires', 'Best long-term value', '$0.40 per credit'],
    bestValue: true,
    type: 'credits',
    stripeProductId: STRIPE_PRODUCTS.credits.tour.productId,
    stripePriceId: STRIPE_PRODUCTS.credits.tour.priceId,
  },
];

const packIcons: Record<string, React.ReactNode> = {
  single: <Disc3 className="w-5 h-5 text-pink-500" />,
  album: <Music className="w-5 h-5 text-purple-500" />,
  tour: <ShoppingBag className="w-5 h-5 text-indigo-500" />,
};

export const CreditPurchaseModal: React.FC<CreditPurchaseModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  currentBalance,
}) => {
  const [loading, setLoading] = useState<string | null>(null);
  const { user, getToken } = useClerkAuth();
  const { toast } = useToast();

  const handlePurchase = async (tier: PricingTier) => {
    setLoading(tier.id);

    try {
      if (!user?.email) {
        throw new Error("User email is required for checkout");
      }

      toast({
        title: "Redirecting to secure checkout",
        description: "You'll be redirected to Stripe to complete your purchase securely.",
      });

      const token = await getToken();
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        headers: token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' },
        body: {
          plan: tier.id,
          productType: 'credits',
          stripePriceId: tier.stripePriceId,
        },
      });

      if (error) {
        throw new Error(error.message || 'Failed to create checkout session');
      }

      if (data?.url) {
        window.open(data.url, '_blank');
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error) {
      console.error('Error opening checkout:', error);
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

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center text-xl">
            <Zap className="w-5 h-5 mr-2" />
            Buy Credit Packs
          </DialogTitle>
          <DialogDescription>
            Current balance: <strong>{currentBalance} credits</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          {pricingTiers.map((tier) => (
            <Card
              key={tier.id}
              className={`relative ${tier.popular ? 'ring-2 ring-primary' : ''} ${tier.bestValue ? 'ring-2 ring-indigo-400' : ''}`}
            >
              {tier.popular && (
                <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                  Most Popular
                </Badge>
              )}
              {tier.bestValue && (
                <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-indigo-500">
                  <Zap className="w-3 h-3 mr-1" /> Best Value
                </Badge>
              )}

              <CardHeader className="pb-4">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    {packIcons[tier.id] || <Coins className="w-5 h-5" />}
                    <span className="ml-2">{tier.name}</span>
                  </div>
                </CardTitle>

                <div className="space-y-2">
                  <div className="text-2xl font-bold">{formatPrice(tier.price)}</div>
                  <div className="text-lg font-semibold text-primary">
                    {tier.credits} Credits
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
                  variant={tier.bestValue ? 'default' : tier.popular ? 'default' : 'outline'}
                >
                  {loading === tier.id ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                      Opening Checkout...
                    </div>
                  ) : (
                    `Buy ${tier.name}`
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-6 p-4 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground">
            <strong>Note:</strong> Credits never expire and can be used anytime.
            All purchases are processed securely through Stripe.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreditPurchaseModal;
