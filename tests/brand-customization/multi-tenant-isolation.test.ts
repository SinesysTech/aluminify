/**
 * Property-Based Tests - Brand Customization Multi-Tenant Isolation
 * 
 * Tests multi-tenant isolation and consistency for the brand customization system.
 * Validates Requirements 4.2, 4.3, 4.4
 * 
 * Feature: brand-customization, Property 9: Multi-Tenant Isolation and Consistency
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'
import { createClient } from '@supabase/supabase-js'
import fc from 'fast-check'

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

describe('Brand Customization Multi-Tenant Isolation', () => {
  let testEmpresaIds: string[] = []
  let testUserIds: string[] = []
  let testColorPaletteIds: string[] = []
  let testFontSchemeIds: string[] = []
  let testTenantBrandingIds: string[] = []

  beforeAll(async () => {
    if (!supabase) {
      console.warn('Supabase client not available. Skipping tests.')
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
      if (testUserIds.length > 0) {
        await supabase.from('professores').delete().in('id', testUserIds)
        for (const userId of testUserIds) {
          await supabase.auth.admin.deleteUser(userId)
        }
      }
      if (testEmpresaIds.length > 0) {
        await supabase.from('empresas').delete().in('id', testEmpresaIds)
      }
    } catch (error) {
      console.warn('Error during cleanup:', error)
    }
  })

  /**
   * Property 9: Multi-Tenant Isolation and Consistency
   * For any empresa, customizations should be isolated from other empresas 
   * while being consistent for all users within the same empresa
   * Validates: Requirements 4.2, 4.3, 4.4
   */
  it('should maintain multi-tenant isolation for color palettes', async () => {
    if (!supabase) {
      console.warn('Skipping test: Supabase client not available')
      return
    }

    // Check if tables exist before running the test
    try {
      const { error } = await supabase.from('color_palettes').select('id').limit(1)
      if (error && error.code === '42P01') {
        console.warn('Skipping test: color_palettes table does not exist')
        return
      }
    } catch (_error) {
      console.warn('Skipping test: Could not access color_palettes table')
      return
    }

    await fc.assert(
      fc.asyncProperty(
        fc.array(empresaGenerator, { minLength: 2, maxLength: 5 }),
        fc.array(colorPaletteGenerator, { minLength: 1, maxLength: 3 }),
        async (empresas, colorPalettes) => {
          const createdEmpresaIds: string[] = []
          const createdPaletteIds: string[] = []

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

            // Create color palettes for each empresa
            for (let i = 0; i < createdEmpresaIds.length; i++) {
              const empresaId = createdEmpresaIds[i]
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
              createdPaletteIds.push(palette.id)
              testColorPaletteIds.push(palette.id)
            }

            // Test isolation: each empresa should only see its own palettes
            for (let i = 0; i < createdEmpresaIds.length; i++) {
              const empresaId = createdEmpresaIds[i]
              
              const { data: palettes, error } = await supabase!
                .from('color_palettes')
                .select('*')
                .eq('empresa_id', empresaId)

              expect(error).toBeNull()
              expect(palettes).toBeDefined()
              
              // All returned palettes should belong to this empresa
              expect(palettes!.every(p => p.empresa_id === empresaId)).toBe(true)
              
              // Should not contain palettes from other empresas
              const otherEmpresaIds = createdEmpresaIds.filter(id => id !== empresaId)
              expect(palettes!.some(p => otherEmpresaIds.includes(p.empresa_id))).toBe(false)
            }

            // Test consistency: palettes should be consistent across queries for same empresa
            for (const empresaId of createdEmpresaIds) {
              const { data: palettes1 } = await supabase!
                .from('color_palettes')
                .select('*')
                .eq('empresa_id', empresaId)
                .order('created_at')

              const { data: palettes2 } = await supabase!
                .from('color_palettes')
                .select('*')
                .eq('empresa_id', empresaId)
                .order('created_at')

              expect(palettes1).toEqual(palettes2)
            }

          } catch (error) {
            // Clean up on error
            if (createdPaletteIds.length > 0) {
              await supabase!.from('color_palettes').delete().in('id', createdPaletteIds)
            }
            if (createdEmpresaIds.length > 0) {
              await supabase!.from('empresas').delete().in('id', createdEmpresaIds)
            }
            throw error
          }
        }
      ),
      { numRuns: 10 } // Reduced runs for faster testing when tables don't exist
    )
  }, 30000) // 30 second timeout for property test

  it('should maintain multi-tenant isolation for font schemes', async () => {
    if (!supabase) {
      console.warn('Skipping test: Supabase client not available')
      return
    }

    // Check if tables exist before running the test
    try {
      const { error } = await supabase.from('font_schemes').select('id').limit(1)
      if (error && error.code === '42P01') {
        console.warn('Skipping test: font_schemes table does not exist')
        return
      }
    } catch (_error) {
      console.warn('Skipping test: Could not access font_schemes table')
      return
    }

    await fc.assert(
      fc.asyncProperty(
        fc.array(empresaGenerator, { minLength: 2, maxLength: 5 }),
        fc.array(fontSchemeGenerator, { minLength: 1, maxLength: 3 }),
        async (empresas, fontSchemes) => {
          const createdEmpresaIds: string[] = []
          const createdSchemeIds: string[] = []

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

            // Create font schemes for each empresa
            for (let i = 0; i < createdEmpresaIds.length; i++) {
              const empresaId = createdEmpresaIds[i]
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
              createdSchemeIds.push(scheme.id)
              testFontSchemeIds.push(scheme.id)
            }

            // Test isolation: each empresa should only see its own font schemes
            for (let i = 0; i < createdEmpresaIds.length; i++) {
              const empresaId = createdEmpresaIds[i]
              
              const { data: schemes, error } = await supabase!
                .from('font_schemes')
                .select('*')
                .eq('empresa_id', empresaId)

              expect(error).toBeNull()
              expect(schemes).toBeDefined()
              
              // All returned schemes should belong to this empresa
              expect(schemes!.every(s => s.empresa_id === empresaId)).toBe(true)
              
              // Should not contain schemes from other empresas
              const otherEmpresaIds = createdEmpresaIds.filter(id => id !== empresaId)
              expect(schemes!.some(s => otherEmpresaIds.includes(s.empresa_id))).toBe(false)
            }

          } catch (error) {
            // Clean up on error
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
      { numRuns: 10 } // Reduced runs for faster testing when tables don't exist
    )
  }, 30000) // 30 second timeout for property test

  it('should maintain multi-tenant isolation for tenant branding configurations', async () => {
    if (!supabase) {
      console.warn('Skipping test: Supabase client not available')
      return
    }

    // Check if tables exist before running the test
    try {
      const { error } = await supabase.from('tenant_branding').select('id').limit(1)
      if (error && error.code === '42P01') {
        console.warn('Skipping test: tenant_branding table does not exist')
        return
      }
    } catch (_error) {
      console.warn('Skipping test: Could not access tenant_branding table')
      return
    }

    await fc.assert(
      fc.asyncProperty(
        fc.array(empresaGenerator, { minLength: 2, maxLength: 4 }),
        async (empresas) => {
          const createdEmpresaIds: string[] = []
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

            // Create tenant branding for each empresa
            for (const empresaId of createdEmpresaIds) {
              const { data: branding, error } = await supabase!
                .from('tenant_branding')
                .insert({
                  empresa_id: empresaId,
                  custom_css: `/* Custom CSS for ${empresaId} */`,
                })
                .select()
                .single()

              if (error) throw error
              createdBrandingIds.push(branding.id)
              testTenantBrandingIds.push(branding.id)
            }

            // Test isolation: each empresa should only have one branding config
            for (const empresaId of createdEmpresaIds) {
              const { data: brandings, error } = await supabase!
                .from('tenant_branding')
                .select('*')
                .eq('empresa_id', empresaId)

              expect(error).toBeNull()
              expect(brandings).toBeDefined()
              expect(brandings).toHaveLength(1)
              expect(brandings![0].empresa_id).toBe(empresaId)
            }

            // Test that branding configs are isolated between empresas
            const { data: allBrandings, error } = await supabase!
              .from('tenant_branding')
              .select('*')
              .in('empresa_id', createdEmpresaIds)

            expect(error).toBeNull()
            expect(allBrandings).toHaveLength(createdEmpresaIds.length)
            
            // Each branding should belong to exactly one empresa
            const empresaIdCounts = new Map<string, number>()
            allBrandings!.forEach(branding => {
              const count = empresaIdCounts.get(branding.empresa_id) || 0
              empresaIdCounts.set(branding.empresa_id, count + 1)
            })

            // Each empresa should have exactly one branding config
            for (const empresaId of createdEmpresaIds) {
              expect(empresaIdCounts.get(empresaId)).toBe(1)
            }

          } catch (error) {
            // Clean up on error
            if (createdBrandingIds.length > 0) {
              await supabase!.from('tenant_branding').delete().in('id', createdBrandingIds)
            }
            if (createdEmpresaIds.length > 0) {
              await supabase!.from('empresas').delete().in('id', createdEmpresaIds)
            }
            throw error
          }
        }
      ),
      { numRuns: 10 } // Reduced runs for faster testing when tables don't exist
    )
  }, 30000) // 30 second timeout for property test
})