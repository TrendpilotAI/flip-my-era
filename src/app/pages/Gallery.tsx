import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent } from '@/modules/shared/components/ui/card';
import { Badge } from '@/modules/shared/components/ui/badge';
import { Input } from '@/modules/shared/components/ui/input';
import { Button } from '@/modules/shared/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/modules/shared/components/ui/tabs';
import { useSupabaseAuth } from '@/core/integrations/better-auth/AuthProvider';
import { supabase } from '@/core/integrations/supabase/client';
import { Search, BookOpen, Loader2, LockKeyhole, Library, Globe2, ShieldCheck } from 'lucide-react';
import type { Json } from '@/integrations/supabase/types';

const PAGE_SIZE = 24;
const MEMORY_BOOK_SELECT =
  'id, title, subtitle, author_name, cover_image_url, generation_settings, style_preferences, chapter_count, word_count, created_at, published_at, status, ebook_generation_id, chapters';

interface CommunityBookRow {
  id: string;
  title: string;
  subtitle: string | null;
  author_name: string | null;
  cover_image_url: string | null;
  generation_settings: Json | null;
  style_preferences: Json | null;
  chapter_count: number | null;
  word_count: number | null;
  created_at: string;
  published_at: string | null;
  status: string;
  ebook_generation_id?: string | null;
  chapters?: Json;
}

interface UserEbookRow {
  id: string;
  title: string;
  content: Json | string;
  story_type: string | null;
  chapter_count: number | null;
  word_count: number | null;
  created_at: string;
}

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
}

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
    era: getEraFromSettings(row.generation_settings),
    creator: row.author_name || 'Community creator',
    chapterCount: row.chapter_count ?? 0,
    wordCount: row.word_count ?? 0,
    createdAt: row.published_at || row.created_at,
    source: 'community',
    origin: 'memory_books',
    status: 'published',
    ebookGenerationId: row.ebook_generation_id ?? null,
    publishedAt: row.published_at,
  };
}

function normalizeUserMemoryBook(row: CommunityBookRow): GalleryBook {
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
  };
}

function normalizeLegacyUserEbook(row: UserEbookRow): GalleryBook {
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
  };
}

function isMissingTableError(error: { code?: string; message?: string }) {
  return error.code === '42P01' || error.message?.includes('does not exist');
}

function countLabel(label: string, count: number | null) {
  return `${label} (${count ?? '...'})`;
}

function formatCount(value: number, noun: string) {
  return `${value.toLocaleString()} ${noun}${value === 1 ? '' : 's'}`;
}

export function Gallery() {
  const { isSignedIn, user } = useSupabaseAuth();
  const [activeTab, setActiveTab] = useState<GalleryTab>('community');
  const [search, setSearch] = useState('');
  const [filterEra, setFilterEra] = useState<string | null>(null);
  const [communityBooks, setCommunityBooks] = useState<GalleryBook[]>([]);
  const [myBooks, setMyBooks] = useState<GalleryBook[]>([]);
  const [communityLoading, setCommunityLoading] = useState(true);
  const [myBooksLoading, setMyBooksLoading] = useState(true);
  const [communityError, setCommunityError] = useState<string | null>(null);
  const [myBooksError, setMyBooksError] = useState<string | null>(null);
  const [publishingBookId, setPublishingBookId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadCommunityBooks() {
      setCommunityLoading(true);
      setCommunityError(null);

      const { data, error } = await supabase
        .from('memory_books')
        .select(MEMORY_BOOK_SELECT)
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(PAGE_SIZE);

      if (cancelled) return;

      if (error && isMissingTableError(error)) {
        setCommunityBooks([]);
      } else if (error) {
        console.error('Failed to load community books:', error);
        setCommunityError('Community ebooks could not be loaded.');
        setCommunityBooks([]);
      } else {
        setCommunityBooks(((data ?? []) as CommunityBookRow[]).map(normalizeCommunityBook));
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

      if (!isSignedIn || !user?.id) {
        setMyBooks([]);
        setMyBooksLoading(false);
        return;
      }

      setMyBooksLoading(true);

      const { data: memoryBookData, error: memoryBookError } = await supabase
        .from('memory_books')
        .select(MEMORY_BOOK_SELECT)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(PAGE_SIZE);

      if (cancelled) return;

      if (memoryBookError && !isMissingTableError(memoryBookError)) {
        console.error('Failed to load user memory books:', memoryBookError);
        setMyBooksError('Your ebooks could not be loaded.');
        setMyBooks([]);
        setMyBooksLoading(false);
        return;
      }

      const memoryBooks = memoryBookError ? [] : ((memoryBookData ?? []) as CommunityBookRow[]);
      const memoryGenerationIds = new Set(
        memoryBooks
          .map((book) => book.ebook_generation_id)
          .filter((id): id is string => Boolean(id)),
      );

      const { data: legacyData, error: legacyError } = await supabase
        .from('ebook_generations')
        .select('id, title, content, story_type, chapter_count, word_count, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(PAGE_SIZE);

      if (cancelled) return;

      if (legacyError) {
        console.error('Failed to load legacy user ebooks:', legacyError);
      }

      const legacyBooks = legacyError
        ? []
        : ((legacyData ?? []) as UserEbookRow[]).filter((book) => !memoryGenerationIds.has(book.id));

      setMyBooks([
        ...memoryBooks.map(normalizeUserMemoryBook),
        ...legacyBooks.map(normalizeLegacyUserEbook),
      ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, PAGE_SIZE));

      if (legacyError && memoryBooks.length === 0) {
        setMyBooksError('Your older generated ebooks could not be loaded.');
      }

      setMyBooksLoading(false);
    }

    void loadMyBooks();

    return () => {
      cancelled = true;
    };
  }, [isSignedIn, user?.id]);

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
    const { data, error } = await supabase
      .from('memory_books')
      .select(MEMORY_BOOK_SELECT)
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(PAGE_SIZE);

    if (error) {
      console.error('Failed to refresh community books:', error);
      return;
    }

    setCommunityBooks(((data ?? []) as CommunityBookRow[]).map(normalizeCommunityBook));
  }

  async function handlePublishToggle(book: GalleryBook) {
    if (book.source !== 'mine' || book.origin !== 'memory_books') return;

    const nextIsPublished = book.status !== 'published';
    setPublishingBookId(book.id);
    setMyBooksError(null);

    const { data, error } = await supabase
      .from('memory_books')
      .update({
        status: nextIsPublished ? 'published' : 'completed',
        published_at: nextIsPublished ? new Date().toISOString() : null,
      })
      .eq('id', book.id)
      .select(MEMORY_BOOK_SELECT)
      .single();

    if (error) {
      console.error('Failed to update ebook publish status:', error);
      setMyBooksError(nextIsPublished ? 'Your ebook could not be published.' : 'Your ebook could not be unpublished.');
      setPublishingBookId(null);
      return;
    }

    const updated = normalizeUserMemoryBook(data as CommunityBookRow);
    setMyBooks((books) => books.map((item) => (item.id === book.id ? updated : item)));
    await refreshCommunityBooks();
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
            <GalleryTabContent
              books={filtered}
              loading={activeLoading}
              error={activeError}
              emptyTitle="No ebooks in your library yet"
              emptyDescription="Generate an ebook and it will show up here."
              publishingBookId={publishingBookId}
              onPublishToggle={handlePublishToggle}
            />
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
