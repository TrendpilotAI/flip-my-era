import { describe, expect, it } from 'vitest';

import { resolveStripeSecretKey } from '../../supabase/functions/_shared/stripe';

describe('resolveStripeSecretKey', () => {
  it('uses a valid Stripe secret key', () => {
    expect(resolveStripeSecretKey('sk_test_primary', undefined)).toBe('sk_test_primary');
  });

  it('falls back to the legacy server-key variable', () => {
    expect(resolveStripeSecretKey('pk_test_browser', 'sk_live_legacy')).toBe('sk_live_legacy');
  });

  it('never accepts a publishable key as server credentials', () => {
    expect(() => resolveStripeSecretKey('pk_live_browser', 'pk_test_other')).toThrow(
      'Stripe server secret is not configured',
    );
  });
});
