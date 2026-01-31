import { BrandingService } from "../../../app/[tenant]/(modules)/settings/personalizacao/services/branding.service";

// Mock Dependencies
jest.mock(
  "../../../app/[tenant]/(modules)/settings/personalizacao/services/simple-cache",
  () => {
    return {
      SimpleCache: jest.fn().mockImplementation(() => ({
        get: jest.fn(),
        set: jest.fn(),
        invalidate: jest.fn(),
        clear: jest.fn(),
      })),
    };
  },
);

jest.mock(
  "../../../app/[tenant]/(modules)/settings/personalizacao/services/branding-sync",
  () => {
    return {
      BrandingSync: jest.fn().mockImplementation(() => ({
        publishUpdate: jest.fn(),
        publishInvalidation: jest.fn(),
        subscribe: jest.fn(),
      })),
    };
  },
);

// Helper for builders
const createMockBuilder = () => {
  const builder: any = {};
  builder.select = jest.fn().mockReturnValue(builder);
  builder.insert = jest.fn().mockReturnValue(builder);
  builder.update = jest.fn().mockReturnValue(builder);
  builder.delete = jest.fn().mockReturnValue(builder);
  builder.eq = jest.fn().mockReturnValue(builder);
  builder.maybeSingle = jest.fn();
  builder.single = jest.fn();
  builder.order = jest.fn().mockReturnValue(builder);
  return builder;
};

describe("BrandingService", () => {
  let service: BrandingService;
  let mockSupabase: any;
  let mockBuilders: Record<string, any>;
  let mockCache: any;
  let mockSync: any;

  beforeEach(() => {
    mockBuilders = {
      empresas: createMockBuilder(),
      tenant_branding: createMockBuilder(),
      tenant_logos: createMockBuilder(),
      color_palettes: createMockBuilder(),
      font_schemes: createMockBuilder(),
      custom_theme_presets: createMockBuilder(),
    };

    mockSupabase = {
      from: jest.fn(
        (table: string) => mockBuilders[table] || createMockBuilder(),
      ),
      storage: {
        from: jest.fn().mockReturnValue({
          upload: jest.fn(),
          getPublicUrl: jest.fn(),
          remove: jest.fn(),
        }),
      },
    };

    service = new BrandingService(mockSupabase as unknown as SupabaseClient);

    // Access mocked instances
    mockCache = (service as any).cache;
    mockSync = (service as any).sync;
  });

  describe("loadTenantBranding", () => {
    it("should return cached data if available", async () => {
      const empresaId = "empresa-123";
      const cachedData = { tenantBranding: { id: "cached" } };

      mockCache.get.mockReturnValue(cachedData);

      const result = await service.loadTenantBranding({ empresaId });

      expect(result.success).toBe(true);
      expect(result.data).toBe(cachedData);
      expect(mockCache.get).toHaveBeenCalledWith(empresaId);
      expect(mockSupabase.from).not.toHaveBeenCalled();
    });

    it("should fetch from DB and cache if not in cache", async () => {
      const empresaId = "emp-1";
      mockCache.get.mockReturnValue(null);

      mockBuilders.empresas.maybeSingle.mockResolvedValue({
        data: { id: empresaId },
        error: null,
      });
      mockBuilders.tenant_branding.maybeSingle.mockResolvedValue({
        data: {
          id: "tb-1",
          empresa_id: empresaId,
          created_at: new Date(),
          updated_at: new Date(),
        },
        error: null,
      });

      // List mocks
      const listPromise = Promise.resolve({ data: [], error: null });
      mockBuilders.tenant_logos.eq = jest
        .fn()
        .mockReturnValue({ then: listPromise.then.bind(listPromise) });
      const orderPromise = Promise.resolve({ data: [], error: null });
      mockBuilders.custom_theme_presets.order = jest
        .fn()
        .mockReturnValue({ then: orderPromise.then.bind(orderPromise) });

      const result = await service.loadTenantBranding({ empresaId });

      expect(result.success).toBe(true);
      expect(mockCache.set).toHaveBeenCalled();
    });
  });

  describe("saveTenantBranding", () => {
    it("should invalidate cache and publish update on save", async () => {
      const empresaId = "emp-1";
      const branding = { colorPaletteId: "cp-1" };

      mockBuilders.tenant_branding.maybeSingle
        .mockResolvedValueOnce({ data: null, error: null }) // Initial check (not found)
        .mockResolvedValueOnce({
          data: {
            id: "new",
            empresa_id: empresaId,
            ...branding,
            created_at: new Date(),
            updated_at: new Date(),
          },
          error: null,
        }); // Inside getCompleteBrandingConfig (found)

      mockBuilders.tenant_branding.single.mockResolvedValue({
        data: {
          id: "new",
          empresa_id: empresaId,
          ...branding,
          created_at: new Date(),
          updated_at: new Date(),
        },
        error: null,
      });

      // List mocks
      const listPromise = Promise.resolve({ data: [], error: null });
      mockBuilders.tenant_logos.eq = jest
        .fn()
        .mockReturnValue({ then: listPromise.then.bind(listPromise) });
      const orderPromise = Promise.resolve({ data: [], error: null });
      mockBuilders.custom_theme_presets.order = jest
        .fn()
        .mockReturnValue({ then: orderPromise.then.bind(orderPromise) });

      await service.saveTenantBranding({ empresaId, branding });

      expect(mockCache.invalidate).toHaveBeenCalledWith(empresaId);
      expect(mockSync.publishUpdate).toHaveBeenCalled();
    });
  });
});
