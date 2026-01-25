/**
 * Property-Based Test: Customization State Management
 * 
 * Feature: brand-customization, Property 12: Customization State Management
 * 
 * Validates Requirements 5.3, 5.5
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { createClient } from '@supabase/supabase-js';
import fc from 'fast-check';
import { BrandCustomizationManager } from '@/app/shared/core/services/brand-customization';
import { getDatabaseClient } from '@/app/shared/core/database/database';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

describe('Brand Customization State Management', () => {
  let supabase: ReturnType<typeof createClient> | null = null;
  let testEmpresaIds: string[] = [];
  let testColorPaletteIds: string[] = [];
  let testFontSchemeIds: string[] = [];
  let testTenantBrandingIds: string[] = [];
  let brandCustomizationManager: BrandCustomizationManager | null = null;

  beforeAll(async () => {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      console.warn('Supabase credentials not available, skipping tests');
      return;
    }

    try {
      const dbClient = getDatabaseClient();
      brandCustomizationManager = new BrandCustomizationManager(dbClient);
      supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    } catch (error) {
      console.warn('Could not create BrandCustomizationManager:', error);
      return;
    }
  });

  afterAll(async () => {
    if (!supabase) return;

    // Clean up test data
    try {
      // Delete tenant branding records
      if (testTenantBrandingIds.length > 0) {
        await supabase
          .from('tenant_branding')
          .delete()
          .in('id', testTenantBrandingIds);
      }

      // Delete color palettes
      if (testColorPaletteIds.length > 0) {
        await supabase
          .from('color_palettes')
          .delete()
          .in('id', testColorPaletteIds);
      }

      // Delete font schemes
      if (testFontSchemeIds.length > 0) {
        await supabase
          .from('font_schemes')
          .delete()
          .in('id', testFontSchemeIds);
      }

      // Delete test empresas
      if (testEmpresaIds.length > 0) {
        await supabase
          .from('empresas')
          .delete()
          .in('id', testEmpresaIds);
      }
    } catch (error) {
      console.warn('Error cleaning up test data:', error);
    }
  });

  /**
   * Property 12: Customization State Management
   * 
   * For any customization session, the system should allow saving, resetting to defaults, 
   * or canceling modifications with appropriate state restoration
   * 
   * Validates Requirements 5.3, 5.5
   */
  it('should manage customization state with save, reset, and cancel operations', async () => {
    if (!supabase || !brandCustomizationManager) {
      console.warn('Skipping test: Required dependencies not available');
      return;
    }

    await fc.assert(
      fc.asyncProperty(
        // Generate test data
        fc.record({
          empresaName: fc.string({ minLength: 3, maxLength: 50 }),
          initialCustomization: fc.record({
            colorPaletteId: fc.option(fc.string({ minLength: 10, maxLength: 50 }), { nil: undefined }),
            fontSchemeId: fc.option(fc.string({ minLength: 10, maxLength: 50 }), { nil: undefined }),
            customCss: fc.option(fc.string({ minLength: 10, maxLength: 200 }), { nil: undefined }),
          }),
          modifiedCustomization: fc.record({
            colorPaletteId: fc.option(fc.string({ minLength: 10, maxLength: 50 }), { nil: undefined }),
            fontSchemeId: fc.option(fc.string({ minLength: 10, maxLength: 50 }), { nil: undefined }),
            customCss: fc.option(fc.string({ minLength: 10, maxLength: 200 }), { nil: undefined }),
          }),
          userId: fc.string({ minLength: 10, maxLength: 50 }),
        }),
        async ({ empresaName, initialCustomization, modifiedCustomization, userId }) => {
          let createdEmpresaId: string | null = null;
          let createdColorPaletteId: string | null = null;
          let createdFontSchemeId: string | null = null;
          let createdTenantBrandingId: string | null = null;

          try {
            // Create test empresa
            const { data: empresa, error: empresaError } = await supabase!
              .from('empresas')
              .insert({
                nome: empresaName,
                email: `test-${Date.now()}@example.com`,
                telefone: '1234567890',
                endereco: 'Test Address',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              })
              .select('id')
              .single();

            expect(empresaError).toBeNull();
            expect(empresa).toBeTruthy();
            createdEmpresaId = empresa!.id;
            testEmpresaIds.push(createdEmpresaId);

            // Create color palette if needed for initial customization
            if (initialCustomization.colorPaletteId) {
              const { data: colorPalette, error: paletteError } = await supabase!
                .from('color_palettes')
                .insert({
                  id: initialCustomization.colorPaletteId,
                  name: `Test Palette ${Date.now()}`,
                  empresa_id: createdEmpresaId,
                  primary_color: '#000000',
                  primary_foreground: '#ffffff',
                  secondary_color: '#f0f0f0',
                  secondary_foreground: '#000000',
                  accent_color: '#0066cc',
                  accent_foreground: '#ffffff',
                  muted_color: '#f5f5f5',
                  muted_foreground: '#666666',
                  background_color: '#ffffff',
                  foreground_color: '#000000',
                  card_color: '#ffffff',
                  card_foreground: '#000000',
                  destructive_color: '#dc2626',
                  destructive_foreground: '#ffffff',
                  sidebar_background: '#f8f9fa',
                  sidebar_foreground: '#212529',
                  sidebar_primary: '#0066cc',
                  sidebar_primary_foreground: '#ffffff',
                  is_custom: true,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                })
                .select('id')
                .single();

              expect(paletteError).toBeNull();
              createdColorPaletteId = colorPalette!.id;
              testColorPaletteIds.push(createdColorPaletteId);
            }

            // Create font scheme if needed for initial customization
            if (initialCustomization.fontSchemeId) {
              const { data: fontScheme, error: schemeError } = await supabase!
                .from('font_schemes')
                .insert({
                  id: initialCustomization.fontSchemeId,
                  name: `Test Scheme ${Date.now()}`,
                  empresa_id: createdEmpresaId,
                  font_sans: ['Inter', 'sans-serif'],
                  font_mono: ['Fira Code', 'monospace'],
                  font_sizes: {
                    xs: '0.75rem',
                    sm: '0.875rem',
                    base: '1rem',
                    lg: '1.125rem',
                    xl: '1.25rem',
                    '2xl': '1.5rem',
                    '3xl': '1.875rem',
                    '4xl': '2.25rem',
                  },
                  font_weights: {
                    light: 300,
                    normal: 400,
                    medium: 500,
                    semibold: 600,
                    bold: 700,
                  },
                  google_fonts: ['Inter', 'Fira Code'],
                  is_custom: true,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                })
                .select('id')
                .single();

              expect(schemeError).toBeNull();
              createdFontSchemeId = fontScheme!.id;
              testFontSchemeIds.push(createdFontSchemeId);
            }

            // Test 1: Save initial customization
            const saveResult1 = await brandCustomizationManager!.saveTenantBranding({
              empresaId: createdEmpresaId,
              branding: initialCustomization,
              userId,
            });

            expect(saveResult1.success).toBe(true);
            expect(saveResult1.data).toBeTruthy();

            if (saveResult1.data?.tenantBranding.id) {
              createdTenantBrandingId = saveResult1.data.tenantBranding.id;
              testTenantBrandingIds.push(createdTenantBrandingId);
            }

            // Verify initial state was saved correctly
            const loadResult1 = await brandCustomizationManager!.loadTenantBranding({
              empresaId: createdEmpresaId,
            });

            expect(loadResult1.success).toBe(true);
            expect(loadResult1.data).toBeTruthy();
            expect(loadResult1.data!.tenantBranding.colorPaletteId).toBe(initialCustomization.colorPaletteId);
            expect(loadResult1.data!.tenantBranding.fontSchemeId).toBe(initialCustomization.fontSchemeId);
            expect(loadResult1.data!.tenantBranding.customCss).toBe(initialCustomization.customCss);

            // Store initial state for comparison
            const initialState = loadResult1.data!;

            // Test 2: Save modified customization (simulating user changes)
            const saveResult2 = await brandCustomizationManager!.saveTenantBranding({
              empresaId: createdEmpresaId,
              branding: modifiedCustomization,
              userId,
            });

            expect(saveResult2.success).toBe(true);
            expect(saveResult2.data).toBeTruthy();

            // Verify modified state was saved correctly
            const loadResult2 = await brandCustomizationManager!.loadTenantBranding({
              empresaId: createdEmpresaId,
            });

            expect(loadResult2.success).toBe(true);
            expect(loadResult2.data).toBeTruthy();
            expect(loadResult2.data!.tenantBranding.colorPaletteId).toBe(modifiedCustomization.colorPaletteId);
            expect(loadResult2.data!.tenantBranding.fontSchemeId).toBe(modifiedCustomization.fontSchemeId);
            expect(loadResult2.data!.tenantBranding.customCss).toBe(modifiedCustomization.customCss);

            // Test 3: Reset to default (simulating reset action)
            const resetResult = await brandCustomizationManager!.resetToDefault({
              empresaId: createdEmpresaId,
              userId,
              preserveLogos: false,
            });

            expect(resetResult.success).toBe(true);
            expect(resetResult.data).toBeTruthy();

            // Verify reset restored default state
            const loadResult3 = await brandCustomizationManager!.loadTenantBranding({
              empresaId: createdEmpresaId,
            });

            expect(loadResult3.success).toBe(true);
            expect(loadResult3.data).toBeTruthy();
            
            // After reset, should have default branding (no custom palette/scheme)
            expect(loadResult3.data!.tenantBranding.colorPaletteId).toBeUndefined();
            expect(loadResult3.data!.tenantBranding.fontSchemeId).toBeUndefined();
            expect(loadResult3.data!.tenantBranding.customCss).toBeUndefined();

            // Test 4: State consistency - multiple saves should be idempotent
            const saveResult3 = await brandCustomizationManager!.saveTenantBranding({
              empresaId: createdEmpresaId,
              branding: initialCustomization,
              userId,
            });

            const saveResult4 = await brandCustomizationManager!.saveTenantBranding({
              empresaId: createdEmpresaId,
              branding: initialCustomization,
              userId,
            });

            expect(saveResult3.success).toBe(true);
            expect(saveResult4.success).toBe(true);

            // Both saves should result in the same state
            const loadResult4 = await brandCustomizationManager!.loadTenantBranding({
              empresaId: createdEmpresaId,
            });

            const loadResult5 = await brandCustomizationManager!.loadTenantBranding({
              empresaId: createdEmpresaId,
            });

            expect(loadResult4.success).toBe(true);
            expect(loadResult5.success).toBe(true);
            expect(loadResult4.data!.tenantBranding.colorPaletteId).toBe(loadResult5.data!.tenantBranding.colorPaletteId);
            expect(loadResult4.data!.tenantBranding.fontSchemeId).toBe(loadResult5.data!.tenantBranding.fontSchemeId);
            expect(loadResult4.data!.tenantBranding.customCss).toBe(loadResult5.data!.tenantBranding.customCss);

            // Test 5: Cancel simulation - verify state can be restored to previous version
            // This simulates the cancel operation by reloading the initial state
            const cancelSimulationResult = await brandCustomizationManager!.saveTenantBranding({
              empresaId: createdEmpresaId,
              branding: {
                colorPaletteId: initialState.tenantBranding.colorPaletteId,
                fontSchemeId: initialState.tenantBranding.fontSchemeId,
                customCss: initialState.tenantBranding.customCss,
              },
              userId,
            });

            expect(cancelSimulationResult.success).toBe(true);

            // Verify state was restored to initial values
            const loadResultAfterCancel = await brandCustomizationManager!.loadTenantBranding({
              empresaId: createdEmpresaId,
            });

            expect(loadResultAfterCancel.success).toBe(true);
            expect(loadResultAfterCancel.data!.tenantBranding.colorPaletteId).toBe(initialState.tenantBranding.colorPaletteId);
            expect(loadResultAfterCancel.data!.tenantBranding.fontSchemeId).toBe(initialState.tenantBranding.fontSchemeId);
            expect(loadResultAfterCancel.data!.tenantBranding.customCss).toBe(initialState.tenantBranding.customCss);

          } catch (error) {
            console.error('Test execution error:', error);
            throw error;
          }
        }
      ),
      { numRuns: 10, timeout: 30000 }
    );
  });

  /**
   * Property 12b: State Management Error Handling
   * 
   * For any invalid customization data, the system should handle errors gracefully 
   * and maintain consistent state
   */
  it('should handle state management errors gracefully', async () => {
    if (!supabase || !brandCustomizationManager) {
      console.warn('Skipping test: Required dependencies not available');
      return;
    }

    await fc.assert(
      fc.asyncProperty(
        fc.record({
          empresaName: fc.string({ minLength: 3, maxLength: 50 }),
          invalidCustomization: fc.record({
            colorPaletteId: fc.option(fc.string({ minLength: 50, maxLength: 100 }), { nil: undefined }), // Invalid ID
            fontSchemeId: fc.option(fc.string({ minLength: 50, maxLength: 100 }), { nil: undefined }), // Invalid ID
            customCss: fc.option(fc.string({ minLength: 1000, maxLength: 2000 }), { nil: undefined }), // Very long CSS
          }),
          userId: fc.string({ minLength: 10, maxLength: 50 }),
        }),
        async ({ empresaName, invalidCustomization, userId }) => {
          let createdEmpresaId: string | null = null;

          try {
            // Create test empresa
            const { data: empresa, error: empresaError } = await supabase!
              .from('empresas')
              .insert({
                nome: empresaName,
                email: `test-${Date.now()}@example.com`,
                telefone: '1234567890',
                endereco: 'Test Address',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              })
              .select('id')
              .single();

            expect(empresaError).toBeNull();
            expect(empresa).toBeTruthy();
            createdEmpresaId = empresa!.id;
            testEmpresaIds.push(createdEmpresaId);

            // Test saving with invalid references
            const saveResult = await brandCustomizationManager!.saveTenantBranding({
              empresaId: createdEmpresaId,
              branding: invalidCustomization,
              userId,
            });

            // Should handle invalid references gracefully
            // Either succeed (ignoring invalid references) or fail with proper error
            if (!saveResult.success) {
              expect(saveResult.error).toBeTruthy();
              expect(typeof saveResult.error).toBe('string');
            }

            // Verify state remains consistent after error
            const loadResult = await brandCustomizationManager!.loadTenantBranding({
              empresaId: createdEmpresaId,
            });

            expect(loadResult.success).toBe(true);
            expect(loadResult.data).toBeTruthy();

            // Should have default branding if save failed, or saved branding if it succeeded
            if (saveResult.success) {
              // If save succeeded, verify the data was stored
              expect(loadResult.data!.tenantBranding.empresaId).toBe(createdEmpresaId);
            } else {
              // If save failed, should have default branding
              expect(loadResult.data!.tenantBranding.empresaId).toBe(createdEmpresaId);
            }

            // Test reset after error - should always work
            const resetResult = await brandCustomizationManager!.resetToDefault({
              empresaId: createdEmpresaId,
              userId,
            });

            expect(resetResult.success).toBe(true);
            expect(resetResult.data).toBeTruthy();

          } catch (error) {
            console.error('Error handling test execution error:', error);
            throw error;
          }
        }
      ),
      { numRuns: 5, timeout: 20000 }
    );
  });
});