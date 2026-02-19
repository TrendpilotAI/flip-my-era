/**
 * A/B Testing Framework
 * Simple feature flag system using localStorage + PostHog feature flags
 */

import { posthogService } from '@/core/integrations/posthog';
import { ANALYTICS_EVENTS } from './events';

export type Variant = 'control' | 'variant_a' | 'variant_b';

const STORAGE_PREFIX = 'ab_test_';

// ─── Known Experiments ─────────────────────────────────────────
export const EXPERIMENTS = {
  PRICING_PAGE: 'pricing_page_variant',
  SIGNUP_CTA: 'signup_cta_variant',
  CREDITS_LAYOUT: 'credits_layout_variant',
} as const;

export type ExperimentName = (typeof EXPERIMENTS)[keyof typeof EXPERIMENTS];

// ─── Core Functions ────────────────────────────────────────────

/**
 * Get the variant for a given experiment.
 * Priority: PostHog feature flag → localStorage → random assignment (saved to localStorage).
 */
export function getVariant(testName: string): Variant {
  // 1. Try PostHog feature flag
  if (posthogService.isInitialized()) {
    const flag = posthogService.getFeatureFlag(testName) as string | undefined;
    if (flag && isVariant(flag)) {
      // Persist so offline/non-PH environments stay consistent
      localStorage.setItem(STORAGE_PREFIX + testName, flag);
      return flag;
    }
  }

  // 2. Try localStorage
  const stored = localStorage.getItem(STORAGE_PREFIX + testName);
  if (stored && isVariant(stored)) {
    return stored;
  }

  // 3. Random assignment (50/50 control vs variant_a by default)
  const variant: Variant = Math.random() < 0.5 ? 'control' : 'variant_a';
  localStorage.setItem(STORAGE_PREFIX + testName, variant);

  // Report assignment to PostHog
  posthogService.capture(ANALYTICS_EVENTS.EXPERIMENT_VIEWED, {
    $experiment_name: testName,
    $variant: variant,
  });

  return variant;
}

/**
 * Track a conversion for an experiment.
 */
export function trackExperiment(testName: string, variant: Variant, converted: boolean) {
  posthogService.capture(ANALYTICS_EVENTS.EXPERIMENT_CONVERTED, {
    $experiment_name: testName,
    $variant: variant,
    converted,
  });
}

/**
 * Force a variant for testing/debugging.
 */
export function forceVariant(testName: string, variant: Variant) {
  localStorage.setItem(STORAGE_PREFIX + testName, variant);
}

/**
 * Clear a stored variant (re-randomize on next call).
 */
export function clearVariant(testName: string) {
  localStorage.removeItem(STORAGE_PREFIX + testName);
}

// ─── Helpers ───────────────────────────────────────────────────

function isVariant(value: string): value is Variant {
  return value === 'control' || value === 'variant_a' || value === 'variant_b';
}

// ─── React Hook ────────────────────────────────────────────────

import { useState, useEffect } from 'react';

/**
 * React hook for A/B tests. Returns the variant and a convert() callback.
 *
 * Usage:
 *   const { variant, convert } = useExperiment('pricing_page_variant');
 *   if (variant === 'variant_a') { ... }
 *   <Button onClick={convert}>Buy</Button>
 */
export function useExperiment(testName: string) {
  const [variant] = useState<Variant>(() => getVariant(testName));

  useEffect(() => {
    // Log exposure on mount
    posthogService.capture(ANALYTICS_EVENTS.EXPERIMENT_VIEWED, {
      $experiment_name: testName,
      $variant: variant,
    });
  }, [testName, variant]);

  const convert = () => trackExperiment(testName, variant, true);

  return { variant, convert } as const;
}
