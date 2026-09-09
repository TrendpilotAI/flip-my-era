import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  isCheckoutSessionPaid,
  isPaidSubscriptionInvoice,
} from '../../supabase/functions/_shared/checkoutSettlement';

function eventCreditKey(eventId: string, action: string): string {
  if (!eventId || !action) throw new Error('event ID and action are required');
  return `stripe:event:${eventId}:${action}`;
}

function subscriptionAllocationKey(input: {
  subscriptionId: string;
  invoiceId: string;
}): string {
  return `stripe:subscription:${input.subscriptionId}:invoice:${input.invoiceId}:monthly-allocation`;
}

function parseCredits(value: string): number {
  const normalized = value.trim();
  const amount = Number(normalized);
  if (!/^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/.test(normalized) || amount <= 0) {
    throw new Error('invalid credit amount');
  }
  return amount;
}

function calculateRefundCredits(
  originalCredits: number,
  originalChargeAmount: number,
  refundAmount: number,
): number {
  if (originalCredits <= 0 || originalChargeAmount <= 0) throw new Error('invalid original purchase');
  if (refundAmount <= 0 || refundAmount > originalChargeAmount) throw new Error('invalid refund');
  return Math.min(
    originalCredits,
    Math.round((originalCredits * refundAmount / originalChargeAmount) * 100) / 100,
  );
}

function mapSubscriptionStatus(stripeStatus: string): string {
  if (stripeStatus === 'active' || stripeStatus === 'trialing') return 'active';
  if (stripeStatus === 'canceled') return 'cancelled';
  if (stripeStatus === 'past_due' || stripeStatus === 'unpaid') return 'past_due';
  return 'none';
}

describe('Stripe payment edge cases', () => {
  it('grants purchased credits only after Stripe marks the checkout paid', () => {
    expect(isCheckoutSessionPaid({ payment_status: 'paid' })).toBe(true);
    expect(isCheckoutSessionPaid({ payment_status: 'unpaid' })).toBe(false);
    expect(isCheckoutSessionPaid({ payment_status: 'no_payment_required' })).toBe(false);
    expect(isCheckoutSessionPaid({})).toBe(false);
  });

  it('uses the verified Stripe event ID for purchase, failure, and refund idempotency', () => {
    expect(eventCreditKey('evt_123', 'purchase')).toBe('stripe:event:evt_123:purchase');
    expect(eventCreditKey('evt_123', 'payment-failed')).toBe('stripe:event:evt_123:payment-failed');
    expect(eventCreditKey('evt_123', 'refund')).toBe('stripe:event:evt_123:refund');
  });

  it('deduplicates monthly allocations across different events for the same invoice', () => {
    const createdEventKey = subscriptionAllocationKey({
      subscriptionId: 'sub_1',
      invoiceId: 'in_1',
    });
    const updatedEventKey = subscriptionAllocationKey({
      subscriptionId: 'sub_1',
      invoiceId: 'in_1',
    });

    expect(createdEventKey).toBe(updatedEventKey);
  });

  it('changes the monthly allocation key for the next paid invoice', () => {
    const firstInvoice = subscriptionAllocationKey({
      subscriptionId: 'sub_1',
      invoiceId: 'in_1',
    });
    const repeatedInvoice = subscriptionAllocationKey({
      subscriptionId: 'sub_1',
      invoiceId: 'in_1',
    });
    const nextInvoice = subscriptionAllocationKey({
      subscriptionId: 'sub_1',
      invoiceId: 'in_2',
    });

    expect(firstInvoice).toBe(repeatedInvoice);
    expect(nextInvoice).not.toBe(firstInvoice);
  });

  it('allocates subscription credits only for a paid invoice tied to a subscription', () => {
    expect(isPaidSubscriptionInvoice({
      billing_reason: 'subscription_cycle',
      paid: true,
      subscription: 'sub_1',
    })).toBe(true);
    expect(isPaidSubscriptionInvoice({
      billing_reason: 'subscription_cycle',
      paid: false,
      subscription: 'sub_1',
    })).toBe(false);
    expect(isPaidSubscriptionInvoice({
      billing_reason: 'subscription_cycle',
      paid: true,
      subscription: null,
    })).toBe(false);
    expect(isPaidSubscriptionInvoice({
      billing_reason: 'subscription_update',
      paid: true,
      subscription: 'sub_1',
    })).toBe(false);
    expect(isPaidSubscriptionInvoice({})).toBe(false);
  });

  it('rejects missing, malformed, negative, and over-precision credit metadata', () => {
    for (const value of ['', 'five', '-1', '0', '1.001', '5credits']) {
      expect(() => parseCredits(value)).toThrow('invalid credit amount');
    }
    expect(parseCredits('2.5')).toBe(2.5);
    expect(parseCredits('2.55')).toBe(2.55);
  });

  it('calculates full and proportional refunds without exceeding the purchase', () => {
    expect(calculateRefundCredits(10, 1_000, 1_000)).toBe(10);
    expect(calculateRefundCredits(10, 1_000, 333)).toBe(3.33);
    expect(() => calculateRefundCredits(10, 1_000, 1_001)).toThrow('invalid refund');
  });

  it('maps Stripe lifecycle states without granting access for unknown states', () => {
    expect(mapSubscriptionStatus('active')).toBe('active');
    expect(mapSubscriptionStatus('trialing')).toBe('active');
    expect(mapSubscriptionStatus('past_due')).toBe('past_due');
    expect(mapSubscriptionStatus('unpaid')).toBe('past_due');
    expect(mapSubscriptionStatus('canceled')).toBe('cancelled');
    expect(mapSubscriptionStatus('incomplete')).toBe('none');
  });
});

