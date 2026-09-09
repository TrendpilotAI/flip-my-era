import {
  getCorsHeaders,
  initSupabaseClient,
  rejectUntrustedOrigin,
  verifyAuth,
} from '../_shared/utils.ts';

const MAX_REQUEST_BYTES = 10 * 1024 * 1024;
const MAX_LIST_ROWS = 100;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const FORBIDDEN_IDENTITY_KEYS = new Set(['user_id', 'userId', 'owner_id', 'ownerId']);
const MEMORY_BOOK_SELECT =
  'id,user_id,original_story_id,ebook_generation_id,title,description,subtitle,author_name,chapters,table_of_contents,cover_image_url,generation_settings,style_preferences,chapter_count,word_count,status,published_at,generation_completed_at,view_count,download_count,share_count,rating_average,rating_count,created_at,updated_at,version';
const GENERATION_SELECT =
  'id,user_id,story_id,title,content,status,credits_used,paid_with_credits,transaction_id,story_type,chapter_count,word_count,created_at,updated_at';

class RequestError extends Error {
  constructor(message: string, readonly status = 400) {
    super(message);
  }
}

interface GalleryRequest {
  idempotencyKey?: unknown;
  transactionId?: unknown;
  generation?: unknown;
  book?: unknown;
  bookId?: unknown;
  status?: unknown;
  version?: unknown;
}

function jsonResponse(req: Request, body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
  });
}

function asObject(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new RequestError(`${label} must be an object`);
  }
  return value as Record<string, unknown>;
}

function containsIdentityField(value: unknown): boolean {
  if (Array.isArray(value)) return value.some(containsIdentityField);
  if (!value || typeof value !== 'object') return false;
  return Object.entries(value as Record<string, unknown>).some(
    ([key, nested]) => FORBIDDEN_IDENTITY_KEYS.has(key) || containsIdentityField(nested),
  );
}

function requiredString(
  source: Record<string, unknown>,
  key: string,
  maxLength: number,
): string {
  const value = source[key];
  if (typeof value !== 'string' || !value.trim()) {
    throw new RequestError(`${key} is required`);
  }
  const normalized = value.trim();
  if (normalized.length > maxLength) throw new RequestError(`${key} is too long`);
  return normalized;
}

function optionalString(
  source: Record<string, unknown>,
  key: string,
  maxLength: number,
): string | null | undefined {
  if (!(key in source)) return undefined;
  const value = source[key];
  if (value === null) return null;
  if (typeof value !== 'string') throw new RequestError(`${key} must be a string or null`);
  const normalized = value.trim();
  if (normalized.length > maxLength) throw new RequestError(`${key} is too long`);
  return normalized || null;
}

function optionalNonnegativeNumber(
  source: Record<string, unknown>,
  key: string,
): number | null | undefined {
  if (!(key in source)) return undefined;
  const value = source[key];
  if (value === null) return null;
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    throw new RequestError(`${key} must be a non-negative number`);
  }
  return value;
}

function optionalNonnegativeInteger(
  source: Record<string, unknown>,
  key: string,
): number | null | undefined {
  const value = optionalNonnegativeNumber(source, key);
  if (value !== undefined && value !== null && !Number.isSafeInteger(value)) {
    throw new RequestError(`${key} must be a non-negative integer`);
  }
  return value;
}

function optionalBoolean(source: Record<string, unknown>, key: string): boolean | undefined {
  if (!(key in source)) return undefined;
  if (typeof source[key] !== 'boolean') throw new RequestError(`${key} must be a boolean`);
  return source[key] as boolean;
}

function requireUuid(value: unknown, label: string): string {
  if (typeof value !== 'string' || !UUID_PATTERN.test(value)) {
    throw new RequestError(`${label} must be a valid UUID`);
  }
  return value;
}

function optionalUuid(value: unknown, label: string): string | null {
  if (value === undefined || value === null || value === '') return null;
  return requireUuid(value, label);
}

function optionalJson(source: Record<string, unknown>, key: string): unknown | undefined {
  if (!(key in source)) return undefined;
  const value = source[key];
  const serialized = JSON.stringify(value);
  if (serialized && serialized.length > MAX_REQUEST_BYTES) {
    throw new RequestError(`${key} is too large`, 413);
  }
  return value;
}

async function readBody(req: Request): Promise<Record<string, unknown>> {
  const contentLength = Number(req.headers.get('content-length') || 0);
  if (contentLength > MAX_REQUEST_BYTES) throw new RequestError('Request body is too large', 413);
  return asObject(await req.json(), 'request body');
}

async function listOwnerBooks(userId: string) {
  const supabase = initSupabaseClient();
  const [bookResult, generationResult] = await Promise.all([
    supabase
      .from('memory_books')
      .select(MEMORY_BOOK_SELECT)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(MAX_LIST_ROWS),
    supabase
      .from('ebook_generations')
      .select(GENERATION_SELECT)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(MAX_LIST_ROWS),
  ]);

  if (bookResult.error) throw bookResult.error;
  if (generationResult.error) throw generationResult.error;

  const books = bookResult.data ?? [];
  const canonicalGenerationIds = new Set(
    books
      .map((book) => book.ebook_generation_id)
      .filter((id): id is string => typeof id === 'string'),
  );
  const legacyBooks = (generationResult.data ?? []).filter(
    (generation) => !canonicalGenerationIds.has(generation.id),
  );

  // memoryBooks remains during the frontend transition; books is canonical.
  return { books, memoryBooks: books, legacyBooks };
}

