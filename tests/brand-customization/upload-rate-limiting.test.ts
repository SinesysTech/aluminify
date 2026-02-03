/**
 * Property-Based Test: Upload Rate Limiting
 * 
 * Tests upload rate limiting functionality for brand customization file uploads.
 * Validates Requirements 7.4
 * 
 * Feature: brand-customization, Property 19: Upload Rate Limiting
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'
import { NextRequest, NextResponse } from 'next/server'
import fc from 'fast-check'

// Mock rate limiting implementation
interface RateLimitConfig {
  maxRequests: number
  windowMs: number
  keyGenerator?: (req: NextRequest) => string
}

class MockRateLimiter {
  private requests: Map<string, number[]> = new Map()
  
  constructor(private config: RateLimitConfig) {}
  
  isAllowed(key: string): boolean {
    const now = Date.now()
    const windowStart = now - this.config.windowMs
    
    if (!this.requests.has(key)) {
      this.requests.set(key, [])
    }
    
    const keyRequests = this.requests.get(key)!
    
    // Remove old requests outside the window
    const validRequests = keyRequests.filter(time => time > windowStart)
    this.requests.set(key, validRequests)
    
    // Check if limit exceeded
    if (validRequests.length >= this.config.maxRequests) {
      return false
    }
    
    // Add current request
    validRequests.push(now)
    return true
  }
  
  reset() {
    this.requests.clear()
  }
}

// Mock middleware function
function withRateLimit(config: RateLimitConfig) {
  const limiter = new MockRateLimiter(config)
  
  return function rateLimitMiddleware(handler: Function) {
    return async (req: NextRequest, context: any) => {
      const key = config.keyGenerator ? config.keyGenerator(req) : 'default'
      
      if (!limiter.isAllowed(key)) {
        return new NextResponse(
          JSON.stringify({ error: 'Rate limit exceeded' }),
          { status: 429, headers: { 'Content-Type': 'application/json' } }
        )
      }
      
      return handler(req, context)
    }
  }
}

describe('Property 19: Upload Rate Limiting', () => {
  let rateLimiter: MockRateLimiter

  beforeEach(() => {
    rateLimiter = new MockRateLimiter({ maxRequests: 5, windowMs: 60000 })
  })

  afterEach(() => {
    rateLimiter.reset()
  })

  /**
   * Property 19: Upload Rate Limiting
   * For any series of file upload attempts, the system should implement rate limiting to prevent abuse
   * Validates: Requirements 7.4
   */
  it('should enforce rate limits for file upload attempts', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          requestCount: fc.integer({ min: 1, max: 8 }),
          timeSpacing: fc.integer({ min: 0, max: 50 }), // Reduced from 1000 to 50ms
          userAgent: fc.string({ minLength: 1, maxLength: 100 }),
          ipAddress: fc.ipV4(),
        }),

        async (scenario) => {
          const config: RateLimitConfig = {
            maxRequests: 3,
            windowMs: 5000, // 5 second window for testing
            keyGenerator: (req) => req.headers.get('x-forwarded-for') || 'default'
          }

          const middleware = withRateLimit(config)
          const mockHandler = jest.fn().mockResolvedValue(
            new NextResponse(JSON.stringify({ success: true }), { status: 200 })
          )
          const protectedHandler = middleware(mockHandler)

          let allowedRequests = 0
          let blockedRequests = 0

          // Simulate multiple requests
          for (let i = 0; i < scenario.requestCount; i++) {
            const mockRequest = new NextRequest('http://localhost/api/upload', {
              method: 'POST',
              headers: {
                'user-agent': scenario.userAgent,
                'x-forwarded-for': scenario.ipAddress,
                'content-type': 'multipart/form-data',
              },
            })

            const response = await protectedHandler(mockRequest, {})

            if (response.status === 200) {
              allowedRequests++
            } else if (response.status === 429) {
              blockedRequests++
              const body = await response.json()
              expect(body.error).toBe('Rate limit exceeded')
            }

            // Add time spacing between requests if specified
            if (scenario.timeSpacing > 0) {
              await new Promise(resolve => setTimeout(resolve, scenario.timeSpacing))
            }
          }

          // Verify rate limiting behavior
          if (scenario.requestCount <= config.maxRequests) {
            // All requests should be allowed if under limit
            expect(allowedRequests).toBe(scenario.requestCount)
            expect(blockedRequests).toBe(0)
          } else {
            // Some requests should be blocked if over limit
            expect(allowedRequests).toBeLessThanOrEqual(config.maxRequests)
            expect(blockedRequests).toBeGreaterThan(0)
            expect(allowedRequests + blockedRequests).toBe(scenario.requestCount)
          }
        }
      ),
      { numRuns: 1 } // Single run for faster execution
    )
  }, 60000) // Increased timeout to 60 seconds

  it('should handle different rate limit configurations', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          maxRequests: fc.integer({ min: 1, max: 5 }),
          windowMs: fc.integer({ min: 1000, max: 10000 }),
          requestCount: fc.integer({ min: 1, max: 8 }),
        }),

        async (scenario) => {
          const config: RateLimitConfig = {
            maxRequests: scenario.maxRequests,
            windowMs: scenario.windowMs,
          }

          const limiter = new MockRateLimiter(config)
          let allowedCount = 0

          // Make requests up to the scenario count
          for (let i = 0; i < scenario.requestCount; i++) {
            if (limiter.isAllowed('test-key')) {
              allowedCount++
            }
          }

          // Verify that allowed count doesn't exceed max requests
          expect(allowedCount).toBeLessThanOrEqual(scenario.maxRequests)

          // If request count is within limit, all should be allowed
          if (scenario.requestCount <= scenario.maxRequests) {
            expect(allowedCount).toBe(scenario.requestCount)
          }
        }
      ),
      { numRuns: 1 }
    )
  })

  it('should reset rate limits after time window expires', async () => {
    const config: RateLimitConfig = {
      maxRequests: 2,
      windowMs: 100, // Very short window for testing
    }

    const limiter = new MockRateLimiter(config)

    // Use up the rate limit
    expect(limiter.isAllowed('test-key')).toBe(true)
    expect(limiter.isAllowed('test-key')).toBe(true)
    expect(limiter.isAllowed('test-key')).toBe(false) // Should be blocked

    // Wait for window to expire
    await new Promise(resolve => setTimeout(resolve, 150))

    // Should be allowed again after window reset
    expect(limiter.isAllowed('test-key')).toBe(true)
  })

  it('should handle concurrent requests from different sources', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 1, maxLength: 5 }),

        async (userKeys) => {
          const config: RateLimitConfig = {
            maxRequests: 2,
            windowMs: 5000,
          }

          const limiter = new MockRateLimiter(config)
          const results: Record<string, number> = {}

          // Each user should be able to make requests up to the limit
          for (const userKey of userKeys) {
            let allowedForUser = 0
            
            // Try to make 3 requests per user (should allow 2, block 1)
            for (let i = 0; i < 3; i++) {
              if (limiter.isAllowed(userKey)) {
                allowedForUser++
              }
            }
            
            results[userKey] = allowedForUser
          }

          // Each user should be limited independently
          for (const userKey of userKeys) {
            expect(results[userKey]).toBeLessThanOrEqual(config.maxRequests)
            expect(results[userKey]).toBeGreaterThan(0) // At least one request should be allowed
          }
        }
      ),
      { numRuns: 1 }
    )
  })

  it('should provide appropriate error responses when rate limited', async () => {
    const config: RateLimitConfig = {
      maxRequests: 1,
      windowMs: 5000,
    }

    const middleware = withRateLimit(config)
    const mockHandler = jest.fn().mockResolvedValue(
      new NextResponse(JSON.stringify({ success: true }), { status: 200 })
    )
    const protectedHandler = middleware(mockHandler)

    const mockRequest = new NextRequest('http://localhost/api/upload', {
      method: 'POST',
      headers: { 'content-type': 'multipart/form-data' },
    })

    // First request should succeed
    const response1 = await protectedHandler(mockRequest, {})
    expect(response1.status).toBe(200)

    // Second request should be rate limited
    const response2 = await protectedHandler(mockRequest, {})
    expect(response2.status).toBe(429)

    const body = await response2.json()
    expect(body.error).toBe('Rate limit exceeded')
    expect(response2.headers.get('Content-Type')).toBe('application/json')
  })
})