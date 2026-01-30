/**
 * Tenant Resolution & Access Validation
 *
 * Provides server-side utilities to resolve the tenant from the URL slug
 * and validate that the authenticated user belongs to that tenant.
 *
 * Key Functions:
 * - resolveTenantId(slug): Resolves a URL slug to empresaId
 * - requireTenantUser(slug, options): Ensures user is authenticated AND belongs to the URL tenant
 */

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { requireUser } from "@/app/shared/core/auth";
import { getDatabaseClient } from "@/app/shared/core/database/database";
import type { AppUser, AppUserRole } from "@/app/shared/types";

type LegacyAppUserRole = "professor" | "empresa";

interface ResolvedTenant {
  empresaId: string;
  empresaSlug: string;
  empresaNome: string;
}

/**
 * Resolves a tenant URL slug to its empresaId.
 *
 * 1. Tries x-tenant-id header first (set by middleware, avoids DB query).
 * 2. Falls back to querying the empresas table by slug.
 */
export async function resolveTenantId(
  tenantSlug: string,
): Promise<ResolvedTenant | null> {
  const slug = (tenantSlug || "").toLowerCase();

  // 1. Try headers injected by middleware
  const headersList = await headers();
  const headerTenantId = headersList.get("x-tenant-id");
  const headerTenantSlug = headersList.get("x-tenant-slug");
  const headerTenantName = headersList.get("x-tenant-name");

  if (headerTenantId && headerTenantSlug === slug) {
    return {
      empresaId: headerTenantId,
      empresaSlug: headerTenantSlug,
      empresaNome: headerTenantName
        ? decodeURIComponent(headerTenantName)
        : "",
    };
  }

  // 2. Fallback: query database
  const adminClient = getDatabaseClient();
  const { data: empresa } = await adminClient
    .from("empresas")
    .select("id, nome, slug")
    .or(`slug.eq.${slug},subdomain.eq.${slug}`)
    .eq("ativo", true)
    .maybeSingle();

  if (!empresa) {
    return null;
  }

  return {
    empresaId: empresa.id,
    empresaSlug: empresa.slug,
    empresaNome: empresa.nome,
  };
}

interface RequireTenantUserOptions {
  allowedRoles?: (AppUserRole | LegacyAppUserRole)[];
  ignorePasswordRequirement?: boolean;
}

interface TenantUserResult {
  user: AppUser;
  tenantId: string;
}

/**
 * Ensures the authenticated user belongs to the tenant identified by the URL slug.
 *
 * - Calls requireUser() for authentication + role check.
 * - Resolves the URL tenant slug to empresaId.
 * - Validates user.empresaId === tenant.empresaId.
 * - If mismatch, redirects to the user's own tenant.
 */
export async function requireTenantUser(
  tenantSlug: string,
  options?: RequireTenantUserOptions,
): Promise<TenantUserResult> {
  const user = await requireUser(options);

  const tenant = await resolveTenantId(tenantSlug);

  if (!tenant) {
    // Tenant slug doesn't exist - redirect to user's own tenant
    const fallback = user.empresaSlug ? `/${user.empresaSlug}` : "/auth";
    redirect(fallback);
  }

  if (user.empresaId && user.empresaId !== tenant.empresaId) {
    // User doesn't belong to this tenant - redirect to their own
    const fallback = user.empresaSlug ? `/${user.empresaSlug}` : "/auth";
    redirect(fallback);
  }

  return { user, tenantId: tenant.empresaId };
}
