import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { render, screen, waitFor } from '@/test/test-utils';
import { Gallery } from './Gallery';

const authState = vi.hoisted(() => ({ isSignedIn: true }));
const edgeTransport = vi.hoisted(() => ({ invokeAuthenticatedFunction: vi.fn() }));
const publicCommunityTransport = vi.hoisted(() => ({ from: vi.fn() }));
const legacyBoundary = vi.hoisted(() => ({
  called: vi.fn((name: string) => {
    throw new Error(`Forbidden legacy Gallery boundary called: ${name}`);
  }),
}));

vi.mock('@/core/integrations/better-auth/AuthProvider', () => ({
  useSupabaseAuth: () => ({ isSignedIn: authState.isSignedIn }),
}));

vi.mock('@/core/integrations/supabase/client', () => ({
  supabase: { from: publicCommunityTransport.from },
  invokeAuthenticatedFunction: edgeTransport.invokeAuthenticatedFunction,
}));

// This module must never become a disguised Gallery persistence boundary again.
vi.mock('@/core/integrations/supabase/userData', () => ({
  listCommunityBooks: () => legacyBoundary.called('listCommunityBooks'),
  listOwnBooks: () => legacyBoundary.called('listOwnBooks'),
  setBookPublished: () => legacyBoundary.called('setBookPublished'),
}));

const communityBook = {
  id: 'community-1',
  title: 'Midnight Memory',
  subtitle: null,
  author_name: 'Swiftie Writer',
  cover_image_url: 'https://example.com/cover.jpg',
  chapter_count: 5,
  word_count: 4200,
  created_at: '2026-01-01T00:00:00Z',
  published_at: '2026-01-02T00:00:00Z',
  status: 'published' as const,
};

const strangerPublishedBook = {
  ...communityBook,
  id: 'community-stranger-1',
  title: 'A Stranger Published Era',
  author_name: 'Someone Else',
};

const privateMemoryBook = {
  id: '11111111-1111-4111-8111-111111111111',
  original_story_id: null,
  ebook_generation_id: '22222222-2222-4222-8222-222222222222',
  title: 'My Private Era',
  description: null,
  subtitle: null,
  author_name: null,
  cover_image_url: null,
  chapters: [{ title: 'Chapter 1', content: 'One two three four' }],
  table_of_contents: null,
  generation_settings: { selectedTheme: 'first-love' },
  style_preferences: null,
  chapter_count: 1,
  word_count: 4,
  status: 'completed',
  published_at: null,
  generation_completed_at: '2026-01-03T00:00:00Z',
  view_count: 0,
  download_count: 0,
  share_count: 0,
  rating_average: 0,
  rating_count: 0,
  created_at: '2026-01-03T00:00:00Z',
  updated_at: '2026-01-03T00:00:00Z',
  version: 7,
};

const publishedMemoryBook = {
  ...privateMemoryBook,
  id: '44444444-4444-4444-8444-444444444444',
  ebook_generation_id: '55555555-5555-4555-8555-555555555555',
  title: 'My Published Era',
  status: 'published',
  published_at: '2026-01-04T00:00:00Z',
  version: 8,
};

const legacyBook = {
  id: '33333333-3333-4333-8333-333333333333',
  story_id: null,
  title: 'Older Generated Era',
  content: JSON.stringify([{ title: 'Chapter 1', content: 'One two three four' }]),
  status: 'completed',
  credits_used: 1,
  paid_with_credits: true,
  transaction_id: null,
  story_type: 'taylor-swift-first-love-short-story',
  chapter_count: 1,
  word_count: 4,
  created_at: '2026-01-02T00:00:00Z',
  updated_at: '2026-01-02T00:00:00Z',
};

interface GalleryTransportOptions {
  communityBooks?: unknown[];
  memoryBooks?: unknown[];
  legacyBooks?: unknown[];
  stalePatch?: boolean;
}

