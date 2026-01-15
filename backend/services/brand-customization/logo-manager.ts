import { SupabaseClient } from '@supabase/supabase-js';
import type {
  LogoType,
  LogoUploadResult,
  ValidationResult,
  TenantLogo,
} from '@/types/brand-customization';
import { LogoUploadError } from '@/types/brand-customization';

/**
 * Logo Manager Interface
 * Defines the contract for logo management operations
 */
export interface LogoManager {
  // Upload and validation
  uploadLogo(empresaId: string, file: File, type: LogoType): Promise<LogoUploadResult>;
  validateLogo(file: File): Promise<ValidationResult>;
  
  // Application
  applyLogo(empresaId: string, logoUrl: string, type: LogoType): void;
  
  // Removal
  removeLogo(empresaId: string, type: LogoType): Promise<void>;
  
  // Retrieval
  getLogo(empresaId: string, type: LogoType): Promise<TenantLogo | null>;
  getAllLogos(empresaId: string): Promise<Record<LogoType, TenantLogo | null>>;
}

/**
 * Logo Manager Implementation
 * Handles logo upload, validation, storage, and application
 * 
 * Validates Requirements:
 * - 1.1: Store and apply login page logos
 * - 1.2: Display sidebar header logos
 * - 1.3: Reject uploads exceeding size limits
 * - 1.4: Support common image formats with validation
 * - 7.2: Validate files for security threats
 * - 7.3: Sanitize filenames and store securely
 */
export class LogoManagerImpl implements LogoManager {
  private readonly STORAGE_BUCKET = 'tenant-logos';
  private readonly MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  private readonly ALLOWED_MIME_TYPES = [
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/svg+xml',
    'image/webp'
  ];
  private readonly ALLOWED_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.svg', '.webp'];

  constructor(private readonly client: SupabaseClient) {}

