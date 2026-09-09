import { getCorsHeaders, handleCors, initSupabaseClient, verifyAuth } from '../_shared/utils.ts';
import {
  createRecordActivityRpcParameters,
  RECORD_ACTIVITY_RPC,
  RequestError,
  requireRecordedActivity,
} from './contracts.ts';

const PROFILE_SELECT =
  'id, email, name, username, bio, avatar_url, subscription_status, credits, stories_count, total_likes, created_at, updated_at';
const STORY_SELECT =
  'id, name, title, initial_story, prompt, birth_date, gender, transformed_name, personality_type, location, status, created_at, updated_at';
const GENERATION_SELECT =
  'id, story_id, title, content, status, credits_used, paid_with_credits, transaction_id, story_type, chapter_count, word_count, created_at, updated_at';
const MEMORY_BOOK_SELECT =
  'id, original_story_id, ebook_generation_id, title, description, subtitle, author_name, chapters, table_of_contents, cover_image_url, generation_settings, style_preferences, chapter_count, word_count, status, published_at, generation_completed_at, view_count, download_count, share_count, rating_average, rating_count, created_at, updated_at';

const MAX_REQUEST_BYTES = 10 * 1024 * 1024;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const FORBIDDEN_IDENTITY_KEYS = new Set(['user_id', 'userId', 'owner_id', 'ownerId']);

type SupabaseClient = ReturnType<typeof initSupabaseClient>;

interface ActionRequest {
  action?: unknown;
  payload?: unknown;
}

interface UserDataSuccessResponse<T> {
  success: true;
  data: T;
}

interface UserDataErrorResponse {
  success: false;
  error: string;
}

type UserDataResponse<T> = UserDataSuccessResponse<T> | UserDataErrorResponse;

function jsonResponse<T>(req: Request, body: UserDataResponse<T>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
  });
}

function asObject(value: unknown, label = 'payload'): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new RequestError(`${label} must be an object`);
  }
  return value as Record<string, unknown>;
}

function containsIdentityField(value: unknown): boolean {
  if (Array.isArray(value)) return value.some(containsIdentityField);
  if (!value || typeof value !== 'object') return false;

  return Object.entries(value as Record<string, unknown>).some(
    ([key, nestedValue]) => FORBIDDEN_IDENTITY_KEYS.has(key) || containsIdentityField(nestedValue),
  );
}

function requiredString(
  source: Record<string, unknown>,
  key: string,
  maxLength: number,
  preserveWhitespace = false,
): string {
  const value = source[key];
  if (typeof value !== 'string') throw new RequestError(`${key} is required`);
  const normalized = preserveWhitespace ? value : value.trim();
  if (!normalized.trim()) throw new RequestError(`${key} is required`);
  if (normalized.length > maxLength) throw new RequestError(`${key} is too long`);
  return normalized;
}

function optionalString(
  source: Record<string, unknown>,
  key: string,
  maxLength: number,
  preserveWhitespace = false,
): string | null | undefined {
  if (!(key in source)) return undefined;
  const value = source[key];
  if (value === null) return null;
  if (typeof value !== 'string') throw new RequestError(`${key} must be a string or null`);
  const normalized = preserveWhitespace ? value : value.trim();
  if (normalized.length > maxLength) throw new RequestError(`${key} is too long`);
  return normalized.trim() ? normalized : null;
}

function optionalInteger(
  source: Record<string, unknown>,
  key: string,
  max = Number.MAX_SAFE_INTEGER,
): number | null | undefined {
  if (!(key in source)) return undefined;
  const value = source[key];
  if (value === null) return null;
  if (!Number.isInteger(value) || (value as number) < 0 || (value as number) > max) {
    throw new RequestError(`${key} must be a non-negative integer`);
  }
  return value as number;
}

function requireUuid(value: unknown, label: string): string {
  if (typeof value !== 'string' || !UUID_PATTERN.test(value)) {
    throw new RequestError(`${label} must be a valid UUID`);
  }
  return value;
}

