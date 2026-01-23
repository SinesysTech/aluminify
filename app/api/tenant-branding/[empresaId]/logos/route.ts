import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { LogoManagerImpl } from '@/backend/services/brand-customization';
import { requireBrandCustomizationAccess, BrandCustomizationRequest } from '@/backend/middleware/brand-customization-access';
import { getPublicSupabaseConfig } from '@/lib/supabase-public-env';
import type { LogoType } from '@/types/brand-customization';

interface RouteContext {
  params: Promise<{ empresaId: string }>;
}

/**
 * POST /api/tenant-branding/[empresaId]/logos - Upload logo
 * Validates Requirements 1.3, 1.4, 7.2, 7.3: File validation and secure storage
 */
async function postHandler(
  request: BrandCustomizationRequest,
  { params }: { params: Promise<{ empresaId: string }> }
) {
  try {
    const { empresaId } = await params;

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const logoType = formData.get('logoType') as LogoType;

    // Validate required fields
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!logoType || !['login', 'sidebar', 'favicon'].includes(logoType)) {
      return NextResponse.json(
        { error: 'Invalid or missing logoType. Must be one of: login, sidebar, favicon' },
        { status: 400 }
      );
    }

    // Validate file is a File-like object
    // In Next.js app router, the File object may not pass instanceof checks
    const isValidFile = file &&
      typeof file === 'object' &&
      'name' in file &&
      'size' in file &&
      'type' in file &&
      typeof (file as File).arrayBuffer === 'function';

    if (!isValidFile) {
      return NextResponse.json(
        { error: 'Invalid file format' },
        { status: 400 }
      );
    }

    // Create Supabase client with user authentication
    const authHeader = request.headers.get('authorization');
    const { url, anonKey } = getPublicSupabaseConfig();
    const supabase = createClient(url, anonKey, {
      global: {
        headers: authHeader ? { Authorization: authHeader } : {},
      },
      auth: {
        persistSession: false,
      },
    });

    // Initialize logo manager and upload
    const logoManager = new LogoManagerImpl(supabase);
    const result = await logoManager.uploadLogo(empresaId, file, logoType);

    if (!result.success) {
      return NextResponse.json(
        {
          error: result.error,
          validationErrors: result.validationErrors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      logoUrl: result.logoUrl,
      logoType,
      message: `${logoType} logo uploaded successfully`,
    }, { status: 201 });
  } catch (error) {
    console.error('Error uploading logo:', error);
    return NextResponse.json(
      { error: 'Failed to upload logo' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/tenant-branding/[empresaId]/logos - Get all logos for tenant
 */
async function getHandler(
  request: BrandCustomizationRequest,
  { params }: { params: Promise<{ empresaId: string }> }
) {
  try {
    const { empresaId } = await params;

    // Create Supabase client with user authentication
    const authHeader = request.headers.get('authorization');
    const { url, anonKey } = getPublicSupabaseConfig();
    const supabase = createClient(url, anonKey, {
      global: {
        headers: authHeader ? { Authorization: authHeader } : {},
      },
      auth: {
        persistSession: false,
      },
    });

    // Initialize logo manager
    const logoManager = new LogoManagerImpl(supabase);

    // Get all logos
    const logos = await logoManager.getAllLogos(empresaId);

    return NextResponse.json({
      success: true,
      data: logos,
    });
  } catch (error) {
    console.error('Error fetching logos:', error);
    return NextResponse.json(
      { error: 'Failed to fetch logos' },
      { status: 500 }
    );
  }
}

// Apply access control middleware and export handlers
export const POST = requireBrandCustomizationAccess(
  async (request: BrandCustomizationRequest, context: RouteContext) => 
    postHandler(request, context)
);

export const GET = requireBrandCustomizationAccess(
  async (request: BrandCustomizationRequest, context: RouteContext) => 
    getHandler(request, context)
);