function configureGalleryTransport({
  communityBooks = [communityBook],
  memoryBooks = [privateMemoryBook],
  legacyBooks = [],
  stalePatch = false,
}: GalleryTransportOptions = {}) {
  let currentCommunityBooks = communityBooks;
  let currentMemoryBooks = memoryBooks;

  publicCommunityTransport.from.mockImplementation((table: string) => {
    if (table !== 'community_books') throw new Error(`Unexpected public table: ${table}`);
    const query = {
      order: vi.fn(() => query),
      limit: vi.fn(async () => ({ data: currentCommunityBooks, error: null })),
    };
    return { select: vi.fn(() => query) };
  });

  edgeTransport.invokeAuthenticatedFunction.mockImplementation(
    async (functionName: string, options?: { method?: string; body?: Record<string, unknown> }) => {
      if (functionName !== 'gallery-books') {
        return { data: null, error: new Error(`Unexpected function ${functionName}`) };
      }

      if (options?.method === 'GET') {
        const canonicalGenerationIds = new Set(
          currentMemoryBooks.map((book) => (book as { ebook_generation_id?: string | null }).ebook_generation_id),
        );
        return {
          data: {
            memoryBooks: currentMemoryBooks,
            legacyBooks: legacyBooks.filter(
              (book) => !canonicalGenerationIds.has((book as { id?: string }).id),
            ),
          },
          error: null,
        };
      }

      if (options?.method === 'PATCH') {
        if (stalePatch) {
          return { data: null, error: Object.assign(new Error('Book changed elsewhere'), { status: 409 }) };
        }

        const { bookId, status, version } = options.body ?? {};
        const existingBook = currentMemoryBooks.find(
          (book) => (book as { id?: string }).id === bookId,
        ) as typeof privateMemoryBook | undefined;
        if (!existingBook || version !== existingBook.version) {
          return { data: null, error: Object.assign(new Error('Book changed elsewhere'), { status: 409 }) };
        }

        const updatedBook = {
          ...existingBook,
          status,
          published_at: status === 'published' ? publishedMemoryBook.published_at : null,
          version: existingBook.version + 1,
        };
        currentMemoryBooks = currentMemoryBooks.map((book) => (
          (book as { id?: string }).id === updatedBook.id ? updatedBook : book
        ));
        currentCommunityBooks = status === 'published'
          ? [...currentCommunityBooks, { ...updatedBook, author_name: 'You' }]
          : currentCommunityBooks.filter((book) => (book as { id?: string }).id !== updatedBook.id);
        return { data: updatedBook, error: null };
      }

      return { data: null, error: new Error(`Unexpected gallery-books method ${options?.method}`) };
    },
  );
}

async function expectNoLegacyBoundaryCalls() {
  await waitFor(() => expect(legacyBoundary.called).not.toHaveBeenCalled());
}

