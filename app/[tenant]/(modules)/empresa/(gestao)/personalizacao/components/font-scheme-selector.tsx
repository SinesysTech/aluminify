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
  Download,
  Type
} from 'lucide-react';
import type {
  FontSchemeSelectorProps,
  CreateFontSchemeRequest
} from '@/empresa/personalizacao/services/empresa/personalizacao.types';

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
        <p className="text-xs text-destructive">Por favor, insira nomes de fontes válidos separados por vírgulas</p>
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
        <div className="font-medium border-b pb-2">Visualização de Tipografia</div>

        <div className="space-y-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold">Título H1</h1>
            <h2 className="text-3xl font-bold">Título H2</h2>
            <h3 className="text-2xl font-bold">Título H3</h3>
            <h4 className="text-xl font-bold">Título H4</h4>
          </div>

          <div className="space-y-4">
            <p>
              Este é um parágrafo de corpo de texto. Demonstra como sua fonte escolhida
              aparecerá em blocos de texto padrão. Uma boa tipografia deve ser legível e
              confortável de ler por longos períodos.
            </p>
            <p className="text-sm text-muted-foreground">
              Este é um texto pequeno e suave, frequentemente usado para legendas ou informações secundárias.
            </p>
          </div>

          <div className="flex gap-4">
            <Button>Botão Primário</Button>
            <Button variant="outline">Botão Outline</Button>
            <Button variant="ghost">Botão Ghost</Button>
          </div>
        </div>
      </div>

      {/* Monospace preview */}
      <div className="space-y-4">
        <h4 className="font-medium">Visualização de Fonte Monoespaçada</h4>
        <div
          className="p-6 rounded-lg border bg-card"
          style={{ fontFamily: monoStack }}
        >
          <div className="space-y-4">
            <div className="text-sm">
              <div className="text-muted-foreground mb-2">Exemplo de Código:</div>
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
              <div>Symbols: !@#$%^&*()_+-=[]{ }|;&apos;:&quot;,./?</div>
              <div>Mixed: const API_URL = &quot;https://api.example.com/v1&quot;;</div>
            </div>
          </div>
        </div>
      </div>

      {/* Font sizes preview */}
      {scheme.fontSizes && (
        <div className="space-y-4">
          <h4 className="font-medium">Visualização de Tamanhos de Fonte</h4>
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
      id: 'inter-system',
      name: 'Inter (Sistema)',
      category: 'modern',
      scheme: {
        fontSans: ['Inter', 'system-ui', 'sans-serif'],
        fontMono: ['ui-monospace', 'monospace'],
        googleFonts: ['Inter'],
      }
    },
    {
      id: 'roboto-slab',
      name: 'Roboto & Roboto Slab',
      category: 'classic',
      scheme: {
        fontSans: ['Roboto', 'system-ui', 'sans-serif'],
        fontMono: ['Roboto Mono', 'ui-monospace', 'monospace'],
        googleFonts: ['Roboto', 'Roboto Slab', 'Roboto Mono'],
      }
    },
    {
      id: 'playfair-lato',
      name: 'Playfair & Lato',
      category: 'classic',
      scheme: {
        fontSans: ['Lato', 'system-ui', 'sans-serif'],
        fontMono: ['Monaco', 'ui-monospace', 'monospace'],
        googleFonts: ['Playfair Display', 'Lato'],
      }
    },
    {
      id: 'montserrat-opensans',
      name: 'Montserrat & Open Sans',
      category: 'modern',
      scheme: {
        fontSans: ['Montserrat', 'system-ui', 'sans-serif'],
        fontMono: ['Open Sans', 'ui-monospace', 'monospace'],
        googleFonts: ['Montserrat', 'Open Sans'],
      }
    },
    {
      id: 'oswald-raleway',
      name: 'Oswald & Raleway',
      category: 'modern',
      scheme: {
        fontSans: ['Raleway', 'system-ui', 'sans-serif'],
        fontMono: ['Oswald', 'ui-monospace', 'monospace'],
        googleFonts: ['Oswald', 'Raleway'],
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
      errors.push('Nome do esquema é obrigatório');
    }

    if (schemeData.name.length > 100) {
      errors.push('Nome do esquema deve ter menos de 100 caracteres');
    }

    if (!schemeData.fontSans || schemeData.fontSans.length === 0) {
      errors.push('Pelo menos uma fonte sans-serif é obrigatória');
    }

    if (!schemeData.fontMono || schemeData.fontMono.length === 0) {
      errors.push('Pelo menos uma fonte monospace é obrigatória');
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
      errors.push('As fontes sans-serif devem incluir um fallback de sistema (system-ui, sans-serif ou -apple-system)');
    }

    if (!monoHasFallback) {
      errors.push('As fontes monospace devem incluir um fallback de sistema (monospace ou ui-monospace)');
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
      setValidationErrors(['Falha ao carregar Google Font. Por favor, tente novamente.']);
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
      setValidationErrors(['Falha ao salvar esquema de fontes. Por favor, tente novamente.']);
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
          <h3 className="text-lg font-semibold">Seletor de Esquema de Fontes</h3>
          <p className="text-sm text-muted-foreground">
            Escolha fontes que representem a identidade da sua marca
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
            {previewMode ? 'Sair da Visualização' : 'Visualizar'}
          </Button>
        </div>
      </div>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              <div className="font-medium">Por favor, corrija os seguintes erros:</div>
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
          <TabsTrigger value="presets">Predefinições</TabsTrigger>
          <TabsTrigger value="google-fonts">Google Fonts</TabsTrigger>
          <TabsTrigger value="preview">Visualizar</TabsTrigger>
        </TabsList>

        <TabsContent value="editor" className="space-y-6 mt-6">
          {/* Scheme Name */}
          <Card>
            <CardHeader>
              <CardTitle>Informações do Esquema</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="scheme-name">Nome do Esquema *</Label>
                  <Input
                    id="scheme-name"
                    value={schemeData.name}
                    onChange={(e) => updateSchemeData('name', e.target.value)}
                    placeholder="Digite o nome do esquema"
                    className="mt-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Google Fonts Loader */}
          <Card className="bg-muted/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Type className="h-4 w-4" />
                Carregar Google Font
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <div className="flex-1">
                  <Select
                    onValueChange={(value) => {
                      if (value) setSelectedGoogleFont(value);
                    }}
                    value={selectedGoogleFont}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma Google Font..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableGoogleFonts.map(font => (
                        <SelectItem key={font} value={font} style={{ fontFamily: font }}>
                          {font}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
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
                  Carregar Fonte
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Font Families */}
          <Card>
            <CardHeader>
              <CardTitle>Famílias de Fontes</CardTitle>
              <CardDescription>
                Defina pilhas de fontes para diferentes tipos de texto. Inclua fontes de fallback para melhor compatibilidade.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <FontInput
                  label="Fontes Sans-serif"
                  value={schemeData.fontSans || []}
                  onChange={(value) => updateSchemeData('fontSans', value)}
                  description="Pilha de fontes para texto do corpo e elementos da UI (separados por vírgulas)"
                  placeholder="Inter, system-ui, sans-serif"
                />
                <FontInput
                  label="Fontes Monospace"
                  value={schemeData.fontMono || []}
                  onChange={(value) => updateSchemeData('fontMono', value)}
                  description="Pilha de fontes para código e conteúdo técnico (separados por vírgulas)"
                  placeholder="Fira Code, ui-monospace, monospace"
                />
              </div>
            </CardContent>
          </Card>

          {/* Font Sizes */}
          <Card>
            <CardHeader>
              <CardTitle>Tamanhos de Fonte</CardTitle>
              <CardDescription>
                Defina a escala de tamanhos de fonte para o seu sistema de design
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
              <CardTitle>Pesos de Fonte</CardTitle>
              <CardDescription>
                Defina os valores de peso de fonte para diferentes níveis de ênfase
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
              <CardTitle>Predefinições de Esquemas de Fonte</CardTitle>
              <CardDescription>
                Escolha entre esquemas predefinidos ou use-os como ponto de partida
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Default Presets */}
                <div>
                  <h4 className="font-medium mb-3">Esquemas Padrão</h4>
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
                              Aplicar
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
                  <h4 className="font-medium mb-3">Esquemas Modernos</h4>
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
                              Aplicar
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
                  <h4 className="font-medium mb-3">Esquemas Clássicos</h4>
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
                              Aplicar
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
        </TabsContent >

        <TabsContent value="google-fonts" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Integração Google Fonts</CardTitle>
              <CardDescription>
                Adicione Google Fonts ao seu esquema para uma tipografia aprimorada
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Add Google Font */}
                <div className="flex gap-2">
                  <Select value={selectedGoogleFont} onValueChange={setSelectedGoogleFont}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Selecione uma Google Font" />
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
                    Carregar Fonte
                  </Button>
                </div>

                {/* Loaded Google Fonts */}
                {schemeData.googleFonts && schemeData.googleFonts.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-3">Google Fonts Carregadas</h4>
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
                      <div className="font-medium">Como usar Google Fonts:</div>
                      <div className="text-sm space-y-1">
                        <div>1. Selecione uma Google Font na lista acima</div>
                        <div>2. Clique em &quot;Carregar Fonte&quot; para adicionar ao seu esquema</div>
                        <div>3. A fonte será adicionada automaticamente às suas pilhas de fontes</div>
                        <div>4. Use a aba Visualizar para ver como fica</div>
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
              <CardTitle>Visualização do Esquema de Fonte</CardTitle>
              <CardDescription>
                Veja como seu esquema de fontes ficará na interface
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FontPreview scheme={schemeData} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs >

      {/* Save Button */}
      < div className="flex justify-end" >
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
          Salvar Esquema de Fontes
        </Button>
      </div >
    </div >
  );
}