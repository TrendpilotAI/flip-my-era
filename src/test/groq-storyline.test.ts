import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it, vi } from 'vitest';

const source = readFileSync(
  resolve(process.cwd(), 'supabase/functions/groq-storyline/index.ts'),
  'utf8',
);
const groqApiSource = readFileSync(
  resolve(process.cwd(), 'supabase/functions/groq-api/index.ts'),
  'utf8',
);
const migrationSource = readFileSync(
  resolve(process.cwd(), 'supabase/migrations/20260824042000_transactional_credit_and_generation.sql'),
  'utf8',
);

interface Claim {
  outcome: 'claimed' | 'replay' | 'in_progress' | 'insufficient' | 'failed';
  current_balance?: number;
  response_cache?: Record<string, unknown> | null;
  lease_token?: string | null;
}

interface PendingRequest {
  status: 'pending' | 'completed';
  expiresAt: number;
  leaseToken: string | null;
  transactionId: string;
  debitCount: number;
}

function claimExistingRequest(request: PendingRequest, now: number): 'claimed' | 'in_progress' | 'replay' {
  if (request.status === 'completed') return 'replay';
  if (request.expiresAt > now) return 'in_progress';
  request.leaseToken = `lease-${now}`;
  request.expiresAt = now + 120_000;
  return 'claimed';
}

function createRpcHarness(claim: Claim) {
  const rpc = vi.fn((name: string, _args?: Record<string, unknown>) => ({
    single: vi.fn(async () => {
      if (name === 'claim_generation_request') {
        return { data: claim, error: null };
      }
      if (name === 'complete_generation_request') {
        return { data: { success: true, is_replay: false }, error: null };
      }
      if (name === 'fail_generation_request') {
        return { data: { success: true, refunded: true }, error: null };
      }
      return { data: null, error: { message: 'unexpected RPC' } };
    }),
  }));
  return { rpc };
}

async function exerciseStateMachine(
  harness: ReturnType<typeof createRpcHarness>,
  claim: Claim,
  generation: 'success' | 'failure' = 'success',
) {
  const userId = 'user-1';
  const idempotencyKey = 'storyline-key-1';
  const claimCall = await harness.rpc('claim_generation_request', {
    p_user_id: userId,
    p_idempotency_key: idempotencyKey,
    p_operation_type: 'storyline_generation',
    p_credits: 2,
  }).single();

  if (claimCall.data.outcome !== 'claimed') {
    return claimCall.data.outcome;
  }

  if (generation === 'failure') {
    await harness.rpc('fail_generation_request', {
      p_user_id: userId,
      p_idempotency_key: idempotencyKey,
      p_lease_token: claim.lease_token,
      p_error_code: 'GENERATION_ERROR',
    }).single();
    return 'failed';
  }

  await harness.rpc('complete_generation_request', {
    p_user_id: userId,
    p_idempotency_key: idempotencyKey,
    p_response_cache: { storyline: { logline: 'Done' } },
    p_lease_token: claim.lease_token,
  }).single();
  return 'completed';
}

