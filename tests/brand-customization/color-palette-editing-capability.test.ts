/**
 * Property-Based Tests - Color Palette Editing Capability
 * 
 * Tests the ability to edit all color types in custom color palettes.
 * Validates Requirements 2.2
 * 
 * Feature: brand-customization, Property 4: Color Palette Editing Capability
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'
import { createClient } from '@supabase/supabase-js'
import fc from 'fast-check'
import { ColorPaletteManagerImpl } from '@/app/[tenant]/(modules)/settings/personalizacao/services/color-palette-manager'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.warn('Supabase environment variables not found. Skipping color palette editing capability tests.')
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

// Generator for partial palette updates (editing specific colors)
const partialPaletteUpdateGenerator = fc.record({
  name: fc.option(fc.string({ minLength: 3, maxLength: 30 }), { nil: undefined }),
  primaryColor: fc.option(colorGenerator, { nil: undefined }),
  primaryForeground: fc.option(colorGenerator, { nil: undefined }),
  secondaryColor: fc.option(colorGenerator, { nil: undefined }),
  secondaryForeground: fc.option(colorGenerator, { nil: undefined }),
  accentColor: fc.option(colorGenerator, { nil: undefined }),
  accentForeground: fc.option(colorGenerator, { nil: undefined }),
  mutedColor: fc.option(colorGenerator, { nil: undefined }),
  mutedForeground: fc.option(colorGenerator, { nil: undefined }),
  backgroundColor: fc.option(colorGenerator, { nil: undefined }),
  foregroundColor: fc.option(colorGenerator, { nil: undefined }),
  cardColor: fc.option(colorGenerator, { nil: undefined }),
  cardForeground: fc.option(colorGenerator, { nil: undefined }),
  destructiveColor: fc.option(colorGenerator, { nil: undefined }),
  destructiveForeground: fc.option(colorGenerator, { nil: undefined }),
  sidebarBackground: fc.option(colorGenerator, { nil: undefined }),
  sidebarForeground: fc.option(colorGenerator, { nil: undefined }),
  sidebarPrimary: fc.option(colorGenerator, { nil: undefined }),
  sidebarPrimaryForeground: fc.option(colorGenerator, { nil: undefined }),
}, { requiredKeys: [] })

describe('Color Palette Editing Capability', () => {
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

  it('should allow editing all color types in custom color palettes', async () => {
    if (!supabase || !colorPaletteManager) {
      console.warn('Skipping test due to missing dependencies')
      return
    }

    await fc.assert(
      fc.asyncProperty(
        empresaGenerator,
        colorPaletteGenerator,
        partialPaletteUpdateGenerator,
        async (empresaData, initialPaletteData, updateData) => {
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

            // Create initial color palette
            createdPaletteId = await colorPaletteManager!.createPalette(createdEmpresaId, initialPaletteData)
            testColorPaletteIds.push(createdPaletteId)

            // Get the initial palette
            const initialPalette = await colorPaletteManager!.getPalette(createdPaletteId)
            expect(initialPalette).toBeDefined()

            if (initialPalette) {
              // Update the palette with partial data
              await colorPaletteManager!.updatePalette(createdPaletteId, updateData)

              // Get the updated palette
              const updatedPalette = await colorPaletteManager!.getPalette(createdPaletteId)
              expect(updatedPalette).toBeDefined()

              if (updatedPalette) {
                // Verify that updated fields have new values
                Object.entries(updateData).forEach(([key, value]) => {
                  if (value !== undefined) {
                    const paletteKey = key as keyof typeof updatedPalette
                    expect(updatedPalette[paletteKey]).toBe(value)
                  }
                })

                // Verify that non-updated fields remain unchanged
                const fieldsToCheck = [
                  'primaryColor', 'primaryForeground', 'secondaryColor', 'secondaryForeground',
                  'accentColor', 'accentForeground', 'mutedColor', 'mutedForeground',
                  'backgroundColor', 'foregroundColor', 'cardColor', 'cardForeground',
                  'destructiveColor', 'destructiveForeground', 'sidebarBackground',
                  'sidebarForeground', 'sidebarPrimary', 'sidebarPrimaryForeground'
                ] as const

                fieldsToCheck.forEach(field => {
                  if (updateData[field] === undefined) {
                    // Field should remain unchanged
                    expect(updatedPalette[field]).toBe(initialPalette[field])
                  } else {
                    // Field should be updated
                    expect(updatedPalette[field]).toBe(updateData[field])
                    expect(updatedPalette[field]).not.toBe(initialPalette[field])
                  }
                })

                // Verify that all color values are still valid formats
                fieldsToCheck.forEach(field => {
                  const colorValue = updatedPalette[field]
                  expect(colorPaletteManager!.validateColorFormat(colorValue)).toBe(true)
                })

                // Verify that the palette can still generate valid CSS properties
                const cssProperties = colorPaletteManager!.generateCSSProperties(updatedPalette)
                expect(Object.keys(cssProperties).length).toBe(18) // All CSS custom properties

                // Verify all CSS properties have valid values
                Object.entries(cssProperties).forEach(([property, value]) => {
                  expect(property.startsWith('--')).toBe(true)
                  expect(typeof value).toBe('string')
                  expect(value.trim()).not.toBe('')
                  expect(colorPaletteManager!.validateColorFormat(value)).toBe(true)
                })

                // Verify metadata is updated correctly
                expect(updatedPalette.empresaId).toBe(createdEmpresaId)
                expect(updatedPalette.isCustom).toBe(true)
                expect(updatedPalette.updatedAt.getTime()).toBeGreaterThan(initialPalette.updatedAt.getTime())
              }
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

  it('should support editing individual color categories independently', async () => {
    if (!supabase || !colorPaletteManager) {
      console.warn('Skipping test due to missing dependencies')
      return
    }

    await fc.assert(
      fc.asyncProperty(
        empresaGenerator,
        colorPaletteGenerator,
        fc.array(fc.record({
          field: fc.constantFrom(
            'primaryColor', 'primaryForeground', 'secondaryColor', 'secondaryForeground',
            'accentColor', 'accentForeground', 'mutedColor', 'mutedForeground',
            'backgroundColor', 'foregroundColor', 'cardColor', 'cardForeground',
            'destructiveColor', 'destructiveForeground', 'sidebarBackground',
            'sidebarForeground', 'sidebarPrimary', 'sidebarPrimaryForeground'
          ),
          newValue: colorGenerator
        }), { minLength: 1, maxLength: 5 }),
        async (empresaData, initialPaletteData, fieldUpdates) => {
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

            // Create initial color palette
            createdPaletteId = await colorPaletteManager!.createPalette(createdEmpresaId, initialPaletteData)
            testColorPaletteIds.push(createdPaletteId)

            // Get the initial palette
            const initialPalette = await colorPaletteManager!.getPalette(createdPaletteId)
            expect(initialPalette).toBeDefined()

            if (initialPalette) {
              // Apply each field update sequentially
              let currentPalette = initialPalette
              
              for (const { field, newValue } of fieldUpdates) {
                // Update single field
                const updateData = { [field]: newValue }
                await colorPaletteManager!.updatePalette(createdPaletteId, updateData)

                // Get updated palette
                const updatedPalette = await colorPaletteManager!.getPalette(createdPaletteId)
                expect(updatedPalette).toBeDefined()

                if (updatedPalette) {
                  // Verify the specific field was updated
                  expect(updatedPalette[field as keyof typeof updatedPalette]).toBe(newValue)

                  // Verify other fields remained unchanged from the previous state
                  const allFields = [
                    'primaryColor', 'primaryForeground', 'secondaryColor', 'secondaryForeground',
                    'accentColor', 'accentForeground', 'mutedColor', 'mutedForeground',
                    'backgroundColor', 'foregroundColor', 'cardColor', 'cardForeground',
                    'destructiveColor', 'destructiveForeground', 'sidebarBackground',
                    'sidebarForeground', 'sidebarPrimary', 'sidebarPrimaryForeground'
                  ] as const

                  allFields.forEach(otherField => {
                    if (otherField !== field) {
                      expect(updatedPalette[otherField]).toBe(currentPalette[otherField])
                    }
                  })

                  // Verify the updated color is valid
                  expect(colorPaletteManager!.validateColorFormat(newValue)).toBe(true)

                  // Update current palette reference for next iteration
                  currentPalette = updatedPalette
                }
              }

              // Final verification: ensure all applied updates are present
              const finalPalette = await colorPaletteManager!.getPalette(createdPaletteId)
              expect(finalPalette).toBeDefined()

              if (finalPalette) {
                // Check that all field updates were applied
                fieldUpdates.forEach(({ field, newValue }) => {
                  expect(finalPalette[field as keyof typeof finalPalette]).toBe(newValue)
                })

                // Verify CSS properties generation still works
                const cssProperties = colorPaletteManager!.generateCSSProperties(finalPalette)
                expect(Object.keys(cssProperties).length).toBe(18)

                // Verify all CSS properties correspond to the updated colors
                fieldUpdates.forEach(({ field, newValue }) => {
                  const cssPropertyMap: Record<string, string> = {
                    'primaryColor': '--primary',
                    'primaryForeground': '--primary-foreground',
                    'secondaryColor': '--secondary',
                    'secondaryForeground': '--secondary-foreground',
                    'accentColor': '--accent',
                    'accentForeground': '--accent-foreground',
                    'mutedColor': '--muted',
                    'mutedForeground': '--muted-foreground',
                    'backgroundColor': '--background',
                    'foregroundColor': '--foreground',
                    'cardColor': '--card',
                    'cardForeground': '--card-foreground',
                    'destructiveColor': '--destructive',
                    'destructiveForeground': '--destructive-foreground',
                    'sidebarBackground': '--sidebar-background',
                    'sidebarForeground': '--sidebar-foreground',
                    'sidebarPrimary': '--sidebar-primary',
                    'sidebarPrimaryForeground': '--sidebar-primary-foreground',
                  }

                  const cssProperty = cssPropertyMap[field]
                  if (cssProperty) {
                    expect(cssProperties[cssProperty as keyof typeof cssProperties]).toBe(newValue)
                  }
                })
              }
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

  it('should validate color formats during palette editing', async () => {
    if (!supabase || !colorPaletteManager) {
      console.warn('Skipping test due to missing dependencies')
      return
    }

    await fc.assert(
      fc.asyncProperty(
        empresaGenerator,
        colorPaletteGenerator,
        fc.record({
          validColor: colorGenerator,
          invalidColor: fc.constantFrom(
            'invalid-color',
            '#gggggg',
            'rgb(300, 300, 300)',
            'hsl(400, 150%, 150%)',
            '',
            'not-a-color',
            '#12345',
            'rgb(255, 255)',
            'hsl(180, 50%)'
          )
        }),
        async (empresaData, initialPaletteData, { validColor, invalidColor }) => {
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

            // Create initial color palette
            createdPaletteId = await colorPaletteManager!.createPalette(createdEmpresaId, initialPaletteData)
            testColorPaletteIds.push(createdPaletteId)

            // Test valid color update - should succeed
            await expect(
              colorPaletteManager!.updatePalette(createdPaletteId, { primaryColor: validColor })
            ).resolves.not.toThrow()

            // Verify the valid color was applied
            const updatedPalette = await colorPaletteManager!.getPalette(createdPaletteId)
            expect(updatedPalette?.primaryColor).toBe(validColor)

            // Test invalid color update - should throw error
            await expect(
              colorPaletteManager!.updatePalette(createdPaletteId, { secondaryColor: invalidColor })
            ).rejects.toThrow()

            // Verify the invalid color was not applied (palette should remain unchanged)
            const unchangedPalette = await colorPaletteManager!.getPalette(createdPaletteId)
            expect(unchangedPalette?.secondaryColor).toBe(initialPaletteData.secondaryColor)
            expect(unchangedPalette?.primaryColor).toBe(validColor) // Valid update should still be there

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
})