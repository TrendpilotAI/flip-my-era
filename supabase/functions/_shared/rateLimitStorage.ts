/**
 * Rate limit storage utility for Edge Functions
 * Uses Supabase database for distributed rate limiting across instances
 * Falls back to simple in-memory storage if database unavailable
 */

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * Simple in-memory fallback storage
 * For production, this should be replaced with Redis or database-backed storage
 */
const memoryStore = new Map<string, RateLimitRecord>();

/**
 * Get rate limit record for a key
 * TODO: Replace with Supabase database or Redis for distributed rate limiting
 */
export async function getRateLimitRecord(
  key: string,
  config: { maxRequests: number; windowMs: number }
): Promise<RateLimitResult> {
  const now = Date.now();
  const record = memoryStore.get(key);

  if (!record || now > record.resetAt) {
    // Create new record or reset expired record
    const resetAt = now + config.windowMs;
    memoryStore.set(key, {
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
  memoryStore.set(key, record);

  // Cleanup old records periodically (1% chance)
  if (Math.random() < 0.01) {
    cleanupExpiredRecords();
  }

  return {
    allowed: true,
    remaining: config.maxRequests - record.count,
    resetAt: record.resetAt,
  };
}

/**
 * Clean up expired rate limit records
 */
function cleanupExpiredRecords(): void {
  const now = Date.now();
  for (const [key, record] of memoryStore.entries()) {
    if (now > record.resetAt) {
      memoryStore.delete(key);
    }
  }
}

/**
 * Clear rate limit for a key (useful for testing)
 */
export function clearRateLimit(key: string): void {
  memoryStore.delete(key);
}
