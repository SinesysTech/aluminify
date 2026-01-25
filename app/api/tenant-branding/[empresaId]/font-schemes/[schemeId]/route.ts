import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { FontSchemeManagerImpl } from "@/brand-customization/services";
import {
  requireBrandCustomizationAccess,
  BrandCustomizationRequest,
} from "@/app/shared/core/middleware/brand-customization-access";
import { getPublicSupabaseConfig } from "@/app/shared/core/supabase-public-env";
import type { CreateFontSchemeRequest } from "@/types/brand-customization";

interface RouteContext {
  params: Promise<{ empresaId: string; schemeId: string }>;
}

/**
 * GET /api/tenant-branding/[empresaId]/font-schemes/[schemeId] - Get specific font scheme
 */
async function getHandler(
  request: BrandCustomizationRequest,
  { params }: { params: Promise<{ empresaId: string; schemeId: string }> },
) {
  try {
    const { empresaId, schemeId } = await params;

    // Create Supabase client with user authentication
    const authHeader = request.headers.get("authorization");
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

    // Get the font scheme
    const scheme = await fontSchemeManager.getFontScheme(schemeId);

    if (!scheme) {
      return NextResponse.json(
        { error: "Font scheme not found" },
        { status: 404 },
      );
    }

    // Verify the scheme belongs to the specified empresa
    if (scheme.empresaId !== empresaId) {
      return NextResponse.json(
        { error: "Font scheme does not belong to the specified empresa" },
        { status: 403 },
      );
    }

    return NextResponse.json({
      success: true,
      data: scheme,
    });
  } catch (error) {
    console.error("Error fetching font scheme:", error);
    return NextResponse.json(
      { error: "Failed to fetch font scheme" },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/tenant-branding/[empresaId]/font-schemes/[schemeId] - Update font scheme
 * Validates Requirements 3.2, 3.3: Update font schemes with Google Fonts and fallbacks
 */
async function putHandler(
  request: BrandCustomizationRequest,
  { params }: { params: Promise<{ empresaId: string; schemeId: string }> },
) {
  try {
    const { empresaId, schemeId } = await params;
    const body = (await request.json()) as Partial<CreateFontSchemeRequest>;

    // Create Supabase client with user authentication
    const authHeader = request.headers.get("authorization");
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

    // Verify the scheme exists and belongs to the empresa
    const existingScheme = await fontSchemeManager.getFontScheme(schemeId);
    if (!existingScheme) {
      return NextResponse.json(
        { error: "Font scheme not found" },
        { status: 404 },
      );
    }

    if (existingScheme.empresaId !== empresaId) {
      return NextResponse.json(
        { error: "Font scheme does not belong to the specified empresa" },
        { status: 403 },
      );
    }

    // Update the font scheme
    await fontSchemeManager.updateFontScheme(schemeId, body);

    // Get the updated scheme
    const updatedScheme = await fontSchemeManager.getFontScheme(schemeId);

    return NextResponse.json({
      success: true,
      data: updatedScheme,
      message: "Font scheme updated successfully",
    });
  } catch (error) {
    console.error("Error updating font scheme:", error);

    // Handle validation errors specifically
    if (error instanceof Error && error.name === "FontLoadingError") {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Failed to update font scheme" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/tenant-branding/[empresaId]/font-schemes/[schemeId] - Delete font scheme
 */
async function deleteHandler(
  request: BrandCustomizationRequest,
  { params }: { params: Promise<{ empresaId: string; schemeId: string }> },
) {
  try {
    const { empresaId, schemeId } = await params;

    // Create Supabase client with user authentication
    const authHeader = request.headers.get("authorization");
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

    // Verify the scheme exists and belongs to the empresa
    const existingScheme = await fontSchemeManager.getFontScheme(schemeId);
    if (!existingScheme) {
      return NextResponse.json(
        { error: "Font scheme not found" },
        { status: 404 },
      );
    }

    if (existingScheme.empresaId !== empresaId) {
      return NextResponse.json(
        { error: "Font scheme does not belong to the specified empresa" },
        { status: 403 },
      );
    }

    // Delete the font scheme
    await fontSchemeManager.deleteFontScheme(schemeId);

    return NextResponse.json({
      success: true,
      message: "Font scheme deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting font scheme:", error);

    // Handle validation errors specifically
    if (error instanceof Error && error.name === "FontLoadingError") {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Failed to delete font scheme" },
      { status: 500 },
    );
  }
}

// Apply access control middleware and export handlers
export const GET = requireBrandCustomizationAccess(
  async (request: BrandCustomizationRequest, context: RouteContext) =>
    getHandler(request, context),
);

export const PUT = requireBrandCustomizationAccess(
  async (request: BrandCustomizationRequest, context: RouteContext) =>
    putHandler(request, context),
);

export const DELETE = requireBrandCustomizationAccess(
  async (request: BrandCustomizationRequest, context: RouteContext) =>
    deleteHandler(request, context),
);
