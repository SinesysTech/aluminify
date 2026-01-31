import { Database } from "@/app/shared/core/database.types";
import {
  ColorPalette,
  CustomThemePreset,
  FontScheme,
  LogoType,
  TenantBranding,
  TenantLogo,
  ThemeMode,
} from "./brand-customization.types";

type TenantBrandingRow = Database["public"]["Tables"]["tenant_branding"]["Row"];
type TenantLogoRow = Database["public"]["Tables"]["tenant_logos"]["Row"];
type ColorPaletteRow = Database["public"]["Tables"]["color_palettes"]["Row"];
type FontSchemeRow = Database["public"]["Tables"]["font_schemes"]["Row"];
type CustomThemePresetRow =
  Database["public"]["Tables"]["custom_theme_presets"]["Row"];

/** Converts null to undefined for optional fields */
function nullToUndefined<T>(value: T | null): T | undefined {
  return value === null ? undefined : value;
}

export class BrandingTransformers {
  static toTenantBranding(data: TenantBrandingRow): TenantBranding {
    return {
      id: data.id,
      empresaId: data.empresa_id,
      colorPaletteId: data.color_palette_id,
      fontSchemeId: data.font_scheme_id,
      customCss: data.custom_css,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      createdBy: nullToUndefined(data.created_by),
      updatedBy: nullToUndefined(data.updated_by),
    };
  }

  static toTenantLogo(data: TenantLogoRow): TenantLogo {
    return {
      id: data.id,
      tenantBrandingId: data.tenant_branding_id,
      logoType: data.logo_type as LogoType,
      logoUrl: data.logo_url,
      fileName: nullToUndefined(data.file_name),
      fileSize: nullToUndefined(data.file_size),
      mimeType: nullToUndefined(data.mime_type),
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }

  static toColorPalette(data: ColorPaletteRow): ColorPalette {
    return {
      id: data.id,
      name: data.name,
      empresaId: data.empresa_id,
      primaryColor: data.primary_color,
      primaryForeground: data.primary_foreground,
      secondaryColor: data.secondary_color,
      secondaryForeground: data.secondary_foreground,
      accentColor: data.accent_color,
      accentForeground: data.accent_foreground,
      mutedColor: data.muted_color,
      mutedForeground: data.muted_foreground,
      backgroundColor: data.background_color,
      foregroundColor: data.foreground_color,
      cardColor: data.card_color,
      cardForeground: data.card_foreground,
      destructiveColor: data.destructive_color,
      destructiveForeground: data.destructive_foreground,
      sidebarBackground: data.sidebar_background,
      sidebarForeground: data.sidebar_foreground,
      sidebarPrimary: data.sidebar_primary,
      sidebarPrimaryForeground: data.sidebar_primary_foreground,
      isCustom: data.is_custom,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      createdBy: nullToUndefined(data.created_by),
      updatedBy: nullToUndefined(data.updated_by),
    };
  }

  static toFontScheme(data: FontSchemeRow): FontScheme {
    return {
      id: data.id,
      name: data.name,
      empresaId: data.empresa_id,
      fontSans: data.font_sans as string[],
      fontMono: data.font_mono as string[],
      fontSizes: data.font_sizes as FontScheme["fontSizes"],
      fontWeights: data.font_weights as FontScheme["fontWeights"],
      googleFonts: (data.google_fonts as string[]) ?? [],
      isCustom: data.is_custom,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      createdBy: nullToUndefined(data.created_by),
      updatedBy: nullToUndefined(data.updated_by),
    };
  }

  static toCustomThemePreset(data: CustomThemePresetRow): CustomThemePreset {
    return {
      id: data.id,
      name: data.name,
      empresaId: data.empresa_id,
      colorPaletteId: nullToUndefined(data.color_palette_id),
      fontSchemeId: nullToUndefined(data.font_scheme_id),
      radius: data.radius ?? 0,
      scale: data.scale ?? 1,
      mode: (data.mode as ThemeMode) ?? "light",
      previewColors: (data.preview_colors as string[]) ?? [],
      isDefault: data.is_default ?? false,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      createdBy: nullToUndefined(data.created_by),
      updatedBy: nullToUndefined(data.updated_by),
    };
  }
}