function optionalDate(source: Record<string, unknown>, key: string): string | null | undefined {
  const value = optionalString(source, key, 64);
  if (value === undefined || value === null) return value;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new RequestError(`${key} must be a valid date`);
  return date.toISOString().slice(0, 10);
}

function clampLimit(value: unknown): number {
  if (value === undefined) return 100;
  if (!Number.isInteger(value)) throw new RequestError('limit must be an integer');
  return Math.min(Math.max(value as number, 1), 100);
}

async function getProfile(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select(PROFILE_SELECT)
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function updateProfile(
  supabase: SupabaseClient,
  userId: string,
  payload: Record<string, unknown>,
) {
  const patch: Record<string, unknown> = {};
  const username = optionalString(payload, 'username', 50);
  const bio = optionalString(payload, 'bio', 500, true);
  const name = optionalString(payload, 'name', 120);
  const avatarUrl = optionalString(payload, 'avatarUrl', 2048);

  if (username !== undefined) patch.username = username;
  if (bio !== undefined) patch.bio = bio;
  if (name !== undefined) patch.name = name;
  if (avatarUrl !== undefined) {
    if (avatarUrl) {
      let parsed: URL;
      try {
        parsed = new URL(avatarUrl);
      } catch {
        throw new RequestError('avatarUrl must be a valid URL');
      }
      if (parsed.protocol !== 'https:') throw new RequestError('avatarUrl must use HTTPS');
    }
    patch.avatar_url = avatarUrl;
  }

  if (Object.keys(patch).length === 0) throw new RequestError('No editable profile fields provided');
  patch.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('profiles')
    .update(patch)
    .eq('id', userId)
    .select(PROFILE_SELECT)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new RequestError('Profile not found', 404);
  return data;
}

async function listStories(supabase: SupabaseClient, userId: string, payload: Record<string, unknown>) {
  const { data, error } = await supabase
    .from('stories')
    .select(STORY_SELECT)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(clampLimit(payload.limit));
  if (error) throw error;
  return data ?? [];
}

async function getStory(supabase: SupabaseClient, userId: string, payload: Record<string, unknown>) {
  const storyId = requireUuid(payload.storyId, 'storyId');
  const { data, error } = await supabase
    .from('stories')
    .select(STORY_SELECT)
    .eq('id', storyId)
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function saveStory(supabase: SupabaseClient, userId: string, payload: Record<string, unknown>) {
  const row: Record<string, unknown> = {
    user_id: userId,
    name: requiredString(payload, 'name', 120),
    initial_story: requiredString(payload, 'initialStory', 2_000_000, true),
    status: 'completed',
    generation_completed_at: new Date().toISOString(),
  };

  const fields: Array<[string, string, number, boolean?]> = [
    ['title', 'title', 255],
    ['prompt', 'prompt', 50_000, true],
    ['gender', 'gender', 50],
    ['transformedName', 'transformed_name', 120],
    ['personalityType', 'personality_type', 100],
    ['location', 'location', 255],
  ];
  for (const [inputKey, column, maxLength, preserveWhitespace] of fields) {
    const value = optionalString(payload, inputKey, maxLength, preserveWhitespace);
    if (value !== undefined) row[column] = value;
  }
  const birthDate = optionalDate(payload, 'birthDate');
  if (birthDate !== undefined) row.birth_date = birthDate;

  const { data, error } = await supabase
    .from('stories')
    .insert(row)
    .select(STORY_SELECT)
    .single();
  if (error) throw error;
  return data;
}

async function listBooks(supabase: SupabaseClient, userId: string, payload: Record<string, unknown>) {
  const limit = clampLimit(payload.limit);
  const [memoryResult, generationResult] = await Promise.all([
    supabase
      .from('memory_books')
      .select(MEMORY_BOOK_SELECT)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit),
    supabase
      .from('ebook_generations')
      .select(GENERATION_SELECT)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit),
  ]);

  if (memoryResult.error) throw memoryResult.error;
  if (generationResult.error) throw generationResult.error;

  const memoryBooks = memoryResult.data ?? [];
  const canonicalGenerationIds = new Set(
    memoryBooks
      .map((book) => book.ebook_generation_id)
      .filter((id): id is string => typeof id === 'string'),
  );

  return {
    memoryBooks,
    legacyBooks: (generationResult.data ?? []).filter(
      (generation) => !canonicalGenerationIds.has(generation.id),
    ),
  };
}

