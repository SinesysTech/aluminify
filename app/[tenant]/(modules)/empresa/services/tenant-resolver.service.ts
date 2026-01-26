import { SupabaseClient } from '@supabase/supabase-js';
import {
  TenantResolution,
  TenantData,
  TenantResolverConfig,
  TenantCacheEntry,
  ResolveTenantOptions,
} from './tenant-resolver.types';

const DEFAULT_CONFIG: TenantResolverConfig = {
  primaryDomain: process.env.NEXT_PUBLIC_PRIMARY_DOMAIN || 'alumnify.com.br',
  devDomains: ['localhost', '127.0.0.1'],
  cacheTtlMs: 5 * 60 * 1000, // 5 minutes
};

// In-memory cache for tenant resolution
const tenantCache = new Map<string, TenantCacheEntry>();

/**
 * Maps database row to TenantData
 */
function mapRowToTenantData(row: {
  id: string;
  nome: string;
  slug: string;
  dominio_customizado: string | null;
  subdomain: string | null;
  ativo: boolean;
}): TenantData {
  return {
    id: row.id,
    nome: row.nome,
    slug: row.slug,
    dominioCustomizado: row.dominio_customizado,
    subdomain: row.subdomain,
    ativo: row.ativo,
  };
}

/**
 * Service for resolving tenants from host/domain
 */
export class TenantResolverService {
  private config: TenantResolverConfig;

