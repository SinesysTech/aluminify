/**
 * Property-Based Tests - Brand Customization Tenant-Specific Loading
 * 
 * Tests tenant-specific customization loading for the brand customization system.
 * Validates Requirements 4.1
 * 
 * Feature: brand-customization, Property 8: Tenant-Specific Customization Loading
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'
import { createClient } from '@supabase/supabase-js'
import fc from 'fast-check'
import { BrandCustomizationManager } from '@/backend/services/brand-customization'
import { getDatabaseClient } from '@/backend/clients/database'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.warn('Supabase environment variables not found. Skipping brand customization tests.')
}

const supabase = SUPABASE_URL && SUPABASE_SERVICE_KEY 
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  : null

// Test data generators
const empresaGenerator = fc.record({
  nome: fc.string({ minLength: 3, maxLength: 50 }),
  slug: fc.string({ minLength: 3, maxLength: 30 }).map(s => s.toLowerCase().replace(/[^a-z0-9]/g, '-')),
  ativo: fc.boolean(),
})

const colorPaletteGenerator = fc.record({
  name: fc.string({ minLength: 3, maxLength: 30 }),
  primary_color: fc.integer({ min: 0, max: 0xFFFFFF }).map(n => `#${n.toString(16).padStart(6, '0')}`),
  primary_foreground: fc.integer({ min: 0, max: 0xFFFFFF }).map(n => `#${n.toString(16).padStart(6, '0')}`),
  secondary_color: fc.integer({ min: 0, max: 0xFFFFFF }).map(n => `#${n.toString(16).padStart(6, '0')}`),
  secondary_foreground: fc.integer({ min: 0, max: 0xFFFFFF }).map(n => `#${n.toString(16).padStart(6, '0')}`),
  accent_color: fc.integer({ min: 0, max: 0xFFFFFF }).map(n => `#${n.toString(16).padStart(6, '0')}`),
  accent_foreground: fc.integer({ min: 0, max: 0xFFFFFF }).map(n => `#${n.toString(16).padStart(6, '0')}`),
  muted_color: fc.integer({ min: 0, max: 0xFFFFFF }).map(n => `#${n.toString(16).padStart(6, '0')}`),
  muted_foreground: fc.integer({ min: 0, max: 0xFFFFFF }).map(n => `#${n.toString(16).padStart(6, '0')}`),
  background_color: fc.integer({ min: 0, max: 0xFFFFFF }).map(n => `#${n.toString(16).padStart(6, '0')}`),
  foreground_color: fc.integer({ min: 0, max: 0xFFFFFF }).map(n => `#${n.toString(16).padStart(6, '0')}`),
  card_color: fc.integer({ min: 0, max: 0xFFFFFF }).map(n => `#${n.toString(16).padStart(6, '0')}`),
  card_foreground: fc.integer({ min: 0, max: 0xFFFFFF }).map(n => `#${n.toString(16).padStart(6, '0')}`),
  destructive_color: fc.integer({ min: 0, max: 0xFFFFFF }).map(n => `#${n.toString(16).padStart(6, '0')}`),
  destructive_foreground: fc.integer({ min: 0, max: 0xFFFFFF }).map(n => `#${n.toString(16).padStart(6, '0')}`),
  sidebar_background: fc.integer({ min: 0, max: 0xFFFFFF }).map(n => `#${n.toString(16).padStart(6, '0')}`),
  sidebar_foreground: fc.integer({ min: 0, max: 0xFFFFFF }).map(n => `#${n.toString(16).padStart(6, '0')}`),
  sidebar_primary: fc.integer({ min: 0, max: 0xFFFFFF }).map(n => `#${n.toString(16).padStart(6, '0')}`),
  sidebar_primary_foreground: fc.integer({ min: 0, max: 0xFFFFFF }).map(n => `#${n.toString(16).padStart(6, '0')}`),
})

const fontSchemeGenerator = fc.record({
  name: fc.string({ minLength: 3, maxLength: 30 }),
  font_sans: fc.constant(['Inter', 'system-ui', 'sans-serif']),
  font_mono: fc.constant(['Fira Code', 'monospace']),
  font_sizes: fc.constant({
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
    '4xl': '2.25rem'
  }),
  font_weights: fc.constant({
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700
  }),
  google_fonts: fc.array(fc.string({ minLength: 3, maxLength: 20 }), { maxLength: 3 }),
})

describe('Brand Customization Tenant-Specific Loading', () => {
  let testEmpresaIds: string[] = []
  let testColorPaletteIds: string[] = []
  let testFontSchemeIds: string[] = []
  let testTenantBrandingIds: string[] = []
  let brandCustomizationManager: BrandCustomizationManager | null = null

  beforeAll(async () => {
    if (!supabase) {
      console.warn('Supabase client not available. Skipping tests.')
      return
    }

    try {
      const dbClient = getDatabaseClient()
      brandCustomizationManager = new BrandCustomizationManager(dbClient)
    } catch (error) {
      console.warn('Could not create BrandCustomizationManager:', error)
      return
    }

    // Check if brand customization tables exist
    try {
      const { error } = await supabase.from('tenant_branding').select('id').limit(1)
      if (error && error.code === '42P01') {
        console.warn('Brand customization tables do not exist. Run migrations first.')
        return
      }
    } catch (error) {
      console.warn('Could not check table existence:', error)
      return
    }
  })

  afterAll(async () => {
    if (!supabase) return

    // Clean up all test data
    try {
      if (testTenantBrandingIds.length > 0) {
        await supabase.from('tenant_branding').delete().in('id', testTenantBrandingIds)
      }
      if (testColorPaletteIds.length > 0) {
        await supabase.from('color_palettes').delete().in('id', testColorPaletteIds)
      }
      if (testFontSchemeIds.length > 0) {
        await supabase.from('font_schemes').delete().in('id', testFontSchemeIds)
      }
      if (testEmpresaIds.length > 0) {
        await supabase.from('empresas').delete().in('id', testEmpresaIds)
      }
    } catch (error) {
      console.warn('Error during cleanup:', error)
    }
  })

  /**
   * Property 8: Tenant-Specific Customization Loading
   * For any user login, the system should load and apply customizations specific to their empresa automatically
   * Validates: Requirements 4.1
   */
  it('should load tenant-specific customizations for any empresa', async () => {
    if (!supabase || !brandCustomizationManager) {
      console.warn('Skipping test: Required dependencies not available')
      return
    }

    // Check if tables exist before running the test
    try {
      const { error } = await supabase.from('empresas').select('id').limit(1)
      if (error && error.code === '42P01') {
        console.warn('Skipping test: empresas table does not exist')
        return
      }
    } catch (error) {
      console.warn('Skipping test: Could not access empresas table')
      return
    }

    await fc.assert(
      fc.asyncProperty(
        fc.array(empresaGenerator, { minLength: 1, maxLength: 3 }),
        fc.array(colorPaletteGenerator, { minLength: 0, maxLength: 2 }),
        fc.array(fontSchemeGenerator, { minLength: 0, maxLength: 2 }),
        async (empresas, colorPalettes, fontSchemes) => {
          const createdEmpresaIds: string[] = []
          const createdPaletteIds: string[] = []
          const createdSchemeIds: string[] = []
          const createdBrandingIds: string[] = []

          try {
            // Create test empresas
            for (const empresaData of empresas) {
              const uniqueSlug = `${empresaData.slug}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
              const { data: empresa, error } = await supabase!
                .from('empresas')
                .insert({
                  ...empresaData,
                  slug: uniqueSlug,
                })
                .select()
                .single()

              if (error) throw error
              createdEmpresaIds.push(empresa.id)
              testEmpresaIds.push(empresa.id)
            }

            // Create color palettes and font schemes for some empresas
            for (let i = 0; i < createdEmpresaIds.length; i++) {
              const empresaId = createdEmpresaIds[i]
              let colorPaletteId: string | undefined
              let fontSchemeId: string | undefined

              // Create color palette if available
              if (colorPalettes.length > 0) {
                const paletteIndex = i % colorPalettes.length
                const paletteData = colorPalettes[paletteIndex]

                const { data: palette, error } = await supabase!
                  .from('color_palettes')
                  .insert({
                    ...paletteData,
                    empresa_id: empresaId,
                  })
                  .select()
                  .single()

                if (error) throw error
                colorPaletteId = palette.id
                createdPaletteIds.push(palette.id)
                testColorPaletteIds.push(palette.id)
              }

              // Create font scheme if available
              if (fontSchemes.length > 0) {
                const schemeIndex = i % fontSchemes.length
                const schemeData = fontSchemes[schemeIndex]

                const { data: scheme, error } = await supabase!
                  .from('font_schemes')
                  .insert({
                    ...schemeData,
                    empresa_id: empresaId,
                  })
                  .select()
                  .single()

                if (error) throw error
                fontSchemeId = scheme.id
                createdSchemeIds.push(scheme.id)
                testFontSchemeIds.push(scheme.id)
              }

              // Create tenant branding if we have customizations
              if (colorPaletteId || fontSchemeId) {
                const { data: branding, error } = await supabase!
                  .from('tenant_branding')
                  .insert({
                    empresa_id: empresaId,
                    color_palette_id: colorPaletteId,
                    font_scheme_id: fontSchemeId,
                    custom_css: `/* Custom CSS for ${empresaId} */`,
                  })
                  .select()
                  .single()

                if (error) throw error
                createdBrandingIds.push(branding.id)
                testTenantBrandingIds.push(branding.id)
              }
            }

            // Test loading customizations for each empresa
            for (const empresaId of createdEmpresaIds) {
              const result = await brandCustomizationManager!.loadTenantBranding({
                empresaId,
                includeLogos: true,
                includeColorPalette: true,
                includeFontScheme: true,
                includeCustomPresets: true,
              })

              // Loading should always succeed
              expect(result.success).toBe(true)
              expect(result.data).toBeDefined()

              if (result.data) {
                // Branding should be specific to this empresa
                expect(result.data.tenantBranding.empresaId).toBe(empresaId)

                // If we created custom branding, it should be loaded
                const hasCustomBranding = createdBrandingIds.some(id => 
                  result.data!.tenantBranding.id === id
                )

                if (hasCustomBranding) {
                  // Should have custom branding data
                  expect(result.data.tenantBranding.id).not.toBe('default')
                  
                  // Color palette should match if we created one
                  const expectedPalette = createdPaletteIds.find(id => 
                    result.data!.colorPalette?.id === id
                  )
                  if (expectedPalette) {
                    expect(result.data.colorPalette).toBeDefined()
                    expect(result.data.colorPalette!.empresaId).toBe(empresaId)
                  }

                  // Font scheme should match if we created one
                  const expectedScheme = createdSchemeIds.find(id => 
                    result.data!.fontScheme?.id === id
                  )
                  if (expectedScheme) {
                    expect(result.data.fontScheme).toBeDefined()
                    expect(result.data.fontScheme!.empresaId).toBe(empresaId)
                  }
                } else {
                  // Should have default branding
                  expect(result.data.tenantBranding.id).toBe('default')
                  expect(result.data.colorPalette?.id).toBe('default')
                  expect(result.data.fontScheme?.id).toBe('default')
                  expect(result.warnings).toContain('No custom branding found, using default configuration')
                }

                // Logos should always be initialized (even if null)
                expect(result.data.logos).toBeDefined()
                expect(result.data.logos.login).toBeNull()
                expect(result.data.logos.sidebar).toBeNull()
                expect(result.data.logos.favicon).toBeNull()

                // Custom theme presets should be initialized
                expect(result.data.customThemePresets).toBeDefined()
                expect(Array.isArray(result.data.customThemePresets)).toBe(true)
              }
            }

            // Test that loading is consistent for the same empresa
            for (const empresaId of createdEmpresaIds) {
              const result1 = await brandCustomizationManager!.loadTenantBranding({
                empresaId,
              })
              const result2 = await brandCustomizationManager!.loadTenantBranding({
                empresaId,
              })

              expect(result1.success).toBe(result2.success)
              if (result1.data && result2.data) {
                expect(result1.data.tenantBranding.id).toBe(result2.data.tenantBranding.id)
                expect(result1.data.tenantBranding.empresaId).toBe(result2.data.tenantBranding.empresaId)
              }
            }

            // Test that non-existent empresa returns error
            const nonExistentEmpresaId = 'non-existent-' + Math.random().toString(36).substr(2, 9)
            const invalidResult = await brandCustomizationManager!.loadTenantBranding({
              empresaId: nonExistentEmpresaId,
            })

            expect(invalidResult.success).toBe(false)
            expect(invalidResult.error).toContain('not found')

          } catch (error) {
            // Clean up on error
            if (createdBrandingIds.length > 0) {
              await supabase!.from('tenant_branding').delete().in('id', createdBrandingIds)
            }
            if (createdPaletteIds.length > 0) {
              await supabase!.from('color_palettes').delete().in('id', createdPaletteIds)
            }
            if (createdSchemeIds.length > 0) {
              await supabase!.from('font_schemes').delete().in('id', createdSchemeIds)
            }
            if (createdEmpresaIds.length > 0) {
              await supabase!.from('empresas').delete().in('id', createdEmpresaIds)
            }
            throw error
          }
        }
      ),
      { numRuns: 100 } // 100 iterations as specified in design
    )
  }, 60000) // 60 second timeout for property test

  /**
   * Test that loading handles missing dependencies gracefully
   */
  it('should handle missing color palettes and font schemes gracefully', async () => {
    if (!supabase || !brandCustomizationManager) {
      console.warn('Skipping test: Required dependencies not available')
      return
    }

    await fc.assert(
      fc.asyncProperty(
        empresaGenerator,
        async (empresaData) => {
          let createdEmpresaId: string | null = null
          let createdBrandingId: string | null = null

          try {
            // Create test empresa
            const uniqueSlug = `${empresaData.slug}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
            const { data: empresa, error } = await supabase!
              .from('empresas')
              .insert({
                ...empresaData,
                slug: uniqueSlug,
              })
              .select()
              .single()

            if (error) throw error
            createdEmpresaId = empresa.id
            testEmpresaIds.push(empresa.id)

            // Create tenant branding with invalid references
            const { data: branding, error: brandingError } = await supabase!
              .from('tenant_branding')
              .insert({
                empresa_id: createdEmpresaId,
                color_palette_id: 'invalid-palette-id',
                font_scheme_id: 'invalid-scheme-id',
              })
              .select()
              .single()

            if (brandingError) throw brandingError
            createdBrandingId = branding.id
            testTenantBrandingIds.push(branding.id)

            // Load branding - should handle missing references gracefully
            const result = await brandCustomizationManager!.loadTenantBranding({
              empresaId: createdEmpresaId,
              includeColorPalette: true,
              includeFontScheme: true,
            })

            // Should succeed even with invalid references
            expect(result.success).toBe(true)
            expect(result.data).toBeDefined()

            if (result.data) {
              // Should have tenant branding
              expect(result.data.tenantBranding.empresaId).toBe(createdEmpresaId)
              
              // Color palette and font scheme should be undefined due to invalid references
              expect(result.data.colorPalette).toBeUndefined()
              expect(result.data.fontScheme).toBeUndefined()
            }

          } catch (error) {
            // Clean up on error
            if (createdBrandingId) {
              await supabase!.from('tenant_branding').delete().eq('id', createdBrandingId)
            }
            if (createdEmpresaId) {
              await supabase!.from('empresas').delete().eq('id', createdEmpresaId)
            }
            throw error
          }
        }
      ),
      { numRuns: 50 }
    )
  }, 30000)
})