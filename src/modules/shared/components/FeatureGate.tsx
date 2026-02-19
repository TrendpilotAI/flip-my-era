import React from 'react';
import { useFeatureFlag } from '@/modules/shared/hooks/useFeatureFlag';
import type { FeatureFlag } from '@/core/config/featureFlags';
import NotFound from '@/app/pages/NotFound';

interface FeatureGateProps {
  flag: FeatureFlag;
  children: React.ReactNode;
  /** What to show when disabled. Defaults to NotFound page for routes, null for inline. */
  fallback?: React.ReactNode | 'notfound' | null;
}

/**
 * Conditionally render children based on a feature flag.
 * 
 * For routes: <FeatureGate flag="marketplace" fallback="notfound"><Marketplace /></FeatureGate>
 * For inline UI: <FeatureGate flag="gift_cards"><GiftCardButton /></FeatureGate>
 */
export function FeatureGate({ flag, children, fallback = null }: FeatureGateProps) {
  const enabled = useFeatureFlag(flag);

  if (!enabled) {
    if (fallback === 'notfound') return <NotFound />;
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
