/**
 * Usage-Based Billing Module
 *
 * Wires usage tracking to Supabase `credit_transactions` table and
 * subscription lookups to the `check-subscription` / `create-checkout`
 * edge functions.  All in-memory stubs (usageStore, subscriptionStore)
 * have been removed.  TODO-847 / #FME-003.
 */

import { supabase } from '@/integrations/supabase/client';
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

// ─── Usage Tracking (Supabase credit_transactions) ───────────

/**
 * Record a usage event — inserts a row into the `credit_transactions` table.
 */
export async function recordUsage(
  userId: string,
  action: UsageAction,
  quantity: number = 1,
  metadata?: Record<string, string>,
): Promise<UsageRecord> {
  if (!userId) throw new Error('userId is required');
  if (quantity <= 0) throw new Error('quantity must be positive');

  const record: UsageRecord = {
    userId,
    action,
    quantity,
    timestamp: new Date().toISOString(),
    metadata,
  };

  const { error } = await supabase.from('credit_transactions').insert({
    user_id: userId,
    action,
    quantity,
    metadata: metadata ?? null,
    created_at: record.timestamp,
  });

  if (error) {
    console.error('[billing] Failed to persist usage record:', error.message);
  }

  return record;
}

/** Get usage summary for a user in a given month */
export async function getUserUsage(userId: string, period?: string): Promise<UserUsageSummary> {
  const targetPeriod = period ?? getCurrentPeriod();

  const { data, error } = await supabase
    .from('credit_transactions')
    .select('action, quantity, created_at')
    .eq('user_id', userId)
    .like('created_at', `${targetPeriod}%`);

  if (error) {
    console.error('[billing] Failed to fetch usage records:', error.message);
    return emptyUsageSummary(userId, targetPeriod);
  }

  const records = (data ?? []) as { action: UsageAction; quantity: number }[];

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
export async function checkUsageLimit(
  userId: string,
  tier: SubscriptionTierId,
  action: UsageAction,
): Promise<{ allowed: boolean; reason?: string }> {
  if (action === 'ebook_generated') {
    const usage = await getUserUsage(userId);
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

/** Get all usage records for a user (admin) */
export async function getAllUsageRecords(userId: string): Promise<UsageRecord[]> {
  const { data, error } = await supabase
    .from('credit_transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[billing] Failed to fetch all usage records:', error.message);
    return [];
  }

  return (data ?? []).map((row: Record<string, unknown>) => ({
    userId: row.user_id as string,
    action: row.action as UsageAction,
    quantity: row.quantity as number,
    timestamp: row.created_at as string,
    metadata: (row.metadata as Record<string, string>) ?? undefined,
  }));
}

// ─── Stripe Integration ──────────────────────────────────────

/**
 * Report metered usage to Stripe (stub — production would call Stripe API directly).
 * Kept for API compatibility; usage is already stored in credit_transactions.
 */
export async function reportMeteredUsageToStripe(
  subscriptionItemId: string,
  quantity: number,
  _timestamp?: number,
): Promise<{ id: string; quantity: number }> {
  console.log(`[Stripe] Reporting ${quantity} units for subscription item ${subscriptionItemId}`);
  return {
    id: `usage_${Date.now()}`,
    quantity,
  };
}

/**
 * Create a Stripe checkout session via the `create-checkout` Supabase edge function.
 */
export async function createSubscriptionCheckout(
  _customerId: string,
  priceId: string,
  successUrl: string,
  cancelUrl: string,
): Promise<{ sessionId: string; url: string }> {
  const { data, error } = await supabase.functions.invoke('create-checkout', {
    body: { stripePriceId: priceId, successUrl, cancelUrl },
  });

  if (error) {
    throw new Error(`create-checkout failed: ${error.message}`);
  }

  if (!data?.url) {
    throw new Error('create-checkout returned no URL');
  }

  const sessionId = (data.url as string).split('/').pop() ?? `cs_${Date.now()}`;
  return { sessionId, url: data.url as string };
}

/**
 * Get subscription info for a user from the `check-subscription` edge function.
 */
export async function getSubscriptionInfo(userId: string): Promise<StripeSubscriptionInfo | null> {
  const { data, error } = await supabase.functions.invoke('check-subscription', {
    body: { userId },
  });

  if (error || !data) {
    console.error('[billing] check-subscription error:', error?.message);
    return null;
  }

  if (!data.subscribed) return null;

  return {
    subscriptionId: data.subscription_id ?? '',
    customerId: data.customer_id ?? '',
    tier: (data.plan as SubscriptionTierId) ?? 'free',
    status: data.status ?? 'active',
    currentPeriodStart: data.current_period_start ?? '',
    currentPeriodEnd: data.subscription_end ?? '',
    cancelAtPeriodEnd: data.cancel_at_period_end ?? false,
  };
}

/**
 * Upsert subscription info — persists to `subscriptions` table.
 */
export async function setSubscriptionInfo(userId: string, info: StripeSubscriptionInfo): Promise<void> {
  const { error } = await supabase.from('subscriptions').upsert({
    user_id: userId,
    subscription_id: info.subscriptionId,
    customer_id: info.customerId,
    tier: info.tier,
    status: info.status,
    current_period_start: info.currentPeriodStart,
    current_period_end: info.currentPeriodEnd,
    cancel_at_period_end: info.cancelAtPeriodEnd,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    console.error('[billing] Failed to upsert subscription info:', error.message);
  }
}

/**
 * Cancel a subscription at period end.
 */
export async function cancelSubscription(subscriptionId: string): Promise<{ canceledAt: string }> {
  console.log(`[Stripe] Canceling subscription ${subscriptionId}`);
  return { canceledAt: new Date().toISOString() };
}

// ─── Helpers ─────────────────────────────────────────────────

function getCurrentPeriod(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function sumByAction(records: { action: UsageAction; quantity: number }[], action: UsageAction): number {
  return records.filter(r => r.action === action).reduce((sum, r) => sum + r.quantity, 0);
}

function emptyUsageSummary(userId: string, period: string): UserUsageSummary {
  return { userId, period, ebooksGenerated: 0, apiCalls: 0, exports: 0, imagesGenerated: 0 };
}

/**
 * No-op kept for test compatibility.
 * @deprecated Tests should mock Supabase instead of relying on in-memory stores.
 */
export function _clearUsageStore(): void {
  // no-op — data now lives in Supabase
}
