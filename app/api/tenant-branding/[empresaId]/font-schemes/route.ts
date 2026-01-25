import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { FontSchemeManagerImpl } from "@/brand-customization/services";
import {
  requireBrandCustomizationAccess,
  BrandCustomizationRequest,
} from "@/backend/middleware/brand-customization-access";
import { getPublicSupabaseConfig } from "@/app/shared/core/supabase-public-env";
import type { CreateFontSchemeRequest } from "@/types/brand-customization";

interface RouteContext {
  params: Promise<{ empresaId: string }>;
}

/**
 * GET /api/tenant-branding/[empresaId]/font-schemes - Get all font schemes for empresa
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

    // Initialize font scheme manager
    const fontSchemeManager = new FontSchemeManagerImpl(supabase);

    // Get all font schemes for the empresa
    const schemes = await fontSchemeManager.getFontSchemesByEmpresa(empresaId);

    return NextResponse.json({
      success: true,
      data: schemes,
    });
  } catch (error) {
    console.error("Error fetching font schemes:", error);
    return NextResponse.json(
      { error: "Failed to fetch font schemes" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/tenant-branding/[empresaId]/font-schemes - Create new font scheme
 * Validates Requirements 3.2, 3.3: Support Google Fonts and proper fallbacks
 */
async function postHandler(
  request: BrandCustomizationRequest,
  { params }: { params: Promise<{ empresaId: string }> },
) {
  try {
    const { empresaId } = await params;
    const body = (await request.json()) as CreateFontSchemeRequest;

    // Validate required fields
    if (!body.name || typeof body.name !== "string") {
      return NextResponse.json(
        { error: "Font scheme name is required" },
        { status: 400 },
      );
    }

    if (!Array.isArray(body.fontSans) || body.fontSans.length === 0) {
      return NextResponse.json(
        { error: "fontSans array is required and cannot be empty" },
        { status: 400 },
      );
    }

    if (!Array.isArray(body.fontMono) || body.fontMono.length === 0) {
      return NextResponse.json(
        { error: "fontMono array is required and cannot be empty" },
        { status: 400 },
      );
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

    // Initialize font scheme manager
    const fontSchemeManager = new FontSchemeManagerImpl(supabase);

    // Create font scheme
    const schemeId = await fontSchemeManager.createFontScheme(empresaId, body);

    // Get the created scheme
    const createdScheme = await fontSchemeManager.getFontScheme(schemeId);

    return NextResponse.json(
      {
        success: true,
        data: createdScheme,
        message: "Font scheme created successfully",
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating font scheme:", error);

    // Handle validation errors specifically
    if (error instanceof Error && error.name === "FontLoadingError") {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Failed to create font scheme" },
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
