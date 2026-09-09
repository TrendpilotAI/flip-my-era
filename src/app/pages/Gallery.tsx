import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent } from '@/modules/shared/components/ui/card';
import { Badge } from '@/modules/shared/components/ui/badge';
import { Input } from '@/modules/shared/components/ui/input';
import { Button } from '@/modules/shared/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/modules/shared/components/ui/tabs';
import { useSupabaseAuth } from '@/core/integrations/better-auth/AuthProvider';
import { invokeAuthenticatedFunction, supabase } from '@/core/integrations/supabase/client';
import { Search, BookOpen, Loader2, LockKeyhole, Library, Globe2, ShieldCheck } from 'lucide-react';
import type { Json } from '@/integrations/supabase/types';

const PAGE_SIZE = 24;

interface GalleryBook {
  id: string;
  title: string;
  coverUrl: string | null;
  era: string;
  creator: string;
  chapterCount: number;
  wordCount: number;
  createdAt: string;
  source: 'community' | 'mine';
  origin: 'memory_books' | 'ebook_generations';
  status: 'private' | 'published' | 'generated';
  ebookGenerationId: string | null;
  publishedAt: string | null;
  version: number | null;
}

interface CommunityBookRow {
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

interface UserMemoryBookRow {
  id: string;
  user_id: string;
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
  version: number;
}

interface UserEbookGenerationRow {
  id: string;
  user_id: string;
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

interface OwnerBooksResponse {
  books?: UserMemoryBookRow[];
  memoryBooks?: UserMemoryBookRow[];
  legacyBooks: UserEbookGenerationRow[];
}

interface BookMutationResponse {
  book: UserMemoryBookRow;
}

type BookMutationResult = BookMutationResponse | UserMemoryBookRow;

type GalleryTab = GalleryBook['source'];

const ERA_GRADIENTS: Record<string, string> = {
  Midnights: 'from-indigo-900 via-purple-800 to-blue-900',
  'Fine Line': 'from-pink-400 via-green-300 to-yellow-200',
  Lemonade: 'from-yellow-500 via-amber-600 to-yellow-700',
  Wings: 'from-black via-red-900 to-orange-600',
  'Folklore/Evermore': 'from-amber-700 via-stone-600 to-amber-800',
  Reputation: 'from-black via-gray-800 to-gray-900',
  Renaissance: 'from-yellow-400 via-amber-300 to-gray-300',
  'Coming Of Age': 'from-sky-500 via-rose-300 to-amber-200',
  'First Love': 'from-rose-500 via-pink-400 to-orange-200',
  Heartbreak: 'from-violet-700 via-fuchsia-700 to-slate-900',
  Friendship: 'from-emerald-500 via-teal-300 to-sky-300',
  'Flip My Era': 'from-purple-500 to-pink-500',
};

function getGradient(era: string) {
  return ERA_GRADIENTS[era] || 'from-purple-500 to-pink-500';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function titleCase(value: string) {
  return value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function getEraFromSettings(settings: Json | null, fallback = 'Flip My Era') {
  if (!isRecord(settings)) return fallback;

  const selectedTheme = settings.selectedTheme;
  if (typeof selectedTheme === 'string' && selectedTheme.trim()) {
    return titleCase(selectedTheme);
  }

  const selectedFormat = settings.selectedFormat;
  if (typeof selectedFormat === 'string' && selectedFormat.trim()) {
    return titleCase(selectedFormat);
  }

  const storyType = settings.storyType;
  if (typeof storyType === 'string' && storyType.trim()) {
    return getEraFromStoryType(storyType);
  }

  return fallback;
}

function getEraFromStoryType(storyType: string | null) {
  if (!storyType) return 'Flip My Era';

  const cleaned = storyType
    .replace(/^taylor-swift-/, '')
    .replace(/-(short-story|novella|preview)$/i, '');

  return cleaned ? titleCase(cleaned) : 'Flip My Era';
}

function countContentWords(content: Json | string): number {
  try {
    const parsed = typeof content === 'string' ? JSON.parse(content) : content;
    const chapters = Array.isArray(parsed)
      ? parsed
      : isRecord(parsed) && Array.isArray(parsed.chapters)
        ? parsed.chapters
        : [];

    return chapters.reduce((total, chapter) => {
      if (!isRecord(chapter) || typeof chapter.content !== 'string') return total;
      return total + chapter.content.trim().split(/\s+/).filter(Boolean).length;
    }, 0);
  } catch {
    return 0;
  }
}

function countChapters(content: Json | string): number {
  try {
    const parsed = typeof content === 'string' ? JSON.parse(content) : content;
    if (Array.isArray(parsed)) return parsed.length;
    if (isRecord(parsed) && Array.isArray(parsed.chapters)) return parsed.chapters.length;
    return 0;
  } catch {
    return 0;
  }
}

function normalizeCommunityBook(row: CommunityBookRow): GalleryBook {
  return {
    id: row.id,
    title: row.title,
    coverUrl: row.cover_image_url,
    era: 'Flip My Era',
    creator: row.author_name || 'Community creator',
    chapterCount: row.chapter_count ?? 0,
    wordCount: row.word_count ?? 0,
    createdAt: row.published_at || row.created_at,
    source: 'community',
    origin: 'memory_books',
    status: 'published',
    ebookGenerationId: null,
    publishedAt: row.published_at,
    version: null,
  };
}

function normalizeUserMemoryBook(row: UserMemoryBookRow): GalleryBook {
  return {
    id: row.id,
    title: row.title,
    coverUrl: row.cover_image_url,
    era: getEraFromSettings(row.generation_settings),
    creator: 'You',
    chapterCount: row.chapter_count ?? countChapters(row.chapters ?? []),
    wordCount: row.word_count ?? countContentWords(row.chapters ?? []),
    createdAt: row.created_at,
    source: 'mine',
    origin: 'memory_books',
    status: row.status === 'published' ? 'published' : 'private',
    ebookGenerationId: row.ebook_generation_id ?? null,
    publishedAt: row.published_at,
    version: row.version,
  };
}

function normalizeLegacyUserEbook(row: UserEbookGenerationRow): GalleryBook {
  return {
    id: row.id,
    title: row.title,
    coverUrl: null,
    era: getEraFromStoryType(row.story_type),
    creator: 'You',
    chapterCount: row.chapter_count ?? countChapters(row.content),
    wordCount: row.word_count ?? countContentWords(row.content),
    createdAt: row.created_at,
    source: 'mine',
    origin: 'ebook_generations',
    status: 'generated',
    ebookGenerationId: row.id,
    publishedAt: null,
    version: null,
  };
}

async function fetchCommunityBooks(): Promise<CommunityBookRow[]> {
  const { data, error } = await supabase
    .from('community_books')
    .select('id,title,subtitle,author_name,cover_image_url,chapter_count,word_count,published_at,created_at,status')
    .order('published_at', { ascending: false })
    .limit(PAGE_SIZE);
  if (error) throw error;
  return (data ?? []) as CommunityBookRow[];
}

async function fetchOwnerBooks(): Promise<OwnerBooksResponse> {
  const { data, error } = await invokeAuthenticatedFunction<OwnerBooksResponse>(
    'gallery-books',
    { method: 'GET' },
  );
  if (error) throw error;
  if (!data) throw new Error('Gallery returned no owner library');
  return data;
}

function normalizeOwnerBooks(data: OwnerBooksResponse): GalleryBook[] {
  const memoryBooks = data.books ?? data.memoryBooks ?? [];
  return [
    ...memoryBooks.map(normalizeUserMemoryBook),
    ...data.legacyBooks.map(normalizeLegacyUserEbook),
  ]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, PAGE_SIZE);
}

function getErrorStatus(error: unknown): number | undefined {
  if (!error || typeof error !== 'object') return undefined;
  const candidate = error as { status?: unknown; context?: { status?: unknown } };
  if (typeof candidate.status === 'number') return candidate.status;
  return typeof candidate.context?.status === 'number' ? candidate.context.status : undefined;
}

function getMutatedBook(data: BookMutationResult): UserMemoryBookRow {
  return 'book' in data ? data.book : data;
}

function countLabel(label: string, count: number | null) {
  return `${label} (${count ?? '...'})`;
}

function formatCount(value: number, noun: string) {
  return `${value.toLocaleString()} ${noun}${value === 1 ? '' : 's'}`;
}

export function Gallery() {
  const { isSignedIn } = useSupabaseAuth();
  const [activeTab, setActiveTab] = useState<GalleryTab>('community');
  const [search, setSearch] = useState('');
  const [filterEra, setFilterEra] = useState<string | null>(null);
  const [communityBooks, setCommunityBooks] = useState<GalleryBook[]>([]);
  const [myBooks, setMyBooks] = useState<GalleryBook[]>([]);
  const [communityLoading, setCommunityLoading] = useState(true);
  const [myBooksLoading, setMyBooksLoading] = useState(true);
  const [communityError, setCommunityError] = useState<string | null>(null);
  const [myBooksError, setMyBooksError] = useState<string | null>(null);
  const [myBooksActionError, setMyBooksActionError] = useState<string | null>(null);
  const [publishingBookId, setPublishingBookId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadCommunityBooks() {
      setCommunityLoading(true);
      setCommunityError(null);

      try {
        const data = await fetchCommunityBooks();
        if (cancelled) return;
        setCommunityBooks(data.map(normalizeCommunityBook));
      } catch (error) {
        if (cancelled) return;
        console.error('Failed to load community books:', error);
        setCommunityError('Community ebooks could not be loaded.');
        setCommunityBooks([]);
      }

      setCommunityLoading(false);
    }

    void loadCommunityBooks();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadMyBooks() {
      setMyBooksError(null);

      if (!isSignedIn) {
        setMyBooks([]);
        setMyBooksLoading(false);
        return;
      }

      setMyBooksLoading(true);

      try {
        const data = await fetchOwnerBooks();
        if (cancelled) return;
        setMyBooks(normalizeOwnerBooks(data));
      } catch (error) {
        if (cancelled) return;
        console.error('Failed to load user ebooks:', error);
        setMyBooksError('Your ebooks could not be loaded.');
        setMyBooks([]);
      }

      setMyBooksLoading(false);
    }

    void loadMyBooks();

    return () => {
      cancelled = true;
    };
  }, [isSignedIn]);

  const activeBooks = activeTab === 'community' ? communityBooks : myBooks;
  const activeLoading = activeTab === 'community' ? communityLoading : myBooksLoading;
  const activeError = activeTab === 'community' ? communityError : myBooksError;

  const eras = useMemo(() => {
    return [...new Set(activeBooks.map((book) => book.era))].sort((a, b) => a.localeCompare(b));
  }, [activeBooks]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return activeBooks.filter((book) => {
      const matchesSearch =
        !query ||
        book.title.toLowerCase().includes(query) ||
        book.creator.toLowerCase().includes(query) ||
        book.era.toLowerCase().includes(query);
      const matchesEra = !filterEra || book.era === filterEra;
      return matchesSearch && matchesEra;
    });
  }, [activeBooks, filterEra, search]);

