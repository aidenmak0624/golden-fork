/**
 * In-Memory Rate Limiter
 *
 * Tracks usage per IP address with a sliding window.
 * Configurable via environment variables:
 *   RATE_LIMIT_MAX_REQUESTS  — max requests per window (default: 20)
 *   RATE_LIMIT_WINDOW_MS     — window duration in ms   (default: 3600000 = 1 hour)
 *
 * Returns remaining quota + reset time so the frontend can show a countdown.
 */

interface RateLimitEntry {
  timestamps: number[];
}

const store = new Map<string, RateLimitEntry>();

// Cleanup stale entries every 10 minutes to prevent memory leaks
const CLEANUP_INTERVAL = 10 * 60 * 1000;
let lastCleanup = Date.now();

function cleanup(windowMs: number) {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;

  for (const [key, entry] of store.entries()) {
    // Remove timestamps outside the window
    entry.timestamps = entry.timestamps.filter((t) => now - t < windowMs);
    if (entry.timestamps.length === 0) {
      store.delete(key);
    }
  }
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  limit: number;
  resetInSeconds: number;
}

/**
 * Check rate limit for a given identifier (usually IP address).
 * If allowed, the request is counted. If not, returns how long to wait.
 */
export function checkRateLimit(identifier: string): RateLimitResult {
  const maxRequests = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '50', 10);
  const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '3600000', 10);
  const now = Date.now();

  // Periodic cleanup
  cleanup(windowMs);

  // Get or create entry
  let entry = store.get(identifier);
  if (!entry) {
    entry = { timestamps: [] };
    store.set(identifier, entry);
  }

  // Remove timestamps outside the current window
  entry.timestamps = entry.timestamps.filter((t) => now - t < windowMs);

  // Calculate reset time (when the oldest request in the window expires)
  const resetInSeconds =
    entry.timestamps.length > 0
      ? Math.ceil((entry.timestamps[0] + windowMs - now) / 1000)
      : 0;

  // Check if under the limit
  if (entry.timestamps.length >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      limit: maxRequests,
      resetInSeconds,
    };
  }

  // Record this request
  entry.timestamps.push(now);

  return {
    allowed: true,
    remaining: maxRequests - entry.timestamps.length,
    limit: maxRequests,
    resetInSeconds,
  };
}

/**
 * Get current usage stats without consuming a request.
 * Useful for the frontend to show remaining quota.
 */
export function getRateLimitStatus(identifier: string): RateLimitResult {
  const maxRequests = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '50', 10);
  const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '3600000', 10);
  const now = Date.now();

  const entry = store.get(identifier);
  if (!entry) {
    return {
      allowed: true,
      remaining: maxRequests,
      limit: maxRequests,
      resetInSeconds: 0,
    };
  }

  // Filter to current window
  const activeTimestamps = entry.timestamps.filter((t) => now - t < windowMs);
  const remaining = Math.max(0, maxRequests - activeTimestamps.length);
  const resetInSeconds =
    activeTimestamps.length > 0
      ? Math.ceil((activeTimestamps[0] + windowMs - now) / 1000)
      : 0;

  return {
    allowed: remaining > 0,
    remaining,
    limit: maxRequests,
    resetInSeconds,
  };
}
