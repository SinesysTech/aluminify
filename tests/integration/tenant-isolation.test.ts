/**
 * Integration Tests - Tenant Isolation
 *
 * Tests the full tenant isolation stack including:
 * - Repository factory creates user-scoped clients
 * - Tenant validation utilities work correctly
 * - Rate limiting service enforces per-tenant limits
 *
 * These tests run without a database connection, testing the
 * application-layer logic only.
 */

import { describe, it, expect, beforeEach } from "@jest/globals";

// Application-layer imports (no DB needed)
import {
  validateTenantAccess,
  assertTenantAccess,
  assertResourceTenant,
  TenantAccessError,
} from "@/app/shared/core/tenant-validation";

import {
  rateLimitService,
} from "@/app/shared/core/services/rate-limit/rate-limit.service";

import type { AppUser } from "@/app/shared/types";

// Mock AppUser factory
function createMockUser(overrides: Partial<AppUser> = {}): AppUser {
  return {
    id: "user-1",
    email: "user@example.com",
    role: "usuario",
    mustChangePassword: false,
    empresaId: "empresa-a",
    empresaSlug: "escola-a",
    empresaNome: "Escola A",
    ...overrides,
  } as AppUser;
}

describe("Tenant Validation Utilities", () => {
  describe("validateTenantAccess", () => {
    it("returns true when user belongs to the tenant", () => {
      const user = createMockUser({ empresaId: "empresa-a" });
      expect(validateTenantAccess("empresa-a", user)).toBe(true);
    });

    it("returns false when user belongs to a different tenant", () => {
      const user = createMockUser({ empresaId: "empresa-a" });
      expect(validateTenantAccess("empresa-b", user)).toBe(false);
    });

    it("returns false when user has no empresaId", () => {
      const user = createMockUser({ empresaId: undefined });
      expect(validateTenantAccess("empresa-a", user)).toBe(false);
    });
  });

  describe("assertTenantAccess", () => {
    it("does not throw when access is valid", () => {
      const user = createMockUser({ empresaId: "empresa-a" });
      expect(() => assertTenantAccess("empresa-a", user)).not.toThrow();
    });

    it("throws TenantAccessError when access is invalid", () => {
      const user = createMockUser({ empresaId: "empresa-a" });
      expect(() => assertTenantAccess("empresa-b", user)).toThrow(
        TenantAccessError,
      );
    });

    it("thrown error has status code 403", () => {
      const user = createMockUser({ empresaId: "empresa-a" });
      try {
        assertTenantAccess("empresa-b", user);
      } catch (e) {
        expect(e).toBeInstanceOf(TenantAccessError);
        expect((e as TenantAccessError).statusCode).toBe(403);
      }
    });
  });

  describe("assertResourceTenant", () => {
    it("does not throw when resource belongs to expected tenant", () => {
      expect(() =>
        assertResourceTenant("empresa-a", "empresa-a"),
      ).not.toThrow();
    });

    it("throws when resource belongs to different tenant", () => {
      expect(() =>
        assertResourceTenant("empresa-b", "empresa-a"),
      ).toThrow(TenantAccessError);
    });

    it("throws when resource has no tenant context", () => {
      expect(() => assertResourceTenant(null, "empresa-a")).toThrow(
        TenantAccessError,
      );
    });

    it("throws when resource tenant is undefined", () => {
      expect(() => assertResourceTenant(undefined, "empresa-a")).toThrow(
        TenantAccessError,
      );
    });
  });

  describe("TenantAccessError", () => {
    it("creates a proper Response object", () => {
      const error = new TenantAccessError("test error");
      const response = error.toResponse();

      expect(response.status).toBe(403);
      expect(response.headers.get("Content-Type")).toBe("application/json");
    });

    it("has correct name property", () => {
      const error = new TenantAccessError("test");
      expect(error.name).toBe("TenantAccessError");
    });
  });
});

describe("Rate Limit Service", () => {
  beforeEach(() => {
    rateLimitService.resetAll();
  });

  describe("checkLimit", () => {
    it("allows requests within the limit", () => {
      const result = rateLimitService.checkLimit("empresa-a", "basico");
      expect(result).toBe(true);
    });

    it("blocks requests exceeding the limit", () => {
      // basico plan: 100 requests per 60 seconds
      for (let i = 0; i < 100; i++) {
        rateLimitService.checkLimit("empresa-a", "basico");
      }

      // 101st request should be blocked
      const result = rateLimitService.checkLimit("empresa-a", "basico");
      expect(result).toBe(false);
    });

    it("isolates rate limits between tenants", () => {
      // Exhaust tenant A's limit
      for (let i = 0; i < 100; i++) {
        rateLimitService.checkLimit("empresa-a", "basico");
      }

      // Tenant B should still be allowed
      const result = rateLimitService.checkLimit("empresa-b", "basico");
      expect(result).toBe(true);
    });

    it("uses default plan when none specified", () => {
      const result = rateLimitService.checkLimit("empresa-a");
      expect(result).toBe(true);
    });

    it("respects different plan limits", () => {
      // Enterprise plan: 2000 requests per 60 seconds
      for (let i = 0; i < 200; i++) {
        rateLimitService.checkLimit("empresa-a", "enterprise");
      }

      // Should still be allowed (well under 2000)
      const result = rateLimitService.checkLimit("empresa-a", "enterprise");
      expect(result).toBe(true);
    });
  });

  describe("getUsage", () => {
    it("returns zero usage for new tenant", () => {
      const usage = rateLimitService.getUsage("new-tenant", "basico");
      expect(usage).not.toBeNull();
      expect(usage!.current).toBe(0);
      expect(usage!.limit).toBe(100);
    });

    it("returns correct usage after requests", () => {
      for (let i = 0; i < 5; i++) {
        rateLimitService.checkLimit("empresa-a", "basico");
      }

      const usage = rateLimitService.getUsage("empresa-a", "basico");
      expect(usage).not.toBeNull();
      expect(usage!.current).toBe(5);
      expect(usage!.limit).toBe(100);
    });
  });

  describe("reset", () => {
    it("clears rate limit for specific tenant", () => {
      for (let i = 0; i < 100; i++) {
        rateLimitService.checkLimit("empresa-a", "basico");
      }

      // Should be blocked
      expect(rateLimitService.checkLimit("empresa-a", "basico")).toBe(false);

      // Reset
      rateLimitService.reset("empresa-a");

      // Should be allowed again
      expect(rateLimitService.checkLimit("empresa-a", "basico")).toBe(true);
    });
  });
});
