import type {
  TenantBranding,
  CompleteBrandingConfig,
  SaveTenantBrandingRequest,
  CSSCustomProperties,
} from '@/types/brand-customization';

/**
 * Options for loading tenant branding
 */
export interface LoadTenantBrandingOptions {
  empresaId: string;
  includeLogos?: boolean;
  includeColorPalette?: boolean;
  includeFontScheme?: boolean;
  includeCustomPresets?: boolean;
}

/**
 * Options for applying tenant branding
 */
export interface ApplyTenantBrandingOptions {
  branding: CompleteBrandingConfig;
  target?: 'document' | 'element';
  element?: HTMLElement;
  immediate?: boolean;
}

/**
 * Options for saving tenant branding
 */
export interface SaveTenantBrandingOptions {
  empresaId: string;
  branding: SaveTenantBrandingRequest;
  userId?: string;
}

/**
 * Options for resetting to default
 */
export interface ResetToDefaultOptions {
  empresaId: string;
  userId?: string;
  preserveLogos?: boolean;
}

/**
 * Result of branding operations
 */
export interface BrandingOperationResult {
  success: boolean;
  data?: CompleteBrandingConfig;
  error?: string;
  warnings?: string[];
}

/**
 * CSS application result
 */
export interface CSSApplicationResult {
  success: boolean;
  appliedProperties: Partial<CSSCustomProperties>;
  errors?: string[];
}

/**
 * Default branding configuration
 */
export interface DefaultBrandingConfig {
  colorPalette: {
    primaryColor: string;
    primaryForeground: string;
    secondaryColor: string;
    secondaryForeground: string;
    accentColor: string;
    accentForeground: string;
    mutedColor: string;
    mutedForeground: string;
    backgroundColor: string;
    foregroundColor: string;
    cardColor: string;
    cardForeground: string;
    destructiveColor: string;
    destructiveForeground: string;
    sidebarBackground: string;
    sidebarForeground: string;
    sidebarPrimary: string;
    sidebarPrimaryForeground: string;
  };
  fontScheme: {
    fontSans: string[];
    fontMono: string[];
    fontSizes: {
      xs: string;
      sm: string;
      base: string;
      lg: string;
      xl: string;
      '2xl': string;
      '3xl': string;
      '4xl': string;
    };
    fontWeights: {
      light: number;
      normal: number;
      medium: number;
      semibold: number;
      bold: number;
    };
  };
}