/**
 * Feature Flags Configuration
 * 
 * Controls which features are visible to users.
 * Stub/incomplete features are flagged OFF by default so we can ship the core product.
 * 
 * Priority: ENV var > PostHog remote flag > default value
 * 
 * ENV format: VITE_FF_<FLAG_NAME>=true|false
 * e.g. VITE_FF_MARKETPLACE=true
 */

import { posthogService } from '@/core/integrations/posthog';

export type FeatureFlag =
  | 'marketplace'
  | 'creator_profiles'
  | 'gift_cards'
  | 'affiliates'
  | 'ai_image_tools'
  | 'premium_features'
  | 'style_transfer'
  | 'chapter_illustrations'
  | 'image_editor'
  | 'asset_library'
  | 'cover_art_generator'
  | 'referral_program'
  | 'test_credits';

/** Default values — false = hidden from users */
const FLAG_DEFAULTS: Record<FeatureFlag, boolean> = {
  // --- SHIPPED (core product) ---
  // Stories, dashboard, auth, checkout, ebook, gallery, SEO pages, settings, onboarding, admin — always on

  // --- FLAGGED OFF (stubs / future releases) ---
  marketplace: false,
  creator_profiles: false,
  gift_cards: false,
  affiliates: false,
  ai_image_tools: false,
  premium_features: false,
  style_transfer: false,
  chapter_illustrations: false,
  image_editor: false,
  asset_library: false,
  cover_art_generator: false,
  referral_program: false,
  test_credits: false,
};

/**
 * Check if a feature is enabled.
 * 1. Check VITE_FF_<NAME> env var
 * 2. Check PostHog remote flag
 * 3. Fall back to default
 */
export function isFeatureEnabled(flag: FeatureFlag): boolean {
  // 1. Env var override (highest priority)
  const envKey = `VITE_FF_${flag.toUpperCase()}`;
  const envVal = (import.meta.env as Record<string, string | undefined>)[envKey];
  if (envVal === 'true') return true;
  if (envVal === 'false') return false;

  // 2. PostHog remote flag
  if (posthogService.isInitialized()) {
    const remote = posthogService.isFeatureEnabled(flag);
    if (remote !== undefined && remote !== null) return remote;
  }

  // 3. Default
  return FLAG_DEFAULTS[flag];
}

/**
 * Get all feature flag states (useful for debugging / admin panel)
 */
export function getAllFlags(): Record<FeatureFlag, boolean> {
  const flags = {} as Record<FeatureFlag, boolean>;
  for (const key of Object.keys(FLAG_DEFAULTS) as FeatureFlag[]) {
    flags[key] = isFeatureEnabled(key);
  }
  return flags;
}
