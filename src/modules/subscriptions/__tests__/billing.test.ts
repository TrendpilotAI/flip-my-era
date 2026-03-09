import { describe, it, expect, beforeEach, vi } from 'vitest';
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

// ─── Mock Supabase ────────────────────────────────────────────────────────────

// In-memory store used by mock
const _usageRows: Record<string, unknown>[] = [];
const _subscriptionRows: Record<string, unknown>[] = [];

vi.mock('@/integrations/supabase/client', () => {
  const mockFrom = (table: string) => {
    if (table === 'credit_transactions') {
      return {
        insert: async (row: Record<string, unknown>) => {
          _usageRows.push(row);
          return { error: null };
        },
        select: (_cols: string) => ({
          eq: (_col: string, userId: string) => ({
            like: (_col2: string, pattern: string) => {
              const period = pattern.replace('%', '');
              const rows = _usageRows.filter(
                r => r.user_id === userId && (r.created_at as string).startsWith(period),
              );
              return { data: rows, error: null };
            },
            order: (_col2: string, _opts: unknown) => {
              const rows = _usageRows.filter(r => r.user_id === userId);
              return { data: rows, error: null };
            },
          }),
        }),
      };
    }
    if (table === 'subscriptions') {
      return {
        upsert: async (row: Record<string, unknown>) => {
          const idx = _subscriptionRows.findIndex(r => r.user_id === row.user_id);
          if (idx >= 0) _subscriptionRows[idx] = row;
          else _subscriptionRows.push(row);
          return { error: null };
        },
      };
    }
    return { insert: async () => ({ error: null }), upsert: async () => ({ error: null }) };
  };

  const mockFunctions = {
    invoke: async (fn: string, opts?: { body?: Record<string, unknown> }) => {
      if (fn === 'create-checkout') {
        const { stripePriceId } = opts?.body ?? {};
        return {
          data: { url: `https://checkout.stripe.com/pay/cs_test_${stripePriceId}` },
          error: null,
        };
      }
      if (fn === 'check-subscription') {
        const userId = opts?.body?.userId as string;
        const row = _subscriptionRows.find(r => r.user_id === userId);
        if (!row) return { data: { subscribed: false }, error: null };
        return {
          data: {
            subscribed: true,
            subscription_id: row.subscription_id,
            customer_id: row.customer_id,
            plan: row.tier,
            status: row.status,
            current_period_start: row.current_period_start,
            subscription_end: row.current_period_end,
            cancel_at_period_end: row.cancel_at_period_end,
          },
          error: null,
        };
      }
      return { data: null, error: new Error(`Unknown function: ${fn}`) };
    },
  };

  return {
    supabase: {
      from: mockFrom,
      functions: mockFunctions,
    },
  };
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Usage-Based Billing', () => {
  beforeEach(() => {
    _clearUsageStore(); // no-op, but kept for readability
    _usageRows.length = 0;
    _subscriptionRows.length = 0;
  });

  describe('recordUsage', () => {
    it('records a usage event', async () => {
      const record = await recordUsage('user1', 'ebook_generated');
      expect(record.userId).toBe('user1');
      expect(record.action).toBe('ebook_generated');
      expect(record.quantity).toBe(1);
    });

    it('throws on empty userId', async () => {
      await expect(recordUsage('', 'ebook_generated')).rejects.toThrow('userId is required');
    });

    it('throws on non-positive quantity', async () => {
      await expect(recordUsage('user1', 'ebook_generated', 0)).rejects.toThrow('quantity must be positive');
    });

    it('stores metadata', async () => {
      const record = await recordUsage('user1', 'api_call', 1, { endpoint: '/generate' });
      expect(record.metadata?.endpoint).toBe('/generate');
    });
  });

  describe('getUserUsage', () => {
    it('aggregates usage correctly', async () => {
      await recordUsage('user1', 'ebook_generated', 2);
      await recordUsage('user1', 'export_pdf', 1);
      await recordUsage('user1', 'api_call', 5);

      const usage = await getUserUsage('user1');
      expect(usage.ebooksGenerated).toBe(2);
      expect(usage.exports).toBe(1);
      expect(usage.apiCalls).toBe(5);
    });

    it('returns zero for unknown user', async () => {
      const usage = await getUserUsage('nobody');
      expect(usage.ebooksGenerated).toBe(0);
    });
  });

  describe('checkUsageLimit', () => {
    it('allows ebook generation under limit', async () => {
      const result = await checkUsageLimit('user1', 'basic', 'ebook_generated');
      expect(result.allowed).toBe(true);
    });

    it('blocks ebook generation at limit for basic', async () => {
      await recordUsage('user1', 'ebook_generated', 3);
      const result = await checkUsageLimit('user1', 'basic', 'ebook_generated');
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('limit');
    });

    it('allows unlimited for pro', async () => {
      for (let i = 0; i < 100; i++) await recordUsage('user1', 'ebook_generated');
      const result = await checkUsageLimit('user1', 'pro', 'ebook_generated');
      expect(result.allowed).toBe(true);
    });

    it('blocks API access for non-enterprise', async () => {
      const result = await checkUsageLimit('user1', 'pro', 'api_call');
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Enterprise');
    });

    it('allows API access for enterprise', async () => {
      const result = await checkUsageLimit('user1', 'enterprise', 'api_call');
      expect(result.allowed).toBe(true);
    });
  });

  describe('Stripe / edge function stubs', () => {
    it('reportMeteredUsageToStripe returns usage record', async () => {
      const result = await reportMeteredUsageToStripe('si_123', 5);
      expect(result.quantity).toBe(5);
      expect(result.id).toMatch(/^usage_/);
    });

    it('createSubscriptionCheckout calls create-checkout edge function', async () => {
      const result = await createSubscriptionCheckout('cus_1', 'price_test_123', '/success', '/cancel');
      expect(result.url).toContain('checkout.stripe.com');
      expect(result.sessionId).toBeTruthy();
    });

    it('cancelSubscription returns timestamp', async () => {
      const result = await cancelSubscription('sub_123');
      expect(result.canceledAt).toBeTruthy();
    });
  });

  describe('subscription info', () => {
    it('stores and retrieves subscription info via Supabase', async () => {
      await setSubscriptionInfo('user1', {
        subscriptionId: 'sub_1',
        customerId: 'cus_1',
        tier: 'pro',
        status: 'active',
        currentPeriodStart: '2025-01-01',
        currentPeriodEnd: '2025-02-01',
        cancelAtPeriodEnd: false,
      });
      const info = await getSubscriptionInfo('user1');
      expect(info?.tier).toBe('pro');
      expect(info?.status).toBe('active');
    });

    it('returns null for unknown user', async () => {
      const info = await getSubscriptionInfo('nobody');
      expect(info).toBeNull();
    });
  });
});
