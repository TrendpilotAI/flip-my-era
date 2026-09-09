import type { Json } from '@/integrations/supabase/types';
import { authClient } from '@/lib/auth-client';
import { invokeAuthenticatedFunction, supabase } from './client';

const COMMUNITY_BOOK_SELECT =
  'id, title, subtitle, author_name, cover_image_url, chapter_count, word_count, published_at, created_at, status';

export interface UserProfileRow {
  id: string;
  email: string | null;
  name: string | null;
  username: string | null;
  bio: string | null;
  avatar_url: string | null;
  subscription_status: string | null;
  credits: number | null;
  stories_count: number | null;
  total_likes: number | null;
  created_at: string;
  updated_at: string;
}

export interface UserStoryRow {
  id: string;
  name: string | null;
  title: string | null;
  initial_story: string;
  prompt: string | null;
  birth_date: string | null;
  gender: string | null;
  transformed_name: string | null;
  personality_type: string | null;
  location: string | null;
  status: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface UserEbookGenerationRow {
  id: string;
  story_id: string | null;
  title: string;
  content: Json | string;
  status: string | null;
  credits_used: number | null;
  paid_with_credits: boolean | null;
  transaction_id: string | null;
  story_type: string | null;
  chapter_count: number | null;
  word_count: number | null;
  created_at: string;
  updated_at: string;
}

export interface UserMemoryBookRow {
  id: string;
  original_story_id: string | null;
  ebook_generation_id: string | null;
  title: string;
  description: string | null;
  subtitle: string | null;
  author_name: string | null;
  chapters: Json;
  table_of_contents: Json | null;
  cover_image_url: string | null;
  generation_settings: Json | null;
  style_preferences: Json | null;
  chapter_count: number | null;
  word_count: number | null;
  status: string;
  published_at: string | null;
  generation_completed_at: string | null;
  view_count: number | null;
  download_count: number | null;
  share_count: number | null;
  rating_average: number | null;
  rating_count: number | null;
  created_at: string;
  updated_at: string;
}

export interface CommunityBookRow {
  id: string;
  title: string;
  subtitle: string | null;
  author_name: string | null;
  cover_image_url: string | null;
  chapter_count: number | null;
  word_count: number | null;
  published_at: string;
  created_at: string;
  status: 'published';
}

export interface UpdateProfileInput {
  username?: string | null;
  bio?: string | null;
  name?: string | null;
  avatarUrl?: string | null;
}

export interface SaveStoryInput {
  name: string;
  title?: string | null;
  initialStory: string;
  prompt?: string | null;
  birthDate?: string | null;
  gender?: string | null;
  transformedName?: string | null;
  personalityType?: string | null;
  location?: string | null;
}

export interface ListOwnBooksResult {
  memoryBooks: UserMemoryBookRow[];
  legacyBooks: UserEbookGenerationRow[];
}

export interface RecordActivityInput {
  activityType: 'download' | 'share';
  contentType: 'story' | 'ebook';
  contentId: string;
  metadata?: Json;
}

export interface RecordActivityResult {
  recorded: true;
}

export interface UserDataPayloads {
  'get-profile': Record<string, never>;
  'update-profile': UpdateProfileInput;
  'list-own-stories': { limit?: number };
  'get-own-story': { storyId: string };
  'save-story': SaveStoryInput;
  'list-own-books': { limit?: number };
  'publish-book': { bookId: string; published: boolean };
  'record-activity': RecordActivityInput;
}

export interface UserDataResults {
  'get-profile': UserProfileRow | null;
  'update-profile': UserProfileRow;
  'list-own-stories': UserStoryRow[];
  'get-own-story': UserStoryRow | null;
  'save-story': UserStoryRow;
  'list-own-books': ListOwnBooksResult;
  'publish-book': UserMemoryBookRow;
  'record-activity': RecordActivityResult;
}

export type UserDataAction = keyof UserDataPayloads;

export interface UserDataSuccessEnvelope<T> {
  success: true;
  data: T;
}

export interface UserDataErrorEnvelope {
  success: false;
  error: string;
}

export type UserDataEnvelope<T> = UserDataSuccessEnvelope<T> | UserDataErrorEnvelope;

async function resolveToken(explicitToken?: string | null): Promise<string> {
  if (explicitToken) return explicitToken;

  const { data } = await authClient.getSession();
  const token = data?.session?.token;
  if (!token) throw new Error('Authentication required');
  return token;
}

export async function invokeUserData<Action extends UserDataAction>(
  action: Action,
  payload: UserDataPayloads[Action],
  token?: string | null,
): Promise<UserDataResults[Action]> {
  const bearerToken = await resolveToken(token);
  const { data, error } = await invokeAuthenticatedFunction<UserDataEnvelope<UserDataResults[Action]>>('user-data', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${bearerToken}`,
      'Content-Type': 'application/json',
    },
    body: { action, payload },
  });

  if (error) throw new Error(error.message || 'User data request failed');
  if (!data) throw new Error('User data request failed');
  if (data.success === false) throw new Error(data.error || 'User data request failed');

  return data.data;
}

export function getOwnProfile(token?: string | null): Promise<UserProfileRow | null> {
  return invokeUserData('get-profile', {}, token);
}

export function updateOwnProfile(
  input: UpdateProfileInput,
  token?: string | null,
): Promise<UserProfileRow> {
  return invokeUserData('update-profile', input, token);
}

export function listOwnStories(limit = 100, token?: string | null): Promise<UserStoryRow[]> {
  return invokeUserData('list-own-stories', { limit }, token);
}

export function getOwnStory(storyId: string, token?: string | null): Promise<UserStoryRow | null> {
  return invokeUserData('get-own-story', { storyId }, token);
}

export function saveOwnStory(input: SaveStoryInput, token?: string | null): Promise<UserStoryRow> {
  return invokeUserData('save-story', input, token);
}

export function listOwnBooks(limit = 100, token?: string | null): Promise<ListOwnBooksResult> {
  return invokeUserData('list-own-books', { limit }, token);
}

export function setBookPublished(
  bookId: string,
  published: boolean,
  token?: string | null,
): Promise<UserMemoryBookRow> {
  return invokeUserData('publish-book', { bookId, published }, token);
}

export async function recordUserActivity(
  input: RecordActivityInput,
  token?: string | null,
): Promise<RecordActivityResult> {
  const result = await invokeUserData('record-activity', input, token);
  if (result.recorded !== true) throw new Error('Activity was not recorded');
  return result;
}

export async function listCommunityBooks(limit = 24): Promise<CommunityBookRow[]> {
  const { data, error } = await supabase
    .from('community_books' as never)
    .select(COMMUNITY_BOOK_SELECT)
    .order('published_at', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(Math.min(Math.max(Math.trunc(limit), 1), 100));

  if (error) throw new Error(error.message || 'Community ebooks could not be loaded');
  return (data ?? []) as unknown as CommunityBookRow[];
}

export async function getCommunityBook(bookId: string): Promise<CommunityBookRow | null> {
  const { data, error } = await supabase
    .from('community_books' as never)
    .select(COMMUNITY_BOOK_SELECT)
    .eq('id', bookId)
    .maybeSingle();

  if (error) throw new Error(error.message || 'Community ebook could not be loaded');
  return data as unknown as CommunityBookRow | null;
}
