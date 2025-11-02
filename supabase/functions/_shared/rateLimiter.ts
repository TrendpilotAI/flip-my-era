/**
 * Server-side rate limiting utility for Edge Functions
 * Implements token bucket algorithm for fair rate limiting
 */

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  userId?: string;
  ipAddress?: string;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * Simple in-memory rate limiter for Edge Functions
 * Note: For production, consider using Redis or Supabase Edge Config for distributed rate limiting
 */
class ServerRateLimiter {
  private requests: Map<string, { count: number; resetAt: number }> = new Map();
  
  /**
   * Check if request should be allowed
   */
  checkLimit(config: RateLimitConfig): RateLimitResult {
    const key = this.getKey(config);
    const now = Date.now();
    const record = this.requests.get(key);
    
    // Cleanup expired records periodically
    if (Math.random() < 0.01) { // 1% chance to cleanup
      this.cleanup();
    }
    
    if (!record || now > record.resetAt) {
      // Create new record or reset expired record
      const resetAt = now + config.windowMs;
      this.requests.set(key, {
        count: 1,
        resetAt,
      });
      return {
        allowed: true,
        remaining: config.maxRequests - 1,
        resetAt,
      };
    }
    
    if (record.count >= config.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: record.resetAt,
      };
    }
    
    // Increment count
    record.count++;
    return {
      allowed: true,
      remaining: config.maxRequests - record.count,
      resetAt: record.resetAt,
    };
  }
  
  /**
   * Get rate limit key from config
   */
  private getKey(config: RateLimitConfig): string {
    if (config.userId) {
      return `user:${config.userId}`;
    }
    if (config.ipAddress) {
      return `ip:${config.ipAddress}`;
    }
    return 'global';
  }
  
  /**
   * Clean up expired records
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, record] of this.requests.entries()) {
      if (now > record.resetAt) {
        this.requests.delete(key);
      }
    }
  }
  
  /**
   * Clear rate limit for a key (useful for testing)
   */
  clear(key: string): void {
    this.requests.delete(key);
  }
}

export const serverRateLimiter = new ServerRateLimiter();

/**
 * Rate limit configuration constants
 */
export const RATE_LIMITS = {
  // Groq API calls: 60 requests per minute per user
  GROQ_API: {
    maxRequests: 60,
    windowMs: 60000, // 1 minute
  },
  // Storyline generation: 10 requests per hour per user
  STORYLINE_GENERATION: {
    maxRequests: 10,
    windowMs: 3600000, // 1 hour
  },
  // Image generation: 30 requests per minute per user
  IMAGE_GENERATION: {
    maxRequests: 30,
    windowMs: 60000, // 1 minute
  },
  // Default rate limit
  DEFAULT: {
    maxRequests: 100,
    windowMs: 60000, // 1 minute
  },
} as const;
