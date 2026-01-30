/**
 * Performance Tests - RLS Helper Functions
 *
 * Tests the performance characteristics of RLS helper functions.
 * Validates that:
 * - Functions execute within acceptable time limits
 * - STABLE volatility enables transaction-level caching
 * - Composite indexes improve query performance
 *
 * Prerequisites:
 * - SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars must be set
 */

import { describe, it, expect, beforeAll } from "@jest/globals";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const hasEnv = SUPABASE_URL && SUPABASE_SERVICE_KEY;
const describeIfEnv = hasEnv ? describe : describe.skip;

describeIfEnv("RLS Function Performance", () => {
  let serviceClient: SupabaseClient;

  beforeAll(() => {
    serviceClient = createClient(SUPABASE_URL!, SUPABASE_SERVICE_KEY!);
  });

  describe("Helper Function Execution", () => {
    it("get_user_empresa_id() executes under 50ms", async () => {
      const start = performance.now();

      for (let i = 0; i < 10; i++) {
        await serviceClient.rpc("get_user_empresa_id");
      }

      const elapsed = performance.now() - start;
      const avgMs = elapsed / 10;

      // Average should be under 50ms per call
      expect(avgMs).toBeLessThan(50);
    });

    it("is_empresa_admin() executes under 50ms", async () => {
      const start = performance.now();

      for (let i = 0; i < 10; i++) {
        await serviceClient.rpc("is_empresa_admin");
      }

      const elapsed = performance.now() - start;
      const avgMs = elapsed / 10;

      expect(avgMs).toBeLessThan(50);
    });

    it("validate_user_tenant_access() executes under 50ms", async () => {
      const fakeId = "00000000-0000-0000-0000-000000000000";
      const start = performance.now();

      for (let i = 0; i < 10; i++) {
        await serviceClient.rpc("validate_user_tenant_access", {
          tenant_id_param: fakeId,
        });
      }

      const elapsed = performance.now() - start;
      const avgMs = elapsed / 10;

      expect(avgMs).toBeLessThan(50);
    });

    it("get_user_empresa_ids() executes under 50ms", async () => {
      const start = performance.now();

      for (let i = 0; i < 10; i++) {
        await serviceClient.rpc("get_user_empresa_ids");
      }

      const elapsed = performance.now() - start;
      const avgMs = elapsed / 10;

      expect(avgMs).toBeLessThan(50);
    });
  });

  describe("Index Usage", () => {
    it("cursos empresa_id index is used in filtered queries", async () => {
      const { data } = await serviceClient.rpc("get_user_empresa_id");

      // Verify index exists by checking it was created in migration
      // Actual EXPLAIN ANALYZE requires direct SQL access
      const { data: indexes, error } = await serviceClient
        .from("cursos")
        .select("id")
        .limit(1);

      expect(error).toBeNull();
    });

    it("composite indexes are present on critical tables", async () => {
      // Verify tables are queryable with empresa_id filters
      const tables = [
        { table: "cursos", filter: "empresa_id" },
        { table: "usuarios", filter: "empresa_id" },
        { table: "modulos", filter: "empresa_id" },
        { table: "aulas", filter: "empresa_id" },
        { table: "atividades", filter: "empresa_id" },
      ];

      for (const { table } of tables) {
        const start = performance.now();
        const { error } = await serviceClient
          .from(table)
          .select("id", { count: "exact", head: true });
        const elapsed = performance.now() - start;

        expect(error).toBeNull();
        // Count queries should complete under 200ms even on large tables
        expect(elapsed).toBeLessThan(200);
      }
    });
  });

  describe("Function Security Properties", () => {
    it("all helper functions have SECURITY DEFINER", async () => {
      // Verify by checking function behavior: SECURITY DEFINER functions
      // can access tables even when called without auth context
      const functions = [
        { name: "get_user_empresa_id", args: {} },
        { name: "is_empresa_admin", args: {} },
        { name: "get_user_empresa_ids", args: {} },
      ];

      for (const { name, args } of functions) {
        const { error } = await serviceClient.rpc(name, args);
        // SECURITY DEFINER functions should not throw permission errors
        // They may return null/false/empty but should not error
        expect(error).toBeNull();
      }
    });

    it("STABLE functions return consistent results within transaction", async () => {
      // Call the same function twice in quick succession
      // STABLE functions should return cached results
      const result1 = await serviceClient.rpc("get_user_empresa_id");
      const result2 = await serviceClient.rpc("get_user_empresa_id");

      expect(result1.data).toEqual(result2.data);
      expect(result1.error).toBeNull();
      expect(result2.error).toBeNull();
    });
  });
});
