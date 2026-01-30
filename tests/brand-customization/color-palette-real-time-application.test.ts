/**
 * Property-Based Tests - Color Palette Real-time Application
 * 
 * Tests real-time application of color palettes via CSS custom properties.
 * Validates Requirements 2.3, 2.4
 * 
 * Feature: brand-customization, Property 3: Color Palette Real-time Application
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'
import { createClient } from '@supabase/supabase-js'
import fc from 'fast-check'
import { ColorPaletteManagerImpl } from '@/app/[tenant]/(modules)/empresa/(gestao)/personalizacao/services/color-palette-manager'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.warn('Supabase environment variables not found. Skipping color palette real-time application tests.')
}

const supabase = SUPABASE_URL && SUPABASE_SERVICE_KEY 
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  : null

// Test data generators
const colorGenerator = fc.integer({ min: 0, max: 0xFFFFFF }).map(n => `#${n.toString(16).padStart(6, '0')}`)

const colorPaletteGenerator = fc.record({
  name: fc.string({ minLength: 3, maxLength: 30 }),
  primaryColor: colorGenerator,
  primaryForeground: colorGenerator,
  secondaryColor: colorGenerator,
  secondaryForeground: colorGenerator,
  accentColor: colorGenerator,
  accentForeground: colorGenerator,
  mutedColor: colorGenerator,
  mutedForeground: colorGenerator,
  backgroundColor: colorGenerator,
  foregroundColor: colorGenerator,
  cardColor: colorGenerator,
  cardForeground: colorGenerator,
  destructiveColor: colorGenerator,
  destructiveForeground: colorGenerator,
  sidebarBackground: colorGenerator,
  sidebarForeground: colorGenerator,
  sidebarPrimary: colorGenerator,
  sidebarPrimaryForeground: colorGenerator,
})

const empresaGenerator = fc.record({
  nome: fc.string({ minLength: 3, maxLength: 50 }),
  slug: fc.string({ minLength: 3, maxLength: 30 }).map(s => s.toLowerCase().replace(/[^a-z0-9]/g, '-')),
  ativo: fc.boolean(),
})

describe('Color Palette Real-time Application', () => {
  let testEmpresaIds: string[] = []
  let testColorPaletteIds: string[] = []
  let colorPaletteManager: ColorPaletteManagerImpl | null = null

  beforeAll(async () => {
    if (!supabase) {
      console.warn('Skipping tests due to missing Supabase configuration')
      return
    }

    colorPaletteManager = new ColorPaletteManagerImpl(supabase)
  })

  afterAll(async () => {
    if (!supabase) return

    try {
      // Clean up test data
      if (testColorPaletteIds.length > 0) {
        await supabase.from('color_palettes').delete().in('id', testColorPaletteIds)
      }
      if (testEmpresaIds.length > 0) {
        await supabase.from('empresas').delete().in('id', testEmpresaIds)
      }
    } catch (error) {
      console.warn('Error cleaning up test data:', error)
    }
  })

  it('should generate correct CSS custom properties from color palette', async () => {
    if (!supabase || !colorPaletteManager) {
      console.warn('Skipping test due to missing dependencies')
      return
    }

    await fc.assert(
      fc.asyncProperty(
        empresaGenerator,
        colorPaletteGenerator,
        async (empresaData, paletteData) => {
          let createdEmpresaId: string | null = null
          let createdPaletteId: string | null = null

          try {
            // Create test empresa
            const { data: empresa, error: empresaError } = await supabase!
              .from('empresas')
              .insert({
                nome: empresaData.nome,
                slug: empresaData.slug,
                ativo: empresaData.ativo,
              })
              .select('id')
              .single()

            if (empresaError) throw empresaError
            createdEmpresaId = empresa.id
            testEmpresaIds.push(empresa.id)

            // Create color palette
            createdPaletteId = await colorPaletteManager!.createPalette(createdEmpresaId, paletteData)
            testColorPaletteIds.push(createdPaletteId)

            // Get the created palette
            const palette = await colorPaletteManager!.getPalette(createdPaletteId)
            expect(palette).toBeDefined()

            if (palette) {
              // Generate CSS properties
              const cssProperties = colorPaletteManager!.generateCSSProperties(palette)

              // Verify all expected properties are present
              expect(cssProperties['--primary']).toBe(palette.primaryColor)
              expect(cssProperties['--primary-foreground']).toBe(palette.primaryForeground)
              expect(cssProperties['--secondary']).toBe(palette.secondaryColor)
              expect(cssProperties['--secondary-foreground']).toBe(palette.secondaryForeground)
              expect(cssProperties['--accent']).toBe(palette.accentColor)
              expect(cssProperties['--accent-foreground']).toBe(palette.accentForeground)
              expect(cssProperties['--muted']).toBe(palette.mutedColor)
              expect(cssProperties['--muted-foreground']).toBe(palette.mutedForeground)
              expect(cssProperties['--background']).toBe(palette.backgroundColor)
              expect(cssProperties['--foreground']).toBe(palette.foregroundColor)
              expect(cssProperties['--card']).toBe(palette.cardColor)
              expect(cssProperties['--card-foreground']).toBe(palette.cardForeground)
              expect(cssProperties['--destructive']).toBe(palette.destructiveColor)
              expect(cssProperties['--destructive-foreground']).toBe(palette.destructiveForeground)
              expect(cssProperties['--sidebar-background']).toBe(palette.sidebarBackground)
              expect(cssProperties['--sidebar-foreground']).toBe(palette.sidebarForeground)
              expect(cssProperties['--sidebar-primary']).toBe(palette.sidebarPrimary)
              expect(cssProperties['--sidebar-primary-foreground']).toBe(palette.sidebarPrimaryForeground)

              // Verify no undefined or null values
              Object.values(cssProperties).forEach(value => {
                expect(value).toBeDefined()
                expect(value).not.toBeNull()
                expect(typeof value).toBe('string')
                expect(value.trim()).not.toBe('')
              })

              // Verify that applying the palette would update CSS properties correctly
              // Test the core logic without DOM manipulation
              const expectedPropertyCount = 18 // All CSS custom properties
              expect(Object.keys(cssProperties).length).toBe(expectedPropertyCount)

              // Verify color format consistency
              Object.entries(cssProperties).forEach(([property, value]) => {
                expect(property.startsWith('--')).toBe(true)
                expect(typeof value).toBe('string')
                // Verify it's a valid color format (hex, hsl, rgb)
                expect(colorPaletteManager!.validateColorFormat(value)).toBe(true)
              })
            }

            // Clean up
            if (createdPaletteId) {
              await supabase!.from('color_palettes').delete().eq('id', createdPaletteId)
              testColorPaletteIds = testColorPaletteIds.filter(id => id !== createdPaletteId)
            }
            if (createdEmpresaId) {
              await supabase!.from('empresas').delete().eq('id', createdEmpresaId)
              testEmpresaIds = testEmpresaIds.filter(id => id !== createdEmpresaId)
            }
          } catch (error) {
            // Clean up on error
            if (createdPaletteId) {
              await supabase!.from('color_palettes').delete().eq('id', createdPaletteId).catch(() => {})
            }
            if (createdEmpresaId) {
              await supabase!.from('empresas').delete().eq('id', createdEmpresaId).catch(() => {})
            }
            throw error
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should validate color palette creation and retrieval consistency', async () => {
    if (!supabase || !colorPaletteManager) {
      console.warn('Skipping test due to missing dependencies')
      return
    }

    await fc.assert(
      fc.asyncProperty(
        fc.array(empresaGenerator, { minLength: 1, maxLength: 3 }),
        fc.array(colorPaletteGenerator, { minLength: 1, maxLength: 5 }),
        async (empresas, colorPalettes) => {
          const createdEmpresaIds: string[] = []
          const createdPaletteIds: string[] = []

          try {
            // Create test empresas
            for (const empresaData of empresas) {
              const { data: empresa, error } = await supabase!
                .from('empresas')
                .insert({
                  nome: empresaData.nome,
                  slug: empresaData.slug,
                  ativo: empresaData.ativo,
                })
                .select('id')
                .single()

              if (error) throw error
              createdEmpresaIds.push(empresa.id)
              testEmpresaIds.push(empresa.id)
            }

            // Create and validate color palettes for each empresa
            for (let i = 0; i < createdEmpresaIds.length; i++) {
              const empresaId = createdEmpresaIds[i]
              const paletteIndex = i % colorPalettes.length
              const paletteData = colorPalettes[paletteIndex]

              // Create color palette
              const paletteId = await colorPaletteManager!.createPalette(empresaId, paletteData)
              createdPaletteIds.push(paletteId)
              testColorPaletteIds.push(paletteId)

              // Get the created palette
              const palette = await colorPaletteManager!.getPalette(paletteId)
              expect(palette).toBeDefined()

              if (palette) {
                // Verify palette data matches input
                expect(palette.name).toBe(paletteData.name)
                expect(palette.empresaId).toBe(empresaId)
                expect(palette.primaryColor).toBe(paletteData.primaryColor)
                expect(palette.primaryForeground).toBe(paletteData.primaryForeground)
                expect(palette.backgroundColor).toBe(paletteData.backgroundColor)
                expect(palette.foregroundColor).toBe(paletteData.foregroundColor)
                expect(palette.sidebarBackground).toBe(paletteData.sidebarBackground)
                expect(palette.isCustom).toBe(true)

                // Verify CSS properties generation works correctly
                const cssProperties = colorPaletteManager!.generateCSSProperties(palette)
                expect(cssProperties['--primary']).toBe(palette.primaryColor)
                expect(cssProperties['--background']).toBe(palette.backgroundColor)
                expect(cssProperties['--sidebar-background']).toBe(palette.sidebarBackground)

                // Verify all colors are valid formats
                const colorFields = [
                  palette.primaryColor, palette.primaryForeground,
                  palette.secondaryColor, palette.secondaryForeground,
                  palette.accentColor, palette.accentForeground,
                  palette.backgroundColor, palette.foregroundColor,
                  palette.sidebarBackground, palette.sidebarForeground
                ]

                colorFields.forEach(color => {
                  expect(colorPaletteManager!.validateColorFormat(color)).toBe(true)
                })
              }
            }

            // Clean up created data
            if (createdPaletteIds.length > 0) {
              await supabase!.from('color_palettes').delete().in('id', createdPaletteIds)
              testColorPaletteIds = testColorPaletteIds.filter(id => !createdPaletteIds.includes(id))
            }
            if (createdEmpresaIds.length > 0) {
              await supabase!.from('empresas').delete().in('id', createdEmpresaIds)
              testEmpresaIds = testEmpresaIds.filter(id => !createdEmpresaIds.includes(id))
            }
          } catch (error) {
            // Clean up on error
            if (createdPaletteIds.length > 0) {
              await supabase!.from('color_palettes').delete().in('id', createdPaletteIds).catch(() => {})
            }
            if (createdEmpresaIds.length > 0) {
              await supabase!.from('empresas').delete().in('id', createdEmpresaIds).catch(() => {})
            }
            throw error
          }
        }
      ),
      { numRuns: 100 }
    )
  })
})