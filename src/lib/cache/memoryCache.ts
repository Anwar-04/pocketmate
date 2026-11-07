/**
 * Fast in-memory cache for high-frequency dashboard queries with TTL.
 * Avoids repeated remote database roundtrips on tab switches and re-renders.
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const globalForCache = globalThis as unknown as {
  dashboardCache: Map<string, CacheEntry<unknown>> | undefined;
};

const cache = globalForCache.dashboardCache ?? new Map<string, CacheEntry<unknown>>();
globalForCache.dashboardCache = cache;

const DEFAULT_TTL_MS = 45 * 1000; // 45 seconds

export function getCachedData<T>(key: string, ttlMs = DEFAULT_TTL_MS): T | null {
  const entry = cache.get(key);
  if (!entry) return null;

  const isExpired = Date.now() - entry.timestamp > ttlMs;
  if (isExpired) {
    cache.delete(key);
    return null;
  }

  return entry.data as T;
}

export function setCachedData<T>(key: string, data: T): void {
  cache.set(key, {
    data,
    timestamp: Date.now(),
  });
}

export function invalidateCache(keyPrefix?: string): void {
  if (!keyPrefix) {
    cache.clear();
    return;
  }
  cache.forEach((_, key) => {
    if (key.startsWith(keyPrefix)) {
      cache.delete(key);
    }
  });
}
