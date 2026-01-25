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
  params: Promise<{ empresaId: string }>;
}

/**
 * GET /api/tenant-branding/[empresaId]/color-palettes - Get all color palettes for empresa
 */
async function getHandler(
  request: BrandCustomizationRequest,
  { params }: { params: Promise<{ empresaId: string }> },
) {
  try {
    const { empresaId } = await params;

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

    // Get all color palettes for the empresa
    const palettes = await colorPaletteManager.getPalettesByEmpresa(empresaId);

    return NextResponse.json({
      success: true,
      data: palettes,
    });
  } catch (error) {
    console.error("Error fetching color palettes:", error);
    return NextResponse.json(
      { error: "Failed to fetch color palettes" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/tenant-branding/[empresaId]/color-palettes - Create new color palette
 * Validates Requirements 2.2: Allow editing of primary, secondary, accent, and background colors
 */
async function postHandler(
  request: BrandCustomizationRequest,
  { params }: { params: Promise<{ empresaId: string }> },
) {
  try {
    const { empresaId } = await params;
    const body = (await request.json()) as CreateColorPaletteRequest;

    // Validate required fields
    if (!body.name || typeof body.name !== "string") {
      return NextResponse.json(
        { error: "Palette name is required" },
        { status: 400 },
      );
    }

    const requiredColors = [
      "primaryColor",
      "primaryForeground",
      "secondaryColor",
      "secondaryForeground",
      "accentColor",
      "accentForeground",
      "mutedColor",
      "mutedForeground",
      "backgroundColor",
      "foregroundColor",
      "cardColor",
      "cardForeground",
      "destructiveColor",
      "destructiveForeground",
      "sidebarBackground",
      "sidebarForeground",
      "sidebarPrimary",
      "sidebarPrimaryForeground",
    ];

    for (const colorField of requiredColors) {
      if (!body[colorField as keyof CreateColorPaletteRequest]) {
        return NextResponse.json(
          { error: `${colorField} is required` },
          { status: 400 },
        );
      }
    }

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

    // Create color palette
    const paletteId = await colorPaletteManager.createPalette(empresaId, body);

    // Get the created palette
    const createdPalette = await colorPaletteManager.getPalette(paletteId);

    return NextResponse.json(
      {
        success: true,
        data: createdPalette,
        message: "Color palette created successfully",
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating color palette:", error);

    // Handle validation errors specifically
    if (error instanceof Error && error.name === "ColorValidationError") {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Failed to create color palette" },
      { status: 500 },
    );
  }
}

// Apply access control middleware and export handlers
export const GET = requireBrandCustomizationAccess(
  async (request: BrandCustomizationRequest, context: RouteContext) =>
    getHandler(request, context),
);

export const POST = requireBrandCustomizationAccess(
  async (request: BrandCustomizationRequest, context: RouteContext) =>
    postHandler(request, context),
);
