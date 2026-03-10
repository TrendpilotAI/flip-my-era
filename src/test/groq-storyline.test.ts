/**
 * groq-storyline Edge Function Tests
 *
 * Tests storyline generation logic including:
 *  - Pre-authorized transaction path (credits already deducted by credits-validate)
 *  - Direct credit deduction path
 *  - Idempotency key replay (cached response)
 *  - Rate limiting
 *  - Input validation
 *  - Auth validation
 *  - Missing GROQ_API_KEY
 *
 * Mirrors logic from supabase/functions/groq-storyline/index.ts.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Constants (from edge function) ──────────────────────────────────────────

const STORYLINE_GENERATION_CREDITS = 2;
const RATE_LIMIT = { maxRequests: 10, windowMs: 3600000 }; // 10 req/hr

// ─── Types ────────────────────────────────────────────────────────────────────

interface GenerateStorylineRequest {
  era: string;
  characterName: string;
  characterArchetype: string;
  gender: 'same' | 'flip' | 'neutral';
  location: string;
  promptDescription: string;
  customPrompt?: string;
  systemPrompt: string;
  idempotency_key?: string;
  pre_authorized_transaction_id?: string;
}

interface RateLimitRecord {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

interface DeductResult {
  success: boolean;
  new_balance?: number;
  transaction_id?: string;
}

interface CreditTransaction {
  id: string;
  user_id: string;
  amount: number;
}

interface GenerationRequest {
  status: 'pending' | 'completed' | 'failed';
  response_cache?: Record<string, unknown> | null;
}

// ─── Mock Supabase builder ────────────────────────────────────────────────────

function createMockSupabase(opts: {
  // credit_transactions lookup (for pre-authorized path)
  existingTx?: CreditTransaction | null;
  txLookupError?: boolean;

  // generation_requests lookup (for idempotency replay)
  existingGenRequest?: GenerationRequest | null;

  // deduct_credits RPC result
  deductResult?: DeductResult;
  deductError?: boolean;

  // user_credits (for insufficient credits error message)
  userBalance?: number;
} = {}) {
  const mockSingleTx = vi.fn(async () => {
    if (opts.txLookupError) {
      return { data: null, error: { message: 'Not found' } };
    }
    if (opts.existingTx === null) {
      return { data: null, error: { message: 'Not found' } };
    }
    return { data: opts.existingTx ?? { id: 'tx-pre-auth', user_id: 'user-1', amount: 2 }, error: null };
  });

  const mockSingleGenRequest = vi.fn(async () => {
    if (opts.existingGenRequest === undefined) {
      return { data: null, error: { message: 'Not found' } };
    }
    return { data: opts.existingGenRequest, error: null };
  });

  const mockSingleBalance = vi.fn(async () => ({
    data: { balance: opts.userBalance ?? 0 },
    error: null,
  }));

  const mockRpcSingle = vi.fn(async () => {
    if (opts.deductError) {
      return { data: null, error: { message: 'DB error' } };
    }
    return {
      data: opts.deductResult ?? { success: true, new_balance: 8, transaction_id: 'tx-new-123' },
      error: null,
    };
  });

  // Track which table is being queried to route single() correctly
  let currentTable = '';

  const mockFrom = vi.fn((table: string) => {
    currentTable = table;
    return {
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: table === 'credit_transactions' ? mockSingleTx : mockSingleBalance,
          })),
          single: table === 'generation_requests' ? mockSingleGenRequest : mockSingleBalance,
        })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(async () => ({ data: { id: 'gen-req-id-1' }, error: null })),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({ error: null })),
      })),
    };
  });

  return {
    from: mockFrom,
    rpc: vi.fn(() => ({
      single: mockRpcSingle,
    })),
    _mocks: {
      mockSingleTx,
      mockSingleGenRequest,
      mockRpcSingle,
    },
  };
}

// ─── Input validation logic ───────────────────────────────────────────────────

interface ValidationError {
  error: string;
  message: string;
}

function validateStorylineInput(params: Partial<GenerateStorylineRequest>): ValidationError | null {
  if (!params.era || typeof params.era !== 'string') {
    return { error: 'BAD_REQUEST', message: 'Era is required and must be a string' };
  }

  if (!params.characterName || typeof params.characterName !== 'string' || params.characterName.trim().length === 0) {
    return { error: 'BAD_REQUEST', message: 'Character name is required and cannot be empty' };
  }

  if (params.characterName.length > 50) {
    return { error: 'BAD_REQUEST', message: 'Character name must be 50 characters or less' };
  }

  if (!params.location || typeof params.location !== 'string' || params.location.trim().length === 0) {
    return { error: 'BAD_REQUEST', message: 'Location is required and cannot be empty' };
  }

  if (params.location.length > 100) {
    return { error: 'BAD_REQUEST', message: 'Location must be 100 characters or less' };
  }

  if (!params.gender || !['same', 'flip', 'neutral'].includes(params.gender)) {
    return { error: 'BAD_REQUEST', message: 'Gender must be same, flip, or neutral' };
  }

  if (!params.systemPrompt || typeof params.systemPrompt !== 'string' || params.systemPrompt.trim().length === 0) {
    return { error: 'BAD_REQUEST', message: 'System prompt is required' };
  }

  return null;
}

// ─── Auth helper ─────────────────────────────────────────────────────────────

function extractUserId(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.replace('Bearer ', '').trim();
  if (!token) return null;
  return 'mock-user-id';
}

// ─── Rate limit check helper ──────────────────────────────────────────────────

function checkRateLimit(
  record: RateLimitRecord
): { allowed: boolean; retryAfter?: number } {
  if (!record.allowed) {
    return {
      allowed: false,
      retryAfter: Math.ceil((record.resetAt - Date.now()) / 1000),
    };
  }
  return { allowed: true };
}

// ─── Core handler logic ───────────────────────────────────────────────────────

interface HandleResult {
  status: number;
  body: Record<string, unknown>;
  headers?: Record<string, string>;
}

async function handleGroqStoryline(
  supabase: ReturnType<typeof createMockSupabase>,
  {
    authHeader,
    groqApiKey,
    params,
    rateLimitRecord,
    mockGroqResponse,
  }: {
    authHeader: string | null;
    groqApiKey?: string;
    params: Partial<GenerateStorylineRequest>;
    rateLimitRecord?: RateLimitRecord;
    mockGroqResponse?: Record<string, unknown> | null;
  }
): Promise<HandleResult> {
  // 1. Check GROQ_API_KEY
  if (!groqApiKey) {
    return {
      status: 500,
      body: { error: 'GROQ_API_KEY_MISSING', message: 'Groq API key not configured' },
    };
  }

  // 2. Auth check
  const userId = extractUserId(authHeader);
  if (!userId) {
    return {
      status: 401,
      body: { error: 'UNAUTHORIZED', message: 'Invalid or expired token' },
    };
  }

  // 3. Rate limit
  const rl = rateLimitRecord ?? { allowed: true, remaining: 9, resetAt: Date.now() + 3600000 };
  const rlResult = checkRateLimit(rl);
  if (!rlResult.allowed) {
    return {
      status: 429,
      body: {
        error: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many storyline generation requests. Please try again later.',
        retryAfter: rlResult.retryAfter,
      },
      headers: {
        'Retry-After': String(rlResult.retryAfter),
        'X-RateLimit-Limit': String(RATE_LIMIT.maxRequests),
      },
    };
  }

  // 4. Idempotency check
  const { idempotency_key, pre_authorized_transaction_id } = params;

  if (idempotency_key) {
    const { data: existingRequest } = await supabase
      .from('generation_requests')
      .select('status, response_cache')
      .eq('idempotency_key', idempotency_key)
      .single();

    if (existingRequest) {
      if (existingRequest.status === 'completed' && existingRequest.response_cache) {
        return {
          status: 200,
          body: existingRequest.response_cache as Record<string, unknown>,
          headers: { 'X-Idempotent-Replay': 'true' },
        };
      }
      if (existingRequest.status === 'pending') {
        return {
          status: 409,
          body: { error: 'REQUEST_IN_PROGRESS', message: 'A storyline generation with this key is already in progress.' },
        };
      }
    }
  }

  // 5. Credit handling
  let transactionId: string | null = null;

  if (pre_authorized_transaction_id) {
    // Verify the pre-authorized transaction
    const { data: existingTx, error: txError } = await supabase
      .from('credit_transactions')
      .select('id, user_id, amount')
      .eq('id', pre_authorized_transaction_id)
      .eq('user_id', userId)
      .single();

    if (txError || !existingTx) {
      return {
        status: 400,
        body: { error: 'INVALID_TRANSACTION', message: 'Pre-authorized transaction is invalid. Please try again.' },
      };
    }

    transactionId = pre_authorized_transaction_id;
  } else {
    // Direct deduction
    const { data: deductResult, error: deductError } = await supabase
      .rpc('deduct_credits', {
        p_user_id: userId,
        p_amount: STORYLINE_GENERATION_CREDITS,
        p_description: 'Storyline generation',
        p_metadata: { operation_type: 'storyline_generation', idempotency_key: idempotency_key ?? null },
      })
      .single();

    if (deductError) {
      return { status: 503, body: { error: 'CREDIT_SERVICE_ERROR', message: 'Unable to process credits. Please try again.' } };
    }

    if (!deductResult?.success) {
      const { data: balanceData } = await supabase
        .from('user_credits')
        .select('balance')
        .eq('user_id', userId)
        .single();

      return {
        status: 402,
        body: {
          error: 'INSUFFICIENT_CREDITS',
          message: 'You do not have enough credits to generate a storyline.',
          current_balance: balanceData?.balance ?? 0,
          required: STORYLINE_GENERATION_CREDITS,
        },
      };
    }

    transactionId = deductResult.transaction_id;
  }

  // 6. Input validation (happens after credit handling in the edge function)
  const validationError = validateStorylineInput(params);
  if (validationError) {
    return { status: 400, body: validationError };
  }

  // 7. Simulate Groq API call
  if (mockGroqResponse === null) {
    return { status: 500, body: { error: 'GROQ_API_ERROR', message: 'Groq API request failed' } };
  }

  const storyline = mockGroqResponse ?? {
    logline: 'A hero faces adversity.',
    threeActStructure: {
      act1: { setup: 'Setup', incitingIncident: 'Incident', firstPlotPoint: 'Point' },
      act2: { risingAction: 'Rising', midpoint: 'Mid', darkNightOfTheSoul: 'Dark' },
      act3: { climax: 'Climax', resolution: 'Resolution', closingImage: 'Close' },
    },
    chapters: [{ number: 1, title: 'Ch1', summary: 'Summary', wordCountTarget: 800 }],
    themes: ['courage'],
    wordCountTotal: 800,
  };

  return {
    status: 200,
    body: { storyline, transaction_id: transactionId },
  };
}

// ─── Valid test request factory ───────────────────────────────────────────────

function validRequest(overrides: Partial<GenerateStorylineRequest> = {}): GenerateStorylineRequest {
  return {
    era: '1920s Jazz Age',
    characterName: 'Alex Rivera',
    characterArchetype: 'protagonist',
    gender: 'same',
    location: 'New Orleans',
    promptDescription: 'A jazz musician finds a mysterious melody.',
    systemPrompt: 'You are a master storyteller.',
    ...overrides,
  };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('groq-storyline Edge Function', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ─── Pre-authorized transaction path ──────────────────────────────────────

  describe('pre_authorized_transaction_id', () => {
    it('skips credit deduction when valid pre_authorized_transaction_id is provided', async () => {
      const supabase = createMockSupabase({
        existingTx: { id: 'tx-pre-auth-1', user_id: 'mock-user-id', amount: 2 },
      });

      const result = await handleGroqStoryline(supabase, {
        authHeader: 'Bearer valid-token',
        groqApiKey: 'gsk_test_key',
        params: { ...validRequest(), pre_authorized_transaction_id: 'tx-pre-auth-1' },
      });

      expect(result.status).toBe(200);
      // RPC deduct_credits should NOT have been called
      expect(supabase.rpc).not.toHaveBeenCalled();
    });

    it('verifies that the pre-authorized transaction exists in the database', async () => {
      const supabase = createMockSupabase({
        existingTx: { id: 'tx-pre-auth-1', user_id: 'mock-user-id', amount: 2 },
      });

      await handleGroqStoryline(supabase, {
        authHeader: 'Bearer valid-token',
        groqApiKey: 'gsk_test_key',
        params: { ...validRequest(), pre_authorized_transaction_id: 'tx-pre-auth-1' },
      });

      expect(supabase.from).toHaveBeenCalledWith('credit_transactions');
    });

    it('returns 400 for invalid pre_authorized_transaction_id (not found in DB)', async () => {
      const supabase = createMockSupabase({
        existingTx: null,
        txLookupError: true,
      });

      const result = await handleGroqStoryline(supabase, {
        authHeader: 'Bearer valid-token',
        groqApiKey: 'gsk_test_key',
        params: { ...validRequest(), pre_authorized_transaction_id: 'tx-bogus' },
      });

      expect(result.status).toBe(400);
      expect(result.body.error).toBe('INVALID_TRANSACTION');
    });

    it('returns 400 when pre_authorized_transaction_id belongs to different user', async () => {
      const supabase = createMockSupabase({
        existingTx: null, // The .eq('user_id', userId) filter finds nothing
        txLookupError: true,
      });

      const result = await handleGroqStoryline(supabase, {
        authHeader: 'Bearer valid-token',
        groqApiKey: 'gsk_test_key',
        params: { ...validRequest(), pre_authorized_transaction_id: 'tx-belongs-to-other-user' },
      });

      expect(result.status).toBe(400);
      expect(result.body.error).toBe('INVALID_TRANSACTION');
      expect(result.body.message as string).toContain('invalid');
    });
  });

  // ─── Direct credit deduction path ─────────────────────────────────────────

  describe('without pre_authorized_transaction_id', () => {
    it('deducts credits normally via RPC when no pre_authorized_transaction_id', async () => {
      const supabase = createMockSupabase({
        deductResult: { success: true, new_balance: 8, transaction_id: 'tx-direct-1' },
      });

      const result = await handleGroqStoryline(supabase, {
        authHeader: 'Bearer valid-token',
        groqApiKey: 'gsk_test_key',
        params: validRequest(),
      });

      expect(result.status).toBe(200);
      expect(supabase.rpc).toHaveBeenCalledWith('deduct_credits', expect.objectContaining({
        p_user_id: 'mock-user-id',
        p_amount: STORYLINE_GENERATION_CREDITS,
        p_description: 'Storyline generation',
      }));
    });

    it('returns 402 when user has insufficient credits', async () => {
      const supabase = createMockSupabase({
        deductResult: { success: false },
        userBalance: 1,
      });

      const result = await handleGroqStoryline(supabase, {
        authHeader: 'Bearer valid-token',
        groqApiKey: 'gsk_test_key',
        params: validRequest(),
      });

      expect(result.status).toBe(402);
      expect(result.body.error).toBe('INSUFFICIENT_CREDITS');
      expect(result.body.required).toBe(STORYLINE_GENERATION_CREDITS);
    });

    it('returns 503 when RPC deduct_credits fails with DB error', async () => {
      const supabase = createMockSupabase({ deductError: true });

      const result = await handleGroqStoryline(supabase, {
        authHeader: 'Bearer valid-token',
        groqApiKey: 'gsk_test_key',
        params: validRequest(),
      });

      expect(result.status).toBe(503);
      expect(result.body.error).toBe('CREDIT_SERVICE_ERROR');
    });
  });

  // ─── Idempotency key replay ────────────────────────────────────────────────

  describe('idempotency key replay', () => {
    it('returns cached response for completed idempotency key', async () => {
      const cachedStoryline = { storyline: { logline: 'Cached story.' } };
      const supabase = createMockSupabase({
        existingGenRequest: { status: 'completed', response_cache: cachedStoryline },
      });

      const result = await handleGroqStoryline(supabase, {
        authHeader: 'Bearer valid-token',
        groqApiKey: 'gsk_test_key',
        params: { ...validRequest(), idempotency_key: 'idem-key-abc123' },
      });

      expect(result.status).toBe(200);
      expect(result.body).toEqual(cachedStoryline);
      expect(result.headers?.['X-Idempotent-Replay']).toBe('true');
    });

    it('does NOT deduct credits on idempotency key replay', async () => {
      const supabase = createMockSupabase({
        existingGenRequest: {
          status: 'completed',
          response_cache: { storyline: { logline: 'Cached.' } },
        },
      });

      await handleGroqStoryline(supabase, {
        authHeader: 'Bearer valid-token',
        groqApiKey: 'gsk_test_key',
        params: { ...validRequest(), idempotency_key: 'idem-key-abc123' },
      });

      expect(supabase.rpc).not.toHaveBeenCalled();
    });

    it('returns 409 for pending idempotency key (in-progress)', async () => {
      const supabase = createMockSupabase({
        existingGenRequest: { status: 'pending', response_cache: null },
      });

      const result = await handleGroqStoryline(supabase, {
        authHeader: 'Bearer valid-token',
        groqApiKey: 'gsk_test_key',
        params: { ...validRequest(), idempotency_key: 'idem-key-pending' },
      });

      expect(result.status).toBe(409);
      expect(result.body.error).toBe('REQUEST_IN_PROGRESS');
    });

    it('proceeds normally when idempotency key is new (not found in DB)', async () => {
      const supabase = createMockSupabase({
        existingGenRequest: undefined, // not found
        deductResult: { success: true, new_balance: 8, transaction_id: 'tx-fresh' },
      });

      const result = await handleGroqStoryline(supabase, {
        authHeader: 'Bearer valid-token',
        groqApiKey: 'gsk_test_key',
        params: { ...validRequest(), idempotency_key: 'idem-key-brand-new' },
      });

      expect(result.status).toBe(200);
    });
  });

  // ─── Rate limiting ─────────────────────────────────────────────────────────

  describe('rate limiting', () => {
    it('returns 429 when rate limit is exceeded', async () => {
      const resetAt = Date.now() + 3600000;
      const supabase = createMockSupabase({});

      const result = await handleGroqStoryline(supabase, {
        authHeader: 'Bearer valid-token',
        groqApiKey: 'gsk_test_key',
        params: validRequest(),
        rateLimitRecord: { allowed: false, remaining: 0, resetAt },
      });

      expect(result.status).toBe(429);
      expect(result.body.error).toBe('RATE_LIMIT_EXCEEDED');
    });

    it('includes retryAfter in rate limit response', async () => {
      const resetAt = Date.now() + 1800000; // 30 min from now
      const supabase = createMockSupabase({});

      const result = await handleGroqStoryline(supabase, {
        authHeader: 'Bearer valid-token',
        groqApiKey: 'gsk_test_key',
        params: validRequest(),
        rateLimitRecord: { allowed: false, remaining: 0, resetAt },
      });

      expect(result.status).toBe(429);
      expect(result.body.retryAfter).toBeGreaterThan(0);
      expect(result.headers?.['Retry-After']).toBeDefined();
    });

    it('includes X-RateLimit-Limit header in 429 response', async () => {
      const supabase = createMockSupabase({});

      const result = await handleGroqStoryline(supabase, {
        authHeader: 'Bearer valid-token',
        groqApiKey: 'gsk_test_key',
        params: validRequest(),
        rateLimitRecord: { allowed: false, remaining: 0, resetAt: Date.now() + 3600000 },
      });

      expect(result.headers?.['X-RateLimit-Limit']).toBe(String(RATE_LIMIT.maxRequests));
    });

    it('does not call RPC when rate limited (no credits deducted)', async () => {
      const supabase = createMockSupabase({});

      await handleGroqStoryline(supabase, {
        authHeader: 'Bearer valid-token',
        groqApiKey: 'gsk_test_key',
        params: validRequest(),
        rateLimitRecord: { allowed: false, remaining: 0, resetAt: Date.now() + 3600000 },
      });

      expect(supabase.rpc).not.toHaveBeenCalled();
    });

    it('allows request when rate limit has remaining capacity', async () => {
      const supabase = createMockSupabase({
        deductResult: { success: true, new_balance: 8, transaction_id: 'tx-ok' },
      });

      const result = await handleGroqStoryline(supabase, {
        authHeader: 'Bearer valid-token',
        groqApiKey: 'gsk_test_key',
        params: validRequest(),
        rateLimitRecord: { allowed: true, remaining: 5, resetAt: Date.now() + 3600000 },
      });

      expect(result.status).toBe(200);
    });
  });

  // ─── Missing GROQ_API_KEY ─────────────────────────────────────────────────

  describe('missing GROQ_API_KEY', () => {
    it('returns 500 with GROQ_API_KEY_MISSING error when key is undefined', async () => {
      const supabase = createMockSupabase({});

      const result = await handleGroqStoryline(supabase, {
        authHeader: 'Bearer valid-token',
        groqApiKey: undefined,
        params: validRequest(),
      });

      expect(result.status).toBe(500);
      expect(result.body.error).toBe('GROQ_API_KEY_MISSING');
    });

    it('returns 500 with GROQ_API_KEY_MISSING error when key is empty string', async () => {
      const supabase = createMockSupabase({});

      const result = await handleGroqStoryline(supabase, {
        authHeader: 'Bearer valid-token',
        groqApiKey: '',
        params: validRequest(),
      });

      expect(result.status).toBe(500);
      expect(result.body.error).toBe('GROQ_API_KEY_MISSING');
    });

    it('does not deduct credits when GROQ_API_KEY is missing (key checked first)', async () => {
      const supabase = createMockSupabase({});

      await handleGroqStoryline(supabase, {
        authHeader: 'Bearer valid-token',
        groqApiKey: undefined,
        params: validRequest(),
      });

      // No credits deducted — API key check is the first gate
      expect(supabase.rpc).not.toHaveBeenCalled();
    });
  });

  // ─── Auth validation ───────────────────────────────────────────────────────

  describe('auth validation', () => {
    it('returns 401 when Authorization header is missing', async () => {
      const supabase = createMockSupabase({});

      const result = await handleGroqStoryline(supabase, {
        authHeader: null,
        groqApiKey: 'gsk_test_key',
        params: validRequest(),
      });

      expect(result.status).toBe(401);
      expect(result.body.error).toBe('UNAUTHORIZED');
    });

    it('returns 401 when Bearer token is malformed', async () => {
      const supabase = createMockSupabase({});

      const result = await handleGroqStoryline(supabase, {
        authHeader: 'InvalidHeader',
        groqApiKey: 'gsk_test_key',
        params: validRequest(),
      });

      expect(result.status).toBe(401);
    });
  });

  // ─── Input validation ──────────────────────────────────────────────────────

  describe('input validation', () => {
    it('returns 400 when era is missing', async () => {
      const supabase = createMockSupabase({
        deductResult: { success: true, new_balance: 8, transaction_id: 'tx-val' },
      });

      const result = await handleGroqStoryline(supabase, {
        authHeader: 'Bearer valid-token',
        groqApiKey: 'gsk_test_key',
        params: { ...validRequest(), era: '' },
      });

      expect(result.status).toBe(400);
      expect(result.body.error).toBe('BAD_REQUEST');
      expect(result.body.message as string).toContain('Era');
    });

    it('returns 400 when characterName exceeds 50 characters', async () => {
      const supabase = createMockSupabase({
        deductResult: { success: true, new_balance: 8, transaction_id: 'tx-val' },
      });

      const result = await handleGroqStoryline(supabase, {
        authHeader: 'Bearer valid-token',
        groqApiKey: 'gsk_test_key',
        params: { ...validRequest(), characterName: 'A'.repeat(51) },
      });

      expect(result.status).toBe(400);
      expect(result.body.error).toBe('BAD_REQUEST');
      expect(result.body.message as string).toContain('50 characters');
    });

    it('accepts characterName of exactly 50 characters', () => {
      const error = validateStorylineInput(validRequest({ characterName: 'A'.repeat(50) }));
      expect(error).toBeNull();
    });

    it('returns 400 when characterName is empty', async () => {
      const supabase = createMockSupabase({
        deductResult: { success: true, new_balance: 8, transaction_id: 'tx-val' },
      });

      const result = await handleGroqStoryline(supabase, {
        authHeader: 'Bearer valid-token',
        groqApiKey: 'gsk_test_key',
        params: { ...validRequest(), characterName: '' },
      });

      expect(result.status).toBe(400);
      expect(result.body.message as string).toContain('Character name');
    });

    it('returns 400 for invalid gender value', async () => {
      const supabase = createMockSupabase({
        deductResult: { success: true, new_balance: 8, transaction_id: 'tx-val' },
      });

      const result = await handleGroqStoryline(supabase, {
        authHeader: 'Bearer valid-token',
        groqApiKey: 'gsk_test_key',
        // @ts-expect-error intentionally invalid
        params: { ...validRequest(), gender: 'invalid_gender' },
      });

      expect(result.status).toBe(400);
      expect(result.body.message as string).toContain('same, flip, or neutral');
    });

    it('accepts all valid gender values', () => {
      const genders: Array<'same' | 'flip' | 'neutral'> = ['same', 'flip', 'neutral'];
      for (const gender of genders) {
        const error = validateStorylineInput(validRequest({ gender }));
        expect(error).toBeNull();
      }
    });

    it('returns 400 when location is missing', async () => {
      const supabase = createMockSupabase({
        deductResult: { success: true, new_balance: 8, transaction_id: 'tx-val' },
      });

      const result = await handleGroqStoryline(supabase, {
        authHeader: 'Bearer valid-token',
        groqApiKey: 'gsk_test_key',
        params: { ...validRequest(), location: '' },
      });

      expect(result.status).toBe(400);
      expect(result.body.message as string).toContain('Location');
    });

    it('returns 400 when location exceeds 100 characters', () => {
      const error = validateStorylineInput(validRequest({ location: 'L'.repeat(101) }));
      expect(error).not.toBeNull();
      expect(error!.message).toContain('100 characters');
    });

    it('returns 400 when systemPrompt is missing', async () => {
      const supabase = createMockSupabase({
        deductResult: { success: true, new_balance: 8, transaction_id: 'tx-val' },
      });

      const result = await handleGroqStoryline(supabase, {
        authHeader: 'Bearer valid-token',
        groqApiKey: 'gsk_test_key',
        params: { ...validRequest(), systemPrompt: '' },
      });

      expect(result.status).toBe(400);
      expect(result.body.message as string).toContain('System prompt');
    });

    it('passes validation with all required fields present', () => {
      const error = validateStorylineInput(validRequest());
      expect(error).toBeNull();
    });
  });

  // ─── Credits constant ──────────────────────────────────────────────────────

  describe('credit constants', () => {
    it('storyline generation costs exactly 2 credits', () => {
      expect(STORYLINE_GENERATION_CREDITS).toBe(2);
    });

    it('rate limit is 10 requests per hour', () => {
      expect(RATE_LIMIT.maxRequests).toBe(10);
      expect(RATE_LIMIT.windowMs).toBe(3600000);
    });
  });
});
