import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getPublicSupabaseConfig } from "./supabase-public-env";

// Configuration for tenant resolution
const PRIMARY_DOMAIN =
  process.env.NEXT_PUBLIC_PRIMARY_DOMAIN || "alumnify.com.br";
const DEV_DOMAINS = ["localhost", "127.0.0.1"];

// --- LOGGING CONFIGURATION ---
type LogLevel = "debug" | "info" | "warn" | "error" | "none";
const LOG_LEVEL: LogLevel =
  (process.env.LOG_LEVEL as LogLevel) ||
  (process.env.NODE_ENV === "development" ? "info" : "warn");

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  none: 4,
};

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[LOG_LEVEL];
}

function logDebug(message: string, ...args: unknown[]) {
  if (shouldLog("debug")) {
    console.log(`[MW:debug] ${message}`, ...args);
  }
}

function logInfo(message: string) {
  if (shouldLog("info")) {
    console.log(`[MW] ${message}`);
  }
}

function logWarn(message: string) {
  if (shouldLog("warn")) {
    console.warn(`[MW] ${message}`);
  }
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
function extractSubdomain(host: string): string | null {
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
function isCustomDomain(host: string): boolean {
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
function isTenantPath(pathname: string): boolean {
  // Match paths like /tenant-slug/... but not paths that start with known routes
  const knownRoutes = [
    "/api",
    "/auth",
    "/_next",
    "/dashboard",
    "/admin",
    "/superadmin",
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
function extractTenantFromPath(pathname: string): string | null {
  if (isTenantPath(pathname)) {
    const segments = pathname.split("/").filter(Boolean);
    if (segments.length > 0) {
      return segments[0];
    }
  }
  return null;
}

export interface TenantContext {
  empresaId?: string;
  empresaSlug?: string;
  empresaNome?: string;
  resolutionType?: "subdomain" | "custom-domain" | "slug";
}

function getSupabaseProjectRefFromUrl(url: string): string | null {
  try {
    const u = new URL(url);
    // ex: https://wtqgfmtucqmpheghcvxo.supabase.co
    const host = u.host.toLowerCase();
    const suffix = ".supabase.co";
    if (host.endsWith(suffix)) {
      const ref = host.slice(0, -suffix.length);
      return ref || null;
    }
    return null;
  } catch {
    return null;
  }
}

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const host = request.headers.get("host") || "";

  const accept = request.headers.get("accept") || "";
  const isNextInternalPath =
    pathname === "/favicon.ico" ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/static") ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    pathname === "/manifest.json";
  const isApiRoute = pathname === "/api" || pathname.startsWith("/api/");
  // Next.js App Router signals
  const isServerAction =
    request.method === "POST" && !!request.headers.get("next-action");
  const isRscRequest =
    request.headers.get("rsc") === "1" || accept.includes("text/x-component");
  const isNextDataRequest = request.headers.get("x-nextjs-data") === "1";
  const isHtmlNavigation =
    request.method === "GET" &&
    accept.includes("text/html") &&
    !isRscRequest &&
    !isNextDataRequest &&
    !isApiRoute;

  // Debug Logging (Controlled) - cookies removidos por segurança
  logDebug(`${request.method} ${pathname} host:${host}`);

  // --- 1. EARLY EXIT FOR PUBLIC / STATIC ASSETS ---
  // Avoid any processing for internal Next.js paths
  if (isNextInternalPath) {
    return NextResponse.next();
  }

  // List of public paths that don't need authentication
  // We define this early to allow skipping heavy logic
  const basePublicPaths = [
    "/login",
    "/auth",
    "/auth/login",
    "/auth/sign-up",
    "/api/auth/signup-with-empresa",
    "/api/admin/fix-permissions",
    "/api/tobias/chat/attachments",
    "/api/health",
    "/",
    "/signup",
    "/features.html",
    "/pricing.html",
    "/docs.html",
    "/open-source.html",
    "/roadmap.html",
    "/changelog.html",
    "/status.html",
  ];

  // Check if it matches a known public base path
  const isBasePublicPath = basePublicPaths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );

  // Check if it matches a tenant public path pattern (e.g. /slug/auth/...)
  // We do this via regex/pattern extraction to avoid needing DB resolution first.
  let isTenantPublicPattern = false;
  const pathSlug = extractTenantFromPath(pathname);
  if (pathSlug) {
    const tenantPublicPrefixes = [`/${pathSlug}/auth`];
    isTenantPublicPattern = tenantPublicPrefixes.some(
      (path) => pathname === path || pathname.startsWith(`${path}/`),
    );
  }

  const isLikelyPublic = isBasePublicPath || isTenantPublicPattern;

  let supabaseResponse = NextResponse.next({
    request,
  });

  const { url, anonKey } = getPublicSupabaseConfig();

  // Cookie cleaning logic (Cross-project safety)
  const projectRef = getSupabaseProjectRefFromUrl(url);
  if (projectRef) {
    const expectedPrefix = `sb-${projectRef}-auth-token`;
    const allCookies = request.cookies.getAll();
    const foreignCookies = allCookies.filter(
      (c) =>
        c.name.startsWith("sb-") &&
        c.name.includes("-auth-token") &&
        !c.name.startsWith(expectedPrefix),
    );

    if (foreignCookies.length > 0) {
      logDebug("removendo cookies Supabase de outro projeto", {
        expectedPrefix,
        foreign: foreignCookies.map((c) => c.name),
      });

      for (const c of foreignCookies) {
        request.cookies.delete(c.name);
        supabaseResponse.cookies.set(c.name, "", { path: "/", maxAge: 0 });
      }
    }
  }

  // Create lightweight client
  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
      },
    },
  });

  // --- 2. TENANT RESOLUTION (WITH CACHE) ---
  let tenantContext: TenantContext = {};

  // Cache key combines host and the first path segment (potential slug)
  // This handles both subdomain/custom domain calls and path-based slug calls
  const potentialSlug = pathname.split("/")[1] || "";
  const cacheKey = `tenant:${host}:${potentialSlug}`;

  const cachedTenant = getCachedTenant(cacheKey);

  if (cachedTenant) {
    tenantContext = cachedTenant;
  } else {
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
        logDebug(
          `tenant resolved: ${tenantContext.empresaSlug} (${tenantContext.resolutionType})`,
        );
      }
    }
  }

  // Helper to sync cookies/headers
  const copyCookiesAndHeaders = (target: NextResponse) => {
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      target.cookies.set(cookie.name, cookie.value);
    });
    if (tenantContext.empresaId) {
      target.headers.set("x-tenant-id", tenantContext.empresaId);
      target.headers.set("x-tenant-slug", tenantContext.empresaSlug!);
      if (tenantContext.empresaNome) {
        target.headers.set(
          "x-tenant-name",
          encodeURIComponent(tenantContext.empresaNome),
        );
      }
      if (tenantContext.resolutionType) {
        target.headers.set("x-tenant-resolution", tenantContext.resolutionType);
      }
    }
    return target;
  };

  // --- 3. PUBLIC PATH CHECK ---
  // Re-verify public path status with resolved tenant context (if any)
  // This allows logic like `/${tenant}/auth` to be correctly whitelistd even if strict per-tenant check matches.

  const publicPaths = [...basePublicPaths];
  if (tenantContext.empresaSlug) {
    publicPaths.push(`/${tenantContext.empresaSlug}/auth`);
    publicPaths.push(`/${tenantContext.empresaSlug}/auth/login`);
    publicPaths.push(`/${tenantContext.empresaSlug}/auth/sign-up`);
  }

  const isPublicPath = publicPaths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );

  // --- 4. AUTHENTICATION (PROTECTED ROUTES ONLY) ---
  let user = null;
  let error = null;

  if (!isPublicPath) {
    const result = await supabase.auth.getUser();
    user = result.data.user;
    error = result.error;
  }

  // --- 5. REDIRECTS & REWRITES ---

  // Handle tenant-specific login redirects
  if (tenantContext.empresaId && tenantContext.resolutionType !== "slug") {
    if (pathname === "/auth" || pathname === "/auth/login") {
      const url = request.nextUrl.clone();
      url.pathname = `/${tenantContext.empresaSlug}/auth/login`;
      logInfo(`rewrite /auth → ${url.pathname}`);

      const response = NextResponse.rewrite(url);
      response.headers.set("x-tenant-id", tenantContext.empresaId);
      response.headers.set("x-tenant-slug", tenantContext.empresaSlug!);
      if (tenantContext.empresaNome) {
        response.headers.set(
          "x-tenant-name",
          encodeURIComponent(tenantContext.empresaNome),
        );
      }

      supabaseResponse.cookies.getAll().forEach((cookie) => {
        response.cookies.set(cookie.name, cookie.value);
      });

      return response;
    }
  }

  // Handle Unauthenticated
  if ((!user || error) && !isPublicPath) {
    if (isNextInternalPath) return supabaseResponse;

    if (
      !isHtmlNavigation ||
      isApiRoute ||
      isRscRequest ||
      isServerAction ||
      isNextDataRequest
    ) {
      logWarn(`${request.method} ${pathname} → 401 unauthorized`);
      const response = NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
      response.headers.set("cache-control", "no-store");
      return copyCookiesAndHeaders(response);
    }

    const url = request.nextUrl.clone();
    if (tenantContext.empresaSlug) {
      url.pathname = `/${tenantContext.empresaSlug}/auth/login`;
    } else {
      url.pathname = "/auth";
    }
    logInfo(`${request.method} ${pathname} → 302 redirect (no auth)`);
    return copyCookiesAndHeaders(NextResponse.redirect(url));
  }

  // Add headers
  if (tenantContext.empresaId) {
    supabaseResponse.headers.set("x-tenant-id", tenantContext.empresaId);
    supabaseResponse.headers.set("x-tenant-slug", tenantContext.empresaSlug!);
    if (tenantContext.empresaNome) {
      supabaseResponse.headers.set(
        "x-tenant-name",
        encodeURIComponent(tenantContext.empresaNome),
      );
    }
    if (tenantContext.resolutionType) {
      supabaseResponse.headers.set(
        "x-tenant-resolution",
        tenantContext.resolutionType,
      );
    }
  }

  return supabaseResponse;
}
