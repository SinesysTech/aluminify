"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Palette, 
  Save, 
  RotateCcw, 
  X, 
  Eye, 
  AlertTriangle,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { useThemeConfig } from '@/components/active-theme';
import type {
  BrandCustomizationPanelProps,
  CompleteBrandingConfig,
  SaveTenantBrandingRequest,
  ColorPalette,
  FontScheme,
  LogoType,
  LogoUploadResult,
  BrandCustomizationError,
  CreateColorPaletteRequest,
  CreateFontSchemeRequest,
  AccessibilityReport
} from '@/types/brand-customization';
import { LogoUploadComponent } from './logo-upload-component';
import { ColorPaletteEditor } from './color-palette-editor';
import { FontSchemeSelector } from './font-scheme-selector';

interface BrandCustomizationState {
  colorPaletteId?: string;
  fontSchemeId?: string;
  customCss?: string;
  logos: Record<LogoType, string | null>;
}

interface ValidationError {
  field: string;
  message: string;
}

export function BrandCustomizationPanel({
  empresaId,
  currentBranding,
  onSave,
  onReset,
  onCancel
}: BrandCustomizationPanelProps) {
  const { applyBrandingToTheme } = useThemeConfig();
  
  // State management
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  
  // Form state
  const [brandingState, setBrandingState] = useState<BrandCustomizationState>({
    colorPaletteId: currentBranding?.tenantBranding.colorPaletteId,
    fontSchemeId: currentBranding?.tenantBranding.fontSchemeId,
    customCss: currentBranding?.tenantBranding.customCss,
    logos: {
      login: currentBranding?.logos.login?.logoUrl || null,
      sidebar: currentBranding?.logos.sidebar?.logoUrl || null,
      favicon: currentBranding?.logos.favicon?.logoUrl || null,
    }
  });
  
  // Validation and feedback
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Available options (would be loaded from API in real implementation)
  const [availableColorPalettes] = useState<ColorPalette[]>([]);
  const [availableFontSchemes] = useState<FontScheme[]>([]);

  // Initialize state when currentBranding changes
  useEffect(() => {
    if (currentBranding) {
      setBrandingState({
        colorPaletteId: currentBranding.tenantBranding.colorPaletteId,
        fontSchemeId: currentBranding.tenantBranding.fontSchemeId,
        customCss: currentBranding.tenantBranding.customCss,
        logos: {
          login: currentBranding.logos.login?.logoUrl || null,
          sidebar: currentBranding.logos.sidebar?.logoUrl || null,
          favicon: currentBranding.logos.favicon?.logoUrl || null,
        }
      });
      setHasUnsavedChanges(false);
    }
  }, [currentBranding]);

  // Track changes to detect unsaved modifications
  useEffect(() => {
    if (!currentBranding) return;
    
    const hasChanges = (
      brandingState.colorPaletteId !== currentBranding.tenantBranding.colorPaletteId ||
      brandingState.fontSchemeId !== currentBranding.tenantBranding.fontSchemeId ||
      brandingState.customCss !== currentBranding.tenantBranding.customCss ||
      brandingState.logos.login !== (currentBranding.logos.login?.logoUrl || null) ||
      brandingState.logos.sidebar !== (currentBranding.logos.sidebar?.logoUrl || null) ||
      brandingState.logos.favicon !== (currentBranding.logos.favicon?.logoUrl || null)
    );
    
    setHasUnsavedChanges(hasChanges);
  }, [brandingState, currentBranding]);

  // Clear messages after a delay
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => setErrorMessage(null), 8000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  // Validation function
  const validateBrandingState = useCallback((): ValidationError[] => {
    const errors: ValidationError[] = [];
    
    // Validate color palette if selected
    if (brandingState.colorPaletteId) {
      const selectedPalette = availableColorPalettes.find(p => p.id === brandingState.colorPaletteId);
      if (!selectedPalette) {
        errors.push({
          field: 'colorPalette',
          message: 'Selected color palette is no longer available'
        });
      }
    }
    
    // Validate font scheme if selected
    if (brandingState.fontSchemeId) {
      const selectedScheme = availableFontSchemes.find(s => s.id === brandingState.fontSchemeId);
      if (!selectedScheme) {
        errors.push({
          field: 'fontScheme',
          message: 'Selected font scheme is no longer available'
        });
      }
    }
    
    // Validate custom CSS if provided
    if (brandingState.customCss && brandingState.customCss.trim()) {
      // Basic CSS validation - check for potentially dangerous content
      const dangerousPatterns = [
        /@import\s+url\(/i,
        /javascript:/i,
        /expression\(/i,
        /behavior:/i
      ];
      
      for (const pattern of dangerousPatterns) {
        if (pattern.test(brandingState.customCss)) {
          errors.push({
            field: 'customCss',
            message: 'Custom CSS contains potentially unsafe content'
          });
          break;
        }
      }
    }
    
    return errors;
  }, [brandingState, availableColorPalettes, availableFontSchemes]);

  // Handle logo upload
  const handleLogoUpload = useCallback(async (file: File, logoType: LogoType): Promise<LogoUploadResult> => {
    try {
      // This would typically call an API endpoint to upload the logo
      // For now, we'll simulate the upload process
      
      // Create a temporary URL for preview
      const logoUrl = URL.createObjectURL(file);
      
      // Update local state
      setBrandingState(prev => ({
        ...prev,
        logos: {
          ...prev.logos,
          [logoType]: logoUrl
        }
      }));
      
      return {
        success: true,
        logoUrl: logoUrl
      };
    } catch (error) {
      console.error('Logo upload failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      };
    }
  }, []);

  // Handle logo removal
  const handleLogoRemove = useCallback(async (logoType: LogoType): Promise<void> => {
    try {
      // This would typically call an API endpoint to remove the logo
      // For now, we'll just update local state
      
      setBrandingState(prev => ({
        ...prev,
        logos: {
          ...prev.logos,
          [logoType]: null
        }
      }));
    } catch (error) {
      console.error('Logo removal failed:', error);
      throw error;
    }
  }, []);

  // Handle color palette save
  const handleColorPaletteSave = useCallback(async (palette: CreateColorPaletteRequest): Promise<void> => {
    try {
      // This would typically call an API endpoint to create/update the color palette
      // For now, we'll simulate the process and update local state
      
      console.log('Saving color palette:', palette);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In a real implementation, this would:
      // 1. Call POST /api/tenant-branding/[empresaId]/color-palettes
      // 2. Get back the created palette with ID
      // 3. Update the tenant branding to reference this palette
      
      const mockPaletteId = `palette-${Date.now()}`;
      
      setBrandingState(prev => ({
        ...prev,
        colorPaletteId: mockPaletteId
      }));
      
      setSuccessMessage('Color palette saved successfully');
      
    } catch (error) {
      console.error('Failed to save color palette:', error);
      throw error;
    }
  }, []);

  // Handle color palette preview
  const handleColorPalettePreview = useCallback((palette: CreateColorPaletteRequest): void => {
    try {
      // Apply the color palette to the current theme for preview
      // This would integrate with the theme system to apply CSS custom properties
      
      console.log('Previewing color palette:', palette);
      
      // In a real implementation, this would:
      // 1. Convert the palette to CSS custom properties
      // 2. Apply them to the document root
      // 3. Update the theme context
      
      // For now, we'll just log the preview action
      // The actual theme application would happen in the theme system
      
    } catch (error) {
      console.error('Failed to preview color palette:', error);
    }
  }, []);

  // Handle color palette accessibility validation
  const handleColorPaletteValidate = useCallback(async (palette: CreateColorPaletteRequest): Promise<AccessibilityReport> => {
    try {
      // This would typically call an API endpoint or use a validation library
      // to check color contrast ratios and accessibility compliance
      
      console.log('Validating color palette accessibility:', palette);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Calculate contrast ratios (simplified calculation for demo)
      const calculateContrast = (color1: string, color2: string): number => {
        // This is a simplified contrast calculation
        // In a real implementation, you would use a proper color contrast library
        // like 'color-contrast' or implement the WCAG contrast formula
        
        // For demo purposes, return a mock value based on color similarity
        const hex1 = color1.replace('#', '');
        const hex2 = color2.replace('#', '');
        
        const r1 = parseInt(hex1.substr(0, 2), 16);
        const g1 = parseInt(hex1.substr(2, 2), 16);
        const b1 = parseInt(hex1.substr(4, 2), 16);
        
        const r2 = parseInt(hex2.substr(0, 2), 16);
        const g2 = parseInt(hex2.substr(2, 2), 16);
        const b2 = parseInt(hex2.substr(4, 2), 16);
        
        // Simple luminance calculation (not accurate, just for demo)
        const lum1 = (r1 * 0.299 + g1 * 0.587 + b1 * 0.114) / 255;
        const lum2 = (r2 * 0.299 + g2 * 0.587 + b2 * 0.114) / 255;
        
        const lighter = Math.max(lum1, lum2);
        const darker = Math.min(lum1, lum2);
        
        return (lighter + 0.05) / (darker + 0.05);
      };
      
      const primaryContrast = calculateContrast(palette.primaryColor, palette.backgroundColor);
      const secondaryContrast = calculateContrast(palette.secondaryColor, palette.backgroundColor);
      const accentContrast = calculateContrast(palette.accentColor, palette.backgroundColor);
      
      const isCompliant = primaryContrast >= 4.5 && secondaryContrast >= 3 && accentContrast >= 4.5;
      
      const report: AccessibilityReport = {
        isCompliant,
        contrastRatios: {
          primaryOnBackground: primaryContrast,
          secondaryOnBackground: secondaryContrast,
          accentOnBackground: accentContrast
        },
        recommendations: isCompliant ? [] : [
          'Consider using darker colors for better contrast',
          'Ensure text remains readable on all backgrounds',
          'Test with users who have visual impairments'
        ],
        warnings: isCompliant ? [] : [
          'Some color combinations may not meet WCAG AA standards',
          'Consider adjusting colors for better accessibility'
        ]
      };
      
      return report;
      
    } catch (error) {
      console.error('Failed to validate color palette accessibility:', error);
      throw error;
    }
  }, []);

  // Handle font scheme save
  const handleFontSchemeSave = useCallback(async (scheme: CreateFontSchemeRequest): Promise<void> => {
    try {
      // This would typically call an API endpoint to create/update the font scheme
      // For now, we'll simulate the process and update local state
      
      console.log('Saving font scheme:', scheme);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In a real implementation, this would:
      // 1. Call POST /api/tenant-branding/[empresaId]/font-schemes
      // 2. Get back the created scheme with ID
      // 3. Update the tenant branding to reference this scheme
      
      const mockSchemeId = `scheme-${Date.now()}`;
      
      setBrandingState(prev => ({
        ...prev,
        fontSchemeId: mockSchemeId
      }));
      
      setSuccessMessage('Font scheme saved successfully');
      
    } catch (error) {
      console.error('Failed to save font scheme:', error);
      throw error;
    }
  }, []);

  // Handle font scheme preview
  const handleFontSchemePreview = useCallback((scheme: CreateFontSchemeRequest): void => {
    try {
      // Apply the font scheme to the current theme for preview
      // This would integrate with the theme system to apply CSS custom properties
      
      console.log('Previewing font scheme:', scheme);
      
      // In a real implementation, this would:
      // 1. Convert the scheme to CSS custom properties
      // 2. Apply them to the document root
      // 3. Update the theme context
      // 4. Load Google Fonts if needed
      
      // For now, we'll just log the preview action
      // The actual theme application would happen in the theme system
      
    } catch (error) {
      console.error('Failed to preview font scheme:', error);
    }
  }, []);

  // Handle Google Font loading
  const handleLoadGoogleFont = useCallback(async (fontFamily: string): Promise<void> => {
    try {
      // This would typically load the Google Font dynamically
      // For now, we'll simulate the process
      
      console.log('Loading Google Font:', fontFamily);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // In a real implementation, this would:
      // 1. Create a link element for the Google Font
      // 2. Add it to the document head
      // 3. Wait for the font to load
      // 4. Update the available fonts list
      
      // For demo purposes, we'll just log the action
      console.log(`Google Font ${fontFamily} loaded successfully`);
      
    } catch (error) {
      console.error('Failed to load Google Font:', error);
      throw error;
    }
  }, []);

  const applyPreview = useCallback(() => {
    if (!previewMode) return;
    
    // Create a temporary branding config for preview
    const previewBranding: CompleteBrandingConfig = {
      tenantBranding: {
        id: 'preview',
        empresaId,
        colorPaletteId: brandingState.colorPaletteId,
        fontSchemeId: brandingState.fontSchemeId,
        customCss: brandingState.customCss,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      logos: {
        login: brandingState.logos.login ? { 
          id: 'preview-login', 
          tenantBrandingId: 'preview',
          logoType: 'login',
          logoUrl: brandingState.logos.login,
          createdAt: new Date(),
          updatedAt: new Date(),
        } : null,
        sidebar: brandingState.logos.sidebar ? {
          id: 'preview-sidebar',
          tenantBrandingId: 'preview',
          logoType: 'sidebar',
          logoUrl: brandingState.logos.sidebar,
          createdAt: new Date(),
          updatedAt: new Date(),
        } : null,
        favicon: brandingState.logos.favicon ? {
          id: 'preview-favicon',
          tenantBrandingId: 'preview',
          logoType: 'favicon',
          logoUrl: brandingState.logos.favicon,
          createdAt: new Date(),
          updatedAt: new Date(),
        } : null,
      },
      colorPalette: brandingState.colorPaletteId 
        ? availableColorPalettes.find(p => p.id === brandingState.colorPaletteId)
        : undefined,
      fontScheme: brandingState.fontSchemeId
        ? availableFontSchemes.find(s => s.id === brandingState.fontSchemeId)
        : undefined,
      customThemePresets: [],
    };
    
    applyBrandingToTheme(previewBranding);
  }, [previewMode, brandingState, empresaId, availableColorPalettes, availableFontSchemes, applyBrandingToTheme]);

  // Apply preview when state changes and preview is active
  useEffect(() => {
    if (previewMode) {
      applyPreview();
    }
  }, [previewMode, applyPreview]);

  // Handle save action
  const handleSave = async () => {
    try {
      setIsSaving(true);
      setErrorMessage(null);
      setSuccessMessage(null);
      
      // Validate before saving
      const errors = validateBrandingState();
      setValidationErrors(errors);
      
      if (errors.length > 0) {
        setErrorMessage('Please fix validation errors before saving');
        return;
      }
      
      const saveRequest: SaveTenantBrandingRequest = {
        colorPaletteId: brandingState.colorPaletteId,
        fontSchemeId: brandingState.fontSchemeId,
        customCss: brandingState.customCss,
      };
      
      await onSave(saveRequest);
      
      setHasUnsavedChanges(false);
      setSuccessMessage('Brand customization saved successfully');
      
      // Exit preview mode after successful save
      if (previewMode) {
        setPreviewMode(false);
      }
      
    } catch (error) {
      console.error('Failed to save brand customization:', error);
      
      if (error instanceof BrandCustomizationError) {
        setErrorMessage(`Failed to save: ${error.message}`);
      } else {
        setErrorMessage('Failed to save brand customization. Please try again.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Handle reset action
  const handleReset = async () => {
    try {
      setIsResetting(true);
      setErrorMessage(null);
      setSuccessMessage(null);
      
      await onReset();
      
      // Reset local state
      setBrandingState({
        colorPaletteId: undefined,
        fontSchemeId: undefined,
        customCss: undefined,
        logos: {
          login: null,
          sidebar: null,
          favicon: null,
        }
      });
      
      setHasUnsavedChanges(false);
      setValidationErrors([]);
      setSuccessMessage('Brand customization reset to default');
      
      // Exit preview mode
      if (previewMode) {
        setPreviewMode(false);
      }
      
    } catch (error) {
      console.error('Failed to reset brand customization:', error);
      setErrorMessage('Failed to reset brand customization. Please try again.');
    } finally {
      setIsResetting(false);
    }
  };

  // Handle cancel action
  const handleCancel = () => {
    if (hasUnsavedChanges) {
      const confirmCancel = window.confirm(
        'You have unsaved changes. Are you sure you want to cancel?'
      );
      if (!confirmCancel) return;
    }
    
    // Reset to original state
    if (currentBranding) {
      setBrandingState({
        colorPaletteId: currentBranding.tenantBranding.colorPaletteId,
        fontSchemeId: currentBranding.tenantBranding.fontSchemeId,
        customCss: currentBranding.tenantBranding.customCss,
        logos: {
          login: currentBranding.logos.login?.logoUrl || null,
          sidebar: currentBranding.logos.sidebar?.logoUrl || null,
          favicon: currentBranding.logos.favicon?.logoUrl || null,
        }
      });
    }
    
    setHasUnsavedChanges(false);
    setValidationErrors([]);
    setErrorMessage(null);
    setSuccessMessage(null);
    
    // Exit preview mode and restore original branding
    if (previewMode) {
      setPreviewMode(false);
      if (currentBranding) {
        applyBrandingToTheme(currentBranding);
      }
    }
    
    setIsOpen(false);
    onCancel();
  };

  // Toggle preview mode
  const togglePreview = () => {
    if (previewMode) {
      // Exit preview mode - restore original branding
      setPreviewMode(false);
      if (currentBranding) {
        applyBrandingToTheme(currentBranding);
      }
    } else {
      // Enter preview mode - apply current state
      setPreviewMode(true);
      applyPreview();
    }
  };

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        variant="outline"
        size="sm"
        className="gap-2"
      >
        <Palette className="h-4 w-4" />
        Brand Customization
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Brand Customization
              {hasUnsavedChanges && (
                <Badge variant="secondary" className="ml-2">
                  Unsaved Changes
                </Badge>
              )}
              {previewMode && (
                <Badge variant="outline" className="ml-2">
                  <Eye className="h-3 w-3 mr-1" />
                  Preview Mode
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription>
              Customize your organization&apos;s brand identity including logos, colors, and fonts.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-hidden">
            {/* Status Messages */}
            {successMessage && (
              <div className="px-6 pb-4">
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    {successMessage}
                  </AlertDescription>
                </Alert>
              </div>
            )}

            {errorMessage && (
              <div className="px-6 pb-4">
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    {errorMessage}
                  </AlertDescription>
                </Alert>
              </div>
            )}

            {validationErrors.length > 0 && (
              <div className="px-6 pb-4">
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-1">
                      <div className="font-medium">Validation Errors:</div>
                      {validationErrors.map((error, index) => (
                        <div key={index} className="text-sm">
                          • {error.message}
                        </div>
                      ))}
                    </div>
                  </AlertDescription>
                </Alert>
              </div>
            )}

            <ScrollArea className="flex-1 px-6">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="logos">Logos</TabsTrigger>
                  <TabsTrigger value="colors">Colors</TabsTrigger>
                  <TabsTrigger value="fonts">Fonts</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6 mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Current Brand Configuration</CardTitle>
                      <CardDescription>
                        Overview of your current brand customization settings
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium mb-2">Active Customizations</h4>
                          <div className="space-y-2 text-sm text-muted-foreground">
                            <div className="flex items-center justify-between">
                              <span>Custom Colors:</span>
                              <Badge variant={brandingState.colorPaletteId ? "default" : "secondary"}>
                                {brandingState.colorPaletteId ? "Active" : "Default"}
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between">
                              <span>Custom Fonts:</span>
                              <Badge variant={brandingState.fontSchemeId ? "default" : "secondary"}>
                                {brandingState.fontSchemeId ? "Active" : "Default"}
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between">
                              <span>Login Logo:</span>
                              <Badge variant={brandingState.logos.login ? "default" : "secondary"}>
                                {brandingState.logos.login ? "Custom" : "Default"}
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between">
                              <span>Sidebar Logo:</span>
                              <Badge variant={brandingState.logos.sidebar ? "default" : "secondary"}>
                                {brandingState.logos.sidebar ? "Custom" : "Default"}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="font-medium mb-2">Quick Actions</h4>
                          <div className="space-y-2">
                            <Button
                              onClick={togglePreview}
                              variant="outline"
                              size="sm"
                              className="w-full justify-start"
                              disabled={isLoading || isSaving || isResetting}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              {previewMode ? "Exit Preview" : "Preview Changes"}
                            </Button>
                            
                            {hasUnsavedChanges && (
                              <Button
                                onClick={handleSave}
                                size="sm"
                                className="w-full justify-start"
                                disabled={isSaving || isResetting}
                              >
                                {isSaving ? (
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                  <Save className="h-4 w-4 mr-2" />
                                )}
                                Save Changes
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="logos" className="space-y-6 mt-6">
                  <div className="grid gap-6">
                    <LogoUploadComponent
                      logoType="login"
                      currentLogoUrl={brandingState.logos.login || undefined}
                      onUpload={handleLogoUpload}
                      onRemove={handleLogoRemove}
                      maxFileSize={5 * 1024 * 1024} // 5MB
                      acceptedFormats={['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml']}
                    />
                    
                    <LogoUploadComponent
                      logoType="sidebar"
                      currentLogoUrl={brandingState.logos.sidebar || undefined}
                      onUpload={handleLogoUpload}
                      onRemove={handleLogoRemove}
                      maxFileSize={5 * 1024 * 1024} // 5MB
                      acceptedFormats={['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml']}
                    />
                    
                    <LogoUploadComponent
                      logoType="favicon"
                      currentLogoUrl={brandingState.logos.favicon || undefined}
                      onUpload={handleLogoUpload}
                      onRemove={handleLogoRemove}
                      maxFileSize={1 * 1024 * 1024} // 1MB for favicon
                      acceptedFormats={['image/png', 'image/x-icon', 'image/svg+xml']}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="colors" className="space-y-6 mt-6">
                  <ColorPaletteEditor
                    currentPalette={currentBranding?.colorPalette}
                    onSave={handleColorPaletteSave}
                    onPreview={handleColorPalettePreview}
                    onValidate={handleColorPaletteValidate}
                  />
                </TabsContent>

                <TabsContent value="fonts" className="space-y-6 mt-6">
                  <FontSchemeSelector
                    currentScheme={currentBranding?.fontScheme}
                    availableGoogleFonts={[
                      'Inter', 'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Source Sans Pro',
                      'Poppins', 'Nunito', 'Raleway', 'Ubuntu', 'Fira Code', 'Source Code Pro',
                      'JetBrains Mono', 'Inconsolata', 'Fira Sans', 'Work Sans', 'Playfair Display',
                      'Merriweather', 'PT Sans', 'Oswald'
                    ]}
                    onSave={handleFontSchemeSave}
                    onPreview={handleFontSchemePreview}
                    onLoadGoogleFont={handleLoadGoogleFont}
                  />
                </TabsContent>
              </Tabs>
            </ScrollArea>
          </div>

          {/* Footer Actions */}
          <div className="border-t p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {previewMode && (
                  <Badge variant="outline" className="text-xs">
                    <Eye className="h-3 w-3 mr-1" />
                    Preview Active
                  </Badge>
                )}
                {hasUnsavedChanges && (
                  <Badge variant="secondary" className="text-xs">
                    Unsaved Changes
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleReset}
                  variant="outline"
                  disabled={isLoading || isSaving || isResetting}
                >
                  {isResetting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <RotateCcw className="h-4 w-4 mr-2" />
                  )}
                  Reset to Default
                </Button>
                
                <Button
                  onClick={handleCancel}
                  variant="outline"
                  disabled={isLoading || isSaving || isResetting}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                
                <Button
                  onClick={handleSave}
                  disabled={!hasUnsavedChanges || isLoading || isSaving || isResetting}
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save Changes
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}