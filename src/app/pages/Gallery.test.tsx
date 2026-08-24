import { describe, it, expect, beforeEach, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { render, screen, waitFor } from '@/test/test-utils';
import { __testSupabaseMocks__ } from '@/test/setup';
import { Gallery } from './Gallery';

const authState = vi.hoisted(() => ({
  isSignedIn: true,
  user: { id: 'user-1' },
}));

vi.mock('@/core/integrations/better-auth/AuthProvider', () => ({
  useSupabaseAuth: () => ({
    isSignedIn: authState.isSignedIn,
    user: authState.user,
  }),
}));

interface TableQueryMock {
  select: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  order: ReturnType<typeof vi.fn>;
  limit: ReturnType<typeof vi.fn>;
  single: ReturnType<typeof vi.fn>;
}

function createTableQueryMock(data: unknown[], error: unknown = null, singleData: unknown = null): TableQueryMock {
  const query = {} as TableQueryMock;
  query.select = vi.fn(() => query);
  query.update = vi.fn(() => query);
  query.eq = vi.fn(() => query);
  query.order = vi.fn(() => query);
  query.limit = vi.fn(async () => ({ data, error }));
  query.single = vi.fn(async () => ({ data: singleData, error }));
  return query;
}

const communityBook = {
  id: 'community-1',
  title: 'Midnight Memory',
  subtitle: null,
  author_name: 'Swiftie Writer',
  cover_image_url: 'https://example.com/cover.jpg',
  generation_settings: { selectedTheme: 'coming-of-age' },
  style_preferences: null,
  chapter_count: 5,
  word_count: 4200,
  created_at: '2026-01-01T00:00:00Z',
  published_at: '2026-01-02T00:00:00Z',
  status: 'published',
  ebook_generation_id: 'generation-community-1',
  chapters: [{ title: 'Chapter 1', content: 'One two three four five' }],
};

const privateMemoryBook = {
  id: 'memory-1',
  title: 'My Private Era',
  subtitle: null,
  author_name: null,
  cover_image_url: null,
  generation_settings: { selectedTheme: 'first-love' },
  style_preferences: null,
  chapter_count: 1,
  word_count: 4,
  created_at: '2026-01-03T00:00:00Z',
  published_at: null,
  status: 'completed',
  ebook_generation_id: 'mine-1',
  chapters: [{ title: 'Chapter 1', content: 'One two three four' }],
};

const publishedMemoryBook = {
  ...privateMemoryBook,
  id: 'memory-2',
  title: 'My Published Era',
  status: 'published',
  published_at: '2026-01-04T00:00:00Z',
  ebook_generation_id: 'mine-2',
};

const userBook = {
  id: 'mine-1',
  title: 'My Generated Era',
  content: JSON.stringify([{ title: 'Chapter 1', content: 'One two three four' }]),
  story_type: 'taylor-swift-first-love-short-story',
  chapter_count: 1,
  word_count: 4,
  created_at: '2026-01-03T00:00:00Z',
};

function mockGalleryQueries({
  community = [communityBook],
  memoryBooks = [privateMemoryBook],
  legacyBooks = [userBook],
  communityError = null,
  memoryBooksError = null,
  legacyBooksError = null,
  publishResponse = publishedMemoryBook,
}: {
  community?: unknown[];
  memoryBooks?: unknown[];
  legacyBooks?: unknown[];
  communityError?: unknown;
  memoryBooksError?: unknown;
  legacyBooksError?: unknown;
  publishResponse?: unknown;
} = {}) {
  const communityQuery = createTableQueryMock(community, communityError);
  const myMemoryBooksQuery = createTableQueryMock(memoryBooks, memoryBooksError, publishResponse);
  const publishQuery = createTableQueryMock([], null, publishResponse);
  const refreshCommunityQuery = createTableQueryMock(community, communityError);
  const legacyBooksQuery = createTableQueryMock(legacyBooks, legacyBooksError);
  const memoryBooksQueries = [communityQuery, myMemoryBooksQuery, publishQuery, refreshCommunityQuery];

  __testSupabaseMocks__.supabaseFromMock.mockImplementation((table: string) => {
    if (table === 'memory_books') return memoryBooksQueries.shift() ?? communityQuery;
    if (table === 'ebook_generations') return legacyBooksQuery;
    return createTableQueryMock([]);
  });

  return { communityQuery, myMemoryBooksQuery, legacyBooksQuery, publishQuery, refreshCommunityQuery };
}

describe('Gallery', () => {
  beforeEach(() => {
    authState.isSignedIn = true;
    authState.user = { id: 'user-1' };
    mockGalleryQueries();
  });

  it('renders Community and My eBooks tab triggers with loaded counts', async () => {
    render(<Gallery />);

    expect(await screen.findByRole('tab', { name: 'Community (1)' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'My eBooks (1)' })).toBeInTheDocument();
  });

  it('loads published memory_books into Community', async () => {
    const { communityQuery } = mockGalleryQueries();

    render(<Gallery />);

    expect(await screen.findByText('Midnight Memory')).toBeInTheDocument();
    expect(screen.getByText(/by Swiftie Writer/)).toBeInTheDocument();
    expect(screen.getByText('5 chapters')).toBeInTheDocument();
    expect(communityQuery.eq).toHaveBeenCalledWith('status', 'published');
    expect(communityQuery.order).toHaveBeenCalledWith('published_at', { ascending: false });
    expect(communityQuery.order).toHaveBeenCalledWith('created_at', { ascending: false });
    expect(communityQuery.limit).toHaveBeenCalledWith(24);
  });

  it('loads authenticated memory_books into My eBooks with private and published states', async () => {
    const user = userEvent.setup();
    const { myMemoryBooksQuery, legacyBooksQuery } = mockGalleryQueries({
      memoryBooks: [privateMemoryBook, publishedMemoryBook],
      legacyBooks: [userBook],
    });

    render(<Gallery />);

    await user.click(await screen.findByRole('tab', { name: 'My eBooks (2)' }));

    expect(await screen.findByText('My Private Era')).toBeInTheDocument();
    expect(screen.getByText('My Published Era')).toBeInTheDocument();
    expect(screen.getAllByText(/by You/)).toHaveLength(2);
    expect(screen.getAllByText('First Love').length).toBeGreaterThan(0);
    expect(screen.getByText('Private')).toBeInTheDocument();
    expect(screen.getByText('Published')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Publish' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Unpublish' })).toBeInTheDocument();
    expect(myMemoryBooksQuery.eq).toHaveBeenCalledWith('user_id', 'user-1');
    expect(myMemoryBooksQuery.order).toHaveBeenCalledWith('created_at', { ascending: false });
    expect(myMemoryBooksQuery.limit).toHaveBeenCalledWith(24);
    expect(legacyBooksQuery.eq).toHaveBeenCalledWith('user_id', 'user-1');
    expect(legacyBooksQuery.order).toHaveBeenCalledWith('created_at', { ascending: false });
  });

  it('renders legacy ebook_generations only when no matching memory_books row exists', async () => {
    const user = userEvent.setup();
    mockGalleryQueries({
      memoryBooks: [privateMemoryBook],
      legacyBooks: [
        userBook,
        { ...userBook, id: 'legacy-only', title: 'Older Generated Era' },
      ],
    });

    render(<Gallery />);

    await user.click(await screen.findByRole('tab', { name: 'My eBooks (2)' }));

    expect(await screen.findByText('My Private Era')).toBeInTheDocument();
    expect(screen.queryByText('My Generated Era')).not.toBeInTheDocument();
    expect(screen.getByText('Older Generated Era')).toBeInTheDocument();
    expect(screen.getByText('Generated')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Publish' })).toHaveLength(1);
  });

  it('publishes a private memory_book and refreshes Community', async () => {
    const user = userEvent.setup();
    const { publishQuery } = mockGalleryQueries({
      community: [],
      memoryBooks: [privateMemoryBook],
      legacyBooks: [],
      publishResponse: publishedMemoryBook,
    });

    render(<Gallery />);

    await user.click(await screen.findByRole('tab', { name: 'My eBooks (1)' }));
    await user.click(await screen.findByRole('button', { name: 'Publish' }));

    await waitFor(() => {
      expect(publishQuery.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'published',
          published_at: expect.any(String),
        }),
      );
    });
    expect(publishQuery.eq).toHaveBeenCalledWith('id', privateMemoryBook.id);
    expect(await screen.findByRole('button', { name: 'Unpublish' })).toBeInTheDocument();
  });

  it('unpublishes a published memory_book and refreshes Community', async () => {
    const user = userEvent.setup();
    const unpublishedBook = { ...publishedMemoryBook, status: 'completed', published_at: null };
    const { publishQuery } = mockGalleryQueries({
      memoryBooks: [publishedMemoryBook],
      legacyBooks: [],
      publishResponse: unpublishedBook,
    });

    render(<Gallery />);

    await user.click(await screen.findByRole('tab', { name: 'My eBooks (1)' }));
    await user.click(await screen.findByRole('button', { name: 'Unpublish' }));

    await waitFor(() => {
      expect(publishQuery.update).toHaveBeenCalledWith({
        status: 'completed',
        published_at: null,
      });
    });
    expect(await screen.findByRole('button', { name: 'Publish' })).toBeInTheDocument();
  });

  it('shows sign-in CTA in My eBooks when signed out', async () => {
    const user = userEvent.setup();
    authState.isSignedIn = false;
    const { myMemoryBooksQuery, legacyBooksQuery } = mockGalleryQueries();

    render(<Gallery />);

    await user.click(await screen.findByRole('tab', { name: 'My eBooks (0)' }));

    expect(screen.getByText('Sign in to view your ebooks')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Sign In' })).toHaveAttribute('href', '/auth');
    expect(myMemoryBooksQuery.select).not.toHaveBeenCalled();
    expect(legacyBooksQuery.select).not.toHaveBeenCalled();
  });

  it('search filters the active tab results', async () => {
    const user = userEvent.setup();
    mockGalleryQueries({
      community: [
        communityBook,
        { ...communityBook, id: 'community-2', title: 'Folklore Letters', author_name: 'Betty' },
      ],
    });

    render(<Gallery />);

    expect(await screen.findByText('Midnight Memory')).toBeInTheDocument();
    expect(screen.getByText('Folklore Letters')).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText('Search ebooks...'), 'folklore');

    expect(screen.queryByText('Midnight Memory')).not.toBeInTheDocument();
    expect(screen.getByText('Folklore Letters')).toBeInTheDocument();
  });

  it('shows distinct empty states for Community and My eBooks', async () => {
    const user = userEvent.setup();
    mockGalleryQueries({ community: [], memoryBooks: [], legacyBooks: [] });

    render(<Gallery />);

    expect(await screen.findByText('No community ebooks yet')).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'My eBooks (0)' }));

    await waitFor(() => {
      expect(screen.getByText('No ebooks in your library yet')).toBeInTheDocument();
    });
  });
});
