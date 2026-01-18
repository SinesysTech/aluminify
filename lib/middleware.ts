import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getPublicSupabaseConfig } from "./supabase-public-env";

// Configuration for tenant resolution
const PRIMARY_DOMAIN =
  process.env.NEXT_PUBLIC_PRIMARY_DOMAIN || "alumnify.com.br";
const DEV_DOMAINS = ["localhost", "127.0.0.1"];

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

  console.log(
    "[DEBUG] Middleware - processando requisição:",
    pathname,
    "host:",
    host
  );
  console.log(
    "[DEBUG] Middleware - Cookies:",
    request.cookies
      .getAll()
      .map((c) => c.name)
      .join(", ")
  );

  let supabaseResponse = NextResponse.next({
    request,
  });

  // With Fluid compute, don't put this client in a global environment
  // variable. Always create a new one on each request.
  const { url, anonKey } = getPublicSupabaseConfig();

  // Se o browser tiver cookies de múltiplos projetos Supabase, isso pode causar
  // inconsistência (server lendo um projeto e o client outro). Limpamos cookies
  // "sb-*-auth-token*" que não correspondem ao projeto atual.
  const projectRef = getSupabaseProjectRefFromUrl(url);
  if (projectRef) {
    const expectedPrefix = `sb-${projectRef}-auth-token`;
    const allCookies = request.cookies.getAll();
    const supabaseAuthCookies = allCookies.filter(
      (c) => c.name.startsWith("sb-") && c.name.includes("-auth-token")
    );
    const foreignCookies = supabaseAuthCookies.filter(
      (c) => !c.name.startsWith(expectedPrefix)
    );

    if (foreignCookies.length > 0) {
      console.warn("[DEBUG] Middleware - removendo cookies Supabase de outro projeto", {
        expectedPrefix,
        foreign: foreignCookies.map((c) => c.name),
      });

      // Remover do request (para esta requisição) e do response (persistir no browser)
      for (const c of foreignCookies) {
        try {
          request.cookies.delete(c.name);
        } catch {
          // ignore
        }
        supabaseResponse.cookies.set(c.name, "", { path: "/", maxAge: 0 });
      }
    }
  }

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // Resolve tenant context
  let tenantContext: TenantContext = {};

  // Try to resolve tenant from:
  // 1. Custom domain (e.g., escola.com.br)
  // 2. Subdomain (e.g., escola.alumnify.com.br)
  // 3. URL path (e.g., /escola/auth/login)

  if (isCustomDomain(host)) {
    // Lookup empresa by custom domain
    const { data: empresa } = await supabase
      .from("empresas")
      .select("id, slug")
      .eq("dominio_customizado", host.split(":")[0].toLowerCase())
      .eq("ativo", true)
      .maybeSingle();

    if (empresa) {
      tenantContext = {
        empresaId: empresa.id,
        empresaSlug: empresa.slug,
        resolutionType: "custom-domain",
      };
      console.log(
        "[DEBUG] Middleware - tenant resolved from custom domain:",
        tenantContext
      );
    }
  }

  if (!tenantContext.empresaId) {
    const subdomain = extractSubdomain(host);
    if (subdomain) {
      // Lookup empresa by subdomain or slug
      const { data: empresa } = await supabase
        .from("empresas")
        .select("id, slug")
        .or(`subdomain.eq.${subdomain},slug.eq.${subdomain}`)
        .eq("ativo", true)
        .maybeSingle();

      if (empresa) {
        tenantContext = {
          empresaId: empresa.id,
          empresaSlug: empresa.slug,
          resolutionType: "subdomain",
        };
        console.log(
          "[DEBUG] Middleware - tenant resolved from subdomain:",
          tenantContext
        );
      }
    }
  }

  if (!tenantContext.empresaId) {
    const tenantSlug = extractTenantFromPath(pathname);
    if (tenantSlug) {
      // Lookup empresa by slug
      const { data: empresa } = await supabase
        .from("empresas")
        .select("id, slug")
        .eq("slug", tenantSlug)
        .eq("ativo", true)
        .maybeSingle();

      if (empresa) {
        tenantContext = {
          empresaId: empresa.id,
          empresaSlug: empresa.slug,
          resolutionType: "slug",
        };
        console.log(
          "[DEBUG] Middleware - tenant resolved from path:",
          tenantContext
        );
      }
    }
  }

  // Rotas públicas que não precisam de autenticação
  // Nota: as rotas /auth/aluno/login, /auth/professor/login e /auth/professor/cadastro
  // existem para compatibilidade futura com o sistema de multi-tenant baseado em domínio.
  // Atualmente, elas redirecionam para /auth/login.
  const publicPaths = [
    "/login",
    "/auth",
    "/auth/aluno/login",
    "/auth/professor/login",
    "/auth/professor/cadastro",
    "/api/auth/signup-with-empresa", // Endpoint de cadastro público
    "/api/chat/attachments", // Anexos usam token na URL, não precisam de autenticação de sessão
    "/", // Landing page
    "/signup",
    "/features.html",
    "/pricing.html",
    "/docs.html",
    "/open-source.html",
    "/roadmap.html",
    "/changelog.html",
    "/status.html",
  ];

  // Also allow tenant-specific auth routes
  if (tenantContext.empresaSlug) {
    publicPaths.push(`/${tenantContext.empresaSlug}/auth`);
    publicPaths.push(`/${tenantContext.empresaSlug}/auth/login`);
    publicPaths.push(`/${tenantContext.empresaSlug}/auth/sign-up`);
  }

  const isPublicPath = publicPaths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );
  console.log(
    "[DEBUG] Middleware - isPublicPath:",
    isPublicPath,
    "pathname:",
    pathname
  );

  // Tentar obter o usuário autenticado
  // getUser() renova automaticamente a sessão se necessário usando o refresh token
  // Se o refresh token estiver inválido ou não encontrado, retornará um erro
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  console.log("[DEBUG] Middleware - getUser result:", {
    hasUser: !!user,
    userId: user?.id,
    userEmail: user?.email,
    hasError: !!error,
    errorMessage: error?.message,
  });

  // Handle tenant-specific login redirects when tenant is identified via domain/subdomain
  if (tenantContext.empresaId && tenantContext.resolutionType !== "slug") {
    // If accessing /auth or /auth/login, rewrite to tenant-specific login
    if (pathname === "/auth" || pathname === "/auth/login") {
      const url = request.nextUrl.clone();
      url.pathname = `/${tenantContext.empresaSlug}/auth/login`;
      console.log(
        "[DEBUG] Middleware - rewriting to tenant login:",
        url.pathname
      );

      // Clone response and add tenant headers
      const response = NextResponse.rewrite(url);
      response.headers.set("x-tenant-id", tenantContext.empresaId);
      response.headers.set("x-tenant-slug", tenantContext.empresaSlug!);

      // Copy cookies
      supabaseResponse.cookies.getAll().forEach((cookie) => {
        response.cookies.set(cookie.name, cookie.value);
      });

      return response;
    }
  }

  // Se houver erro de autenticação (incluindo refresh token inválido/não encontrado)
  // ou se não houver usuário autenticado
  if (error || !user) {
    // Se não for rota pública, redirecionar para login
    // O cliente Supabase irá limpar os cookies inválidos automaticamente
    if (!isPublicPath) {
      console.log(
        "[DEBUG] Middleware - redirecionando para /auth (não autenticado em rota protegida)"
      );
      const url = request.nextUrl.clone();

      // If tenant context exists, redirect to tenant login
      if (tenantContext.empresaSlug) {
        url.pathname = `/${tenantContext.empresaSlug}/auth/login`;
      } else {
        url.pathname = "/auth";
      }

      return NextResponse.redirect(url);
    }
    // Se for rota pública, continuar normalmente (usuário não autenticado é esperado)
    console.log(
      "[DEBUG] Middleware - rota pública, continuando sem autenticação"
    );
  } else {
    console.log("[DEBUG] Middleware - usuário autenticado, continuando");
  }

  // Add tenant context headers to response
  if (tenantContext.empresaId) {
    supabaseResponse.headers.set("x-tenant-id", tenantContext.empresaId);
    supabaseResponse.headers.set("x-tenant-slug", tenantContext.empresaSlug!);
    if (tenantContext.resolutionType) {
      supabaseResponse.headers.set(
        "x-tenant-resolution",
        tenantContext.resolutionType
      );
    }
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is.
  // If you're creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse;
}
