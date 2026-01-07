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
import { LogoManagerImpl } from '@/backend/services/brand-customization'
import { getDatabaseClient } from '@/backend/clients/database'
import type { LogoType } from '@/types/brand-customization'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.warn('Supabase environment variables not found. Skipping logo application consistency tests.')
}

const supabase = SUPABASE_URL && SUPABASE_SERVICE_KEY 
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  : null

// Mock DOM environment for logo application tests
const mockDocument = {
  documentElement: {
    style: {
      setProperty: jest.fn(),
    },
  },
  querySelectorAll: jest.fn(() => []),
  querySelector: jest.fn(() => null),
  createElement: jest.fn(() => ({
    rel: '',
    href: '',
    setAttribute: jest.fn(),
  })),
  head: {
    appendChild: jest.fn(),
  },
}

// Mock global document
Object.defineProperty(global, 'document', {
  value: mockDocument,
  writable: true,
})

// Test data generators
const empresaGenerator = fc.record({
  nome: fc.string({ minLength: 3, maxLength: 50 }),
  slug: fc.string({ minLength: 3, maxLength: 30 }).map(s => s.toLowerCase().replace(/[^a-z0-9]/g, '-')),
  ativo: fc.boolean(),
})

const logoTypeGenerator = fc.constantFrom('login', 'sidebar', 'favicon') as fc.Arbitrary<LogoType>

const logoUrlGenerator = fc.string({ minLength: 10, maxLength: 200 }).map(s => 
  `https://example.com/logos/${s}.png`
)

// Mock File class for testing
class MockFile implements File {
  constructor(
    public name: string,
    public size: number,
    public type: string,
    public content: ArrayBuffer = new ArrayBuffer(size)
  ) {}

  get lastModified(): number { return Date.now() }
  get webkitRelativePath(): string { return '' }

  arrayBuffer(): Promise<ArrayBuffer> {
    return Promise.resolve(this.content)
  }

  slice(): Blob {
    return new MockFile(this.name, this.size, this.type, this.content)
  }

  stream(): ReadableStream<Uint8Array> {
    throw new Error('Not implemented')
  }

  text(): Promise<string> {
    return Promise.resolve('')
  }
}

const validLogoFileGenerator = fc.record({
  name: fc.string({ minLength: 5, maxLength: 50 }).map(s => `${s}.png`),
  size: fc.integer({ min: 1024, max: 1024 * 1024 }), // 1KB to 1MB
  type: fc.constantFrom('image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp'),
}).map(({ name, size, type }) => {
  // Create valid PNG header for content validation
  const pngHeader = new Uint8Array([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A])
  const content = new ArrayBuffer(size)
  const view = new Uint8Array(content)
  view.set(pngHeader)
  
  return new MockFile(name, size, type, content)
})