describe('Gallery', () => {
  beforeEach(() => {
    authState.isSignedIn = true;
    edgeTransport.invokeAuthenticatedFunction.mockReset();
    publicCommunityTransport.from.mockReset();
    legacyBoundary.called.mockReset();
    configureGalleryTransport();
  });

  it('keeps Community on the fixed public community_books projection and leaves its cards read-only', async () => {
    configureGalleryTransport({ communityBooks: [communityBook, strangerPublishedBook] });
    render(<Gallery />);

    await expectNoLegacyBoundaryCalls();
    expect(await screen.findByRole('tab', { name: 'Community (2)' })).toBeInTheDocument();
    expect(screen.getByText('Midnight Memory')).toBeInTheDocument();
    expect(screen.getByText('A Stranger Published Era')).toBeInTheDocument();
    expect(screen.getByText(/by Someone Else/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /publish/i })).not.toBeInTheDocument();
    expect(publicCommunityTransport.from).toHaveBeenCalledWith('community_books');
    expect(legacyBoundary.called).not.toHaveBeenCalled();
  });

  it('loads only the server-authorized owner library, preserves server publish fields, and de-duplicates legacy fallback', async () => {
    const user = userEvent.setup();
    configureGalleryTransport({
      communityBooks: [communityBook, strangerPublishedBook],
      memoryBooks: [privateMemoryBook, publishedMemoryBook],
      legacyBooks: [
        { ...legacyBook, id: privateMemoryBook.ebook_generation_id, title: 'Duplicate Legacy Copy' },
        legacyBook,
      ],
    });
    render(<Gallery />);
    await expectNoLegacyBoundaryCalls();
    await user.click(await screen.findByRole('tab', { name: 'My eBooks (3)' }));

    expect(await screen.findByText('My Private Era')).toBeInTheDocument();
    expect(screen.getByText('My Published Era')).toBeInTheDocument();
    expect(screen.getByText('Older Generated Era')).toBeInTheDocument();
    expect(screen.queryByText('Duplicate Legacy Copy')).not.toBeInTheDocument();
    expect(screen.queryByText('A Stranger Published Era')).not.toBeInTheDocument();
    expect(screen.getByText('Private')).toBeInTheDocument();
    expect(screen.getByText('Published')).toBeInTheDocument();
    expect(screen.getByText('Generated')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Publish' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Unpublish' })).toBeInTheDocument();
    expect(edgeTransport.invokeAuthenticatedFunction).toHaveBeenCalledWith('gallery-books', { method: 'GET' });
    expect(legacyBoundary.called).not.toHaveBeenCalled();
  });

  it('publishes with the authoritative version and server-owned published_at state', async () => {
    const user = userEvent.setup();
    configureGalleryTransport({ communityBooks: [], memoryBooks: [privateMemoryBook] });
    render(<Gallery />);
    await expectNoLegacyBoundaryCalls();
    await user.click(await screen.findByRole('tab', { name: 'My eBooks (1)' }));
    await user.click(await screen.findByRole('button', { name: 'Publish' }));

    expect(await screen.findByRole('button', { name: 'Unpublish' })).toBeInTheDocument();
    expect(edgeTransport.invokeAuthenticatedFunction).toHaveBeenCalledWith('gallery-books', {
      method: 'PATCH',
      body: { bookId: privateMemoryBook.id, status: 'published', version: privateMemoryBook.version },
    });
    await user.click(screen.getByRole('tab', { name: /Community/ }));
    expect(await screen.findByText('My Private Era')).toBeInTheDocument();
  });

  it('unpublishes with the authoritative version and removes the server-unpublished book from Community', async () => {
    const user = userEvent.setup();
    configureGalleryTransport({
      communityBooks: [{ ...publishedMemoryBook, author_name: 'You' }],
      memoryBooks: [publishedMemoryBook],
    });
    render(<Gallery />);
    await expectNoLegacyBoundaryCalls();
    await user.click(await screen.findByRole('tab', { name: 'My eBooks (1)' }));
    await user.click(await screen.findByRole('button', { name: 'Unpublish' }));

    expect(await screen.findByRole('button', { name: 'Publish' })).toBeInTheDocument();
    expect(edgeTransport.invokeAuthenticatedFunction).toHaveBeenCalledWith('gallery-books', {
      method: 'PATCH',
      body: { bookId: publishedMemoryBook.id, status: 'completed', version: publishedMemoryBook.version },
    });
    await user.click(screen.getByRole('tab', { name: /Community/ }));
    await waitFor(() => expect(screen.queryByText('My Published Era')).not.toBeInTheDocument());
  });

  it('refreshes authoritative owner state after a 409 instead of treating a stale publish as successful', async () => {
    const user = userEvent.setup();
    configureGalleryTransport({ communityBooks: [], memoryBooks: [privateMemoryBook], stalePatch: true });
    render(<Gallery />);
    await expectNoLegacyBoundaryCalls();
    await user.click(await screen.findByRole('tab', { name: 'My eBooks (1)' }));
    await user.click(await screen.findByRole('button', { name: 'Publish' }));

    await waitFor(() => {
      expect(edgeTransport.invokeAuthenticatedFunction).toHaveBeenNthCalledWith(3, 'gallery-books', { method: 'GET' });
    });
    expect(screen.getByText('Private')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Unpublish' })).not.toBeInTheDocument();
  });

  it('does not request the private library while signed out', async () => {
    const user = userEvent.setup();
    authState.isSignedIn = false;
    render(<Gallery />);
    await expectNoLegacyBoundaryCalls();
    await user.click(await screen.findByRole('tab', { name: 'My eBooks (0)' }));

    expect(screen.getByText('Sign in to view your ebooks')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Sign In' })).toHaveAttribute('href', '/auth');
    expect(edgeTransport.invokeAuthenticatedFunction).not.toHaveBeenCalledWith('gallery-books', { method: 'GET' });
  });

  it('rejects legacy private transports and browser PostgREST from the Gallery source', () => {
    const source = readFileSync(resolve(process.cwd(), 'src/app/pages/Gallery.tsx'), 'utf8');
    expect(source).toContain("from('community_books'");
    expect(source).toContain("'gallery-books'");
    expect(source).toContain('invokeAuthenticatedFunction');
    expect(source).not.toContain('integrations/supabase/userData');
    expect(source).not.toMatch(/\.from\(\s*['"](?:memory_books|ebook_generations)['"]\s*\)/);
    expect(source).not.toMatch(/listOwnBooks|setBookPublished|listCommunityBooks/);
  });
});
