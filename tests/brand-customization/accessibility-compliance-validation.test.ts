/**
 * Property-Based Tests - Accessibility Compliance Validation
 * 
 * Tests color contrast validation for accessibility compliance.
 * Validates Requirements 2.5
 * 
 * Feature: brand-customization, Property 5: Accessibility Compliance Validation
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'
import { createClient } from '@supabase/supabase-js'
import fc from 'fast-check'
import { ColorPaletteManagerImpl } from '@/app/shared/core/services/brand-customization/color-palette-manager'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.warn('Supabase environment variables not found. Skipping accessibility compliance validation tests.')
}

const supabase = SUPABASE_URL && SUPABASE_SERVICE_KEY 
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  : null

// Test data generators
const colorGenerator = fc.integer({ min: 0, max: 0xFFFFFF }).map(n => `#${n.toString(16).padStart(6, '0')}`)

// Generator for high contrast color combinations (likely to pass WCAG)
const highContrastPaletteGenerator = fc.record({
  name: fc.string({ minLength: 3, maxLength: 30 }),
  primaryColor: fc.constantFrom('#000000', '#1a1a1a', '#2d2d2d', '#0066cc', '#003d7a'),
  primaryForeground: fc.constantFrom('#ffffff', '#f5f5f5', '#e6e6e6'),
  secondaryColor: fc.constantFrom('#333333', '#4a4a4a', '#666666', '#0080ff', '#004d99'),
  secondaryForeground: fc.constantFrom('#ffffff', '#f0f0f0', '#e0e0e0'),
  accentColor: fc.constantFrom('#0066cc', '#0080ff', '#003d7a', '#004d99', '#1a1a1a'),
  accentForeground: fc.constantFrom('#ffffff', '#f5f5f5'),
  mutedColor: fc.constantFrom('#f5f5f5', '#e6e6e6', '#d9d9d9'),
  mutedForeground: fc.constantFrom('#333333', '#4a4a4a', '#666666'),
  backgroundColor: fc.constantFrom('#ffffff', '#f9f9f9', '#f5f5f5'),
  foregroundColor: fc.constantFrom('#000000', '#1a1a1a', '#2d2d2d'),
  cardColor: fc.constantFrom('#ffffff', '#f9f9f9'),
  cardForeground: fc.constantFrom('#000000', '#1a1a1a'),
  destructiveColor: fc.constantFrom('#dc2626', '#b91c1c', '#991b1b'),
  destructiveForeground: fc.constantFrom('#ffffff', '#f5f5f5'),
  sidebarBackground: fc.constantFrom('#f5f5f5', '#e6e6e6', '#ffffff'),
  sidebarForeground: fc.constantFrom('#000000', '#1a1a1a', '#333333'),
  sidebarPrimary: fc.constantFrom('#000000', '#1a1a1a', '#0066cc'),
  sidebarPrimaryForeground: fc.constantFrom('#ffffff', '#f5f5f5'),
})

// Generator for low contrast color combinations (likely to fail WCAG)
const lowContrastPaletteGenerator = fc.record({
  name: fc.string({ minLength: 3, maxLength: 30 }),
  primaryColor: fc.constantFrom('#cccccc', '#d9d9d9', '#e6e6e6', '#f0f0f0'),
  primaryForeground: fc.constantFrom('#ffffff', '#f9f9f9', '#f5f5f5'),
  secondaryColor: fc.constantFrom('#e0e0e0', '#e6e6e6', '#eeeeee'),
  secondaryForeground: fc.constantFrom('#ffffff', '#f9f9f9'),
  accentColor: fc.constantFrom('#d9d9d9', '#e6e6e6', '#f0f0f0'),
  accentForeground: fc.constantFrom('#ffffff', '#f9f9f9'),
  mutedColor: fc.constantFrom('#f5f5f5', '#f9f9f9', '#ffffff'),
  mutedForeground: fc.constantFrom('#cccccc', '#d9d9d9', '#e6e6e6'),
  backgroundColor: fc.constantFrom('#ffffff', '#f9f9f9', '#f5f5f5'),
  foregroundColor: fc.constantFrom('#cccccc', '#d9d9d9', '#e6e6e6'),
  cardColor: fc.constantFrom('#ffffff', '#f9f9f9'),
  cardForeground: fc.constantFrom('#cccccc', '#d9d9d9'),
  destructiveColor: fc.constantFrom('#ffcccc', '#ffe6e6', '#fff0f0'),
  destructiveForeground: fc.constantFrom('#ffffff', '#f9f9f9'),
  sidebarBackground: fc.constantFrom('#f5f5f5', '#f9f9f9', '#ffffff'),
  sidebarForeground: fc.constantFrom('#cccccc', '#d9d9d9', '#e6e6e6'),
  sidebarPrimary: fc.constantFrom('#cccccc', '#d9d9d9', '#e6e6e6'),
  sidebarPrimaryForeground: fc.constantFrom('#ffffff', '#f9f9f9'),
})

describe('Accessibility Compliance Validation', () => {
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

  it('should validate color contrast ratios and ensure accessibility compliance', async () => {
    if (!supabase || !colorPaletteManager) {
      console.warn('Skipping test due to missing dependencies')
      return
    }

    await fc.assert(
      fc.asyncProperty(
        fc.oneof(highContrastPaletteGenerator, lowContrastPaletteGenerator),
        async (paletteData) => {
          try {
            // Validate color contrast for the palette
            const accessibilityReport = await colorPaletteManager!.validateColorContrast(paletteData)

            // Verify the report structure
            expect(accessibilityReport).toBeDefined()
            expect(typeof accessibilityReport.isCompliant).toBe('boolean')
            expect(typeof accessibilityReport.contrastRatios).toBe('object')
            expect(typeof accessibilityReport.contrastRatios.primaryOnBackground).toBe('number')
            expect(typeof accessibilityReport.contrastRatios.secondaryOnBackground).toBe('number')
            expect(typeof accessibilityReport.contrastRatios.accentOnBackground).toBe('number')

            // Verify contrast ratios are positive numbers
            expect(accessibilityReport.contrastRatios.primaryOnBackground).toBeGreaterThan(0)
            expect(accessibilityReport.contrastRatios.secondaryOnBackground).toBeGreaterThan(0)
            expect(accessibilityReport.contrastRatios.accentOnBackground).toBeGreaterThan(0)

            // Verify WCAG AA compliance logic (4.5:1 minimum)
            const minContrastRatio = 4.5
            const expectedCompliance = 
              accessibilityReport.contrastRatios.primaryOnBackground >= minContrastRatio &&
              accessibilityReport.contrastRatios.secondaryOnBackground >= minContrastRatio &&
              accessibilityReport.contrastRatios.accentOnBackground >= minContrastRatio

            expect(accessibilityReport.isCompliant).toBe(expectedCompliance)

            // If not compliant, should have recommendations
            if (!accessibilityReport.isCompliant) {
              expect(accessibilityReport.recommendations).toBeDefined()
              expect(Array.isArray(accessibilityReport.recommendations)).toBe(true)
              expect(accessibilityReport.recommendations!.length).toBeGreaterThan(0)

              // Verify recommendations mention specific contrast ratios
              accessibilityReport.recommendations!.forEach(recommendation => {
                expect(typeof recommendation).toBe('string')
                expect(recommendation.length).toBeGreaterThan(0)
                expect(recommendation.toLowerCase()).toMatch(/contrast|ratio|wcag|aa/i)
              })
            }

            // If compliant but not AAA level (7:1), should have warnings
            if (accessibilityReport.isCompliant) {
              const aaaLevel = 7
              const hasAAA = 
                accessibilityReport.contrastRatios.primaryOnBackground >= aaaLevel &&
                accessibilityReport.contrastRatios.secondaryOnBackground >= aaaLevel &&
                accessibilityReport.contrastRatios.accentOnBackground >= aaaLevel

              if (!hasAAA && accessibilityReport.warnings) {
                expect(Array.isArray(accessibilityReport.warnings)).toBe(true)
                accessibilityReport.warnings.forEach(warning => {
                  expect(typeof warning).toBe('string')
                  expect(warning.toLowerCase()).toMatch(/aa|aaa|accessibility/i)
                })
              }
            }

            // Verify contrast ratios are mathematically sound (should be >= 1)
            expect(accessibilityReport.contrastRatios.primaryOnBackground).toBeGreaterThanOrEqual(1)
            expect(accessibilityReport.contrastRatios.secondaryOnBackground).toBeGreaterThanOrEqual(1)
            expect(accessibilityReport.contrastRatios.accentOnBackground).toBeGreaterThanOrEqual(1)

            // Verify contrast ratios are reasonable (should not exceed 21:1, the theoretical maximum)
            expect(accessibilityReport.contrastRatios.primaryOnBackground).toBeLessThanOrEqual(21)
            expect(accessibilityReport.contrastRatios.secondaryOnBackground).toBeLessThanOrEqual(21)
            expect(accessibilityReport.contrastRatios.accentOnBackground).toBeLessThanOrEqual(21)
          } catch (error) {
            throw error
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should provide specific recommendations for non-compliant color combinations', async () => {
    if (!supabase || !colorPaletteManager) {
      console.warn('Skipping test due to missing dependencies')
      return
    }

    await fc.assert(
      fc.asyncProperty(
        lowContrastPaletteGenerator, // Use low contrast generator to ensure non-compliance
        async (paletteData) => {
          try {
            // Validate color contrast for the low-contrast palette
            const accessibilityReport = await colorPaletteManager!.validateColorContrast(paletteData)

            // Low contrast palettes should typically not be compliant
            if (!accessibilityReport.isCompliant) {
              // Should have recommendations
              expect(accessibilityReport.recommendations).toBeDefined()
              expect(Array.isArray(accessibilityReport.recommendations)).toBe(true)
              expect(accessibilityReport.recommendations!.length).toBeGreaterThan(0)

              // Each recommendation should be specific and helpful
              accessibilityReport.recommendations!.forEach(recommendation => {
                expect(typeof recommendation).toBe('string')
                expect(recommendation.length).toBeGreaterThan(10) // Should be descriptive
                
                // Should mention specific color types and contrast ratios
                const lowerRecommendation = recommendation.toLowerCase()
                expect(
                  lowerRecommendation.includes('primary') ||
                  lowerRecommendation.includes('secondary') ||
                  lowerRecommendation.includes('accent')
                ).toBe(true)
                
                expect(
                  lowerRecommendation.includes('contrast') &&
                  lowerRecommendation.includes('ratio')
                ).toBe(true)
                
                expect(lowerRecommendation.includes('4.5:1')).toBe(true)
              })

              // Verify that recommendations correspond to actual failing contrast ratios
              const minContrastRatio = 4.5
              if (accessibilityReport.contrastRatios.primaryOnBackground < minContrastRatio) {
                const primaryRecommendation = accessibilityReport.recommendations!.find(r => 
                  r.toLowerCase().includes('primary')
                )
                expect(primaryRecommendation).toBeDefined()
              }

              if (accessibilityReport.contrastRatios.secondaryOnBackground < minContrastRatio) {
                const secondaryRecommendation = accessibilityReport.recommendations!.find(r => 
                  r.toLowerCase().includes('secondary')
                )
                expect(secondaryRecommendation).toBeDefined()
              }

              if (accessibilityReport.contrastRatios.accentOnBackground < minContrastRatio) {
                const accentRecommendation = accessibilityReport.recommendations!.find(r => 
                  r.toLowerCase().includes('accent')
                )
                expect(accentRecommendation).toBeDefined()
              }
            }
          } catch (error) {
            throw error
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should correctly identify compliant high-contrast color combinations', async () => {
    if (!supabase || !colorPaletteManager) {
      console.warn('Skipping test due to missing dependencies')
      return
    }

    await fc.assert(
      fc.asyncProperty(
        highContrastPaletteGenerator, // Use high contrast generator to ensure compliance
        async (paletteData) => {
          try {
            // Validate color contrast for the high-contrast palette
            const accessibilityReport = await colorPaletteManager!.validateColorContrast(paletteData)

            // High contrast palettes should typically be compliant
            if (accessibilityReport.isCompliant) {
              // All contrast ratios should meet WCAG AA standard
              const minContrastRatio = 4.5
              expect(accessibilityReport.contrastRatios.primaryOnBackground).toBeGreaterThanOrEqual(minContrastRatio)
              expect(accessibilityReport.contrastRatios.secondaryOnBackground).toBeGreaterThanOrEqual(minContrastRatio)
              expect(accessibilityReport.contrastRatios.accentOnBackground).toBeGreaterThanOrEqual(minContrastRatio)

              // Should not have recommendations for non-compliance
              if (accessibilityReport.recommendations) {
                expect(accessibilityReport.recommendations.length).toBe(0)
              }

              // May have warnings about AAA compliance
              if (accessibilityReport.warnings) {
                expect(Array.isArray(accessibilityReport.warnings)).toBe(true)
                accessibilityReport.warnings.forEach(warning => {
                  expect(typeof warning).toBe('string')
                  expect(warning.toLowerCase()).toMatch(/aa|aaa/i)
                })
              }
            } else {
              // If a high-contrast palette is not compliant, verify the reasons are valid
              const minContrastRatio = 4.5
              const failingRatios = []
              
              if (accessibilityReport.contrastRatios.primaryOnBackground < minContrastRatio) {
                failingRatios.push('primary')
              }
              if (accessibilityReport.contrastRatios.secondaryOnBackground < minContrastRatio) {
                failingRatios.push('secondary')
              }
              if (accessibilityReport.contrastRatios.accentOnBackground < minContrastRatio) {
                failingRatios.push('accent')
              }

              expect(failingRatios.length).toBeGreaterThan(0)
              expect(accessibilityReport.recommendations).toBeDefined()
              expect(accessibilityReport.recommendations!.length).toBe(failingRatios.length)
            }
          } catch (error) {
            throw error
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should handle edge cases in color format parsing and contrast calculation', async () => {
    if (!supabase || !colorPaletteManager) {
      console.warn('Skipping test due to missing dependencies')
      return
    }

    await fc.assert(
      fc.asyncProperty(
        fc.record({
          name: fc.string({ minLength: 3, maxLength: 30 }),
          // Test various color formats
          primaryColor: fc.oneof(
            colorGenerator, // hex
            fc.record({
              h: fc.integer({ min: 0, max: 360 }),
              s: fc.integer({ min: 0, max: 100 }),
              l: fc.integer({ min: 0, max: 100 })
            }).map(({ h, s, l }) => `hsl(${h}, ${s}%, ${l}%)`), // hsl
            fc.record({
              r: fc.integer({ min: 0, max: 255 }),
              g: fc.integer({ min: 0, max: 255 }),
              b: fc.integer({ min: 0, max: 255 })
            }).map(({ r, g, b }) => `rgb(${r}, ${g}, ${b})`) // rgb
          ),
          primaryForeground: colorGenerator,
          secondaryColor: colorGenerator,
          secondaryForeground: colorGenerator,
          accentColor: colorGenerator,
          accentForeground: colorGenerator,
          mutedColor: colorGenerator,
          mutedForeground: colorGenerator,
          backgroundColor: fc.oneof(
            colorGenerator,
            fc.constantFrom('#ffffff', '#000000', '#f5f5f5', '#1a1a1a') // Common backgrounds
          ),
          foregroundColor: colorGenerator,
          cardColor: colorGenerator,
          cardForeground: colorGenerator,
          destructiveColor: colorGenerator,
          destructiveForeground: colorGenerator,
          sidebarBackground: colorGenerator,
          sidebarForeground: colorGenerator,
          sidebarPrimary: colorGenerator,
          sidebarPrimaryForeground: colorGenerator,
        }),
        async (paletteData) => {
          try {
            // Validate color contrast should not throw errors even with various color formats
            const accessibilityReport = await colorPaletteManager!.validateColorContrast(paletteData)

            // Should always return a valid report structure
            expect(accessibilityReport).toBeDefined()
            expect(typeof accessibilityReport.isCompliant).toBe('boolean')
            expect(typeof accessibilityReport.contrastRatios).toBe('object')

            // Contrast ratios should be valid numbers
            expect(Number.isFinite(accessibilityReport.contrastRatios.primaryOnBackground)).toBe(true)
            expect(Number.isFinite(accessibilityReport.contrastRatios.secondaryOnBackground)).toBe(true)
            expect(Number.isFinite(accessibilityReport.contrastRatios.accentOnBackground)).toBe(true)

            // Should handle edge cases gracefully (minimum contrast ratio is 1:1)
            expect(accessibilityReport.contrastRatios.primaryOnBackground).toBeGreaterThanOrEqual(1)
            expect(accessibilityReport.contrastRatios.secondaryOnBackground).toBeGreaterThanOrEqual(1)
            expect(accessibilityReport.contrastRatios.accentOnBackground).toBeGreaterThanOrEqual(1)

            // Verify color format validation works for all input colors
            const colorFields = [
              paletteData.primaryColor, paletteData.primaryForeground,
              paletteData.secondaryColor, paletteData.secondaryForeground,
              paletteData.accentColor, paletteData.accentForeground,
              paletteData.backgroundColor, paletteData.foregroundColor
            ]

            colorFields.forEach(color => {
              expect(colorPaletteManager!.validateColorFormat(color)).toBe(true)
            })
          } catch (error) {
            throw error
          }
        }
      ),
      { numRuns: 100 }
    )
  })
})