"use client";

import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Upload, 
  X, 
  Image as ImageIcon, 
  AlertTriangle, 
  CheckCircle2, 
  Loader2,
  Trash2,
} from 'lucide-react';
import type {
  LogoUploadComponentProps,
  LogoType,
  LogoUploadResult,
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
  login: 'Login Page Logo',
  sidebar: 'Sidebar Header Logo',
  favicon: 'Favicon'
};

const LOGO_TYPE_DESCRIPTIONS: Record<LogoType, string> = {
  login: 'Displayed on all login and authentication pages',
  sidebar: 'Shown in the sidebar header across authenticated pages',
  favicon: 'Browser tab icon and bookmarks'
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
      errors.push(`File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds maximum allowed size (${(maxFileSize / 1024 / 1024).toFixed(2)}MB)`);
    }

    // Check file type
    if (!acceptedFormats.includes(file.type)) {
      errors.push(`File type "${file.type}" is not supported. Accepted formats: ${acceptedFormats.join(', ')}`);
    }

    // Check file name
    if (file.name.length > 255) {
      errors.push('File name is too long (maximum 255 characters)');
    }

    // Security checks
    const dangerousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.pif', '.com'];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    if (dangerousExtensions.includes(fileExtension)) {
      errors.push('File type is not allowed for security reasons');
    }

    // Logo type specific validations
    if (logoType === 'favicon') {
      if (file.type !== 'image/png' && file.type !== 'image/x-icon') {
        warnings.push('For best favicon compatibility, use PNG or ICO format');
      }
      if (file.size > 1024 * 1024) { // 1MB
        warnings.push('Favicon files are typically smaller than 1MB for better performance');
      }
    }

    // Image dimension warnings (we can't check without loading the image)
    if (logoType === 'login' && file.size < 10 * 1024) { // Less than 10KB
      warnings.push('Login logos are typically larger for better visibility');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }, [maxFileSize, acceptedFormats, logoType]);

  // Handle file selection
  const handleFileSelect = useCallback((file: File) => {
    const validation = validateFile(file);
    setValidationState(validation);
    
    if (validation.isValid) {
      setSelectedFile(file);
      
      // Create preview URL
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
      
      // Clear previous messages
      setUploadState(prev => ({ ...prev, error: null, success: null }));
    } else {
      setSelectedFile(null);
      setPreviewUrl(currentLogoUrl || null);
      setUploadState(prev => ({ 
        ...prev, 
        error: validation.errors.join('. '),
        success: null 
      }));
    }
  }, [validateFile, currentLogoUrl]);

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

  // Handle upload
  const handleUpload = useCallback(async () => {
    if (!selectedFile) return;

    try {
      setUploadState(prev => ({ 
        ...prev, 
        isUploading: true, 
        progress: 0, 
        error: null, 
        success: null 
      }));

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadState(prev => ({
          ...prev,
          progress: Math.min(prev.progress + 10, 90)
        }));
      }, 200);

      const result: LogoUploadResult = await onUpload(selectedFile, logoType);

      clearInterval(progressInterval);

      if (result.success && result.logoUrl) {
        setUploadState({
          isUploading: false,
          progress: 100,
          error: null,
          success: `${LOGO_TYPE_LABELS[logoType]} uploaded successfully`
        });
        
        // Update preview to the uploaded logo
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
      console.error('Logo upload failed:', error);
      
      let errorMessage = 'Failed to upload logo';
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
  }, [selectedFile, onUpload, logoType]);

  // Handle remove
  const handleRemove = useCallback(async () => {
    if (!currentLogoUrl) return;

    const confirmRemove = window.confirm(
      `Are you sure you want to remove the ${LOGO_TYPE_LABELS[logoType].toLowerCase()}?`
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
        success: `${LOGO_TYPE_LABELS[logoType]} removed successfully`
      });
      
      setPreviewUrl(null);
      setSelectedFile(null);
      
      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Logo removal failed:', error);
      
      let errorMessage = 'Failed to remove logo';
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
                <div className="font-medium">Warnings:</div>
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
              <span className="text-sm font-medium">Current Logo:</span>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {selectedFile ? 'Preview' : 'Active'}
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
                    Remove
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
                onError={() => {
                  console.error('Failed to load logo preview');
                  setPreviewUrl(null);
                }}
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
                <p className="text-sm font-medium">Uploading...</p>
                <Progress value={uploadState.progress} className="w-full max-w-xs mx-auto" />
                <p className="text-xs text-muted-foreground">{uploadState.progress}%</p>
              </>
            ) : (
              <>
                <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                <div className="space-y-1">
                  <p className="text-sm font-medium">
                    {isDragOver ? 'Drop your logo here' : 'Click to upload or drag and drop'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {acceptedFormats.map(format => format.split('/')[1].toUpperCase()).join(', ')} up to {formatFileSize(maxFileSize)}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Selected File Info */}
        {selectedFile && (
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <ImageIcon className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(selectedFile.size)} • {selectedFile.type}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {validationState.isValid && (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                )}
                <Button
                  onClick={() => {
                    setSelectedFile(null);
                    setPreviewUrl(currentLogoUrl || null);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                    }
                  }}
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>

            {/* Upload Button */}
            <Button
              onClick={handleUpload}
              disabled={!validationState.isValid || uploadState.isUploading}
              className="w-full"
            >
              {uploadState.isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload {LOGO_TYPE_LABELS[logoType]}
                </>
              )}
            </Button>
          </div>
        )}

        {/* File Requirements */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p><strong>Requirements:</strong></p>
          <ul className="list-disc list-inside space-y-0.5 ml-2">
            <li>Maximum file size: {formatFileSize(maxFileSize)}</li>
            <li>Supported formats: {acceptedFormats.map(format => format.split('/')[1].toUpperCase()).join(', ')}</li>
            {logoType === 'favicon' && (
              <li>Recommended: 16x16, 32x32, or 48x48 pixels</li>
            )}
            {logoType === 'login' && (
              <li>Recommended: High resolution for better visibility</li>
            )}
            {logoType === 'sidebar' && (
              <li>Recommended: Horizontal layout, max height 40px</li>
            )}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}