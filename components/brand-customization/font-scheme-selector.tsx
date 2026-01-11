"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Eye, 
  Save, 
  Trash2, 
  AlertTriangle, 
  CheckCircle, 
  Loader2,
  Download
} from 'lucide-react';
import type {
  FontSchemeSelectorProps,
  CreateFontSchemeRequest
} from '@/types/brand-customization';

interface FontInputProps {
  label: string;
  value: string[];
  onChange: (value: string[]) => void;
  description?: string;
  placeholder?: string;
  disabled?: boolean;
}

interface FontPreviewProps {
  scheme: CreateFontSchemeRequest;
  className?: string;
}

interface PresetFontScheme {
  id: string;
  name: string;
  scheme: Partial<CreateFontSchemeRequest>;
  category: 'default' | 'modern' | 'classic' | 'custom';
}

type FontSchemeFormData = Omit<CreateFontSchemeRequest, 'fontSizes' | 'fontWeights' | 'googleFonts'> & {
  fontSizes: NonNullable<CreateFontSchemeRequest['fontSizes']>;
  fontWeights: NonNullable<CreateFontSchemeRequest['fontWeights']>;
  googleFonts: string[];
};

// Font input component for managing font stacks
function FontInput({ label, value, onChange, description, placeholder, disabled = false }: FontInputProps) {
  const [inputValue, setInputValue] = useState(value.join(', '));
  const [isValid, setIsValid] = useState(true);

  useEffect(() => {
    setInputValue(value.join(', '));
  }, [value]);

  const validateFonts = useCallback((fontString: string): boolean => {
    if (!fontString.trim()) return false;
    
    const fonts = fontString.split(',').map(f => f.trim()).filter(f => f.length > 0);
    
    // Check that we have at least one font
    if (fonts.length === 0) return false;
    
    // Check for invalid characters in font names
    const invalidChars = /[<>:"\/\\|?*]/;
    return !fonts.some(font => invalidChars.test(font));
  }, []);

  const handleChange = useCallback((newValue: string) => {
    setInputValue(newValue);
    const valid = validateFonts(newValue);
    setIsValid(valid);
    
    if (valid) {
      const fonts = newValue.split(',').map(f => f.trim()).filter(f => f.length > 0);
      onChange(fonts);
    }
  }, [onChange, validateFonts]);

  const handleBlur = useCallback(() => {
    if (!isValid && inputValue) {
      // Try to fix common issues
      const cleanedValue = inputValue
        .split(',')
        .map(f => f.trim())
        .filter(f => f.length > 0)
        .join(', ');
      
      if (validateFonts(cleanedValue)) {
        setInputValue(cleanedValue);
        setIsValid(true);
        const fonts = cleanedValue.split(',').map(f => f.trim());
        onChange(fonts);
      }
    }
  }, [inputValue, isValid, onChange, validateFonts]);

  return (
    <div className="space-y-2">
      <Label htmlFor={label} className="text-sm font-medium">
        {label}
      </Label>
      
      <div className="relative">
        <Input
          id={label}
          type="text"
          value={inputValue}
          onChange={(e) => handleChange(e.target.value)}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          className={!isValid ? 'border-destructive' : ''}
        />
      </div>
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
      
      {!isValid && (
        <p className="text-xs text-destructive">Please enter valid font names separated by commas</p>
      )}
    </div>
  );
}

// Font preview component showing how fonts look
function FontPreview({ scheme, className = "" }: FontPreviewProps) {
  const sansStack = scheme.fontSans?.join(', ') || 'system-ui, sans-serif';
  const monoStack = scheme.fontMono?.join(', ') || 'ui-monospace, monospace';

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Sans-serif preview */}
      <div className="space-y-4">
        <h4 className="font-medium">Sans-serif Font Preview</h4>
        <div 
          className="p-6 rounded-lg border bg-card"
          style={{ fontFamily: sansStack }}
        >
          <div className="space-y-4">
            <h1 className="text-4xl font-bold">Heading 1</h1>
            <h2 className="text-3xl font-semibold">Heading 2</h2>
            <h3 className="text-2xl font-medium">Heading 3</h3>
            <p className="text-base">
              This is a paragraph of body text that demonstrates how your chosen sans-serif font will look 
              in regular content. It includes various characters and punctuation to give you a complete preview.
            </p>
            <div className="flex gap-2">
              <span className="text-sm font-light">Light</span>
              <span className="text-sm font-normal">Normal</span>
              <span className="text-sm font-medium">Medium</span>
              <span className="text-sm font-semibold">Semibold</span>
              <span className="text-sm font-bold">Bold</span>
            </div>
          </div>
        </div>
      </div>

      {/* Monospace preview */}
      <div className="space-y-4">
        <h4 className="font-medium">Monospace Font Preview</h4>
        <div 
          className="p-6 rounded-lg border bg-card"
          style={{ fontFamily: monoStack }}
        >
          <div className="space-y-4">
            <div className="text-sm">
              <div className="text-muted-foreground mb-2">Code Example:</div>
              <pre className="bg-muted p-3 rounded text-sm overflow-x-auto">
{`function calculateTotal(items) {
  return items.reduce((sum, item) => {
    return sum + (item.price * item.quantity);
  }, 0);
}`}
              </pre>
            </div>
            <div className="text-xs space-y-1">
              <div>Numbers: 0123456789</div>
              <div>Symbols: !@#$%^&*()_+-=[]{}|;&apos;:&quot;,./?</div>
              <div>Mixed: const API_URL = &quot;https://api.example.com/v1&quot;;</div>
            </div>
          </div>
        </div>
      </div>

      {/* Font sizes preview */}
      {scheme.fontSizes && (
        <div className="space-y-4">
          <h4 className="font-medium">Font Sizes Preview</h4>
          <div className="space-y-2" style={{ fontFamily: sansStack }}>
            {Object.entries(scheme.fontSizes).map(([size, value]) => (
              <div key={size} className="flex items-center gap-4">
                <span className="text-xs text-muted-foreground w-8">{size}</span>
                <span style={{ fontSize: value }}>
                  The quick brown fox jumps over the lazy dog
                </span>
                <span className="text-xs text-muted-foreground ml-auto">{value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function FontSchemeSelector({
  currentScheme,
  availableGoogleFonts,
  onSave,
  onPreview,
  onLoadGoogleFont
}: FontSchemeSelectorProps) {
  // State management
  const fontSizeKeys = ['xs', 'sm', 'base', 'lg', 'xl', '2xl', '3xl', '4xl'] as const
  const fontWeightKeys = ['light', 'normal', 'medium', 'semibold', 'bold'] as const

  const [schemeData, setSchemeData] = useState<FontSchemeFormData>({
    name: currentScheme?.name || '',
    fontSans: currentScheme?.fontSans || ['system-ui', '-apple-system', 'sans-serif'],
    fontMono: currentScheme?.fontMono || ['ui-monospace', 'SFMono-Regular', 'monospace'],
    fontSizes: currentScheme?.fontSizes || {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
    },
    fontWeights: currentScheme?.fontWeights || {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    googleFonts: currentScheme?.googleFonts || [],
  });

  const [isSaving, setIsSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('editor');
  const [previewMode, setPreviewMode] = useState(false);
  const [selectedGoogleFont, setSelectedGoogleFont] = useState<string>('');
  const [loadingGoogleFont, setLoadingGoogleFont] = useState(false);

  // Preset font schemes for quick selection
  const presetSchemes: PresetFontScheme[] = useMemo(() => [
    {
      id: 'default-system',
      name: 'System Default',
      category: 'default',
      scheme: {
        fontSans: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        fontMono: ['ui-monospace', 'SFMono-Regular', 'Consolas', 'Liberation Mono', 'monospace'],
        googleFonts: [],
      }
    },
    {
      id: 'modern-inter',
      name: 'Modern (Inter)',
      category: 'modern',
      scheme: {
        fontSans: ['Inter', 'system-ui', 'sans-serif'],
        fontMono: ['Fira Code', 'ui-monospace', 'monospace'],
        googleFonts: ['Inter', 'Fira Code'],
      }
    },
    {
      id: 'modern-roboto',
      name: 'Modern (Roboto)',
      category: 'modern',
      scheme: {
        fontSans: ['Roboto', 'system-ui', 'sans-serif'],
        fontMono: ['Source Code Pro', 'ui-monospace', 'monospace'],
        googleFonts: ['Roboto', 'Source Code Pro'],
      }
    },
    {
      id: 'classic-open-sans',
      name: 'Classic (Open Sans)',
      category: 'classic',
      scheme: {
        fontSans: ['Open Sans', 'system-ui', 'sans-serif'],
        fontMono: ['Source Code Pro', 'ui-monospace', 'monospace'],
        googleFonts: ['Open Sans', 'Source Code Pro'],
      }
    },
    {
      id: 'classic-lato',
      name: 'Classic (Lato)',
      category: 'classic',
      scheme: {
        fontSans: ['Lato', 'system-ui', 'sans-serif'],
        fontMono: ['Monaco', 'ui-monospace', 'monospace'],
        googleFonts: ['Lato'],
      }
    },
    {
      id: 'elegant-montserrat',
      name: 'Elegant (Montserrat)',
      category: 'modern',
      scheme: {
        fontSans: ['Montserrat', 'system-ui', 'sans-serif'],
        fontMono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
        googleFonts: ['Montserrat', 'JetBrains Mono'],
      }
    }
  ], []);

  // Initialize scheme data when currentScheme changes
  useEffect(() => {
    if (currentScheme) {
      setSchemeData({
        name: currentScheme.name,
        fontSans: currentScheme.fontSans,
        fontMono: currentScheme.fontMono,
        fontSizes: currentScheme.fontSizes,
        fontWeights: currentScheme.fontWeights,
        googleFonts: currentScheme.googleFonts,
      });
    }
  }, [currentScheme]);

  // Auto-preview when scheme data changes
  useEffect(() => {
    if (previewMode) {
      onPreview(schemeData);
    }
  }, [schemeData, previewMode, onPreview]);

  // Validation function
  const validateScheme = useCallback((): string[] => {
    const errors: string[] = [];
    
    if (!schemeData.name.trim()) {
      errors.push('Scheme name is required');
    }
    
    if (schemeData.name.length > 100) {
      errors.push('Scheme name must be less than 100 characters');
    }
    
    if (!schemeData.fontSans || schemeData.fontSans.length === 0) {
      errors.push('At least one sans-serif font is required');
    }
    
    if (!schemeData.fontMono || schemeData.fontMono.length === 0) {
      errors.push('At least one monospace font is required');
    }
    
    // Validate font fallbacks
    const sansHasFallback = schemeData.fontSans?.some(font => 
      font.includes('system-ui') || 
      font.includes('sans-serif') || 
      font.includes('-apple-system')
    );
    
    const monoHasFallback = schemeData.fontMono?.some(font => 
      font.includes('monospace') || 
      font.includes('ui-monospace')
    );
    
    if (!sansHasFallback) {
      errors.push('Sans-serif fonts must include a system fallback (system-ui, sans-serif, or -apple-system)');
    }
    
    if (!monoHasFallback) {
      errors.push('Monospace fonts must include a system fallback (monospace or ui-monospace)');
    }
    
    return errors;
  }, [schemeData]);

  // Handle scheme data updates
  const updateSchemeData = useCallback(<K extends keyof FontSchemeFormData>(
    field: K,
    value: FontSchemeFormData[K]
  ) => {
    setSchemeData(prev => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  // Handle preset selection
  const applyPreset = useCallback((preset: PresetFontScheme) => {
    setSchemeData(prev => ({
      ...prev,
      ...preset.scheme,
      name: prev.name || preset.name
    }));
  }, []);

  // Handle Google Font loading
  const handleLoadGoogleFont = useCallback(async () => {
    if (!selectedGoogleFont) return;
    
    try {
      setLoadingGoogleFont(true);
      await onLoadGoogleFont(selectedGoogleFont);
      
      // Add to Google Fonts list if not already present
      if (!schemeData.googleFonts.includes(selectedGoogleFont)) {
        updateSchemeData('googleFonts', [...schemeData.googleFonts, selectedGoogleFont]);
      }
      
      setSelectedGoogleFont('');
    } catch (error) {
      console.error('Failed to load Google Font:', error);
      setValidationErrors(['Failed to load Google Font. Please try again.']);
    } finally {
      setLoadingGoogleFont(false);
    }
  }, [selectedGoogleFont, onLoadGoogleFont, schemeData.googleFonts, updateSchemeData]);

  // Handle Google Font removal
  const removeGoogleFont = useCallback((fontToRemove: string) => {
    const updatedGoogleFonts = schemeData.googleFonts?.filter(font => font !== fontToRemove) || [];
    updateSchemeData('googleFonts', updatedGoogleFonts);
    
    // Also remove from font stacks
    const updatedSans = schemeData.fontSans?.filter(font => font !== fontToRemove) || [];
    const updatedMono = schemeData.fontMono?.filter(font => font !== fontToRemove) || [];
    
    if (updatedSans.length !== schemeData.fontSans?.length) {
      updateSchemeData('fontSans', updatedSans);
    }
    
    if (updatedMono.length !== schemeData.fontMono?.length) {
      updateSchemeData('fontMono', updatedMono);
    }
  }, [schemeData, updateSchemeData]);

  // Handle save
  const handleSave = useCallback(async () => {
    try {
      setIsSaving(true);
      
      // Validate before saving
      const errors = validateScheme();
      setValidationErrors(errors);
      
      if (errors.length > 0) {
        return;
      }
      
      await onSave(schemeData);
      
    } catch (error) {
      console.error('Failed to save font scheme:', error);
      setValidationErrors(['Failed to save font scheme. Please try again.']);
    } finally {
      setIsSaving(false);
    }
  }, [schemeData, onSave, validateScheme]);

  // Toggle preview mode
  const togglePreview = useCallback(() => {
    setPreviewMode(prev => {
      const newPreviewMode = !prev;
      if (newPreviewMode) {
        onPreview(schemeData);
      }
      return newPreviewMode;
    });
  }, [schemeData, onPreview]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Font Scheme Selector</h3>
          <p className="text-sm text-muted-foreground">
            Choose fonts that represent your brand identity
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

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="editor">Editor</TabsTrigger>
          <TabsTrigger value="presets">Presets</TabsTrigger>
          <TabsTrigger value="google-fonts">Google Fonts</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>

        <TabsContent value="editor" className="space-y-6 mt-6">
          {/* Scheme Name */}
          <Card>
            <CardHeader>
              <CardTitle>Scheme Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="scheme-name">Scheme Name *</Label>
                  <Input
                    id="scheme-name"
                    value={schemeData.name}
                    onChange={(e) => updateSchemeData('name', e.target.value)}
                    placeholder="Enter scheme name"
                    className="mt-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Font Families */}
          <Card>
            <CardHeader>
              <CardTitle>Font Families</CardTitle>
              <CardDescription>
                Define font stacks for different text types. Include fallback fonts for better compatibility.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <FontInput
                  label="Sans-serif Fonts"
                  value={schemeData.fontSans || []}
                  onChange={(value) => updateSchemeData('fontSans', value)}
                  description="Font stack for body text and UI elements (comma-separated)"
                  placeholder="Inter, system-ui, sans-serif"
                />
                <FontInput
                  label="Monospace Fonts"
                  value={schemeData.fontMono || []}
                  onChange={(value) => updateSchemeData('fontMono', value)}
                  description="Font stack for code and technical content (comma-separated)"
                  placeholder="Fira Code, ui-monospace, monospace"
                />
              </div>
            </CardContent>
          </Card>

          {/* Font Sizes */}
          <Card>
            <CardHeader>
              <CardTitle>Font Sizes</CardTitle>
              <CardDescription>
                Define the font size scale for your design system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {fontSizeKeys.map((size) => (
                  <div key={size}>
                    <Label htmlFor={`size-${size}`} className="text-sm">
                      {size.toUpperCase()}
                    </Label>
                    <Input
                      id={`size-${size}`}
                      value={schemeData.fontSizes[size]}
                      onChange={(e) => updateSchemeData('fontSizes', {
                        ...schemeData.fontSizes,
                        [size]: e.target.value
                      })}
                      placeholder="1rem"
                      className="mt-1"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Font Weights */}
          <Card>
            <CardHeader>
              <CardTitle>Font Weights</CardTitle>
              <CardDescription>
                Define font weight values for different emphasis levels
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {fontWeightKeys.map((weight) => (
                  <div key={weight}>
                    <Label htmlFor={`weight-${weight}`} className="text-sm">
                      {weight.charAt(0).toUpperCase() + weight.slice(1)}
                    </Label>
                    <Input
                      id={`weight-${weight}`}
                      type="number"
                      min="100"
                      max="900"
                      step="100"
                      value={schemeData.fontWeights[weight]}
                      onChange={(e) => updateSchemeData('fontWeights', {
                        ...schemeData.fontWeights,
                        [weight]: parseInt(e.target.value)
                      })}
                      className="mt-1"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="presets" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Font Scheme Presets</CardTitle>
              <CardDescription>
                Choose from predefined font schemes or use them as starting points
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Default Presets */}
                <div>
                  <h4 className="font-medium mb-3">Default Schemes</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {presetSchemes.filter(p => p.category === 'default').map((preset) => (
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
                          <div className="space-y-2 text-sm text-muted-foreground">
                            <div>Sans: {preset.scheme.fontSans?.slice(0, 2).join(', ')}</div>
                            <div>Mono: {preset.scheme.fontMono?.slice(0, 2).join(', ')}</div>
                            {preset.scheme.googleFonts && preset.scheme.googleFonts.length > 0 && (
                              <div className="flex gap-1 flex-wrap">
                                {preset.scheme.googleFonts.map(font => (
                                  <Badge key={font} variant="secondary" className="text-xs">
                                    {font}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Modern Presets */}
                <div>
                  <h4 className="font-medium mb-3">Modern Schemes</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {presetSchemes.filter(p => p.category === 'modern').map((preset) => (
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
                          <div className="space-y-2 text-sm text-muted-foreground">
                            <div>Sans: {preset.scheme.fontSans?.slice(0, 2).join(', ')}</div>
                            <div>Mono: {preset.scheme.fontMono?.slice(0, 2).join(', ')}</div>
                            {preset.scheme.googleFonts && preset.scheme.googleFonts.length > 0 && (
                              <div className="flex gap-1 flex-wrap">
                                {preset.scheme.googleFonts.map(font => (
                                  <Badge key={font} variant="secondary" className="text-xs">
                                    {font}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Classic Presets */}
                <div>
                  <h4 className="font-medium mb-3">Classic Schemes</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {presetSchemes.filter(p => p.category === 'classic').map((preset) => (
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
                          <div className="space-y-2 text-sm text-muted-foreground">
                            <div>Sans: {preset.scheme.fontSans?.slice(0, 2).join(', ')}</div>
                            <div>Mono: {preset.scheme.fontMono?.slice(0, 2).join(', ')}</div>
                            {preset.scheme.googleFonts && preset.scheme.googleFonts.length > 0 && (
                              <div className="flex gap-1 flex-wrap">
                                {preset.scheme.googleFonts.map(font => (
                                  <Badge key={font} variant="secondary" className="text-xs">
                                    {font}
                                  </Badge>
                                ))}
                              </div>
                            )}
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

        <TabsContent value="google-fonts" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Google Fonts Integration</CardTitle>
              <CardDescription>
                Add Google Fonts to your font scheme for enhanced typography
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Add Google Font */}
                <div className="flex gap-2">
                  <Select value={selectedGoogleFont} onValueChange={setSelectedGoogleFont}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select a Google Font" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableGoogleFonts.map((font) => (
                        <SelectItem key={font} value={font}>
                          {font}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={handleLoadGoogleFont}
                    disabled={!selectedGoogleFont || loadingGoogleFont}
                    className="gap-2"
                  >
                    {loadingGoogleFont ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                    Load Font
                  </Button>
                </div>

                {/* Loaded Google Fonts */}
                {schemeData.googleFonts && schemeData.googleFonts.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-3">Loaded Google Fonts</h4>
                    <div className="space-y-2">
                      {schemeData.googleFonts.map((font) => (
                        <div key={font} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <span className="font-medium">{font}</span>
                            <div 
                              className="text-sm text-muted-foreground"
                              style={{ fontFamily: font }}
                            >
                              The quick brown fox jumps over the lazy dog
                            </div>
                          </div>
                          <Button
                            onClick={() => removeGoogleFont(font)}
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Instructions */}
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <div className="font-medium">How to use Google Fonts:</div>
                      <div className="text-sm space-y-1">
                        <div>1. Select a Google Font from the dropdown above</div>
                        <div>2. Click &quot;Load Font&quot; to add it to your scheme</div>
                        <div>3. The font will be automatically added to your font stacks</div>
                        <div>4. Use the Preview tab to see how it looks</div>
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Font Scheme Preview</CardTitle>
              <CardDescription>
                See how your font scheme will look in the interface
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FontPreview scheme={schemeData} />
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
          Save Font Scheme
        </Button>
      </div>
    </div>
  );
}