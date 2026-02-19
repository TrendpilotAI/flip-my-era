import { describe, it, expect } from 'vitest';
import { getRecommendations, getTrending, getNewReleases } from '../discovery';
import type { MarketplaceEbook } from '../types';

function makeEbook(overrides: Partial<MarketplaceEbook> = {}): MarketplaceEbook {
  return {
    id: Math.random().toString(36).slice(2),
    title: 'Test Ebook',
    cover_url: null,
    price: 9.99,
    creator_id: 'creator-1',
    creator_name: 'Creator',
    creator_avatar: null,
    average_rating: 4,
    review_count: 10,
    view_count: 100,
    purchase_count: 50,
    era: '80s',
    genre: null,
    description: null,
    published_at: new Date().toISOString(),
    is_published: true,
    ...overrides,
  };
}

describe('discovery', () => {
  const ebooks = [
    makeEbook({ id: '1', title: 'Popular', purchase_count: 200, view_count: 500, average_rating: 5, review_count: 50, era: '80s' }),
    makeEbook({ id: '2', title: 'New', purchase_count: 5, view_count: 10, era: '90s', published_at: new Date().toISOString() }),
    makeEbook({ id: '3', title: 'Old', purchase_count: 30, view_count: 80, era: '70s', published_at: '2020-01-01T00:00:00Z' }),
    makeEbook({ id: '4', title: 'Unpublished', is_published: false }),
    makeEbook({ id: '5', title: 'Mine', creator_id: 'user-1', era: '80s' }),
  ];

  it('getRecommendations excludes own ebooks and boosts matching eras', () => {
    const recs = getRecommendations('user-1', ebooks, ['80s']);
    expect(recs.find((e) => e.id === '5')).toBeUndefined(); // own ebook excluded
    expect(recs.find((e) => e.id === '4')).toBeUndefined(); // unpublished excluded
    expect(recs[0].id).toBe('1'); // popular + era match = top
  });

  it('getTrending returns recent ebooks sorted by score', () => {
    const trending = getTrending(ebooks, 30);
    expect(trending.find((e) => e.id === '4')).toBeUndefined();
    // Old ebook (2020) should be excluded from 30-day window
    expect(trending.find((e) => e.id === '3')).toBeUndefined();
  });

  it('getNewReleases returns published ebooks sorted by date', () => {
    const releases = getNewReleases(ebooks);
    expect(releases.find((e) => e.id === '4')).toBeUndefined();
    expect(releases.length).toBeGreaterThan(0);
    // Should be sorted newest first
    for (let i = 1; i < releases.length; i++) {
      expect(new Date(releases[i - 1].published_at).getTime()).toBeGreaterThanOrEqual(
        new Date(releases[i].published_at).getTime()
      );
    }
  });
});