describe('Logo Application Consistency', () => {
  let testEmpresaIds: string[] = []
  let testTenantBrandingIds: string[] = []
  let testLogoIds: string[] = []
  let logoManager: LogoManagerImpl | null = null

  beforeAll(async () => {
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

  beforeEach(() => {
    // Reset DOM mocks before each test
    jest.clearAllMocks()
    mockDocument.querySelectorAll.mockReturnValue([])
    mockDocument.querySelector.mockReturnValue(null)
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
        fc.array(logoTypeGenerator, { minLength: 1, maxLength: 3 }),
        fc.array(logoUrlGenerator, { minLength: 1, maxLength: 5 }),
        async (empresas, logoTypes, logoUrls) => {
          const createdEmpresaIds: string[] = []
          const createdBrandingIds: string[] = []
          const createdLogoIds: string[] = []

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

            // Test logo application for each empresa and logo type combination
            for (const empresaId of createdEmpresaIds) {
              for (let i = 0; i < logoTypes.length; i++) {
                const logoType = logoTypes[i]
                const logoUrl = logoUrls[i % logoUrls.length]

                // Mock DOM elements for different logo types
                const mockElements = [
                  { src: '', setAttribute: jest.fn() },
                  { src: '', setAttribute: jest.fn() },
                  { src: '', setAttribute: jest.fn() },
                ]

                // Set up appropriate selectors based on logo type
                switch (logoType) {
                  case 'login':
                    mockDocument.querySelectorAll.mockImplementation((selector: string) => {
                      if (selector.includes('login') || selector.includes('auth')) {
                        return mockElements
                      }
                      return []
                    })
                    break
                  case 'sidebar':
                    mockDocument.querySelectorAll.mockImplementation((selector: string) => {
                      if (selector.includes('sidebar') || selector.includes('nav')) {
                        return mockElements
                      }
                      return []
                    })
                    break
                  case 'favicon':
                    const mockFavicon = { href: '', rel: 'icon' }
                    mockDocument.querySelector.mockImplementation((selector: string) => {
                      if (selector.includes('icon')) {
                        return mockFavicon
                      }
                      return null
                    })
                    mockDocument.createElement.mockReturnValue(mockFavicon)
                    break
                }

                // Apply logo using LogoManager
                logoManager!.applyLogo(empresaId, logoUrl, logoType)

                // Verify logo application consistency
                switch (logoType) {
                  case 'login':
                    // Should query for login-related selectors
                    expect(mockDocument.querySelectorAll).toHaveBeenCalledWith(
                      expect.stringContaining('login')
                    )
                    // All login elements should have the logo applied
                    mockElements.forEach(element => {
                      expect(element.src).toBe(logoUrl)
                    })
                    break

                  case 'sidebar':
                    // Should query for sidebar-related selectors
                    expect(mockDocument.querySelectorAll).toHaveBeenCalledWith(
                      expect.stringContaining('sidebar')
                    )
                    // All sidebar elements should have the logo applied
                    mockElements.forEach(element => {
                      expect(element.src).toBe(logoUrl)
                    })
                    break

                  case 'favicon':
                    // Should update favicon
                    expect(mockDocument.querySelector).toHaveBeenCalledWith(
                      expect.stringContaining('icon')
                    )
                    const favicon = mockDocument.querySelector('link[rel="icon"]')
                    if (favicon) {
                      expect((favicon as any).href).toBe(logoUrl)
                    }
                    break
                }

                // Test consistency - applying the same logo multiple times should be idempotent
                const initialCallCount = mockDocument.querySelectorAll.mock.calls.length
                
                // Apply the same logo again
                logoManager!.applyLogo(empresaId, logoUrl, logoType)
                
                // Should still work consistently
                if (logoType !== 'favicon') {
                  expect(mockDocument.querySelectorAll.mock.calls.length).toBeGreaterThan(initialCallCount)
                }

                // Reset mocks for next iteration
                jest.clearAllMocks()
                mockDocument.querySelectorAll.mockReturnValue([])
                mockDocument.querySelector.mockReturnValue(null)
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
              const mockElements1 = [{ src: '', setAttribute: jest.fn() }]
              const mockElements2 = [{ src: '', setAttribute: jest.fn() }]

              // Apply different logos to different empresas
              mockDocument.querySelectorAll.mockReturnValue(mockElements1)
              logoManager!.applyLogo(empresa1, logo1Url, logoType)

              mockDocument.querySelectorAll.mockReturnValue(mockElements2)
              logoManager!.applyLogo(empresa2, logo2Url, logoType)

              // Each empresa should have its own logo applied
              expect(mockElements1[0].src).toBe(logo1Url)
              expect(mockElements2[0].src).toBe(logo2Url)
              expect(mockElements1[0].src).not.toBe(mockElements2[0].src)
            }

          } catch (error) {
            // Clean up on error
            if (createdLogoIds.length > 0) {
              await supabase!.from('tenant_logos').delete().in('id', createdLogoIds)
            }
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
          mockDocument.querySelectorAll.mockReturnValue([])
          mockDocument.querySelector.mockReturnValue(null)

          // Should not throw error when no elements are found
          expect(() => {
            logoManager!.applyLogo(empresaId, logoUrl, logoType)
          }).not.toThrow()

          // Should still attempt to query for elements
          if (logoType === 'favicon') {
            expect(mockDocument.querySelector).toHaveBeenCalled()
          } else {
            expect(mockDocument.querySelectorAll).toHaveBeenCalled()
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
          const mockElements = [{ src: '', setAttribute: jest.fn() }]
          mockDocument.querySelectorAll.mockReturnValue(mockElements)

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
          const loginElements = [{ src: '', setAttribute: jest.fn() }]
          const sidebarElements = [{ src: '', setAttribute: jest.fn() }]
          const faviconElement = { href: '', rel: 'icon' }

          // Set up selector mocking
          mockDocument.querySelectorAll.mockImplementation((selector: string) => {
            if (selector.includes('login') || selector.includes('auth')) {
              return loginElements
            }
            if (selector.includes('sidebar') || selector.includes('nav')) {
              return sidebarElements
            }
            return []
          })

          mockDocument.querySelector.mockImplementation((selector: string) => {
            if (selector.includes('icon')) {
              return faviconElement
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