  constructor(
    private readonly client: SupabaseClient,
    config?: Partial<TenantResolverConfig>
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Resolve tenant from host header
   * @param host - The host header value (e.g., 'escola.alumnify.com.br', 'escola.com.br')
   * @param options - Resolution options
   * @returns TenantResolution or null if not found
   */
  async resolveTenantFromHost(
    host: string,
    options: ResolveTenantOptions = {}
  ): Promise<TenantResolution | null> {
    const { includeBranding = false, skipCache = false } = options;

    // Normalize host (remove port if present)
    const normalizedHost = host.split(':')[0].toLowerCase();

    // Check cache first
    if (!skipCache) {
      const cached = this.getCached(normalizedHost);
      if (cached !== undefined) {
        return cached;
      }
    }

    // Try to resolve in order of priority:
    // 1. Custom domain (e.g., escola.com.br)
    // 2. Subdomain (e.g., escola.alumnify.com.br)
    // 3. Dev environment with subdomain pattern

    let resolution: TenantResolution | null = null;

    // Check if it's a custom domain (not a subdomain of primary domain)
    if (!this.isPrimaryDomainOrSubdomain(normalizedHost)) {
      resolution = await this.resolveByCustomDomain(normalizedHost);
    }

    // If not found, try subdomain resolution
    if (!resolution) {
      const subdomain = this.extractSubdomain(normalizedHost);
      if (subdomain) {
        resolution = await this.resolveBySubdomain(subdomain);
      }
    }

    // Cache the result
    this.setCache(normalizedHost, resolution);

    // Load branding if requested and tenant found
    if (resolution && includeBranding) {
      resolution.branding = await this.loadBranding(resolution.empresaId);
    }

    return resolution;
  }

  /**
   * Get tenant by slug
   */
  async getTenantBySlug(slug: string): Promise<TenantResolution | null> {
    const { data, error } = await this.client
      .from('empresas')
      .select('id, nome, slug, dominio_customizado, subdomain, ativo')
      .eq('slug', slug)
      .eq('ativo', true)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    const tenant = mapRowToTenantData(data);

    return {
      empresaId: tenant.id,
      empresaSlug: tenant.slug,
      empresaNome: tenant.nome,
      resolutionType: 'slug',
    };
  }

  /**
   * Get tenant by custom domain
   */
  async getTenantByDomain(domain: string): Promise<TenantResolution | null> {
    return this.resolveByCustomDomain(domain);
  }

  /**
   * Get tenant by subdomain
   */
  async getTenantBySubdomain(subdomain: string): Promise<TenantResolution | null> {
    return this.resolveBySubdomain(subdomain);
  }

  /**
   * Validate if a tenant exists and is active
   */
  async validateTenant(empresaId: string): Promise<boolean> {
    const { data, error } = await this.client
      .from('empresas')
      .select('id')
      .eq('id', empresaId)
      .eq('ativo', true)
      .maybeSingle();

    return !error && !!data;
  }

  /**
   * Invalidate cache for a specific host
   */
  invalidateCache(host: string): void {
    const normalizedHost = host.split(':')[0].toLowerCase();
    tenantCache.delete(normalizedHost);
  }

  /**
   * Clear all cache entries
   */
  clearCache(): void {
    tenantCache.clear();
  }

  // Private methods

  private async resolveByCustomDomain(domain: string): Promise<TenantResolution | null> {
    const { data, error } = await this.client
      .from('empresas')
      .select('id, nome, slug, dominio_customizado, subdomain, ativo')
      .eq('dominio_customizado', domain)
      .eq('ativo', true)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    const tenant = mapRowToTenantData(data);

    return {
      empresaId: tenant.id,
      empresaSlug: tenant.slug,
      empresaNome: tenant.nome,
      resolutionType: 'custom-domain',
    };
  }

  private async resolveBySubdomain(subdomain: string): Promise<TenantResolution | null> {
    // Try by subdomain field first
    let { data, error } = await this.client
      .from('empresas')
      .select('id, nome, slug, dominio_customizado, subdomain, ativo')
      .eq('subdomain', subdomain)
      .eq('ativo', true)
      .maybeSingle();

    // If not found by subdomain field, try by slug
    if (!data) {
      const result = await this.client
        .from('empresas')
        .select('id, nome, slug, dominio_customizado, subdomain, ativo')
        .eq('slug', subdomain)
        .eq('ativo', true)
        .maybeSingle();

      data = result.data;
      error = result.error;
    }

    if (error || !data) {
      return null;
    }

    const tenant = mapRowToTenantData(data);

    return {
      empresaId: tenant.id,
      empresaSlug: tenant.slug,
      empresaNome: tenant.nome,
      resolutionType: 'subdomain',
    };
  }

  private isPrimaryDomainOrSubdomain(host: string): boolean {
    // Check if it's the primary domain or a subdomain of it
    if (host === this.config.primaryDomain) {
      return true;
    }

    if (host.endsWith(`.${this.config.primaryDomain}`)) {
      return true;
    }

    // Check dev domains
    for (const devDomain of this.config.devDomains) {
      if (host === devDomain || host.startsWith(`${devDomain}:`)) {
        return true;
      }
    }

    return false;
  }

  private extractSubdomain(host: string): string | null {
    // For primary domain subdomains (e.g., escola.alumnify.com.br)
    if (host.endsWith(`.${this.config.primaryDomain}`)) {
      const subdomain = host.replace(`.${this.config.primaryDomain}`, '');
      // Ignore www or empty subdomain
      if (subdomain && subdomain !== 'www') {
        return subdomain;
      }
    }

    // For dev domains, check URL query param or first path segment
    // In dev, we might use localhost:3000/tenant-slug format
    for (const devDomain of this.config.devDomains) {
      if (host === devDomain || host.startsWith(devDomain)) {
        // In dev, subdomain resolution happens via slug in path
        return null;
      }
    }

    return null;
  }

  private getCached(host: string): TenantResolution | null | undefined {
    const entry = tenantCache.get(host);
    if (!entry) {
      return undefined;
    }

    // Check if cache is expired
    if (Date.now() - entry.timestamp > this.config.cacheTtlMs) {
      tenantCache.delete(host);
      return undefined;
    }

    return entry.resolution;
  }

  private setCache(host: string, resolution: TenantResolution | null): void {
    tenantCache.set(host, {
      resolution,
      timestamp: Date.now(),
    });
  }

  private async loadBranding(empresaId: string): Promise<TenantResolution['branding']> {
    // Load branding from brand_customizations table
    const { data } = await this.client
      .from('tenant_brand_customizations')
      .select('*')
      .eq('empresa_id', empresaId)
      .maybeSingle();

    if (!data) {
      return undefined;
    }

    // Map to CompleteBrandingConfig - this is a simplified version
    // Full mapping should be done in the brand-customization service
    return data as TenantResolution['branding'];
  }
}

/**
 * Create a tenant resolver service instance
 */
export function createTenantResolver(
  client: SupabaseClient,
  config?: Partial<TenantResolverConfig>
): TenantResolverService {
  return new TenantResolverService(client, config);
}
