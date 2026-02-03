/**
 * @jest-environment jsdom
 */
/**
 * Property-Based Tests - Logo Application Consistency
 * 
 * Tests logo application consistency for the brand customization system.
 * Validates Requirements 1.1, 1.2, 1.5
 * 
 * Feature: brand-customization, Property 1: Logo Application Consistency
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals'
import { createClient } from '@supabase/supabase-js'
import fc from 'fast-check'
import { LogoManagerImpl } from '@/app/[tenant]/(modules)/settings/personalizacao/services/logo-manager'
import { getDatabaseClient } from '@/app/shared/core/database/database'

// Polyfill fetch for JSDOM
global.fetch = global.fetch || require('cross-fetch');


const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.warn('Supabase environment variables not found. Skipping logo application consistency tests.')
}

const supabase = SUPABASE_URL && SUPABASE_SERVICE_KEY 
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  : null

// Use existing document from JSDOM
// We will spy on its methods in beforeAll/beforeEach

// Variable to hold spies
let querySelectorAllSpy: jest.SpiedFunction<typeof document.querySelectorAll>;
let querySelectorSpy: jest.SpiedFunction<typeof document.querySelector>;
let createElementSpy: jest.SpiedFunction<typeof document.createElement>;
let setPropertySpy: jest.SpiedFunction<typeof document.documentElement.style.setProperty>;


// Test data generators
const empresaGenerator = fc.record({
  nome: fc.string({ minLength: 3, maxLength: 50 }).map(s => s.replace(/[^a-zA-Z0-9 ]/g, '').trim()).filter(s => s.length >= 3),
  slug: fc.string({ minLength: 3, maxLength: 30 }).map(s => s.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/^-+|-+$/g, '') || 'valid-slug'),
  ativo: fc.boolean(),
})

const logoUrlGenerator = fc.string({ minLength: 10, maxLength: 50 }).map(s => 
  `https://example.com/logos/${s.replace(/[^a-zA-Z0-9]/g, '')}.png`
)

const logoTypeGenerator = fc.constantFrom('login', 'sidebar', 'favicon')

describe('Logo Application Consistency', () => {
  let testEmpresaIds: string[] = []
  let testTenantBrandingIds: string[] = []
  let testLogoIds: string[] = []
  let logoManager: LogoManagerImpl | null = null

  beforeAll(async () => {
    // Setup document spies
    querySelectorAllSpy = jest.spyOn(document, 'querySelectorAll');
    querySelectorSpy = jest.spyOn(document, 'querySelector');
    createElementSpy = jest.spyOn(document, 'createElement');
    setPropertySpy = jest.spyOn(document.documentElement.style, 'setProperty');

    // Default implementations
    querySelectorAllSpy.mockReturnValue([] as any);
    querySelectorSpy.mockReturnValue(null);
    createElementSpy.mockReturnValue({
      rel: '',
      href: '',
      setAttribute: jest.fn(),
    } as any);

    if (!supabase) {
      console.warn('Supabase client not available. Skipping tests.')
      return
    }

    try {
      const dbClient = getDatabaseClient()
      logoManager = new LogoManagerImpl(dbClient)
    } catch (error) {
      console.warn('Could not create LogoManagerImpl:', error)
      return
    }

    // Mock check passed
    if (logoManager) { 
        // Ready
    }
  })

  beforeEach(() => {
    // Reset spies before each test
    jest.clearAllMocks()
    if (querySelectorAllSpy) querySelectorAllSpy.mockReturnValue([] as any)
    if (querySelectorSpy) querySelectorSpy.mockReturnValue(null)
  })

  afterAll(async () => {
    if (!supabase) return

    // Clean up all test data
    try {
      if (testLogoIds.length > 0) {
        await supabase.from('tenant_logos').delete().in('id', testLogoIds)
      }
      if (testTenantBrandingIds.length > 0) {
        await supabase.from('tenant_branding').delete().in('id', testTenantBrandingIds)
      }
      if (testEmpresaIds.length > 0) {
        await supabase.from('empresas').delete().in('id', testEmpresaIds)
      }
    } catch (error) {
      console.warn('Error during cleanup:', error)
    }
  })

  /**
   * Property 1: Logo Application Consistency
   * For any uploaded logo and logo type (login/sidebar), when applied to a tenant, 
   * the logo should appear consistently across all relevant pages and user sessions for that tenant
   * Validates: Requirements 1.1, 1.2, 1.5
   */
  it('should apply logos consistently across all relevant UI elements for any tenant', async () => {
    if (!supabase || !logoManager) {
      console.warn('Skipping test: Required dependencies not available')
      return
    }

    // Spy on console.error to check for swallowed exceptions
    jest.spyOn(console, 'error').mockImplementation(() => {});
    
    // Check if empresas table exists...
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
        fc.array(empresaGenerator, { minLength: 1, maxLength: 3 }),
        fc.array(logoTypeGenerator, { minLength: 1, maxLength: 3 }),
        fc.array(logoUrlGenerator, { minLength: 1, maxLength: 5 }),
        async (empresas, logoTypes, logoUrls) => {
          const createdEmpresaIds: string[] = []

          // Generate mock IDs instead of inserting into DB
          for (const empresaData of empresas) {
             const mockId = `mock-empresa-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
             createdEmpresaIds.push(mockId)
          }

          // Test logo application for each empresa and logo type combination
          for (const empresaId of createdEmpresaIds) {
              for (let i = 0; i < logoTypes.length; i++) {
                const logoType = logoTypes[i]
                const logoUrl = logoUrls[i % logoUrls.length]

                // Mock DOM elements for different logo types
                const mockElements = [
                  document.createElement('img'),
                  document.createElement('img'),
                  document.createElement('img'),
                ]

                // Set up appropriate selectors based on logo type
                  switch (logoType) {
                    case 'login':
                      querySelectorAllSpy.mockImplementation((selector: string) => {
                        if (selector.includes('login') || selector.includes('auth')) {
                          return mockElements as any
                        }
                        return [] as any
                      })
                      break
                    case 'sidebar':
                      querySelectorAllSpy.mockImplementation((selector: string) => {
                        if (selector.includes('sidebar') || selector.includes('nav')) {
                          return mockElements as any
                        }
                        return [] as any
                      })
                      break
                    case 'favicon':
                      const mockFavicon = { href: '', rel: 'icon' }
                      querySelectorSpy.mockImplementation((selector: string) => {
                        if (selector.includes('icon')) {
                          return mockFavicon as any
                        }
                        return null
                      })
                      createElementSpy.mockReturnValue(mockFavicon as any)
                      break
                  }

                // Apply logo using LogoManager
                logoManager!.applyLogo(empresaId, logoUrl, logoType)

                if (console.error.mock.calls.length > 0) {
                   // If error occurred, fail explicitly with the error message
                   const lastError = console.error.mock.calls[0];
                   throw new Error(`LogoManager.applyLogo logged error: ${lastError}`);
                }

                // Verify logo application consistency
                switch (logoType) {
                  case 'login':
                    // Should query for login-related selectors
                    expect(querySelectorAllSpy).toHaveBeenCalledWith(
                      expect.stringContaining('login')
                    )
                    // All login elements should have the logo applied
                    mockElements.forEach(element => {
                      expect(element.src).toBe(logoUrl)
                    })
                    break

                  case 'sidebar':
                    // Should query for sidebar-related selectors
                    expect(querySelectorAllSpy).toHaveBeenCalledWith(
                      expect.stringContaining('sidebar')
                    )
                    // All sidebar elements should have the logo applied
                    mockElements.forEach(element => {
                      expect(element.src).toBe(logoUrl)
                    })
                    break

                  case 'favicon':
                    // Should update favicon
                    expect(querySelectorSpy).toHaveBeenCalledWith(
                      expect.stringContaining('icon')
                    )
                    // We can verify mock implementation effect, knowing implementation details
                    const favicon = querySelectorSpy.mock.results[0].value
                    if (favicon) {
                      expect((favicon as any).href).toBe(logoUrl)
                    }
                    break
                }

                // Test consistency - applying the same logo multiple times should be idempotent
                const initialCallCount = querySelectorAllSpy.mock.calls.length
                
                // Apply the same logo again
                logoManager!.applyLogo(empresaId, logoUrl, logoType)
                
                // Should still work consistently
                if (logoType !== 'favicon') {
                  expect(querySelectorAllSpy.mock.calls.length).toBeGreaterThan(initialCallCount)
                }

                // Reset mocks for next iteration
                jest.clearAllMocks()
                querySelectorAllSpy.mockReturnValue([] as any)
                querySelectorSpy.mockReturnValue(null)
              }
            }

            // Test that different empresas can have different logos applied independently
            if (createdEmpresaIds.length > 1) {
              const empresa1 = createdEmpresaIds[0]
              const empresa2 = createdEmpresaIds[1]
              const logoType = logoTypes[0]
              const logo1Url = logoUrls[0]
              const logo2Url = logoUrls[1] || `${logo1Url}-different`

              // Mock elements for testing
              const mockElements1 = [document.createElement('img')]
              const mockElements2 = [document.createElement('img')]

              // Apply different logos to different empresas
              querySelectorAllSpy.mockReturnValue(mockElements1 as any)
              logoManager!.applyLogo(empresa1, logo1Url, logoType)

              querySelectorAllSpy.mockReturnValue(mockElements2 as any)
              logoManager!.applyLogo(empresa2, logo2Url, logoType)

              // Each empresa should have its own logo applied
              expect(mockElements1[0].src).toBe(logo1Url)
              expect(mockElements2[0].src).toBe(logo2Url)
              expect(mockElements1[0].src).not.toBe(mockElements2[0].src)
            }

        }
      ),
      { numRuns: 100 } // 100 iterations as specified in design
    )
  }, 60000) // 60 second timeout for property test

  /**
   * Test logo application with missing DOM elements
   */
  it('should handle missing DOM elements gracefully', async () => {
    if (!logoManager) {
      console.warn('Skipping test: LogoManager not available')
      return
    }

    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 10, maxLength: 50 }),
        logoTypeGenerator,
        logoUrlGenerator,
        async (empresaId, logoType, logoUrl) => {
          // Mock empty DOM (no elements found)
          querySelectorAllSpy.mockReturnValue([] as any)
          querySelectorSpy.mockReturnValue(null)

          // Should not throw error when no elements are found
          expect(() => {
            logoManager!.applyLogo(empresaId, logoUrl, logoType)
          }).not.toThrow()

          // Should still attempt to query for elements
          if (logoType === 'favicon') {
            expect(querySelectorSpy).toHaveBeenCalled()
          } else {
            expect(querySelectorAllSpy).toHaveBeenCalled()
          }
        }
      ),
      { numRuns: 50 }
    )
  }, 30000)

  /**
   * Test logo application with invalid URLs
   */
  it('should handle invalid logo URLs gracefully', async () => {
    if (!logoManager) {
      console.warn('Skipping test: LogoManager not available')
      return
    }

    const invalidUrls = [
      '',
      'not-a-url',
      'javascript:alert("xss")',
      'data:text/html,<script>alert("xss")</script>',
      null,
      undefined,
    ]

    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 10, maxLength: 50 }),
        logoTypeGenerator,
        fc.constantFrom(...invalidUrls),
        async (empresaId, logoType, invalidUrl) => {
          const mockElements = [document.createElement('img')]
          querySelectorAllSpy.mockReturnValue(mockElements as any)

          // Should not throw error with invalid URLs
          expect(() => {
            logoManager!.applyLogo(empresaId, invalidUrl as any, logoType)
          }).not.toThrow()

          // Should still attempt to apply the URL (validation is not LogoManager's responsibility)
          if (logoType !== 'favicon' && mockElements.length > 0) {
            expect(mockElements[0].src).toBe(invalidUrl || '')
          }
        }
      ),
      { numRuns: 30 }
    )
  }, 20000)

  /**
   * Test that logo application is specific to logo type
   */
  it('should apply logos only to elements matching the logo type', async () => {
    if (!logoManager) {
      console.warn('Skipping test: LogoManager not available')
      return
    }

    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 10, maxLength: 50 }),
        logoUrlGenerator,
        async (empresaId, logoUrl) => {
          // Mock different types of elements
          const loginElements = [document.createElement('img')]
          const sidebarElements = [document.createElement('img')]
          const faviconElement = { href: '', rel: 'icon' }

          // Set up selector mocking
          querySelectorAllSpy.mockImplementation((selector: string) => {
            if (selector.includes('login') || selector.includes('auth')) {
              return loginElements as any
            }
            if (selector.includes('sidebar') || selector.includes('nav')) {
              return sidebarElements as any
            }
            return [] as any
          })

          querySelectorSpy.mockImplementation((selector: string) => {
            if (selector.includes('icon')) {
              return faviconElement as any
            }
            return null
          })

          // Apply login logo
          logoManager!.applyLogo(empresaId, logoUrl, 'login')

          // Only login elements should be affected
          expect(loginElements[0].src).toBe(logoUrl)
          expect(sidebarElements[0].src).toBe('') // Should remain unchanged
          expect(faviconElement.href).toBe('') // Should remain unchanged

          // Reset and apply sidebar logo
          loginElements[0].src = ''
          logoManager!.applyLogo(empresaId, logoUrl, 'sidebar')

          // Only sidebar elements should be affected
          expect(sidebarElements[0].src).toBe(logoUrl)
          expect(loginElements[0].src).toBe('') // Should remain unchanged
          expect(faviconElement.href).toBe('') // Should remain unchanged

          // Reset and apply favicon
          sidebarElements[0].src = ''
          logoManager!.applyLogo(empresaId, logoUrl, 'favicon')

          // Only favicon should be affected
          expect(faviconElement.href).toBe(logoUrl)
          expect(loginElements[0].src).toBe('') // Should remain unchanged
          expect(sidebarElements[0].src).toBe('') // Should remain unchanged
        }
      ),
      { numRuns: 50 }
    )
  }, 30000)
})