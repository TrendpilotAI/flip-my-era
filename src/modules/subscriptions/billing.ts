/**
 * Usage-Based Billing Module
 * 
 * Stripe metered pricing integration stubs + usage tracking per user.
 */

import { SubscriptionTierId, SUBSCRIPTION_PLANS, canCreateEbook } from './tiers';

// ─── Types ───────────────────────────────────────────────────

export interface UsageRecord {
  userId: string;
  action: UsageAction;
  quantity: number;
  timestamp: string;
  metadata?: Record<string, string>;
}

export type UsageAction =
  | 'ebook_generated'
  | 'template_used'
  | 'api_call'
  | 'export_pdf'
  | 'export_epub'
  | 'image_generated';

export interface UserUsageSummary {
  userId: string;
  period: string; // YYYY-MM
  ebooksGenerated: number;
  apiCalls: number;
  exports: number;
  imagesGenerated: number;
}

export interface StripeSubscriptionInfo {
  subscriptionId: string;
  customerId: string;
  tier: SubscriptionTierId;
  status: 'active' | 'past_due' | 'canceled' | 'trialing';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
}

// ─── In-memory usage store (swap for DB in production) ───────

const usageStore: UsageRecord[] = [];
const subscriptionStore = new Map<string, StripeSubscriptionInfo>();

// ─── Usage Tracking ──────────────────────────────────────────

/** Record a usage event */
export function recordUsage(
  userId: string,
  action: UsageAction,
  quantity: number = 1,
  metadata?: Record<string, string>,
): UsageRecord {
  if (!userId) throw new Error('userId is required');
  if (quantity <= 0) throw new Error('quantity must be positive');

  const record: UsageRecord = {
    userId,
    action,
    quantity,
    timestamp: new Date().toISOString(),
    metadata,
  };
  usageStore.push(record);
  return record;
}

/** Get usage summary for a user in a given month */
export function getUserUsage(userId: string, period?: string): UserUsageSummary {
  const targetPeriod = period ?? getCurrentPeriod();

  const records = usageStore.filter(
    r => r.userId === userId && r.timestamp.startsWith(targetPeriod),
  );

  return {
    userId,
    period: targetPeriod,
    ebooksGenerated: sumByAction(records, 'ebook_generated'),
    apiCalls: sumByAction(records, 'api_call'),
    exports: sumByAction(records, 'export_pdf') + sumByAction(records, 'export_epub'),
    imagesGenerated: sumByAction(records, 'image_generated'),
  };
}

/** Check if user can perform an action given their tier */
export function checkUsageLimit(
  userId: string,
  tier: SubscriptionTierId,
  action: UsageAction,
): { allowed: boolean; reason?: string } {
  if (action === 'ebook_generated') {
    const usage = getUserUsage(userId);
    if (!canCreateEbook(tier, usage.ebooksGenerated)) {
      const plan = SUBSCRIPTION_PLANS[tier];
      return {
        allowed: false,
        reason: `Monthly ebook limit reached (${plan.limits.ebooksPerMonth}). Upgrade to create more.`,
      };
    }
  }

  if (action === 'api_call') {
    const plan = SUBSCRIPTION_PLANS[tier];
    if (!plan?.limits.apiAccess) {
      return { allowed: false, reason: 'API access requires Enterprise plan.' };
    }
  }

  return { allowed: true };
}

// ─── Stripe Integration Stubs ────────────────────────────────

/**
 * Report metered usage to Stripe (stub)
 * In production: calls Stripe API to create a usage record on the subscription item
 */
export async function reportMeteredUsageToStripe(
  subscriptionItemId: string,
  quantity: number,
  timestamp?: number,
): Promise<{ id: string; quantity: number }> {
  // Stub: In production, this would call:
  // stripe.subscriptionItems.createUsageRecord(subscriptionItemId, { quantity, timestamp, action: 'increment' })
  console.log(`[Stripe Stub] Reporting ${quantity} units for subscription item ${subscriptionItemId}`);
  return {
    id: `usage_${Date.now()}`,
    quantity,
  };
}

/**
 * Create a Stripe checkout session for subscription (stub)
 */
export async function createSubscriptionCheckout(
  customerId: string,
  priceId: string,
  successUrl: string,
  cancelUrl: string,
): Promise<{ sessionId: string; url: string }> {
  console.log(`[Stripe Stub] Creating checkout for customer ${customerId}, price ${priceId}`);
  return {
    sessionId: `cs_${Date.now()}`,
    url: `https://checkout.stripe.com/stub/${Date.now()}`,
  };
}

/**
 * Cancel a subscription at period end (stub)
 */
export async function cancelSubscription(subscriptionId: string): Promise<{ canceledAt: string }> {
  console.log(`[Stripe Stub] Canceling subscription ${subscriptionId}`);
  const sub = [...subscriptionStore.values()].find(s => s.subscriptionId === subscriptionId);
  if (sub) {
    sub.cancelAtPeriodEnd = true;
  }
  return { canceledAt: new Date().toISOString() };
}

/**
 * Get or create subscription info for a user (stub)
 */
export function getSubscriptionInfo(userId: string): StripeSubscriptionInfo | null {
  return subscriptionStore.get(userId) ?? null;
}

/**
 * Set subscription info (for webhook handlers)
 */
export function setSubscriptionInfo(userId: string, info: StripeSubscriptionInfo): void {
  subscriptionStore.set(userId, info);
}

// ─── Helpers ─────────────────────────────────────────────────

function getCurrentPeriod(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function sumByAction(records: UsageRecord[], action: UsageAction): number {
  return records.filter(r => r.action === action).reduce((sum, r) => sum + r.quantity, 0);
}

/** Get all usage records for a user (admin) */
export function getAllUsageRecords(userId: string): UsageRecord[] {
  return usageStore.filter(r => r.userId === userId);
}

/** Clear usage store (testing only) */
export function _clearUsageStore(): void {
  usageStore.length = 0;
  subscriptionStore.clear();
}
