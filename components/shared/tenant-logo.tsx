'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { LogoType } from '@/types/brand-customization';

interface TenantLogoProps {
  logoType: LogoType;
  empresaId?: string;
  className?: string;
  fallbackText?: string;
  width?: number;
  height?: number;
}

/**
 * TenantLogo component displays tenant-specific logos with fallback to default
 * 
 * For login pages: Uses default system logo when no empresaId is provided
 * For authenticated pages: Uses tenant-specific logo based on empresaId
 */
export function TenantLogo({
  logoType,
  empresaId,
  className = '',
  fallbackText = 'Sistema',
  width = 120,
  height = 40
}: TenantLogoProps) {
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
        const response = await fetch(`/api/tenant-branding/${empresaId}/logos/${logoType}`);
        
        if (response.ok) {
          const data = await response.json();
          if (data.logoUrl) {
            setLogoUrl(data.logoUrl);
          } else {
            setLogoUrl(null);
          }
        } else {
          // If API doesn't exist yet or returns error, fallback to default
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
      <div className={className}>
        <Image
          src={logoUrl}
          alt={`Logo ${logoType}`}
          width={width}
          height={height}
          className="object-contain"
          onError={() => setError(true)}
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
      <span className="text-sm">
        {fallbackText}
      </span>
    </div>
  );
}