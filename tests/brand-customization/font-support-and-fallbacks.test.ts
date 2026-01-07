/**
 * Property-Based Tests - Font Support and Fallbacks
 * 
 * Tests web-safe fonts and Google Fonts integration with proper fallback configuration.
 * Validates Requirements 3.2, 3.3
 * 
 * Feature: brand-customization, Property 7: Font Support and Fallbacks
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'
import { createClient } from '@supabase/supabase-js'
import fc from 'fast-check'
import { FontSchemeManagerImpl } from '@/backend/services/brand-customization/font-scheme-manager'
import type { FontScheme, CreateFontSchemeRequest } from '@/types/brand-customization'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.warn('Supabase environment variables not found. Skipping font support and fallbacks tests.')
}

const supabase = SUPABASE_URL && SUPABASE_SERVICE_KEY 
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  : null

// Test data generators for web-safe fonts
const webSafeFontGenerator = fc.oneof(
  fc.constant('Arial'),
  fc.constant('Helvetica'),
  fc.constant('Times New Roman'),
  fc.constant('Georgia'),
  fc.constant('Verdana'),
  fc.constant('Courier New'),
  fc.constant('Trebuchet MS'),
  fc.constant('Impact'),
  fc.constant('Comic Sans MS'),
  fc.constant('Palatino')
)

const systemFontGenerator = fc.oneof(
  fc.constant('system-ui'),
  fc.constant('ui-sans-serif'),
  fc.constant('-apple-system'),
  fc.constant('BlinkMacSystemFont'),
  fc.constant('Segoe UI'),
  fc.constant('Roboto'),
  fc.constant('Oxygen'),
  fc.constant('Ubuntu'),
  fc.constant('Cantarell'),
  fc.constant('sans-serif')
)

const monoSystemFontGenerator = fc.oneof(
  fc.constant('ui-monospace'),
  fc.constant('SFMono-Regular'),
  fc.constant('Menlo'),
  fc.constant('Monaco'),
  fc.constant('Consolas'),
  fc.constant('Liberation Mono'),
  fc.constant('Courier New'),
  fc.constant('monospace')
)

const googleFontGenerator = fc.oneof(
  fc.constant('Inter'),
  fc.constant('Roboto'),
  fc.constant('Open Sans'),
  fc.constant('Lato'),
  fc.constant('Montserrat'),
  fc.constant('Source Sans Pro'),
  fc.constant('Poppins'),
  fc.constant('Nunito'),
  fc.constant('Raleway'),
  fc.constant('Ubuntu')
)

const googleMonoFontGenerator = fc.oneof(
  fc.constant('Fira Code'),
  fc.constant('Source Code Pro'),
  fc.constant('JetBrains Mono'),
  fc.constant('Roboto Mono'),
  fc.constant('IBM Plex Mono'),
  fc.constant('Inconsolata')
)

// Generator for font stacks with proper fallbacks
const fontStackGenerator = fc.record({
  fontSans: fc.array(
    fc.oneof(googleFontGenerator, webSafeFontGenerator, systemFontGenerator),
    { minLength: 1, maxLength: 4 }
  ).map(fonts => [...fonts, 'system-ui', 'sans-serif']), // Always ensure fallbacks
  fontMono: fc.array(
    fc.oneof(googleMonoFontGenerator, monoSystemFontGenerator),
    { minLength: 1, maxLength: 3 }
  ).map(fonts => [...fonts, 'ui-monospace', 'monospace']), // Always ensure fallbacks
})

// Generator for invalid font stacks (missing fallbacks)
const invalidFontStackGenerator = fc.record({
  fontSans: fc.oneof(
    fc.array(googleFontGenerator, { minLength: 1, maxLength: 3 }), // No fallbacks
    fc.constant([]), // Empty array
    fc.array(fc.constant(''), { minLength: 1, maxLength: 2 }) // Empty strings
  ),
  fontMono: fc.oneof(
    fc.array(googleMonoFontGenerator, { minLength: 1, maxLength: 3 }), // No fallbacks
    fc.constant([]), // Empty array
    fc.array(fc.constant(''), { minLength: 1, maxLength: 2 }) // Empty strings
  ),
})

const fontSchemeWithFallbacksGenerator = fc.record({
  name: fc.string({ minLength: 3, maxLength: 30 }),
  fontSans: fc.array(
    fc.oneof(googleFontGenerator, webSafeFontGenerator, systemFontGenerator),
    { minLength: 1, maxLength: 4 }
  ).map(fonts => [...fonts, 'system-ui', 'sans-serif']),
  fontMono: fc.array(
    fc.oneof(googleMonoFontGenerator, monoSystemFontGenerator),
    { minLength: 1, maxLength: 3 }
  ).map(fonts => [...fonts, 'ui-monospace', 'monospace']),
  googleFonts: fc.array(googleFontGenerator, { minLength: 0, maxLength: 3 }),
})

const empresaGenerator = fc.record({
  nome: fc.string({ minLength: 3, maxLength: 50 }),
  slug: fc.string({ minLength: 3, maxLength: 30 }).map(s => s.toLowerCase().replace(/[^a-z0-9]/g, '-')),
  ativo: fc.boolean(),
})

describe('Font Support and Fallbacks', () => {
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

  it('should validate proper font fallback configuration', async () => {
    if (!supabase || !fontSchemeManager) {
      console.warn('Skipping test due to missing dependencies')
      return
    }

    await fc.assert(
      fc.asyncProperty(
        fontStackGenerator,
        async (fontStack) => {
          // Test that properly configured font stacks pass validation
          const isValid = fontSchemeManager!.validateFontFallbacks(fontStack.fontSans, fontStack.fontMono)
          expect(isValid).toBe(true)

          // Verify sans-serif fonts have proper fallbacks
          const sansHasSystemFallback = fontStack.fontSans.some(font => 
            font.includes('system-ui') || 
            font.includes('sans-serif') || 
            font.includes('-apple-system')
          )
          expect(sansHasSystemFallback).toBe(true)

          // Verify monospace fonts have proper fallbacks
          const monoHasSystemFallback = fontStack.fontMono.some(font => 
            font.includes('monospace') || 
            font.includes('ui-monospace') || 
            font.includes('SFMono-Regular')
          )
          expect(monoHasSystemFallback).toBe(true)

          // Verify all fonts are valid strings
          fontStack.fontSans.forEach(font => {
            expect(typeof font).toBe('string')
            expect(font.trim()).not.toBe('')
          })

          fontStack.fontMono.forEach(font => {
            expect(typeof font).toBe('string')
            expect(font.trim()).not.toBe('')
          })
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should reject invalid font fallback configurations', async () => {
    if (!supabase || !fontSchemeManager) {
      console.warn('Skipping test due to missing dependencies')
      return
    }

    await fc.assert(
      fc.asyncProperty(
        invalidFontStackGenerator,
        async (invalidFontStack) => {
          // Test that improperly configured font stacks fail validation
          const isValid = fontSchemeManager!.validateFontFallbacks(invalidFontStack.fontSans, invalidFontStack.fontMono)
          expect(isValid).toBe(false)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should validate Google Fonts and create schemes with proper fallbacks', async () => {
    if (!supabase || !fontSchemeManager) {
      console.warn('Skipping test due to missing dependencies')
      return
    }

    await fc.assert(
      fc.asyncProperty(
        empresaGenerator,
        fontSchemeWithFallbacksGenerator,
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

            // Validate Google Fonts
            for (const googleFont of schemeData.googleFonts) {
              const isValid = await fontSchemeManager!.validateGoogleFont(googleFont)
              expect(isValid).toBe(true)
            }

            // Create font scheme
            createdSchemeId = await fontSchemeManager!.createFontScheme(createdEmpresaId, schemeData)
            testFontSchemeIds.push(createdSchemeId)

            // Get the created scheme
            const scheme = await fontSchemeManager!.getFontScheme(createdSchemeId)
            expect(scheme).toBeDefined()

            if (scheme) {
              // Verify fallback validation passes
              expect(fontSchemeManager!.validateFontFallbacks(scheme.fontSans, scheme.fontMono)).toBe(true)

              // Verify Google Fonts are properly stored
              expect(scheme.googleFonts).toEqual(schemeData.googleFonts)

              // Verify font stacks contain proper fallbacks
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

              // Verify CSS properties include all fonts in correct order
              const cssProperties = fontSchemeManager!.generateFontCSSProperties(scheme)
              expect(cssProperties['--font-sans']).toBe(scheme.fontSans.join(', '))
              expect(cssProperties['--font-mono']).toBe(scheme.fontMono.join(', '))

              // Verify font stacks end with generic fallbacks
              expect(scheme.fontSans[scheme.fontSans.length - 1]).toBe('sans-serif')
              expect(scheme.fontMono[scheme.fontMono.length - 1]).toBe('monospace')
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

  it('should handle web-safe fonts without Google Fonts dependency', async () => {
    if (!supabase || !fontSchemeManager) {
      console.warn('Skipping test due to missing dependencies')
      return
    }

    await fc.assert(
      fc.asyncProperty(
        empresaGenerator,
        fc.record({
          name: fc.string({ minLength: 3, maxLength: 30 }),
          fontSans: fc.array(webSafeFontGenerator, { minLength: 1, maxLength: 3 }).map(fonts => 
            [...fonts, 'system-ui', 'sans-serif']
          ),
          fontMono: fc.array(fc.oneof(
            fc.constant('Courier New'),
            fc.constant('Monaco'),
            fc.constant('Consolas')
          ), { minLength: 1, maxLength: 2 }).map(fonts => 
            [...fonts, 'ui-monospace', 'monospace']
          ),
          googleFonts: fc.constant([]), // No Google Fonts
        }),
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

            // Create font scheme with only web-safe fonts
            createdSchemeId = await fontSchemeManager!.createFontScheme(createdEmpresaId, schemeData)
            testFontSchemeIds.push(createdSchemeId)

            // Get the created scheme
            const scheme = await fontSchemeManager!.getFontScheme(createdSchemeId)
            expect(scheme).toBeDefined()

            if (scheme) {
              // Verify no Google Fonts are required
              expect(scheme.googleFonts).toEqual([])

              // Verify fallback validation still passes
              expect(fontSchemeManager!.validateFontFallbacks(scheme.fontSans, scheme.fontMono)).toBe(true)

              // Verify CSS properties work without Google Fonts
              const cssProperties = fontSchemeManager!.generateFontCSSProperties(scheme)
              expect(cssProperties['--font-sans']).toBe(scheme.fontSans.join(', '))
              expect(cssProperties['--font-mono']).toBe(scheme.fontMono.join(', '))

              // Verify all fonts are web-safe or system fonts
              scheme.fontSans.forEach(font => {
                const isWebSafeOrSystem = [
                  'Arial', 'Helvetica', 'Times New Roman', 'Georgia', 'Verdana',
                  'Courier New', 'Trebuchet MS', 'Impact', 'Comic Sans MS', 'Palatino',
                  'system-ui', 'ui-sans-serif', '-apple-system', 'BlinkMacSystemFont',
                  'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'sans-serif'
                ].includes(font)
                expect(isWebSafeOrSystem).toBe(true)
              })

              scheme.fontMono.forEach(font => {
                const isWebSafeOrSystemMono = [
                  'Courier New', 'Monaco', 'Consolas', 'ui-monospace', 'SFMono-Regular',
                  'Menlo', 'Liberation Mono', 'monospace'
                ].includes(font)
                expect(isWebSafeOrSystemMono).toBe(true)
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

  it('should validate Google Font names and reject invalid ones', async () => {
    if (!fontSchemeManager) {
      console.warn('Skipping test due to missing dependencies')
      return
    }

    await fc.assert(
      fc.asyncProperty(
        fc.oneof(
          // Valid Google Font names
          googleFontGenerator,
          googleMonoFontGenerator,
          // Invalid font names
          fc.constant(''),
          fc.constant('   '),
          fc.constant('Invalid<Font>Name'),
          fc.constant('Font/With/Slashes'),
          fc.constant('Font"With"Quotes'),
          fc.constant('Font|With|Pipes'),
          fc.string({ minLength: 1, maxLength: 5 }).filter(s => /[<>:"\/\\|?*]/.test(s))
        ),
        async (fontName) => {
          const isValid = await fontSchemeManager!.validateGoogleFont(fontName)
          
          // Valid Google Fonts should pass validation
          const validGoogleFonts = [
            'Inter', 'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Source Sans Pro',
            'Poppins', 'Nunito', 'Raleway', 'Ubuntu', 'Fira Code', 'Source Code Pro',
            'JetBrains Mono', 'Roboto Mono', 'IBM Plex Mono', 'Inconsolata'
          ]
          
          if (validGoogleFonts.includes(fontName)) {
            expect(isValid).toBe(true)
          } else if (!fontName || fontName.trim() === '' || /[<>:"\/\\|?*]/.test(fontName)) {
            // Invalid font names should fail validation
            expect(isValid).toBe(false)
          }
          // For other font names, we don't make assumptions about validity
          // as the validation might be more permissive in practice
        }
      ),
      { numRuns: 100 }
    )
  })
})