import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { deflate, inflate } from "pako";
import { getPublicSupabaseConfig } from "./supabase-public-env";
import {
  resolveTenantContext,
  extractTenantFromPath,
} from "@/app/shared/core/services/tenant-resolution.service";

function base64Encode(input: string): string {
  try {
    return btoa(input);
  } catch {
    // Fallback (ex.: em ambientes que não expõem btoa)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (globalThis as any).Buffer.from(input, "utf-8").toString("base64");
  }
}

function base64Decode(input: string): string {
  try {
    return atob(input);
  } catch {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (globalThis as any).Buffer.from(input, "base64").toString("utf-8");
  }
}

function compressCookieValue(value: string): string {
  // Prefixo para identificar facilmente valores comprimidos
  const compressed = deflate(value);
  const bytes = new Uint8Array(compressed);
  let binary = "";
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return `pako:${base64Encode(binary)}`;
}

function decompressCookieValue(value: string): string {
  if (!value.startsWith("pako:")) return value;
  const payload = value.slice("pako:".length);
  const binary = base64Decode(payload);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return inflate(bytes, { to: "string" });
}

function shouldCompressCookie(name: string, value: string): boolean {
  // Foco nos cookies grandes do Supabase, que tendem a estourar buffers de header
  if (!name.startsWith("sb-") || !name.includes("-auth-token")) return false;
  // Threshold conservador (bytes aproximados)
  return value.length >= 1024;
}

function buildCookieHeader(cookies: Array<{ name: string; value: string }>): string {
  return cookies.map((c) => `${c.name}=${c.value}`).join("; ");
}

