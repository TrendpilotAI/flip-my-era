/**
 * Subscription Tiers — Feature access control and upgrade paths
 * 
 * Maps to existing era-themed tiers:
 *   Debut (Free) → Basic ($9.99) → Pro ($19.99) → Enterprise ($49.99)
 * 
 * This module adds feature-gating logic on top of the existing
 * STRIPE_PRODUCTS configuration.
 */

// ─── Types ───────────────────────────────────────────────────

export type SubscriptionTier = 'free' | 'basic' | 'pro' | 'enterprise';

export interface TierDefinition {
  id: SubscriptionTier;
  name: string;
  tagline: string;
  monthlyPrice: number;
  annualPricePerMonth: number;
  ebooksPerMonth: number | 'unlimited';
  features: TierFeature[];
}

export interface TierFeature {
  key: FeatureKey;
  label: string;
  included: boolean;
}

export type FeatureKey =
  | 'ebooks_basic'
  | 'standard_templates'
  | 'email_support'
  | 'unlimited_ebooks'
  | 'all_templates'
  | 'custom_templates'
  | 'priority_support'
  | 'no_watermark'
  | 'api_access'
  | 'team_accounts'
  | 'white_label'
  | 'priority_generation'
  | 'early_access'
  | 'print_ready';

// ─── Tier Definitions ────────────────────────────────────────

const TIER_ORDER: SubscriptionTier[] = ['free', 'basic', 'pro', 'enterprise'];

const ALL_FEATURES: { key: FeatureKey; label: string }[] = [
  { key: 'ebooks_basic', label: '3 ebooks per month' },
  { key: 'standard_templates', label: 'Standard templates' },
  { key: 'email_support', label: 'Email support' },
  { key: 'unlimited_ebooks', label: 'Unlimited ebooks' },
  { key: 'all_templates', label: 'All templates' },
  { key: 'custom_templates', label: 'Custom templates' },
  { key: 'priority_support', label: 'Priority support' },
  { key: 'no_watermark', label: 'No watermark on exports' },
  { key: 'priority_generation', label: 'Priority generation queue' },
  { key: 'early_access', label: 'Early access to features' },
  { key: 'print_ready', label: 'Print-ready exports' },
  { key: 'api_access', label: 'API access' },
  { key: 'team_accounts', label: 'Team accounts' },
  { key: 'white_label', label: 'White-label branding' },
];

const TIER_FEATURE_MAP: Record<SubscriptionTier, Set<FeatureKey>> = {
  free: new Set(['ebooks_basic']),
  basic: new Set([
    'ebooks_basic',
    'standard_templates',
    'email_support',
  ]),
  pro: new Set([
    'ebooks_basic',
    'unlimited_ebooks',
    'standard_templates',
    'all_templates',
    'custom_templates',
    'priority_support',
    'no_watermark',
    'priority_generation',
    'early_access',
    'print_ready',
  ]),
  enterprise: new Set([
    'ebooks_basic',
    'unlimited_ebooks',
    'standard_templates',
    'all_templates',
    'custom_templates',
    'priority_support',
    'no_watermark',
    'priority_generation',
    'early_access',
    'print_ready',
    'api_access',
    'team_accounts',
    'white_label',
  ]),
};

export const TIERS: Record<SubscriptionTier, TierDefinition> = {
  free: {
    id: 'free',
    name: 'Debut',
    tagline: 'Start your era',
    monthlyPrice: 0,
    annualPricePerMonth: 0,
    ebooksPerMonth: 1,
    features: buildFeatureList('free'),
  },
  basic: {
    id: 'basic',
    name: 'Speak Now',
    tagline: 'Find your voice',
    monthlyPrice: 9.99,
    annualPricePerMonth: 7.99,
    ebooksPerMonth: 3,
    features: buildFeatureList('basic'),
  },
  pro: {
    id: 'pro',
    name: 'Midnights',
    tagline: "You're the main character",
    monthlyPrice: 19.99,
    annualPricePerMonth: 15.99,
    ebooksPerMonth: 'unlimited',
    features: buildFeatureList('pro'),
  },
  enterprise: {
    id: 'enterprise',
    name: 'The Eras Tour',
    tagline: 'For teams and brands',
    monthlyPrice: 49.99,
    annualPricePerMonth: 39.99,
    ebooksPerMonth: 'unlimited',
    features: buildFeatureList('enterprise'),
  },
};

// ─── Public API ──────────────────────────────────────────────

function buildFeatureList(tier: SubscriptionTier): TierFeature[] {
  const included = TIER_FEATURE_MAP[tier];
  return ALL_FEATURES.map((f) => ({
    key: f.key,
    label: f.label,
    included: included.has(f.key),
  }));
}

/** Get features for a tier with included/excluded flags */
export function getTierFeatures(tier: SubscriptionTier): TierFeature[] {
  return TIERS[tier]?.features ?? [];
}

/** Check if a user's tier grants access to a specific feature */
export function checkFeatureAccess(userTier: SubscriptionTier, feature: FeatureKey): boolean {
  return TIER_FEATURE_MAP[userTier]?.has(feature) ?? false;
}

/** Get available upgrade options from current tier */
export function getUpgradePath(currentTier: SubscriptionTier): TierDefinition[] {
  const currentIndex = TIER_ORDER.indexOf(currentTier);
  if (currentIndex === -1) return [];
  return TIER_ORDER.slice(currentIndex + 1).map((t) => TIERS[t]);
}

/** Get tier rank for comparison (higher = better) */
export function getTierRank(tier: SubscriptionTier): number {
  return TIER_ORDER.indexOf(tier);
}
