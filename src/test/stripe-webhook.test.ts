import { beforeEach, describe, expect, it, vi } from 'vitest';

interface WebhookRecord {
  eventId: string;
  eventType: string;
  status: 'processing' | 'completed' | 'failed';
  attemptCount: number;
  lastError: string | null;
  payloadDigest: string;
  startedAt: number;
}

interface ClaimResult {
  claimed: boolean;
  eventStatus: WebhookRecord['status'];
  attemptCount: number;
}

class WebhookStateStore {
  static readonly leaseMs = 15 * 60 * 1000;
  readonly events = new Map<string, WebhookRecord>();

  claim(
    eventId: string,
    eventType: string,
    options: { now?: number; payloadDigest?: string } = {},
  ): ClaimResult {
    const now = options.now ?? Date.now();
    const payloadDigest = options.payloadDigest ?? `digest:${eventId}`;
    const existing = this.events.get(eventId);
    if (!existing) {
      const created: WebhookRecord = {
        eventId,
        eventType,
        status: 'processing',
        attemptCount: 1,
        lastError: null,
        payloadDigest,
        startedAt: now,
      };
      this.events.set(eventId, created);
      return { claimed: true, eventStatus: created.status, attemptCount: created.attemptCount };
    }

    if (existing.eventType !== eventType) {
      throw new Error('event type mismatch');
    }
    if (existing.payloadDigest !== payloadDigest) {
      throw new Error('payload digest mismatch');
    }

    const leaseExpired =
      existing.status === 'processing' &&
      now - existing.startedAt >= WebhookStateStore.leaseMs;
    if (existing.status === 'failed' || leaseExpired) {
      existing.status = 'processing';
      existing.attemptCount += 1;
      existing.lastError = null;
      existing.startedAt = now;
      return { claimed: true, eventStatus: existing.status, attemptCount: existing.attemptCount };
    }

    return {
      claimed: false,
      eventStatus: existing.status,
      attemptCount: existing.attemptCount,
    };
  }

  complete(eventId: string): boolean {
    const event = this.events.get(eventId);
    if (!event) return false;
    if (event.status === 'completed') return true;
    if (event.status !== 'processing') return false;
    event.status = 'completed';
    return true;
  }

  fail(eventId: string, message: string): boolean {
    const event = this.events.get(eventId);
    if (!event || event.status !== 'processing') return false;
    event.status = 'failed';
    event.lastError = message;
    return true;
  }
}

interface CreditEntry {
  userId: string;
  amount: number;
  transactionType: string;
  idempotencyKey: string;
}

class CreditLedger {
  balance = 0;
  readonly entries = new Map<string, CreditEntry>();

  apply(entry: CreditEntry): { isReplay: boolean } {
    const existing = this.entries.get(entry.idempotencyKey);
    if (existing) {
      if (
        existing.userId !== entry.userId ||
        existing.amount !== entry.amount ||
        existing.transactionType !== entry.transactionType
      ) {
        throw new Error('idempotency key reused for a different transaction');
      }
      return { isReplay: true };
    }

    const nextBalance = this.balance + entry.amount;
    if (nextBalance < 0) throw new Error('insufficient balance');
    this.balance = nextBalance;
    this.entries.set(entry.idempotencyKey, entry);
    return { isReplay: false };
  }
}

interface WorkflowResponse {
  status: number;
  duplicate?: boolean;
  inFlight?: boolean;
}

async function runWebhook(
  store: WebhookStateStore,
  eventId: string,
  eventType: string,
  sideEffect: () => Promise<void>,
): Promise<WorkflowResponse> {
  const claim = store.claim(eventId, eventType);
  if (!claim.claimed) {
    return {
      status: 200,
      duplicate: claim.eventStatus === 'completed',
      inFlight: claim.eventStatus === 'processing',
    };
  }

  try {
    await sideEffect();
    if (!store.complete(eventId)) throw new Error('completion rejected');
    return { status: 200 };
  } catch (error) {
    store.fail(eventId, error instanceof Error ? error.message : String(error));
    return { status: 500 };
  }
}

