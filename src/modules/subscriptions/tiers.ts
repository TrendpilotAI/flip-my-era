/**
 * Subscription Tiers Module
 * 
 * Defines subscription plans: Basic (3 ebooks/mo), Pro (unlimited), Enterprise (API access)
 * Re-exports and extends the billing module's tier system with additional helpers.
 */

export type SubscriptionTierId = 'free' | 'basic' | 'pro' | 'enterprise';

export interface TierLimits {
  ebooksPerMonth: number | null; // null = unlimited
  templatesAccess: 'standard' | 'all' | 'custom';
  apiAccess: boolean;
  teamMembers: number;
  priorityQueue: boolean;
  whiteLabel: boolean;
  printReady: boolean;
  watermark: boolean;
}

export interface SubscriptionPlan {
  id: SubscriptionTierId;
  name: string;
  tagline: string;
  pricing: {
    monthly: number;
    annual: number; // per month when billed annually
    stripePriceIdMonthly: string;
    stripePriceIdAnnual: string;
  };
  limits: TierLimits;
  features: string[];
  recommended?: boolean;
}

// ─── Stripe Price IDs (configure via env in production) ──────

const STRIPE_PRICES = {
  basic_monthly: import.meta.env?.VITE_STRIPE_BASIC_MONTHLY ?? 'price_basic_monthly',
  basic_annual: import.meta.env?.VITE_STRIPE_BASIC_ANNUAL ?? 'price_basic_annual',
  pro_monthly: import.meta.env?.VITE_STRIPE_PRO_MONTHLY ?? 'price_pro_monthly',
  pro_annual: import.meta.env?.VITE_STRIPE_PRO_ANNUAL ?? 'price_pro_annual',
  enterprise_monthly: import.meta.env?.VITE_STRIPE_ENTERPRISE_MONTHLY ?? 'price_enterprise_monthly',
  enterprise_annual: import.meta.env?.VITE_STRIPE_ENTERPRISE_ANNUAL ?? 'price_enterprise_annual',
};

// ─── Plan Definitions ────────────────────────────────────────

export const SUBSCRIPTION_PLANS: Record<SubscriptionTierId, SubscriptionPlan> = {
  free: {
    id: 'free',
    name: 'Debut',
    tagline: 'Start your era',
    pricing: {
      monthly: 0,
      annual: 0,
      stripePriceIdMonthly: '',
      stripePriceIdAnnual: '',
    },
    limits: {
      ebooksPerMonth: 1,
      templatesAccess: 'standard',
      apiAccess: false,
      teamMembers: 1,
      priorityQueue: false,
      whiteLabel: false,
      printReady: false,
      watermark: true,
    },
    features: ['1 ebook per month', 'Standard templates', 'Community support'],
  },
  basic: {
    id: 'basic',
    name: 'Speak Now',
    tagline: 'Find your voice',
    pricing: {
      monthly: 9.99,
      annual: 7.99,
      stripePriceIdMonthly: STRIPE_PRICES.basic_monthly,
      stripePriceIdAnnual: STRIPE_PRICES.basic_annual,
    },
    limits: {
      ebooksPerMonth: 3,
      templatesAccess: 'standard',
      apiAccess: false,
      teamMembers: 1,
      priorityQueue: false,
      whiteLabel: false,
      printReady: false,
      watermark: true,
    },
    features: [
      '3 ebooks per month',
      'Standard templates',
      'Email support',
      'Basic analytics',
    ],
  },
  pro: {
    id: 'pro',
    name: 'Midnights',
    tagline: "You're the main character",
    recommended: true,
    pricing: {
      monthly: 19.99,
      annual: 15.99,
      stripePriceIdMonthly: STRIPE_PRICES.pro_monthly,
      stripePriceIdAnnual: STRIPE_PRICES.pro_annual,
    },
    limits: {
      ebooksPerMonth: null, // unlimited
      templatesAccess: 'custom',
      apiAccess: false,
      teamMembers: 1,
      priorityQueue: true,
      whiteLabel: false,
      printReady: true,
      watermark: false,
    },
    features: [
      'Unlimited ebooks',
      'All templates + custom',
      'Priority support',
      'No watermark',
      'Priority generation queue',
      'Print-ready exports',
      'Early access to features',
    ],
  },
  enterprise: {
    id: 'enterprise',
    name: 'The Eras Tour',
    tagline: 'For teams and brands',
    pricing: {
      monthly: 49.99,
      annual: 39.99,
      stripePriceIdMonthly: STRIPE_PRICES.enterprise_monthly,
      stripePriceIdAnnual: STRIPE_PRICES.enterprise_annual,
    },
    limits: {
      ebooksPerMonth: null,
      templatesAccess: 'custom',
      apiAccess: true,
      teamMembers: 25,
      priorityQueue: true,
      whiteLabel: true,
      printReady: true,
      watermark: false,
    },
    features: [
      'Everything in Pro',
      'API access',
      'Team accounts (up to 25)',
      'White-label branding',
      'Dedicated support',
      'Custom integrations',
    ],
  },
};

// ─── Helpers ─────────────────────────────────────────────────

const TIER_ORDER: SubscriptionTierId[] = ['free', 'basic', 'pro', 'enterprise'];

/** Check if user can create another ebook this month */
export function canCreateEbook(tier: SubscriptionTierId, currentMonthCount: number): boolean {
  const plan = SUBSCRIPTION_PLANS[tier];
  if (!plan) return false;
  if (plan.limits.ebooksPerMonth === null) return true;
  return currentMonthCount < plan.limits.ebooksPerMonth;
}

/** Get remaining ebooks for the month */
export function getRemainingEbooks(tier: SubscriptionTierId, currentMonthCount: number): number | 'unlimited' {
  const plan = SUBSCRIPTION_PLANS[tier];
  if (!plan) return 0;
  if (plan.limits.ebooksPerMonth === null) return 'unlimited';
  return Math.max(0, plan.limits.ebooksPerMonth - currentMonthCount);
}

/** Check if a tier has a specific capability */
export function hasCapability(tier: SubscriptionTierId, capability: keyof TierLimits): boolean {
  const plan = SUBSCRIPTION_PLANS[tier];
  if (!plan) return false;
  const val = plan.limits[capability];
  if (typeof val === 'boolean') return val;
  if (typeof val === 'number') return val > 0;
  if (val === null) return true; // unlimited
  return val !== 'standard';
}

/** Get tier rank (0-3) */
export function getTierRank(tier: SubscriptionTierId): number {
  return TIER_ORDER.indexOf(tier);
}

/** Check if tier A >= tier B */
export function isAtLeast(currentTier: SubscriptionTierId, requiredTier: SubscriptionTierId): boolean {
  return getTierRank(currentTier) >= getTierRank(requiredTier);
}

/** Get upgrade options from current tier */
export function getUpgradeOptions(currentTier: SubscriptionTierId): SubscriptionPlan[] {
  const idx = TIER_ORDER.indexOf(currentTier);
  return TIER_ORDER.slice(idx + 1).map(t => SUBSCRIPTION_PLANS[t]);
}

/** Calculate annual savings */
export function getAnnualSavings(tier: SubscriptionTierId): number {
  const plan = SUBSCRIPTION_PLANS[tier];
  if (!plan || plan.pricing.monthly === 0) return 0;
  return (plan.pricing.monthly - plan.pricing.annual) * 12;
}
