import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { ColorPaletteManagerImpl } from "@/brand-customization/services";
import {
  requireBrandCustomizationAccess,
  BrandCustomizationRequest,
} from "@/app/shared/core/middleware/brand-customization-access";
import { getPublicSupabaseConfig } from "@/app/shared/core/supabase-public-env";
import type { CreateColorPaletteRequest } from "@/types/brand-customization";

interface RouteContext {
  params: Promise<{ empresaId: string; paletteId: string }>;
}

/**
 * GET /api/tenant-branding/[empresaId]/color-palettes/[paletteId] - Get specific color palette
 */
async function getHandler(
  request: BrandCustomizationRequest,
  { params }: { params: Promise<{ empresaId: string; paletteId: string }> },
) {
  try {
    const { empresaId, paletteId } = await params;

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

    // Initialize color palette manager
    const colorPaletteManager = new ColorPaletteManagerImpl(supabase);

    // Get the color palette
    const palette = await colorPaletteManager.getPalette(paletteId);

    if (!palette) {
      return NextResponse.json(
        { error: "Color palette not found" },
        { status: 404 },
      );
    }

    // Verify the palette belongs to the specified empresa
    if (palette.empresaId !== empresaId) {
      return NextResponse.json(
        { error: "Color palette does not belong to the specified empresa" },
        { status: 403 },
      );
    }

    return NextResponse.json({
      success: true,
      data: palette,
    });
  } catch (error) {
    console.error("Error fetching color palette:", error);
    return NextResponse.json(
      { error: "Failed to fetch color palette" },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/tenant-branding/[empresaId]/color-palettes/[paletteId] - Update color palette
 * Validates Requirements 2.2: Allow editing of color palette
 */
async function putHandler(
  request: BrandCustomizationRequest,
  { params }: { params: Promise<{ empresaId: string; paletteId: string }> },
) {
  try {
    const { empresaId, paletteId } = await params;
    const body = (await request.json()) as Partial<CreateColorPaletteRequest>;

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

    // Initialize color palette manager
    const colorPaletteManager = new ColorPaletteManagerImpl(supabase);

    // Verify the palette exists and belongs to the empresa
    const existingPalette = await colorPaletteManager.getPalette(paletteId);
    if (!existingPalette) {
      return NextResponse.json(
        { error: "Color palette not found" },
        { status: 404 },
      );
    }

    if (existingPalette.empresaId !== empresaId) {
      return NextResponse.json(
        { error: "Color palette does not belong to the specified empresa" },
        { status: 403 },
      );
    }

    // Update the color palette
    await colorPaletteManager.updatePalette(paletteId, body);

    // Get the updated palette
    const updatedPalette = await colorPaletteManager.getPalette(paletteId);

    return NextResponse.json({
      success: true,
      data: updatedPalette,
      message: "Color palette updated successfully",
    });
  } catch (error) {
    console.error("Error updating color palette:", error);

    // Handle validation errors specifically
    if (error instanceof Error && error.name === "ColorValidationError") {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Failed to update color palette" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/tenant-branding/[empresaId]/color-palettes/[paletteId] - Delete color palette
 */
async function deleteHandler(
  request: BrandCustomizationRequest,
  { params }: { params: Promise<{ empresaId: string; paletteId: string }> },
) {
  try {
    const { empresaId, paletteId } = await params;

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

    // Initialize color palette manager
    const colorPaletteManager = new ColorPaletteManagerImpl(supabase);

    // Verify the palette exists and belongs to the empresa
    const existingPalette = await colorPaletteManager.getPalette(paletteId);
    if (!existingPalette) {
      return NextResponse.json(
        { error: "Color palette not found" },
        { status: 404 },
      );
    }

    if (existingPalette.empresaId !== empresaId) {
      return NextResponse.json(
        { error: "Color palette does not belong to the specified empresa" },
        { status: 403 },
      );
    }

    // Delete the color palette
    await colorPaletteManager.deletePalette(paletteId);

    return NextResponse.json({
      success: true,
      message: "Color palette deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting color palette:", error);

    // Handle validation errors specifically
    if (error instanceof Error && error.name === "ColorValidationError") {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Failed to delete color palette" },
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
