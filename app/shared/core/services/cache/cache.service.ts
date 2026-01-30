/**
 * Cache Service - Serviço genérico de cache usando Redis (Upstash) e LocalStorage
 *
 * Este serviço fornece uma interface simples para cache de dados.
 * No servidor: Usa Redis (se configurado) ou Memória (fallback).
 * No cliente: Usa LocalStorage (persistência) e Memória (velocidade).
 */

import { Redis } from "@upstash/redis";

class CacheService {
  private redis: Redis | null = null;
  private enabled: boolean = false;
  private disabledUntilMs: number | null = null;
  private lastErrorLogMs: number = 0;
  private readonly networkFailureCooldownMs: number = 60_000;
  private readonly errorLogCooldownMs: number = 30_000;
  private readonly storagePrefix = "aluminify:v1:cache:";

  // In-memory fallback
  private memoryCache: Map<string, { value: unknown; expiresAt: number }> =
    new Map();

  constructor() {
    this.initialize();
  }

  private isExplicitlyDisabled(): boolean {
    const value =
      process.env.CACHE_DISABLED || process.env.NEXT_PUBLIC_CACHE_DISABLED;
    return value === "1" || value === "true" || value === "yes";
  }

  private isBrowser(): boolean {
    return typeof window !== "undefined";
  }

  private shouldAttemptRedis(): boolean {
    if (!this.enabled || !this.redis) return false;
    if (this.disabledUntilMs === null) return true;
    if (Date.now() >= this.disabledUntilMs) {
      this.disabledUntilMs = null;
      return true;
    }
    return false;
  }

  private isNetworkLikeError(error: unknown): boolean {
    if (error instanceof TypeError && /fetch failed/i.test(error.message)) {
      return true;
    }

    const maybeCause = (error as { cause?: unknown } | null)?.cause as
      | { code?: string; errno?: number; syscall?: string; hostname?: string }
      | undefined;

    const code = maybeCause?.code;
    if (!code) return false;

    return [
      "ENOTFOUND",
      "EAI_AGAIN",
      "ECONNREFUSED",
      "ETIMEDOUT",
      "ECONNRESET",
    ].includes(code);
  }

  private temporarilyDisableRedis(error: unknown) {
    this.disabledUntilMs = Date.now() + this.networkFailureCooldownMs;

    const now = Date.now();
    if (now - this.lastErrorLogMs >= this.errorLogCooldownMs) {
      this.lastErrorLogMs = now;
      if (!this.isBrowser()) {
        console.warn(
          `[Cache Service] ⚠️ Redis indisponível (usando fallback local por ${Math.round(
            this.networkFailureCooldownMs / 1000,
          )}s):`,
          error,
        );
      }
    }
  }

  private initialize() {
    if (this.isExplicitlyDisabled()) {
      this.enabled = false;
      return;
    }

    // Só tentar Redis no ambiente do servidor
    if (this.isBrowser()) {
      this.enabled = false;
      return;
    }

    const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
    const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (redisUrl && redisToken) {
      try {
        this.redis = new Redis({
          url: redisUrl,
          token: redisToken,
        });
        this.enabled = true;
        console.log("[Cache Service] ✅ Redis configurado - cache habilitado");
      } catch (error) {
        console.error("[Cache Service] ❌ Erro ao configurar Redis:", error);
        this.enabled = false;
      }
    } else {
      this.enabled = false;
    }
  }

  /**
   * Helper to set in memory or localStorage
   */
  private setInLocal(key: string, value: unknown, ttlSeconds: number) {
    const expiresAt = Date.now() + ttlSeconds * 1000;
    const cacheEntry = { value, expiresAt };

    // 1. Memory Cache (Always)
    this.memoryCache.set(key, cacheEntry);

    // 2. LocalStorage (If Browser)
    if (this.isBrowser()) {
      try {
        localStorage.setItem(
          `${this.storagePrefix}${key}`,
          JSON.stringify(cacheEntry),
        );
      } catch {
        // LocalStorage might be full or private mode
      }
    }
  }

