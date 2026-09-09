/**
 * BetterAuth protected function transport tests.
 *
 * These exercise the production browser helper while replacing only the
 * BetterAuth session reader and the Supabase HTTP SDK.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockBetterAuthGetSession,
  mockFunctionInvoke,
  mockCreateClient,
  mockSupabaseGetSession,
  mockSupabaseSignOut,
} = vi.hoisted(() => ({
  mockBetterAuthGetSession: vi.fn(),
  mockFunctionInvoke: vi.fn(),
  mockCreateClient: vi.fn(),
  mockSupabaseGetSession: vi.fn(),
  mockSupabaseSignOut: vi.fn(),
}));

vi.mock('better-auth/react', () => ({
  createAuthClient: vi.fn(() => ({
    getSession: mockBetterAuthGetSession,
  })),
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: mockCreateClient,
}));

let invokeAuthenticatedFunction: typeof import('./client')['invokeAuthenticatedFunction'];

beforeEach(async () => {
  vi.resetModules();
  vi.stubEnv('VITE_SUPABASE_URL', 'https://example.supabase.co');
  vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', 'test-anon-key');

  mockBetterAuthGetSession.mockReset();
  mockFunctionInvoke.mockReset();
  mockCreateClient.mockReset();
  mockSupabaseGetSession.mockReset();
  mockSupabaseSignOut.mockReset();

  mockCreateClient.mockReturnValue({
    auth: {
      getSession: mockSupabaseGetSession,
      signOut: mockSupabaseSignOut,
      onAuthStateChange: vi.fn(),
    },
    from: vi.fn(),
    functions: {
      invoke: mockFunctionInvoke,
    },
  });

  ({ invokeAuthenticatedFunction } = await vi.importActual<typeof import('./client')>('./client'));
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('invokeAuthenticatedFunction', () => {
  it('real user scenario: a signed-out user clicking checkout is rejected locally and never sends an anonymous request', async () => {
    mockBetterAuthGetSession.mockResolvedValue({ data: null });
    mockFunctionInvoke.mockResolvedValue({ data: null, error: null });

    await expect(
      invokeAuthenticatedFunction('create-checkout', {
        method: 'POST',
        body: { priceId: 'price_creator' },
      }),
    ).rejects.toThrow(/sign in|authenticated|session/i);

    expect(mockFunctionInvoke).not.toHaveBeenCalled();
  });

  it('real user scenario: an expired BetterAuth session without an opaque token cannot fall back to an anonymous function call', async () => {
    mockBetterAuthGetSession.mockResolvedValue({
      data: { session: { token: '' } },
    });
    mockFunctionInvoke.mockResolvedValue({ data: null, error: null });

    await expect(
      invokeAuthenticatedFunction('stripe-portal', { method: 'POST' }),
    ).rejects.toThrow(/sign in|authenticated|session/i);

    expect(mockFunctionInvoke).not.toHaveBeenCalled();
  });

  it('real user scenario: an opaque BetterAuth session is forwarded verbatim and supersedes a stale caller authorization header', async () => {
    const opaqueSessionToken = 'ba_session_oPaQuE-4a72/without.jwt.parts';
    mockBetterAuthGetSession.mockResolvedValue({
      data: { session: { token: opaqueSessionToken } },
    });
    mockFunctionInvoke.mockResolvedValue({ data: { url: 'https://checkout.example.test' }, error: null });

    await invokeAuthenticatedFunction('create-checkout', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer stale-caller-token',
        'X-Request-Id': 'checkout-attempt-42',
      },
      body: { priceId: 'price_creator' },
    });

    expect(mockFunctionInvoke).toHaveBeenCalledWith('create-checkout', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${opaqueSessionToken}`,
        'X-Request-Id': 'checkout-attempt-42',
      },
      body: { priceId: 'price_creator' },
    });
  });

  it('real user scenario: a stale lower-case authorization header cannot survive alongside the BetterAuth credential', async () => {
    const opaqueSessionToken = 'ba_session_replaces_every_auth_header';
    mockBetterAuthGetSession.mockResolvedValue({
      data: { session: { token: opaqueSessionToken } },
    });
    mockFunctionInvoke.mockResolvedValue({ data: { balance: 12 }, error: null });

    await invokeAuthenticatedFunction('credits', {
      headers: {
        authorization: 'Bearer stale-lower-case-token',
        'X-Request-Id': 'credits-attempt-7',
      },
    });

    expect(mockFunctionInvoke).toHaveBeenCalledWith('credits', {
      headers: {
        Authorization: `Bearer ${opaqueSessionToken}`,
        'X-Request-Id': 'credits-attempt-7',
      },
    });
  });
});
