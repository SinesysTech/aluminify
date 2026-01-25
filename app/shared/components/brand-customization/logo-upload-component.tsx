"use client";

import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Upload,
  Image as ImageIcon,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Trash2,
} from 'lucide-react';
import type {
  LogoUploadComponentProps,
  LogoType,
} from '@/types/brand-customization';

interface UploadState {
  isUploading: boolean;
  progress: number;
  error: string | null;
  success: string | null;
}

interface ValidationState {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

const LOGO_TYPE_LABELS: Record<LogoType, string> = {
  login: 'Logo da Página de Login',
  sidebar: 'Logo do Cabeçalho da Sidebar',
  favicon: 'Favicon'
};

const LOGO_TYPE_DESCRIPTIONS: Record<LogoType, string> = {
  login: 'Exibido em todas as páginas de login e autenticação',
  sidebar: 'Mostrado no cabeçalho da barra lateral em páginas autenticadas',
  favicon: 'Ícone da aba do navegador e favoritos'
};

const DEFAULT_MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const DEFAULT_ACCEPTED_FORMATS = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];

export function LogoUploadComponent({
  logoType,
  currentLogoUrl,
  onUpload,
  onRemove,
  maxFileSize = DEFAULT_MAX_FILE_SIZE,
  acceptedFormats = DEFAULT_ACCEPTED_FORMATS
}: LogoUploadComponentProps) {

  // State management
  const [uploadState, setUploadState] = useState<UploadState>({
    isUploading: false,
    progress: 0,
    error: null,
    success: null
  });

  const [validationState, setValidationState] = useState<ValidationState>({
    isValid: true,
    errors: [],
    warnings: []
  });

  const [isDragOver, setIsDragOver] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentLogoUrl || null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounterRef = useRef(0);

  // Clear messages after delay
  React.useEffect(() => {
    if (uploadState.success) {
      const timer = setTimeout(() => {
        setUploadState(prev => ({ ...prev, success: null }));
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [uploadState.success]);

  React.useEffect(() => {
    if (uploadState.error) {
      const timer = setTimeout(() => {
        setUploadState(prev => ({ ...prev, error: null }));
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [uploadState.error]);

  // Update preview when currentLogoUrl changes
  React.useEffect(() => {
    if (currentLogoUrl && !selectedFile) {
      setPreviewUrl(currentLogoUrl);
    }
  }, [currentLogoUrl, selectedFile]);

  // File validation
  const validateFile = useCallback((file: File): ValidationState => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check file size
    if (file.size > maxFileSize) {
      errors.push(`Tamanho do arquivo (${(file.size / 1024 / 1024).toFixed(2)}MB) excede o limite máximo de (${(maxFileSize / 1024 / 1024).toFixed(2)}MB)`);
    }

    // Check file type
    if (!acceptedFormats.includes(file.type)) {
      errors.push(`Tipo de arquivo "${file.type}" não suportado. Formatos aceitos: ${acceptedFormats.join(', ')}`);
    }

    // Check file name
    if (file.name.length > 255) {
      errors.push('Nome do arquivo é muito longo (máximo 255 caracteres)');
    }

    // Security checks
    const dangerousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.pif', '.com'];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    if (dangerousExtensions.includes(fileExtension)) {
      errors.push('Tipo de arquivo não permitido por motivos de segurança');
    }

    // Logo type specific validations
    if (logoType === 'favicon') {
      if (file.type !== 'image/png' && file.type !== 'image/x-icon') {
        warnings.push('Para melhor compatibilidade de favicon, use formato PNG ou ICO');
      }
      if (file.size > 1024 * 1024) { // 1MB
        warnings.push('Arquivos de favicon são geralmente menores que 1MB para melhor performance');
      }
    }

    // Image dimension warnings (we can't check without loading the image)
    if (logoType === 'login' && file.size < 10 * 1024) { // Less than 10KB
      warnings.push('Logos de login são geralmente maiores para melhor visibilidade');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }, [maxFileSize, acceptedFormats, logoType]);

  // Handle file selection - automatically uploads after validation
  const handleFileSelect = useCallback(async (file: File) => {
    const validation = validateFile(file);
    setValidationState(validation);

    if (!validation.isValid) {
      setSelectedFile(null);
      setPreviewUrl(currentLogoUrl || null);
      setUploadState(prev => ({
        ...prev,
        error: validation.errors.join('. '),
        success: null
      }));
      return;
    }

    // Create preview URL immediately for better UX
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    setUploadState({
      isUploading: true,
      progress: 0,
      error: null,
      success: null
    });

    // Simulate progress for better UX
    const progressInterval = setInterval(() => {
      setUploadState(prev => ({
        ...prev,
        progress: Math.min(prev.progress + 10, 90)
      }));
    }, 200);

    try {
      const result = await onUpload(file, logoType);

      if (result.success && result.logoUrl) {
        setUploadState({
          isUploading: false,
          progress: 100,
          error: null,
          success: `${LOGO_TYPE_LABELS[logoType]} enviada com sucesso`
        });

        // Clean up the blob URL and use the server URL
        URL.revokeObjectURL(objectUrl);
        setPreviewUrl(result.logoUrl);
        setSelectedFile(null);

        // Clear file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (error) {
      setUploadState({
        isUploading: false,
        progress: 0,
        error: error instanceof Error ? error.message : 'Falha ao enviar logo',
        success: null
      });

      // Clean up blob URL and revert preview on error
      URL.revokeObjectURL(objectUrl);
      setPreviewUrl(currentLogoUrl || null);
    } finally {
      clearInterval(progressInterval);
    }
  }, [validateFile, currentLogoUrl, onUpload, logoType]);

  // Handle file input change
  const handleFileInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  // Drag and drop handlers
  const handleDragEnter = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    dragCounterRef.current++;
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) {
      setIsDragOver(false);
    }
  }, []);

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
  }, []);

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    dragCounterRef.current = 0;
    setIsDragOver(false);

    const files = Array.from(event.dataTransfer.files);
    if (files.length > 0) {
      const file = files[0];
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  // Handle remove
  const handleRemove = useCallback(async () => {
    if (!currentLogoUrl) return;

    const confirmRemove = window.confirm(
      `Tem certeza que deseja remover o(a) ${LOGO_TYPE_LABELS[logoType].toLowerCase()}?`
    );

    if (!confirmRemove) return;

    try {
      setUploadState(prev => ({
        ...prev,
        isUploading: true,
        error: null,
        success: null
      }));

      await onRemove(logoType);

      setUploadState({
        isUploading: false,
        progress: 0,
        error: null,
        success: `${LOGO_TYPE_LABELS[logoType]} removida com sucesso`
      });

      setPreviewUrl(null);
      setSelectedFile(null);

      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      let errorMessage = 'Falha ao remover logo';
      if (error instanceof Error) {
        errorMessage = error.message;
      }

      setUploadState({
        isUploading: false,
        progress: 0,
        error: errorMessage,
        success: null
      });
    }
  }, [currentLogoUrl, onRemove, logoType]);

  // Handle click to select file
  const handleClick = useCallback(() => {
    if (!uploadState.isUploading) {
      fileInputRef.current?.click();
    }
  }, [uploadState.isUploading]);

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5" />
          {LOGO_TYPE_LABELS[logoType]}
        </CardTitle>
        <CardDescription>
          {LOGO_TYPE_DESCRIPTIONS[logoType]}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Status Messages */}
        {uploadState.success && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              {uploadState.success}
            </AlertDescription>
          </Alert>
        )}

        {uploadState.error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {uploadState.error}
            </AlertDescription>
          </Alert>
        )}

        {validationState.warnings.length > 0 && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                <div className="font-medium">Avisos:</div>
                {validationState.warnings.map((warning, index) => (
                  <div key={index} className="text-sm">• {warning}</div>
                ))}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Current Logo Preview */}
        {previewUrl && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Logo Atual:</span>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {selectedFile ? 'Pré-visualização' : 'Ativo'}
                </Badge>
                {currentLogoUrl && !selectedFile && (
                  <Button
                    onClick={handleRemove}
                    variant="outline"
                    size="sm"
                    disabled={uploadState.isUploading}
                    className="h-6 px-2 text-xs"
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Remover
                  </Button>
                )}
              </div>
            </div>
            <div className="flex items-center justify-center p-4 border rounded-lg bg-muted/50">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt={`${LOGO_TYPE_LABELS[logoType]} preview`}
                className="max-h-20 max-w-full object-contain"
                onError={() => setPreviewUrl(null)}
              />
            </div>
          </div>
        )}

        {/* Upload Area */}
        <div
          className={`
            relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
            ${isDragOver
              ? 'border-primary bg-primary/5'
              : 'border-muted-foreground/25 hover:border-muted-foreground/50'
            }
            ${uploadState.isUploading ? 'pointer-events-none opacity-50' : ''}
          `}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={handleClick}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={acceptedFormats.join(',')}
            onChange={handleFileInputChange}
            className="hidden"
            disabled={uploadState.isUploading}
          />

          <div className="space-y-2">
            {uploadState.isUploading ? (
              <>
                <Loader2 className="h-8 w-8 mx-auto animate-spin text-primary" />
                <p className="text-sm font-medium">Enviando...</p>
                <Progress value={uploadState.progress} className="w-full max-w-xs mx-auto" />
                <p className="text-xs text-muted-foreground">{uploadState.progress}%</p>
              </>
            ) : (
              <>
                <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                <div className="space-y-1">
                  <p className="text-sm font-medium">
                    {isDragOver ? 'Solte seu logo aqui' : 'Clique para enviar ou arraste e solte'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {acceptedFormats.map(format => format.split('/')[1].toUpperCase()).join(', ')} até {formatFileSize(maxFileSize)}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Upload is now automatic - no manual button needed */}

        {/* File Requirements */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p><strong>Requisitos:</strong></p>
          <ul className="list-disc list-inside space-y-0.5 ml-2">
            <li>Tamanho máximo: {formatFileSize(maxFileSize)}</li>
            <li>Formatos suportados: {acceptedFormats.map(format => format.split('/')[1].toUpperCase()).join(', ')}</li>
            {logoType === 'favicon' && (
              <li>Recomendado: 16x16, 32x32, ou 48x48 pixels</li>
            )}
            {logoType === 'login' && (
              <li>Recomendado: Alta resolução para melhor visibilidade</li>
            )}
            {logoType === 'sidebar' && (
              <li>Recomendado: Layout horizontal, altura max 40px</li>
            )}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}