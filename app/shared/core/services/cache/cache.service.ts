/**
 * Cache Service - Cache in-memory com suporte a LocalStorage no browser
 *
 * No servidor: Usa Map em memória (rápido, sem dependência externa).
 * No cliente: Usa LocalStorage (persistência) + memória (velocidade).
 */

class CacheService {
  private readonly storagePrefix = "aluminify:v1:cache:";
  private memoryCache: Map<string, { value: unknown; expiresAt: number }> =
    new Map();

  private isBrowser(): boolean {
    return typeof window !== "undefined";
  }

  private isDisabled(): boolean {
    const value =
      process.env.CACHE_DISABLED || process.env.NEXT_PUBLIC_CACHE_DISABLED;
    return value === "1" || value === "true" || value === "yes";
  }

  /**
   * Obter valor do cache
   */
  async get<T>(key: string): Promise<T | null> {
    if (this.isDisabled()) return null;

    // 1. Try memory first
    let entry = this.memoryCache.get(key);

    // 2. Try localStorage if memory miss (browser only)
    if (!entry && this.isBrowser()) {
      try {
        const stored = localStorage.getItem(`${this.storagePrefix}${key}`);
        if (stored) {
          entry = JSON.parse(stored);
          if (entry) {
            this.memoryCache.set(key, entry);
          }
        }
      } catch {
        return null;
      }
    }

    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.delSync(key);
      return null;
    }

    return entry.value as T;
  }

  /**
   * Armazenar valor no cache com TTL
   */
  async set(
    key: string,
    value: unknown,
    ttlSeconds: number = 3600,
  ): Promise<void> {
    if (this.isDisabled()) return;

    const expiresAt = Date.now() + ttlSeconds * 1000;
    const cacheEntry = { value, expiresAt };

    this.memoryCache.set(key, cacheEntry);

    if (this.isBrowser()) {
      try {
        localStorage.setItem(
          `${this.storagePrefix}${key}`,
          JSON.stringify(cacheEntry),
        );
      } catch {
        // localStorage full or private mode
      }
    }
  }

  /**
   * Deletar chave do cache
   */
  async del(key: string): Promise<void> {
    this.delSync(key);
  }

  private delSync(key: string) {
    this.memoryCache.delete(key);
    if (this.isBrowser()) {
      try {
        localStorage.removeItem(`${this.storagePrefix}${key}`);
      } catch {}
    }
  }

  /**
   * Deletar múltiplas chaves
   */
  async delMany(keys: string[]): Promise<void> {
    keys.forEach((k) => this.delSync(k));
  }

  /**
   * Cache está sempre habilitado (in-memory)
   */
  isEnabled(): boolean {
    return !this.isDisabled();
  }

  /**
   * Obter ou calcular valor (padrão cache-aside)
   */
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlSeconds: number = 3600,
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const value = await fetcher();
    await this.set(key, value, ttlSeconds);
    return value;
  }

  /**
   * Limpa todo o cache
   */
  clearAll(): void {
    this.memoryCache.clear();
    if (this.isBrowser()) {
      try {
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key?.startsWith(this.storagePrefix)) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach((k) => localStorage.removeItem(k));
      } catch {
        // localStorage might not be accessible
      }
    }
  }
}

// Singleton pattern with globalThis for HMR persistence
const globalForCache = globalThis as unknown as { cacheService: CacheService };

export const cacheService = globalForCache.cacheService || new CacheService();

if (process.env.NODE_ENV !== "production") {
  globalForCache.cacheService = cacheService;
}
