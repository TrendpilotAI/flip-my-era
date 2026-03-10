import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/modules/shared/components/ui/card';
import { Badge } from '@/modules/shared/components/ui/badge';
import { Input } from '@/modules/shared/components/ui/input';
import { Button } from '@/modules/shared/components/ui/button';
import { Search, BookOpen, Plus, Loader2 } from 'lucide-react';
import { useClerkAuth } from '@/modules/auth/contexts';
import { supabase } from '@/integrations/supabase/client';

// ── Types ──────────────────────────────────────────────

interface GalleryEbook {
  id: string;
  title: string;
  cover_url: string | null;
  created_at: string;
  chapter_count: number | null;
  word_count: number | null;
  era: string | null;
}

// ── Constants ──────────────────────────────────────────

const PAGE_SIZE = 20;

// ── Gradient helper ────────────────────────────────────

const ERA_GRADIENTS: Record<string, string> = {
  Midnights: 'from-indigo-900 via-purple-800 to-blue-900',
  'Fine Line': 'from-pink-400 via-green-300 to-yellow-200',
  Lemonade: 'from-yellow-500 via-amber-600 to-yellow-700',
  Wings: 'from-black via-red-900 to-orange-600',
  'Folklore/Evermore': 'from-amber-700 via-stone-600 to-amber-800',
  Reputation: 'from-black via-gray-800 to-gray-900',
  Renaissance: 'from-yellow-400 via-amber-300 to-gray-300',
  'Speak Now': 'from-purple-600 via-purple-500 to-indigo-600',
  Red: 'from-red-700 via-red-600 to-rose-800',
  Fearless: 'from-yellow-600 via-amber-500 to-yellow-400',
  Debut: 'from-teal-600 via-cyan-500 to-teal-400',
  '1989': 'from-sky-300 via-blue-200 to-cyan-300',
  TTPD: 'from-slate-400 via-gray-300 to-stone-400',
};

function getGradient(era: string | null) {
  if (!era) return 'from-purple-500 to-pink-500';
  return ERA_GRADIENTS[era] || 'from-purple-500 to-pink-500';
}

// ── Skeleton Card ──────────────────────────────────────

function SkeletonCard() {
  return (
    <Card className="overflow-hidden">
      <div className="h-32 bg-muted animate-pulse" />
      <CardContent className="pt-4 space-y-2">
        <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
        <div className="flex gap-2">
          <div className="h-5 bg-muted rounded-full animate-pulse w-16" />
          <div className="h-5 bg-muted rounded-full animate-pulse w-20" />
        </div>
        <div className="h-3 bg-muted rounded animate-pulse w-1/2" />
      </CardContent>
    </Card>
  );
}

// ── Component ──────────────────────────────────────────

