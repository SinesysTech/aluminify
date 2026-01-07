import { SupabaseClient } from '@supabase/supabase-js';
import { BrandCustomizationRepositoryImpl } from './brand-customization.repository';
import type {
  CompleteBrandingConfig,
  SaveTenantBrandingRequest,
  CSSCustomProperties,
  TenantBrandingInsert,
  BrandCustomizationError,
} from '@/types/brand-customization';
import type {
  LoadTenantBrandingOptions,
  ApplyTenantBrandingOptions,
  SaveTenantBrandingOptions,
  ResetToDefaultOptions,
  BrandingOperationResult,
  CSSApplicationResult,
  DefaultBrandingConfig,
} from './brand-customization.types';

export interface BrandCustomizationService {
  loadTenantBranding(options: LoadTenantBrandingOptions): Promise<BrandingOperationResult>;
  applyTenantBranding(options: ApplyTenantBrandingOptions): Promise<CSSApplicationResult>;
  saveTenantBranding(options: SaveTenantBrandingOptions): Promise<BrandingOperationResult>;
  resetToDefault(options: ResetToDefaultOptions): Promise<BrandingOperationResult>;
}

export class BrandCustomizationManager implements BrandCustomizationService {
  private readonly repository: BrandCustomizationRepositoryImpl;
  private readonly defaultBranding: DefaultBrandingConfig;

  constructor(private readonly client: SupabaseClient) {
    this.repository = new BrandCustomizationRepositoryImpl(client);
    this.defaultBranding = this.getDefaultBrandingConfig();
  }

