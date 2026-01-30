/**
 * Tenant Validation Utilities
 *
 * Provides server-side validation functions to ensure requests are
 * properly scoped to a tenant context. Use these in API routes and
 * server actions to prevent cross-tenant data access.
 *
 * Key Functions:
 * - validateTenantAccess(tenantId, user): Validates user belongs to tenant
 * - requireTenantContext(request): Extracts and validates tenant context from request
 */

import type { AppUser } from "@/app/shared/types";

/**
 * Validates that a user has access to a specific tenant.
 *
 * @param tenantId - The empresa_id to validate against
 * @param user - The authenticated user
 * @returns true if user belongs to the tenant
 */
export function validateTenantAccess(
  tenantId: string,
  user: AppUser,
): boolean {
  if (!user.empresaId) {
    return false;
  }
  return user.empresaId === tenantId;
}

/**
 * Validates tenant access and throws if unauthorized.
 *
 * Use in API routes to enforce tenant isolation:
 * ```typescript
 * const { user, tenantId } = await requireTenantUser(slug);
 * assertTenantAccess(tenantId, user); // throws if mismatch
 * ```
 *
 * @throws {TenantAccessError} if user does not belong to the tenant
 */
export function assertTenantAccess(
  tenantId: string,
  user: AppUser,
): void {
  if (!validateTenantAccess(tenantId, user)) {
    throw new TenantAccessError(
      `User ${user.id} does not have access to tenant ${tenantId}`,
    );
  }
}

/**
 * Validates that a resource belongs to the expected tenant.
 *
 * Use after fetching a resource to ensure it belongs to the user's tenant:
 * ```typescript
 * const curso = await cursoRepository.findById(id);
 * assertResourceTenant(curso?.empresaId, tenantId);
 * ```
 *
 * @param resourceEmpresaId - The empresa_id from the fetched resource
 * @param expectedTenantId - The tenant ID from the request context
 * @throws {TenantAccessError} if resource belongs to a different tenant
 */
export function assertResourceTenant(
  resourceEmpresaId: string | null | undefined,
  expectedTenantId: string,
): void {
  if (!resourceEmpresaId) {
    throw new TenantAccessError("Resource has no tenant context");
  }
  if (resourceEmpresaId !== expectedTenantId) {
    throw new TenantAccessError(
      "Resource does not belong to the expected tenant",
    );
  }
}

/**
 * Custom error class for tenant access violations.
 */
export class TenantAccessError extends Error {
  public readonly statusCode = 403;

  constructor(message: string) {
    super(message);
    this.name = "TenantAccessError";
  }

  /**
   * Convert to a Response object for API routes.
   */
  toResponse(): Response {
    return new Response(
      JSON.stringify({ error: "Forbidden", message: "Tenant access denied" }),
      {
        status: this.statusCode,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}