function encodeTenantHeader(tenantContext: {
  empresaId?: string | null;
  empresaSlug?: string | null;
  resolutionType?: string | null;
}): string {
  const tenantData = {
    id: tenantContext.empresaId,
    slug: tenantContext.empresaSlug,
    res: tenantContext.resolutionType,
  };
  return base64Encode(JSON.stringify(tenantData));
}

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
    pathname === "/icon" ||
    pathname.startsWith("/icon?") ||
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
    "/api/tobias/chat/attachments", // TOBIAS-LEGACY: Remover quando TobIAs for deletado
    "/api/health",
    "/",
    "/signup",
    // Landing page routes (route group: (landing-page))
    "/features",
    "/pricing",
    "/docs",
    "/opensource",
    "/roadmap",
    "/changelog",
    "/status",
    "/manifesto",
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

  // Check for public branding API
  // Pattern: /api/empresa/personalizacao/[empresaId]/public
  const isPublicBrandingApi =
    pathname.startsWith("/api/empresa/personalizacao/") &&
    pathname.endsWith("/public");

  const isLikelyPublic =
    isBasePublicPath || isTenantPublicPattern || isPublicBrandingApi;

  let supabaseResponse = NextResponse.next({
    request,
  });

  const { url, anonKey } = getPublicSupabaseConfig();

  // Cookie cleaning logic (Cross-project safety)
  const projectRef = getSupabaseProjectRefFromUrl(url);

  // Descompressão transparente: browser → middleware (para consumo do Supabase/server)
  // Isso reduz tamanho de headers trafegados para o Nginx sem quebrar o SDK.
  let didDecompressRequestCookies = false;
  for (const c of request.cookies.getAll()) {
    if (typeof c.value === "string" && c.value.startsWith("pako:")) {
      const inflated = decompressCookieValue(c.value);
      request.cookies.set(c.name, inflated);
      didDecompressRequestCookies = true;
    }
  }
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
        return request.cookies.getAll().map((c) => {
          if (typeof c.value === "string" && c.value.startsWith("pako:")) {
            return { ...c, value: decompressCookieValue(c.value) };
          }
          return c;
        });
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        supabaseResponse = NextResponse.next({
          request,
        });

        cookiesToSet.forEach(({ name, value, options }) => {
          const cookieValue =
            typeof value === "string" && shouldCompressCookie(name, value)
              ? compressCookieValue(value)
              : value;
          supabaseResponse.cookies.set(name, cookieValue, options);
        });
      },
    },
  });

  // --- 2. TENANT RESOLUTION (VIA SERVICE) ---
  const referer = request.headers.get("referer");
  const tenantContext = await resolveTenantContext(
    supabase,
    host,
    pathname,
    isLikelyPublic,
    { referer },
  );

  if (tenantContext.empresaId) {
    logDebug(
      `tenant resolved: ${tenantContext.empresaSlug} (${tenantContext.resolutionType})`,
    );
  }

  // Helper to sync cookies/headers
  const copyCookiesAndHeaders = (target: NextResponse) => {
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      target.cookies.set(cookie.name, cookie.value);
    });
    if (tenantContext.empresaId) {
      target.headers.set("x-tenant", encodeTenantHeader(tenantContext));
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

  const isPublicPath =
    publicPaths.some(
      (path) => pathname === path || pathname.startsWith(`${path}/`),
    ) ||
    isTenantPublicPattern ||
    isPublicBrandingApi;

  // --- 4. AUTHENTICATION (PROTECTED ROUTES ONLY) ---
  let user = null;
  let error = null;

  if (!isPublicPath) {
    // Verificar se existem cookies de auth do Supabase antes de chamar getUser().
    // Sem cookies, o SDK tentaria refresh e falharia com "refresh_token_not_found",
    // logando Error [AuthApiError] desnecessariamente no console do servidor.
    const authCookiePrefix = projectRef ? `sb-${projectRef}-auth-token` : null;
    const hasAuthCookies = authCookiePrefix
      ? request.cookies
          .getAll()
          .some((c) => c.name.startsWith(authCookiePrefix))
      : true; // Se não conseguimos determinar o prefixo, prosseguir normalmente

    if (hasAuthCookies) {
      const result = await supabase.auth.getUser();
      // Se o erro for refresh_token_not_found, trata como usuário não autenticado (não é erro fatal)
      if (
        result.error &&
        (result.error.code === "refresh_token_not_found" ||
          result.error.message
            ?.toLowerCase()
            .includes("refresh token not found"))
      ) {
        user = null;
        error = null;
      } else {
        user = result.data.user;
        error = result.error;
      }
    }
  }

  // --- 5. REDIRECTS & REWRITES ---

  // Handle tenant-specific login redirects
  if (tenantContext.empresaId && tenantContext.resolutionType !== "slug") {
    if (pathname === "/auth" || pathname === "/auth/login") {
      const url = request.nextUrl.clone();
      url.pathname = `/${tenantContext.empresaSlug}/auth/login`;
      logInfo(`rewrite /auth → ${url.pathname}`);

      const response = NextResponse.rewrite(url);
      response.headers.set("x-tenant", encodeTenantHeader(tenantContext));

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
    supabaseResponse.headers.set("x-tenant", encodeTenantHeader(tenantContext));
  }

  // --- 6. FINALIZE RESPONSE ---
  // We must create a new response that includes the request headers we want to pass to Server Components.
  // The original 'supabaseResponse' has the cookies set by createServerClient, so we must copy them.

  const requestHeaders = new Headers(request.headers);
  // Importante: mudanças em `request.cookies.set(...)` não garantem que o header
  // `cookie` repassado para Server Components seja atualizado. Reconstituímos aqui.
  if (didDecompressRequestCookies) {
    requestHeaders.set(
      "cookie",
      buildCookieHeader(
        request.cookies.getAll().map((c) => ({ name: c.name, value: c.value })),
      ),
    );
  }
  if (tenantContext.empresaId) {
    requestHeaders.set("x-tenant", encodeTenantHeader(tenantContext));
  }

  const finalResponse = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // Copy cookies from supabaseResponse (which has auth updates) to finalResponse
  supabaseResponse.cookies.getAll().forEach((cookie) => {
    finalResponse.cookies.set(cookie.name, cookie.value, cookie);
  });

  // Copy output headers (like x-tenant-id for client) from supabaseResponse
  supabaseResponse.headers.forEach((value, key) => {
    finalResponse.headers.set(key, value);
  });

  // --- 7. MONITORAMENTO (DEV): TAMANHO DOS HEADERS ---
  if (process.env.NODE_ENV === "development") {
    const headerSize =
      JSON.stringify(Object.fromEntries(finalResponse.headers)).length;
    console.log(`[MW] Header size: ${headerSize} bytes`);
    if (headerSize > 4096) {
      console.warn(`[MW] WARNING: Headers exceeding 4KB (${headerSize} bytes)`);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (globalThis as any).__headerSizeWarnings =
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ((globalThis as any).__headerSizeWarnings ?? 0) + 1;
    }
  }

  return finalResponse;
}
