"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Eye, 
  Save, 
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
        <p className="text-xs text-destructive">Please enter a valid hex color (e.g., #FF0000)</p>
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
          <div className="font-medium">Primary</div>
          <div className="text-sm opacity-90">Primary content</div>
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
          <div className="font-medium">Secondary</div>
          <div className="text-sm opacity-90">Secondary content</div>
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
          <div className="font-medium">Accent</div>
          <div className="text-sm opacity-90">Accent content</div>
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
          <div className="font-medium">Muted</div>
          <div className="text-sm opacity-90">Muted content</div>
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
        <div className="font-medium mb-2">Card Example</div>
        <div className="text-sm text-muted-foreground mb-3">
          This is how cards will look with your color palette.
        </div>
        <div className="flex gap-2">
          <div 
            className="px-3 py-1 rounded text-xs font-medium"
            style={{ 
              backgroundColor: colors.primaryColor,
              color: colors.primaryForeground
            }}
          >
            Primary Button
          </div>
          <div 
            className="px-3 py-1 rounded text-xs font-medium border"
            style={{ 
              borderColor: colors.primaryColor,
              color: colors.primaryColor
            }}
          >
            Outline Button
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
        <div className="font-medium mb-2">Sidebar Preview</div>
        <div 
          className="px-2 py-1 rounded text-sm"
          style={{ 
            backgroundColor: colors.sidebarPrimary,
            color: colors.sidebarPrimaryForeground
          }}
        >
          Active Menu Item
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
  const [isSaving, setIsSaving] = useState(false);
  const [accessibilityReport, setAccessibilityReport] = useState<AccessibilityReport | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('editor');
  const [previewMode, setPreviewMode] = useState(false);

  // Preset palettes for quick selection
  const presetPalettes: PresetPalette[] = useMemo(() => [
    {
      id: 'default-light',
      name: 'Default Light',
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
      name: 'Default Dark',
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
      name: 'Corporate Blue',
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
      name: 'Nature Green',
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
      name: 'Creative Purple',
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
      errors.push('Palette name is required');
    }
    
    if (paletteData.name.length > 100) {
      errors.push('Palette name must be less than 100 characters');
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
        errors.push(`${field.replace(/([A-Z])/g, ' $1').toLowerCase()} must be a valid hex color`);
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
        warnings: ['Failed to validate accessibility. Please check your colors manually.']
      });
    } finally {
      setIsValidating(false);
    }
  }, [paletteData, onValidate]);

  // Handle save
  const handleSave = useCallback(async () => {
    try {
      setIsSaving(true);
      
      // Validate before saving
      const errors = validatePalette();
      setValidationErrors(errors);
      
      if (errors.length > 0) {
        return;
      }
      
      await onSave(paletteData);
      
    } catch (error) {
      console.error('Failed to save color palette:', error);
      setValidationErrors(['Failed to save color palette. Please try again.']);
    } finally {
      setIsSaving(false);
    }
  }, [paletteData, onSave, validatePalette]);

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Color Palette Editor</h3>
          <p className="text-sm text-muted-foreground">
            Create and customize your brand&apos;s color palette
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            onClick={togglePreview}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <Eye className="h-4 w-4" />
            {previewMode ? 'Exit Preview' : 'Preview'}
          </Button>
          
          <Button
            onClick={handleValidateAccessibility}
            variant="outline"
            size="sm"
            disabled={isValidating}
            className="gap-2"
          >
            {isValidating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle className="h-4 w-4" />
            )}
            Validate Accessibility
          </Button>
        </div>
      </div>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              <div className="font-medium">Please fix the following errors:</div>
              {validationErrors.map((error, index) => (
                <div key={index} className="text-sm">• {error}</div>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Accessibility Report */}
      {accessibilityReport && (
        <Alert variant={accessibilityReport.isCompliant ? "default" : "destructive"}>
          {accessibilityReport.isCompliant ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <AlertTriangle className="h-4 w-4" />
          )}
          <AlertDescription>
            <div className="space-y-2">
              <div className="font-medium">
                Accessibility Report: {accessibilityReport.isCompliant ? 'Compliant' : 'Issues Found'}
              </div>
              
              <div className="text-sm space-y-1">
                <div>Primary on Background: {accessibilityReport.contrastRatios.primaryOnBackground.toFixed(2)}:1</div>
                <div>Secondary on Background: {accessibilityReport.contrastRatios.secondaryOnBackground.toFixed(2)}:1</div>
                <div>Accent on Background: {accessibilityReport.contrastRatios.accentOnBackground.toFixed(2)}:1</div>
              </div>
              
              {accessibilityReport.recommendations && accessibilityReport.recommendations.length > 0 && (
                <div className="text-sm">
                  <div className="font-medium">Recommendations:</div>
                  {accessibilityReport.recommendations.map((rec, index) => (
                    <div key={index}>• {rec}</div>
                  ))}
                </div>
              )}
              
              {accessibilityReport.warnings && accessibilityReport.warnings.length > 0 && (
                <div className="text-sm">
                  <div className="font-medium">Warnings:</div>
                  {accessibilityReport.warnings.map((warning, index) => (
                    <div key={index}>• {warning}</div>
                  ))}
                </div>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="editor">Editor</TabsTrigger>
          <TabsTrigger value="presets">Presets</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>

        <TabsContent value="editor" className="space-y-6 mt-6">
          {/* Palette Name */}
          <Card>
            <CardHeader>
              <CardTitle>Palette Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="palette-name">Palette Name *</Label>
                  <Input
                    id="palette-name"
                    value={paletteData.name}
                    onChange={(e) => updatePaletteData('name', e.target.value)}
                    placeholder="Enter palette name"
                    className="mt-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Primary Colors */}
          <Card>
            <CardHeader>
              <CardTitle>Primary Colors</CardTitle>
              <CardDescription>
                Main brand colors used for primary actions and emphasis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ColorInput
                  label="Primary Color"
                  value={paletteData.primaryColor}
                  onChange={(value) => updatePaletteData('primaryColor', value)}
                  description="Main brand color"
                  required
                />
                <ColorInput
                  label="Primary Foreground"
                  value={paletteData.primaryForeground}
                  onChange={(value) => updatePaletteData('primaryForeground', value)}
                  description="Text color on primary background"
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Secondary Colors */}
          <Card>
            <CardHeader>
              <CardTitle>Secondary Colors</CardTitle>
              <CardDescription>
                Supporting colors for secondary actions and content
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ColorInput
                  label="Secondary Color"
                  value={paletteData.secondaryColor}
                  onChange={(value) => updatePaletteData('secondaryColor', value)}
                  description="Secondary brand color"
                  required
                />
                <ColorInput
                  label="Secondary Foreground"
                  value={paletteData.secondaryForeground}
                  onChange={(value) => updatePaletteData('secondaryForeground', value)}
                  description="Text color on secondary background"
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Accent Colors */}
          <Card>
            <CardHeader>
              <CardTitle>Accent Colors</CardTitle>
              <CardDescription>
                Accent colors for highlights and special elements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ColorInput
                  label="Accent Color"
                  value={paletteData.accentColor}
                  onChange={(value) => updatePaletteData('accentColor', value)}
                  description="Accent/highlight color"
                  required
                />
                <ColorInput
                  label="Accent Foreground"
                  value={paletteData.accentForeground}
                  onChange={(value) => updatePaletteData('accentForeground', value)}
                  description="Text color on accent background"
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Background Colors */}
          <Card>
            <CardHeader>
              <CardTitle>Background Colors</CardTitle>
              <CardDescription>
                Base colors for backgrounds and surfaces
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ColorInput
                  label="Background Color"
                  value={paletteData.backgroundColor}
                  onChange={(value) => updatePaletteData('backgroundColor', value)}
                  description="Main background color"
                  required
                />
                <ColorInput
                  label="Foreground Color"
                  value={paletteData.foregroundColor}
                  onChange={(value) => updatePaletteData('foregroundColor', value)}
                  description="Main text color"
                  required
                />
                <ColorInput
                  label="Card Color"
                  value={paletteData.cardColor}
                  onChange={(value) => updatePaletteData('cardColor', value)}
                  description="Card background color"
                  required
                />
                <ColorInput
                  label="Card Foreground"
                  value={paletteData.cardForeground}
                  onChange={(value) => updatePaletteData('cardForeground', value)}
                  description="Text color on cards"
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Muted Colors */}
          <Card>
            <CardHeader>
              <CardTitle>Muted Colors</CardTitle>
              <CardDescription>
                Subtle colors for less prominent elements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ColorInput
                  label="Muted Color"
                  value={paletteData.mutedColor}
                  onChange={(value) => updatePaletteData('mutedColor', value)}
                  description="Muted background color"
                  required
                />
                <ColorInput
                  label="Muted Foreground"
                  value={paletteData.mutedForeground}
                  onChange={(value) => updatePaletteData('mutedForeground', value)}
                  description="Muted text color"
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* System Colors */}
          <Card>
            <CardHeader>
              <CardTitle>System Colors</CardTitle>
              <CardDescription>
                Colors for system states and feedback
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ColorInput
                  label="Destructive Color"
                  value={paletteData.destructiveColor}
                  onChange={(value) => updatePaletteData('destructiveColor', value)}
                  description="Error/danger color"
                  required
                />
                <ColorInput
                  label="Destructive Foreground"
                  value={paletteData.destructiveForeground}
                  onChange={(value) => updatePaletteData('destructiveForeground', value)}
                  description="Text color on destructive background"
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Sidebar Colors */}
          <Card>
            <CardHeader>
              <CardTitle>Sidebar Colors</CardTitle>
              <CardDescription>
                Specific colors for sidebar navigation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ColorInput
                  label="Sidebar Background"
                  value={paletteData.sidebarBackground}
                  onChange={(value) => updatePaletteData('sidebarBackground', value)}
                  description="Sidebar background color"
                  required
                />
                <ColorInput
                  label="Sidebar Foreground"
                  value={paletteData.sidebarForeground}
                  onChange={(value) => updatePaletteData('sidebarForeground', value)}
                  description="Sidebar text color"
                  required
                />
                <ColorInput
                  label="Sidebar Primary"
                  value={paletteData.sidebarPrimary}
                  onChange={(value) => updatePaletteData('sidebarPrimary', value)}
                  description="Active sidebar item color"
                  required
                />
                <ColorInput
                  label="Sidebar Primary Foreground"
                  value={paletteData.sidebarPrimaryForeground}
                  onChange={(value) => updatePaletteData('sidebarPrimaryForeground', value)}
                  description="Active sidebar item text color"
                  required
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="presets" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Color Palette Presets</CardTitle>
              <CardDescription>
                Choose from predefined color palettes or use them as starting points
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Default Presets */}
                <div>
                  <h4 className="font-medium mb-3">Default Presets</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {presetPalettes.filter(p => p.category === 'default').map((preset) => (
                      <Card key={preset.id} className="cursor-pointer hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h5 className="font-medium">{preset.name}</h5>
                            <Button
                              onClick={() => applyPreset(preset)}
                              size="sm"
                              variant="outline"
                            >
                              Apply
                            </Button>
                          </div>
                          <div className="flex gap-2">
                            {Object.entries(preset.colors).slice(0, 6).map(([key, color]) => (
                              <div
                                key={key}
                                className="w-6 h-6 rounded border border-border"
                                style={{ backgroundColor: color }}
                                title={`${key}: ${color}`}
                              />
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Brand Presets */}
                <div>
                  <h4 className="font-medium mb-3">Brand Presets</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {presetPalettes.filter(p => p.category === 'brand').map((preset) => (
                      <Card key={preset.id} className="cursor-pointer hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h5 className="font-medium">{preset.name}</h5>
                            <Button
                              onClick={() => applyPreset(preset)}
                              size="sm"
                              variant="outline"
                            >
                              Apply
                            </Button>
                          </div>
                          <div className="flex gap-2">
                            {Object.entries(preset.colors).slice(0, 6).map(([key, color]) => (
                              <div
                                key={key}
                                className="w-6 h-6 rounded border border-border"
                                style={{ backgroundColor: color }}
                                title={`${key}: ${color}`}
                              />
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Color Palette Preview</CardTitle>
              <CardDescription>
                See how your color palette will look in the interface
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ColorPreview colors={paletteData} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={isSaving || validationErrors.length > 0}
          className="gap-2"
        >
          {isSaving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Save Color Palette
        </Button>
      </div>
    </div>
  );
}