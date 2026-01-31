/**
 * Property-Based Tests - Brand Customization Default Branding Fallback
 * 
 * Tests default branding fallback for the brand customization system.
 * Validates Requirements 4.5
 * 
 * Feature: brand-customization, Property 10: Default Branding Fallback
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'
import { createClient } from '@supabase/supabase-js'
import fc from 'fast-check'
import { BrandCustomizationManager } from '@/app/[tenant]/(modules)/settings/personalizacao/services/brand-customization-manager'
import { getDatabaseClient } from '@/app/shared/core/database/database'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY

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

describe('Brand Customization Default Branding Fallback', () => {
  let testEmpresaIds: string[] = []
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
      const { error } = await supabase.from('empresas').select('id').limit(1)
      if (error && error.code === '42P01') {
        console.warn('Empresas table does not exist. Run migrations first.')
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
      if (testEmpresaIds.length > 0) {
        await supabase.from('empresas').delete().in('id', testEmpresaIds)
      }
    } catch (error) {
      console.warn('Error during cleanup:', error)
    }
  })

  /**
   * Property 10: Default Branding Fallback
   * For any empresa without custom branding, the system should apply default system branding
   * Validates: Requirements 4.5
   */
  it('should apply default branding for any empresa without custom branding', async () => {
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
    } catch (_error) {
      console.warn('Skipping test: Could not access empresas table')
      return
    }

    await fc.assert(
      fc.asyncProperty(
        fc.array(empresaGenerator, { minLength: 1, maxLength: 5 }),
        async (empresas) => {
          const createdEmpresaIds: string[] = []

          try {
            // Create test empresas without any custom branding
            for (const empresaData of empresas) {
              const uniqueSlug = `${empresaData.slug}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
              const { data: empresa } = await supabase!
                .from('empresas')
                .insert({
                  ...empresaData,
                  slug: uniqueSlug,
                })
                .select()
                .single()

              createdEmpresaIds.push(empresa.id)
              testEmpresaIds.push(empresa.id)
            }

            // Test that each empresa gets default branding
            for (const empresaId of createdEmpresaIds) {
              const result = await brandCustomizationManager!.loadTenantBranding({
                empresaId,
                includeLogos: true,
                includeColorPalette: true,
                includeFontScheme: true,
                includeCustomPresets: true,
              })

              // Loading should succeed
              expect(result.success).toBe(true)
              expect(result.data).toBeDefined()

              if (result.data) {
                // Should have default branding configuration
                expect(result.data.tenantBranding.id).toBe('default')
                expect(result.data.tenantBranding.empresaId).toBe(empresaId)

                // Should have default color palette
                expect(result.data.colorPalette).toBeDefined()
                expect(result.data.colorPalette!.id).toBe('default')
                expect(result.data.colorPalette!.name).toBe('Default')
                expect(result.data.colorPalette!.empresaId).toBe(empresaId)
                expect(result.data.colorPalette!.isCustom).toBe(false)

                // Should have all required color properties
                expect(result.data.colorPalette!.primaryColor).toBeDefined()
                expect(result.data.colorPalette!.primaryForeground).toBeDefined()
                expect(result.data.colorPalette!.secondaryColor).toBeDefined()
                expect(result.data.colorPalette!.secondaryForeground).toBeDefined()
                expect(result.data.colorPalette!.backgroundColor).toBeDefined()
                expect(result.data.colorPalette!.foregroundColor).toBeDefined()
                expect(result.data.colorPalette!.sidebarBackground).toBeDefined()
                expect(result.data.colorPalette!.sidebarForeground).toBeDefined()

                // Should have default font scheme
                expect(result.data.fontScheme).toBeDefined()
                expect(result.data.fontScheme!.id).toBe('default')
                expect(result.data.fontScheme!.name).toBe('Default')
                expect(result.data.fontScheme!.empresaId).toBe(empresaId)
                expect(result.data.fontScheme!.isCustom).toBe(false)

                // Should have all required font properties
                expect(result.data.fontScheme!.fontSans).toBeDefined()
                expect(Array.isArray(result.data.fontScheme!.fontSans)).toBe(true)
                expect(result.data.fontScheme!.fontSans.length).toBeGreaterThan(0)
                expect(result.data.fontScheme!.fontMono).toBeDefined()
                expect(Array.isArray(result.data.fontScheme!.fontMono)).toBeDefined()
                expect(result.data.fontScheme!.fontMono.length).toBeGreaterThan(0)
                expect(result.data.fontScheme!.fontSizes).toBeDefined()
                expect(result.data.fontScheme!.fontWeights).toBeDefined()

                // Should have empty logos (null values)
                expect(result.data.logos).toBeDefined()
                expect(result.data.logos.login).toBeNull()
                expect(result.data.logos.sidebar).toBeNull()
                expect(result.data.logos.favicon).toBeNull()

                // Should have empty custom theme presets
                expect(result.data.customThemePresets).toBeDefined()
                expect(Array.isArray(result.data.customThemePresets)).toBe(true)
                expect(result.data.customThemePresets).toHaveLength(0)

                // Should have warning about using default configuration
                expect(result.warnings).toBeDefined()
                expect(result.warnings).toContain('No custom branding found, using default configuration')
              }
            }

            // Test that default branding is consistent across multiple loads
            for (const empresaId of createdEmpresaIds) {
              const result1 = await brandCustomizationManager!.loadTenantBranding({
                empresaId,
              })
              const result2 = await brandCustomizationManager!.loadTenantBranding({
                empresaId,
              })

              expect(result1.success).toBe(true)
              expect(result2.success).toBe(true)

              if (result1.data && result2.data) {
                // Both should return default branding
                expect(result1.data.tenantBranding.id).toBe('default')
                expect(result2.data.tenantBranding.id).toBe('default')
                
                // Color palettes should be identical
                expect(result1.data.colorPalette?.primaryColor).toBe(result2.data.colorPalette?.primaryColor)
                expect(result1.data.colorPalette?.backgroundColor).toBe(result2.data.colorPalette?.backgroundColor)
                
                // Font schemes should be identical
                expect(result1.data.fontScheme?.fontSans).toEqual(result2.data.fontScheme?.fontSans)
                expect(result1.data.fontScheme?.fontMono).toEqual(result2.data.fontScheme?.fontMono)
              }
            }

            // Test that default branding has valid CSS color values
            for (const empresaId of createdEmpresaIds) {
              const result = await brandCustomizationManager!.loadTenantBranding({
                empresaId,
              })

              if (result.data?.colorPalette) {
                const palette = result.data.colorPalette
                
                // All color values should be valid CSS color strings
                const colorProperties = [
                  palette.primaryColor,
                  palette.primaryForeground,
                  palette.secondaryColor,
                  palette.secondaryForeground,
                  palette.backgroundColor,
                  palette.foregroundColor,
                  palette.sidebarBackground,
                  palette.sidebarForeground,
                ]

                for (const color of colorProperties) {
                  // Should be a string
                  expect(typeof color).toBe('string')
                  // Should not be empty
                  expect(color.length).toBeGreaterThan(0)
                  // Should be a valid CSS color (hsl format expected)
                  expect(color).toMatch(/^hsl\(\d+(\.\d+)?\s+\d+(\.\d+)?%\s+\d+(\.\d+)?%\)$/)
                }
              }
            }

          } catch (error) {
            // Clean up on error
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
   * Test that reset to default functionality works correctly
   */
  it('should reset to default branding for any empresa', async () => {
    if (!supabase || !brandCustomizationManager) {
      console.warn('Skipping test: Required dependencies not available')
      return
    }

    await fc.assert(
      fc.asyncProperty(
        empresaGenerator,
        async (empresaData) => {
          let createdEmpresaId: string | null = null

          try {
            // Create test empresa
            const uniqueSlug = `${empresaData.slug}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
            const { data: empresa } = await supabase!
              .from('empresas')
              .insert({
                ...empresaData,
                slug: uniqueSlug,
              })
              .select()
              .single()

            if (empresa) {
              createdEmpresaId = empresa.id
              testEmpresaIds.push(empresa.id)

              // Reset to default (should work even if no custom branding exists)
              const resetResult = await brandCustomizationManager!.resetToDefault({
                empresaId: createdEmpresaId,
                preserveLogos: false,
              })

              // Reset should succeed
              expect(resetResult.success).toBe(true)
              expect(resetResult.data).toBeDefined()

              if (resetResult.data) {
                // Should return default branding configuration
                expect(resetResult.data.tenantBranding.id).toBe('default')
                expect(resetResult.data.tenantBranding.empresaId).toBe(createdEmpresaId)
                expect(resetResult.data.colorPalette?.id).toBe('default')
                expect(resetResult.data.fontScheme?.id).toBe('default')
              }

              // Load branding after reset should also return default
              const loadResult = await brandCustomizationManager!.loadTenantBranding({
                empresaId: createdEmpresaId,
              })

              expect(loadResult.success).toBe(true)
              expect(loadResult.data?.tenantBranding.id).toBe('default')
              expect(loadResult.warnings).toContain('No custom branding found, using default configuration')
            }

          } catch (error) {
            // Clean up on error
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

  /**
   * Test that default branding values are reasonable and consistent
   */
  it('should provide consistent default branding values', async () => {
    if (!supabase || !brandCustomizationManager) {
      console.warn('Skipping test: Required dependencies not available')
      return
    }

    await fc.assert(
      fc.asyncProperty(
        fc.array(empresaGenerator, { minLength: 2, maxLength: 3 }),
        async (empresas) => {
          const createdEmpresaIds: string[] = []

          try {
            // Create multiple test empresas
            for (const empresaData of empresas) {
              const uniqueSlug = `${empresaData.slug}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
              const { data: empresa } = await supabase!
                .from('empresas')
                .insert({
                  ...empresaData,
                  slug: uniqueSlug,
                })
                .select()
                .single()

              if (empresa) {
                createdEmpresaIds.push(empresa.id)
                testEmpresaIds.push(empresa.id)
              }
            }

            // Load default branding for all empresas
            const results = await Promise.all(
              createdEmpresaIds.map(empresaId =>
                brandCustomizationManager!.loadTenantBranding({ empresaId })
              )
            )

            // All should succeed
            results.forEach(result => {
              expect(result.success).toBe(true)
              expect(result.data).toBeDefined()
            })

            // All should have identical default color palettes (except empresaId)
            const firstPalette = results[0].data!.colorPalette!
            for (let i = 1; i < results.length; i++) {
              const palette = results[i].data!.colorPalette!
              
              expect(palette.primaryColor).toBe(firstPalette.primaryColor)
              expect(palette.secondaryColor).toBe(firstPalette.secondaryColor)
              expect(palette.backgroundColor).toBe(firstPalette.backgroundColor)
              expect(palette.sidebarBackground).toBe(firstPalette.sidebarBackground)
              expect(palette.isCustom).toBe(false)
            }

            // All should have identical default font schemes (except empresaId)
            const firstScheme = results[0].data!.fontScheme!
            for (let i = 1; i < results.length; i++) {
              const scheme = results[i].data!.fontScheme!
              
              expect(scheme.fontSans).toEqual(firstScheme.fontSans)
              expect(scheme.fontMono).toEqual(firstScheme.fontMono)
              expect(scheme.fontSizes).toEqual(firstScheme.fontSizes)
              expect(scheme.fontWeights).toEqual(firstScheme.fontWeights)
              expect(scheme.isCustom).toBe(false)
            }

          } catch (error) {
            // Clean up on error
            if (createdEmpresaIds.length > 0) {
              await supabase!.from('empresas').delete().in('id', createdEmpresaIds)
            }
            throw error
          }
        }
      ),
      { numRuns: 50 }
    )
  }, 30000)
})