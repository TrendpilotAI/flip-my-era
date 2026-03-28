/**
 * create-checkout Edge Function Tests
 *
 * Tests the server-side price ID resolution, auth validation, idempotency key
 * generation, and error handling for the create-checkout Supabase Edge Function.
 *
 * We test the LOGIC extracted from supabase/functions/create-checkout/index.ts,
 * not the actual Deno HTTP server. All Stripe and Supabase calls are mocked.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Price ID mappings (mirrored from the edge function) ─────────────────────

const SUBSCRIPTION_PRICE_IDS: Record<string, { priceId: string; credits: number }> = {
  speakNow:  { priceId: 'price_1S9zK15U03MNTw3qAO5JnplW', credits: 15 },
  midnights: { priceId: 'price_1S9zK25U03MNTw3qdDnUn7hk', credits: 40 },
  // Legacy aliases
  starter:   { priceId: 'price_1S9zK15U03MNTw3qAO5JnplW', credits: 15 },
  deluxe:    { priceId: 'price_1S9zK25U03MNTw3qdDnUn7hk', credits: 40 },
  vip:       { priceId: 'price_1S9zK25U03MNTw3qoCHo9KzE', credits: 40 },
};

const ANNUAL_PRICE_IDS: Record<string, { priceId: string; credits: number }> = {
  speakNowAnnual:  { priceId: 'price_speak_now_annual', credits: 15 },
  midnightsAnnual: { priceId: 'price_midnights_annual', credits: 40 },
};

const CREDIT_PACK_PRICE_IDS: Record<string, { priceId: string; credits: number }> = {
  single: { priceId: 'price_1S9zK25U03MNTw3qMH90DnC1', credits: 5 },
  album:  { priceId: 'price_1S9zK25U03MNTw3qFkq00yiu', credits: 20 },
  tour:   { priceId: 'price_1S9zK35U03MNTw3qpmqEDL80', credits: 50 },
  // Legacy aliases
  'starter-pack':  { priceId: 'price_1S9zK25U03MNTw3qMH90DnC1', credits: 5 },
  'creator-pack':  { priceId: 'price_1S9zK25U03MNTw3qFkq00yiu', credits: 20 },
  'studio-pack':   { priceId: 'price_1S9zK35U03MNTw3qpmqEDL80', credits: 50 },
};

// ─── Extracted resolution logic (mirrors edge function) ──────────────────────

interface ResolvedProduct {
  priceId: string;
  credits: number;
}

type CheckoutMode = 'subscription' | 'payment';

interface ResolveResult {
  product: ResolvedProduct;
  mode: CheckoutMode;
}

function resolvePriceId(
  plan: string,
  productType?: string
): ResolveResult | null {
  // 1. Credit packs
  if (productType === 'credits' || CREDIT_PACK_PRICE_IDS[plan]) {
    const product = CREDIT_PACK_PRICE_IDS[plan];
    if (!product) return null;
    return { product, mode: 'payment' };
  }
  // 2. Annual subscriptions
  if (ANNUAL_PRICE_IDS[plan]) {
    return { product: ANNUAL_PRICE_IDS[plan], mode: 'subscription' };
  }
  // 3. Monthly subscriptions
  if (SUBSCRIPTION_PRICE_IDS[plan]) {
    return { product: SUBSCRIPTION_PRICE_IDS[plan], mode: 'subscription' };
  }
  return null;
}

function buildIdempotencyKey(userId: string, priceId: string, now = Date.now()): string {
  return `checkout_${userId}_${priceId}_${Math.floor(now / 30000)}`;
}

// ─── Auth validation logic ────────────────────────────────────────────────────

interface AuthResult {
  userId: string | null;
  error?: string;
}

function validateAuthHeader(authHeader: string | null): AuthResult {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { userId: null, error: 'No authorization header provided' };
  }
  const token = authHeader.replace('Bearer ', '').trim();
  if (!token) {
    return { userId: null, error: 'Empty bearer token' };
  }
  return { userId: 'extracted-from-token' }; // Actual extraction happens via Supabase
}

// ─── Stripe session creation mock ────────────────────────────────────────────

const mockCreateSession = vi.fn();
const mockCustomersList = vi.fn();
const mockPricesRetrieve = vi.fn();

const mockStripe = {
  checkout: { sessions: { create: mockCreateSession } },
  customers: { list: mockCustomersList },
  prices: { retrieve: mockPricesRetrieve },
};

vi.mock('stripe', () => ({
  default: vi.fn(() => mockStripe),
}));

// ─── Supabase mock ────────────────────────────────────────────────────────────

function createMockSupabase(overrides: {
  profileEmail?: string;
  profileError?: boolean;
} = {}) {
  return {
    from: vi.fn((_table: string) => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(async () => {
            if (overrides.profileError) {
              return { data: null, error: { message: 'Not found' } };
            }
            return {
              data: { email: overrides.profileEmail ?? 'user@example.com' },
              error: null,
            };
          }),
        })),
      })),
    })),
    auth: {
      getUser: vi.fn(async () => ({
        data: { user: { id: 'user-abc', email: 'user@example.com' } },
        error: null,
      })),
    },
  };
}

// ─── Handler logic (mirrors edge function create-checkout) ───────────────────

async function handleCreateCheckout(
  supabase: ReturnType<typeof createMockSupabase>,
  {
    authHeader,
    plan,
    productType,
    stripeSecretKey,
  }: {
    authHeader: string | null;
    plan: string;
    productType?: string;
    stripeSecretKey?: string;
  }
): Promise<{ status: number; body: Record<string, unknown> }> {
  // 1. Check STRIPE_SECRET_KEY
  if (!stripeSecretKey) {
    return { status: 500, body: { error: 'STRIPE_SECRET_KEY is not set' } };
  }

  // 2. Auth check
  const auth = validateAuthHeader(authHeader);
  if (!auth.userId) {
    return { status: 500, body: { error: auth.error } }; // edge fn returns 500 for throw
  }

  // 3. Lookup user profile
  const { data: profile, error: profileErr } = await supabase
    .from('profiles')
    .select('email')
    .eq('id', 'user-abc')
    .single();

  if (profileErr || !profile?.email) {
    return { status: 500, body: { error: 'User profile not found or missing email' } };
  }

  const user = { id: 'user-abc', email: profile.email as string };

  // 4. Resolve price ID
  const resolved = resolvePriceId(plan, productType);
  if (!resolved) {
    const validPlans = [
      ...Object.keys(CREDIT_PACK_PRICE_IDS),
      ...Object.keys(SUBSCRIPTION_PRICE_IDS),
      ...Object.keys(ANNUAL_PRICE_IDS),
    ].join(', ');
    return {
      status: 500,
      body: { error: `Invalid plan: "${plan}". Valid plans: ${validPlans}` },
    };
  }

  // 5. Build idempotency key
  const idempotencyKey = buildIdempotencyKey(user.id, resolved.product.priceId);

  // 6. Create Stripe session
  const session = await mockCreateSession(
    {
      customer_email: user.email,
      line_items: [{ price: resolved.product.priceId, quantity: 1 }],
      mode: resolved.mode,
      metadata: {
        userId: user.id,
        type: resolved.mode === 'subscription' ? 'subscription' : 'credits',
        plan,
        credits: resolved.product.credits.toString(),
      },
    },
    { idempotencyKey }
  );

  return { status: 200, body: { url: session?.url ?? 'https://checkout.stripe.com/pay/cs_test' } };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('create-checkout Edge Function', () => {
  let supabase: ReturnType<typeof createMockSupabase>;

  beforeEach(() => {
    vi.clearAllMocks();
    supabase = createMockSupabase();
    mockCreateSession.mockResolvedValue({ id: 'cs_test_abc', url: 'https://checkout.stripe.com/pay/cs_test_abc' });
    mockCustomersList.mockResolvedValue({ data: [] });
    mockPricesRetrieve.mockResolvedValue({ metadata: {} });
  });

  // ─── Price ID resolution ────────────────────────────────────────────────────

  describe('subscription plan resolution', () => {
    it('resolves speakNow to correct Stripe price ID', () => {
      const result = resolvePriceId('speakNow');
      expect(result).not.toBeNull();
      expect(result!.product.priceId).toBe('price_1S9zK15U03MNTw3qAO5JnplW');
      expect(result!.product.credits).toBe(15);
      expect(result!.mode).toBe('subscription');
    });

    it('resolves midnights to correct Stripe price ID', () => {
      const result = resolvePriceId('midnights');
      expect(result).not.toBeNull();
      expect(result!.product.priceId).toBe('price_1S9zK25U03MNTw3qdDnUn7hk');
      expect(result!.product.credits).toBe(40);
      expect(result!.mode).toBe('subscription');
    });

    it('resolves annual speakNowAnnual plan', () => {
      const result = resolvePriceId('speakNowAnnual');
      expect(result).not.toBeNull();
      expect(result!.product.priceId).toBe('price_speak_now_annual');
      expect(result!.mode).toBe('subscription');
    });
  });

  describe('credit pack resolution', () => {
    it('resolves single credit pack to correct price ID', () => {
      const result = resolvePriceId('single');
      expect(result).not.toBeNull();
      expect(result!.product.priceId).toBe('price_1S9zK25U03MNTw3qMH90DnC1');
      expect(result!.product.credits).toBe(5);
      expect(result!.mode).toBe('payment');
    });

    it('resolves album credit pack to correct price ID', () => {
      const result = resolvePriceId('album');
      expect(result).not.toBeNull();
      expect(result!.product.priceId).toBe('price_1S9zK25U03MNTw3qFkq00yiu');
      expect(result!.product.credits).toBe(20);
      expect(result!.mode).toBe('payment');
    });

    it('resolves tour credit pack to correct price ID', () => {
      const result = resolvePriceId('tour');
      expect(result).not.toBeNull();
      expect(result!.product.priceId).toBe('price_1S9zK35U03MNTw3qpmqEDL80');
      expect(result!.product.credits).toBe(50);
      expect(result!.mode).toBe('payment');
    });

    it('resolves plan with productType=credits forcing payment mode', () => {
      // Even if plan is a subscription name, productType=credits wins for credit pack lookup
      const result = resolvePriceId('single', 'credits');
      expect(result!.mode).toBe('payment');
    });
  });

  describe('legacy plan aliases', () => {
    it('maps legacy starter to speakNow price ID', () => {
      const result = resolvePriceId('starter');
      expect(result).not.toBeNull();
      expect(result!.product.priceId).toBe('price_1S9zK15U03MNTw3qAO5JnplW');
      expect(result!.mode).toBe('subscription');
    });

    it('maps legacy deluxe to midnights price ID', () => {
      const result = resolvePriceId('deluxe');
      expect(result).not.toBeNull();
      expect(result!.product.priceId).toBe('price_1S9zK25U03MNTw3qdDnUn7hk');
      expect(result!.mode).toBe('subscription');
    });

    it('maps legacy vip plan', () => {
      const result = resolvePriceId('vip');
      expect(result).not.toBeNull();
      expect(result!.product.priceId).toBe('price_1S9zK25U03MNTw3qoCHo9KzE');
      expect(result!.mode).toBe('subscription');
    });

    it('maps legacy starter-pack to single credits price ID', () => {
      const result = resolvePriceId('starter-pack');
      expect(result).not.toBeNull();
      expect(result!.product.priceId).toBe('price_1S9zK25U03MNTw3qMH90DnC1');
      expect(result!.mode).toBe('payment');
    });

    it('maps legacy creator-pack to album credits price ID', () => {
      const result = resolvePriceId('creator-pack');
      expect(result).not.toBeNull();
      expect(result!.product.priceId).toBe('price_1S9zK25U03MNTw3qFkq00yiu');
      expect(result!.mode).toBe('payment');
    });

    it('maps legacy studio-pack to tour credits price ID', () => {
      const result = resolvePriceId('studio-pack');
      expect(result).not.toBeNull();
      expect(result!.product.priceId).toBe('price_1S9zK35U03MNTw3qpmqEDL80');
      expect(result!.mode).toBe('payment');
    });
  });

  describe('auth validation', () => {
    it('returns error when Authorization header is missing', () => {
      const result = validateAuthHeader(null);
      expect(result.userId).toBeNull();
      expect(result.error).toContain('authorization');
    });

    it('returns error when header does not start with Bearer', () => {
      const result = validateAuthHeader('Basic dXNlcjpwYXNz');
      expect(result.userId).toBeNull();
      expect(result.error).toContain('authorization');
    });

    it('returns error when Bearer token is empty', () => {
      const result = validateAuthHeader('Bearer ');
      expect(result.userId).toBeNull();
    });

    it('accepts valid Bearer token', () => {
      const result = validateAuthHeader('Bearer eyJhbGciOiJIUzI1NiJ9.test.sig');
      expect(result.error).toBeUndefined();
    });

    it('handler returns 500 (thrown error) for missing auth header', async () => {
      const result = await handleCreateCheckout(supabase, {
        authHeader: null,
        plan: 'speakNow',
        stripeSecretKey: 'sk_test_123',
      });
      expect(result.status).toBe(500);
      expect(result.body.error).toContain('authorization');
    });
  });

  describe('invalid plan handling', () => {
    it('returns descriptive error for unrecognized plan', () => {
      const result = resolvePriceId('nonexistent_plan');
      expect(result).toBeNull();
    });

    it('handler error message lists valid plan options', async () => {
      const result = await handleCreateCheckout(supabase, {
        authHeader: 'Bearer valid-token',
        plan: 'bogus_plan',
        stripeSecretKey: 'sk_test_123',
      });
      expect(result.status).toBe(500);
      expect(result.body.error as string).toContain('Invalid plan: "bogus_plan"');
      expect(result.body.error as string).toContain('speakNow');
      expect(result.body.error as string).toContain('single');
    });

    it('empty plan name returns error', () => {
      const result = resolvePriceId('');
      expect(result).toBeNull();
    });
  });

  describe('missing STRIPE_SECRET_KEY', () => {
    it('handler returns error when STRIPE_SECRET_KEY is undefined', async () => {
      const result = await handleCreateCheckout(supabase, {
        authHeader: 'Bearer valid-token',
        plan: 'speakNow',
        stripeSecretKey: undefined,
      });
      expect(result.status).toBe(500);
      expect(result.body.error as string).toContain('STRIPE_SECRET_KEY');
    });

    it('handler returns error when STRIPE_SECRET_KEY is empty string', async () => {
      const result = await handleCreateCheckout(supabase, {
        authHeader: 'Bearer valid-token',
        plan: 'speakNow',
        stripeSecretKey: '',
      });
      expect(result.status).toBe(500);
      expect(result.body.error as string).toContain('STRIPE_SECRET_KEY');
    });
  });

  describe('missing user profile', () => {
    it('returns error when profile lookup fails', async () => {
      const supabaseNoProfile = createMockSupabase({ profileError: true });
      const result = await handleCreateCheckout(supabaseNoProfile, {
        authHeader: 'Bearer valid-token',
        plan: 'speakNow',
        stripeSecretKey: 'sk_test_123',
      });
      expect(result.status).toBe(500);
      expect(result.body.error as string).toContain('profile');
    });
  });

  describe('idempotency key generation', () => {
    it('same user + same priceId within 30s window generates identical keys', () => {
      // Use a fixed timestamp that stays well within the same 30s bucket regardless of execution time.
      // 60_000 ms → bucket 2.  60_001 ms → bucket 2.  Both should be equal.
      const windowBase = 60_000; // start of bucket 2
      const key1 = buildIdempotencyKey('user-abc', 'price_1S9zK15U03MNTw3qAO5JnplW', windowBase);
      const key2 = buildIdempotencyKey('user-abc', 'price_1S9zK15U03MNTw3qAO5JnplW', windowBase + 5000);
      expect(key1).toBe(key2);
    });

    it('keys differ after 30s window boundary', () => {
      const window1Start = 30000; // epoch ms aligned to a window start
      const window2Start = 60000; // next window
      const key1 = buildIdempotencyKey('user-abc', 'price_123', window1Start);
      const key2 = buildIdempotencyKey('user-abc', 'price_123', window2Start);
      expect(key1).not.toBe(key2);
    });

    it('different users generate different keys', () => {
      const now = Date.now();
      const key1 = buildIdempotencyKey('user-1', 'price_123', now);
      const key2 = buildIdempotencyKey('user-2', 'price_123', now);
      expect(key1).not.toBe(key2);
    });

    it('different plans generate different keys', () => {
      const now = Date.now();
      const key1 = buildIdempotencyKey('user-1', 'price_123', now);
      const key2 = buildIdempotencyKey('user-1', 'price_456', now);
      expect(key1).not.toBe(key2);
    });

    it('idempotency key is passed to Stripe session create', async () => {
      await handleCreateCheckout(supabase, {
        authHeader: 'Bearer valid-token',
        plan: 'speakNow',
        stripeSecretKey: 'sk_test_123',
      });

      expect(mockCreateSession).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({ idempotencyKey: expect.stringContaining('checkout_user-abc_') })
      );
    });

    it('key format includes userId, priceId, and time bucket', () => {
      const now = 90000; // 3 x 30s windows
      const key = buildIdempotencyKey('user-xyz', 'price_abc', now);
      expect(key).toBe(`checkout_user-xyz_price_abc_3`);
    });
  });

  describe('successful checkout session creation', () => {
    it('returns checkout URL on success', async () => {
      const result = await handleCreateCheckout(supabase, {
        authHeader: 'Bearer valid-token',
        plan: 'speakNow',
        stripeSecretKey: 'sk_test_123',
      });
      expect(result.status).toBe(200);
      expect(result.body.url).toContain('checkout.stripe.com');
    });

    it('creates Stripe session with correct mode for subscription plan', async () => {
      await handleCreateCheckout(supabase, {
        authHeader: 'Bearer valid-token',
        plan: 'speakNow',
        stripeSecretKey: 'sk_test_123',
      });

      expect(mockCreateSession).toHaveBeenCalledWith(
        expect.objectContaining({
          mode: 'subscription',
          metadata: expect.objectContaining({ type: 'subscription' }),
        }),
        expect.any(Object)
      );
    });

    it('creates Stripe session with correct mode for credit pack', async () => {
      await handleCreateCheckout(supabase, {
        authHeader: 'Bearer valid-token',
        plan: 'single',
        stripeSecretKey: 'sk_test_123',
      });

      expect(mockCreateSession).toHaveBeenCalledWith(
        expect.objectContaining({
          mode: 'payment',
          metadata: expect.objectContaining({ type: 'credits' }),
        }),
        expect.any(Object)
      );
    });

    it('embeds credits count in Stripe session metadata', async () => {
      await handleCreateCheckout(supabase, {
        authHeader: 'Bearer valid-token',
        plan: 'album',
        stripeSecretKey: 'sk_test_123',
      });

      expect(mockCreateSession).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({ credits: '20' }),
        }),
        expect.any(Object)
      );
    });
  });
});