  /**
   * Load tenant branding configuration
   * Validates Requirements 4.1: Load customizations specific to empresa
   */
  async loadTenantBranding(options: LoadTenantBrandingOptions): Promise<BrandingOperationResult> {
    try {
      const { empresaId } = options;

      // Validate empresa exists
      const { data: empresa, error: empresaError } = await this.client
        .from('empresas')
        .select('id')
        .eq('id', empresaId)
        .maybeSingle();

      if (empresaError) {
        return {
          success: false,
          error: `Failed to validate empresa: ${empresaError.message}`,
        };
      }

      if (!empresa) {
        return {
          success: false,
          error: `Empresa with ID ${empresaId} not found`,
        };
      }

      // Load complete branding configuration
      const brandingConfig = await this.repository.getCompleteBrandingConfig(empresaId);

      if (!brandingConfig) {
        // Return default branding if no custom configuration exists
        const defaultConfig = this.createDefaultBrandingConfig(empresaId);
        return {
          success: true,
          data: defaultConfig,
          warnings: ['No custom branding found, using default configuration'],
        };
      }

      return {
        success: true,
        data: brandingConfig,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to load tenant branding: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Apply tenant branding to DOM or specific element
   * Validates Requirements 2.4, 3.5: Apply colors and fonts via CSS custom properties
   */
  async applyTenantBranding(options: ApplyTenantBrandingOptions): Promise<CSSApplicationResult> {
    try {
      const { branding, target = 'document', element, immediate = true } = options;
      const appliedProperties: Partial<CSSCustomProperties> = {};
      const errors: string[] = [];

      // Determine target element
      let targetElement: HTMLElement;
      if (target === 'document') {
        if (typeof document === 'undefined') {
          return {
            success: false,
            appliedProperties,
            errors: ['Document is not available (server-side context)'],
          };
        }
        targetElement = document.documentElement;
      } else if (element) {
        targetElement = element;
      } else {
        return {
          success: false,
          appliedProperties,
          errors: ['No target element specified'],
        };
      }

      // Apply color palette
      if (branding.colorPalette) {
        try {
          const colorProperties = this.generateColorCSSProperties(branding.colorPalette);
          Object.entries(colorProperties).forEach(([property, value]) => {
            targetElement.style.setProperty(property, value);
            appliedProperties[property as keyof CSSCustomProperties] = value;
          });
        } catch (error) {
          errors.push(`Failed to apply color palette: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // Apply font scheme
      if (branding.fontScheme) {
        try {
          const fontProperties = this.generateFontCSSProperties(branding.fontScheme);
          Object.entries(fontProperties).forEach(([property, value]) => {
            targetElement.style.setProperty(property, value);
            appliedProperties[property as keyof CSSCustomProperties] = value;
          });

          // Load Google Fonts if needed
          if (branding.fontScheme.googleFonts && branding.fontScheme.googleFonts.length > 0) {
            await this.loadGoogleFonts(branding.fontScheme.googleFonts);
          }
        } catch (error) {
          errors.push(`Failed to apply font scheme: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // Apply custom CSS if present
      if (branding.tenantBranding.customCss) {
        try {
          this.applyCustomCSS(branding.tenantBranding.customCss, targetElement);
        } catch (error) {
          errors.push(`Failed to apply custom CSS: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      return {
        success: errors.length === 0,
        appliedProperties,
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (error) {
      return {
        success: false,
        appliedProperties: {},
        errors: [`Failed to apply tenant branding: ${error instanceof Error ? error.message : 'Unknown error'}`],
      };
    }
  }

  /**
   * Save tenant branding configuration
   * Validates Requirements 4.2: Persist customizations linked to empresa_id
   */
  async saveTenantBranding(options: SaveTenantBrandingOptions): Promise<BrandingOperationResult> {
    try {
      const { empresaId, branding, userId } = options;

      // Check if tenant branding already exists
      let existingBranding = await this.repository.findTenantBranding(empresaId);

      if (existingBranding) {
        // Update existing branding
        const updatedBranding = await this.repository.updateTenantBranding(existingBranding.id, {
          colorPaletteId: branding.colorPaletteId,
          fontSchemeId: branding.fontSchemeId,
          customCss: branding.customCss,
          updatedBy: userId,
        });

        // Load complete configuration
        const completeConfig = await this.repository.getCompleteBrandingConfig(empresaId);
        
        return {
          success: true,
          data: completeConfig || undefined,
        };
      } else {
        // Create new branding
        const newBrandingData: TenantBrandingInsert = {
          empresaId,
          colorPaletteId: branding.colorPaletteId,
          fontSchemeId: branding.fontSchemeId,
          customCss: branding.customCss,
          createdBy: userId,
          updatedBy: userId,
        };

        const createdBranding = await this.repository.createTenantBranding(newBrandingData);

        // Load complete configuration
        const completeConfig = await this.repository.getCompleteBrandingConfig(empresaId);

        return {
          success: true,
          data: completeConfig || undefined,
        };
      }
    } catch (error) {
      return {
        success: false,
        error: `Failed to save tenant branding: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Reset tenant branding to default
   * Validates Requirements 4.5: Apply default system branding when no custom branding exists
   */
  async resetToDefault(options: ResetToDefaultOptions): Promise<BrandingOperationResult> {
    try {
      const { empresaId, userId, preserveLogos = false } = options;

      // Find existing branding
      const existingBranding = await this.repository.findTenantBranding(empresaId);

      if (existingBranding) {
        if (preserveLogos) {
          // Reset only color palette and font scheme, keep logos
          await this.repository.updateTenantBranding(existingBranding.id, {
            colorPaletteId: null,
            fontSchemeId: null,
            customCss: null,
            updatedBy: userId,
          });
        } else {
          // Delete entire branding configuration
          await this.repository.deleteTenantBranding(existingBranding.id);
        }
      }

      // Return default branding configuration
      const defaultConfig = this.createDefaultBrandingConfig(empresaId);

      return {
        success: true,
        data: defaultConfig,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to reset to default: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Generate CSS custom properties for color palette
   */
  private generateColorCSSProperties(colorPalette: any): Partial<CSSCustomProperties> {
    return {
      '--primary': colorPalette.primaryColor,
      '--primary-foreground': colorPalette.primaryForeground,
      '--secondary': colorPalette.secondaryColor,
      '--secondary-foreground': colorPalette.secondaryForeground,
      '--accent': colorPalette.accentColor,
      '--accent-foreground': colorPalette.accentForeground,
      '--muted': colorPalette.mutedColor,
      '--muted-foreground': colorPalette.mutedForeground,
      '--background': colorPalette.backgroundColor,
      '--foreground': colorPalette.foregroundColor,
      '--card': colorPalette.cardColor,
      '--card-foreground': colorPalette.cardForeground,
      '--destructive': colorPalette.destructiveColor,
      '--destructive-foreground': colorPalette.destructiveForeground,
      '--sidebar-background': colorPalette.sidebarBackground,
      '--sidebar-foreground': colorPalette.sidebarForeground,
      '--sidebar-primary': colorPalette.sidebarPrimary,
      '--sidebar-primary-foreground': colorPalette.sidebarPrimaryForeground,
    };
  }

  /**
   * Generate CSS custom properties for font scheme
   */
  private generateFontCSSProperties(fontScheme: any): Partial<CSSCustomProperties> {
    return {
      '--font-sans': fontScheme.fontSans.join(', '),
      '--font-mono': fontScheme.fontMono.join(', '),
    };
  }

  /**
   * Load Google Fonts dynamically
   */
  private async loadGoogleFonts(googleFonts: string[]): Promise<void> {
    if (typeof document === 'undefined') return;

    const existingLinks = document.querySelectorAll('link[data-google-fonts]');
    const existingFonts = new Set(
      Array.from(existingLinks).map(link => link.getAttribute('data-google-fonts'))
    );

    for (const fontFamily of googleFonts) {
      if (!existingFonts.has(fontFamily)) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontFamily)}:wght@300;400;500;600;700&display=swap`;
        link.setAttribute('data-google-fonts', fontFamily);
        document.head.appendChild(link);
      }
    }
  }

  /**
   * Apply custom CSS to target element
   */
  private applyCustomCSS(customCss: string, targetElement: HTMLElement): void {
    // Create or update style element for custom CSS
    let styleElement = document.querySelector('#tenant-custom-css') as HTMLStyleElement;
    
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = 'tenant-custom-css';
      document.head.appendChild(styleElement);
    }

    styleElement.textContent = customCss;
  }

  /**
   * Create default branding configuration
   */
  private createDefaultBrandingConfig(empresaId: string): CompleteBrandingConfig {
    return {
      tenantBranding: {
        id: 'default',
        empresaId,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      logos: {
        login: null,
        sidebar: null,
        favicon: null,
      },
      colorPalette: {
        id: 'default',
        name: 'Default',
        empresaId,
        ...this.defaultBranding.colorPalette,
        isCustom: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      fontScheme: {
        id: 'default',
        name: 'Default',
        empresaId,
        ...this.defaultBranding.fontScheme,
        googleFonts: [],
        isCustom: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      customThemePresets: [],
    };
  }

  /**
   * Get default branding configuration
   */
  private getDefaultBrandingConfig(): DefaultBrandingConfig {
    return {
      colorPalette: {
        primaryColor: 'hsl(222.2 84% 4.9%)',
        primaryForeground: 'hsl(210 40% 98%)',
        secondaryColor: 'hsl(210 40% 96%)',
        secondaryForeground: 'hsl(222.2 84% 4.9%)',
        accentColor: 'hsl(210 40% 96%)',
        accentForeground: 'hsl(222.2 84% 4.9%)',
        mutedColor: 'hsl(210 40% 96%)',
        mutedForeground: 'hsl(215.4 16.3% 46.9%)',
        backgroundColor: 'hsl(0 0% 100%)',
        foregroundColor: 'hsl(222.2 84% 4.9%)',
        cardColor: 'hsl(0 0% 100%)',
        cardForeground: 'hsl(222.2 84% 4.9%)',
        destructiveColor: 'hsl(0 84.2% 60.2%)',
        destructiveForeground: 'hsl(210 40% 98%)',
        sidebarBackground: 'hsl(0 0% 98%)',
        sidebarForeground: 'hsl(240 5.3% 26.1%)',
        sidebarPrimary: 'hsl(240 5.9% 10%)',
        sidebarPrimaryForeground: 'hsl(0 0% 98%)',
      },
      fontScheme: {
        fontSans: [
          'ui-sans-serif',
          'system-ui',
          'sans-serif',
          '"Apple Color Emoji"',
          '"Segoe UI Emoji"',
          '"Segoe UI Symbol"',
          '"Noto Color Emoji"',
        ],
        fontMono: [
          'ui-monospace',
          'SFMono-Regular',
          '"Menlo"',
          '"Monaco"',
          '"Consolas"',
          '"Liberation Mono"',
          '"Courier New"',
          'monospace',
        ],
        fontSizes: {
          xs: '0.75rem',
          sm: '0.875rem',
          base: '1rem',
          lg: '1.125rem',
          xl: '1.25rem',
          '2xl': '1.5rem',
          '3xl': '1.875rem',
          '4xl': '2.25rem',
        },
        fontWeights: {
          light: 300,
          normal: 400,
          medium: 500,
          semibold: 600,
          bold: 700,
        },
      },
    };
  }
}