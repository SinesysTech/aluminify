/**
 * Branding Cache Manager
 * 
 * Provides caching layer for tenant branding data to improve performance.
 * Implements LRU cache with TTL and memory management.
 */

import type { CompleteBrandingConfig } from '@/empresa/personalizacao/services/empresa/personalizacao.types';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
}

interface CacheStats {
  size: number;
  maxSize: number;
  hitRate: number;
  totalHits: number;
  totalMisses: number;
  memoryUsage: number;
}

export class BrandingCacheManager {
  private static instance: BrandingCacheManager;
  private cache: Map<string, CacheEntry<CompleteBrandingConfig>> = new Map();
  private maxSize: number;
  private defaultTTL: number;
  private hitCount: number = 0;
  private missCount: number = 0;
  private cleanupInterval: NodeJS.Timeout | null = null;

  private constructor(maxSize: number = 100, defaultTTL: number = 5 * 60 * 1000) {
    this.maxSize = maxSize;
    this.defaultTTL = defaultTTL; // 5 minutes default TTL
    
    // Start cleanup interval
    this.startCleanupInterval();
  }

  public static getInstance(maxSize?: number, defaultTTL?: number): BrandingCacheManager {
    if (!BrandingCacheManager.instance) {
      BrandingCacheManager.instance = new BrandingCacheManager(maxSize, defaultTTL);
    }
    return BrandingCacheManager.instance;
  }

  /**
   * Get branding configuration from cache
   */
  public get(empresaId: string): CompleteBrandingConfig | null {
    const entry = this.cache.get(empresaId);
    
    if (!entry) {
      this.missCount++;
      return null;
    }

    // Check if entry has expired
    if (this.isExpired(entry)) {
      this.cache.delete(empresaId);
      this.missCount++;
      return null;
    }

    // Update access statistics
    entry.accessCount++;
    entry.lastAccessed = Date.now();
    this.hitCount++;

    return entry.data;
  }

  /**
   * Set branding configuration in cache
   */
  public set(empresaId: string, branding: CompleteBrandingConfig, ttl?: number): void {
    // Ensure we don't exceed max size
    if (!this.cache.has(empresaId)) {
      // Pode existir empate de timestamps (mesmo ms); evict em loop garante que o limite seja respeitado.
      while (this.cache.size >= this.maxSize) {
        const before = this.cache.size;
        this.evictLRU();
        // Segurança contra loop infinito caso algo inesperado impeça a remoção
        if (this.cache.size === before) break;
      }
    }

    const entry: CacheEntry<CompleteBrandingConfig> = {
      data: branding,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL,
      accessCount: 1,
      lastAccessed: Date.now()
    };

    this.cache.set(empresaId, entry);
  }

  /**
   * Remove branding configuration from cache
   */
  public delete(empresaId: string): boolean {
    return this.cache.delete(empresaId);
  }

  /**
   * Check if cache has branding configuration for empresa
   */
  public has(empresaId: string): boolean {
    const entry = this.cache.get(empresaId);
    if (!entry) return false;
    
    if (this.isExpired(entry)) {
      this.cache.delete(empresaId);
      return false;
    }
    
    return true;
  }

  /**
   * Clear all cache entries
   */
  public clear(): void {
    this.cache.clear();
    this.hitCount = 0;
    this.missCount = 0;
  }

