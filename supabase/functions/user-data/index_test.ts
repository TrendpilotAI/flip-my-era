import {
  createRecordActivityRpcParameters,
  persistGeneratedBookPair,
  RECORD_ACTIVITY_RPC,
  requireRecordedActivity,
  validateCreditAmount,
} from './contracts.ts';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function assertEquals(actual: unknown, expected: unknown): void {
  const actualJson = JSON.stringify(actual);
  const expectedJson = JSON.stringify(expected);
  assert(actualJson === expectedJson, `Expected ${expectedJson}, received ${actualJson}`);
}

async function assertRejects(operation: () => Promise<unknown>, message: string): Promise<void> {
  try {
    await operation();
  } catch (error) {
    const errorMessage = error instanceof Error
      ? error.message
      : typeof error === 'object' && error && 'message' in error
        ? String(error.message)
        : String(error);
    assert(errorMessage.includes(message), `Expected rejection containing ${message}`);
    return;
  }
  throw new Error(`Expected rejection containing ${message}`);
}

Deno.test('creditsUsed accepts NUMERIC(12,2) fractional values and rejects excess scale', async () => {
  assertEquals(validateCreditAmount(1.25), 1.25);
  assertEquals(validateCreditAmount(0.1), 0.1);
  await assertRejects(
    async () => validateCreditAmount(1.001),
    'at most 2 decimal places',
  );
});

Deno.test('generated-book retry heals a partial pair left by failed compensation', async () => {
  interface Generation { id: string; }
  interface Book { id: string; generationId: string; }

  let generation: Generation | null = null;
  let book: Book | null = null;
  let generationInserts = 0;
  let bookInserts = 0;

  const store = {
    findGeneration: async () => generation,
    insertGeneration: async () => {
      generationInserts += 1;
      generation = { id: 'generation-1' };
      return { data: generation, error: null };
    },
    findBook: async () => book,
    insertBook: async (savedGeneration: Generation) => {
      bookInserts += 1;
      if (bookInserts === 1) {
        return { data: null, error: { code: 'write-failed', message: 'memory insert failed' } };
      }
      book = { id: 'book-1', generationId: savedGeneration.id };
      return { data: book, error: null };
    },
    deleteGeneration: async () => ({ code: 'cleanup-failed' }),
  };

  await assertRejects(() => persistGeneratedBookPair(store), 'memory insert failed');
  assertEquals({ generation, book }, { generation: { id: 'generation-1' }, book: null });

  const retry = await persistGeneratedBookPair(store);
  assertEquals(retry, {
    generation: { id: 'generation-1' },
    book: { id: 'book-1', generationId: 'generation-1' },
    created: false,
  });
  assertEquals({ generationInserts, bookInserts }, { generationInserts: 1, bookInserts: 2 });
});

Deno.test('record-activity forwards story and ebook names unchanged', () => {
  const calls = (['story', 'ebook'] as const).map((contentType) => {
    const args = createRecordActivityRpcParameters(
      'better-auth-user',
      'download',
      contentType,
      '11111111-1111-4111-8111-111111111111',
      {},
    );
    return {
      name: RECORD_ACTIVITY_RPC,
      resourceType: args.p_resource_type,
      userId: args.p_user_id,
    };
  });

  assertEquals(calls, [
    { name: 'record_user_activity', resourceType: 'story', userId: 'better-auth-user' },
    { name: 'record_user_activity', resourceType: 'ebook', userId: 'better-auth-user' },
  ]);
});

Deno.test('record-activity treats an RPC false result as a request failure', async () => {
  await assertRejects(
    async () => requireRecordedActivity(false),
    'Activity was not recorded',
  );
});
