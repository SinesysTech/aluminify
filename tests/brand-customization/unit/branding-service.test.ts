import { SupabaseClient } from "@supabase/supabase-js";
import { BrandingService } from "@/app/[tenant]/(modules)/empresa/(gestao)/personalizacao/services/branding.service";

// Mock Supabase Client
const mockSupabase = {
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  maybeSingle: jest.fn(),
  single: jest.fn(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  storage: {
    from: jest.fn().mockReturnThis(),
    upload: jest.fn(),
    getPublicUrl: jest.fn(),
    remove: jest.fn(),
  },
} as unknown as SupabaseClient;

describe("BrandingService", () => {
  let service: BrandingService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new BrandingService(mockSupabase);
  });

  describe("loadTenantBranding", () => {
    it("should return cached data if available", async () => {
      const empresaId = "test-empresa";
      const cachedData = { tenantBranding: { id: "cached" } } as any;

      // Manually inject into cache (since it's private, we cheat a bit for testing or use a setter if exposed,
      // but here we can just test the expected side effect if we could seed it.
      // Since it's private, we test the caching behavior by calling load twice)

      // Mock DB response for first call
      const mockEmpresa = { id: empresaId };
      const mockBranding = {
        id: "branding-1",
        empresa_id: empresaId,
        created_at: new Date(),
        updated_at: new Date(),
      };

      (mockSupabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            maybeSingle: jest
              .fn()
              .mockResolvedValue({ data: mockEmpresa, error: null }),
            order: jest.fn().mockReturnValue({}),
          }),
        }),
      });

      // Mock getCompleteBrandingConfig calls
      // 1. findTenantBranding
      (
        mockSupabase.from("tenant_branding").select as jest.Mock
      ).mockReturnValue({
        eq: jest.fn().mockReturnValue({
          maybeSingle: jest
            .fn()
            .mockResolvedValue({ data: mockBranding, error: null }),
        }),
      });
      // 2. findTenantLogos
      (mockSupabase.from("tenant_logos").select as jest.Mock).mockReturnValue({
        eq: jest.fn().mockResolvedValue({ data: [], error: null }),
      });
      // 3. findCustomThemePresets
      (
        mockSupabase.from("custom_theme_presets").select as jest.Mock
      ).mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({ data: [], error: null }),
        }),
      });

      // First Call
      const result1 = await service.loadTenantBranding({ empresaId });
      expect(result1.success).toBe(true);

      // Second Call (Should be cached)
      // Reset mocks to ensure they aren't called again for the heavy lifting
      (mockSupabase.from("tenant_branding").select as jest.Mock).mockClear();

      const result2 = await service.loadTenantBranding({ empresaId });
      expect(result2.success).toBe(true);
      expect(result2.data).toEqual(result1.data);
      expect(
        mockSupabase.from("tenant_branding").select,
      ).not.toHaveBeenCalled();
    });

    it("should return default config if no branding found", async () => {
      const empresaId = "test-empresa";

      // Mock Empresa exists
      (mockSupabase.from("empresas").select as jest.Mock).mockReturnValue({
        eq: jest.fn().mockReturnValue({
          maybeSingle: jest
            .fn()
            .mockResolvedValue({ data: { id: empresaId }, error: null }),
        }),
      });

      // Mock Tenant Branding not found
      (
        mockSupabase.from("tenant_branding").select as jest.Mock
      ).mockReturnValue({
        eq: jest.fn().mockReturnValue({
          maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
        }),
      });

      const result = await service.loadTenantBranding({ empresaId });
      expect(result.success).toBe(true);
      expect(result.data?.tenantBranding.id).toBe("default");
      expect(result.warnings).toContain(
        "No custom branding found, using default configuration",
      );
    });
  });

  describe("saveTenantBranding", () => {
    it("should create new branding if not exists", async () => {
      const empresaId = "test-empresa";
      const brandingData = { colorPaletteId: "cp-1" };
      const userId = "user-1";

      // Mock findTenantBranding (not found)
      (
        mockSupabase.from("tenant_branding").select as jest.Mock
      ).mockReturnValue({
        eq: jest.fn().mockReturnValue({
          maybeSingle: jest
            .fn()
            .mockResolvedValueOnce({ data: null, error: null }) // Check existence
            .mockResolvedValueOnce({
              data: { id: "new-id", empresa_id: empresaId, ...brandingData },
              error: null,
            }), // After create
        }),
      });

      // Mock create
      (
        mockSupabase.from("tenant_branding").insert as jest.Mock
      ).mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest
            .fn()
            .mockResolvedValue({
              data: { id: "new-id", ...brandingData },
              error: null,
            }),
        }),
      });

      // Mock other calls for getComplete (logos, etc)
      (mockSupabase.from("tenant_logos").select as jest.Mock).mockReturnValue({
        eq: jest.fn().mockResolvedValue({ data: [], error: null }),
      });
      (
        mockSupabase.from("custom_theme_presets").select as jest.Mock
      ).mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({ data: [], error: null }),
        }),
      });

      const result = await service.saveTenantBranding({
        empresaId,
        branding: brandingData,
        userId,
      });
      expect(result.success).toBe(true);
      expect(mockSupabase.from("tenant_branding").insert).toHaveBeenCalled();
    });
  });
});
