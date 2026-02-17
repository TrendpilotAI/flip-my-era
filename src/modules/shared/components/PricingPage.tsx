/**
 * PricingPage — Era-themed tiered pricing with monthly/annual toggle
 * 
 * Tiers: Debut (Free) / Speak Now ($9.99) / Midnights ($19.99) / Eras Tour ($49.99)
 * Credit Packs: Single (5) / Album (20) / Tour (50)
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/modules/shared/components/ui/card';
import { Button } from '@/modules/shared/components/ui/button';
import { Badge } from '@/modules/shared/components/ui/badge';
import { Switch } from '@/modules/shared/components/ui/switch';
import { Separator } from '@/modules/shared/components/ui/separator';
import { useClerkAuth } from '@/modules/auth/contexts';
import { STRIPE_PRODUCTS } from '@/config/stripe-products';
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
    credits: '3 credits on signup',
    gradient: 'from-emerald-50 to-teal-50',
    borderColor: 'border-emerald-200',
    badgeColor: 'bg-emerald-100 text-emerald-800',
    ctaLabel: 'Start Free',
    ctaVariant: 'outline',
    features: [
      { label: '3 free credits on signup', included: true },
      { label: '1 era theme unlocked', included: true },
      { label: 'Basic story generation', included: true },
      { label: 'Community access', included: true },
      { label: 'Watermarked exports', included: true },
      { label: 'All era themes', included: false },
      { label: 'No watermark', included: false },
      { label: 'Premium templates', included: false },
      { label: 'Priority generation', included: false },
      { label: 'API access', included: false },
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
    credits: '3 ebooks/mo',
    gradient: 'from-purple-50 to-violet-50',
    borderColor: 'border-purple-200',
    badgeColor: 'bg-purple-100 text-purple-800',
    ctaLabel: 'Go Speak Now',
    ctaVariant: 'default',
    features: [
      { label: '3 ebooks per month', included: true },
      { label: 'Standard templates', included: true },
      { label: 'Email support', included: true },
      { label: 'All era themes unlocked', included: true },
      { label: 'No watermark on exports', included: true },
      { label: 'Custom templates', included: false },
      { label: 'Priority support', included: false },
      { label: 'Priority generation queue', included: false },
      { label: 'API access', included: false },
      { label: 'Team accounts', included: false },
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
    credits: 'Unlimited ebooks',
    gradient: 'from-indigo-50 to-blue-50',
    borderColor: 'border-indigo-200',
    badgeColor: 'bg-indigo-100 text-indigo-800',
    ctaLabel: 'Go Midnights',
    ctaVariant: 'default',
    popular: true,
    features: [
      { label: 'Unlimited ebooks', included: true },
      { label: 'All templates + custom', included: true },
      { label: 'Priority support', included: true },
      { label: 'No watermark on exports', included: true },
      { label: 'Priority generation queue', included: true },
      { label: 'Early access to features', included: true },
      { label: 'Print-ready exports', included: true },
      { label: 'AI layout suggestions', included: true },
      { label: 'API access', included: false },
      { label: 'Team accounts & white-label', included: false },
    ],
  },
  {
    key: 'erasTour',
    name: 'The Eras Tour',
    tagline: 'For teams and brands',
    icon: <Crown className="h-8 w-8 text-amber-500" />,
    monthlyPrice: 49.99,
    annualPricePerMonth: 39.99,
    annualTotal: 479.88,
    credits: 'Unlimited + API',
    gradient: 'from-amber-50 to-yellow-50',
    borderColor: 'border-amber-200',
    badgeColor: 'bg-amber-100 text-amber-800',
    ctaLabel: 'Go Enterprise',
    ctaVariant: 'default',
    features: [
      { label: 'Everything in Midnights', included: true },
      { label: 'API access', included: true },
      { label: 'Team accounts (up to 25)', included: true },
      { label: 'White-label branding', included: true },
      { label: 'Dedicated account manager', included: true },
      { label: 'Custom integrations', included: true },
      { label: 'SLA guarantee', included: true },
      { label: 'Bulk generation', included: true },
      { label: 'Analytics dashboard', included: true },
      { label: 'Priority everything', included: true },
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

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.2 },
  },
};

const cardVariants = {
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
  const { user } = useClerkAuth();

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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* ── Header ── */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600">
            Choose Your Era
          </h1>
          <p className="text-gray-600 text-lg max-w-xl mx-auto">
            Every great story starts somewhere. Pick the era that matches your creative journey.
          </p>

          {/* ── Billing Toggle ── */}
          <div className="flex items-center justify-center gap-3 mt-8">
            <span className={`text-sm font-medium ${!annual ? 'text-gray-900' : 'text-gray-400'}`}>
              Monthly
            </span>
            <Switch checked={annual} onCheckedChange={setAnnual} />
            <span className={`text-sm font-medium ${annual ? 'text-gray-900' : 'text-gray-400'}`}>
              Annual
            </span>
            {annual && (
              <Badge variant="secondary" className="ml-2 bg-green-100 text-green-700 text-xs">
                2 months free ✨
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
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                      <Badge className="bg-purple-500 text-white px-4 py-1 shadow-md">
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
                        <span className="text-gray-500 text-sm ml-1">/month</span>
                      )}
                    </div>

                    {annual && tier.annualTotal > 0 && (
                      <p className="text-xs text-gray-400 mt-1">
                        Billed ${tier.annualTotal.toFixed(2)}/year
                      </p>
                    )}

                    <Badge className={`mt-3 ${tier.badgeColor}`}>{tier.credits}</Badge>
                  </CardHeader>

                  <CardContent className="pt-0">
                    <ul className="space-y-2.5">
                      {tier.features.map((f, i) => (
                        <li key={i} className="flex items-start text-sm">
                          {f.included ? (
                            <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 shrink-0" />
                          ) : (
                            <X className="h-4 w-4 text-gray-300 mr-2 mt-0.5 shrink-0" />
                          )}
                          <span className={f.included ? '' : 'text-gray-400'}>{f.label}</span>
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
            All plans include 30-day money-back guarantee · Credits never expire · Cancel anytime
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
