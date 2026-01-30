/**
 * Cache Service - Serviço genérico de cache usando Redis (Upstash)
 *
 * Este serviço fornece uma interface simples para cache de dados no Redis.
 * Suporta fallback gracioso quando Redis não está configurado.
 */

import { Redis } from "@upstash/redis";

class CacheService {
  private redis: Redis | null = null;
  private enabled: boolean = false;
  private disabledUntilMs: number | null = null;
  private lastErrorLogMs: number = 0;
  private readonly networkFailureCooldownMs: number = 60_000;
  private readonly errorLogCooldownMs: number = 30_000;

  // In-memory fallback
  private memoryCache: Map<string, { value: any; expiresAt: number }> =
    new Map();

  constructor() {
    this.initialize();
  }

  private isExplicitlyDisabled(): boolean {
    const value = process.env.CACHE_DISABLED;
    return value === "1" || value === "true" || value === "yes";
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
    // Upstash client uses fetch under the hood; failures often come as TypeError('fetch failed')
    // with a nested `cause` containing Node.js network codes like ENOTFOUND.
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
    // Fail-open: cache becomes a no-op temporarily (or falls back to memory), system keeps working.
    this.disabledUntilMs = Date.now() + this.networkFailureCooldownMs;

    const now = Date.now();
    if (now - this.lastErrorLogMs >= this.errorLogCooldownMs) {
      this.lastErrorLogMs = now;
      console.warn(
        `[Cache Service] ⚠️ Redis indisponível (usando fallback em memória por ${Math.round(
          this.networkFailureCooldownMs / 1000,
        )}s):`,
        error,
      );
    }
  }

  private initialize() {
    if (this.isExplicitlyDisabled()) {
      this.enabled = false;
      if (process.env.NODE_ENV === "development") {
        console.debug(
          "[Cache Service] ⚠️ CACHE_DISABLED ativo - cache desabilitado",
        );
      }
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
        console.warn(
          "[Cache Service] ⚠️ Usando cache em memória como fallback",
        );
        this.enabled = false;
        // Even if Redis setup fails, we consider the service "enabled" for the sake of using memory cache?
        // Or we treat "enabled" as "Redis enabled"? The logic below uses !this.redis to fallback.
      }
    } else {
      if (process.env.NODE_ENV === "development") {
        console.debug(
          "[Cache Service] ⚠️ Redis não configurado - usando cache em memória",
        );
      }
      this.enabled = false; // Redis is disabled, but we will use memory
    }
  }

  /**
   * Helper to set in memory
   */
  private setInMemory(key: string, value: any, ttlSeconds: number) {
    this.memoryCache.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  /**
   * Helper to get from memory
   */
  private getInMemory<T>(key: string): T | null {
    const item = this.memoryCache.get(key);
    if (!item) return null;

    if (Date.now() > item.expiresAt) {
      this.memoryCache.delete(key);
      return null;
    }

    return item.value as T;
  }

  /**
   * Obter valor do cache
   */
  async get<T>(key: string): Promise<T | null> {
    // 1. Tentar Redis se disponível
    if (this.shouldAttemptRedis() && this.redis) {
      try {
        const data = await this.redis.get<T>(key);
        if (data !== null) {
          console.log(`[Cache] ✅ Hit (Redis): ${key}`);
          this.recordMetric("hit");
          return data;
        }
        // Se não achou no Redis, não temos, ok.
        this.recordMetric("miss");
      } catch (error) {
        if (this.isNetworkLikeError(error)) {
          this.recordMetric("error");
          this.temporarilyDisableRedis(error);
          // Fallback para memória após erro de rede?
          return this.getInMemory<T>(key);
        }

        console.error(`[Cache] ❌ Erro ao ler chave ${key}:`, error);
        this.recordMetric("error");
        // Fallback on unexpected error too? Safer to return null usually, but for consistency maybe memory?
        // Let's stick to null for non-network errors to be safe, or just return null.
        return null;
      }
    }

    // 2. Fallback: Memória (se Redis não configurado ou temporariamente desabilitado)
    const memData = this.getInMemory<T>(key);
    if (memData !== null) {
      console.log(`[Cache] ✅ Hit (Memória): ${key}`);
      return memData;
    }

    return null;
  }

  /**
   * Armazenar valor no cache com TTL
   */
  async set(
    key: string,
    value: unknown,
    ttlSeconds: number = 3600,
  ): Promise<void> {
    // Sempre salvar em memória também (write-through) ou apenas como fallback?
    // Como é fallback, salvamos na memória APENAS se Redis não for usado.
    // Mas se o Redis cair, é bom ter os dados mais recentes?
    // Vamos simplificar: Se Redis OK -> Redis. Se Redis Ruim -> Memória.

    if (this.shouldAttemptRedis() && this.redis) {
      try {
        await this.redis.setex(key, ttlSeconds, value);
        console.log(`[Cache] 💾 Set (Redis): ${key} (TTL: ${ttlSeconds}s)`);
        this.recordMetric("set");
        return;
      } catch (error) {
        if (this.isNetworkLikeError(error)) {
          this.recordMetric("error");
          this.temporarilyDisableRedis(error);
          // Fallback to memory write
        } else {
          console.error(`[Cache] ❌ Erro ao escrever chave ${key}:`, error);
          this.recordMetric("error");
          return;
        }
      }
    }

    // Fallback or No Redis
    this.setInMemory(key, value, ttlSeconds);
    console.log(`[Cache] 💾 Set (Memória): ${key} (TTL: ${ttlSeconds}s)`);
  }

  /**
   * Deletar chave do cache
   */
  async del(key: string): Promise<void> {
    this.memoryCache.delete(key); // Sempre limpar da memória local

    if (this.shouldAttemptRedis() && this.redis) {
      try {
        await this.redis.del(key);
        console.log(`[Cache] 🗑️ Del (Redis): ${key}`);
        this.recordMetric("del");
      } catch (error) {
        if (this.isNetworkLikeError(error)) {
          this.recordMetric("error");
          this.temporarilyDisableRedis(error);
        } else {
          console.error(`[Cache] ❌ Erro ao deletar chave ${key}:`, error);
          this.recordMetric("error");
        }
      }
      return;
    }

    console.log(`[Cache] 🗑️ Del (Memória): ${key}`);
  }

  /**
   * Deletar múltiplas chaves
   */
  async delMany(keys: string[]): Promise<void> {
    if (keys.length === 0) return;

    // Limpar memória
    keys.forEach((k) => this.memoryCache.delete(k));

    if (this.shouldAttemptRedis() && this.redis) {
      try {
        await Promise.all(keys.map((key) => this.redis!.del(key)));
        console.log(`[Cache] 🗑️ Del Many (Redis): ${keys.length} chaves`);
      } catch (error) {
        if (this.isNetworkLikeError(error)) {
          this.recordMetric("error");
          this.temporarilyDisableRedis(error);
        } else {
          console.error(`[Cache] ❌ Erro ao deletar múltiplas chaves:`, error);
        }
      }
    }
  }

  /**
   * Verificar se cache está habilitado (Redis ou Memória)
   */
  isEnabled(): boolean {
    return this.enabled || true; // Agora sempre "ativo" via memória, a menos que explicitamente disabled via env? Use isExplicitlyDisabled check logic again if needed, but initialize handles it.
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

    console.log(`[Cache] ❌ Miss: ${key}`);
    const value = await fetcher();
    await this.set(key, value, ttlSeconds);
    return value;
  }

  private async recordMetric(type: "hit" | "miss" | "set" | "del" | "error") {
    if (typeof window === "undefined") {
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
      } catch (e) {
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