export function Gallery() {
  const { user } = useClerkAuth();

  const [ebooks, setEbooks] = useState<GalleryEbook[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [filterEra, setFilterEra] = useState<string | null>(null);

  // ── Fetch ebooks ─────────────────────────────────────
  const fetchEbooks = useCallback(
    async (currentOffset: number, append: boolean) => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      if (append) setIsLoadingMore(true);
      else setIsLoading(true);
      setError(null);

      try {
        const { data, error: fetchError } = await supabase
          .from('ebooks')
          .select('id, title, cover_url, created_at, chapter_count, word_count, era')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .range(currentOffset, currentOffset + PAGE_SIZE - 1);

        if (fetchError) throw fetchError;

        const results = data ?? [];
        setHasMore(results.length === PAGE_SIZE);

        if (append) {
          setEbooks((prev) => [...prev, ...results]);
        } else {
          setEbooks(results);
        }
      } catch (err) {
        setError('Failed to load your ebooks. Please try again.');
        console.error('Gallery fetch error:', err);
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [user],
  );

  useEffect(() => {
    setOffset(0);
    fetchEbooks(0, false);
  }, [fetchEbooks]);

  const handleLoadMore = () => {
    const nextOffset = offset + PAGE_SIZE;
    setOffset(nextOffset);
    fetchEbooks(nextOffset, true);
  };

  // ── Client-side filter (search + era) ─────────────────
  const eras = useMemo(
    () => [...new Set(ebooks.map((e) => e.era).filter(Boolean) as string[])].sort(),
    [ebooks],
  );

  const filtered = useMemo(() => {
    return ebooks.filter((ebook) => {
      const matchesSearch =
        !search || ebook.title.toLowerCase().includes(search.toLowerCase());
      const matchesEra = !filterEra || ebook.era === filterEra;
      return matchesSearch && matchesEra;
    });
  }, [ebooks, search, filterEra]);

  // ── Render ─────────────────────────────────────────────
  return (
    <div className="container py-8 space-y-8 max-w-6xl mx-auto">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
          <BookOpen className="h-8 w-8" /> My Ebook Gallery
        </h1>
        <p className="text-muted-foreground">
          All your fan-made ebooks, across every era
        </p>
      </div>

      {/* Filters */}
      {!isLoading && ebooks.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search ebooks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          {eras.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={filterEra === null ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterEra(null)}
              >
                All Eras
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
          )}
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {/* Error State */}
      {!isLoading && error && (
        <div className="text-center py-12 space-y-3">
          <p className="text-destructive">{error}</p>
          <Button variant="outline" onClick={() => fetchEbooks(0, false)}>
            Try again
          </Button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && ebooks.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 space-y-4 text-center">
          <div className="rounded-full bg-muted p-6">
            <BookOpen className="h-10 w-10 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold">No ebooks yet — create your first!</h2>
          <p className="text-muted-foreground max-w-sm">
            Your gallery is empty. Head to the generator to craft your first era-inspired ebook.
          </p>
          <Button asChild>
            <Link to="/">
              <Plus className="h-4 w-4 mr-2" />
              Create an Ebook
            </Link>
          </Button>
        </div>
      )}

      {/* Search/Filter Empty State */}
      {!isLoading && !error && ebooks.length > 0 && filtered.length === 0 && (
        <p className="text-center text-muted-foreground py-12">
          No ebooks match your search — try a different title or era.
        </p>
      )}

      {/* Ebook Grid */}
      {!isLoading && !error && filtered.length > 0 && (
        <section>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((ebook) => (
              <EbookCard key={ebook.id} ebook={ebook} />
            ))}
          </div>
        </section>
      )}

      {/* Load More — only show when not actively filtering (search/era narrows loaded set) */}
      {!isLoading && !error && hasMore && !search && !filterEra && (
        <div className="flex justify-center pt-4">
          <Button
            variant="outline"
            onClick={handleLoadMore}
            disabled={isLoadingMore}
          >
            {isLoadingMore ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Loading…
              </>
            ) : (
              'Load more'
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

// ── Ebook Card ─────────────────────────────────────────

function EbookCard({ ebook }: { ebook: GalleryEbook }) {
  return (
    <Card className="overflow-hidden hover:ring-2 hover:ring-primary transition-all group cursor-pointer">
      {/* Cover art — real image when available, era gradient fallback */}
      <div
        className={`h-32 bg-gradient-to-br ${getGradient(ebook.era)} flex items-end p-4`}
        style={
          ebook.cover_url
            ? {
                backgroundImage: `url(${ebook.cover_url})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }
            : undefined
        }
      />
      <CardContent className="pt-4">
        <h3 className="font-semibold group-hover:text-primary transition-colors line-clamp-2">
          {ebook.title}
        </h3>
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          {ebook.era && <Badge variant="secondary">{ebook.era}</Badge>}
          {ebook.chapter_count != null && (
            <Badge variant="outline">{ebook.chapter_count} ch</Badge>
          )}
          {ebook.word_count != null && (
            <Badge variant="outline">{ebook.word_count.toLocaleString()} words</Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          {new Date(ebook.created_at).toLocaleDateString()}
        </p>
      </CardContent>
    </Card>
  );
}

export default Gallery;
