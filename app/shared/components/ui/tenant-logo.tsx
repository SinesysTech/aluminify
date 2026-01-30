'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useTenantBrandingOptional } from '@/hooks/use-tenant-branding';
import type { LogoType, TenantLogoMode } from '@/app/[tenant]/(modules)/empresa/(gestao)/personalizacao/services/brand-customization.types';

interface TenantLogoProps {
  logoType: LogoType;
  empresaId?: string;
  className?: string;
  fallbackText?: string;
  width?: number;
  height?: number;
  /**
   * Force standalone mode even when inside TenantBrandingProvider
   * Useful for preview during upload
   */
  forceStandalone?: boolean;
}

/**
 * TenantLogo component displays tenant-specific logos with fallback to default
 *
 * Operates in two modes:
 * - Connected: Uses data from TenantBrandingProvider context (automatic updates)
 * - Standalone: Fetches data via API (for unauthenticated pages like login)
 *
 * The mode is automatically determined based on context availability.
 */
export function TenantLogo({
  logoType,
  empresaId,
  className = '',
  fallbackText = 'Sistema',
  width = 120,
  height = 40,
  forceStandalone = false,
}: TenantLogoProps) {
  const brandingContext = useTenantBrandingOptional();

  // Determine mode: use context if available and not forced standalone
  const shouldUseContext = !forceStandalone && brandingContext !== null;

  // Connected mode: get URL from context
  if (shouldUseContext && brandingContext) {
    return (
      <ConnectedTenantLogo
        logoType={logoType}
        className={className}
        fallbackText={fallbackText}
        width={width}
        height={height}
        getLogoUrl={brandingContext.getLogoUrl}
        loading={brandingContext.loadingBranding}
      />
    );
  }

  // Standalone mode: fetch from API
  return (
    <StandaloneTenantLogo
      logoType={logoType}
      empresaId={empresaId}
      className={className}
      fallbackText={fallbackText}
      width={width}
      height={height}
    />
  );
}

/**
 * Connected mode: uses context data (no fetch)
 */
function ConnectedTenantLogo({
  logoType,
  className,
  fallbackText,
  width,
  height,
  getLogoUrl,
  loading,
}: {
  logoType: LogoType;
  className: string;
  fallbackText: string;
  width: number;
  height: number;
  getLogoUrl: (type: LogoType) => string | null;
  loading: boolean;
}) {
  const [imageError, setImageError] = useState(false);
  const logoUrl = getLogoUrl(logoType);

  // Reset error state when URL changes
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setImageError(false);
  }, [logoUrl]);

  // Show loading state only during initial load
  if (loading && !logoUrl) {
    return (
      <div
        className={`flex items-center justify-center bg-muted rounded ${className}`}
        style={{ width, height }}
      >
        <div className="animate-pulse text-sm text-muted-foreground">
          Carregando...
        </div>
      </div>
    );
  }

  // Show logo if available and no error
  if (logoUrl && !imageError) {
    return (
      <div className={`relative ${className}`} style={{ width, height }}>
        <Image
          src={logoUrl}
          alt={`Logo ${logoType}`}
          fill
          priority // Ensure logos load fast
          sizes={`${width}px`} // Optimization hint
          className="object-contain"
          onError={() => setImageError(true)}
          unoptimized // Allow external URLs from Supabase
        />
      </div>
    );
  }

  // Fallback to default
  return (
    <div
      className={`flex items-center justify-center bg-primary text-primary-foreground rounded font-semibold ${className}`}
      style={{ width, height }}
    >
      <span className="text-sm">{fallbackText}</span>
    </div>
  );
}

/**
 * Standalone mode: fetches from API (for unauthenticated pages)
 */
function StandaloneTenantLogo({
  logoType,
  empresaId,
  className,
  fallbackText,
  width,
  height,
}: {
  logoType: LogoType;
  empresaId?: string;
  className: string;
  fallbackText: string;
  width: number;
  height: number;
}) {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    const loadTenantLogo = async () => {
      // If no empresaId provided, use default system logo
      if (!empresaId) {
        setLogoUrl(null);
        return;
      }

      setLoading(true);
      setError(false);

      try {
        // Use public endpoint (no authentication required)
        const response = await fetch(
          `/api/empresa/personalizacao/${empresaId}/logos/${logoType}/public`
        );

        if (response.ok) {
          const result = await response.json();
          // API returns { success: true, data: TenantLogo }
          if (result.success && result.data?.logoUrl) {
            // Add cache-busting parameter
            const url = result.data.logoUrl;
            const separator = url.includes('?') ? '&' : '?';
            setLogoUrl(`${url}${separator}v=${Date.now()}`);
          } else {
            setLogoUrl(null);
          }
        } else {
          // If API returns error, fallback to default
          setLogoUrl(null);
        }
      } catch (err) {
        console.warn(`Failed to load tenant logo for ${logoType}:`, err);
        setError(true);
        setLogoUrl(null);
      } finally {
        setLoading(false);
      }
    };

    loadTenantLogo();
  }, [empresaId, logoType]);

  // Show loading state
  if (loading) {
    return (
      <div
        className={`flex items-center justify-center bg-muted rounded ${className}`}
        style={{ width, height }}
      >
        <div className="animate-pulse text-sm text-muted-foreground">
          Carregando...
        </div>
      </div>
    );
  }

  // Show tenant logo if available
  if (logoUrl && !error) {
    return (
      <div className={`relative ${className}`} style={{ width, height }}>
        <Image
          src={logoUrl}
          alt={`Logo ${logoType}`}
          fill
          priority
          sizes={`${width}px`}
          className="object-contain"
          onError={() => setError(true)}
          unoptimized // Allow external URLs from Supabase
        />
      </div>
    );
  }

  // Fallback to default system logo or text
  return (
    <div
      className={`flex items-center justify-center bg-primary text-primary-foreground rounded font-semibold ${className}`}
      style={{ width, height }}
    >
      <span className="text-sm">{fallbackText}</span>
    </div>
  );
}

/**
 * Export mode type for external use
 */
export type { TenantLogoMode };
