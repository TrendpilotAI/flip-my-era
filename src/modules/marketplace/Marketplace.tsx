import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/modules/shared/components/ui/card';
import { Button } from '@/modules/shared/components/ui/button';
import { Badge } from '@/modules/shared/components/ui/badge';
import { Search, SlidersHorizontal, Star, ShoppingCart, BookOpen } from 'lucide-react';
import type { MarketplaceEbook, MarketplaceFilters, SortOption } from './types';
import { getNewReleases, getTrending } from './discovery';

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'popular', label: 'Most Popular' },
  { value: 'highest_rated', label: 'Highest Rated' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
];

const ERA_OPTIONS = ['All', '60s', '70s', '80s', '90s', '2000s'];

function EbookCard({
  ebook,
  onPurchase,
}: {
  ebook: MarketplaceEbook;
  onPurchase?: (ebook: MarketplaceEbook) => void;
}) {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow" data-testid="ebook-card">
      <div className="aspect-[3/4] bg-gradient-to-br from-purple-400 to-pink-400 relative">
        {ebook.cover_url ? (
          <img src={ebook.cover_url} alt={ebook.title} className="w-full h-full object-cover" />
        ) : (
          <div className="flex items-center justify-center h-full">
            <BookOpen size={48} className="text-white/60" />
          </div>
        )}
        {ebook.era && (
          <Badge className="absolute top-2 left-2 bg-black/60 text-white">{ebook.era}</Badge>
        )}
      </div>
      <CardContent className="p-3 space-y-2">
        <h3 className="font-semibold text-sm line-clamp-1">{ebook.title}</h3>
        <p className="text-xs text-muted-foreground">{ebook.creator_name}</p>
        <div className="flex items-center gap-1">
          <Star size={12} className="fill-yellow-400 text-yellow-400" />
          <span className="text-xs">
            {ebook.average_rating.toFixed(1)} ({ebook.review_count})
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-bold text-sm">
            {ebook.price === 0 ? 'Free' : `$${ebook.price.toFixed(2)}`}
          </span>
          <Button size="sm" variant="default" onClick={() => onPurchase?.(ebook)}>
            <ShoppingCart size={12} className="mr-1" />
            {ebook.price === 0 ? 'Get' : 'Buy'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function Marketplace({
  ebooks = [],
  onPurchase,
}: {
  ebooks?: MarketplaceEbook[];
  onPurchase?: (ebook: MarketplaceEbook) => void;
}) {
  const [filters, setFilters] = useState<MarketplaceFilters>({
    search: '',
    era: 'All',
    minPrice: null,
    maxPrice: null,
    minRating: null,
    sort: 'newest',
  });
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(() => {
    let result = ebooks.filter((e) => e.is_published);

    // Search
    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (e) =>
          e.title.toLowerCase().includes(q) || e.creator_name.toLowerCase().includes(q)
      );
    }

    // Era filter
    if (filters.era !== 'All') {
      result = result.filter((e) => e.era === filters.era);
    }

    // Price filter
    if (filters.minPrice != null) {
      result = result.filter((e) => e.price >= filters.minPrice!);
    }
    if (filters.maxPrice != null) {
      result = result.filter((e) => e.price <= filters.maxPrice!);
    }

    // Rating filter
    if (filters.minRating != null) {
      result = result.filter((e) => e.average_rating >= filters.minRating!);
    }

    // Sort
    switch (filters.sort) {
      case 'newest':
        result.sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime());
        break;
      case 'popular':
        result.sort((a, b) => b.purchase_count - a.purchase_count);
        break;
      case 'highest_rated':
        result.sort((a, b) => b.average_rating - a.average_rating);
        break;
      case 'price_asc':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price_desc':
        result.sort((a, b) => b.price - a.price);
        break;
    }

    return result;
  }, [ebooks, filters]);

  return (
    <div className="container py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Marketplace</h1>
        <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
          <SlidersHorizontal size={14} className="mr-1" /> Filters
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          className="w-full border rounded-lg pl-9 pr-4 py-2 text-sm"
          placeholder="Search by title or creator..."
          value={filters.search}
          onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
          data-testid="search-input"
        />
      </div>

      {/* Filters panel */}
      {showFilters && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 border rounded-lg bg-muted/30" data-testid="filters-panel">
          <div>
            <label className="text-xs font-medium">Era</label>
            <select
              className="w-full border rounded p-1.5 text-sm mt-1"
              value={filters.era}
              onChange={(e) => setFilters((f) => ({ ...f, era: e.target.value }))}
            >
              {ERA_OPTIONS.map((era) => (
                <option key={era} value={era}>{era}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium">Min Rating</label>
            <select
              className="w-full border rounded p-1.5 text-sm mt-1"
              value={filters.minRating ?? ''}
              onChange={(e) => setFilters((f) => ({ ...f, minRating: e.target.value ? Number(e.target.value) : null }))}
            >
              <option value="">Any</option>
              {[4, 3, 2, 1].map((r) => (
                <option key={r} value={r}>{r}+ stars</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium">Sort By</label>
            <select
              className="w-full border rounded p-1.5 text-sm mt-1"
              value={filters.sort}
              onChange={(e) => setFilters((f) => ({ ...f, sort: e.target.value as SortOption }))}
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium">Max Price</label>
            <input
              type="number"
              className="w-full border rounded p-1.5 text-sm mt-1"
              placeholder="Any"
              min={0}
              step={0.01}
              onChange={(e) => setFilters((f) => ({ ...f, maxPrice: e.target.value ? Number(e.target.value) : null }))}
            />
          </div>
        </div>
      )}

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <BookOpen size={48} className="mx-auto mb-3 opacity-30" />
          <p>No ebooks found. Try adjusting your filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filtered.map((ebook) => (
            <EbookCard key={ebook.id} ebook={ebook} onPurchase={onPurchase} />
          ))}
        </div>
      )}
    </div>
  );
}

export default Marketplace;