  /**
   * Get cache statistics
   */
  public getStats(): CacheStats {
    const totalRequests = this.hitCount + this.missCount;
    const hitRate = totalRequests > 0 ? this.hitCount / totalRequests : 0;
    
    // Estimate memory usage (rough calculation)
    const memoryUsage = this.estimateMemoryUsage();

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate,
      totalHits: this.hitCount,
      totalMisses: this.missCount,
      memoryUsage
    };
  }

  /**
   * Invalidate cache entries for specific empresa
   */
  public invalidate(empresaId: string): void {
    this.cache.delete(empresaId);
  }

  /**
   * Invalidate all expired entries
   */
  public invalidateExpired(): number {
    let removedCount = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (this.isExpired(entry)) {
        this.cache.delete(key);
        removedCount++;
      }
    }
    
    return removedCount;
  }

  /**
   * Preload branding configurations
   */
  public async preload(empresaIds: string[], loader: (empresaId: string) => Promise<CompleteBrandingConfig>): Promise<void> {
    const loadPromises = empresaIds
      .filter(id => !this.has(id))
      .map(async (empresaId) => {
        try {
          const branding = await loader(empresaId);
          this.set(empresaId, branding);
        } catch (error) {
          console.warn(`Failed to preload branding for empresa ${empresaId}:`, error);
        }
      });

    await Promise.all(loadPromises);
  }

  /**
   * Get cache entries sorted by access frequency (for debugging)
   */
  public getEntriesByFrequency(): Array<{ empresaId: string; accessCount: number; lastAccessed: Date }> {
    return Array.from(this.cache.entries())
      .map(([empresaId, entry]) => ({
        empresaId,
        accessCount: entry.accessCount,
        lastAccessed: new Date(entry.lastAccessed)
      }))
      .sort((a, b) => b.accessCount - a.accessCount);
  }

  /**
   * Update cache configuration
   */
  public updateConfig(maxSize?: number, defaultTTL?: number): void {
    if (maxSize !== undefined) {
      this.maxSize = maxSize;
      
      // Evict entries if new max size is smaller
      while (this.cache.size > this.maxSize) {
        this.evictLRU();
      }
    }
    
    if (defaultTTL !== undefined) {
      this.defaultTTL = defaultTTL;
    }
  }

  /**
   * Destroy cache manager and cleanup resources
   */
  public destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    
    this.clear();
  }

  /**
   * Check if cache entry has expired
   */
  private isExpired(entry: CacheEntry<CompleteBrandingConfig>): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }

  /**
   * Evict least recently used entry
   */
  private evictLRU(): void {
    let oldestKey: string | null = null;
    // Use infinito para evitar "empate" com Date.now() no mesmo ms.
    let oldestTime = Number.POSITIVE_INFINITY;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  /**
   * Start periodic cleanup of expired entries
   */
  private startCleanupInterval(): void {
    // Run cleanup every 2 minutes
    this.cleanupInterval = setInterval(() => {
      this.invalidateExpired();
    }, 2 * 60 * 1000);
  }

  /**
   * Estimate memory usage of cache (rough calculation)
   */
  private estimateMemoryUsage(): number {
    let totalSize = 0;
    
    for (const entry of this.cache.values()) {
      // Rough estimation: JSON string length as proxy for memory usage
      totalSize += JSON.stringify(entry.data).length;
    }
    
    return totalSize;
  }
}

/**
 * Utility functions for cache management
 */

/**
 * Create cache key for empresa branding
 */
export function createBrandingCacheKey(empresaId: string): string {
  return `branding:${empresaId}`;
}

/**
 * Create cache key with version for cache invalidation
 */
export function createVersionedCacheKey(empresaId: string, version: string): string {
  return `branding:${empresaId}:${version}`;
}

/**
 * Get singleton instance of branding cache manager
 */
export function getBrandingCacheManager(): BrandingCacheManager {
  return BrandingCacheManager.getInstance();
}

/**
 * Cache decorator for branding operations
 */
export function withBrandingCache<T extends unknown[], R>(
  cacheKey: (...args: T) => string,
  ttl?: number
) {
  return function (target: unknown, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    const cache = getBrandingCacheManager();

    descriptor.value = async function (...args: T): Promise<R> {
      const key = cacheKey(...args);
      
      // Try to get from cache first
      const cached = cache.get(key);
      if (cached) {
        return cached as R;
      }

      // Execute original method
      const result = await method.apply(this, args);
      
      // Cache the result
      if (result) {
        cache.set(key, result, ttl);
      }
      
      return result;
    };
  };
}