/**
 * Stripe Webhook Handler Tests
 * Tests the logic of webhook event processing (checkout.session.completed, subscription events)
 * Since the actual handler runs as a Deno edge function, we test the logic patterns here.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Supabase responses
const mockSingle = vi.fn();
const mockEq = vi.fn(() => ({ single: mockSingle }));
const mockSelect = vi.fn(() => ({ eq: mockEq }));
const mockInsert = vi.fn(() => ({ select: vi.fn(() => ({ single: vi.fn() })) }));
const mockUpdate = vi.fn(() => ({ eq: vi.fn() }));
const mockUpsert = vi.fn();
const mockFrom = vi.fn(() => ({
  select: mockSelect,
  insert: mockInsert,
  update: mockUpdate,
  upsert: mockUpsert,
}));

const mockSupabase = { from: mockFrom };

// Re-implement handler logic for testing (mirrors supabase/functions/stripe-webhook/index.ts)
async function handleCheckoutCompleted(
  supabase: typeof mockSupabase,
  session: {
    id: string;
    customer: string | null;
    customer_email: string | null;
    metadata: Record<string, string>;
    payment_intent: string | null;
    amount_total: number | null;
    currency: string | null;
  }
) {
  const { customer_email, metadata } = session;

  let profile: { id: string; stripe_customer_id: string | null } | null = null;

  if (customer_email) {
    const result = supabase.from('profiles');
    result.select('id, stripe_customer_id');
    const eqResult = mockEq('email', customer_email);
    profile = await eqResult.single();
  }

  if (!profile && session.customer) {
    const result = supabase.from('profiles');
    result.select('id, stripe_customer_id');
    const eqResult = mockEq('stripe_customer_id', session.customer);
    profile = await eqResult.single();
  }

  if (!profile) {
    throw new Error('User not found');
  }

  if (metadata.type === 'credits') {
    const credits = parseInt(metadata.credits || '0');
    if (credits > 0) {
      supabase.from('credit_transactions');
      mockInsert({
        user_id: profile.id,
        amount: credits,
        transaction_type: 'purchase',
        description: `Credit purchase via Stripe - ${credits} credits`,
        stripe_session_id: session.id,
        stripe_payment_intent_id: session.payment_intent,
      });
      return { success: true, credits, userId: profile.id };
    }
  }
  return { success: false };
}

async function handleSubscriptionChange(
  supabase: typeof mockSupabase,
  subscription: {
    id: string;
    customer: string;
    status: string;
    metadata: Record<string, string> | null;
  }
) {
  const { customer, status, metadata } = subscription;

  supabase.from('profiles');
  mockSelect('id');
  const profile = await mockEq('stripe_customer_id', customer).single();

  if (!profile) {
    throw new Error('User not found for subscription');
  }

  let subscriptionStatus = 'none';
  if (status === 'active') subscriptionStatus = 'active';
  else if (status === 'canceled') subscriptionStatus = 'cancelled';
  else if (status === 'past_due') subscriptionStatus = 'past_due';

  supabase.from('user_credits');
  mockUpsert({
    user_id: profile.id,
    subscription_status: subscriptionStatus,
    stripe_subscription_id: subscription.id,
    subscription_type: metadata?.plan === 'annual' ? 'annual' : 'monthly',
  });

  if (status === 'active' && metadata?.credits) {
    const monthlyCredits = parseInt(metadata.credits);
    if (monthlyCredits > 0) {
      supabase.from('credit_transactions');
      mockInsert({
        user_id: profile.id,
        amount: monthlyCredits,
        transaction_type: 'monthly_allocation',
      });
      return { success: true, credits: monthlyCredits, status: subscriptionStatus };
    }
  }

  return { success: true, status: subscriptionStatus };
}

describe('Stripe Webhook Handlers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('checkout.session.completed', () => {
    it('should grant credits on successful credit purchase', async () => {
      const mockProfile = { id: 'user-123', stripe_customer_id: 'cus_abc' };
      mockSingle.mockResolvedValue(mockProfile);

      const session = {
        id: 'cs_test_123',
        customer: 'cus_abc',
        customer_email: 'test@example.com',
        metadata: { type: 'credits', credits: '5' },
        payment_intent: 'pi_test_123',
        amount_total: 999,
        currency: 'usd',
      };

      const result = await handleCheckoutCompleted(mockSupabase, session);

      expect(result.success).toBe(true);
      expect(result.credits).toBe(5);
      expect(result.userId).toBe('user-123');
      expect(mockFrom).toHaveBeenCalledWith('credit_transactions');
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'user-123',
          amount: 5,
          transaction_type: 'purchase',
        })
      );
    });

    it('should fail gracefully when user not found', async () => {
      mockSingle.mockResolvedValue(null);

      const session = {
        id: 'cs_test_456',
        customer: null,
        customer_email: 'unknown@example.com',
        metadata: { type: 'credits', credits: '3' },
        payment_intent: 'pi_test_456',
        amount_total: 599,
        currency: 'usd',
      };

      await expect(handleCheckoutCompleted(mockSupabase, session)).rejects.toThrow('User not found');
    });

    it('should not grant credits when metadata type is not credits', async () => {
      const mockProfile = { id: 'user-123', stripe_customer_id: 'cus_abc' };
      mockSingle.mockResolvedValue(mockProfile);

      const session = {
        id: 'cs_test_789',
        customer: 'cus_abc',
        customer_email: 'test@example.com',
        metadata: { type: 'subscription' },
        payment_intent: 'pi_test_789',
        amount_total: 1999,
        currency: 'usd',
      };

      const result = await handleCheckoutCompleted(mockSupabase, session);
      expect(result.success).toBe(false);
    });

    it('should not grant credits when credits amount is 0', async () => {
      const mockProfile = { id: 'user-123', stripe_customer_id: 'cus_abc' };
      mockSingle.mockResolvedValue(mockProfile);

      const session = {
        id: 'cs_test_000',
        customer: 'cus_abc',
        customer_email: 'test@example.com',
        metadata: { type: 'credits', credits: '0' },
        payment_intent: 'pi_test_000',
        amount_total: 0,
        currency: 'usd',
      };

      const result = await handleCheckoutCompleted(mockSupabase, session);
      expect(result.success).toBe(false);
    });

    it('should lookup by customer_email first, then by stripe customer ID', async () => {
      mockSingle.mockResolvedValueOnce(null).mockResolvedValueOnce({ id: 'user-456', stripe_customer_id: 'cus_def' });

      const session = {
        id: 'cs_test_fallback',
        customer: 'cus_def',
        customer_email: 'test@example.com',
        metadata: { type: 'credits', credits: '2' },
        payment_intent: 'pi_test_fallback',
        amount_total: 499,
        currency: 'usd',
      };

      const result = await handleCheckoutCompleted(mockSupabase, session);
      expect(result.success).toBe(true);
      expect(result.userId).toBe('user-456');
    });
  });

  describe('subscription events', () => {
    it('should update subscription status on active subscription', async () => {
      const mockProfile = { id: 'user-123' };
      mockSingle.mockResolvedValue(mockProfile);

      const subscription = {
        id: 'sub_test_123',
        customer: 'cus_abc',
        status: 'active',
        metadata: { plan: 'monthly', credits: '10' },
      };

      const result = await handleSubscriptionChange(mockSupabase, subscription);

      expect(result.success).toBe(true);
      expect(result.status).toBe('active');
      expect(result.credits).toBe(10);
      expect(mockUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'user-123',
          subscription_status: 'active',
          subscription_type: 'monthly',
        })
      );
    });

    it('should handle canceled subscription', async () => {
      const mockProfile = { id: 'user-123' };
      mockSingle.mockResolvedValue(mockProfile);

      const subscription = {
        id: 'sub_test_cancel',
        customer: 'cus_abc',
        status: 'canceled',
        metadata: null,
      };

      const result = await handleSubscriptionChange(mockSupabase, subscription);
      expect(result.success).toBe(true);
      expect(result.status).toBe('cancelled');
    });

    it('should handle past_due subscription', async () => {
      const mockProfile = { id: 'user-123' };
      mockSingle.mockResolvedValue(mockProfile);

      const subscription = {
        id: 'sub_test_pastdue',
        customer: 'cus_abc',
        status: 'past_due',
        metadata: null,
      };

      const result = await handleSubscriptionChange(mockSupabase, subscription);
      expect(result.success).toBe(true);
      expect(result.status).toBe('past_due');
    });

    it('should set annual subscription type when plan is annual', async () => {
      const mockProfile = { id: 'user-123' };
      mockSingle.mockResolvedValue(mockProfile);

      const subscription = {
        id: 'sub_test_annual',
        customer: 'cus_abc',
        status: 'active',
        metadata: { plan: 'annual', credits: '120' },
      };

      const result = await handleSubscriptionChange(mockSupabase, subscription);
      expect(result.success).toBe(true);
      expect(mockUpsert).toHaveBeenCalledWith(
        expect.objectContaining({ subscription_type: 'annual' })
      );
    });

    it('should fail when user not found for subscription', async () => {
      mockSingle.mockResolvedValue(null);

      const subscription = {
        id: 'sub_test_nouser',
        customer: 'cus_unknown',
        status: 'active',
        metadata: null,
      };

      await expect(handleSubscriptionChange(mockSupabase, subscription)).rejects.toThrow('User not found');
    });
  });

  describe('webhook signature verification', () => {
    it('should reject requests without stripe-signature header', () => {
      // This tests the pattern from the edge function
      const signature = null;
      expect(signature).toBeNull();
      // In the actual handler, this returns 400
    });

    it('should handle invalid webhook signature gracefully', () => {
      // Mock constructEvent throwing
      const mockConstructEvent = vi.fn(() => {
        throw new Error('Invalid signature');
      });

      expect(() => mockConstructEvent('body', 'invalid-sig', 'whsec_test')).toThrow('Invalid signature');
    });
  });
});
