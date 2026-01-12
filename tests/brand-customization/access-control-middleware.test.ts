import { NextRequest, NextResponse } from 'next/server';
import {
  requireEmpresaAdmin,
  withUploadRateLimit,
  verifyEmpresaAdminAccess,
} from '@/backend/middleware/brand-customization-access';
import { validateUploadedFile, sanitizeFilename } from '@/backend/middleware/file-security';

// Mock the database client
const mockMaybeSingle = jest.fn();
const mockEq2 = jest.fn(() => ({ maybeSingle: mockMaybeSingle }));
const mockEq1 = jest.fn(() => ({ eq: mockEq2 }));
const mockSelect = jest.fn(() => ({ eq: mockEq1 }));
const mockFrom = jest.fn(() => ({ select: mockSelect }));
const mockDbClient = {
  from: mockFrom,
  auth: {
    getUser: jest.fn(),
  },
};

jest.mock('@/backend/clients/database', () => ({
  getDatabaseClient: jest.fn(() => mockDbClient),
}));

// Mock the auth middleware
jest.mock('@/backend/auth/middleware', () => ({
  getAuthUser: jest.fn(),
}));

// Mock the empresa context
jest.mock('@/backend/middleware/empresa-context', () => ({
  getEmpresaContext: jest.fn(),
  validateEmpresaAccess: jest.fn(),
}));

