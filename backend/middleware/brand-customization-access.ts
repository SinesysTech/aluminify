import { NextRequest, NextResponse } from 'next/server';
import { AuthenticatedRequest, getAuthUser } from '@/backend/auth/middleware';
import { getEmpresaContext, validateEmpresaAccess } from '@/backend/middleware/empresa-context';
import { getDatabaseClient } from '@/backend/clients/database';

/**
 * Rate limiting store for file uploads
 * In production, this should be replaced with Redis or similar persistent store
 */
class InMemoryRateLimiter {
  private requests: Map<string, { count: number; resetTime: number }> = new Map();
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(maxRequests: number = 10, windowMs: number = 15 * 60 * 1000) { // 10 requests per 15 minutes
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  isAllowed(key: string): boolean {
    const now = Date.now();
    const record = this.requests.get(key);

    if (!record || now > record.resetTime) {
      // Reset or create new record
      this.requests.set(key, { count: 1, resetTime: now + this.windowMs });
      return true;
    }

    if (record.count >= this.maxRequests) {
      return false;
    }

    record.count++;
    return true;
  }

  getRemainingRequests(key: string): number {
    const record = this.requests.get(key);
    if (!record || Date.now() > record.resetTime) {
      return this.maxRequests;
    }
    return Math.max(0, this.maxRequests - record.count);
  }

  getResetTime(key: string): number {
    const record = this.requests.get(key);
    if (!record || Date.now() > record.resetTime) {
      return Date.now() + this.windowMs;
    }
    return record.resetTime;
  }

  // Cleanup expired entries periodically
  cleanup(): void {
    const now = Date.now();
    for (const [key, record] of this.requests.entries()) {
      if (now > record.resetTime) {
        this.requests.delete(key);
      }
    }
  }
}

// Global rate limiter instance
const uploadRateLimiter = new InMemoryRateLimiter();

// Cleanup expired entries every 5 minutes
setInterval(() => {
  uploadRateLimiter.cleanup();
}, 5 * 60 * 1000);

/**
 * Interface for brand customization access control
 */
export interface BrandCustomizationRequest extends AuthenticatedRequest {
  empresaId?: string;
  isEmpresaAdmin?: boolean;
}

function getRequestIp(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  const ipFromForwardedFor = forwardedFor?.split(',')[0]?.trim();
  return ipFromForwardedFor || request.headers.get('x-real-ip') || 'unknown';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isStringRecord(value: unknown): value is Record<string, string> {
  if (!isRecord(value)) return false
  return Object.values(value).every((v) => typeof v === 'string')
}

async function unwrapNextParamsContext<Ctx>(context: Ctx): Promise<Ctx> {
  if (!isRecord(context) || !('params' in context)) return context

  const paramsValue = (context as Record<string, unknown>).params
  if (paramsValue instanceof Promise) {
    const params = await paramsValue
    return { ...(context as Record<string, unknown>), params } as Ctx
  }

  return context;
}

/**
 * Logs unauthorized access attempts
 */
function logUnauthorizedAccess(
  userId: string | undefined,
  empresaId: string | undefined,
  action: string,
  reason: string,
  request: NextRequest
): void {
  const logData = {
    timestamp: new Date().toISOString(),
    userId: userId || 'unknown',
    empresaId: empresaId || 'unknown',
    action,
    reason,
    ip: getRequestIp(request),
    userAgent: request.headers.get('user-agent') || 'unknown',
    url: request.url,
  };

  console.warn('[Brand Customization] Unauthorized access attempt:', logData);
  
  // In production, this should be sent to a proper logging service
  // Example: await logService.logSecurityEvent('unauthorized_access', logData);
}

/**
 * Verifies that the user has empresa admin privileges for brand customization
 * Now supports both the new usuarios/papeis system and legacy professores.is_admin
 */
export async function verifyEmpresaAdminAccess(
  userId: string,
  empresaId: string
): Promise<{ isAdmin: boolean; error?: string }> {
  const client = getDatabaseClient();

  try {
    // First, check the new usuarios/papeis system
    const { data: usuario, error: usuarioError } = await client
      .from('usuarios')
      .select(`
        id,
        empresa_id,
        papel_id,
        papeis!inner(id, tipo)
      `)
      .eq('id', userId)
      .eq('empresa_id', empresaId)
      .maybeSingle();

    if (!usuarioError && usuario) {
      // Check if the user has an admin role
      const papel = usuario.papeis as { id: string; tipo: string } | null;
      if (papel && (papel.tipo === 'admin' || papel.tipo === 'professor_admin')) {
        return { isAdmin: true };
      }
    }

    // Fallback: Check legacy professores.is_admin for backward compatibility
    const { data: professor, error: professorError } = await client
      .from('professores')
      .select('id, empresa_id, is_admin')
      .eq('id', userId)
      .eq('empresa_id', empresaId)
      .maybeSingle();

    if (professorError) {
      console.error('[Brand Customization] Error checking professor admin status:', professorError);
      return { isAdmin: false, error: 'Database error while checking permissions' };
    }

    if (professor && professor.is_admin) {
      return { isAdmin: true };
    }

    // No admin access found in either system
    return { isAdmin: false, error: 'User does not have admin privileges in the empresa' };
  } catch (err) {
    console.error('[Brand Customization] Exception checking admin access:', err);
    return { isAdmin: false, error: 'Unexpected error while checking permissions' };
  }
}

/**
 * Middleware to require empresa admin access for brand customization
 */
export function requireEmpresaAdmin<Ctx>(
  handler: (request: BrandCustomizationRequest, context: Ctx) => Promise<NextResponse>,
) {
  return async (request: NextRequest, context: Ctx): Promise<NextResponse> => {
    // Get authenticated user
    const user = await getAuthUser(request);
    
    if (!user) {
      logUnauthorizedAccess(undefined, undefined, 'brand_customization_access', 'No authentication', request);
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Unwrap params if it's a Promise (Next.js 16+)
    const unwrappedContext = await unwrapNextParamsContext(context);

    // Extract empresaId from params or query
    const params = isRecord(unwrappedContext) ? (unwrappedContext as Record<string, unknown>).params : undefined
    const empresaIdFromParams =
      params instanceof Promise ? null : (isStringRecord(params) ? params.empresaId : null)
    const empresaId = empresaIdFromParams || request.nextUrl.searchParams.get('empresa_id');

    if (!empresaId) {
      logUnauthorizedAccess(user.id, undefined, 'brand_customization_access', 'No empresa ID provided', request);
      return NextResponse.json(
        { error: 'Empresa ID is required' },
        { status: 400 }
      );
    }

    // Superadmins can access any empresa
    if (user.isSuperAdmin) {
      const authenticatedRequest = request as BrandCustomizationRequest;
      authenticatedRequest.user = user;
      authenticatedRequest.empresaId = empresaId;
      authenticatedRequest.isEmpresaAdmin = true;
      
      return handler(authenticatedRequest, unwrappedContext);
    }

    // Get empresa context for regular users
    const client = getDatabaseClient();
    const empresaContext = await getEmpresaContext(client, user.id, request, user);

    // Validate empresa access
    if (!validateEmpresaAccess(empresaContext, empresaId)) {
      logUnauthorizedAccess(
        user.id,
        empresaId,
        'brand_customization_access',
        'User does not belong to the specified empresa',
        request
      );
      return NextResponse.json(
        { error: 'Access denied: You do not have permission to access this empresa' },
        { status: 403 }
      );
    }

    // Verify admin privileges
    const { isAdmin, error } = await verifyEmpresaAdminAccess(user.id, empresaId);
    
    if (!isAdmin) {
      logUnauthorizedAccess(
        user.id,
        empresaId,
        'brand_customization_access',
        error || 'User is not an admin',
        request
      );
      return NextResponse.json(
        { error: 'Access denied: Admin privileges required for brand customization' },
        { status: 403 }
      );
    }

    // All checks passed
    const authenticatedRequest = request as BrandCustomizationRequest;
    authenticatedRequest.user = user;
    authenticatedRequest.empresaId = empresaId;
    authenticatedRequest.isEmpresaAdmin = true;
    
    return handler(authenticatedRequest, unwrappedContext);
  };
}

/**
 * Middleware to apply rate limiting for file uploads
 */
export function withUploadRateLimit<Ctx>(
  handler: (request: BrandCustomizationRequest, context: Ctx) => Promise<NextResponse>,
) {
  return async (request: BrandCustomizationRequest, context: Ctx) => {
    // Only apply rate limiting to file upload requests
    const isFileUpload = request.method === 'POST' && 
      (request.headers.get('content-type')?.includes('multipart/form-data') ||
       request.url.includes('/upload') ||
       request.url.includes('/logo'));

    if (!isFileUpload) {
      return handler(request, context);
    }

    // Create rate limiting key based on user ID and IP
    const userId = request.user?.id || 'anonymous';
    const ip = getRequestIp(request);
    const rateLimitKey = `upload:${userId}:${ip}`;

    // Check rate limit
    if (!uploadRateLimiter.isAllowed(rateLimitKey)) {
      const remaining = uploadRateLimiter.getRemainingRequests(rateLimitKey);
      const resetTime = uploadRateLimiter.getResetTime(rateLimitKey);
      const retryAfter = Math.ceil((resetTime - Date.now()) / 1000);

      logUnauthorizedAccess(
        userId,
        request.empresaId,
        'file_upload_rate_limit',
        'Rate limit exceeded',
        request
      );

      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message: 'Too many file upload attempts. Please try again later.',
          retryAfter,
          remaining,
        },
        {
          status: 429,
          headers: {
            'Retry-After': retryAfter.toString(),
            'X-RateLimit-Remaining': remaining.toString(),
            'X-RateLimit-Reset': new Date(resetTime).toISOString(),
          },
        }
      );
    }

    // Add rate limit headers to successful responses
    const response = await handler(request, context);
    const remaining = uploadRateLimiter.getRemainingRequests(rateLimitKey);
    const resetTime = uploadRateLimiter.getResetTime(rateLimitKey);

    response.headers.set('X-RateLimit-Remaining', remaining.toString());
    response.headers.set('X-RateLimit-Reset', new Date(resetTime).toISOString());

    return response;
  };
}

/**
 * Combined middleware for brand customization access control and rate limiting
 */
export function requireBrandCustomizationAccess<Ctx>(
  handler: (request: BrandCustomizationRequest, context: Ctx) => Promise<NextResponse>,
) {
  return requireEmpresaAdmin(
    withUploadRateLimit(handler)
  );
}

/**
 * Utility function to check if a user has brand customization access without middleware
 */
export async function checkBrandCustomizationAccess(
  userId: string,
  empresaId: string
): Promise<{ hasAccess: boolean; isAdmin: boolean; error?: string }> {
  const client = getDatabaseClient();
  
  try {
    // Get user auth info
    const { data: { user }, error: authError } = await client.auth.getUser();
    
    if (authError || !user || user.id !== userId) {
      return { hasAccess: false, isAdmin: false, error: 'Invalid user authentication' };
    }

    const isSuperAdmin = user.user_metadata?.role === 'superadmin' || user.user_metadata?.is_superadmin === true;
    
    // Superadmins have access to all empresas
    if (isSuperAdmin) {
      return { hasAccess: true, isAdmin: true };
    }

    // Check empresa access and admin privileges
    const { isAdmin, error } = await verifyEmpresaAdminAccess(userId, empresaId);
    
    return {
      hasAccess: isAdmin,
      isAdmin,
      error: isAdmin ? undefined : error,
    };
  } catch (err) {
    console.error('[Brand Customization] Error checking access:', err);
    return { hasAccess: false, isAdmin: false, error: 'Unexpected error checking access' };
  }
}