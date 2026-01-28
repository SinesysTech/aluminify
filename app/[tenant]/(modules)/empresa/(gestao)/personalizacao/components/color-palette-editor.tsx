"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/app/shared/components/forms/input';
import { Label } from '@/app/shared/components/forms/label';
import { Alert, AlertDescription } from '@/app/shared/components/feedback/alert';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle,
  Loader2,
  Copy,
  Check,
  Sparkles,
  Eye,
} from 'lucide-react';
import type {
  ColorPaletteEditorProps,
  CreateColorPaletteRequest,
  AccessibilityReport
} from '@/app/[tenant]/(modules)/empresa/(gestao)/personalizacao/services/brand-customization.types';

interface ColorInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  description?: string;
  required?: boolean;
  disabled?: boolean;
}

interface ColorPreviewProps {
  colors: CreateColorPaletteRequest;
  className?: string;
}

interface PresetPalette {
  id: string;
  name: string;
  colors: Partial<CreateColorPaletteRequest>;
  category: 'default' | 'brand' | 'custom';
}

// Color input component with live preview
function ColorInput({ label, value, onChange, description, required = false, disabled = false }: ColorInputProps) {
  const [localValue, setLocalValue] = useState(value);
  const [isValid, setIsValid] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const validateColor = useCallback((color: string): boolean => {
    // Validate hex color format
    const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    return hexRegex.test(color);
  }, []);

  const handleChange = useCallback((newValue: string) => {
    setLocalValue(newValue);
    const valid = validateColor(newValue);
    setIsValid(valid);

    if (valid) {
      onChange(newValue);
    }
  }, [onChange, validateColor]);

  const handleBlur = useCallback(() => {
    if (!isValid && localValue) {
      // Try to fix common issues
      let fixedValue = localValue;
      if (!fixedValue.startsWith('#')) {
        fixedValue = '#' + fixedValue;
      }
      if (validateColor(fixedValue)) {
        setLocalValue(fixedValue);
        setIsValid(true);
        onChange(fixedValue);
      }
    }
  }, [localValue, isValid, onChange, validateColor]);

  const copyToClipboard = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy color:', error);
    }
  }, [value]);

  return (
    <div className="space-y-1.5">
      <Label htmlFor={label} className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </Label>

      <div className="relative flex items-center group">
        <div className="absolute left-2 top-1/2 -translate-y-1/2 z-10 flex items-center">
          <div
            className="w-7 h-7 rounded-lg border-2 border-border shadow-sm overflow-hidden relative cursor-pointer hover:scale-105 hover:border-primary/50 transition-all"
            style={{ backgroundColor: isValid ? localValue : 'transparent' }}
          >
            <input
              type="color"
              value={isValid ? localValue : '#000000'}
              onChange={(e) => handleChange(e.target.value)}
              disabled={disabled}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full p-0 border-0"
            />
          </div>
        </div>
        <Input
          id={label}
          type="text"
          value={localValue}
          onChange={(e) => handleChange(e.target.value)}
          onBlur={handleBlur}
          placeholder="#000000"
          disabled={disabled}
          className={`pl-11 pr-9 font-mono text-sm uppercase h-10 ${!isValid ? 'border-destructive focus-visible:ring-destructive' : ''}`}
        />
        <button
          onClick={copyToClipboard}
          type="button"
          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          title="Copiar código HEX"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
      </div>

      {description && (
        <p className="text-[10px] text-muted-foreground leading-tight">{description}</p>
      )}

      {!isValid && (
        <p className="text-[10px] text-destructive">Formato inválido</p>
      )}
    </div>
  );
}