  async function refreshCommunityBooks() {
    try {
      const data = await fetchCommunityBooks();
      setCommunityBooks(data.map(normalizeCommunityBook));
    } catch (error) {
      console.error('Failed to refresh community books:', error);
    }
  }

  async function refreshMyBooks() {
    if (!isSignedIn) return;
    const data = await fetchOwnerBooks();
    setMyBooks(normalizeOwnerBooks(data));
  }

  async function handlePublishToggle(book: GalleryBook) {
    if (book.source !== 'mine' || book.origin !== 'memory_books') return;

    const nextStatus = book.status === 'published' ? 'completed' : 'published';
    setPublishingBookId(book.id);
    setMyBooksActionError(null);

    try {
      if (book.version === null) throw new Error('Book version is missing');
      const { data, error } = await invokeAuthenticatedFunction<BookMutationResult>(
        'gallery-books',
        {
          method: 'PATCH',
          body: { bookId: book.id, status: nextStatus, version: book.version },
        },
      );
      if (error) throw error;
      if (!data) throw new Error('Gallery returned no updated book');
      const updated = normalizeUserMemoryBook(getMutatedBook(data));
      setMyBooks((books) => books.map((item) => (item.id === book.id ? updated : item)));
      await refreshCommunityBooks();
    } catch (error) {
      console.error('Failed to update ebook publish status:', error);
      if (getErrorStatus(error) === 409) {
        try {
          await refreshMyBooks();
        } catch (refreshError) {
          console.error('Failed to refresh stale ebook state:', refreshError);
        }
      }
      setMyBooksActionError(
        nextStatus === 'published'
          ? 'Your ebook could not be published.'
          : 'Your ebook could not be unpublished.',
      );
    }
    setPublishingBookId(null);
  }

