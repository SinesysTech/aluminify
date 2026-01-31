import { SupabaseClient } from '@supabase/supabase-js';
import type {
  TenantBranding,
  TenantLogo,
  ColorPalette,
  FontScheme,
  CustomThemePreset,
  CompleteBrandingConfig,
  TenantBrandingInsert,
  TenantBrandingUpdate,
  LogoType,
} from '@/app/[tenant]/(modules)/settings/personalizacao/services/brand-customization.types';

export interface BrandCustomizationRepository {
  // Tenant Branding CRUD
  findTenantBranding(empresaId: string): Promise<TenantBranding | null>;
  createTenantBranding(data: TenantBrandingInsert): Promise<TenantBranding>;
  updateTenantBranding(id: string, data: TenantBrandingUpdate): Promise<TenantBranding>;
  deleteTenantBranding(id: string): Promise<void>;

  // Complete branding config
  getCompleteBrandingConfig(empresaId: string): Promise<CompleteBrandingConfig | null>;

  // Logos
  findTenantLogos(tenantBrandingId: string): Promise<TenantLogo[]>;
  findTenantLogo(tenantBrandingId: string, logoType: LogoType): Promise<TenantLogo | null>;

  // Color Palettes
  findColorPalette(id: string): Promise<ColorPalette | null>;
  findColorPalettesByEmpresa(empresaId: string): Promise<ColorPalette[]>;

  // Font Schemes
  findFontScheme(id: string): Promise<FontScheme | null>;
  findFontSchemesByEmpresa(empresaId: string): Promise<FontScheme[]>;

  // Custom Theme Presets
  findCustomThemePresets(empresaId: string): Promise<CustomThemePreset[]>;
}

export class BrandCustomizationRepositoryImpl implements BrandCustomizationRepository {
  constructor(private readonly client: SupabaseClient) {}