// Color preview component showing how colors look together
function ColorPreview({ colors, className = "" }: ColorPreviewProps) {
  return (
    <div className={`${className}`}>
      {/* Color Swatches Bar */}
      <div className="flex h-3">
        <div className="flex-1" style={{ backgroundColor: colors.primaryColor }} />
        <div className="flex-1" style={{ backgroundColor: colors.secondaryColor }} />
        <div className="flex-1" style={{ backgroundColor: colors.accentColor }} />
        <div className="flex-1" style={{ backgroundColor: colors.mutedColor }} />
      </div>

      {/* Mini App Preview */}
      <div
        className="min-h-[280px]"
        style={{
          backgroundColor: colors.backgroundColor,
          color: colors.foregroundColor
        }}
      >
        {/* Header */}
        <div className="flex items-center gap-2 px-4 py-3 border-b" style={{ borderColor: colors.mutedColor }}>
          <div className="w-6 h-6 rounded" style={{ backgroundColor: colors.primaryColor }} />
          <div className="h-3 w-20 rounded" style={{ backgroundColor: colors.foregroundColor, opacity: 0.7 }} />
          <div className="ml-auto flex gap-1">
            <div className="w-6 h-6 rounded" style={{ backgroundColor: colors.mutedColor }} />
            <div className="w-6 h-6 rounded" style={{ backgroundColor: colors.mutedColor }} />
          </div>
        </div>

        <div className="flex">
          {/* Mini Sidebar */}
          <div
            className="w-12 min-h-[200px] py-3 px-1.5 space-y-1.5"
            style={{
              backgroundColor: colors.sidebarBackground,
              color: colors.sidebarForeground
            }}
          >
            <div
              className="w-full h-7 rounded-md"
              style={{
                backgroundColor: colors.sidebarPrimary,
                color: colors.sidebarPrimaryForeground
              }}
            />
            <div className="w-full h-7 rounded-md" style={{ backgroundColor: `${colors.sidebarForeground}10` }} />
            <div className="w-full h-7 rounded-md" style={{ backgroundColor: `${colors.sidebarForeground}10` }} />
          </div>

          {/* Content Area */}
          <div className="flex-1 p-4 space-y-3">
            {/* Page Title */}
            <div className="h-4 w-24 rounded" style={{ backgroundColor: colors.foregroundColor, opacity: 0.8 }} />
            <div className="h-3 w-40 rounded" style={{ backgroundColor: colors.mutedForeground, opacity: 0.5 }} />

            {/* Card */}
            <div
              className="p-3 rounded-lg border mt-3"
              style={{
                backgroundColor: colors.cardColor,
                color: colors.cardForeground,
                borderColor: colors.mutedColor
              }}
            >
              <div className="h-3 w-20 rounded mb-2" style={{ backgroundColor: colors.cardForeground, opacity: 0.7 }} />
              <div className="h-2 w-full rounded mb-1" style={{ backgroundColor: colors.mutedForeground, opacity: 0.3 }} />
              <div className="h-2 w-3/4 rounded" style={{ backgroundColor: colors.mutedForeground, opacity: 0.3 }} />

              {/* Buttons */}
              <div className="flex gap-2 mt-3">
                <div
                  className="px-3 py-1.5 rounded text-[10px] font-medium"
                  style={{
                    backgroundColor: colors.primaryColor,
                    color: colors.primaryForeground
                  }}
                >
                  Primário
                </div>
                <div
                  className="px-3 py-1.5 rounded text-[10px] font-medium border"
                  style={{
                    backgroundColor: 'transparent',
                    borderColor: colors.primaryColor,
                    color: colors.primaryColor
                  }}
                >
                  Outline
                </div>
                <div
                  className="px-3 py-1.5 rounded text-[10px] font-medium"
                  style={{
                    backgroundColor: colors.destructiveColor,
                    color: colors.destructiveForeground
                  }}
                >
                  Erro
                </div>
              </div>
            </div>

            {/* Input Preview */}
            <div
              className="h-9 rounded-md border px-3 flex items-center"
              style={{
                backgroundColor: colors.backgroundColor,
                borderColor: colors.mutedColor
              }}
            >
              <span className="text-[10px]" style={{ color: colors.mutedForeground }}>Digite algo...</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ColorPaletteEditor({
  currentPalette,
  onSave: _onSave,
  onPreview: _onPreview,
  onValidate
}: ColorPaletteEditorProps) {
  // State management
  const [paletteData, setPaletteData] = useState<CreateColorPaletteRequest>({
    name: currentPalette?.name || '',
    primaryColor: currentPalette?.primaryColor || '#0f172a',
    primaryForeground: currentPalette?.primaryForeground || '#f8fafc',
    secondaryColor: currentPalette?.secondaryColor || '#f1f5f9',
    secondaryForeground: currentPalette?.secondaryForeground || '#0f172a',
    accentColor: currentPalette?.accentColor || '#3b82f6',
    accentForeground: currentPalette?.accentForeground || '#f8fafc',
    mutedColor: currentPalette?.mutedColor || '#f1f5f9',
    mutedForeground: currentPalette?.mutedForeground || '#64748b',
    backgroundColor: currentPalette?.backgroundColor || '#ffffff',
    foregroundColor: currentPalette?.foregroundColor || '#0f172a',
    cardColor: currentPalette?.cardColor || '#ffffff',
    cardForeground: currentPalette?.cardForeground || '#0f172a',
    destructiveColor: currentPalette?.destructiveColor || '#ef4444',
    destructiveForeground: currentPalette?.destructiveForeground || '#f8fafc',
    sidebarBackground: currentPalette?.sidebarBackground || '#f8fafc',
    sidebarForeground: currentPalette?.sidebarForeground || '#0f172a',
    sidebarPrimary: currentPalette?.sidebarPrimary || '#3b82f6',
    sidebarPrimaryForeground: currentPalette?.sidebarPrimaryForeground || '#f8fafc',
  });

  const [isValidating, setIsValidating] = useState(false);
  const [accessibilityReport, setAccessibilityReport] = useState<AccessibilityReport | null>(null);



  // Preset palettes for quick selection
  const presetPalettes: PresetPalette[] = useMemo(() => [
    {
      id: 'default-light',
      name: 'Padrão Claro',
      category: 'default',
      colors: {
        primaryColor: '#0f172a',
        primaryForeground: '#f8fafc',
        secondaryColor: '#f1f5f9',
        secondaryForeground: '#0f172a',
        accentColor: '#3b82f6',
        accentForeground: '#f8fafc',
        backgroundColor: '#ffffff',
        foregroundColor: '#0f172a',
      }
    },
    {
      id: 'default-dark',
      name: 'Padrão Escuro',
      category: 'default',
      colors: {
        primaryColor: '#f8fafc',
        primaryForeground: '#0f172a',
        secondaryColor: '#1e293b',
        secondaryForeground: '#f8fafc',
        accentColor: '#3b82f6',
        accentForeground: '#f8fafc',
        backgroundColor: '#0f172a',
        foregroundColor: '#f8fafc',
      }
    },
    {
      id: 'brand-blue',
      name: 'Azul Corporativo',
      category: 'brand',
      colors: {
        primaryColor: '#1e40af',
        primaryForeground: '#ffffff',
        secondaryColor: '#dbeafe',
        secondaryForeground: '#1e40af',
        accentColor: '#3b82f6',
        accentForeground: '#ffffff',
        backgroundColor: '#ffffff',
        foregroundColor: '#1f2937',
      }
    },
    {
      id: 'brand-green',
      name: 'Verde Natureza',
      category: 'brand',
      colors: {
        primaryColor: '#059669',
        primaryForeground: '#ffffff',
        secondaryColor: '#d1fae5',
        secondaryForeground: '#059669',
        accentColor: '#10b981',
        accentForeground: '#ffffff',
        backgroundColor: '#ffffff',
        foregroundColor: '#1f2937',
      }
    },
    {
      id: 'brand-purple',
      name: 'Roxo Criativo',
      category: 'brand',
      colors: {
        primaryColor: '#7c3aed',
        primaryForeground: '#ffffff',
        secondaryColor: '#ede9fe',
        secondaryForeground: '#7c3aed',
        accentColor: '#8b5cf6',
        accentForeground: '#ffffff',
        backgroundColor: '#ffffff',
        foregroundColor: '#1f2937',
      }
    }
  ], []);

  // Initialize palette data when currentPalette changes
  useEffect(() => {
    if (currentPalette) {
      setPaletteData({
        name: currentPalette.name,
        primaryColor: currentPalette.primaryColor,
        primaryForeground: currentPalette.primaryForeground,
        secondaryColor: currentPalette.secondaryColor,
        secondaryForeground: currentPalette.secondaryForeground,
        accentColor: currentPalette.accentColor,
        accentForeground: currentPalette.accentForeground,
        mutedColor: currentPalette.mutedColor,
        mutedForeground: currentPalette.mutedForeground,
        backgroundColor: currentPalette.backgroundColor,
        foregroundColor: currentPalette.foregroundColor,
        cardColor: currentPalette.cardColor,
        cardForeground: currentPalette.cardForeground,
        destructiveColor: currentPalette.destructiveColor,
        destructiveForeground: currentPalette.destructiveForeground,
        sidebarBackground: currentPalette.sidebarBackground,
        sidebarForeground: currentPalette.sidebarForeground,
        sidebarPrimary: currentPalette.sidebarPrimary,
        sidebarPrimaryForeground: currentPalette.sidebarPrimaryForeground,
      });
    }
  }, [currentPalette]);





  // Handle palette data updates
  const updatePaletteData = useCallback((field: keyof CreateColorPaletteRequest, value: string) => {
    setPaletteData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  // Handle preset selection
  const applyPreset = useCallback((preset: PresetPalette) => {
    setPaletteData(prev => ({
      ...prev,
      ...preset.colors,
      name: prev.name || preset.name
    }));
  }, []);

  // Handle accessibility validation
  const handleValidateAccessibility = useCallback(async () => {
    try {
      setIsValidating(true);
      const report = await onValidate(paletteData);
      setAccessibilityReport(report);
    } catch (error) {
      console.error('Accessibility validation failed:', error);
      setAccessibilityReport({
        isCompliant: false,
        contrastRatios: {
          primaryOnBackground: 0,
          secondaryOnBackground: 0,
          accentOnBackground: 0
        },
        warnings: ['Falha ao validar acessibilidade. Por favor, verifique suas cores manualmente.']
      });
    } finally {
      setIsValidating(false);
    }
  }, [paletteData, onValidate]);



  return (
    <div className="space-y-6">


      {/* Preset Palettes - Visual Cards */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-4 w-4 text-primary" />
          <h4 className="text-sm font-medium">Paletas Predefinidas</h4>
          <Badge variant="secondary" className="text-xs">Clique para aplicar</Badge>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {presetPalettes.map((preset) => (
            <button
              key={preset.id}
              onClick={() => applyPreset(preset)}
              className="group relative p-3 rounded-xl border bg-card hover:shadow-md hover:border-primary/50 transition-all cursor-pointer text-left"
            >
              {/* Color Swatches */}
              <div className="flex gap-1 mb-2">
                {Object.entries(preset.colors).slice(0, 4).map(([key, color]) => (
                  <div
                    key={key}
                    className="flex-1 h-8 first:rounded-l-lg last:rounded-r-lg"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <span className="text-xs font-medium truncate block">{preset.name}</span>
              {/* Hover indicator */}
              <div className="absolute inset-0 rounded-xl ring-2 ring-primary ring-offset-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            </button>
          ))}
        </div>
      </div>

      <Separator />

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Color Editor */}
        {/* Left Column - Color Editor */}
        <div className="space-y-8">
          {/* Palette Name */}
          <div className="space-y-2">
            <Label htmlFor="palette-name" className="text-base font-semibold">Nome da Paleta</Label>
            <Input
              id="palette-name"
              value={paletteData.name}
              onChange={(e) => updatePaletteData('name', e.target.value)}
              placeholder="Ex: Minha Marca"
              className="max-w-md"
            />
            <p className="text-sm text-muted-foreground">Dê um nome único para identificar sua personalização.</p>
          </div>

          <Separator />

          {/* Core Colors */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-1 h-6 rounded-full bg-primary" />
              <h4 className="text-sm font-semibold text-foreground">Cores Principais</h4>
            </div>
            <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-muted/30 border">
              <ColorInput
                label="Primária"
                value={paletteData.primaryColor}
                onChange={(value) => updatePaletteData('primaryColor', value)}
                required
                description="Cor principal da marca, usada em botões e destaques."
              />
              <ColorInput
                label="Texto Primário"
                value={paletteData.primaryForeground}
                onChange={(value) => updatePaletteData('primaryForeground', value)}
                required
                description="Cor do texto sobre a cor primária."
              />
              <ColorInput
                label="Secundária"
                value={paletteData.secondaryColor}
                onChange={(value) => updatePaletteData('secondaryColor', value)}
                required
              />
              <ColorInput
                label="Texto Secundário"
                value={paletteData.secondaryForeground}
                onChange={(value) => updatePaletteData('secondaryForeground', value)}
                required
              />
              <ColorInput
                label="Destaque"
                value={paletteData.accentColor}
                onChange={(value) => updatePaletteData('accentColor', value)}
                required
              />
              <ColorInput
                label="Texto Destaque"
                value={paletteData.accentForeground}
                onChange={(value) => updatePaletteData('accentForeground', value)}
                required
              />
            </div>
          </section>

          {/* Background & Surface */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-1 h-6 rounded-full bg-secondary" />
              <h4 className="text-sm font-semibold text-foreground">Fundos e Superfícies</h4>
            </div>
            <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-muted/30 border">
              <ColorInput
                label="Fundo da Página"
                value={paletteData.backgroundColor}
                onChange={(value) => updatePaletteData('backgroundColor', value)}
                required
              />
              <ColorInput
                label="Texto Principal"
                value={paletteData.foregroundColor}
                onChange={(value) => updatePaletteData('foregroundColor', value)}
                required
              />
              <ColorInput
                label="Card (Cartões)"
                value={paletteData.cardColor}
                onChange={(value) => updatePaletteData('cardColor', value)}
                required
              />
              <ColorInput
                label="Texto Card"
                value={paletteData.cardForeground}
                onChange={(value) => updatePaletteData('cardForeground', value)}
                required
              />
              <ColorInput
                label="Suave (Muted)"
                value={paletteData.mutedColor}
                onChange={(value) => updatePaletteData('mutedColor', value)}
                required
              />
              <ColorInput
                label="Texto Suave"
                value={paletteData.mutedForeground}
                onChange={(value) => updatePaletteData('mutedForeground', value)}
                required
              />
            </div>
          </section>

          {/* Sidebar & System */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-1 h-6 rounded-full bg-accent" />
              <h4 className="text-sm font-semibold text-foreground">Barra Lateral</h4>
            </div>
            <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-muted/30 border">
              <ColorInput
                label="Fundo Sidebar"
                value={paletteData.sidebarBackground}
                onChange={(value) => updatePaletteData('sidebarBackground', value)}
                required
              />
              <ColorInput
                label="Texto Sidebar"
                value={paletteData.sidebarForeground}
                onChange={(value) => updatePaletteData('sidebarForeground', value)}
                required
              />
              <ColorInput
                label="Item Ativo"
                value={paletteData.sidebarPrimary}
                onChange={(value) => updatePaletteData('sidebarPrimary', value)}
                required
                description="Fundo do item de menu selecionado."
              />
              <ColorInput
                label="Texto Ativo"
                value={paletteData.sidebarPrimaryForeground}
                onChange={(value) => updatePaletteData('sidebarPrimaryForeground', value)}
                required
              />
            </div>
          </section>

          {/* Destructive */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-1 h-6 rounded-full bg-destructive" />
              <h4 className="text-sm font-semibold text-foreground">Sistema e Alertas</h4>
            </div>
            <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-muted/30 border">
              <ColorInput
                label="Erro/Perigo"
                value={paletteData.destructiveColor}
                onChange={(value) => updatePaletteData('destructiveColor', value)}
                required
              />
              <ColorInput
                label="Texto Erro"
                value={paletteData.destructiveForeground}
                onChange={(value) => updatePaletteData('destructiveForeground', value)}
                required
              />
            </div>
          </section>
        </div>

        {/* Right Column - Live Preview */}
        <div className="lg:sticky lg:top-4 space-y-4">
          <Card className="overflow-hidden border-2">
            <CardHeader className="pb-3 bg-muted/30 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4 text-muted-foreground" />
                  <CardTitle className="text-sm">Preview ao Vivo</CardTitle>
                </div>
                <Button
                  onClick={handleValidateAccessibility}
                  variant="ghost"
                  size="sm"
                  disabled={isValidating}
                  className="gap-1.5 text-xs h-7"
                >
                  {isValidating ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <CheckCircle className="h-3 w-3" />
                  )}
                  Validar
                </Button>
              </div>
              {/* Accessibility Report */}
              {accessibilityReport && (
                <div className={`
                  mt-2 px-2 py-1 rounded-md text-xs font-medium
                  ${accessibilityReport.isCompliant
                    ? 'bg-green-500/10 text-green-700'
                    : 'bg-destructive/10 text-destructive'
                  }
                `}>
                  {accessibilityReport.isCompliant ? '✓ Contraste adequado' : '⚠ Contraste insuficiente'}
                </div>
              )}
            </CardHeader>
            <CardContent className="p-0">
              <ColorPreview colors={paletteData} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}