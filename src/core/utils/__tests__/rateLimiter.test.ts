import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { rateLimiter } from '../rateLimiter';

describe('RateLimiter', () => {
  beforeEach(() => {
    rateLimiter.clear('test-key');
    rateLimiter.clear('user-1');
    rateLimiter.clear('user-2');
  });

  const defaultOptions = { maxRequests: 3, windowMs: 1000 };

  describe('checkLimit', () => {
    it('should allow requests under the limit', () => {
      expect(rateLimiter.checkLimit('test-key', defaultOptions)).toBe(true);
      expect(rateLimiter.checkLimit('test-key', defaultOptions)).toBe(true);
      expect(rateLimiter.checkLimit('test-key', defaultOptions)).toBe(true);
    });

    it('should block requests over the limit', () => {
      rateLimiter.checkLimit('test-key', defaultOptions);
      rateLimiter.checkLimit('test-key', defaultOptions);
      rateLimiter.checkLimit('test-key', defaultOptions);
      expect(rateLimiter.checkLimit('test-key', defaultOptions)).toBe(false);
    });

    it('should track different keys independently', () => {
      // Exhaust user-1
      for (let i = 0; i < 3; i++) rateLimiter.checkLimit('user-1', defaultOptions);
      expect(rateLimiter.checkLimit('user-1', defaultOptions)).toBe(false);
      // user-2 should still be allowed
      expect(rateLimiter.checkLimit('user-2', defaultOptions)).toBe(true);
    });

    it('should reset after window expires', async () => {
      const shortWindow = { maxRequests: 1, windowMs: 50 };
      rateLimiter.checkLimit('test-key', shortWindow);
      expect(rateLimiter.checkLimit('test-key', shortWindow)).toBe(false);

      await new Promise((r) => setTimeout(r, 60));
      expect(rateLimiter.checkLimit('test-key', shortWindow)).toBe(true);
    });
  });

  describe('getRemaining', () => {
    it('should return max when no requests made', () => {
      expect(rateLimiter.getRemaining('test-key', defaultOptions)).toBe(3);
    });

    it('should decrement remaining after requests', () => {
      rateLimiter.checkLimit('test-key', defaultOptions);
      expect(rateLimiter.getRemaining('test-key', defaultOptions)).toBe(2);
    });

    it('should return 0 when limit exhausted', () => {
      for (let i = 0; i < 3; i++) rateLimiter.checkLimit('test-key', defaultOptions);
      expect(rateLimiter.getRemaining('test-key', defaultOptions)).toBe(0);
    });
  });

  describe('clear', () => {
    it('should reset limit for a key', () => {
      for (let i = 0; i < 3; i++) rateLimiter.checkLimit('test-key', defaultOptions);
      expect(rateLimiter.checkLimit('test-key', defaultOptions)).toBe(false);

      rateLimiter.clear('test-key');
      expect(rateLimiter.checkLimit('test-key', defaultOptions)).toBe(true);
    });
  });

  describe('cleanup', () => {
    it('should remove expired records', async () => {
      const shortWindow = { maxRequests: 1, windowMs: 50 };
      rateLimiter.checkLimit('test-key', shortWindow);
      expect(rateLimiter.getRemaining('test-key', shortWindow)).toBe(0);

      await new Promise((r) => setTimeout(r, 60));
      rateLimiter.cleanup();
      // After cleanup, key is gone so getRemaining returns max
      expect(rateLimiter.getRemaining('test-key', shortWindow)).toBe(1);
    });
  });

  describe('rate limiting scenarios', () => {
    it('should handle ebook generation rate limit (5 per minute)', () => {
      const ebookLimit = { maxRequests: 5, windowMs: 60000 };
      for (let i = 0; i < 5; i++) {
        expect(rateLimiter.checkLimit('ebook-user1', ebookLimit)).toBe(true);
      }
      expect(rateLimiter.checkLimit('ebook-user1', ebookLimit)).toBe(false);
      rateLimiter.clear('ebook-user1');
    });

    it('should handle image generation rate limit (10 per minute)', () => {
      const imageLimit = { maxRequests: 10, windowMs: 60000 };
      for (let i = 0; i < 10; i++) {
        expect(rateLimiter.checkLimit('image-user1', imageLimit)).toBe(true);
      }
      expect(rateLimiter.checkLimit('image-user1', imageLimit)).toBe(false);
      rateLimiter.clear('image-user1');
    });
  });
});
