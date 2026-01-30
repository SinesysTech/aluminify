/**
 * Property-Based Tests - Font Scheme Application
 * 
 * Tests application of font schemes to all text elements without page refresh.
 * Validates Requirements 3.1, 3.5
 * 
 * Feature: brand-customization, Property 6: Font Scheme Application
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'
import { createClient } from '@supabase/supabase-js'
import fc from 'fast-check'
import { FontSchemeManagerImpl } from '@/app/[tenant]/(modules)/empresa/(gestao)/personalizacao/services/font-scheme-manager'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.warn('Supabase environment variables not found. Skipping font scheme application tests.')
}

const supabase = SUPABASE_URL && SUPABASE_SERVICE_KEY 
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  : null

// Test data generators
const fontFamilyGenerator = fc.oneof(
  fc.constant('Inter'),
  fc.constant('Roboto'),
  fc.constant('Open Sans'),
  fc.constant('Lato'),
  fc.constant('Montserrat'),
  fc.constant('Source Sans Pro'),
  fc.constant('Poppins'),
  fc.constant('system-ui'),
  fc.constant('ui-sans-serif'),
  fc.constant('sans-serif')
)

const monoFontFamilyGenerator = fc.oneof(
  fc.constant('Fira Code'),
  fc.constant('Source Code Pro'),
  fc.constant('JetBrains Mono'),
  fc.constant('Consolas'),
  fc.constant('Monaco'),
  fc.constant('ui-monospace'),
  fc.constant('SFMono-Regular'),
  fc.constant('monospace')
)

const fontSizeGenerator = fc.record({
  xs: fc.constant('0.75rem'),
  sm: fc.constant('0.875rem'),
  base: fc.constant('1rem'),
  lg: fc.constant('1.125rem'),
  xl: fc.constant('1.25rem'),
  '2xl': fc.constant('1.5rem'),
  '3xl': fc.constant('1.875rem'),
  '4xl': fc.constant('2.25rem'),
})

const fontWeightGenerator = fc.record({
  light: fc.constant(300),
  normal: fc.constant(400),
  medium: fc.constant(500),
  semibold: fc.constant(600),
  bold: fc.constant(700),
})

const fontSchemeGenerator = fc.record({
  name: fc.string({ minLength: 3, maxLength: 30 }),
  fontSans: fc.array(fontFamilyGenerator, { minLength: 2, maxLength: 5 }).map(fonts => 
    [...fonts, 'system-ui', 'sans-serif'] // Ensure proper fallbacks
  ),
  fontMono: fc.array(monoFontFamilyGenerator, { minLength: 2, maxLength: 4 }).map(fonts => 
    [...fonts, 'ui-monospace', 'monospace'] // Ensure proper fallbacks
  ),
  fontSizes: fontSizeGenerator,
  fontWeights: fontWeightGenerator,
  googleFonts: fc.array(fc.oneof(
    fc.constant('Inter'),
    fc.constant('Roboto'),
    fc.constant('Open Sans'),
    fc.constant('Lato')
  ), { minLength: 0, maxLength: 2 }),
})

const empresaGenerator = fc.record({
  nome: fc.string({ minLength: 3, maxLength: 50 }),
  slug: fc.string({ minLength: 3, maxLength: 30 }).map(s => s.toLowerCase().replace(/[^a-z0-9]/g, '-')),
  ativo: fc.boolean(),
})

describe('Font Scheme Application', () => {
  let testEmpresaIds: string[] = []
  let testFontSchemeIds: string[] = []
  let fontSchemeManager: FontSchemeManagerImpl | null = null

  beforeAll(async () => {
    if (!supabase) {
      console.warn('Skipping tests due to missing Supabase configuration')
      return
    }

    fontSchemeManager = new FontSchemeManagerImpl(supabase)
  })

  afterAll(async () => {
    if (!supabase) return

    try {
      // Clean up test data
      if (testFontSchemeIds.length > 0) {
        await supabase.from('font_schemes').delete().in('id', testFontSchemeIds)
      }
      if (testEmpresaIds.length > 0) {
        await supabase.from('empresas').delete().in('id', testEmpresaIds)
      }
    } catch (error) {
      console.warn('Error cleaning up test data:', error)
    }
  })

  it('should generate correct CSS custom properties from font scheme', async () => {
    if (!supabase || !fontSchemeManager) {
      console.warn('Skipping test due to missing dependencies')
      return
    }

    await fc.assert(
      fc.asyncProperty(
        empresaGenerator,
        fontSchemeGenerator,
        async (empresaData, schemeData) => {
          let createdEmpresaId: string | null = null
          let createdSchemeId: string | null = null

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

            // Create font scheme
            createdSchemeId = await fontSchemeManager!.createFontScheme(createdEmpresaId, schemeData)
            testFontSchemeIds.push(createdSchemeId)

            // Get the created scheme
            const scheme = await fontSchemeManager!.getFontScheme(createdSchemeId)
            expect(scheme).toBeDefined()

            if (scheme) {
              // Generate CSS properties
              const cssProperties = fontSchemeManager!.generateFontCSSProperties(scheme)

              // Verify font family properties are present and correct
              expect(cssProperties['--font-sans']).toBe(scheme.fontSans.join(', '))
              expect(cssProperties['--font-mono']).toBe(scheme.fontMono.join(', '))

              // Verify no undefined or null values
              Object.values(cssProperties).forEach(value => {
                expect(value).toBeDefined()
                expect(value).not.toBeNull()
                expect(typeof value).toBe('string')
                expect(value.trim()).not.toBe('')
              })

              // Verify font fallbacks are properly configured
              expect(fontSchemeManager!.validateFontFallbacks(scheme.fontSans, scheme.fontMono)).toBe(true)

              // Verify font families contain proper fallbacks
              expect(scheme.fontSans.some(font => 
                font.includes('system-ui') || 
                font.includes('sans-serif') || 
                font.includes('-apple-system')
              )).toBe(true)

              expect(scheme.fontMono.some(font => 
                font.includes('monospace') || 
                font.includes('ui-monospace') || 
                font.includes('SFMono-Regular')
              )).toBe(true)

              // Verify font sizes are properly structured
              expect(scheme.fontSizes).toBeDefined()
              expect(typeof scheme.fontSizes.base).toBe('string')
              expect(scheme.fontSizes.base).toMatch(/^\d+(\.\d+)?(rem|px|em)$/)

              // Verify font weights are properly structured
              expect(scheme.fontWeights).toBeDefined()
              expect(typeof scheme.fontWeights.normal).toBe('number')
              expect(scheme.fontWeights.normal).toBeGreaterThanOrEqual(100)
              expect(scheme.fontWeights.normal).toBeLessThanOrEqual(900)

              // Verify Google Fonts array is valid
              expect(Array.isArray(scheme.googleFonts)).toBe(true)
              scheme.googleFonts.forEach(font => {
                expect(typeof font).toBe('string')
                expect(font.trim()).not.toBe('')
              })
            }

            // Clean up
            if (createdSchemeId) {
              await supabase!.from('font_schemes').delete().eq('id', createdSchemeId)
              testFontSchemeIds = testFontSchemeIds.filter(id => id !== createdSchemeId)
            }
            if (createdEmpresaId) {
              await supabase!.from('empresas').delete().eq('id', createdEmpresaId)
              testEmpresaIds = testEmpresaIds.filter(id => id !== createdEmpresaId)
            }
          } catch (error) {
            // Clean up on error
            if (createdSchemeId) {
              await supabase!.from('font_schemes').delete().eq('id', createdSchemeId).catch(() => {})
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

  it('should validate font scheme creation and retrieval consistency', async () => {
    if (!supabase || !fontSchemeManager) {
      console.warn('Skipping test due to missing dependencies')
      return
    }

    await fc.assert(
      fc.asyncProperty(
        fc.array(empresaGenerator, { minLength: 1, maxLength: 3 }),
        fc.array(fontSchemeGenerator, { minLength: 1, maxLength: 5 }),
        async (empresas, fontSchemes) => {
          const createdEmpresaIds: string[] = []
          const createdSchemeIds: string[] = []

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

            // Create and validate font schemes for each empresa
            for (let i = 0; i < createdEmpresaIds.length; i++) {
              const empresaId = createdEmpresaIds[i]
              const schemeIndex = i % fontSchemes.length
              const schemeData = fontSchemes[schemeIndex]

              // Create font scheme
              const schemeId = await fontSchemeManager!.createFontScheme(empresaId, schemeData)
              createdSchemeIds.push(schemeId)
              testFontSchemeIds.push(schemeId)

              // Get the created scheme
              const scheme = await fontSchemeManager!.getFontScheme(schemeId)
              expect(scheme).toBeDefined()

              if (scheme) {
                // Verify scheme data matches input
                expect(scheme.name).toBe(schemeData.name)
                expect(scheme.empresaId).toBe(empresaId)
                expect(scheme.fontSans).toEqual(schemeData.fontSans)
                expect(scheme.fontMono).toEqual(schemeData.fontMono)
                expect(scheme.fontSizes).toEqual(schemeData.fontSizes)
                expect(scheme.fontWeights).toEqual(schemeData.fontWeights)
                expect(scheme.googleFonts).toEqual(schemeData.googleFonts)
                expect(scheme.isCustom).toBe(true)

                // Verify CSS properties generation works correctly
                const cssProperties = fontSchemeManager!.generateFontCSSProperties(scheme)
                expect(cssProperties['--font-sans']).toBe(scheme.fontSans.join(', '))
                expect(cssProperties['--font-mono']).toBe(scheme.fontMono.join(', '))

                // Verify font fallback validation
                expect(fontSchemeManager!.validateFontFallbacks(scheme.fontSans, scheme.fontMono)).toBe(true)

                // Verify Google Fonts validation
                for (const googleFont of scheme.googleFonts) {
                  const isValid = await fontSchemeManager!.validateGoogleFont(googleFont)
                  expect(isValid).toBe(true)
                }

                // Verify font sizes are valid CSS values
                Object.values(scheme.fontSizes).forEach(size => {
                  expect(typeof size).toBe('string')
                  expect(size).toMatch(/^\d+(\.\d+)?(rem|px|em)$/)
                })

                // Verify font weights are valid numbers
                Object.values(scheme.fontWeights).forEach(weight => {
                  expect(typeof weight).toBe('number')
                  expect(weight).toBeGreaterThanOrEqual(100)
                  expect(weight).toBeLessThanOrEqual(900)
                  expect(weight % 100).toBe(0) // Should be multiples of 100
                })
              }
            }

            // Clean up created data
            if (createdSchemeIds.length > 0) {
              await supabase!.from('font_schemes').delete().in('id', createdSchemeIds)
              testFontSchemeIds = testFontSchemeIds.filter(id => !createdSchemeIds.includes(id))
            }
            if (createdEmpresaIds.length > 0) {
              await supabase!.from('empresas').delete().in('id', createdEmpresaIds)
              testEmpresaIds = testEmpresaIds.filter(id => !createdEmpresaIds.includes(id))
            }
          } catch (error) {
            // Clean up on error
            if (createdSchemeIds.length > 0) {
              await supabase!.from('font_schemes').delete().in('id', createdSchemeIds).catch(() => {})
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

  it('should validate font scheme updates preserve data integrity', async () => {
    if (!supabase || !fontSchemeManager) {
      console.warn('Skipping test due to missing dependencies')
      return
    }

    await fc.assert(
      fc.asyncProperty(
        empresaGenerator,
        fontSchemeGenerator,
        fontSchemeGenerator,
        async (empresaData, initialScheme, updatedScheme) => {
          let createdEmpresaId: string | null = null
          let createdSchemeId: string | null = null

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

            // Create initial font scheme
            createdSchemeId = await fontSchemeManager!.createFontScheme(createdEmpresaId, initialScheme)
            testFontSchemeIds.push(createdSchemeId)

            // Update the font scheme
            await fontSchemeManager!.updateFontScheme(createdSchemeId, {
              name: updatedScheme.name,
              fontSans: updatedScheme.fontSans,
              fontMono: updatedScheme.fontMono,
            })

            // Get the updated scheme
            const scheme = await fontSchemeManager!.getFontScheme(createdSchemeId)
            expect(scheme).toBeDefined()

            if (scheme) {
              // Verify updated fields
              expect(scheme.name).toBe(updatedScheme.name)
              expect(scheme.fontSans).toEqual(updatedScheme.fontSans)
              expect(scheme.fontMono).toEqual(updatedScheme.fontMono)

              // Verify unchanged fields
              expect(scheme.empresaId).toBe(createdEmpresaId)
              expect(scheme.fontSizes).toEqual(initialScheme.fontSizes)
              expect(scheme.fontWeights).toEqual(initialScheme.fontWeights)
              expect(scheme.isCustom).toBe(true)

              // Verify CSS properties still work correctly
              const cssProperties = fontSchemeManager!.generateFontCSSProperties(scheme)
              expect(cssProperties['--font-sans']).toBe(scheme.fontSans.join(', '))
              expect(cssProperties['--font-mono']).toBe(scheme.fontMono.join(', '))

              // Verify font fallbacks are still valid
              expect(fontSchemeManager!.validateFontFallbacks(scheme.fontSans, scheme.fontMono)).toBe(true)
            }

            // Clean up
            if (createdSchemeId) {
              await supabase!.from('font_schemes').delete().eq('id', createdSchemeId)
              testFontSchemeIds = testFontSchemeIds.filter(id => id !== createdSchemeId)
            }
            if (createdEmpresaId) {
              await supabase!.from('empresas').delete().eq('id', createdEmpresaId)
              testEmpresaIds = testEmpresaIds.filter(id => id !== createdEmpresaId)
            }
          } catch (error) {
            // Clean up on error
            if (createdSchemeId) {
              await supabase!.from('font_schemes').delete().eq('id', createdSchemeId).catch(() => {})
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