describe('Stripe webhook state machine', () => {
  let store: WebhookStateStore;

  beforeEach(() => {
    store = new WebhookStateStore();
  });

  it('acknowledges a duplicate completed event without rerunning side effects', async () => {
    const sideEffect = vi.fn(async () => undefined);

    expect((await runWebhook(store, 'evt_complete', 'checkout.session.completed', sideEffect)).status).toBe(200);
    const duplicate = await runWebhook(store, 'evt_complete', 'checkout.session.completed', sideEffect);

    expect(duplicate).toEqual({ status: 200, duplicate: true, inFlight: false });
    expect(sideEffect).toHaveBeenCalledTimes(1);
    expect(store.events.get('evt_complete')).toMatchObject({ status: 'completed', attemptCount: 1 });
  });

  it('acknowledges an in-flight event without concurrently reprocessing it', async () => {
    store.claim('evt_processing', 'customer.subscription.updated');
    const sideEffect = vi.fn(async () => undefined);

    const response = await runWebhook(store, 'evt_processing', 'customer.subscription.updated', sideEffect);

    expect(response).toEqual({ status: 200, duplicate: false, inFlight: true });
    expect(sideEffect).not.toHaveBeenCalled();
    expect(store.events.get('evt_processing')?.attemptCount).toBe(1);
  });

  it('reclaims a processing event after its 15-minute lease expires', async () => {
    const expiredStart = Date.now() - WebhookStateStore.leaseMs - 1;
    store.claim('evt_abandoned', 'checkout.session.completed', { now: expiredStart });
    const sideEffect = vi.fn(async () => undefined);

    const response = await runWebhook(store, 'evt_abandoned', 'checkout.session.completed', sideEffect);

    expect(response.status).toBe(200);
    expect(sideEffect).toHaveBeenCalledOnce();
    expect(store.events.get('evt_abandoned')).toMatchObject({
      status: 'completed',
      attemptCount: 2,
    });
  });

  it('never reclaims a completed event, even after the lease duration', () => {
    const oldStart = Date.now() - WebhookStateStore.leaseMs - 1;
    store.claim('evt_immutable', 'checkout.session.completed', { now: oldStart });
    store.complete('evt_immutable');

    const claim = store.claim('evt_immutable', 'checkout.session.completed');

    expect(claim).toMatchObject({ claimed: false, eventStatus: 'completed', attemptCount: 1 });
  });

  it('rejects a changed payload digest before considering a retry claim', () => {
    store.claim('evt_digest', 'checkout.session.completed', { payloadDigest: 'a'.repeat(64) });
    store.fail('evt_digest', 'first attempt failed');

    expect(() => store.claim(
      'evt_digest',
      'checkout.session.completed',
      { payloadDigest: 'b'.repeat(64) },
    )).toThrow('payload digest mismatch');
    expect(store.events.get('evt_digest')).toMatchObject({ status: 'failed', attemptCount: 1 });
  });

  it('reclaims a failed event and completes it on retry', async () => {
    const first = await runWebhook(store, 'evt_retry', 'invoice.payment_failed', async () => {
      throw new Error('temporary database failure');
    });
    const second = await runWebhook(store, 'evt_retry', 'invoice.payment_failed', async () => undefined);

    expect(first.status).toBe(500);
    expect(second.status).toBe(200);
    expect(store.events.get('evt_retry')).toMatchObject({
      status: 'completed',
      attemptCount: 2,
      lastError: null,
    });
  });

  it('does not grant a purchase twice when a failed event retries after the credit commit', async () => {
    const ledger = new CreditLedger();
    let failAfterCredit = true;
    const purchase = async () => {
      ledger.apply({
        userId: 'user-1',
        amount: 20,
        transactionType: 'purchase',
        idempotencyKey: 'stripe:event:evt_purchase:purchase',
      });
      if (failAfterCredit) {
        failAfterCredit = false;
        throw new Error('response lost after credit commit');
      }
    };

    expect((await runWebhook(store, 'evt_purchase', 'checkout.session.completed', purchase)).status).toBe(500);
    expect((await runWebhook(store, 'evt_purchase', 'checkout.session.completed', purchase)).status).toBe(200);
    expect(ledger.balance).toBe(20);
    expect(ledger.entries.size).toBe(1);
  });

  it('applies a refund as one debit and never performs a second balance mutation', async () => {
    const ledger = new CreditLedger();
    ledger.apply({
      userId: 'user-1',
      amount: 10,
      transactionType: 'purchase',
      idempotencyKey: 'stripe:event:evt_purchase_seed:purchase',
    });
    const refund = vi.fn(async () => {
      ledger.apply({
        userId: 'user-1',
        amount: -10,
        transactionType: 'refund',
        idempotencyKey: 'stripe:event:evt_refund:refund',
      });
    });

    expect((await runWebhook(store, 'evt_refund', 'charge.refunded', refund)).status).toBe(200);
    expect((await runWebhook(store, 'evt_refund', 'charge.refunded', refund)).duplicate).toBe(true);
    expect(ledger.balance).toBe(0);
    expect(refund).toHaveBeenCalledTimes(1);
    expect([...ledger.entries.values()].filter((entry) => entry.transactionType === 'refund')).toHaveLength(1);
  });

  it('records a side-effect failure and returns 500 so Stripe retries', async () => {
    const response = await runWebhook(store, 'evt_failed', 'checkout.session.completed', async () => {
      throw new Error('profile update failed');
    });

    expect(response.status).toBe(500);
    expect(store.events.get('evt_failed')).toMatchObject({
      status: 'failed',
      attemptCount: 1,
      lastError: 'profile update failed',
    });
  });
});
