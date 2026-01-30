/**
 * Rate Limiting Service
 *
 * Provides per-tenant rate limiting using an in-memory sliding window counter
 * with optional persistent quota overrides from the database (tenant_quotas table).
 *
 * Usage:
 * ```typescript
 * import { rateLimitService } from '@/app/shared/core/services/rate-limit/rate-limit.service';
 *
 * const allowed = rateLimitService.checkLimit(empresaId, 'basico');
 * if (!allowed) {
 *   return new Response('Too Many Requests', { status: 429 });
 * }
 *
 * // With persistent quota override from DB:
 * rateLimitService.setQuotaOverride(empresaId, { requests: 300, window: 60 });
 * ```
 */

export type TenantPlan = "basico" | "profissional" | "enterprise";

interface RateLimitConfig {
  /** Maximum number of requests allowed within the window */
  requests: number;
  /** Time window in seconds */
  window: number;
}

interface RateLimitEntry {
  /** Timestamps of recent requests (sliding window) */
  timestamps: number[];
  /** When this entry was last cleaned up */
  lastCleanup: number;
}

const RATE_LIMITS: Record<TenantPlan, RateLimitConfig> = {
  basico: { requests: 100, window: 60 },
  profissional: { requests: 500, window: 60 },
  enterprise: { requests: 2000, window: 60 },
};

/** Default plan when tenant plan is unknown */
const DEFAULT_PLAN: TenantPlan = "basico";

/** Cleanup interval: remove old entries every 5 minutes */
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;

class RateLimitService {
  private store = new Map<string, RateLimitEntry>();
  private lastGlobalCleanup = Date.now();

  /**
   * Per-tenant quota overrides loaded from the tenant_quotas DB table.
   * These take precedence over plan-based defaults.
   */
  private quotaOverrides = new Map<string, RateLimitConfig>();

  /**
   * Set a persistent quota override for a tenant.
   * Call this after loading from the tenant_quotas table.
   */
  setQuotaOverride(empresaId: string, config: RateLimitConfig): void {
    this.quotaOverrides.set(empresaId, config);
  }

  /**
   * Remove a quota override for a tenant.
   */
  clearQuotaOverride(empresaId: string): void {
    this.quotaOverrides.delete(empresaId);
  }

  /**
   * Get the effective rate limit config for a tenant.
   * Quota overrides take precedence over plan-based defaults.
   */
  private getConfig(empresaId: string, plan?: TenantPlan): RateLimitConfig {
    return this.quotaOverrides.get(empresaId) ?? RATE_LIMITS[plan ?? DEFAULT_PLAN];
  }

  /**
   * Check if a request is within the tenant's rate limit.
   *
   * @param empresaId - The tenant identifier
   * @param plan - The tenant's subscription plan (ignored if quota override exists)
   * @returns true if the request is allowed, false if rate limited
   */
  checkLimit(empresaId: string, plan?: TenantPlan): boolean {
    const config = this.getConfig(empresaId, plan);
    const now = Date.now();
    const windowStart = now - config.window * 1000;

    let entry = this.store.get(empresaId);
    if (!entry) {
      entry = { timestamps: [], lastCleanup: now };
      this.store.set(empresaId, entry);
    }

    // Clean old timestamps from this entry
    entry.timestamps = entry.timestamps.filter((t) => t > windowStart);
    entry.lastCleanup = now;

    // Check limit
    if (entry.timestamps.length >= config.requests) {
      return false;
    }

    // Record this request
    entry.timestamps.push(now);

    // Periodic global cleanup
    if (now - this.lastGlobalCleanup > CLEANUP_INTERVAL_MS) {
      this.cleanup();
    }

    return true;
  }

  /**
   * Get current usage info for a tenant.
   *
   * @returns Object with current count and limit, or null if no data
   */
  getUsage(
    empresaId: string,
    plan?: TenantPlan,
  ): { current: number; limit: number; windowSeconds: number } | null {
    const config = this.getConfig(empresaId, plan);
    const entry = this.store.get(empresaId);
    if (!entry) {
      return { current: 0, limit: config.requests, windowSeconds: config.window };
    }

    const windowStart = Date.now() - config.window * 1000;
    const current = entry.timestamps.filter((t) => t > windowStart).length;

    return { current, limit: config.requests, windowSeconds: config.window };
  }

  /**
   * Remove stale entries from the store.
   */
  private cleanup(): void {
    const now = Date.now();
    const staleThreshold = now - 5 * 60 * 1000; // 5 minutes

    for (const [key, entry] of this.store.entries()) {
      if (entry.lastCleanup < staleThreshold && entry.timestamps.length === 0) {
        this.store.delete(key);
      }
    }

    this.lastGlobalCleanup = now;
  }

  /**
   * Reset rate limit for a specific tenant (useful for testing).
   */
  reset(empresaId: string): void {
    this.store.delete(empresaId);
  }

  /**
   * Reset all rate limits (useful for testing).
   */
  resetAll(): void {
    this.store.clear();
    this.quotaOverrides.clear();
  }
}

/** Singleton rate limit service */
export const rateLimitService = new RateLimitService();