describe('groq-storyline transactional generation contract', () => {
  it('uses shared opaque-token verification instead of Supabase JWT-only auth', () => {
    expect(source).toContain('verifyAuth(req)');
    expect(source).not.toContain('.auth.getUser()');
    expect(groqApiSource).toContain('verifyAuth(req)');
    expect(groqApiSource).not.toContain('.auth.getUser()');
  });

  it('does not accept reusable pre-authorized transaction IDs', () => {
    expect(source).not.toContain('pre_authorized_transaction_id');
    expect(source).not.toContain(".from('credit_transactions')");
  });

  it('validates inputs before claiming credits', () => {
    expect(source.indexOf('validateInput(params)')).toBeLessThan(
      source.indexOf(".rpc('claim_generation_request'"),
    );
  });

  it('claims a generation exactly once and completes it on success', async () => {
    const claim: Claim = { outcome: 'claimed', lease_token: 'lease-1' };
    const harness = createRpcHarness(claim);

    await expect(exerciseStateMachine(harness, claim)).resolves.toBe('completed');
    expect(harness.rpc).toHaveBeenCalledWith('claim_generation_request', expect.objectContaining({
      p_operation_type: 'storyline_generation',
      p_credits: 2,
    }));
    expect(harness.rpc).toHaveBeenCalledWith('complete_generation_request', expect.any(Object));
    expect(harness.rpc).not.toHaveBeenCalledWith('fail_generation_request', expect.any(Object));
  });

  it('returns a cached replay without completing or charging again', async () => {
    const claim: Claim = {
      outcome: 'replay',
      response_cache: { storyline: { logline: 'Cached' } },
    };
    const harness = createRpcHarness(claim);

    await expect(exerciseStateMachine(harness, claim)).resolves.toBe('replay');
    expect(harness.rpc).toHaveBeenCalledTimes(1);
  });

  it.each(['in_progress', 'insufficient', 'failed'] as const)(
    'does not invoke a terminal RPC for a %s claim',
    async (outcome) => {
      const claim: Claim = { outcome, current_balance: 1 };
      const harness = createRpcHarness(claim);

      await expect(exerciseStateMachine(harness, claim)).resolves.toBe(outcome);
      expect(harness.rpc).toHaveBeenCalledTimes(1);
    },
  );

  it('finalizes every post-charge generation failure through the refund RPC', async () => {
    const claim: Claim = { outcome: 'claimed', lease_token: 'lease-1' };
    const harness = createRpcHarness(claim);

    await expect(exerciseStateMachine(harness, claim, 'failure')).resolves.toBe('failed');
    expect(harness.rpc).toHaveBeenCalledWith('fail_generation_request', expect.objectContaining({
      p_error_code: 'GENERATION_ERROR',
      p_lease_token: 'lease-1',
    }));
    expect(harness.rpc).not.toHaveBeenCalledWith('complete_generation_request', expect.any(Object));
  });

  it('contains failure finalization for API errors, invalid responses, timeouts, and exceptions', () => {
    expect(source.match(/failClaim\(/g)?.length).toBeGreaterThanOrEqual(5);
    expect(source).toContain("failClaim('GROQ_API_ERROR'");
    expect(source).toContain("failClaim('INVALID_STORYLINE'");
    expect(source).toContain("const isTimeout = error instanceof Error && error.name === 'AbortError'");
    expect(source).toContain("failClaim('INTERNAL_ERROR'");
    expect(groqApiSource.match(/failClaim\(/g)?.length).toBeGreaterThanOrEqual(5);
    expect(groqApiSource).toContain(".rpc('claim_generation_request'");
    expect(groqApiSource).toContain(".rpc('complete_generation_request'");
    expect(groqApiSource).toContain(".rpc('fail_generation_request'");
  });

  it('reclaims an expired pending lease without applying a second debit', () => {
    const request: PendingRequest = {
      status: 'pending',
      expiresAt: 1_000,
      leaseToken: 'stale-lease',
      transactionId: 'original-charge',
      debitCount: 1,
    };

    expect(claimExistingRequest(request, 2_000)).toBe('claimed');
    expect(request.transactionId).toBe('original-charge');
    expect(request.debitCount).toBe(1);
    expect(request.leaseToken).toBe('lease-2000');
  });

  it('prevents a second active claimant after an expired lease is reclaimed', () => {
    const request: PendingRequest = {
      status: 'pending',
      expiresAt: 1_000,
      leaseToken: 'stale-lease',
      transactionId: 'original-charge',
      debitCount: 1,
    };

    expect(claimExistingRequest(request, 2_000)).toBe('claimed');
    expect(claimExistingRequest(request, 2_001)).toBe('in_progress');
  });

  it('keeps completed requests as replays and fences stale lease holders', () => {
    const completed: PendingRequest = {
      status: 'completed',
      expiresAt: 1_000,
      leaseToken: null,
      transactionId: 'original-charge',
      debitCount: 1,
    };

    expect(claimExistingRequest(completed, 2_000)).toBe('replay');
    expect(migrationSource).toContain('v_request.lease_token IS DISTINCT FROM p_lease_token');
    expect(migrationSource).toContain("expires_at = pg_catalog.clock_timestamp() + INTERVAL '2 minutes'");
    expect(migrationSource).toContain('attempt_count = attempt_count + 1');
  });
});