  async findTenantBranding(empresaId: string): Promise<TenantBranding | null> {
    const { data, error } = await this.client
      .from('tenant_branding')
      .select('*')
      .eq('empresa_id', empresaId)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to find tenant branding: ${error.message}`);
    }

    if (!data) return null;

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

  async createTenantBranding(data: TenantBrandingInsert): Promise<TenantBranding> {
    const { data: result, error } = await this.client
      .from('tenant_branding')
      .insert({
        empresa_id: data.empresaId,
        color_palette_id: data.colorPaletteId,
        font_scheme_id: data.fontSchemeId,
        custom_css: data.customCss,
        created_by: data.createdBy,
        updated_by: data.updatedBy,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create tenant branding: ${error.message}`);
    }

    return {
      id: result.id,
      empresaId: result.empresa_id,
      colorPaletteId: result.color_palette_id,
      fontSchemeId: result.font_scheme_id,
      customCss: result.custom_css,
      createdAt: new Date(result.created_at),
      updatedAt: new Date(result.updated_at),
      createdBy: result.created_by,
      updatedBy: result.updated_by,
    };
  }

  async updateTenantBranding(id: string, data: TenantBrandingUpdate): Promise<TenantBranding> {
    const updateData: Partial<{
      color_palette_id: string | null;
      font_scheme_id: string | null;
      custom_css: string | null;
      updated_by: string;
      updated_at: string;
    }> = {
      updated_at: new Date().toISOString(),
    };

    if (data.colorPaletteId !== undefined) updateData.color_palette_id = data.colorPaletteId;
    if (data.fontSchemeId !== undefined) updateData.font_scheme_id = data.fontSchemeId;
    if (data.customCss !== undefined) updateData.custom_css = data.customCss;
    if (data.updatedBy !== undefined) updateData.updated_by = data.updatedBy;

    const { data: result, error } = await this.client
      .from('tenant_branding')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update tenant branding: ${error.message}`);
    }

    return {
      id: result.id,
      empresaId: result.empresa_id,
      colorPaletteId: result.color_palette_id,
      fontSchemeId: result.font_scheme_id,
      customCss: result.custom_css,
      createdAt: new Date(result.created_at),
      updatedAt: new Date(result.updated_at),
      createdBy: result.created_by,
      updatedBy: result.updated_by,
    };
  }

  async deleteTenantBranding(id: string): Promise<void> {
    const { error } = await this.client
      .from('tenant_branding')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete tenant branding: ${error.message}`);
    }
  }

  async getCompleteBrandingConfig(empresaId: string): Promise<CompleteBrandingConfig | null> {
    // Get tenant branding
    const tenantBranding = await this.findTenantBranding(empresaId);
    if (!tenantBranding) return null;

    // Get logos
    const logos = await this.findTenantLogos(tenantBranding.id);
    const logosMap: Record<LogoType, TenantLogo | null> = {
      login: null,
      sidebar: null,
      favicon: null,
    };
    logos.forEach(logo => {
      logosMap[logo.logoType] = logo;
    });

    // Get color palette
    let colorPalette: ColorPalette | undefined;
    if (tenantBranding.colorPaletteId) {
      colorPalette = await this.findColorPalette(tenantBranding.colorPaletteId) || undefined;
    }

    // Get font scheme
    let fontScheme: FontScheme | undefined;
    if (tenantBranding.fontSchemeId) {
      fontScheme = await this.findFontScheme(tenantBranding.fontSchemeId) || undefined;
    }

    // Get custom theme presets
    const customThemePresets = await this.findCustomThemePresets(empresaId);

    return {
      tenantBranding,
      logos: logosMap,
      colorPalette,
      fontScheme,
      customThemePresets,
    };
  }

  async findTenantLogos(tenantBrandingId: string): Promise<TenantLogo[]> {
    const { data, error } = await this.client
      .from('tenant_logos')
      .select('*')
      .eq('tenant_branding_id', tenantBrandingId);

    if (error) {
      throw new Error(`Failed to find tenant logos: ${error.message}`);
    }

    return data.map(logo => ({
      id: logo.id,
      tenantBrandingId: logo.tenant_branding_id,
      logoType: logo.logo_type as LogoType,
      logoUrl: logo.logo_url,
      fileName: logo.file_name,
      fileSize: logo.file_size,
      mimeType: logo.mime_type,
      createdAt: new Date(logo.created_at),
      updatedAt: new Date(logo.updated_at),
    }));
  }

  async findTenantLogo(tenantBrandingId: string, logoType: LogoType): Promise<TenantLogo | null> {
    const { data, error } = await this.client
      .from('tenant_logos')
      .select('*')
      .eq('tenant_branding_id', tenantBrandingId)
      .eq('logo_type', logoType)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to find tenant logo: ${error.message}`);
    }

    if (!data) return null;

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

  async findColorPalette(id: string): Promise<ColorPalette | null> {
    const { data, error } = await this.client
      .from('color_palettes')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to find color palette: ${error.message}`);
    }

    if (!data) return null;

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

  async findColorPalettesByEmpresa(empresaId: string): Promise<ColorPalette[]> {
    const { data, error } = await this.client
      .from('color_palettes')
      .select('*')
      .eq('empresa_id', empresaId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to find color palettes: ${error.message}`);
    }

    return data.map(palette => ({
      id: palette.id,
      name: palette.name,
      empresaId: palette.empresa_id,
      primaryColor: palette.primary_color,
      primaryForeground: palette.primary_foreground,
      secondaryColor: palette.secondary_color,
      secondaryForeground: palette.secondary_foreground,
      accentColor: palette.accent_color,
      accentForeground: palette.accent_foreground,
      mutedColor: palette.muted_color,
      mutedForeground: palette.muted_foreground,
      backgroundColor: palette.background_color,
      foregroundColor: palette.foreground_color,
      cardColor: palette.card_color,
      cardForeground: palette.card_foreground,
      destructiveColor: palette.destructive_color,
      destructiveForeground: palette.destructive_foreground,
      sidebarBackground: palette.sidebar_background,
      sidebarForeground: palette.sidebar_foreground,
      sidebarPrimary: palette.sidebar_primary,
      sidebarPrimaryForeground: palette.sidebar_primary_foreground,
      isCustom: palette.is_custom,
      createdAt: new Date(palette.created_at),
      updatedAt: new Date(palette.updated_at),
      createdBy: palette.created_by,
      updatedBy: palette.updated_by,
    }));
  }

  async findFontScheme(id: string): Promise<FontScheme | null> {
    const { data, error } = await this.client
      .from('font_schemes')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to find font scheme: ${error.message}`);
    }

    if (!data) return null;

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

  async findFontSchemesByEmpresa(empresaId: string): Promise<FontScheme[]> {
    const { data, error } = await this.client
      .from('font_schemes')
      .select('*')
      .eq('empresa_id', empresaId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to find font schemes: ${error.message}`);
    }

    return data.map(scheme => ({
      id: scheme.id,
      name: scheme.name,
      empresaId: scheme.empresa_id,
      fontSans: scheme.font_sans,
      fontMono: scheme.font_mono,
      fontSizes: scheme.font_sizes,
      fontWeights: scheme.font_weights,
      googleFonts: scheme.google_fonts || [],
      isCustom: scheme.is_custom,
      createdAt: new Date(scheme.created_at),
      updatedAt: new Date(scheme.updated_at),
      createdBy: scheme.created_by,
      updatedBy: scheme.updated_by,
    }));
  }

  async findCustomThemePresets(empresaId: string): Promise<CustomThemePreset[]> {
    const { data, error } = await this.client
      .from('custom_theme_presets')
      .select('*')
      .eq('empresa_id', empresaId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to find custom theme presets: ${error.message}`);
    }

    return data.map(preset => ({
      id: preset.id,
      name: preset.name,
      empresaId: preset.empresa_id,
      colorPaletteId: preset.color_palette_id,
      fontSchemeId: preset.font_scheme_id,
      radius: preset.radius,
      scale: preset.scale,
      mode: preset.mode,
      previewColors: preset.preview_colors,
      isDefault: preset.is_default,
      createdAt: new Date(preset.created_at),
      updatedAt: new Date(preset.updated_at),
      createdBy: preset.created_by,
      updatedBy: preset.updated_by,
    }));
  }
}