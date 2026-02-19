import type { MarketplaceEbook } from './types';

// In-memory mock data store for marketplace ebooks
// In production, these would query Supabase tables
let mockEbooks: MarketplaceEbook[] = [];

export function setMockEbooks(ebooks: MarketplaceEbook[]) {
  mockEbooks = ebooks;
}

function scoreEbook(ebook: MarketplaceEbook): number {
  const viewScore = (ebook.view_count || 0) * 1;
  const purchaseScore = (ebook.purchase_count || 0) * 5;
  const ratingScore = (ebook.average_rating || 0) * (ebook.review_count || 0) * 3;
  return viewScore + purchaseScore + ratingScore;
}

export function getRecommendations(
  userId: string,
  allEbooks: MarketplaceEbook[],
  userEras: string[] = [],
  limit = 10
): MarketplaceEbook[] {
  const ebooks = allEbooks.length > 0 ? allEbooks : mockEbooks;

  // Filter out user's own ebooks, boost matching eras
  const scored = ebooks
    .filter((e) => e.creator_id !== userId && e.is_published)
    .map((e) => {
      let score = scoreEbook(e);
      if (userEras.includes(e.era)) score *= 1.5;
      return { ebook: e, score };
    })
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map((s) => s.ebook);
}

export function getTrending(
  allEbooks: MarketplaceEbook[],
  timeframeDays = 7,
  limit = 10
): MarketplaceEbook[] {
  const ebooks = allEbooks.length > 0 ? allEbooks : mockEbooks;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - timeframeDays);

  return ebooks
    .filter((e) => e.is_published && new Date(e.published_at) >= cutoff)
    .sort((a, b) => scoreEbook(b) - scoreEbook(a))
    .slice(0, limit);
}

export function getNewReleases(
  allEbooks: MarketplaceEbook[],
  limit = 10
): MarketplaceEbook[] {
  const ebooks = allEbooks.length > 0 ? allEbooks : mockEbooks;

  return ebooks
    .filter((e) => e.is_published)
    .sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime())
    .slice(0, limit);
}
