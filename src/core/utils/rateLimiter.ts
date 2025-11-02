/**
 * Client-side rate limiting utility
 * Note: Server-side rate limiting should be implemented in Edge Functions
 */

interface RateLimitOptions {
  maxRequests: number;
  windowMs: number;
}

interface RequestRecord {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private requests: Map<string, RequestRecord> = new Map();

  /**
   * Check if a request should be rate limited
   * @param key Unique identifier for the rate limit (e.g., user ID, IP address)
   * @param options Rate limit configuration
   * @returns true if request should be allowed, false if rate limited
   */
  checkLimit(key: string, options: RateLimitOptions): boolean {
    const now = Date.now();
    const record = this.requests.get(key);

    if (!record || now > record.resetTime) {
      // Create new record or reset expired record
      this.requests.set(key, {
        count: 1,
        resetTime: now + options.windowMs,
      });
      return true;
    }

    if (record.count >= options.maxRequests) {
      return false; // Rate limited
    }

    // Increment count
    record.count++;
    return true;
  }

  /**
   * Get remaining requests for a key
   */
  getRemaining(key: string, options: RateLimitOptions): number {
    const record = this.requests.get(key);
    if (!record) {
      return options.maxRequests;
    }
    return Math.max(0, options.maxRequests - record.count);
  }

  /**
   * Clear rate limit for a key
   */
  clear(key: string): void {
    this.requests.delete(key);
  }

  /**
   * Clean up expired records (should be called periodically)
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, record] of this.requests.entries()) {
      if (now > record.resetTime) {
        this.requests.delete(key);
      }
    }
  }
}

export const rateLimiter = new RateLimiter();

// Cleanup expired records every 5 minutes
if (typeof window !== 'undefined') {
  setInterval(() => {
    rateLimiter.cleanup();
  }, 5 * 60 * 1000);
}
