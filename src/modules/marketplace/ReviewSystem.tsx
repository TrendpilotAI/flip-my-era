import { useState, useCallback } from 'react';
import { Card, CardContent } from '@/modules/shared/components/ui/card';
import { Button } from '@/modules/shared/components/ui/button';
import { Star, ThumbsUp, ThumbsDown } from 'lucide-react';
import type { Review } from './types';

// --- API functions (mock implementations, swap for Supabase in prod) ---

let reviewStore: Review[] = [];

export function resetReviewStore() {
  reviewStore = [];
}

export async function submitReview(
  ebookId: string,
  userId: string,
  userName: string,
  rating: number,
  comment: string
): Promise<Review> {
  const review: Review = {
    id: crypto.randomUUID?.() || Math.random().toString(36).slice(2),
    ebook_id: ebookId,
    user_id: userId,
    reviewer_name: userName,
    reviewer_avatar: null,
    rating: Math.min(5, Math.max(1, Math.round(rating))),
    comment,
    helpful_count: 0,
    not_helpful_count: 0,
    created_at: new Date().toISOString(),
  };
  reviewStore.push(review);
  return review;
}

export async function getReviews(
  ebookId: string,
  page = 1,
  pageSize = 10
): Promise<{ reviews: Review[]; total: number; averageRating: number }> {
  const all = reviewStore.filter((r) => r.ebook_id === ebookId);
  const total = all.length;
  const averageRating = total > 0 ? all.reduce((s, r) => s + r.rating, 0) / total : 0;
  const start = (page - 1) * pageSize;
  return { reviews: all.slice(start, start + pageSize), total, averageRating };
}

export async function voteHelpful(reviewId: string, helpful: boolean): Promise<void> {
  const review = reviewStore.find((r) => r.id === reviewId);
  if (review) {
    if (helpful) review.helpful_count++;
    else review.not_helpful_count++;
  }
}

// --- Components ---

function StarRating({
  rating,
  onChange,
  interactive = false,
  size = 16,
}: {
  rating: number;
  onChange?: (r: number) => void;
  interactive?: boolean;
  size?: number;
}) {
  const [hover, setHover] = useState(0);

  return (
    <div className="flex gap-0.5" role="group" aria-label={`Rating: ${rating} out of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={size}
          className={`${
            i <= (hover || rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
          } ${interactive ? 'cursor-pointer' : ''}`}
          onMouseEnter={() => interactive && setHover(i)}
          onMouseLeave={() => interactive && setHover(0)}
          onClick={() => interactive && onChange?.(i)}
          data-testid={`star-${i}`}
        />
      ))}
    </div>
  );
}

export function ReviewCard({ review }: { review: Review }) {
  return (
    <Card className="mb-3">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">{review.reviewer_name}</span>
            <StarRating rating={review.rating} size={14} />
          </div>
          <span className="text-xs text-muted-foreground">
            {new Date(review.created_at).toLocaleDateString()}
          </span>
        </div>
        <p className="text-sm mb-3">{review.comment}</p>
        <div className="flex gap-3 text-xs text-muted-foreground">
          <button
            className="flex items-center gap-1 hover:text-foreground"
            onClick={() => voteHelpful(review.id, true)}
            data-testid="vote-helpful"
          >
            <ThumbsUp size={12} /> {review.helpful_count}
          </button>
          <button
            className="flex items-center gap-1 hover:text-foreground"
            onClick={() => voteHelpful(review.id, false)}
            data-testid="vote-not-helpful"
          >
            <ThumbsDown size={12} /> {review.not_helpful_count}
          </button>
        </div>
      </CardContent>
    </Card>
  );
}

export function ReviewForm({
  ebookId,
  userId,
  userName,
  onSubmitted,
}: {
  ebookId: string;
  userId: string;
  userName: string;
  onSubmitted?: (review: Review) => void;
}) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = useCallback(async () => {
    if (rating === 0 || !comment.trim()) return;
    setSubmitting(true);
    try {
      const review = await submitReview(ebookId, userId, userName, rating, comment);
      setRating(0);
      setComment('');
      onSubmitted?.(review);
    } finally {
      setSubmitting(false);
    }
  }, [rating, comment, ebookId, userId, userName, onSubmitted]);

  return (
    <div className="space-y-3 p-4 border rounded-lg">
      <h4 className="font-medium">Write a Review</h4>
      <StarRating rating={rating} onChange={setRating} interactive />
      <textarea
        className="w-full border rounded p-2 text-sm min-h-[80px]"
        placeholder="Share your thoughts..."
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        data-testid="review-comment"
      />
      <Button onClick={handleSubmit} disabled={submitting || rating === 0 || !comment.trim()} size="sm">
        {submitting ? 'Submitting...' : 'Submit Review'}
      </Button>
    </div>
  );
}

export function ReviewList({ ebookId }: { ebookId: string }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [avgRating, setAvgRating] = useState(0);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const pageSize = 10;

  const load = useCallback(async (p: number) => {
    const result = await getReviews(ebookId, p, pageSize);
    setReviews(result.reviews);
    setAvgRating(result.averageRating);
    setTotal(result.total);
    setPage(p);
    setLoaded(true);
  }, [ebookId]);

  if (!loaded) {
    load(1);
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <StarRating rating={Math.round(avgRating)} size={18} />
        <span className="text-sm text-muted-foreground">
          {avgRating.toFixed(1)} ({total} review{total !== 1 ? 's' : ''})
        </span>
      </div>
      {reviews.map((r) => (
        <ReviewCard key={r.id} review={r} />
      ))}
      {total > pageSize && (
        <div className="flex gap-2 mt-3">
          <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => load(page - 1)}>
            Previous
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={page * pageSize >= total}
            onClick={() => load(page + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}

export { StarRating };
export default ReviewList;
