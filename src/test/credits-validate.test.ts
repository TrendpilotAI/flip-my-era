/**
 * credits-validate Edge Function Tests
 *
 * Tests credit validation and atomic deduction logic mirrored from
 * supabase/functions/credits-validate/index.ts.
 *
 * Key concerns tested here:
 *  - Sufficient vs insufficient balance
 *  - Atomic deduction (TOCTOU race condition prevention)
 *  - Operation-based vs legacy pricing
 *  - Auth validation
 *  - Empty/missing request body defaults
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Credit pricing (mirrored from edge function) ────────────────────────────

const CREDIT_PRICING = {
  story_generation:    { basic: 1, advanced: 2, ultra: 4 },
  chapter_generation:  { basic: 1.5, advanced: 3, ultra: 6 },
  novel_outline:       { basic: 2, advanced: 4, ultra: 8 },
  character_development: { basic: 1, advanced: 2, ultra: 4 },
  plot_enhancement:    { basic: 1.5, advanced: 3, ultra: 6 },
  image_generation: {
    story_illustration: { basic: 0.5, advanced: 1, ultra: 2 },
    character_portrait: { basic: 1, advanced: 2, ultra: 4 },
    scene_background:   { basic: 0.8, advanced: 1.5, ultra: 3 },
    cover_art:          { basic: 1.5, advanced: 3, ultra: 6 },
    multi_panel_spread: { basic: 2, advanced: 4, ultra: 8 },
  },
  video_generation: {
    story_recrap:     { basic: 5, advanced: 10, ultra: 20 },
    character_intro:  { basic: 8, advanced: 15, ultra: 30 },
    scene_animation:  { basic: 12, advanced: 25, ultra: 50 },
    full_adaptation:  { basic: 25, advanced: 50, ultra: 100 },
  },
  audio_narration:  { basic: 0.5, advanced: 1, ultra: 3 },
  sound_effects:    { basic: 0.3, advanced: 0.6, ultra: 1.2 },
  background_music: { basic: 0.8, advanced: 1.5, ultra: 3 },
} as const;

type Quality = 'basic' | 'advanced' | 'ultra';

interface Operation {
  type: string;
  quality?: Quality;
  speedPriority?: boolean;
  commercialLicense?: boolean;
  quantity?: number;
  subject?: string;
  videoType?: string;
  durationMinutes?: number;
}

function calculateCreditCost(operation: Operation): number {
  const {
    type,
    quality = 'basic',
    speedPriority = false,
    commercialLicense = false,
    quantity = 1,
  } = operation;

  let baseCost = 0;

  if (type === 'image_generation') {
    const subj = (operation.subject ?? 'story_illustration') as keyof typeof CREDIT_PRICING.image_generation;
    baseCost = CREDIT_PRICING.image_generation[subj]?.[quality] ?? 1;
  } else if (type === 'video_generation') {
    const vt = (operation.videoType ?? 'story_recrap') as keyof typeof CREDIT_PRICING.video_generation;
    baseCost = CREDIT_PRICING.video_generation[vt]?.[quality] ?? 5;
  } else if (type === 'audio_narration') {
    const duration = operation.durationMinutes ?? 1;
    baseCost = CREDIT_PRICING.audio_narration[quality] * duration;
  } else if (type === 'sound_effects') {
    baseCost = CREDIT_PRICING.sound_effects[quality];
  } else if (type === 'background_music') {
    baseCost = CREDIT_PRICING.background_music[quality];
  } else {
    baseCost = (CREDIT_PRICING as Record<string, Record<Quality, number>>)[type]?.[quality] ?? 1;
  }

  baseCost *= quantity;

  if (speedPriority) {
    const speedMultiplier = type.includes('image') ? 0.5 : type.includes('video') ? 0.4 : 0.25;
    baseCost += baseCost * speedMultiplier;
  }

  if (commercialLicense) {
    baseCost *= 1.5;
  }

  if (quantity >= 5) {
    baseCost *= 0.9;
  }

  return Math.max(0.1, Math.round(baseCost * 100) / 100);
}

// ─── Mock Supabase builder ────────────────────────────────────────────────────

interface MockCreditRow {
  balance: number;
  subscription_type: string | null;
}

interface MockRpcResult {
  success: boolean;
  new_balance?: number;
  transaction_id?: string;
}

function createMockSupabase(opts: {
  creditRow?: MockCreditRow;
  creditFetchError?: boolean;
  rpcResult?: MockRpcResult;
  rpcError?: boolean;
}) {
  const mockRpc = vi.fn(async () => ({
    single: vi.fn(async () => {
      if (opts.rpcError) return { data: null, error: { message: 'DB error' } };
      return { data: opts.rpcResult ?? { success: true, new_balance: 48, transaction_id: 'tx-atomic-1' }, error: null };
    }),
  }));

  return {
    from: vi.fn((_table: string) => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(async () => {
            if (opts.creditFetchError) {
              return { data: null, error: { message: 'Fetch error' } };
            }
            return { data: opts.creditRow ?? { balance: 50, subscription_type: 'monthly' }, error: null };
          }),
        })),
      })),
    })),
    rpc: mockRpc,
  };
}

// ─── Handler logic (mirrors validateCreditsWithSupabase) ─────────────────────

interface ValidationData {
  has_sufficient_credits: boolean;
  current_balance: number;
  subscription_type: string | null;
  transaction_id?: string;
  bypass_credits?: boolean;
}

async function validateCreditsWithSupabase(
  supabase: ReturnType<typeof createMockSupabase>,
  userId: string,
  creditsRequired: number
): Promise<ValidationData | null> {
  const { data: creditData, error: creditError } = await supabase
    .from('user_credits')
    .select('balance, subscription_type')
    .eq('user_id', userId)
    .single();

  if (creditError) return null;

  const currentBalance = creditData?.balance ?? 0;

  if (currentBalance < creditsRequired) {
    return {
      has_sufficient_credits: false,
      current_balance: currentBalance,
      subscription_type: creditData?.subscription_type ?? null,
      bypass_credits: false,
    };
  }

  // Atomic deduction via RPC
  const rpcCall = await supabase.rpc('deduct_credits', {
    p_user_id: userId,
    p_amount: creditsRequired,
    p_description: `Ebook generation - ${creditsRequired} credits`,
    p_metadata: { story_type: 'ebook_generation' },
  });

  const { data: result, error: rpcError } = await rpcCall.single();

  if (rpcError) return null;

  if (!result?.success) {
    // Race condition caught — another request won the deduction
    const { data: refreshed } = await supabase
      .from('user_credits')
      .select('balance, subscription_type')
      .eq('user_id', userId)
      .single();

    return {
      has_sufficient_credits: false,
      current_balance: refreshed?.balance ?? 0,
      subscription_type: refreshed?.subscription_type ?? null,
      bypass_credits: false,
    };
  }

  return {
    has_sufficient_credits: true,
    current_balance: result.new_balance,
    subscription_type: creditData?.subscription_type ?? null,
    transaction_id: result.transaction_id,
    bypass_credits: false,
  };
}

// ─── Auth helper ─────────────────────────────────────────────────────────────

function extractUserId(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.replace('Bearer ', '').trim();
  if (!token) return null;
  return 'mock-user-id'; // In production, this calls verifyAuth
}

// ─── Request processing logic ─────────────────────────────────────────────────

interface ValidationRequest {
  credits_required?: number;
  story_type?: string;
  generation_id?: string;
  operations?: Operation[];
}

function computeCreditsRequired(body: ValidationRequest): number {
  const operations = body.operations ?? [];

  if (operations.length > 0) {
    return operations.reduce((total, op) => total + calculateCreditCost(op), 0);
  }
  // Legacy fallback — mirrors edge function: `body.credits_required || 1` (0 is falsy → defaults to 1)
  return body.credits_required || 1;
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('credits-validate Edge Function', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ─── Happy path ────────────────────────────────────────────────────────────

  describe('sufficient credits', () => {
    it('deducts credits and returns transaction_id when balance is sufficient', async () => {
      const supabase = createMockSupabase({
        creditRow: { balance: 50, subscription_type: 'monthly' },
        rpcResult: { success: true, new_balance: 48, transaction_id: 'tx-abc-123' },
      });

      const result = await validateCreditsWithSupabase(supabase, 'user-1', 2);

      expect(result).not.toBeNull();
      expect(result!.has_sufficient_credits).toBe(true);
      expect(result!.transaction_id).toBe('tx-abc-123');
      expect(result!.current_balance).toBe(48);
    });

    it('calls RPC deduct_credits with correct parameters', async () => {
      const supabase = createMockSupabase({
        creditRow: { balance: 10, subscription_type: 'monthly' },
        rpcResult: { success: true, new_balance: 8, transaction_id: 'tx-456' },
      });

      await validateCreditsWithSupabase(supabase, 'user-1', 2);

      expect(supabase.rpc).toHaveBeenCalledWith('deduct_credits', {
        p_user_id: 'user-1',
        p_amount: 2,
        p_description: 'Ebook generation - 2 credits',
        p_metadata: { story_type: 'ebook_generation' },
      });
    });
  });

  // ─── Insufficient credits ──────────────────────────────────────────────────

  describe('insufficient credits', () => {
    it('returns has_sufficient_credits: false when balance is too low', async () => {
      const supabase = createMockSupabase({
        creditRow: { balance: 1, subscription_type: 'monthly' },
      });

      const result = await validateCreditsWithSupabase(supabase, 'user-1', 5);

      expect(result).not.toBeNull();
      expect(result!.has_sufficient_credits).toBe(false);
      expect(result!.current_balance).toBe(1);
    });

    it('does NOT call RPC when balance is insufficient (no deduction attempt)', async () => {
      const supabase = createMockSupabase({
        creditRow: { balance: 1, subscription_type: 'monthly' },
      });

      await validateCreditsWithSupabase(supabase, 'user-1', 5);

      expect(supabase.rpc).not.toHaveBeenCalled();
    });

    it('zero balance returns has_sufficient_credits: false', async () => {
      const supabase = createMockSupabase({
        creditRow: { balance: 0, subscription_type: null },
      });

      const result = await validateCreditsWithSupabase(supabase, 'user-1', 1);

      expect(result).not.toBeNull();
      expect(result!.has_sufficient_credits).toBe(false);
      expect(result!.current_balance).toBe(0);
    });

    it('no deduction when requesting more than available', async () => {
      const supabase = createMockSupabase({
        creditRow: { balance: 3, subscription_type: 'monthly' },
      });

      const result = await validateCreditsWithSupabase(supabase, 'user-1', 10);

      expect(result!.has_sufficient_credits).toBe(false);
      expect(supabase.rpc).not.toHaveBeenCalled();
    });
  });

  // ─── Race conditions ───────────────────────────────────────────────────────

  describe('concurrent requests / race condition prevention', () => {
    it('when RPC returns success: false (race lost), returns has_sufficient_credits: false', async () => {
      // Simulates: two concurrent calls, request-1 saw balance=50, but request-2 deducted first.
      // The RPC function sees the balance is now too low and returns success: false.
      const supabase = createMockSupabase({
        creditRow: { balance: 50, subscription_type: 'monthly' },
        rpcResult: { success: false, new_balance: 20 }, // Race lost
      });

      const result = await validateCreditsWithSupabase(supabase, 'user-1', 40);

      // Even though initial read showed 50, RPC race-check says no
      // (initial read passed, but the RPC result's success=false triggers re-read path)
      expect(result!.has_sufficient_credits).toBe(false);
    });

    it('concurrent simulation: only the winner gets credits', async () => {
      // Request A wins the atomic deduction
      const supabaseA = createMockSupabase({
        creditRow: { balance: 30, subscription_type: 'monthly' },
        rpcResult: { success: true, new_balance: 0, transaction_id: 'tx-winner' },
      });

      // Request B sees balance after A deducted (race lost)
      const supabaseB = createMockSupabase({
        creditRow: { balance: 30, subscription_type: 'monthly' },
        rpcResult: { success: false }, // RPC rejects B's deduction
      });

      const [resultA, resultB] = await Promise.all([
        validateCreditsWithSupabase(supabaseA, 'user-1', 30),
        validateCreditsWithSupabase(supabaseB, 'user-1', 30),
      ]);

      expect(resultA!.has_sufficient_credits).toBe(true);
      expect(resultA!.transaction_id).toBe('tx-winner');
      expect(resultB!.has_sufficient_credits).toBe(false);
    });

    it('RPC error returns null (triggers 503 in handler)', async () => {
      const supabase = createMockSupabase({
        creditRow: { balance: 50, subscription_type: 'monthly' },
        rpcError: true,
      });

      const result = await validateCreditsWithSupabase(supabase, 'user-1', 2);
      expect(result).toBeNull();
    });
  });

  // ─── Operation-based pricing ──────────────────────────────────────────────

  describe('operation-based pricing', () => {
    it('single story_generation operation at basic quality costs 1 credit', () => {
      const total = computeCreditsRequired({
        operations: [{ type: 'story_generation', quality: 'basic' }],
      });
      expect(total).toBe(1);
    });

    it('story_generation at advanced quality costs 2 credits', () => {
      const total = computeCreditsRequired({
        operations: [{ type: 'story_generation', quality: 'advanced' }],
      });
      expect(total).toBe(2);
    });

    it('multiple operations sum correctly', () => {
      const total = computeCreditsRequired({
        operations: [
          { type: 'story_generation', quality: 'basic' }, // 1
          { type: 'image_generation', quality: 'basic', subject: 'character_portrait' }, // 1
        ],
      });
      expect(total).toBe(2);
    });

    it('speed priority increases cost by 25% for text operations', () => {
      const base = calculateCreditCost({ type: 'story_generation', quality: 'basic' });
      const withSpeed = calculateCreditCost({ type: 'story_generation', quality: 'basic', speedPriority: true });
      expect(withSpeed).toBeCloseTo(base * 1.25, 2);
    });

    it('commercial license adds 50% surcharge', () => {
      const base = calculateCreditCost({ type: 'story_generation', quality: 'basic' });
      const withLicense = calculateCreditCost({ type: 'story_generation', quality: 'basic', commercialLicense: true });
      expect(withLicense).toBeCloseTo(base * 1.5, 2);
    });

    it('bulk discount applies at 5+ quantity', () => {
      const singleUnit = calculateCreditCost({ type: 'story_generation', quality: 'basic', quantity: 1 });
      const bulk5 = calculateCreditCost({ type: 'story_generation', quality: 'basic', quantity: 5 });
      // 5 units at base cost with 10% discount
      expect(bulk5).toBeCloseTo(singleUnit * 5 * 0.9, 2);
    });

    it('image_generation with ultra quality calculates correctly', () => {
      const cost = calculateCreditCost({
        type: 'image_generation',
        quality: 'ultra',
        subject: 'cover_art',
      });
      expect(cost).toBe(6); // cover_art ultra = 6
    });

    it('video_generation full_adaptation at advanced is 50 credits', () => {
      const cost = calculateCreditCost({
        type: 'video_generation',
        quality: 'advanced',
        videoType: 'full_adaptation',
      });
      expect(cost).toBe(50);
    });

    it('audio_narration cost scales with duration', () => {
      const oneMin = calculateCreditCost({ type: 'audio_narration', quality: 'basic', durationMinutes: 1 });
      const threeMin = calculateCreditCost({ type: 'audio_narration', quality: 'basic', durationMinutes: 3 });
      expect(threeMin).toBeCloseTo(oneMin * 3, 2);
    });

    it('minimum cost is 0.1 credits (never negative)', () => {
      // Force a very small cost via a real operation
      const cost = calculateCreditCost({ type: 'sound_effects', quality: 'basic' });
      expect(cost).toBeGreaterThanOrEqual(0.1);
    });
  });

  // ─── Legacy credits_required ──────────────────────────────────────────────

  describe('legacy credits_required backward compatibility', () => {
    it('uses credits_required when no operations array provided', () => {
      const total = computeCreditsRequired({ credits_required: 5 });
      expect(total).toBe(5);
    });

    it('defaults to 1 credit when credits_required is absent and no operations', () => {
      const total = computeCreditsRequired({});
      expect(total).toBe(1);
    });

    it('operations array takes precedence over legacy credits_required', () => {
      const total = computeCreditsRequired({
        credits_required: 99, // should be ignored
        operations: [{ type: 'story_generation', quality: 'basic' }], // 1 credit
      });
      expect(total).toBe(1);
    });
  });

  // ─── Auth validation ───────────────────────────────────────────────────────

  describe('auth validation', () => {
    it('returns null userId when Authorization header is missing', () => {
      const userId = extractUserId(null);
      expect(userId).toBeNull();
    });

    it('returns null userId when header does not start with Bearer', () => {
      const userId = extractUserId('Token abc123');
      expect(userId).toBeNull();
    });

    it('returns null userId when Bearer token is empty', () => {
      const userId = extractUserId('Bearer ');
      expect(userId).toBeNull();
    });

    it('returns userId for valid Bearer token', () => {
      const userId = extractUserId('Bearer eyJhbGciOiJIUzI1NiJ9.test.sig');
      expect(userId).not.toBeNull();
    });
  });

  // ─── Empty request body ────────────────────────────────────────────────────

  describe('empty / missing request body', () => {
    it('defaults to 1 credit when body is completely empty', () => {
      const total = computeCreditsRequired({});
      expect(total).toBe(1);
    });

    it('defaults to 1 credit when credits_required is 0 (falsy)', () => {
      // credits_required: 0 → falsy → defaults to 1
      const total = computeCreditsRequired({ credits_required: 0 });
      expect(total).toBe(1); // Because 0 || 1 = 1 in the edge function
    });

    it('processes empty operations array as legacy mode', () => {
      const total = computeCreditsRequired({ operations: [] });
      expect(total).toBe(1);
    });
  });

  // ─── DB fetch error ────────────────────────────────────────────────────────

  describe('database errors', () => {
    it('returns null when credit fetch fails (triggers 503)', async () => {
      const supabase = createMockSupabase({ creditFetchError: true });
      const result = await validateCreditsWithSupabase(supabase, 'user-1', 2);
      expect(result).toBeNull();
    });
  });
});
