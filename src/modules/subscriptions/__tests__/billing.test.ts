import { describe, it, expect, beforeEach } from 'vitest';
import {
  recordUsage,
  getUserUsage,
  checkUsageLimit,
  reportMeteredUsageToStripe,
  cancelSubscription,
  createSubscriptionCheckout,
  setSubscriptionInfo,
  getSubscriptionInfo,
  getAllUsageRecords,
  _clearUsageStore,
} from '../billing';

describe('Usage-Based Billing', () => {
  beforeEach(() => {
    _clearUsageStore();
  });

  describe('recordUsage', () => {
    it('records a usage event', () => {
      const record = recordUsage('user1', 'ebook_generated');
      expect(record.userId).toBe('user1');
      expect(record.action).toBe('ebook_generated');
      expect(record.quantity).toBe(1);
    });

    it('throws on empty userId', () => {
      expect(() => recordUsage('', 'ebook_generated')).toThrow('userId is required');
    });

    it('throws on non-positive quantity', () => {
      expect(() => recordUsage('user1', 'ebook_generated', 0)).toThrow('quantity must be positive');
    });

    it('stores metadata', () => {
      const record = recordUsage('user1', 'api_call', 1, { endpoint: '/generate' });
      expect(record.metadata?.endpoint).toBe('/generate');
    });
  });

  describe('getUserUsage', () => {
    it('aggregates usage correctly', () => {
      recordUsage('user1', 'ebook_generated', 2);
      recordUsage('user1', 'export_pdf', 1);
      recordUsage('user1', 'api_call', 5);

      const usage = getUserUsage('user1');
      expect(usage.ebooksGenerated).toBe(2);
      expect(usage.exports).toBe(1);
      expect(usage.apiCalls).toBe(5);
    });

    it('returns zero for unknown user', () => {
      const usage = getUserUsage('nobody');
      expect(usage.ebooksGenerated).toBe(0);
    });
  });

  describe('checkUsageLimit', () => {
    it('allows ebook generation under limit', () => {
      const result = checkUsageLimit('user1', 'basic', 'ebook_generated');
      expect(result.allowed).toBe(true);
    });

    it('blocks ebook generation at limit for basic', () => {
      recordUsage('user1', 'ebook_generated', 3);
      const result = checkUsageLimit('user1', 'basic', 'ebook_generated');
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('limit');
    });

    it('allows unlimited for pro', () => {
      for (let i = 0; i < 100; i++) recordUsage('user1', 'ebook_generated');
      const result = checkUsageLimit('user1', 'pro', 'ebook_generated');
      expect(result.allowed).toBe(true);
    });

    it('blocks API access for non-enterprise', () => {
      const result = checkUsageLimit('user1', 'pro', 'api_call');
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Enterprise');
    });

    it('allows API access for enterprise', () => {
      const result = checkUsageLimit('user1', 'enterprise', 'api_call');
      expect(result.allowed).toBe(true);
    });
  });

  describe('Stripe stubs', () => {
    it('reportMeteredUsageToStripe returns usage record', async () => {
      const result = await reportMeteredUsageToStripe('si_123', 5);
      expect(result.quantity).toBe(5);
      expect(result.id).toMatch(/^usage_/);
    });

    it('createSubscriptionCheckout returns session', async () => {
      const result = await createSubscriptionCheckout('cus_1', 'price_1', '/success', '/cancel');
      expect(result.sessionId).toMatch(/^cs_/);
      expect(result.url).toContain('checkout.stripe.com');
    });

    it('cancelSubscription returns timestamp', async () => {
      const result = await cancelSubscription('sub_123');
      expect(result.canceledAt).toBeTruthy();
    });
  });

  describe('subscription info', () => {
    it('stores and retrieves subscription info', () => {
      setSubscriptionInfo('user1', {
        subscriptionId: 'sub_1',
        customerId: 'cus_1',
        tier: 'pro',
        status: 'active',
        currentPeriodStart: '2025-01-01',
        currentPeriodEnd: '2025-02-01',
        cancelAtPeriodEnd: false,
      });
      const info = getSubscriptionInfo('user1');
      expect(info?.tier).toBe('pro');
      expect(info?.status).toBe('active');
    });

    it('returns null for unknown user', () => {
      expect(getSubscriptionInfo('nobody')).toBeNull();
    });
  });
});
