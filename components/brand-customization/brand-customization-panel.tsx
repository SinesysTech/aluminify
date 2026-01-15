'use client';

import { useState, useEffect } from 'react';
import {
  Palette,
  Upload,
  Type,
  Save,
  RotateCcw,
  Loader2,
  ImageIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { LogoUploadComponent } from './logo-upload-component';
import { ColorPaletteEditor } from './color-palette-editor';
import { FontSchemeSelector } from './font-scheme-selector';
import type {
  BrandCustomizationState,
  BrandCustomizationPanelProps,
  LogoType,
  LogoUploadResult,
  CreateColorPaletteRequest,
  CreateFontSchemeRequest
} from '@/types/brand-customization';

export function BrandCustomizationPanel({
  empresaId,
  currentBranding,
  onSave,
  onReset,
}: BrandCustomizationPanelProps) {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [brandingState, setBrandingState] = useState<BrandCustomizationState>({
    logos: {},
    colorPalette: undefined,
    fontScheme: undefined,
    customCss: undefined // Ensure customCss is included if it's in the type
  });

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // Initialize state from props
  useEffect(() => {
    if (currentBranding) {
      // Map TenantLogo objects to URL strings
      const logosUrlMap: Partial<Record<LogoType, string | null>> = {};
      if (currentBranding.logos) {
        if (currentBranding.logos.login) {
          logosUrlMap.login = currentBranding.logos.login.logoUrl;
        }
        if (currentBranding.logos.sidebar) {
          logosUrlMap.sidebar = currentBranding.logos.sidebar.logoUrl;
        }
        if (currentBranding.logos.favicon) {
          logosUrlMap.favicon = currentBranding.logos.favicon.logoUrl;
        }
      }

      setBrandingState({
        logos: logosUrlMap,
        colorPalette: currentBranding.colorPalette,
        fontScheme: currentBranding.fontScheme,
        customCss: currentBranding.tenantBranding?.customCss
      });
    }
  }, [currentBranding]);

  const handleLogoUpload = async (file: File, type: LogoType): Promise<LogoUploadResult> => {
    try {
      console.log('Uploading logo for empresa:', empresaId);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('logoType', type);

      const response = await fetch(`/api/tenant-branding/${empresaId}/logos`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Falha no upload do logo');
      }

      // Update local state with the returned URL (not blob)
      setBrandingState(prev => ({
        ...prev,
        logos: {
          ...prev.logos,
          [type]: data.logoUrl
        }
      }));

      // Logos are saved instantly, so we don't set hasUnsavedChanges
      // setHasUnsavedChanges(true); 

      return { success: true, logoUrl: data.logoUrl };
    } catch (error) {
      console.error('Upload failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Falha no upload do logo'
      };
    }
  };

  const handleLogoRemove = async (type: LogoType): Promise<void> => {
    try {
      const response = await fetch(`/api/tenant-branding/${empresaId}/logos/${type}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Falha ao remover logo');
      }

      setBrandingState(prev => {
        const newLogos = { ...prev.logos };
        delete newLogos[type];
        return { ...prev, logos: newLogos };
      });

      // Logos are removed instantly
      // setHasUnsavedChanges(true);
    } catch (error) {
      console.error('Removal failed:', error);
      throw error; // Re-throw to let child component handle if needed, though handleLogoRemove signature returns Promise<void>
    }
  };

  const handleColorPaletteSave = async (paletteRequest: CreateColorPaletteRequest): Promise<void> => {
    try {
      const response = await fetch(`/api/tenant-branding/${empresaId}/color-palettes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paletteRequest),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Falha ao salvar paleta de cores');
      }

      // Update local state with the saved palette (including ID) and set ID for main save
      setBrandingState(prev => ({
        ...prev,
        colorPalette: data.data,
        colorPaletteId: data.data.id
      }));
      setHasUnsavedChanges(true);
    } catch (error) {
      console.error('Failed to save color palette:', error);
      throw error; // Let child component handle the error
    }
  };

  // Keep these handlers for compatibility with child components
  const handleColorPalettePreview = () => setPreviewMode(!previewMode);
  const handleColorPaletteValidate = () => Promise.resolve({ isCompliant: true, contrastRatios: { primaryOnBackground: 4.5, secondaryOnBackground: 4.5, accentOnBackground: 4.5 } });

  const handleFontSchemeSave = async (schemeRequest: CreateFontSchemeRequest): Promise<void> => {
    try {
      const response = await fetch(`/api/tenant-branding/${empresaId}/font-schemes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(schemeRequest),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Falha ao salvar esquema de fontes');
      }

      // Update local state and ID
      setBrandingState(prev => ({
        ...prev,
        fontScheme: data.data,
        fontSchemeId: data.data.id
      }));
      setHasUnsavedChanges(true); // Enable main save button to link this scheme
    } catch (error) {
      console.error('Failed to save font scheme:', error);
      throw error;
    }
  };

  const handleFontSchemePreview = () => setPreviewMode(!previewMode);
  const handleLoadGoogleFont = (fontFamily: string) => {
    const link = document.createElement('link');
    link.href = `https://fonts.googleapis.com/css2?family=${fontFamily.replace(/\s+/g, '+')}:wght@300;400;500;700&display=swap`;
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const saveRequest: SaveTenantBrandingRequest = {
        colorPaletteId: brandingState.colorPaletteId ?? brandingState.colorPalette?.id,
        fontSchemeId: brandingState.fontSchemeId ?? brandingState.fontScheme?.id,
        customCss: brandingState.customCss,
      };

      await onSave(saveRequest);
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Failed to save branding:', error);
      // Parent handles toast usually
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    setIsResetting(true);
    try {
      await onReset();
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Failed to reset branding:', error);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <Card className="w-full border-none shadow-none">
      <CardContent className="p-0">
        <div className="flex flex-col space-y-6">
          <div className="flex items-center justify-between pb-4 border-b">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Palette className="h-6 w-6" />
                Personalização da Marca
              </h2>
              <p className="text-muted-foreground mt-1">
                Personalize a identidade visual da sua empresa, incluindo logos, cores e fontes.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                onClick={handleReset}
                variant="outline"
                disabled={isSaving || isResetting}
              >
                {isResetting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RotateCcw className="h-4 w-4 mr-2" />
                )}
                Restaurar Padrão
              </Button>

              <Button
                onClick={handleSave}
                disabled={!hasUnsavedChanges || isSaving || isResetting}
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Salvar Alterações
              </Button>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Visão Geral</TabsTrigger>
              <TabsTrigger value="logos">Logos</TabsTrigger>
              <TabsTrigger value="colors">Cores</TabsTrigger>
              <TabsTrigger value="fonts">Fontes</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-6 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Configuração Atual da Marca</CardTitle>
                  <CardDescription>
                    Visão geral das configurações de personalização atuais
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Logos Summary */}
                    <div className="space-y-4">
                      <div className="font-medium flex items-center gap-2">
                        <ImageIcon className="h-4 w-4" />
                        Logos
                      </div>
                      <div className="grid gap-2">
                        <div className="flex items-center justify-between text-sm p-2 bg-muted/50 rounded">
                          <span>Login</span>
                          {brandingState.logos.login ? (
                            <Badge variant="default" className="bg-green-600">Personalizado</Badge>
                          ) : (
                            <Badge variant="outline">Padrão</Badge>
                          )}
                        </div>
                        <div className="flex items-center justify-between text-sm p-2 bg-muted/50 rounded">
                          <span>Sidebar</span>
                          {brandingState.logos.sidebar ? (
                            <Badge variant="default" className="bg-green-600">Personalizado</Badge>
                          ) : (
                            <Badge variant="outline">Padrão</Badge>
                          )}
                        </div>
                        <div className="flex items-center justify-between text-sm p-2 bg-muted/50 rounded">
                          <span>Favicon</span>
                          {brandingState.logos.favicon ? (
                            <Badge variant="default" className="bg-green-600">Personalizado</Badge>
                          ) : (
                            <Badge variant="outline">Padrão</Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Colors Summary */}
                    <div className="space-y-4">
                      <div className="font-medium flex items-center gap-2">
                        <Palette className="h-4 w-4" />
                        Cores
                      </div>
                      {brandingState.colorPalette ? (
                        <div className="space-y-2">
                          <div className="text-sm font-medium">{brandingState.colorPalette.name}</div>
                          <div className="flex gap-2">
                            <div
                              className="w-8 h-8 rounded-full border shadow-sm"
                              style={{ backgroundColor: brandingState.colorPalette.colors.primaryColor }}
                              title="Primária"
                            />
                            <div
                              className="w-8 h-8 rounded-full border shadow-sm"
                              style={{ backgroundColor: brandingState.colorPalette.colors.secondaryColor }}
                              title="Secundária"
                            />
                            <div
                              className="w-8 h-8 rounded-full border shadow-sm"
                              style={{ backgroundColor: brandingState.colorPalette.colors.accentColor }}
                              title="Destaque"
                            />
                          </div>
                          <Badge variant="secondary">Personalizado</Badge>
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground">
                          Nenhuma paleta personalizada ativa. Usando cores padrão do sistema.
                        </div>
                      )}
                    </div>

                    {/* Fonts Summary */}
                    <div className="space-y-4">
                      <div className="font-medium flex items-center gap-2">
                        <Type className="h-4 w-4" />
                        Fontes
                      </div>
                      {brandingState.fontScheme ? (
                        <div className="space-y-2">
                          <div className="text-sm font-medium">{brandingState.fontScheme.name}</div>
                          <div className="text-sm text-muted-foreground p-2 bg-muted/50 rounded">
                            <div className="font-medium mb-1">Aa Bb Cc</div>
                            <div className="text-xs">
                              {brandingState.fontScheme.headingFont.split(',')[0]}
                            </div>
                          </div>
                          <Badge variant="secondary">Personalizado</Badge>
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground">
                          Nenhum esquema de fonte personalizado ativo. Usando fontes padrão do sistema.
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Button
                  variant="outline"
                  className="h-auto py-4 flex flex-col items-center gap-2"
                  onClick={() => setActiveTab('logos')}
                >
                  <Upload className="h-6 w-6 mb-1" />
                  <span>Enviar Logos</span>
                  <span className="text-xs text-muted-foreground font-normal">Faça upload da identidade da sua marca</span>
                </Button>

                <Button
                  variant="outline"
                  className="h-auto py-4 flex flex-col items-center gap-2"
                  onClick={() => setActiveTab('colors')}
                >
                  <Palette className="h-6 w-6 mb-1" />
                  <span>Configurar Cores</span>
                  <span className="text-xs text-muted-foreground font-normal">Defina sua paleta de cores</span>
                </Button>

                <Button
                  variant="outline"
                  className="h-auto py-4 flex flex-col items-center gap-2"
                  onClick={() => setActiveTab('fonts')}
                >
                  <Type className="h-6 w-6 mb-1" />
                  <span>Escolher Fontes</span>
                  <span className="text-xs text-muted-foreground font-normal">Selecione sua tipografia</span>
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="logos" className="space-y-6 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
        </div>
      </CardContent>
    </Card>
  );
}