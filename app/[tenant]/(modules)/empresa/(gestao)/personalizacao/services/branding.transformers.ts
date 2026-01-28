import {
  ColorPalette,
  CustomThemePreset,
  FontScheme,
  LogoType,
  TenantBranding,
  TenantLogo,
} from "./brand-customization.types";

export class BrandingTransformers {
  static toTenantBranding(data: any): TenantBranding {
    return {
      id: data.id,
      empresaId: data.empresa_id,
      colorPaletteId: data.color_palette_id,
      fontSchemeId: data.font_scheme_id,
      customCss: data.custom_css,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      createdBy: data.created_by,
      updatedBy: data.updated_by,
    };
  }

  static toTenantLogo(data: any): TenantLogo {
    return {
      id: data.id,
      tenantBrandingId: data.tenant_branding_id,
      logoType: data.logo_type as LogoType,
      logoUrl: data.logo_url,
      fileName: data.file_name,
      fileSize: data.file_size,
      mimeType: data.mime_type,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }

  static toColorPalette(data: any): ColorPalette {
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
      createdBy: data.created_by,
      updatedBy: data.updated_by,
    };
  }

  static toFontScheme(data: any): FontScheme {
    return {
      id: data.id,
      name: data.name,
      empresaId: data.empresa_id,
      fontSans: data.font_sans,
      fontMono: data.font_mono,
      fontSizes: data.font_sizes,
      fontWeights: data.font_weights,
      googleFonts: data.google_fonts || [],
      isCustom: data.is_custom,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      createdBy: data.created_by,
      updatedBy: data.updated_by,
    };
  }

  static toCustomThemePreset(data: any): CustomThemePreset {
    return {
      id: data.id,
      name: data.name,
      empresaId: data.empresa_id,
      colorPaletteId: data.color_palette_id,
      fontSchemeId: data.font_scheme_id,
      radius: data.radius,
      scale: data.scale,
      mode: data.mode,
      previewColors: data.preview_colors,
      isDefault: data.is_default,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      createdBy: data.created_by,
      updatedBy: data.updated_by,
    };
  }
}
