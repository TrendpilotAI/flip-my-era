const MAX_CREDIT_AMOUNT = 9_999_999_999.99;

export const RECORD_ACTIVITY_RPC = 'record_user_activity';

export class RequestError extends Error {
  constructor(message: string, readonly status = 400) {
    super(message);
  }
}

interface PersistenceError {
  code?: string;
  message?: string;
}

interface PersistenceWrite<Row> {
  data: Row | null;
  error: PersistenceError | null;
}

export interface GeneratedBookPairStore<Generation extends { id: string }, Book extends { id: string }> {
  findGeneration: () => Promise<Generation | null>;
  insertGeneration: () => Promise<PersistenceWrite<Generation>>;
  findBook: () => Promise<Book | null>;
  insertBook: (generation: Generation) => Promise<PersistenceWrite<Book>>;
  deleteGeneration: () => Promise<PersistenceError | null>;
}

export interface GeneratedBookPairResult<Generation, Book> {
  generation: Generation;
  book: Book;
  created: boolean;
}

export type ActivityType = 'download' | 'share';
export type ActivityContentType = 'story' | 'ebook';

export interface RecordActivityRpcParameters {
  p_user_id: string;
  p_activity_type: ActivityType;
  p_resource_type: ActivityContentType;
  p_resource_id: string;
  p_activity_data: Record<string, unknown>;
}

export interface RecordedActivityResult {
  recorded: true;
}

function isConflict(error: PersistenceError | null): boolean {
  return error?.code === '23505';
}

export function validateCreditAmount(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    throw new RequestError('creditsUsed must be a non-negative number');
  }
  if (value > MAX_CREDIT_AMOUNT) throw new RequestError('creditsUsed is too large');

  const scaledValue = value * 100;
  if (Math.abs(scaledValue - Math.round(scaledValue)) > 1e-7) {
    throw new RequestError('creditsUsed must have at most 2 decimal places');
  }
  return value;
}

export async function persistGeneratedBookPair<Generation extends { id: string }, Book extends { id: string }>(
  store: GeneratedBookPairStore<Generation, Book>,
): Promise<GeneratedBookPairResult<Generation, Book>> {
  let generation = await store.findGeneration();
  let generationCreated = false;

  if (!generation) {
    const generationWrite = await store.insertGeneration();
    if (generationWrite.error && !isConflict(generationWrite.error)) {
      throw generationWrite.error;
    }
    generation = generationWrite.data ?? await store.findGeneration();
    generationCreated = Boolean(generationWrite.data);
  }

  if (!generation) throw new Error('Generated ebook could not be persisted');

  let book = await store.findBook();
  if (!book) {
    const bookWrite = await store.insertBook(generation);
    if (bookWrite.error && isConflict(bookWrite.error)) {
      book = await store.findBook();
    } else if (bookWrite.error) {
      if (generationCreated) {
        const cleanupError = await store.deleteGeneration();
        if (cleanupError) console.error('[user-data] generated-book compensation failed');
      }
      throw bookWrite.error;
    } else {
      book = bookWrite.data;
    }
  }

  if (!book) throw new Error('Memory book could not be persisted');
  return { generation, book, created: generationCreated };
}

export function createRecordActivityRpcParameters(
  userId: string,
  activityType: ActivityType,
  contentType: ActivityContentType,
  contentId: string,
  metadata: Record<string, unknown>,
): RecordActivityRpcParameters {
  return {
    p_user_id: userId,
    p_activity_type: activityType,
    p_resource_type: contentType,
    p_resource_id: contentId,
    p_activity_data: metadata,
  };
}

export function requireRecordedActivity(recorded: unknown): RecordedActivityResult {
  if (recorded !== true) {
    throw new RequestError('Activity was not recorded for an owned resource', 404);
  }
  return { recorded: true };
}