  /**
   * Upload logo with validation and security checks
   * Validates Requirements 1.3, 1.4, 7.2, 7.3
   */
  async uploadLogo(empresaId: string, file: File, type: LogoType): Promise<LogoUploadResult> {
    try {
      // Validate the file first
      const validation = await this.validateLogo(file);
      if (!validation.isValid) {
        return {
          success: false,
          error: 'File validation failed',
          validationErrors: validation.errors,
        };
      }

      // Validate empresa exists
      const { data: empresa, error: empresaError } = await this.client
        .from('empresas')
        .select('id')
        .eq('id', empresaId)
        .maybeSingle();

      if (empresaError || !empresa) {
        return {
          success: false,
          error: `Invalid empresa ID: ${empresaId}`,
        };
      }

      // Generate secure filename
      const sanitizedFileName = this.sanitizeFileName(file.name);
      const timestamp = Date.now();
      const secureFileName = `${empresaId}/${type}/${timestamp}_${sanitizedFileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await this.client.storage
        .from(this.STORAGE_BUCKET)
        .upload(secureFileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        throw new LogoUploadError(`Failed to upload file: ${uploadError.message}`, {
          uploadError,
          fileName: sanitizedFileName,
        });
      }

      // Get public URL
      const { data: urlData } = this.client.storage
        .from(this.STORAGE_BUCKET)
        .getPublicUrl(secureFileName);

      const logoUrl = urlData.publicUrl;

      // Find existing tenant branding or create one
      const tenantBrandingId = await this.findOrCreateTenantBranding(empresaId);

      // Remove existing logo of the same type
      await this.removeExistingLogo(tenantBrandingId, type);

      // Save logo metadata to database (using snake_case for DB columns)
      const { error: saveError } = await this.client
        .from('tenant_logos')
        .insert({
          tenant_branding_id: tenantBrandingId,
          logo_type: type,
          logo_url: logoUrl,
          file_name: sanitizedFileName,
          file_size: file.size,
          mime_type: file.type,
        })
        .select()
        .single();

      if (saveError) {
        // Clean up uploaded file if database save fails
        await this.client.storage
          .from(this.STORAGE_BUCKET)
          .remove([secureFileName]);

        throw new LogoUploadError(`Failed to save logo metadata: ${saveError.message}`, {
          saveError,
          logoData,
        });
      }

      return {
        success: true,
        logoUrl,
      };
    } catch (error) {
      if (error instanceof LogoUploadError) {
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: false,
        error: `Unexpected error during logo upload: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Validate logo file for security and format compliance
   * Validates Requirements 1.3, 1.4, 7.2
   */
  async validateLogo(file: File): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check file size
    if (file.size > this.MAX_FILE_SIZE) {
      errors.push(`File size ${this.formatFileSize(file.size)} exceeds maximum allowed size of ${this.formatFileSize(this.MAX_FILE_SIZE)}`);
    }

    // Check MIME type
    if (!this.ALLOWED_MIME_TYPES.includes(file.type)) {
      errors.push(`File type ${file.type} is not supported. Allowed types: ${this.ALLOWED_MIME_TYPES.join(', ')}`);
    }

    // Check file extension
    const fileName = file.name.toLowerCase();
    const hasValidExtension = this.ALLOWED_EXTENSIONS.some(ext => fileName.endsWith(ext));
    if (!hasValidExtension) {
      errors.push(`File extension is not supported. Allowed extensions: ${this.ALLOWED_EXTENSIONS.join(', ')}`);
    }

    // Check for potentially malicious filenames
    if (this.hasMaliciousFileName(file.name)) {
      errors.push('Filename contains potentially unsafe characters');
    }

    // Validate file content (basic checks)
    try {
      await this.validateFileContent(file);
    } catch (error) {
      errors.push(`File content validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Size warnings
    if (file.size > 1024 * 1024) { // 1MB
      warnings.push('Large file size may impact loading performance');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Apply logo to UI elements (client-side operation)
   * Validates Requirements 1.1, 1.2
   */
  applyLogo(empresaId: string, logoUrl: string, type: LogoType): void {
    if (typeof document === 'undefined') {
      // Server-side context, cannot apply to DOM
      return;
    }

    try {
      switch (type) {
        case 'login':
          this.applyLoginLogo(logoUrl);
          break;
        case 'sidebar':
          this.applySidebarLogo(logoUrl);
          break;
        case 'favicon':
          this.applyFavicon(logoUrl);
          break;
        default:
          console.warn(`Unknown logo type: ${type}`);
      }
    } catch (error) {
      console.error(`Failed to apply ${type} logo:`, error);
    }
  }

  /**
   * Remove logo from storage and database
   */
  async removeLogo(empresaId: string, type: LogoType): Promise<void> {
    try {
      // Find tenant branding
      const { data: tenantBranding } = await this.client
        .from('tenant_branding')
        .select('id')
        .eq('empresaId', empresaId)
        .maybeSingle();

      if (!tenantBranding) {
        return; // No branding configuration exists
      }

      // Find existing logo
      const { data: existingLogo } = await this.client
        .from('tenant_logos')
        .select('*')
        .eq('tenantBrandingId', tenantBranding.id)
        .eq('logoType', type)
        .maybeSingle();

      if (!existingLogo) {
        return; // No logo to remove
      }

      // Extract file path from URL
      const filePath = this.extractFilePathFromUrl(existingLogo.logoUrl);

      // Remove from storage
      if (filePath) {
        await this.client.storage
          .from(this.STORAGE_BUCKET)
          .remove([filePath]);
      }

      // Remove from database
      await this.client
        .from('tenant_logos')
        .delete()
        .eq('id', existingLogo.id);

    } catch (error) {
      throw new LogoUploadError(`Failed to remove logo: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get specific logo for tenant
   */
  async getLogo(empresaId: string, type: LogoType): Promise<TenantLogo | null> {
    try {
      const { data: logo } = await this.client
        .from('tenant_logos')
        .select(`
          *,
          tenant_branding!inner(empresaId)
        `)
        .eq('tenant_branding.empresaId', empresaId)
        .eq('logoType', type)
        .maybeSingle();

      return logo || null;
    } catch (error) {
      console.error(`Failed to get ${type} logo for empresa ${empresaId}:`, error);
      return null;
    }
  }

  /**
   * Get all logos for tenant
   */
  async getAllLogos(empresaId: string): Promise<Record<LogoType, TenantLogo | null>> {
    try {
      const { data: logos } = await this.client
        .from('tenant_logos')
        .select(`
          *,
          tenant_branding!inner(empresaId)
        `)
        .eq('tenant_branding.empresaId', empresaId);

      const result: Record<LogoType, TenantLogo | null> = {
        login: null,
        sidebar: null,
        favicon: null,
      };

      if (logos) {
        logos.forEach(logo => {
          result[logo.logoType as LogoType] = logo;
        });
      }

      return result;
    } catch (error) {
      console.error(`Failed to get logos for empresa ${empresaId}:`, error);
      return {
        login: null,
        sidebar: null,
        favicon: null,
      };
    }
  }

  // Private helper methods

  private sanitizeFileName(fileName: string): string {
    // Remove path traversal attempts and dangerous characters
    return fileName
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(/\.+/g, '.')
      .replace(/^\.+|\.+$/g, '')
      .substring(0, 100); // Limit length
  }

  private getFileExtension(fileName: string): string {
    const lastDot = fileName.lastIndexOf('.');
    return lastDot > 0 ? fileName.substring(lastDot) : '';
  }

  private hasMaliciousFileName(fileName: string): boolean {
    const maliciousPatterns = [
      /\.\./,           // Path traversal
      /[<>:"|?*]/,      // Windows invalid characters
      /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i, // Windows reserved names
      /^\./,            // Hidden files
      /\.(exe|bat|cmd|scr|pif|com)$/i, // Executable extensions
    ];

    return maliciousPatterns.some(pattern => pattern.test(fileName));
  }

  private async validateFileContent(file: File): Promise<void> {
    // Basic file header validation
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer.slice(0, 16));

    // Check for common image file signatures
    const signatures = {
      png: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A],
      jpeg: [0xFF, 0xD8, 0xFF],
      webp: [0x52, 0x49, 0x46, 0x46], // RIFF header
      svg: [0x3C], // < character (XML start)
    };

    const isPNG = signatures.png.every((byte, i) => bytes[i] === byte);
    const isJPEG = signatures.jpeg.every((byte, i) => bytes[i] === byte);
    const isWEBP = signatures.webp.every((byte, i) => bytes[i] === byte);
    const isSVG = bytes[0] === signatures.svg[0] || file.type === 'image/svg+xml';

    if (!isPNG && !isJPEG && !isWEBP && !isSVG) {
      throw new Error('File content does not match expected image format');
    }
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  private async findOrCreateTenantBranding(empresaId: string): Promise<string> {
    // Try to find existing tenant branding
    const { data: existing } = await this.client
      .from('tenant_branding')
      .select('id')
      .eq('empresa_id', empresaId)
      .maybeSingle();

    if (existing) {
      return existing.id;
    }

    // Create new tenant branding (using snake_case for DB columns)
    const { data: created, error } = await this.client
      .from('tenant_branding')
      .insert({
        empresa_id: empresaId,
        created_by: 'system', // TODO: Get from context
        updated_by: 'system',
      })
      .select('id')
      .single();

    if (error || !created) {
      throw new LogoUploadError(`Failed to create tenant branding: ${error?.message || 'Unknown error'}`);
    }

    return created.id;
  }

  private async removeExistingLogo(tenantBrandingId: string, type: LogoType): Promise<void> {
    // Find existing logo (using snake_case for DB columns)
    const { data: existingLogo } = await this.client
      .from('tenant_logos')
      .select('*')
      .eq('tenant_branding_id', tenantBrandingId)
      .eq('logo_type', type)
      .maybeSingle();

    if (existingLogo) {
      // Extract file path and remove from storage
      const filePath = this.extractFilePathFromUrl(existingLogo.logo_url);
      if (filePath) {
        await this.client.storage
          .from(this.STORAGE_BUCKET)
          .remove([filePath]);
      }

      // Remove from database
      await this.client
        .from('tenant_logos')
        .delete()
        .eq('id', existingLogo.id);
    }
  }

  private extractFilePathFromUrl(url: string): string | null {
    try {
      // Extract path from Supabase storage URL
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/');
      const bucketIndex = pathParts.findIndex(part => part === this.STORAGE_BUCKET);
      
      if (bucketIndex >= 0 && bucketIndex < pathParts.length - 1) {
        return pathParts.slice(bucketIndex + 1).join('/');
      }
      
      return null;
    } catch {
      return null;
    }
  }

  private applyLoginLogo(logoUrl: string): void {
    // Apply to login page logo elements
    const loginLogoSelectors = [
      '[data-logo="login"]',
      '.login-logo',
      '#login-logo',
      '.auth-logo',
    ];

    loginLogoSelectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(element => {
        if (element instanceof HTMLImageElement) {
          element.src = logoUrl;
        } else {
          element.setAttribute('style', `background-image: url(${logoUrl})`);
        }
      });
    });
  }

  private applySidebarLogo(logoUrl: string): void {
    // Apply to sidebar header logo elements
    const sidebarLogoSelectors = [
      '[data-logo="sidebar"]',
      '.sidebar-logo',
      '#sidebar-logo',
      '.nav-logo',
    ];

    sidebarLogoSelectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(element => {
        if (element instanceof HTMLImageElement) {
          element.src = logoUrl;
        } else {
          element.setAttribute('style', `background-image: url(${logoUrl})`);
        }
      });
    });
  }

  private applyFavicon(logoUrl: string): void {
    // Update favicon
    let favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
    
    if (!favicon) {
      favicon = document.createElement('link');
      favicon.rel = 'icon';
      document.head.appendChild(favicon);
    }
    
    favicon.href = logoUrl;

    // Also update apple-touch-icon if it exists
    const appleTouchIcon = document.querySelector('link[rel="apple-touch-icon"]') as HTMLLinkElement;
    if (appleTouchIcon) {
      appleTouchIcon.href = logoUrl;
    }
  }
}