describe('Stripe webhook implementation guardrails', () => {
  const handlerSource = readFileSync(
    join(process.cwd(), 'supabase/functions/stripe-webhook/index.ts'),
    'utf8',
  );
  const migrationSource = readFileSync(
    join(process.cwd(), 'supabase/migrations/20260824043000_stripe_webhook_state_machine.sql'),
    'utf8',
  );

  it('uses claim, atomic-credit, complete, and fail RPCs', () => {
    for (const functionName of [
      'claim_webhook_event',
      'apply_credit_transaction',
      'complete_webhook_event',
      'fail_webhook_event',
    ]) {
      expect(handlerSource).toMatch(new RegExp(`\\.rpc\\(\\s*["']${functionName}["']`));
    }
  });

  it('does not directly insert ledger rows or manually mutate balances', () => {
    expect(handlerSource).not.toMatch(/from\(["']credit_transactions["']\)[\s\S]{0,120}\.insert\(/);
    expect(handlerSource).not.toMatch(/\.update\(\{\s*balance\s*:/);
  });

  it('locks down all webhook state transitions to service-role security-definer RPCs', () => {
    expect(migrationSource.match(/SECURITY DEFINER/g)).toHaveLength(3);
    expect(migrationSource).toContain("CHECK (status IN ('processing', 'completed', 'failed'))");
    expect(migrationSource).toContain('FROM PUBLIC, anon, authenticated');
    expect(migrationSource).toContain('TO service_role');
  });

  it('uses a bounded processing lease while preserving payload mismatch protection', () => {
    expect(migrationSource).toContain("INTERVAL '15 minutes'");
    expect(migrationSource).toContain("v_event.status = 'processing'");
    expect(migrationSource).toContain('Stripe event ID was already used for a different payload');
    expect(migrationSource).toContain("v_event.status = 'failed'");
  });

  it('handles delayed-payment settlement without granting an unpaid checkout', () => {
    expect(handlerSource).toContain('checkout.session.async_payment_succeeded');
    expect(handlerSource).toContain('isCheckoutSessionPaid(session)');
  });

  it('grants recurring credits from invoice.paid, never subscription.updated', () => {
    expect(handlerSource).toContain('case "invoice.paid"');
    expect(handlerSource).toContain('isPaidSubscriptionInvoice(invoice)');

    const subscriptionHandler = handlerSource.slice(
      handlerSource.indexOf('async function handleSubscriptionChange'),
      handlerSource.indexOf('async function handleInvoicePaid'),
    );
    expect(subscriptionHandler).not.toContain('monthly_allocation');
    expect(subscriptionHandler).not.toContain('applyCreditTransaction');
  });
});