async function publishBook(supabase: SupabaseClient, userId: string, payload: Record<string, unknown>) {
  const bookId = requireUuid(payload.bookId, 'bookId');
  if (typeof payload.published !== 'boolean') throw new RequestError('published must be a boolean');

  const published = payload.published;
  const { data, error } = await supabase
    .from('memory_books')
    .update({
      status: published ? 'published' : 'completed',
      published_at: published ? new Date().toISOString() : null,
    })
    .eq('id', bookId)
    .eq('user_id', userId)
    .select(MEMORY_BOOK_SELECT)
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new RequestError('Book not found', 404);
  return data;
}

async function recordActivity(
  supabase: SupabaseClient,
  userId: string,
  payload: Record<string, unknown>,
) {
  const activityType = requiredString(payload, 'activityType', 20);
  const contentType = requiredString(payload, 'contentType', 20);
  const contentId = requireUuid(payload.contentId, 'contentId');

  if (activityType !== 'download' && activityType !== 'share') {
    throw new RequestError('activityType must be download or share');
  }
  if (contentType !== 'story' && contentType !== 'ebook') {
    throw new RequestError('contentType must be story or ebook');
  }

  const metadataValue = payload.metadata === undefined ? {} : asObject(payload.metadata, 'metadata');
  const serializedMetadata = JSON.stringify(metadataValue);
  if (serializedMetadata.length > 64_000) throw new RequestError('metadata is too large');

  const rpcParameters = createRecordActivityRpcParameters(
    userId,
    activityType,
    contentType,
    contentId,
    metadataValue,
  );
  const { data, error } = await supabase.rpc(RECORD_ACTIVITY_RPC, rpcParameters);

  if (error) throw error;
  return requireRecordedActivity(data);
}

async function performAction(
  supabase: SupabaseClient,
  userId: string,
  action: string,
  payload: Record<string, unknown>,
) {
  switch (action) {
    case 'get-profile':
      return getProfile(supabase, userId);
    case 'update-profile':
      return updateProfile(supabase, userId, payload);
    case 'list-own-stories':
      return listStories(supabase, userId, payload);
    case 'get-own-story':
      return getStory(supabase, userId, payload);
    case 'save-story':
      return saveStory(supabase, userId, payload);
    case 'list-own-books':
      return listBooks(supabase, userId, payload);
    case 'publish-book':
      return publishBook(supabase, userId, payload);
    case 'record-activity':
      return recordActivity(supabase, userId, payload);
    default:
      throw new RequestError('Unsupported action');
  }
}

export async function handleUserDataRequest(req: Request): Promise<Response> {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const userId = await verifyAuth(req);
  if (!userId) return jsonResponse(req, { success: false, error: 'Unauthorized' }, 401);
  if (req.method !== 'POST') {
    return jsonResponse(req, { success: false, error: 'Method not allowed' }, 405);
  }

  try {
    const contentLength = Number(req.headers.get('content-length') || 0);
    if (contentLength > MAX_REQUEST_BYTES) throw new RequestError('Request body is too large', 413);

    const body = (await req.json()) as ActionRequest;
    if (typeof body.action !== 'string') throw new RequestError('action is required');
    const payload = body.payload === undefined ? {} : asObject(body.payload);
    if (containsIdentityField(payload)) {
      throw new RequestError('User identity is derived from the authenticated session');
    }

    const data = await performAction(initSupabaseClient(), userId, body.action, payload);
    return jsonResponse(req, { success: true, data });
  } catch (error) {
    const requestError = error instanceof RequestError ? error : null;
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[user-data] request failed:', message);
    return jsonResponse(
      req,
      {
        success: false,
        error: requestError ? requestError.message : 'User data request failed',
      },
      requestError?.status ?? 500,
    );
  }
}

Deno.serve(handleUserDataRequest);
