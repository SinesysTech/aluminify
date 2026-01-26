import type { CompleteBrandingConfig } from '@/empresa/personalizacao/services/empresa/personalizacao.types';

/**
 * Types of tenant resolution
 */
export type TenantResolutionType = 'subdomain' | 'custom-domain' | 'slug';

/**
 * Result of resolving a tenant from a host/domain
 */
export interface TenantResolution {
  empresaId: string;
  empresaSlug: string;
  empresaNome: string;
  resolutionType: TenantResolutionType;
  branding?: CompleteBrandingConfig;
}

/**
 * Tenant data from database
 */
export interface TenantData {
  id: string;
  nome: string;
  slug: string;
  dominioCustomizado: string | null;
  subdomain: string | null;
  ativo: boolean;
}

/**
 * Configuration for tenant resolution
 */
export interface TenantResolverConfig {
  /** Primary domain (e.g., 'alumnify.com.br') */
  primaryDomain: string;
  /** Development domains to allow (e.g., 'localhost', '127.0.0.1') */
  devDomains: string[];
  /** Cache TTL in milliseconds */
  cacheTtlMs: number;
}

/**
 * Cache entry for resolved tenants
 */
export interface TenantCacheEntry {
  resolution: TenantResolution | null;
  timestamp: number;
}

/**
 * Options for resolving tenant
 */
export interface ResolveTenantOptions {
  /** Include branding data in resolution */
  includeBranding?: boolean;
  /** Skip cache lookup */
  skipCache?: boolean;
}