describe('Brand Customization Access Control Middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockMaybeSingle.mockReset();
  });

  describe('sanitizeFilename', () => {
    it('should remove dangerous characters from filename', () => {
      const dangerous = 'file<>:"/\\|?*.jpg';
      const sanitized = sanitizeFilename(dangerous);
      expect(sanitized).toBe('file_________.jpg');
    });

    it('should handle empty or invalid filenames', () => {
      expect(sanitizeFilename('')).toMatch(/^file_\d+$/);
      expect(sanitizeFilename('...')).toMatch(/^file_\d+$/);
      expect(sanitizeFilename('   ')).toMatch(/^file_\d+$/);
    });

    it('should limit filename length', () => {
      const longName = 'a'.repeat(300) + '.jpg';
      const sanitized = sanitizeFilename(longName);
      expect(sanitized.length).toBeLessThanOrEqual(255);
      expect(sanitized.endsWith('.jpg')).toBe(true);
    });
  });

  describe('validateUploadedFile', () => {
    it('should validate supported image formats', async () => {
      const validFile = new File(['test'], 'test.png', { type: 'image/png' });
      const result = await validateUploadedFile(validFile);
      expect(result.isValid).toBe(true);
      expect(result.sanitizedFilename).toBe('test.png');
    });

    it('should reject unsupported formats', async () => {
      const invalidFile = new File(['test'], 'test.exe', { type: 'application/x-executable' });
      const result = await validateUploadedFile(invalidFile);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Unsupported file format');
    });

    it('should reject files that are too large', async () => {
      const largeContent = new Array(6 * 1024 * 1024).fill('a').join(''); // 6MB
      const largeFile = new File([largeContent], 'large.png', { type: 'image/png' });
      const result = await validateUploadedFile(largeFile);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('exceeds maximum allowed size');
    });

    it('should reject empty files', async () => {
      const emptyFile = new File([], 'empty.png', { type: 'image/png' });
      const result = await validateUploadedFile(emptyFile);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('File is empty');
    });
  });

  describe('verifyEmpresaAdminAccess', () => {
    it('should return true for valid admin user', async () => {
      const mockClient = require('@/backend/clients/database').getDatabaseClient();
      const mockMaybeSingle = mockClient.from().select().eq().eq().maybeSingle;
      mockMaybeSingle.mockResolvedValue({
        data: { id: 'user1', empresa_id: 'empresa1', is_admin: true },
        error: null,
      });

      const result = await verifyEmpresaAdminAccess('user1', 'empresa1');
      expect(result.isAdmin).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should return false for non-admin user', async () => {
      const mockClient = require('@/backend/clients/database').getDatabaseClient();
      const mockMaybeSingle = mockClient.from().select().eq().eq().maybeSingle;
      mockMaybeSingle.mockResolvedValue({
        data: { id: 'user1', empresa_id: 'empresa1', is_admin: false },
        error: null,
      });

      const result = await verifyEmpresaAdminAccess('user1', 'empresa1');
      expect(result.isAdmin).toBe(false);
      expect(result.error).toContain('does not have admin privileges');
    });

    it('should return false for user not in empresa', async () => {
      const mockClient = require('@/backend/clients/database').getDatabaseClient();
      const mockMaybeSingle = mockClient.from().select().eq().eq().maybeSingle;
      mockMaybeSingle.mockResolvedValue({
        data: null,
        error: null,
      });

      const result = await verifyEmpresaAdminAccess('user1', 'empresa1');
      expect(result.isAdmin).toBe(false);
      expect(result.error).toContain('not a professor in the specified empresa');
    });
  });

  describe('Rate Limiting', () => {
    it('should allow requests within rate limit', async () => {
      const mockHandler = jest.fn().mockResolvedValue(NextResponse.json({ success: true }));
      const rateLimitedHandler = withUploadRateLimit(mockHandler);

      const request = new NextRequest('http://localhost/api/upload', {
        method: 'POST',
        headers: { 'content-type': 'multipart/form-data' },
      }) as BrandCustomizationRequest;
      
      request.user = { id: 'user1', email: 'test@example.com', role: 'professor', isSuperAdmin: false };

      const response = await rateLimitedHandler(request);
      expect(mockHandler).toHaveBeenCalled();
      expect(response.headers.get('X-RateLimit-Remaining')).toBeDefined();
    });

    it('should skip rate limiting for non-upload requests', async () => {
      const mockHandler = jest.fn().mockResolvedValue(NextResponse.json({ success: true }));
      const rateLimitedHandler = withUploadRateLimit(mockHandler);

      const request = new NextRequest('http://localhost/api/config', {
        method: 'GET',
      }) as BrandCustomizationRequest;
      
      request.user = { id: 'user1', email: 'test@example.com', role: 'professor', isSuperAdmin: false };

      const response = await rateLimitedHandler(request);
      expect(mockHandler).toHaveBeenCalled();
      expect(response.headers.get('X-RateLimit-Remaining')).toBeNull();
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete access control flow', async () => {
      // Mock successful authentication
      const { getAuthUser } = require('@/backend/auth/middleware');
      getAuthUser.mockResolvedValue({
        id: 'user1',
        email: 'admin@empresa1.com',
        role: 'professor',
        isSuperAdmin: false,
        empresaId: 'empresa1',
      });

      // Mock successful admin verification
      const mockClient = require('@/backend/clients/database').getDatabaseClient();
      mockClient.from().select().eq().eq().maybeSingle.mockResolvedValue({
        data: { id: 'user1', empresa_id: 'empresa1', is_admin: true },
        error: null,
      });

      // Mock empresa context access as allowed
      const { getEmpresaContext, validateEmpresaAccess } = require('@/backend/middleware/empresa-context');
      getEmpresaContext.mockResolvedValue({ empresaId: 'empresa1' });
      validateEmpresaAccess.mockReturnValue(true);

      const mockHandler = jest.fn().mockResolvedValue(NextResponse.json({ success: true }));
      const protectedHandler = requireEmpresaAdmin(mockHandler);

      const request = new NextRequest('http://localhost/api/brand-customization/empresa1', {
        method: 'GET',
      });

      const response = await protectedHandler(request, { params: { empresaId: 'empresa1' } });
      
      expect(mockHandler).toHaveBeenCalled();
      expect(response.status).toBe(200);
    });

    it('should reject unauthorized access', async () => {
      // Mock failed authentication
      const { getAuthUser } = require('@/backend/auth/middleware');
      getAuthUser.mockResolvedValue(null);

      const mockHandler = jest.fn();
      const protectedHandler = requireEmpresaAdmin(mockHandler);

      const request = new NextRequest('http://localhost/api/brand-customization/empresa1', {
        method: 'GET',
      });

      const response = await protectedHandler(request, { params: { empresaId: 'empresa1' } });
      
      expect(mockHandler).not.toHaveBeenCalled();
      expect(response.status).toBe(401);
      
      const body = await response.json();
      expect(body.error).toBe('Authentication required');
    });
  });
});