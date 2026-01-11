import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { FontSchemeManagerImpl } from '@/backend/services/brand-customization';
import { requireBrandCustomizationAccess, BrandCustomizationRequest } from '@/backend/middleware/brand-customization-access';
import { getPublicSupabaseConfig } from '@/lib/supabase-public-env';

interface RouteContext {
  params: Promise<{ empresaId: string }>;
}

/**
 * POST /api/tenant-branding/[empresaId]/font-schemes/google-fonts - Validate Google Font
 * Validates Requirements 3.2: Support Google Fonts integration
 */
async function postHandler(
  request: BrandCustomizationRequest,
  { params: _params }: { params: Promise<{ empresaId: string }> }
) {
  try {
    const body = await request.json();

    // Validate request body
    if (!body.fontFamily || typeof body.fontFamily !== 'string') {
      return NextResponse.json(
        { error: 'fontFamily is required' },
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

    // Initialize font scheme manager
    const fontSchemeManager = new FontSchemeManagerImpl(supabase);

    // Validate Google Font
    const isValid = await fontSchemeManager.validateGoogleFont(body.fontFamily);

    return NextResponse.json({
      success: true,
      data: {
        fontFamily: body.fontFamily,
        isValid,
        googleFontsUrl: isValid 
          ? `https://fonts.googleapis.com/css2?family=${encodeURIComponent(body.fontFamily)}:wght@300;400;500;600;700&display=swap`
          : null,
      },
    });
  } catch (error) {
    console.error('Error validating Google Font:', error);
    
    // Handle validation errors specifically
    if (error instanceof Error && error.name === 'FontLoadingError') {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to validate Google Font' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/tenant-branding/[empresaId]/font-schemes/google-fonts - Get popular Google Fonts list
 * Provides a curated list of popular Google Fonts for the UI
 */
async function getHandler(
  _request: BrandCustomizationRequest,
  { params: _params }: { params: Promise<{ empresaId: string }> }
) {
  try {
    // Return a curated list of popular Google Fonts
    // In a production environment, this could be fetched from Google Fonts API
    const popularGoogleFonts = [
      {
        family: 'Inter',
        category: 'sans-serif',
        variants: ['300', '400', '500', '600', '700'],
        description: 'A modern, highly legible sans-serif font designed for user interfaces',
      },
      {
        family: 'Roboto',
        category: 'sans-serif',
        variants: ['300', '400', '500', '700'],
        description: 'Google\'s signature family of fonts with a mechanical skeleton',
      },
      {
        family: 'Open Sans',
        category: 'sans-serif',
        variants: ['300', '400', '600', '700'],
        description: 'Humanist sans serif typeface designed by Steve Matteson',
      },
      {
        family: 'Lato',
        category: 'sans-serif',
        variants: ['300', '400', '700'],
        description: 'Semi-rounded details of the letters give Lato a feeling of warmth',
      },
      {
        family: 'Montserrat',
        category: 'sans-serif',
        variants: ['300', '400', '500', '600', '700'],
        description: 'Inspired by the old posters and signs in the traditional Montserrat neighborhood',
      },
      {
        family: 'Poppins',
        category: 'sans-serif',
        variants: ['300', '400', '500', '600', '700'],
        description: 'Geometric sans serif typeface with rounded edges',
      },
      {
        family: 'Source Sans Pro',
        category: 'sans-serif',
        variants: ['300', '400', '600', '700'],
        description: 'Adobe\'s first open source typeface family',
      },
      {
        family: 'Nunito',
        category: 'sans-serif',
        variants: ['300', '400', '600', '700'],
        description: 'Well balanced sans serif with rounded terminals',
      },
      {
        family: 'Playfair Display',
        category: 'serif',
        variants: ['400', '500', '600', '700'],
        description: 'Transitional design with high contrast and distinctive details',
      },
      {
        family: 'Merriweather',
        category: 'serif',
        variants: ['300', '400', '700'],
        description: 'Designed to be a text face that is pleasant to read on screens',
      },
      {
        family: 'Fira Code',
        category: 'monospace',
        variants: ['300', '400', '500', '600', '700'],
        description: 'Monospaced font with programming ligatures',
      },
      {
        family: 'JetBrains Mono',
        category: 'monospace',
        variants: ['300', '400', '500', '600', '700'],
        description: 'Typeface for developers with increased height for better readability',
      },
      {
        family: 'Source Code Pro',
        category: 'monospace',
        variants: ['300', '400', '500', '600', '700'],
        description: 'Monospaced font family for user interface and coding environments',
      },
    ];

    return NextResponse.json({
      success: true,
      data: popularGoogleFonts,
    });
  } catch (error) {
    console.error('Error fetching Google Fonts list:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Google Fonts list' },
      { status: 500 }
    );
  }
}

// Apply access control middleware and export handlers
export const POST = requireBrandCustomizationAccess(
  async (request: BrandCustomizationRequest, context: RouteContext) => postHandler(request, context)
);

export const GET = requireBrandCustomizationAccess(
  async (request: BrandCustomizationRequest, context: RouteContext) => getHandler(request, context)
);