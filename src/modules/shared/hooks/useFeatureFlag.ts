import { useMemo } from 'react';
import { isFeatureEnabled, type FeatureFlag } from '@/core/config/featureFlags';

/**
 * React hook for feature flag checks.
 * Usage: const enabled = useFeatureFlag('marketplace');
 */
export function useFeatureFlag(flag: FeatureFlag): boolean {
  return useMemo(() => isFeatureEnabled(flag), [flag]);
}
