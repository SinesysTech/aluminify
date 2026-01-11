import { NextRequest } from 'next/server';

/**
 * Supported image formats for brand customization
 */
export const SUPPORTED_IMAGE_FORMATS = {
  'image/png': ['.png'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/svg+xml': ['.svg'],
  'image/webp': ['.webp'],
} as const;

/**
 * Maximum file sizes for different types of uploads (in bytes)
 */
export const MAX_FILE_SIZES = {
  logo: 5 * 1024 * 1024, // 5MB for logos
  favicon: 1 * 1024 * 1024, // 1MB for favicons
} as const;

/**
 * Dangerous file extensions that should never be allowed
 */
const DANGEROUS_EXTENSIONS = [
  '.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.js', '.jar',
  '.php', '.asp', '.aspx', '.jsp', '.py', '.rb', '.pl', '.sh', '.bash',
  '.ps1', '.psm1', '.psd1', '.msi', '.dll', '.so', '.dylib',
] as const;

/**
 * Dangerous MIME types that should be blocked
 */
const DANGEROUS_MIME_TYPES = [
  'application/x-executable',
  'application/x-msdownload',
  'application/x-msdos-program',
  'application/x-msi',
  'application/x-bat',
  'application/x-sh',
  'application/javascript',
  'text/javascript',
  'application/x-php',
  'text/x-php',
  'application/x-httpd-php',
] as const;

/**
 * SVG security patterns to detect potentially malicious content
 */
const SVG_SECURITY_PATTERNS = [
  /<script[\s\S]*?<\/script>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi, // Event handlers like onclick, onload, etc.
  /<iframe[\s\S]*?>/gi,
  /<object[\s\S]*?>/gi,
  /<embed[\s\S]*?>/gi,
  /<link[\s\S]*?>/gi,
  /<meta[\s\S]*?>/gi,
  /xlink:href\s*=\s*["']javascript:/gi,
] as const;

/**
 * File validation result
 */
export interface FileValidationResult {
  isValid: boolean;
  error?: string;
  warnings?: string[];
  sanitizedFilename?: string;
  detectedMimeType?: string;
  fileSize?: number;
}

/**
 * Sanitizes a filename by removing dangerous characters and patterns
 */
export function sanitizeFilename(filename: string): string {
  // Remove path traversal attempts
  let sanitized = filename.replace(/[\/\\:*?"<>|]/g, '_');
  
  // Remove leading dots and spaces
  sanitized = sanitized.replace(/^[.\s]+/, '');
  
  // Limit length
  if (sanitized.length > 255) {
    const ext = sanitized.substring(sanitized.lastIndexOf('.'));
    const name = sanitized.substring(0, 255 - ext.length);
    sanitized = name + ext;
  }
  
  // Ensure it's not empty
  if (!sanitized || sanitized === '_') {
    sanitized = `file_${Date.now()}`;
  }
  
  return sanitized;
}

/**
 * Validates file extension against allowed formats
 */
function validateFileExtension(
  filename: string,
  allowedFormats: Readonly<Record<string, readonly string[]>>
): boolean {
  const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));
  const allowedExtensions = Object.values(allowedFormats).flat();
  return allowedExtensions.includes(ext);
}

/**
 * Validates MIME type against allowed formats
 */
function validateMimeType(
  mimeType: string,
  allowedFormats: Readonly<Record<string, readonly string[]>>
): boolean {
  return Object.keys(allowedFormats).includes(mimeType);
}

/**
 * Checks for dangerous file patterns
 */
function checkForDangerousPatterns(filename: string, mimeType: string): string[] {
  const warnings: string[] = [];
  
  // Check dangerous extensions
  const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));
  if (DANGEROUS_EXTENSIONS.includes(ext as typeof DANGEROUS_EXTENSIONS[number])) {
    warnings.push(`Dangerous file extension detected: ${ext}`);
  }
  
  // Check dangerous MIME types
  if (DANGEROUS_MIME_TYPES.includes(mimeType as typeof DANGEROUS_MIME_TYPES[number])) {
    warnings.push(`Dangerous MIME type detected: ${mimeType}`);
  }
  
  return warnings;
}

/**
 * Validates SVG content for security threats
 */
