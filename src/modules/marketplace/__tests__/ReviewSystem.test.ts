import { describe, it, expect, beforeEach } from 'vitest';
import { submitReview, getReviews, voteHelpful, resetReviewStore } from '../ReviewSystem';

describe('ReviewSystem', () => {
  beforeEach(() => {
    resetReviewStore();
  });

  it('submits and retrieves reviews', async () => {
    await submitReview('ebook-1', 'user-1', 'Alice', 5, 'Amazing!');
    await submitReview('ebook-1', 'user-2', 'Bob', 3, 'Decent.');
    
    const result = await getReviews('ebook-1');
    expect(result.total).toBe(2);
    expect(result.averageRating).toBe(4);
    expect(result.reviews).toHaveLength(2);
  });

  it('clamps rating to 1-5', async () => {
    const r = await submitReview('ebook-1', 'user-1', 'Alice', 10, 'Test');
    expect(r.rating).toBe(5);
  });

  it('paginates reviews', async () => {
    for (let i = 0; i < 15; i++) {
      await submitReview('ebook-1', `user-${i}`, `User ${i}`, 4, `Review ${i}`);
    }
    const page1 = await getReviews('ebook-1', 1, 10);
    expect(page1.reviews).toHaveLength(10);
    expect(page1.total).toBe(15);

    const page2 = await getReviews('ebook-1', 2, 10);
    expect(page2.reviews).toHaveLength(5);
  });

  it('votes helpful/not helpful', async () => {
    const review = await submitReview('ebook-1', 'user-1', 'Alice', 5, 'Great!');
    await voteHelpful(review.id, true);
    await voteHelpful(review.id, true);
    await voteHelpful(review.id, false);

    const result = await getReviews('ebook-1');
    expect(result.reviews[0].helpful_count).toBe(2);
    expect(result.reviews[0].not_helpful_count).toBe(1);
  });
});