  /**
   * Helper to get from memory or localStorage
   */
  private getFromLocal<T>(key: string): T | null {
    // 1. Try Memory First
    let entry = this.memoryCache.get(key);

    // 2. Try LocalStorage if Memory miss
    if (!entry && this.isBrowser()) {
      try {
        const stored = localStorage.getItem(`${this.storagePrefix}${key}`);
        if (stored) {
          entry = JSON.parse(stored);
          if (entry) {
            this.memoryCache.set(key, entry); // Hydrate memory
          }
        }
      } catch {
        return null;
      }
    }

    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.delLocal(key);
      return null;
    }

    return entry.value as T;
  }

  private delLocal(key: string) {
    this.memoryCache.delete(key);
    if (this.isBrowser()) {
      try {
        localStorage.removeItem(`${this.storagePrefix}${key}`);
      } catch {}
    }
  }

  /**
   * Obter valor do cache
   */
  async get<T>(key: string): Promise<T | null> {
    // 1. Tentar Redis se disponível e não estiver no browser
    if (this.shouldAttemptRedis() && this.redis) {
      try {
        const data = await this.redis.get<T>(key);
        if (data !== null) {
          this.recordMetric("hit");
          return data;
        }
        this.recordMetric("miss");
      } catch (error) {
        if (this.isNetworkLikeError(error)) {
          this.recordMetric("error");
          this.temporarilyDisableRedis(error);
          return this.getFromLocal<T>(key);
        }
        this.recordMetric("error");
        return null;
      }
    }

    // 2. Fallback ou principal: Local (Memória ou LocalStorage)
    return this.getFromLocal<T>(key);
  }

  /**
   * Armazenar valor no cache com TTL
   */
  async set(
    key: string,
    value: unknown,
    ttlSeconds: number = 3600,
  ): Promise<void> {
    if (this.shouldAttemptRedis() && this.redis) {
      try {
        await this.redis.setex(key, ttlSeconds, value);
        this.recordMetric("set");
      } catch (error) {
        if (this.isNetworkLikeError(error)) {
          this.recordMetric("error");
          this.temporarilyDisableRedis(error);
        } else {
          this.recordMetric("error");
        }
      }
    }

    // Sempre salvar localmente (browser -> localStorage, server -> memory)
    this.setInLocal(key, value, ttlSeconds);
  }

  /**
   * Deletar chave do cache
   */
  async del(key: string): Promise<void> {
    this.delLocal(key);

    if (this.shouldAttemptRedis() && this.redis) {
      try {
        await this.redis.del(key);
        this.recordMetric("del");
      } catch (error) {
        if (this.isNetworkLikeError(error)) {
          this.recordMetric("error");
          this.temporarilyDisableRedis(error);
        } else {
          this.recordMetric("error");
        }
      }
    }
  }

  /**
   * Deletar múltiplas chaves
   */
  async delMany(keys: string[]): Promise<void> {
    if (keys.length === 0) return;

    keys.forEach((k) => this.delLocal(k));

    if (this.shouldAttemptRedis() && this.redis) {
      try {
        await Promise.all(keys.map((key) => this.redis!.del(key)));
      } catch (error) {
        if (this.isNetworkLikeError(error)) {
          this.recordMetric("error");
          this.temporarilyDisableRedis(error);
        }
      }
    }
  }

  /**
   * Verificar se cache está habilitado (Redis ou Memória)
   */
  isEnabled(): boolean {
    return true; // Local cache sempre disponível
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
   * Limpa todo o cache local (Memory e LocalStorage)
   */
  clearAll(): void {
    this.memoryCache.clear();
    if (this.isBrowser()) {
      try {
        // Remover todas as chaves com nosso prefixo
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key?.startsWith(this.storagePrefix)) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach((k) => localStorage.removeItem(k));
      } catch {
        // LocalStorage might not be accessible
      }
    }
  }

  private async recordMetric(type: "hit" | "miss" | "set" | "del" | "error") {
    if (!this.isBrowser()) {
      try {
        const { cacheMonitorService } = await import("./cache-monitor.service");
        switch (type) {
          case "hit":
            cacheMonitorService.recordHit();
            break;
          case "miss":
            cacheMonitorService.recordMiss();
            break;
          case "set":
            cacheMonitorService.recordSet();
            break;
          case "del":
            cacheMonitorService.recordDel();
            break;
          case "error":
            cacheMonitorService.recordError();
            break;
        }
      } catch {
        // Ignore import errors or monitor errors
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
