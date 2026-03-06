/**
 * CreditExhaustionModal — shown when a signed-in user tries to generate
 * with 0 credits remaining. Presents the next plan upgrade CTA and links
 * to the /pricing page for full plan comparison.
 *
 * Listens to the custom DOM event "credits:exhausted" emitted by useCredits
 * so it can be mounted once at app-level without prop-drilling.
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/modules/shared/components/ui/dialog';
import { Button } from '@/modules/shared/components/ui/button';
import { Badge } from '@/modules/shared/components/ui/badge';
import {
  Sparkles,
  Star,
  Crown,
  ArrowRight,
  Zap,
  CheckCircle,
} from 'lucide-react';
import { CREDITS_EXHAUSTED_EVENT } from '../hooks/useCredits';

// ─── Next-plan upsell configs ──────────────────────────────────────────────

interface UpsellPlan {
  key: string;
  name: string;
  tagline: string;
  price: number;
  credits: number;
  icon: React.ReactNode;
  highlights: string[];
  checkoutPlan: string; // passed to /checkout?plan=
  gradient: string;
  badgeColor: string;
}

const UPSELL_PLANS: UpsellPlan[] = [
  {
    key: 'speakNow',
    name: 'Swiftie Starter',
    tagline: 'Fan Fiction Fundamentals',
    price: 12.99,
    credits: 30,
    icon: <Star className="h-6 w-6 text-purple-500" />,
    highlights: [
      '30 credits / month',
      'Taylor Swift era templates',
      'High-quality illustrations',
      'Character portraits',
      'Priority support',
    ],
    checkoutPlan: 'speakNow',
    gradient: 'from-purple-50 to-violet-100',
    badgeColor: 'bg-purple-100 text-purple-800',
  },
  {
    key: 'midnights',
    name: 'Swiftie Deluxe',
    tagline: 'Era-Explorer Pass',
    price: 25,
    credits: 75,
    icon: <Sparkles className="h-6 w-6 text-indigo-500" />,
    highlights: [
      '75 credits / month',
      'Cinematic multi-page spreads',
      'TikTok-ready animations',
      'Priority GPU (3× faster)',
      'Commercial licensing',
    ],
    checkoutPlan: 'midnights',
    gradient: 'from-indigo-50 to-blue-100',
    badgeColor: 'bg-indigo-100 text-indigo-800',
  },
  {
    key: 'erasTour',
    name: 'Opus VIP',
    tagline: 'Publishing Studio',
    price: 49.99,
    credits: 150,
    icon: <Crown className="h-6 w-6 text-amber-500" />,
    highlights: [
      '150 credits / month',
      'AI audio narration',
      'Analytics dashboard',
      'Commercial distribution tools',
      'Sell on Kindle, Gumroad & more',
    ],
    checkoutPlan: 'erasTour',
    gradient: 'from-amber-50 to-yellow-100',
    badgeColor: 'bg-amber-100 text-amber-800',
  },
];

// ─── Component ─────────────────────────────────────────────────────────────

interface CreditExhaustionModalProps {
  /** If provided, the modal is controlled externally (bypass event listener). */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const CreditExhaustionModal: React.FC<CreditExhaustionModalProps> = ({
  open: openProp,
  onOpenChange,
}) => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  // Listen for the exhaustion event if not controlled externally
  useEffect(() => {
    if (openProp !== undefined) return; // controlled mode — skip listener
    const handler = () => setOpen(true);
    window.addEventListener(CREDITS_EXHAUSTED_EVENT, handler);
    return () => window.removeEventListener(CREDITS_EXHAUSTED_EVENT, handler);
  }, [openProp]);

  const isOpen = openProp !== undefined ? openProp : open;

  const handleOpenChange = (next: boolean) => {
    if (onOpenChange) {
      onOpenChange(next);
    } else {
      setOpen(next);
    }
  };

  const handleUpgrade = (plan: UpsellPlan) => {
    handleOpenChange(false);
    navigate(`/checkout?plan=${plan.checkoutPlan}`);
  };

  const handleViewAllPlans = () => {
    handleOpenChange(false);
    navigate('/pricing');
  };

  // Default "next plan" shown prominently = Swiftie Starter
  const featuredPlan = UPSELL_PLANS[0];

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden rounded-2xl">
        {/* Hero banner */}
        <div className="bg-gradient-to-br from-purple-600 via-pink-600 to-indigo-600 px-8 py-6 text-white">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="h-5 w-5 text-yellow-300" />
            <Badge className="bg-white/20 text-white border-0 text-xs">Credits Exhausted</Badge>
          </div>
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-white">
              You're out of credits ✨
            </DialogTitle>
            <DialogDescription className="text-purple-100 text-sm mt-1">
              Upgrade your plan to keep creating Taylor-themed stories without limits.
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Plan cards */}
        <div className="p-6 space-y-4">
          <p className="text-sm font-medium text-gray-500">Choose your era 👇</p>

          <AnimatePresence>
            <div className="grid grid-cols-1 gap-3">
              {UPSELL_PLANS.map((plan, i) => (
                <motion.div
                  key={plan.key}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className={`rounded-xl bg-gradient-to-r ${plan.gradient} border border-gray-100 p-4 flex items-center justify-between gap-4 hover:shadow-md transition-shadow cursor-pointer group`}
                  onClick={() => handleUpgrade(plan)}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {plan.icon}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-gray-900">{plan.name}</span>
                        <Badge className={`text-xs ${plan.badgeColor} border-0`}>
                          {plan.credits} credits/mo
                        </Badge>
                        {plan.key === 'midnights' && (
                          <Badge className="text-xs bg-pink-100 text-pink-700 border-0">
                            ⭐ Popular
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 italic">{plan.tagline}</p>
                      <ul className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
                        {plan.highlights.slice(0, 3).map((h) => (
                          <li key={h} className="flex items-center gap-1 text-xs text-gray-600">
                            <CheckCircle className="h-3 w-3 text-green-500 shrink-0" />
                            {h}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <div className="text-lg font-bold text-gray-900">${plan.price}</div>
                      <div className="text-xs text-gray-400">/month</div>
                    </div>
                    <Button
                      size="sm"
                      className="group-hover:translate-x-0.5 transition-transform bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0"
                      onClick={(e) => { e.stopPropagation(); handleUpgrade(plan); }}
                    >
                      Upgrade <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          </AnimatePresence>

          {/* Footer actions */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <Button variant="link" className="text-xs text-gray-400 p-0" onClick={handleViewAllPlans}>
              Compare all plans →
            </Button>
            <Button variant="ghost" size="sm" onClick={() => handleOpenChange(false)}>
              Maybe later
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreditExhaustionModal;
