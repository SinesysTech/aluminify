/**
 * Brand Customization Types
 * 
 * TypeScript interfaces for the brand customization system that allows
 * each empresa (tenant) to customize logos, colors, fonts, and themes.
 */

// ============================================================================
// Core Types
// ============================================================================

export type LogoType = 'login' | 'sidebar' | 'favicon'

export type ThemeMode = 'light' | 'dark'

// ============================================================================
// Database Entity Types
// ============================================================================

/**
 * Main tenant branding configuration
 */
export interface TenantBranding {
  id: string
  empresaId: string
  
  // References to active color palette and font scheme
  colorPaletteId?: string
  fontSchemeId?: string
  
  // Custom CSS for advanced customizations
  customCss?: string
  
  // Metadata
  createdAt: Date
  updatedAt: Date
  createdBy?: string
  updatedBy?: string
}

/**
 * Logo storage for different contexts
 */
export interface TenantLogo {
  id: string
  tenantBrandingId: string
  logoType: LogoType
  logoUrl: string
  
  // File metadata
  fileName?: string
  fileSize?: number
  mimeType?: string
  
  // Metadata
  createdAt: Date
  updatedAt: Date
}

/**
 * Color palette definition
 */
export interface ColorPalette {
  id: string
  name: string
  empresaId: string
  
  // Primary colors
  primaryColor: string
  primaryForeground: string
  secondaryColor: string
  secondaryForeground: string
  
  // Support colors
  accentColor: string
  accentForeground: string
  mutedColor: string
  mutedForeground: string
  
  // System colors
  backgroundColor: string
  foregroundColor: string
  cardColor: string
  cardForeground: string
  
  // Status colors
  destructiveColor: string
  destructiveForeground: string
  
  // Sidebar specific colors
  sidebarBackground: string
  sidebarForeground: string
  sidebarPrimary: string
  sidebarPrimaryForeground: string
  
  // Metadata
  isCustom: boolean
  createdAt: Date
  updatedAt: Date
  createdBy?: string
  updatedBy?: string
}

/**
 * Font scheme definition
 */
export interface FontScheme {
  id: string
  name: string
  empresaId: string
  
  // Font families
  fontSans: string[]
  fontMono: string[]
  
  // Font sizes
  fontSizes: {
    xs: string
    sm: string
    base: string
    lg: string
    xl: string
    '2xl': str