async function validateSvgContent(file: File): Promise<{ isValid: boolean; warnings: string[] }> {
  const warnings: string[] = [];
  
  try {
    const content = await file.text();
    
    // Check for dangerous patterns in SVG
    for (const pattern of SVG_SECURITY_PATTERNS) {
      if (pattern.test(content)) {
        warnings.push(`Potentially dangerous SVG content detected: ${pattern.source}`);
      }
    }
    
    // SVG is invalid if it contains dangerous patterns
    const isValid = warnings.length === 0;
    
    return { isValid, warnings };
  } catch (_error) {
    return { isValid: false, warnings: ['Failed to read SVG content'] };
  }
}

/**
 * Validates an uploaded file for security and format compliance
 */
export async function validateUploadedFile(
  file: File,
  fileType: 'logo' | 'favicon' = 'logo'
): Promise<FileValidationResult> {
  const warnings: string[] = [];
  
  // Basic file checks
  if (!file || !file.name) {
    return { isValid: false, error: 'No file provided or file has no name' };
  }
  
  // Check file size
  const maxSize = MAX_FILE_SIZES[fileType];
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: `File size (${Math.round(file.size / 1024)}KB) exceeds maximum allowed size (${Math.round(maxSize / 1024)}KB)`,
      fileSize: file.size,
    };
  }
  
  // Check if file is empty
  if (file.size === 0) {
    return { isValid: false, error: 'File is empty' };
  }
  
  // Sanitize filename
  const sanitizedFilename = sanitizeFilename(file.name);
  
  // Validate file extension
  if (!validateFileExtension(file.name, SUPPORTED_IMAGE_FORMATS)) {
    return {
      isValid: false,
      error: `Unsupported file format. Allowed formats: ${Object.values(SUPPORTED_IMAGE_FORMATS).flat().join(', ')}`,
      sanitizedFilename,
    };
  }
  
  // Validate MIME type
  if (!validateMimeType(file.type, SUPPORTED_IMAGE_FORMATS)) {
    return {
      isValid: false,
      error: `Unsupported MIME type: ${file.type}. Allowed types: ${Object.keys(SUPPORTED_IMAGE_FORMATS).join(', ')}`,
      sanitizedFilename,
      detectedMimeType: file.type,
    };
  }
  
  // Check for dangerous patterns
  const dangerousPatterns = checkForDangerousPatterns(file.name, file.type);
  warnings.push(...dangerousPatterns);
  
  // Special validation for SVG files
  if (file.type === 'image/svg+xml') {
    const svgValidation = await validateSvgContent(file);
    if (!svgValidation.isValid) {
      return {
        isValid: false,
        error: 'SVG file contains potentially dangerous content',
        warnings: [...warnings, ...svgValidation.warnings],
        sanitizedFilename,
        detectedMimeType: file.type,
        fileSize: file.size,
      };
    }
    warnings.push(...svgValidation.warnings);
  }
  
  // File is valid
  return {
    isValid: true,
    warnings: warnings.length > 0 ? warnings : undefined,
    sanitizedFilename,
    detectedMimeType: file.type,
    fileSize: file.size,
  };
}

/**
 * Validates multiple files at once
 */
export async function validateMultipleFiles(
  files: File[],
  fileType: 'logo' | 'favicon' = 'logo'
): Promise<FileValidationResult[]> {
  const validationPromises = files.map(file => validateUploadedFile(file, fileType));
  return Promise.all(validationPromises);
}

/**
 * Extracts and validates files from a multipart form request
 */
export async function extractAndValidateFiles(
  request: NextRequest,
  fieldName: string = 'file',
  fileType: 'logo' | 'favicon' = 'logo'
): Promise<{ files: File[]; validationResults: FileValidationResult[] }> {
  try {
    const formData = await request.formData();
    const files: File[] = [];
    
    // Extract files from form data
    const fileEntries = formData.getAll(fieldName);
    for (const entry of fileEntries) {
      if (entry instanceof File) {
        files.push(entry);
      }
    }
    
    if (files.length === 0) {
      return {
        files: [],
        validationResults: [{ isValid: false, error: `No files found in field '${fieldName}'` }],
      };
    }
    
    // Validate all files
    const validationResults = await validateMultipleFiles(files, fileType);
    
    return { files, validationResults };
  } catch (error) {
    return {
      files: [],
      validationResults: [{ isValid: false, error: `Failed to process form data: ${error}` }],
    };
  }
}

/**
 * Security headers for file upload responses
 */
export const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Content-Security-Policy': "default-src 'none'; img-src 'self' data: https:; style-src 'self' 'unsafe-inline';",
} as const;

/**
 * Applies security headers to a response
 */
export function applySecurityHeaders(response: Response): Response {
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}