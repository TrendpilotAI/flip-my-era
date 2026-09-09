/**
 * PricingPage — Era-themed tiered pricing with monthly/annual toggle
 * 
 * Tiers: Debut (Free) / Speak Now ($9.99) / Midnights ($19.99) / Eras Tour ($49.99)
 * Credit Packs: Single (5) / Album (20) / Tour (50)
 */

import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useToast } from '@/modules/shared/hooks/use-toast';
import { motion, type Variants } from 'framer-motion';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/modules/shared/components/ui/card';
import { Button } from '@/modules/shared/components/ui/button';
import { Badge } from '@/modules/shared/components/ui/badge';
import { Switch } from '@/modules/shared/components/ui/switch';
import { Separator } from '@/modules/shared/components/ui/separator';
import { useClerkAuth } from '@/modules/auth/contexts';
import { FREE_SIGNUP_CREDITS, STRIPE_PRODUCTS } from '@/config/stripe-products';
import {
  CheckCircle,
  Sparkles,
  Star,
  Crown,
  Music,
  Mic2,
  Moon,
  Disc3,
  ShoppingBag,
  Zap,
  X,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────

interface TierConfig {
  key: string;
  name: string;
  tagline: string;
  icon: React.ReactNode;
  monthlyPrice: number;
  annualPricePerMonth: number;
  annualTotal: number;
  credits: string;
  annualCredits?: string;
  annualCreditFeature?: string;
  gradient: string;
  borderColor: string;
  badgeColor: string;
  ctaLabel: string;
  ctaVariant: 'outline' | 'default' | 'secondary';
  popular?: boolean;
  features: { label: string; included: boolean }[];
}

// ─── Tier Definitions ────────────────────────────────────────

const tiers: TierConfig[] = [
  {
    key: 'debut',
    name: 'Debut',
    tagline: 'Start your era',
    icon: <Mic2 className="h-8 w-8 text-emerald-500" />,
    monthlyPrice: 0,
    annualPricePerMonth: 0,
    annualTotal: 0,
    credits: `${FREE_SIGNUP_CREDITS} credits on signup`,
    gradient: 'from-emerald-50 to-teal-50',
    borderColor: 'border-emerald-200',
    badgeColor: 'bg-emerald-100 text-emerald-800',
    ctaLabel: 'Start Free',
    ctaVariant: 'outline',
    features: [
      { label: `${FREE_SIGNUP_CREDITS} free credits on signup`, included: true },
      { label: 'Story and ebook creation', included: true },
      { label: 'Personal ebook library', included: true },
      { label: 'Community gallery access', included: true },
      { label: 'Publish controls for your ebooks', included: true },
    ],
  },
  {
    key: 'speakNow',
    name: 'Speak Now',
    tagline: 'Find your voice',
    icon: <Star className="h-8 w-8 text-purple-500" />,
    monthlyPrice: 9.99,
    annualPricePerMonth: 7.99,
    annualTotal: 95.88,
    credits: '30 credits/mo',
    annualCredits: '360 credits/yr',
    annualCreditFeature: '360 credits granted annually',
    gradient: 'from-purple-50 to-violet-50',
    borderColor: 'border-purple-200',
    badgeColor: 'bg-purple-100 text-purple-800',
    ctaLabel: 'Go Speak Now',
    ctaVariant: 'default',
    features: [
      { label: '30 credits per month', included: true },
      { label: 'Story and ebook creation', included: true },
      { label: 'Personal ebook library', included: true },
      { label: 'Community gallery publishing', included: true },
      { label: 'Extra credit packs available anytime', included: true },
    ],
  },
  {
    key: 'midnights',
    name: 'Midnights',
    tagline: "You're the main character",
    icon: <Moon className="h-8 w-8 text-indigo-400" />,
    monthlyPrice: 19.99,
    annualPricePerMonth: 15.99,
    annualTotal: 191.88,
    credits: '75 credits/mo',
    annualCredits: '900 credits/yr',
    annualCreditFeature: '900 credits granted annually',
    gradient: 'from-indigo-50 to-blue-50',
    borderColor: 'border-indigo-200',
    badgeColor: 'bg-indigo-100 text-indigo-800',
    ctaLabel: 'Go Midnights',
    ctaVariant: 'default',
    popular: true,
    features: [
      { label: '75 credits per month', included: true },
      { label: 'Story and ebook creation', included: true },
      { label: 'Personal ebook library', included: true },
      { label: 'Community gallery publishing', included: true },
      { label: 'Extra credit packs available anytime', included: true },
    ],
  },
  {
    key: 'erasTour',
    name: 'The Eras Tour',
    tagline: 'Our highest credit allowance',
    icon: <Crown className="h-8 w-8 text-amber-500" />,
    monthlyPrice: 49.99,
    annualPricePerMonth: 39.99,
    annualTotal: 479.88,
    credits: '150 credits/mo',
    annualCredits: '1,800 credits/yr',
    annualCreditFeature: '1,800 credits granted annually',
    gradient: 'from-amber-50 to-yellow-50',
    borderColor: 'border-amber-200',
    badgeColor: 'bg-amber-100 text-amber-800',
    ctaLabel: 'Go Eras Tour',
    ctaVariant: 'default',
    features: [
      { label: '150 credits per month', included: true },
      { label: 'Story and ebook creation', included: true },
      { label: 'Personal ebook library', included: true },
      { label: 'Community gallery publishing', included: true },
      { label: 'Extra credit packs available anytime', included: true },
    ],
  },
];

// ─── Credit Packs ────────────────────────────────────────────

interface CreditPack {
  key: string;
  name: string;
  credits: number;
  price: number;
  perCredit: string;
  icon: React.ReactNode;
  bestValue?: boolean;
}

const creditPacks: CreditPack[] = [
  {
    key: 'single',
    name: 'Single',
    credits: 5,
    price: 2.99,
    perCredit: '$0.60',
    icon: <Disc3 className="h-6 w-6 text-pink-500" />,
  },
  {
    key: 'album',
    name: 'Album',
    credits: 20,
    price: 9.99,
    perCredit: '$0.50',
    icon: <Music className="h-6 w-6 text-purple-500" />,
  },
  {
    key: 'tour',
    name: 'Tour',
    credits: 50,
    price: 19.99,
    perCredit: '$0.40',
    icon: <ShoppingBag className="h-6 w-6 text-indigo-500" />,
    bestValue: true,
  },
];

// ─── Animations ──────────────────────────────────────────────

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.2 },
  },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 40, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.5, ease: 'easeOut', type: 'spring', stiffness: 120 },
  },
};

