/**
 * Jest setup file for brand customization tests
 */

// Extend Jest matchers if needed
// import 'jest-extended'

// Set up test environment variables
process.env.NODE_ENV = 'test'

// Minimal env required for modules that validate env on import
process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'https://example.supabase.co'
process.env.SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'test-service-role-key'
process.env.SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'test-anon-key'

// Global test timeout
jest.setTimeout(30000)