  return (
    <div className="container pt-20 pb-8 sm:pt-8 space-y-8 max-w-6xl mx-auto">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
          <BookOpen className="h-8 w-8" /> Ebook Gallery
        </h1>
        <p className="text-muted-foreground">
          Explore community creations or revisit your own generated ebooks
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search ebooks..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={filterEra === null ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterEra(null)}
          >
            All
          </Button>
          {eras.map((era) => (
            <Button
              key={era}
              variant={filterEra === era ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterEra(filterEra === era ? null : era)}
            >
              {era}
            </Button>
          ))}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as GalleryTab)} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 sm:w-auto">
          <TabsTrigger value="community">{countLabel('Community', communityLoading ? null : communityBooks.length)}</TabsTrigger>
          <TabsTrigger value="mine">{countLabel('My eBooks', myBooksLoading ? null : myBooks.length)}</TabsTrigger>
        </TabsList>

        <TabsContent value="community">
          <GalleryTabContent
            books={filtered}
            loading={activeLoading}
            error={activeError}
            emptyTitle="No community ebooks yet"
            emptyDescription="Published books will appear here once creators share them."
          />
        </TabsContent>

        <TabsContent value="mine">
          {!isSignedIn ? (
            <SignedOutState />
          ) : (
            <div className="space-y-4">
              {myBooksActionError ? (
                <p role="alert" className="text-center text-sm text-destructive">
                  {myBooksActionError}
                </p>
              ) : null}
              <GalleryTabContent
                books={filtered}
                loading={activeLoading}
                error={activeError}
                emptyTitle="No ebooks in your library yet"
                emptyDescription="Generate an ebook and it will show up here."
                publishingBookId={publishingBookId}
                onPublishToggle={handlePublishToggle}
              />
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function GalleryTabContent({
  books,
  loading,
  error,
  emptyTitle,
  emptyDescription,
  publishingBookId = null,
  onPublishToggle,
}: {
  books: GalleryBook[];
  loading: boolean;
  error: string | null;
  emptyTitle: string;
  emptyDescription: string;
  publishingBookId?: string | null;
  onPublishToggle?: (book: GalleryBook) => void;
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading ebooks...
      </div>
    );
  }

  if (error) {
    return <p className="text-center text-sm text-destructive py-12">{error}</p>;
  }

  if (books.length === 0) {
    return (
      <div className="text-center py-12 space-y-2">
        <Library className="h-8 w-8 mx-auto text-muted-foreground" />
        <h2 className="text-lg font-semibold">{emptyTitle}</h2>
        <p className="text-muted-foreground">{emptyDescription}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {books.map((book) => (
        <EbookCard
          key={`${book.source}-${book.id}`}
          book={book}
          isPublishing={publishingBookId === book.id}
          onPublishToggle={onPublishToggle}
        />
      ))}
    </div>
  );
}

function SignedOutState() {
  return (
    <div className="text-center py-12 space-y-4">
      <LockKeyhole className="h-8 w-8 mx-auto text-muted-foreground" />
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Sign in to view your ebooks</h2>
        <p className="text-muted-foreground">Your generated ebooks will appear here once you sign in.</p>
      </div>
      <Button asChild>
        <a href="/auth">Sign In</a>
      </Button>
    </div>
  );
}

function getStatusBadge(book: GalleryBook) {
  if (book.source === 'community') return 'Community';
  if (book.status === 'published') return 'Published';
  if (book.status === 'private') return 'Private';
  return 'Generated';
}

function EbookCard({
  book,
  isPublishing = false,
  onPublishToggle,
}: {
  book: GalleryBook;
  isPublishing?: boolean;
  onPublishToggle?: (book: GalleryBook) => void;
}) {
  const showPublishControl = book.source === 'mine' && book.origin === 'memory_books';
  const isPublished = book.status === 'published';

  return (
    <Card className="overflow-hidden hover:ring-2 hover:ring-primary transition-all group">
      <div className={`relative h-36 overflow-hidden bg-gradient-to-br ${getGradient(book.era)} flex items-end p-4`}>
        {book.coverUrl ? (
          <img src={book.coverUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : null}
        <div className="relative flex gap-2 flex-wrap">
          <Badge variant={book.source === 'community' || isPublished ? 'default' : 'secondary'}>
            {getStatusBadge(book)}
          </Badge>
          <Badge variant="outline" className="bg-background/80">
            {book.era}
          </Badge>
        </div>
      </div>
      <CardContent className="pt-4 space-y-3">
        <div>
          <h3 className="font-semibold group-hover:text-primary transition-colors line-clamp-2">{book.title}</h3>
          <p className="text-xs text-muted-foreground mt-2">
            by {book.creator} · {new Date(book.createdAt).toLocaleDateString()}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          <span>{formatCount(book.chapterCount, 'chapter')}</span>
          <span>{book.wordCount.toLocaleString()} words</span>
        </div>
        {showPublishControl ? (
          <Button
            type="button"
            variant={isPublished ? 'outline' : 'default'}
            size="sm"
            className="w-full gap-2"
            disabled={isPublishing}
            onClick={() => onPublishToggle?.(book)}
          >
            {isPublishing ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : isPublished ? (
              <ShieldCheck className="h-3.5 w-3.5" />
            ) : (
              <Globe2 className="h-3.5 w-3.5" />
            )}
            {isPublished ? 'Unpublish' : 'Publish'}
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}

export default Gallery;
