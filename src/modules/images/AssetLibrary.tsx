import React, { useState, useMemo } from 'react';
import type { AssetCategory, ImageAsset, AssetLibraryFilters } from './types';

const CATEGORIES: { value: AssetCategory | 'all'; label: string }[] = [
  { value: 'all', label: '🏠 All' },
  { value: 'stickers', label: '🏷️ Stickers' },
  { value: 'borders', label: '🖼️ Borders' },
  { value: 'frames', label: '🪟 Frames' },
  { value: 'backgrounds', label: '🌄 Backgrounds' },
  { value: 'icons', label: '⭐ Icons' },
];

/** Pre-built sample assets */
const SAMPLE_ASSETS: ImageAsset[] = [
  { id: '1', name: 'Heart Sticker', url: 'https://placehold.co/200?text=❤️', thumbnailUrl: 'https://placehold.co/100?text=❤️', category: 'stickers', tags: ['love', 'heart'], isPremium: false },
  { id: '2', name: 'Star Sticker', url: 'https://placehold.co/200?text=⭐', thumbnailUrl: 'https://placehold.co/100?text=⭐', category: 'stickers', tags: ['star', 'rating'], isPremium: false },
  { id: '3', name: 'Gold Border', url: 'https://placehold.co/200?text=Gold', thumbnailUrl: 'https://placehold.co/100?text=Gold', category: 'borders', tags: ['gold', 'elegant'], isPremium: true },
  { id: '4', name: 'Simple Frame', url: 'https://placehold.co/200?text=Frame', thumbnailUrl: 'https://placehold.co/100?text=Frame', category: 'frames', tags: ['simple', 'clean'], isPremium: false },
  { id: '5', name: 'Vintage Frame', url: 'https://placehold.co/200?text=Vintage', thumbnailUrl: 'https://placehold.co/100?text=Vintage', category: 'frames', tags: ['vintage', 'ornate'], isPremium: true },
  { id: '6', name: 'Sunset BG', url: 'https://placehold.co/200?text=🌅', thumbnailUrl: 'https://placehold.co/100?text=🌅', category: 'backgrounds', tags: ['sunset', 'warm'], isPremium: false },
  { id: '7', name: 'Stars BG', url: 'https://placehold.co/200?text=✨', thumbnailUrl: 'https://placehold.co/100?text=✨', category: 'backgrounds', tags: ['stars', 'night'], isPremium: false },
  { id: '8', name: 'Crown Icon', url: 'https://placehold.co/200?text=👑', thumbnailUrl: 'https://placehold.co/100?text=👑', category: 'icons', tags: ['crown', 'royal'], isPremium: true },
  { id: '9', name: 'Neon Border', url: 'https://placehold.co/200?text=Neon', thumbnailUrl: 'https://placehold.co/100?text=Neon', category: 'borders', tags: ['neon', 'glow'], isPremium: false },
  { id: '10', name: 'Fire Sticker', url: 'https://placehold.co/200?text=🔥', thumbnailUrl: 'https://placehold.co/100?text=🔥', category: 'stickers', tags: ['fire', 'hot'], isPremium: false },
  { id: '11', name: 'Retro Frame', url: 'https://placehold.co/200?text=Retro', thumbnailUrl: 'https://placehold.co/100?text=Retro', category: 'frames', tags: ['retro', '80s'], isPremium: false },
  { id: '12', name: 'Diamond Icon', url: 'https://placehold.co/200?text=💎', thumbnailUrl: 'https://placehold.co/100?text=💎', category: 'icons', tags: ['diamond', 'premium'], isPremium: true },
];

export default function AssetLibrary() {
  const [filters, setFilters] = useState<AssetLibraryFilters>({
    category: 'all',
    search: '',
    showPremiumOnly: false,
  });

  const filteredAssets = useMemo(() => {
    return SAMPLE_ASSETS.filter((asset) => {
      if (filters.category !== 'all' && asset.category !== filters.category) return false;
      if (filters.showPremiumOnly && !asset.isPremium) return false;
      if (filters.search) {
        const q = filters.search.toLowerCase();
        return asset.name.toLowerCase().includes(q) || asset.tags.some((t) => t.includes(q));
      }
      return true;
    });
  }, [filters]);

  return (
    <div className="container mx-auto py-8 max-w-5xl" data-testid="asset-library">
      <h1 className="text-3xl font-bold mb-6">📚 Asset Library</h1>
      <p className="text-muted-foreground mb-6">Browse stickers, borders, frames, and more</p>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <input
          data-testid="asset-search"
          className="border rounded-lg p-2 bg-background min-w-[200px]"
          placeholder="Search assets..."
          value={filters.search}
          onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
        />
        <div className="flex gap-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              data-testid={`category-${cat.value}`}
              className={`px-3 py-2 rounded-lg text-sm ${
                filters.category === cat.value ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'
              }`}
              onClick={() => setFilters((f) => ({ ...f, category: cat.value }))}
            >
              {cat.label}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            data-testid="premium-filter"
            checked={filters.showPremiumOnly}
            onChange={(e) => setFilters((f) => ({ ...f, showPremiumOnly: e.target.checked }))}
          />
          Premium only
        </label>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {filteredAssets.map((asset) => (
          <div
            key={asset.id}
            data-testid="asset-card"
            className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer group relative"
          >
            <img src={asset.thumbnailUrl} alt={asset.name} className="w-full aspect-square object-cover" />
            <div className="p-2">
              <p className="text-xs font-medium truncate">{asset.name}</p>
            </div>
            {asset.isPremium && (
              <span className="absolute top-1 right-1 bg-yellow-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                👑
              </span>
            )}
          </div>
        ))}
      </div>

      {filteredAssets.length === 0 && (
        <div className="text-center py-12 text-muted-foreground" data-testid="no-results">
          No assets found. Try adjusting your filters.
        </div>
      )}
    </div>
  );
}
