"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  CheckCircle,
  Loader2,
  Copy,
  Check,
  AlertTriangle
} from 'lucide-react';
import type {
  ColorPaletteEditorProps,
  CreateColorPaletteRequest,
  AccessibilityReport
} from '@/types/brand-customization';

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
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor={label} className="text-sm font-medium">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
        {value && (
          <Button
            onClick={copyToClipboard}
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs"
          >
            {copied ? (
              <Check className="h-3 w-3" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Input
            id={label}
            type="text"
            value={localValue}
            onChange={(e) => handleChange(e.target.value)}
            onBlur={handleBlur}
            placeholder="#000000"
            disabled={disabled}
            className={`pr-12 ${!isValid ? 'border-destructive' : ''}`}
          />
          <div
            className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded border border-border"
            style={{ backgroundColor: isValid ? localValue : '#transparent' }}
          />
        </div>

        <input
          type="color"
          value={isValid ? localValue : '#000000'}
          onChange={(e) => handleChange(e.target.value)}
          disabled={disabled}
          className="w-10 h-9 rounded border border-border cursor-pointer disabled:cursor-not-allowed"
        />
      </div>

      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}

      {!isValid && (
        <p className="text-xs text-destructive">Por favor, insira uma cor hexadecimal válida (ex: #FF0000)</p>
      )}
    </div>
  );
}

// Color preview component showing how colors look together
function ColorPreview({ colors, className = "" }: ColorPreviewProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      <div className="grid grid-cols-2 gap-4">
        {/* Primary color preview */}
        <div
          className="p-4 rounded-lg border"
          style={{
            backgroundColor: colors.primaryColor,
            color: colors.primaryForeground,
            borderColor: colors.primaryColor
          }}
        >
          <div className="font-medium">Primária</div>
          <div className="text-sm opacity-90">Conteúdo primário</div>
        </div>

        {/* Secondary color preview */}
        <div
          className="p-4 rounded-lg border"
          style={{
            backgroundColor: colors.secondaryColor,
            color: colors.secondaryForeground,
            borderColor: colors.secondaryColor
          }}
        >
          <div className="font-medium">Secundária</div>
          <div className="text-sm opacity-90">Conteúdo secundário</div>
        </div>

        {/* Accent color preview */}
        <div
          className="p-4 rounded-lg border"
          style={{
            backgroundColor: colors.accentColor,
            color: colors.accentForeground,
            borderColor: colors.accentColor
          }}
        >
          <div className="font-medium">Destaque</div>
          <div className="text-sm opacity-90">Conteúdo destaque</div>
        </div>

        {/* Muted color preview */}
        <div
          className="p-4 rounded-lg border"
          style={{
            backgroundColor: colors.mutedColor,
            color: colors.mutedForeground,
            borderColor: colors.mutedColor
          }}
        >
          <div className="font-medium">Suave</div>
          <div className="text-sm opacity-90">Conteúdo suave</div>
        </div>
      </div>

      {/* Card preview */}
      <div
        className="p-4 rounded-lg border"
        style={{
          backgroundColor: colors.cardColor,
          color: colors.cardForeground,
          borderColor: colors.mutedColor
        }}
      >
        <div className="font-medium mb-2">Exemplo de Card</div>
        <div className="text-sm text-muted-foreground mb-3">
          É assim que os cards aparecerão com sua paleta de cores.
        </div>
        <div className="flex gap-2">
          <div
            className="px-3 py-1 rounded text-xs font-medium"
            style={{
              backgroundColor: colors.primaryColor,
              color: colors.primaryForeground
            }}
          >
            Botão Primário
          </div>
          <div
            className="px-3 py-1 rounded text-xs font-medium border"
            style={{
              borderColor: colors.primaryColor,
              color: colors.primaryColor
            }}
          >
            Botão Outline
          </div>
        </div>
      </div>

      {/* Sidebar preview */}
      <div
        className="p-4 rounded-lg border"
        style={{
          backgroundColor: colors.sidebarBackground,
          color: colors.sidebarForeground,
          borderColor: colors.mutedColor
        }}
      >
        <div className="font-medium mb-2">Visualização da Barra Lateral</div>
        <div
          className="px-2 py-1 rounded text-sm"
          style={{
            backgroundColor: colors.sidebarPrimary,
            color: colors.sidebarPrimaryForeground
          }}
        >
          Item de Menu Ativo
        </div>
      </div>
    </div>
  );
}

export function ColorPaletteEditor({
  currentPalette,
  onSave,
  onPreview,
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
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [previewMode, setPreviewMode] = useState(false);

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

  // Auto-preview when palette data changes
  useEffect(() => {
    if (previewMode) {
      onPreview(paletteData);
    }
  }, [paletteData, previewMode, onPreview]);

  // Validation function
  const validatePalette = useCallback((): string[] => {
    const errors: string[] = [];

    if (!paletteData.name.trim()) {
      errors.push('Nome da paleta é obrigatório');
    }

    if (paletteData.name.length > 100) {
      errors.push('Nome da paleta deve ter menos de 100 caracteres');
    }

    // Validate all color fields are valid hex colors
    const colorFields = [
      'primaryColor', 'primaryForeground', 'secondaryColor', 'secondaryForeground',
      'accentColor', 'accentForeground', 'mutedColor', 'mutedForeground',
      'backgroundColor', 'foregroundColor', 'cardColor', 'cardForeground',
      'destructiveColor', 'destructiveForeground', 'sidebarBackground',
      'sidebarForeground', 'sidebarPrimary', 'sidebarPrimaryForeground'
    ];

    const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;

    for (const field of colorFields) {
      const value = paletteData[field as keyof CreateColorPaletteRequest] as string;
      if (!hexRegex.test(value)) {
        errors.push(`${field.replace(/([A-Z])/g, ' $1').toLowerCase()} deve ser uma cor hexadecimal válida`);
      }
    }

    return errors;
  }, [paletteData]);

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

  // Toggle preview mode
  const togglePreview = useCallback(() => {
    setPreviewMode(prev => {
      const newPreviewMode = !prev;
      if (newPreviewMode) {
        onPreview(paletteData);
      }
      return newPreviewMode;
    });
  }, [paletteData, onPreview]);

  // Save palette (calls parent onSave)
  const savePalette = useCallback(async () => {
    const errors = validatePalette();
    setValidationErrors(errors);
    if (errors.length === 0) {
      await onSave(paletteData);
    }
  }, [paletteData, onSave, validatePalette]);

  return (
    <div className="space-y-6">
      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              {validationErrors.map((error, index) => (
                <div key={index} className="text-sm">• {error}</div>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Preset Palettes - Quick Selection */}
      <div className="flex flex-wrap gap-2">
        {presetPalettes.map((preset) => (
          <Button
            key={preset.id}
            onClick={() => applyPreset(preset)}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <div className="flex gap-1">
              {Object.entries(preset.colors).slice(0, 3).map(([key, color]) => (
                <div
                  key={key}
                  className="w-3 h-3 rounded-full border border-border"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            {preset.name}
          </Button>
        ))}
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Color Editor */}
        <div className="space-y-4">
          {/* Palette Name */}
          <div>
            <Label htmlFor="palette-name">Nome da Paleta</Label>
            <Input
              id="palette-name"
              value={paletteData.name}
              onChange={(e) => updatePaletteData('name', e.target.value)}
              placeholder="Ex: Minha Marca"
              className="mt-1"
            />
          </div>

          <Separator />

          {/* Core Colors */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground">Cores Principais</h4>
            <div className="grid grid-cols-2 gap-3">
              <ColorInput
                label="Primária"
                value={paletteData.primaryColor}
                onChange={(value) => updatePaletteData('primaryColor', value)}
                required
              />
              <ColorInput
                label="Texto Primário"
                value={paletteData.primaryForeground}
                onChange={(value) => updatePaletteData('primaryForeground', value)}
                required
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
          </div>

          <Separator />

          {/* Background & Surface */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground">Fundos</h4>
            <div className="grid grid-cols-2 gap-3">
              <ColorInput
                label="Fundo"
                value={paletteData.backgroundColor}
                onChange={(value) => updatePaletteData('backgroundColor', value)}
                required
              />
              <ColorInput
                label="Texto"
                value={paletteData.foregroundColor}
                onChange={(value) => updatePaletteData('foregroundColor', value)}
                required
              />
              <ColorInput
                label="Card"
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
                label="Suave"
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
          </div>

          <Separator />

          {/* Sidebar & System */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground">Barra Lateral</h4>
            <div className="grid grid-cols-2 gap-3">
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
                label="Ativo Sidebar"
                value={paletteData.sidebarPrimary}
                onChange={(value) => updatePaletteData('sidebarPrimary', value)}
                required
              />
              <ColorInput
                label="Texto Ativo"
                value={paletteData.sidebarPrimaryForeground}
                onChange={(value) => updatePaletteData('sidebarPrimaryForeground', value)}
                required
              />
            </div>
          </div>

          <Separator />

          {/* Destructive */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground">Sistema</h4>
            <div className="grid grid-cols-2 gap-3">
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
          </div>
        </div>

        {/* Right Column - Live Preview */}
        <div className="lg:sticky lg:top-4 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-muted-foreground">Visualização</h4>
            <Button
              onClick={handleValidateAccessibility}
              variant="ghost"
              size="sm"
              disabled={isValidating}
              className="gap-1 text-xs"
            >
              {isValidating ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <CheckCircle className="h-3 w-3" />
              )}
              Validar Contraste
            </Button>
          </div>

          {/* Accessibility Report */}
          {accessibilityReport && (
            <Alert variant={accessibilityReport.isCompliant ? "default" : "destructive"} className="py-2">
              <AlertDescription className="text-xs">
                {accessibilityReport.isCompliant ? 'Contraste OK' : 'Contraste insuficiente'}
              </AlertDescription>
            </Alert>
          )}

          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <ColorPreview colors={paletteData} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}