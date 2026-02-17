export interface MarketplaceEbook {
  id: string;
  title: string;
  cover_url: string | null;
  price: number;
  creator_id: string;
  creator_name: string;
  creator_avatar: string | null;
  average_rating: number;
  review_count: number;
  view_count: number;
  purchase_count: number;
  era: string;
  genre: string | null;
  description: string | null;
  published_at: string;
  is_published: boolean;
}

export interface Review {
  id: string;
  ebook_id: string;
  user_id: string;
  reviewer_name: string;
  reviewer_avatar: string | null;
  rating: number;
  comment: string;
  helpful_count: number;
  not_helpful_count: number;
  created_at: string;
}

export interface ContentFlag {
  id: string;
  ebook_id: string;
  ebook_title: string;
  reporter_id: string;
  reporter_name: string;
  reason: 'inappropriate' | 'copyright' | 'spam' | 'other';
  details: string;
  status: 'pending' | 'approved' | 'rejected' | 'warned';
  created_at: string;
}

export type SortOption = 'newest' | 'popular' | 'highest_rated' | 'price_asc' | 'price_desc';

export interface MarketplaceFilters {
  search: string;
  era: string;
  minPrice: number | null;
  maxPrice: number | null;
  minRating: number | null;
  sort: SortOption;
}
