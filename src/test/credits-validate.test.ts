import { describe, expect, it, vi } from 'vitest';

const CREDIT_PRICING = {
  story_generation: { basic: 1, advanced: 2, ultra: 4 },
  chapter_generation: { basic: 1.5, advanced: 3, ultra: 6 },
  novel_outline: { basic: 2, advanced: 4, ultra: 8 },
  character_development: { basic: 1, advanced: 2, ultra: 4 },
  plot_enhancement: { basic: 1.5, advanced: 3, ultra: 6 },
} as const;

interface Operation {
  operationType?: string;
  modelQuality?: 'basic' | 'advanced' | 'ultra';
  type?: string;
  quality?: 'basic' | 'advanced' | 'ultra';
  speedPriority?: boolean;
  commercialLicense?: boolean;
  quantity?: number;
}

function calculateCreditCost(operation: Operation): number {
  const type = operation.operationType ?? operation.type ?? 'story_generation';
  const quality = operation.modelQuality ?? operation.quality ?? 'basic';
  const quantity = operation.quantity ?? 1;
  const pricing = CREDIT_PRICING[type as keyof typeof CREDIT_PRICING];
  let total = pricing?.[quality] ?? 1;
  total *= quantity;
  if (operation.speedPriority) total *= 1.25;
  if (operation.commercialLicense) total *= 1.5;
  if (quantity >= 5) total *= 0.9;
  return Math.max(0.1, Math.round(total * 100) / 100);
}

function computeCreditsRequired(body: {
  credits_required?: number;
  operationType?: string;
  modelQuality?: 'basic' | 'advanced' | 'ultra';
  operations?: Operation[];
}): number {
  const operations = body.operations?.length
    ? body.operations
    : body.operationType
      ? [{ operationType: body.operationType, modelQuality: body.modelQuality }]
      : [];

  if (operations.length > 0) {
    return operations.reduce((total, operation) => total + calculateCreditCost(operation), 0);
  }
  return body.credits_required ?? 1;
}

function createMockSupabase(balance: number | null, subscriptionType: string | null = null) {
  const maybeSingle = vi.fn(async () => ({
    data: balance === null ? null : { balance, subscription_type: subscriptionType },
    error: null,
  }));
  const rpc = vi.fn();

  return {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({ maybeSingle })),
      })),
    })),
    rpc,
  };
}

async function validateCredits(
  supabase: ReturnType<typeof createMockSupabase>,
  userId: string,
  creditsRequired: number,
) {
  const { data, error } = await supabase
    .from()
    .select()
    .eq('user_id', userId)
    .maybeSingle();

  if (error) return null;
  const currentBalance = Number(data?.balance ?? 0);
  return {
    has_sufficient_credits: currentBalance >= creditsRequired,
    current_balance: currentBalance,
    required_credits: creditsRequired,
    subscription_type: data?.subscription_type ?? null,
    bypass_credits: false,
  };
}

describe('credits-validate contract', () => {
  it('accepts the client operationType/modelQuality request shape', () => {
    expect(computeCreditsRequired({
      operations: [{ operationType: 'chapter_generation', modelQuality: 'advanced' }],
    })).toBe(3);
  });

  it('retains the legacy type/quality operation shape', () => {
    expect(computeCreditsRequired({
      operations: [{ type: 'story_generation', quality: 'ultra' }],
    })).toBe(4);
  });

  it('accepts a single operation at the top level', () => {
    expect(computeCreditsRequired({
      operationType: 'novel_outline',
      modelQuality: 'advanced',
    })).toBe(4);
  });

  it('supports fractional pricing without rounding to integers', () => {
    expect(computeCreditsRequired({
      operations: [{ operationType: 'chapter_generation', modelQuality: 'basic' }],
    })).toBe(1.5);
  });

  it('returns the unchanged balance when sufficient', async () => {
    const supabase = createMockSupabase(10, 'monthly');
    const result = await validateCredits(supabase, 'user-1', 3);

    expect(result).toEqual({
      has_sufficient_credits: true,
      current_balance: 10,
      required_credits: 3,
      subscription_type: 'monthly',
      bypass_credits: false,
    });
    expect(supabase.rpc).not.toHaveBeenCalled();
  });

  it('reports insufficient funds without attempting a deduction', async () => {
    const supabase = createMockSupabase(1);
    const result = await validateCredits(supabase, 'user-1', 3);

    expect(result?.has_sufficient_credits).toBe(false);
    expect(result?.current_balance).toBe(1);
    expect(supabase.rpc).not.toHaveBeenCalled();
  });

  it('treats a missing credit row as a zero balance', async () => {
    const supabase = createMockSupabase(null);
    const result = await validateCredits(supabase, 'user-1', 1);

    expect(result?.current_balance).toBe(0);
    expect(result?.has_sufficient_credits).toBe(false);
  });

  it('preserves explicit legacy fractional requirements', () => {
    expect(computeCreditsRequired({ credits_required: 0.5 })).toBe(0.5);
  });
});
