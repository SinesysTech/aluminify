/**
 * Simple Cache Implementation
 *
 * A lightweight cache generic class that uses Map for storage with TTL support.
 * Does not implement aggressive LRU to keep complexity low, relying on reasonable TTLs.
 */
export class SimpleCache<T> {
  private cache = new Map<string, { data: T; expires: number }>();

  private readonly storageKey = "aluminify:v1:branding";

  /**
   * Get value from cache
   * Returns null if not found or expired
   */
  get(key: string): T | null {
    const entry = this.cache.get(key);

    if (entry) {
      if (Date.now() > entry.expires) {
        this.invalidate(key);
        return null;
      }
      return entry.data;
    }

    // Try LocalStorage if missing in memory
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(`${this.storageKey}:${key}`);
        if (stored) {
          const storedEntry = JSON.parse(stored);
          if (Date.now() > storedEntry.expires) {
            this.invalidate(key);
            return null;
          }
          this.cache.set(key, storedEntry); // Hydrate memory
          return storedEntry.data;
        }
      } catch {
        return null;
      }
    }

    return null;
  }

  /**
   * Set value in cache with TTL
   * @param ttl Time to live in milliseconds (default: 5 minutes)
   */
  set(key: string, data: T, ttl = 300000) {
    const expires = Date.now() + ttl;
    const entry = { data, expires };

    this.cache.set(key, entry);

    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(
          `${this.storageKey}:${key}`,
          JSON.stringify(entry),
        );
      } catch {}
    }
  }

  /**
   * Invalidate specific key
   */
  invalidate(key: string) {
    this.cache.delete(key);
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem(`${this.storageKey}:${key}`);
      } catch {}
    }
  }

  /**
   * Clear entire cache
   */
  clear() {
    this.cache.clear();
    if (typeof window !== "undefined") {
      try {
        // Clear all keys starting with prefix
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k?.startsWith(this.storageKey)) {
            localStorage.removeItem(k);
          }
        }
      } catch {
        // LocalStorage might not be accessible
      }
    }
  }
}
