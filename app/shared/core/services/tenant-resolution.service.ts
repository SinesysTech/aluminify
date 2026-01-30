import { type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/app/shared/core/database.types";

// Configuration for tenant resolution
const PRIMARY_DOMAIN =
  process.env.NEXT_PUBLIC_PRIMARY_DOMAIN || "alumnify.com.br";
const DEV_DOMAINS = ["localhost", "127.0.0.1"];

export interface TenantContext {
  empresaId?: string;
  empresaSlug?: string;
  empresaNome?: string;
  resolutionType?: "subdomain" | "custom-domain" | "slug";
}

interface CachedTenant {
  ctx: TenantContext;
  expiresAt: number;
}

// Simple in-memory cache for tenant resolution
// Map<key, {ctx, expiresAt}>
const TENANT_CACHE = new Map<string, CachedTenant>();
const CACHE_TTL = 1000 * 60; // 1 minute
const MAX_CACHE_SIZE = 1000;

function getCachedTenant(key: string): TenantContext | null {
  const cached = TENANT_CACHE.get(key);
  if (cached) {
    if (Date.now() < cached.expiresAt) {
      return cached.ctx;
    }
    TENANT_CACHE.delete(key);
  }
  return null;
}

function setCachedTenant(key: string, ctx: TenantContext) {
  if (TENANT_CACHE.size >= MAX_CACHE_SIZE) {
    TENANT_CACHE.clear(); // Simple eviction strategy
  }
  TENANT_CACHE.set(key, { ctx, expiresAt: Date.now() + CACHE_TTL });
}

/**
 * Extract subdomain from host
 */
export function extractSubdomain(host: string): string | null {
  // Normalize host (remove port if present)
  const normalizedHost = host.split(":")[0].toLowerCase();

  // For primary domain subdomains (e.g., escola.alumnify.com.br)
  if (normalizedHost.endsWith(`.${PRIMARY_DOMAIN}`)) {
    const subdomain = normalizedHost.replace(`.${PRIMARY_DOMAIN}`, "");
    // Ignore www or empty subdomain
    if (subdomain && subdomain !== "www") {
      return subdomain;
    }
  }

  return null;
}

/**
 * Check if host is a custom domain (not primary or dev domain)
 */
export function isCustomDomain(host: string): boolean {
  const normalizedHost = host.split(":")[0].toLowerCase();

  // Check if it's the primary domain or subdomain
  if (
    normalizedHost === PRIMARY_DOMAIN ||
    normalizedHost.endsWith(`.${PRIMARY_DOMAIN}`)
  ) {
    return false;
  }

  // Check dev domains
  for (const devDomain of DEV_DOMAINS) {
    if (normalizedHost === devDomain || normalizedHost.startsWith(devDomain)) {
      return false;
    }
  }

  return true;
}

/**
 * Check if path matches tenant route pattern
 */
export function isTenantPath(pathname: string): boolean {
  // Match paths like /tenant-slug/... but not paths that start with known routes
  const knownRoutes = [
    "/api",
    "/auth",
    "/_next",
    "/dashboard",
    "/admin",
    "/aluno",
    "/professor",
    "/static",
    "/favicon",
  ];

  for (const route of knownRoutes) {
    if (pathname === route || pathname.startsWith(`${route}/`)) {
      return false;
    }
  }

  // Check if first segment looks like a tenant slug
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length > 0) {
    // Tenant slugs are alphanumeric with hyphens
    const firstSegment = segments[0];
    return /^[a-z0-9-]+$/.test(firstSegment);
  }

  return false;
}

/**
 * Extract tenant slug from URL path
 */
export function extractTenantFromPath(pathname: string): string | null {
  if (isTenantPath(pathname)) {
    const segments = pathname.split("/").filter(Boolean);
    if (segments.length > 0) {
      return segments[0];
    }
  }
  return null;
}

/**
 * Resolve tenant context based on host and pathname.
 * Uses caching and database lookups.
 */
export async function resolveTenantContext(
  supabase: SupabaseClient<Database>,
  host: string,
  pathname: string,
  isLikelyPublic: boolean,
): Promise<TenantContext> {
  let tenantContext: TenantContext = {};

  // Cache key combines host and the first path segment (potential slug)
  // This handles both subdomain/custom domain calls and path-based slug calls
  const potentialSlug = pathname.split("/")[1] || "";
  const cacheKey = `tenant:${host}:${potentialSlug}`;

  const cachedTenant = getCachedTenant(cacheKey);

  if (cachedTenant) {
    return cachedTenant;
  }

  // Only query DB if we are NOT on a likely public route, OR if we really need to know (e.g. login rewrite).
  // The prompt explicitly asks to "avoid consultas... em rotas públicas".
  // However, if we are at /auth/login (public), we might need to rewrite it.
  // Compromise: We skip DB if isLikelyPublic is true AND it's not a root-level auth/login that needs rewriting.

  // We force lookup if it's a generic /auth path pending rewrite, otherwise we respect the public optimization.
  const needsRewriteConfirmation =
    (pathname === "/auth" || pathname === "/auth/login") &&
    !pathname.startsWith("/api");
  const safeToSkipDb = isLikelyPublic && !needsRewriteConfirmation;

  if (!safeToSkipDb) {
    // Perform DB Lookups
    if (isCustomDomain(host)) {
      const { data: empresaData } = await supabase
        .from("empresas")
        .select("id, slug, nome")
        .eq("dominio_customizado", host.split(":")[0].toLowerCase())
        .eq("ativo", true)
        .maybeSingle();

      if (empresaData) {
        tenantContext = {
          empresaId: empresaData.id,
          empresaSlug: empresaData.slug,
          empresaNome: empresaData.nome,
          resolutionType: "custom-domain",
        };
      }
    }

    if (!tenantContext.empresaId) {
      const subdomain = extractSubdomain(host);
      if (subdomain) {
        const { data: empresaData } = await supabase
          .from("empresas")
          .select("id, slug, nome")
          .or(`subdomain.eq.${subdomain},slug.eq.${subdomain}`)
          .eq("ativo", true)
          .maybeSingle();

        if (empresaData) {
          tenantContext = {
            empresaId: empresaData.id,
            empresaSlug: empresaData.slug,
            empresaNome: empresaData.nome,
            resolutionType: "subdomain",
          };
        }
      }
    }

    if (!tenantContext.empresaId) {
      const tenantSlug = extractTenantFromPath(pathname);
      if (tenantSlug) {
        const { data: empresaData } = await supabase
          .from("empresas")
          .select("id, slug, nome")
          .eq("slug", tenantSlug)
          .eq("ativo", true)
          .maybeSingle();

        if (empresaData) {
          tenantContext = {
            empresaId: empresaData.id,
            empresaSlug: empresaData.slug,
            empresaNome: empresaData.nome,
            resolutionType: "slug",
          };
        }
      }
    }

    if (tenantContext.empresaId) {
      setCachedTenant(cacheKey, tenantContext);
    }
  }

  return tenantContext;
}
