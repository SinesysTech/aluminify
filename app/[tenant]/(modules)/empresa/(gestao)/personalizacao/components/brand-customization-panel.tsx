'use client'

import { useState, useEffect, useCallback } from 'react';
import {
  Palette,
  Upload,
  Type,
  Save,
  RotateCcw,
  Loader2,
  ImageIcon,
  Sparkles,
  Check,
  ChevronRight,
  Monitor,
  Smartphone,
  Settings2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/app/shared/components/feedback/progress';
import { createClient } from '@/app/shared/core/client';
import { LogoUploadComponent } from './logo-upload-component';
import { ColorPaletteEditor } from './color-palette-editor';
import { FontSchemeSelector } from './font-scheme-selector';
import {
  PresetSelector,
  ThemeScaleSelector,
  ThemeRadiusSelector,
  ColorModeSelector,
  ContentLayoutSelector,
  SidebarModeSelector,
  ResetThemeButton
} from './theme-customizer';
import { useTenantBrandingOptional } from '@/hooks/use-tenant-branding';
import type {
  BrandCustomizationState,
  BrandCustomizationPanelProps,
  LogoType,
  LogoUploadResult,
  CreateColorPaletteRequest,
  CreateFontSchemeRequest,
  SaveTenantBrandingRequest
} from '@/app/[tenant]/(modules)/empresa/(gestao)/personalizacao/services/brand-customization.types';

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
  const [draftColorPalette, setDraftColorPalette] = useState<CreateColorPaletteRequest | null>(null);

  // Get branding context for refresh and cross-tab sync
  const brandingContext = useTenantBrandingOptional();

  const getAuthHeaders = async (): Promise<Record<string, string>> => {
    const supabase = createClient();
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      throw new Error('Falha ao obter sessão do usuário');
    }

    const token = data.session?.access_token;
    if (!token) {
      throw new Error('Authentication required');
    }

    return {
      Authorization: `Bearer ${token}`,
    };
  };

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

  const handleLogoUpload = useCallback(async (file: File, type: LogoType): Promise<LogoUploadResult> => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('logoType', type);

      const authHeaders = await getAuthHeaders();

      const response = await fetch(`/api/empresa/personalizacao/${empresaId}/logos`, {
        method: 'POST',
        headers: authHeaders,
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Falha no upload do logo');
      }

      // Update local state with the returned URL
      setBrandingState(prev => ({
        ...prev,
        logos: {
          ...prev.logos,
          [type]: data.logoUrl
        }
      }));

      // Refresh branding context to propagate changes to all components (sidebar, etc.)
      if (brandingContext) {
        await brandingContext.refreshBranding();
        brandingContext.triggerCrossTabUpdate();
      }

      return { success: true, logoUrl: data.logoUrl };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Falha no upload do logo'
      };
    }
  }, [empresaId, brandingContext]);

  const handleLogoRemove = useCallback(async (type: LogoType): Promise<void> => {
    try {
      const authHeaders = await getAuthHeaders();
      const response = await fetch(`/api/empresa/personalizacao/${empresaId}/logos/${type}`, {
        method: 'DELETE',
        headers: authHeaders,
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

      // Refresh branding context to propagate changes to all components
      if (brandingContext) {
        await brandingContext.refreshBranding();
        brandingContext.triggerCrossTabUpdate();
      }
    } catch (error) {
      console.error('Removal failed:', error);
      throw error;
    }
  }, [empresaId, brandingContext]);

  const saveColorPalette = async (paletteRequest: CreateColorPaletteRequest): Promise<string> => {
    try {
      const authHeaders = await getAuthHeaders();
      const normalizedPaletteRequest: CreateColorPaletteRequest = {
        ...paletteRequest,
        // A API exige nome; se o usuário não preencher, usamos um default seguro
        name: paletteRequest.name?.trim() || 'Paleta personalizada',
      };
      const existingPaletteId =
        brandingState.colorPaletteId ?? brandingState.colorPalette?.id ?? null;

      const isUpdate = !!existingPaletteId;
      const endpoint = isUpdate
        ? `/api/empresa/personalizacao/${empresaId}/color-palettes/${existingPaletteId}`
        : `/api/empresa/personalizacao/${empresaId}/color-palettes`;

      const response = await fetch(endpoint, {
        method: isUpdate ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
        body: JSON.stringify(normalizedPaletteRequest),
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

      return data.data.id as string;
    } catch (error) {
      console.error('Failed to save color palette:', error);
      throw error; // Let child component handle the error
    }
  };

  const handleColorPaletteSave = async (paletteRequest: CreateColorPaletteRequest): Promise<void> => {
    await saveColorPalette(paletteRequest);
    setDraftColorPalette(null);
    setHasUnsavedChanges(true);
  };

  // Used by ColorPaletteEditor to notify "draft" changes
  const handleColorPalettePreview = (palette: CreateColorPaletteRequest) => {
    setDraftColorPalette(palette);
    setHasUnsavedChanges(true);
    // Keep legacy preview mode toggle (currently unused by UI, but harmless)
    setPreviewMode(true);
  };
  const handleColorPaletteValidate = () => Promise.resolve({ isCompliant: true, contrastRatios: { primaryOnBackground: 4.5, secondaryOnBackground: 4.5, accentOnBackground: 4.5 } });

  const handleFontSchemeSave = async (schemeRequest: CreateFontSchemeRequest): Promise<void> => {
    try {
      const authHeaders = await getAuthHeaders();
      const response = await fetch(`/api/empresa/personalizacao/${empresaId}/font-schemes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
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
  const handleLoadGoogleFont = async (fontFamily: string) => {
    const link = document.createElement('link');
    link.href = `https://fonts.googleapis.com/css2?family=${fontFamily.replace(/\s+/g, '+')}:wght@300;400;500;700&display=swap`;
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      let colorPaletteId =
        brandingState.colorPaletteId ?? brandingState.colorPalette?.id ?? null;

      // If user changed colors but palette isn't persisted yet (or needs update),
      // persist it first so we have a paletteId to apply.
      if (draftColorPalette) {
        colorPaletteId = await saveColorPalette(draftColorPalette);
        setDraftColorPalette(null);
      }

      const saveRequest: SaveTenantBrandingRequest = {
        colorPaletteId,
        fontSchemeId: brandingState.fontSchemeId ?? brandingState.fontScheme?.id,
        customCss: brandingState.customCss,
      };

      await onSave(saveRequest);
      setHasUnsavedChanges(false);

      // Refresh branding context so changes propagate immediately (sidebar, etc.)
      if (brandingContext) {
        await brandingContext.refreshBranding();
        brandingContext.triggerCrossTabUpdate();
      }
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

  // Calculate brand completion percentage
  const calculateBrandCompletion = () => {
    let completed = 0;
    const total = 5; // logos (3 types count as 1), colors, fonts

    if (brandingState.logos.login || brandingState.logos.sidebar || brandingState.logos.favicon) completed++;
    if (brandingState.logos.login && brandingState.logos.sidebar && brandingState.logos.favicon) completed++; // bonus for all logos
    if (brandingState.colorPalette) completed++;
    if (brandingState.fontScheme) completed++;
    // Theme customization counts as 1
    completed++; // Base theme is always configured

    return Math.round((completed / total) * 100);
  };

  const brandCompletion = calculateBrandCompletion();

  // Get status items for checklist
  const getStatusItems = () => [
    {
      label: 'Logo da página de login',
      done: !!brandingState.logos.login,
      tab: 'logos' as const
    },
    {
      label: 'Logo da sidebar',
      done: !!brandingState.logos.sidebar,
      tab: 'logos' as const
    },
    {
      label: 'Favicon personalizado',
      done: !!brandingState.logos.favicon,
      tab: 'logos' as const
    },
    {
      label: 'Paleta de cores definida',
      done: !!brandingState.colorPalette,
      tab: 'colors' as const
    },
    {
      label: 'Esquema de fontes configurado',
      done: !!brandingState.fontScheme,
      tab: 'fonts' as const
    },
  ];

  return (
    <Card className="w-full border-none shadow-none">
      <CardContent className="p-0">
        <div className="flex flex-col space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5 h-12 p-1 bg-muted/50">
              <TabsTrigger value="overview" className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <Sparkles className="h-4 w-4" />
                <span className="hidden sm:inline">Visão Geral</span>
              </TabsTrigger>
              <TabsTrigger value="logos" className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <ImageIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Logos</span>
              </TabsTrigger>
              <TabsTrigger value="colors" className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <Palette className="h-4 w-4" />
                <span className="hidden sm:inline">Cores</span>
              </TabsTrigger>
              <TabsTrigger value="fonts" className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <Type className="h-4 w-4" />
                <span className="hidden sm:inline">Fontes</span>
              </TabsTrigger>
              <TabsTrigger value="theme" className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <Settings2 className="h-4 w-4" />
                <span className="hidden sm:inline">Tema</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-8 space-y-8">
              {/* Brand Completion Progress */}
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/5 via-primary/10 to-accent/5 border border-primary/10 p-6">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="relative">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">Personalização da Marca</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {brandCompletion === 100
                          ? 'Parabéns! Sua marca está completamente personalizada.'
                          : 'Complete as etapas abaixo para personalizar sua marca.'}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-3xl font-bold text-primary">{brandCompletion}%</div>
                        <div className="text-xs text-muted-foreground">completo</div>
                      </div>
                    </div>
                  </div>
                  <Progress value={brandCompletion} className="h-2 bg-primary/20" />
                </div>
              </div>

              {/* Two Column Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left: Brand Preview */}
                <Card className="overflow-hidden border-2 border-dashed border-muted-foreground/20 hover:border-primary/30 transition-colors">
                  <CardHeader className="pb-3 bg-muted/30">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Monitor className="h-4 w-4 text-muted-foreground" />
                        Preview da Marca
                      </CardTitle>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <Monitor className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <Smartphone className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    {/* Mini Mockup of Brand Application */}
                    <div className="relative bg-background">
                      {/* Mockup Sidebar */}
                      <div className="flex">
                        <div
                          className="w-16 min-h-[200px] border-r flex flex-col items-center py-4 gap-3"
                          style={{
                            backgroundColor: brandingState.colorPalette?.sidebarBackground || 'hsl(var(--sidebar-background))',
                            color: brandingState.colorPalette?.sidebarForeground || 'hsl(var(--sidebar-foreground))'
                          }}
                        >
                          {/* Sidebar Logo Preview */}
                          <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center overflow-hidden">
                            {brandingState.logos.sidebar ? (
                              /* eslint-disable-next-line @next/next/no-img-element */
                              <img
                                src={brandingState.logos.sidebar}
                                alt="Logo"
                                className="w-8 h-8 object-contain"
                              />
                            ) : (
                              <div className="w-6 h-6 rounded bg-white/20" />
                            )}
                          </div>
                          {/* Menu Items */}
                          <div className="space-y-2 w-full px-2">
                            <div
                              className="h-8 rounded-md"
                              style={{
                                backgroundColor: brandingState.colorPalette?.sidebarPrimary || 'hsl(var(--sidebar-primary))'
                              }}
                            />
                            <div className="h-8 rounded-md bg-white/5" />
                            <div className="h-8 rounded-md bg-white/5" />
                          </div>
                        </div>
                        {/* Mockup Content */}
                        <div
                          className="flex-1 p-4"
                          style={{
                            backgroundColor: brandingState.colorPalette?.backgroundColor || 'hsl(var(--background))',
                            color: brandingState.colorPalette?.foregroundColor || 'hsl(var(--foreground))'
                          }}
                        >
                          <div className="space-y-3">
                            <div className="h-4 w-32 rounded bg-current opacity-80" />
                            <div className="h-3 w-48 rounded bg-current opacity-40" />
                            <div className="flex gap-2 mt-4">
                              <div
                                className="h-8 w-20 rounded-md flex items-center justify-center text-xs font-medium"
                                style={{
                                  backgroundColor: brandingState.colorPalette?.primaryColor || 'hsl(var(--primary))',
                                  color: brandingState.colorPalette?.primaryForeground || 'hsl(var(--primary-foreground))'
                                }}
                              >
                                Botão
                              </div>
                              <div
                                className="h-8 w-20 rounded-md border flex items-center justify-center text-xs"
                                style={{
                                  borderColor: brandingState.colorPalette?.primaryColor || 'hsl(var(--primary))',
                                  color: brandingState.colorPalette?.primaryColor || 'hsl(var(--primary))'
                                }}
                              >
                                Outline
                              </div>
                            </div>
                            {/* Card Preview */}
                            <div
                              className="mt-4 p-3 rounded-lg border"
                              style={{
                                backgroundColor: brandingState.colorPalette?.cardColor || 'hsl(var(--card))',
                                borderColor: brandingState.colorPalette?.mutedColor || 'hsl(var(--border))'
                              }}
                            >
                              <div className="h-3 w-24 rounded bg-current opacity-70" />
                              <div className="h-2 w-32 rounded bg-current opacity-30 mt-2" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Right: Checklist & Quick Actions */}
                <div className="space-y-6">
                  {/* Status Checklist */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Lista de Verificação</CardTitle>
                      <CardDescription>Itens para completar sua personalização</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-1">
                      {getStatusItems().map((item, index) => (
                        <button
                          key={index}
                          onClick={() => setActiveTab(item.tab)}
                          className={`
                            w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all
                            hover:bg-muted/50 group cursor-pointer
                            ${item.done ? 'text-muted-foreground' : 'text-foreground'}
                          `}
                        >
                          <div className={`
                            w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0
                            transition-colors
                            ${item.done
                              ? 'bg-green-500 border-green-500 text-white'
                              : 'border-muted-foreground/30 group-hover:border-primary/50'
                            }
                          `}>
                            {item.done && <Check className="h-3 w-3" />}
                          </div>
                          <span className={`flex-1 text-sm ${item.done ? 'line-through' : 'font-medium'}`}>
                            {item.label}
                          </span>
                          <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      ))}
                    </CardContent>
                  </Card>

                  {/* Quick Actions Grid */}
                  <div className="grid grid-cols-1 gap-3">
                    <button
                      onClick={() => setActiveTab('logos')}
                      className="group relative overflow-hidden rounded-xl border bg-card p-4 text-left transition-all hover:shadow-md hover:border-primary/30 cursor-pointer"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="relative flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600">
                          <Upload className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-sm">Enviar Logos</div>
                          <div className="text-xs text-muted-foreground">Login, sidebar e favicon</div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                    </button>

                    <button
                      onClick={() => setActiveTab('colors')}
                      className="group relative overflow-hidden rounded-xl border bg-card p-4 text-left transition-all hover:shadow-md hover:border-primary/30 cursor-pointer"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-pink-500/5 to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="relative flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-pink-500/10 flex items-center justify-center text-pink-600">
                          <Palette className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-sm">Configurar Cores</div>
                          <div className="text-xs text-muted-foreground">Paleta personalizada</div>
                        </div>
                        <div className="flex gap-1 mr-2">
                          {brandingState.colorPalette ? (
                            <>
                              <div className="w-4 h-4 rounded-full border shadow-sm" style={{ backgroundColor: brandingState.colorPalette.primaryColor }} />
                              <div className="w-4 h-4 rounded-full border shadow-sm" style={{ backgroundColor: brandingState.colorPalette.secondaryColor }} />
                              <div className="w-4 h-4 rounded-full border shadow-sm" style={{ backgroundColor: brandingState.colorPalette.accentColor }} />
                            </>
                          ) : (
                            <>
                              <div className="w-4 h-4 rounded-full bg-slate-200" />
                              <div className="w-4 h-4 rounded-full bg-slate-300" />
                              <div className="w-4 h-4 rounded-full bg-slate-400" />
                            </>
                          )}
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                    </button>

                    <button
                      onClick={() => setActiveTab('fonts')}
                      className="group relative overflow-hidden rounded-xl border bg-card p-4 text-left transition-all hover:shadow-md hover:border-primary/30 cursor-pointer"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-teal-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="relative flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center text-green-600">
                          <Type className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-sm">Escolher Fontes</div>
                          <div className="text-xs text-muted-foreground">
                            {brandingState.fontScheme?.fontSans?.[0] || 'System default'}
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="logos" className="mt-8">
              <div className="space-y-6">
                {/* Section Header */}
                <div className="flex items-center justify-between pb-4 border-b">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600">
                      <ImageIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold">Logos da Marca</h3>
                      <p className="text-xs text-muted-foreground">
                        Faça upload dos logos para diferentes contextos do sistema
                      </p>
                    </div>
                  </div>
                  {/* Auto-save indicator */}
                  <Badge variant="success" className="gap-1.5">
                    <Check className="h-3 w-3" />
                    Salvamento automático
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <LogoUploadComponent
                    logoType="login"
                    currentLogoUrl={brandingState.logos.login || undefined}
                    onUpload={handleLogoUpload}
                    onRemove={handleLogoRemove}
                    maxFileSize={5 * 1024 * 1024}
                    acceptedFormats={['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml']}
                  />

                  <LogoUploadComponent
                    logoType="sidebar"
                    currentLogoUrl={brandingState.logos.sidebar || undefined}
                    onUpload={handleLogoUpload}
                    onRemove={handleLogoRemove}
                    maxFileSize={5 * 1024 * 1024}
                    acceptedFormats={['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml']}
                  />

                  <LogoUploadComponent
                    logoType="favicon"
                    currentLogoUrl={brandingState.logos.favicon || undefined}
                    onUpload={handleLogoUpload}
                    onRemove={handleLogoRemove}
                    maxFileSize={1 * 1024 * 1024}
                    acceptedFormats={['image/png', 'image/x-icon', 'image/svg+xml']}
                  />
                </div>

                {/* Footer info */}
                <div className="flex items-center justify-center pt-4 border-t text-sm text-muted-foreground">
                  <p>Os logos são salvos automaticamente após o upload. Para remover, passe o mouse sobre o logo.</p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="colors" className="mt-8">
              <div className="space-y-6">
                {/* Section Header */}
                <div className="flex items-center justify-between pb-4 border-b">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-pink-500/10 flex items-center justify-center text-pink-600">
                      <Palette className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold">Paleta de Cores</h3>
                      <p className="text-xs text-muted-foreground">
                        Defina as cores que representam sua identidade visual
                      </p>
                    </div>
                  </div>
                </div>

                <ColorPaletteEditor
                  currentPalette={currentBranding?.colorPalette}
                  onSave={handleColorPaletteSave}
                  onPreview={handleColorPalettePreview}
                  onValidate={handleColorPaletteValidate}
                />

                {/* Footer Actions */}
                <div className="flex items-center justify-between pt-6 border-t">
                  <Button
                    onClick={handleReset}
                    variant="ghost"
                    size="sm"
                    disabled={isSaving || isResetting}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    {isResetting ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <RotateCcw className="h-4 w-4 mr-2" />
                    )}
                    Restaurar Cores Padrão
                  </Button>
                  <div className="flex items-center gap-3">
                    {hasUnsavedChanges && (
                      <span className="text-sm text-amber-600 dark:text-amber-400 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                        Alterações pendentes
                      </span>
                    )}
                    <Button
                      onClick={handleSave}
                      disabled={!hasUnsavedChanges || isSaving || isResetting}
                      size="sm"
                    >
                      {isSaving ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      Aplicar Paleta
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="fonts" className="mt-8">
              <div className="space-y-6">
                {/* Section Header */}
                <div className="flex items-center justify-between pb-4 border-b">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center text-green-600">
                      <Type className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold">Tipografia</h3>
                      <p className="text-xs text-muted-foreground">
                        Escolha as fontes que representam sua marca
                      </p>
                    </div>
                  </div>
                </div>

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
              </div>
            </TabsContent>

            <TabsContent value="theme" className="mt-8">
              <div className="space-y-6">
                {/* Section Header */}
                <div className="flex items-center justify-between pb-4 border-b">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-600">
                      <Settings2 className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold">Configurações de Tema</h3>
                      <p className="text-xs text-muted-foreground">
                        Ajuste a aparência e layout do sistema
                      </p>
                    </div>
                  </div>
                  {/* Auto-save indicator */}
                  <Badge variant="success" className="gap-1.5">
                    <Check className="h-3 w-3" />
                    Salvamento automático
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <PresetSelector />
                  <ThemeScaleSelector />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <ThemeRadiusSelector />
                  <ColorModeSelector />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <ContentLayoutSelector />
                  <SidebarModeSelector />
                </div>

                {/* Footer */}
                <div className="flex items-center justify-center pt-6 border-t">
                  <ResetThemeButton />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </CardContent>
    </Card>
  );
}