// ─── Component ───────────────────────────────────────────────

export const PricingPage: React.FC = () => {
  const [annual, setAnnual] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { user } = useClerkAuth();

  // Show toast when user returns from a cancelled Stripe checkout
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('cancelled') === 'true') {
      toast({
        title: 'Checkout cancelled',
        description: 'No worries. Upgrade whenever you are ready.',
      });
      const clean = new URL(window.location.href);
      clean.searchParams.delete('cancelled');
      window.history.replaceState({}, '', clean.toString());
    }
  }, [location.search, toast]);

  const handleSelectTier = (tierKey: string) => {
    if (tierKey === 'debut') {
      navigate('/');
    } else {
      const billingParam = annual ? `${tierKey}Annual` : tierKey;
      navigate(`/checkout?plan=${billingParam}`);
    }
  };

  const handleBuyPack = (packKey: string) => {
    navigate(`/checkout?pack=${packKey}`);
  };

  const formatPrice = (price: number) =>
    price === 0 ? 'Free' : `$${price.toFixed(2)}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/50 to-background px-4 pb-12 pt-24 sm:py-12">
      <div className="max-w-6xl mx-auto">
        {/* ── Header ── */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-3 text-primary">
            Choose Your Era
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Every great story starts somewhere. Pick the era that matches your creative journey.
          </p>

          {/* ── Billing Toggle ── */}
          <div className="flex items-center justify-center gap-3 mt-8">
            <span className={`text-sm font-medium ${!annual ? 'text-foreground' : 'text-muted-foreground'}`}>
              Monthly
            </span>
            <Switch
              aria-label="Use annual billing"
              checked={annual}
              onCheckedChange={setAnnual}
            />
            <span className={`text-sm font-medium ${annual ? 'text-foreground' : 'text-muted-foreground'}`}>
              Annual
            </span>
            {annual && (
              <Badge variant="secondary" className="ml-2 text-xs">
                Save 20%
              </Badge>
            )}
          </div>
        </motion.div>

        {/* ── Tier Cards ── */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {tiers.map((tier) => {
            const price = annual ? tier.annualPricePerMonth : tier.monthlyPrice;
            const isCurrentPlan =
              (tier.key === 'debut' && user?.subscription_status === 'free') ||
              (tier.key === 'speakNow' && user?.subscription_status === 'basic') ||
              (tier.key === 'midnights' && user?.subscription_status === 'premium');

            return (
              <motion.div key={tier.key} variants={cardVariants}>
                <Card
                  className={`relative h-full bg-gradient-to-b ${tier.gradient} ${tier.borderColor} hover:shadow-xl transition-all duration-300 group overflow-hidden`}
                >
                  {/* Popular badge */}
                  {tier.popular && (
                    <div className="absolute left-1/2 top-3 -translate-x-1/2">
                      <Badge className="bg-primary text-primary-foreground px-4 py-1 shadow-md">
                        <Sparkles className="h-3 w-3 mr-1" /> MOST POPULAR
                      </Badge>
                    </div>
                  )}

                  <CardHeader className="text-center pt-8 pb-4">
                    <div className="flex justify-center mb-3">{tier.icon}</div>
                    <CardTitle className="text-2xl">{tier.name}</CardTitle>
                    <CardDescription className="text-sm italic">{tier.tagline}</CardDescription>

                    <div className="mt-4">
                      <motion.span
                        className="text-4xl font-bold"
                        key={`${tier.key}-${annual}`}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        {formatPrice(price)}
                      </motion.span>
                      {price > 0 && (
                        <span className="text-muted-foreground text-sm ml-1">/month</span>
                      )}
                    </div>

                    {annual && tier.annualTotal > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Billed ${tier.annualTotal.toFixed(2)}/year
                      </p>
                    )}

                    <Badge className={`mt-3 ${tier.badgeColor}`}>
                      {annual && tier.annualCredits ? tier.annualCredits : tier.credits}
                    </Badge>
                  </CardHeader>

                  <CardContent className="pt-0">
                    <ul className="space-y-2.5">
                      {tier.features.map((f, i) => (
                        <li key={i} className="flex items-start text-sm">
                          {f.included ? (
                            <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 shrink-0" />
                          ) : (
                            <X className="h-4 w-4 text-muted-foreground/40 mr-2 mt-0.5 shrink-0" />
                          )}
                          <span className={f.included ? '' : 'text-muted-foreground/70'}>
                            {annual && i === 0 && tier.annualCreditFeature
                              ? tier.annualCreditFeature
                              : f.label}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>

                  <CardFooter className="pt-4">
                    <Button
                      className="w-full"
                      variant={tier.ctaVariant}
                      disabled={isCurrentPlan}
                      onClick={() => handleSelectTier(tier.key)}
                    >
                      {isCurrentPlan ? 'Current Plan' : tier.ctaLabel}
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>

        {/* ── Credit Packs ── */}
        <Separator className="mb-12" />

        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
        >
          <h2 className="text-2xl font-bold mb-2">Need Extra Credits?</h2>
          <p className="text-gray-600">
            Top up anytime with à la carte credit packs — no subscription required.
          </p>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.5, staggerChildren: 0.1 }}
          viewport={{ once: true }}
        >
          {creditPacks.map((pack) => (
            <motion.div
              key={pack.key}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              viewport={{ once: true }}
              whileHover={{ y: -4 }}
            >
              <Card className={`text-center relative hover:shadow-lg transition-shadow ${pack.bestValue ? 'ring-2 ring-indigo-400' : ''}`}>
                {pack.bestValue && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-indigo-500 text-white px-3 py-1 shadow">
                      <Zap className="h-3 w-3 mr-1" /> Best Value
                    </Badge>
                  </div>
                )}
                <CardHeader className="pb-2 pt-6">
                  <div className="flex justify-center mb-2">{pack.icon}</div>
                  <CardTitle className="text-lg">{pack.name}</CardTitle>
                  <CardDescription>{pack.credits} credits</CardDescription>
                </CardHeader>
                <CardContent className="pb-2">
                  <div className="text-3xl font-bold">${pack.price.toFixed(2)}</div>
                  <p className="text-xs text-gray-400 mt-1">{pack.perCredit}/credit</p>
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full"
                    variant={pack.bestValue ? 'default' : 'outline'}
                    onClick={() => handleBuyPack(pack.key)}
                  >
                    Buy {pack.name}
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* ── Footer Note ── */}
        <motion.div
          className="mt-12 text-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          viewport={{ once: true }}
        >
          <p className="text-sm text-gray-500">
            Secure checkout via Stripe · Credits never expire · Manage subscriptions anytime
          </p>
          <Button variant="link" className="mt-2" onClick={() => navigate('/faq')}>
            View Pricing FAQ →
          </Button>
        </motion.div>
      </div>
    </div>
  );
};

export default PricingPage;