async function updatePublishStatus(userId: string, body: Record<string, unknown>) {
  if (containsIdentityField(body)) {
    throw new RequestError('User identity is derived from the authenticated session');
  }

  const bookId = requireUuid(body.bookId, 'bookId');
  if (body.status !== 'published' && body.status !== 'completed') {
    throw new RequestError('status must be published or completed');
  }
  if (!Number.isSafeInteger(body.version) || (body.version as number) < 1) {
    throw new RequestError('version must be a positive integer');
  }

  const version = body.version as number;
  const supabase = initSupabaseClient();
  const { data, error } = await supabase
    .from('memory_books')
    .update({
      status: body.status,
      published_at: body.status === 'published' ? new Date().toISOString() : null,
      version: version + 1,
    })
    .eq('id', bookId)
    .eq('user_id', userId)
    .eq('version', version)
    .select(MEMORY_BOOK_SELECT)
    .maybeSingle();

  if (error) throw error;
  if (data) return { book: data };

  const { data: current, error: currentError } = await supabase
    .from('memory_books')
    .select('id,version')
    .eq('id', bookId)
    .eq('user_id', userId)
    .maybeSingle();
  if (currentError) throw currentError;
  if (!current) throw new RequestError('Book not found', 404);
  throw new RequestError('Book changed elsewhere', 409);
}

function databasePayload(
  generation: Record<string, unknown>,
  book: Record<string, unknown>,
) {
  const title = requiredString(generation, 'title', 255);
  const content = optionalJson(generation, 'content');
  if (content === undefined || content === null) throw new RequestError('content is required');

  const chapters = optionalJson(book, 'chapters');
  if (!Array.isArray(chapters)) throw new RequestError('chapters must be an array');

  return {
    generation: {
      story_id: optionalUuid(generation.storyId, 'storyId'),
      title,
      content,
      credits_used: optionalNonnegativeNumber(generation, 'creditsUsed') ?? 0,
      paid_with_credits: optionalBoolean(generation, 'paidWithCredits') ?? false,
      story_type: optionalString(generation, 'storyType', 255),
      chapter_count: optionalNonnegativeInteger(generation, 'chapterCount'),
      word_count: optionalNonnegativeInteger(generation, 'wordCount'),
    },
    book: {
      original_story_id: optionalUuid(book.originalStoryId, 'originalStoryId'),
      title: optionalString(book, 'title', 255) ?? title,
      description: optionalString(book, 'description', 5_000),
      subtitle: optionalString(book, 'subtitle', 255),
      author_name: optionalString(book, 'authorName', 255),
      chapters,
      table_of_contents: optionalJson(book, 'tableOfContents'),
      cover_image_url: optionalString(book, 'coverImageUrl', 2_048),
      generation_settings: optionalJson(book, 'generationSettings'),
      style_preferences: optionalJson(book, 'stylePreferences'),
      chapter_count: optionalNonnegativeInteger(book, 'chapterCount'),
      word_count: optionalNonnegativeInteger(book, 'wordCount'),
    },
  };
}

async function persistGeneratedBook(userId: string, body: Record<string, unknown>) {
  if (containsIdentityField(body)) {
    throw new RequestError('User identity is derived from the authenticated session');
  }

  const idempotencyKey = requiredString(body, 'idempotencyKey', 200);
  const generation = asObject(body.generation, 'generation');
  const book = asObject(body.book, 'book');
  const transactionId = optionalUuid(
    body.transactionId ?? generation.transactionId,
    'transactionId',
  );
  const payload = databasePayload(generation, book);
  const supabase = initSupabaseClient();

  if (transactionId) {
    const { data: transaction, error } = await supabase
      .from('credit_transactions')
      .select('id,user_id,amount')
      .eq('id', transactionId)
      .maybeSingle();
    if (error) throw error;
    if (!transaction || transaction.user_id !== userId) {
      throw new RequestError('Credit transaction does not belong to caller', 403);
    }
  }

  const { data, error } = await supabase
    .rpc('persist_betterauth_generated_book', {
      p_user_id: userId,
      p_transaction_id: transactionId,
      p_idempotency_key: idempotencyKey,
      p_generation: payload.generation,
      p_book: payload.book,
    })
    .single();

  if (error) {
    if (error.code === '23505') throw new RequestError('Gallery content conflicts with an existing record', 409);
    if (error.code === '42501') throw new RequestError('Gallery request is not authorized', 403);
    if (error.code === '23503') throw new RequestError('A referenced gallery record was not found', 404);
    if (error.code === '22023' || error.code === '22P02') {
      throw new RequestError('Gallery request is invalid');
    }
    throw error;
  }
  if (!data) throw new Error('Gallery persistence returned no result');
  return data;
}

export async function handleGalleryBooksRequest(req: Request): Promise<Response> {
  const rejectedOrigin = rejectUntrustedOrigin(req);
  if (rejectedOrigin) return rejectedOrigin;
  if (req.method === 'OPTIONS') return new Response('ok', { headers: getCorsHeaders(req) });

  const userId = await verifyAuth(req);
  if (!userId) return jsonResponse(req, { error: 'Unauthorized' }, 401);

  try {
    if (req.method === 'GET') {
      return jsonResponse(req, await listOwnerBooks(userId));
    }
    if (req.method === 'PATCH') {
      return jsonResponse(req, await updatePublishStatus(userId, await readBody(req)));
    }
    if (req.method === 'POST') {
      return jsonResponse(req, await persistGeneratedBook(userId, await readBody(req)));
    }
    return jsonResponse(req, { error: 'Method not allowed' }, 405);
  } catch (error) {
    const requestError = error instanceof RequestError ? error : null;
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[gallery-books] request failed:', message);
    return jsonResponse(
      req,
      { error: requestError?.message ?? 'Gallery request failed' },
      requestError?.status ?? 500,
    );
  }
}

Deno.serve(handleGalleryBooksRequest);
