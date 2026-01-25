/**
 * Integration Test: Complete Brand Customization Workflow
 * 
 * Tests end-to-end customization process, multi-tenant isolation,
 * and real-time updates across sessions.
 * 
 * Validates Requirements 4.3, 4.4, 1.5
 * 
 * Feature: brand-customization, Complete Workflow Integration
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { createClient } from '@supabase/supabase-js';
import { BrandCustomizationManager } from '@/app/shared/core/services/brand-customization';
import { CSSPropertiesManager } from '@/lib/services/css-properties-manager';
import { BrandingSyncManager } from '@/lib/services/branding-sync-manager';
import type { 
  CompleteBrandingConfig, 
  ColorPalette, 
  FontScheme
} from '@/types/brand-customization';

// Mock environment variables for testing
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.warn('Supabase environment variables not found. Skipping complete workflow integration tests.');
}

const supabaseClient = SUPABASE_URL && SUPABASE_SERVICE_KEY 
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  : null;

describe('Complete Brand Customization Workflow Integration', () => {
  let brandManager: BrandCustomizationManager;
  let cssManager: CSSPropertiesManager;
  let syncManager: BrandingSyncManager;
  
  const testEmpresaId1 = 'test-empresa-1';
  const testEmpresaId2 = 'test-empresa-2';
  const testUserId = 'test-user-id';

  // Helper function to skip tests when supabase is not available
  const skipIfNoSupabase = () => {
    if (!supabaseClient) {
      console.log('Skipping test: Supabase client not available');
      return true;
    }
    return false;
  };

  beforeEach(async () => {
    if (skipIfNoSupabase()) return;

    brandManager = new BrandCustomizationManager(supabaseClient!);
    cssManager = new CSSPropertiesManager();
    syncManager = new BrandingSyncManager();

    // Clean up test data
    await cleanupTestData();
  });

  afterEach(async () => {
    if (skipIfNoSupabase()) return;
    await cleanupTestData();
  });

  const cleanupTestData = async () => {
    if (!supabaseClient) return;

    try {
      // Clean up tenant branding data
      await supabaseClient
        .from('tenant_branding')
        .delete()
        .in('empresa_id', [testEmpresaId1, testEmpresaId2]);

      // Clean up logos
      await supabaseClient
        .from('tenant_logos')
        .delete()
        .in('empresa_id', [testEmpresaId1, testEmpresaId2]);

      // Clean up color palettes
      await supabaseClient
        .from('color_palettes')
        .delete()
        .in('empresa_id', [testEmpresaId1, testEmpresaId2]);

      // Clean up font schemes
      await supabaseClient
        .from('font_schemes')
        .delete()
        .in('empresa_id', [testEmpresaId1, testEmpresaId2]);
    } catch (error) {
      console.warn('Cleanup failed:', error);
    }
  };

  describe('End-to-End Customization Process', () => {
    it('should complete full brand customization workflow', async () => {
      if (skipIfNoSupabase()) return;

      // Step 1: Create custom color palette
      const customPalette: ColorPalette = {
        id: 'test-palette-1',
        name: 'Corporate Blue',
        primary: '#1e40af',
        primaryForeground: '#ffffff',
        secondary: '#64748b',
        secondaryForeground: '#ffffff',
        accent: '#3b82f6',
        accentForeground: '#ffffff',
        muted: '#f1f5f9',
        mutedForeground: '#64748b',
        background: '#ffffff',
        foreground: '#0f172a',
        card: '#ffffff',
        cardForeground: '#0f172a',
        destructive: '#dc2626',
        destructiveForeground: '#ffffff',
        sidebar: '#f8fafc',
        sidebarForeground: '#0f172a',
        sidebarPrimary: '#1e40af',
        sidebarPrimaryForeground: '#ffffff',
        isCustom: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Step 2: Create custom font scheme
      const customFontScheme: FontScheme = {
        id: 'test-font-1',
        name: 'Corporate Sans',
        fontSans: ['Inter', 'system-ui', 'sans-serif'],
        fontMono: ['JetBrains Mono', 'monospace'],
        fontSizes: {
          xs: '0.75rem',
          sm: '0.875rem',
          base: '1rem',
          lg: '1.125rem',
          xl: '1.25rem',
          '2xl': '1.5rem',
          '3xl': '1.875rem',
          '4xl': '2.25rem'
        },
        fontWeights: {
          light: 300,
          normal: 400,
          medium: 500,
          semibold: 600,
          bold: 700
        },
        isCustom: true,
        googleFonts: ['Inter', 'JetBrains Mono'],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Step 3: Create complete branding configuration
      const brandingConfig: CompleteBrandingConfig = {
        empresaId: testEmpresaId1,
        logos: {
          login: 'https://example.com/login-logo.png',
          sidebar: 'https://example.com/sidebar-logo.png'
        },
        colorPalette: customPalette,
        fontScheme: customFontScheme,
        customCss: ':root { --custom-property: #1e40af; }',
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: testUserId,
        updatedBy: testUserId
      };

      // Step 4: Save the complete branding configuration
      await brandManager.saveTenantBranding(testEmpresaId1, {
        colorPalette: customPalette,
        fontScheme: customFontScheme,
        logos: brandingConfig.logos,
        customCss: brandingConfig.customCss
      });

      // Step 5: Load and verify the saved configuration
      const loadedBranding = await brandManager.loadTenantBranding(testEmpresaId1);
      
      expect(loadedBranding).toBeDefined();
      expect(loadedBranding.empresaId).toBe(testEmpresaId1);
      expect(loadedBranding.colorPalette?.primary).toBe('#1e40af');
      expect(loadedBranding.fontScheme?.fontSans).toContain('Inter');
      expect(loadedBranding.logos?.login).toBe('https://example.com/login-logo.png');

      // Step 6: Apply branding and verify CSS properties
      const cssProperties = cssManager.generateCSSProperties(loadedBranding);
      
      expect(cssProperties['--primary']).toBe('#1e40af');
      expect(cssProperties['--font-sans']).toContain('Inter');
      expect(cssProperties['--sidebar']).toBe('#f8fafc');

      // Step 7: Test real-time sync capabilities
      const syncEvents: any[] = [];
      syncManager.subscribe((event) => {
        syncEvents.push(event);
      });

      // Simulate branding update
      await syncManager.broadcastBrandingUpdate(testEmpresaId1, loadedBranding);
      
      expect(syncEvents).toHaveLength(1);
      expect(syncEvents[0].type).toBe('branding_updated');
      expect(syncEvents[0].empresaId).toBe(testEmpresaId1);
    });

    it('should handle partial customization workflow', async () => {
      if (skipIfNoSupabase()) return;

      // Test workflow with only color palette customization
      const partialConfig = {
        colorPalette: {
          id: 'partial-palette',
          name: 'Minimal Brand',
          primary: '#059669',
          primaryForeground: '#ffffff',
          secondary: '#6b7280',
          secondaryForeground: '#ffffff',
          accent: '#10b981',
          accentForeground: '#ffffff',
          muted: '#f3f4f6',
          mutedForeground: '#6b7280',
          background: '#ffffff',
          foreground: '#111827',
          card: '#ffffff',
          cardForeground: '#111827',
          destructive: '#dc2626',
          destructiveForeground: '#ffffff',
          sidebar: '#f9fafb',
          sidebarForeground: '#111827',
          sidebarPrimary: '#059669',
          sidebarPrimaryForeground: '#ffffff',
          isCustom: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      };

      await brandManager.saveTenantBranding(testEmpresaId1, partialConfig);
      const loadedBranding = await brandManager.loadTenantBranding(testEmpresaId1);

      expect(loadedBranding.colorPalette?.primary).toBe('#059669');
      expect(loadedBranding.fontScheme).toBeUndefined(); // Should not have font scheme
      expect(loadedBranding.logos).toEqual({}); // Should not have logos
    });
  });

  describe('Multi-Tenant Isolation Verification', () => {
    it('should maintain complete isolation between tenants', async () => {
      if (skipIfNoSupabase()) return;

      // Create different branding for two tenants
      const tenant1Branding = {
        colorPalette: {
          id: 'tenant1-palette',
          name: 'Tenant 1 Brand',
          primary: '#dc2626', // Red
          primaryForeground: '#ffffff',
          secondary: '#6b7280',
          secondaryForeground: '#ffffff',
          accent: '#ef4444',
          accentForeground: '#ffffff',
          muted: '#f3f4f6',
          mutedForeground: '#6b7280',
          background: '#ffffff',
          foreground: '#111827',
          card: '#ffffff',
          cardForeground: '#111827',
          destructive: '#dc2626',
          destructiveForeground: '#ffffff',
          sidebar: '#fef2f2',
          sidebarForeground: '#111827',
          sidebarPrimary: '#dc2626',
          sidebarPrimaryForeground: '#ffffff',
          isCustom: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        logos: {
          login: 'https://tenant1.com/logo.png'
        }
      };

      const tenant2Branding = {
        colorPalette: {
          id: 'tenant2-palette',
          name: 'Tenant 2 Brand',
          primary: '#2563eb', // Blue
          primaryForeground: '#ffffff',
          secondary: '#6b7280',
          secondaryForeground: '#ffffff',
          accent: '#3b82f6',
          accentForeground: '#ffffff',
          muted: '#f3f4f6',
          mutedForeground: '#6b7280',
          background: '#ffffff',
          foreground: '#111827',
          card: '#ffffff',
          cardForeground: '#111827',
          destructive: '#dc2626',
          destructiveForeground: '#ffffff',
          sidebar: '#eff6ff',
          sidebarForeground: '#111827',
          sidebarPrimary: '#2563eb',
          sidebarPrimaryForeground: '#ffffff',
          isCustom: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        logos: {
          login: 'https://tenant2.com/logo.png'
        }
      };

      // Save branding for both tenants
      await brandManager.saveTenantBranding(testEmpresaId1, tenant1Branding);
      await brandManager.saveTenantBranding(testEmpresaId2, tenant2Branding);

      // Load and verify isolation
      const loadedTenant1 = await brandManager.loadTenantBranding(testEmpresaId1);
      const loadedTenant2 = await brandManager.loadTenantBranding(testEmpresaId2);

      // Verify tenant 1 branding
      expect(loadedTenant1.empresaId).toBe(testEmpresaId1);
      expect(loadedTenant1.colorPalette?.primary).toBe('#dc2626');
      expect(loadedTenant1.logos?.login).toBe('https://tenant1.com/logo.png');

      // Verify tenant 2 branding
      expect(loadedTenant2.empresaId).toBe(testEmpresaId2);
      expect(loadedTenant2.colorPalette?.primary).toBe('#2563eb');
      expect(loadedTenant2.logos?.login).toBe('https://tenant2.com/logo.png');

      // Verify no cross-contamination
      expect(loadedTenant1.colorPalette?.primary).not.toBe(loadedTenant2.colorPalette?.primary);
      expect(loadedTenant1.logos?.login).not.toBe(loadedTenant2.logos?.login);
    });

    it('should handle concurrent tenant operations', async () => {
      if (skipIfNoSupabase()) return;

      const concurrentOperations = [
        brandManager.saveTenantBranding(testEmpresaId1, {
          colorPalette: {
            id: 'concurrent1',
            name: 'Concurrent 1',
            primary: '#059669',
            primaryForeground: '#ffffff',
            secondary: '#6b7280',
            secondaryForeground: '#ffffff',
            accent: '#10b981',
            accentForeground: '#ffffff',
            muted: '#f3f4f6',
            mutedForeground: '#6b7280',
            background: '#ffffff',
            foreground: '#111827',
            card: '#ffffff',
            cardForeground: '#111827',
            destructive: '#dc2626',
            destructiveForeground: '#ffffff',
            sidebar: '#f0fdf4',
            sidebarForeground: '#111827',
            sidebarPrimary: '#059669',
            sidebarPrimaryForeground: '#ffffff',
            isCustom: true,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        }),
        brandManager.saveTenantBranding(testEmpresaId2, {
          colorPalette: {
            id: 'concurrent2',
            name: 'Concurrent 2',
            primary: '#7c3aed',
            primaryForeground: '#ffffff',
            secondary: '#6b7280',
            secondaryForeground: '#ffffff',
            accent: '#8b5cf6',
            accentForeground: '#ffffff',
            muted: '#f3f4f6',
            mutedForeground: '#6b7280',
            background: '#ffffff',
            foreground: '#111827',
            card: '#ffffff',
            cardForeground: '#111827',
            destructive: '#dc2626',
            destructiveForeground: '#ffffff',
            sidebar: '#faf5ff',
            sidebarForeground: '#111827',
            sidebarPrimary: '#7c3aed',
            sidebarPrimaryForeground: '#ffffff',
            isCustom: true,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        })
      ];

      // Execute concurrent operations
      await Promise.all(concurrentOperations);

      // Verify both operations succeeded with correct isolation
      const [result1, result2] = await Promise.all([
        brandManager.loadTenantBranding(testEmpresaId1),
        brandManager.loadTenantBranding(testEmpresaId2)
      ]);

      expect(result1.colorPalette?.primary).toBe('#059669');
      expect(result2.colorPalette?.primary).toBe('#7c3aed');
    });
  });

  describe('Real-Time Updates Across Sessions', () => {
    it('should propagate branding updates across multiple sessions', async () => {
      if (skipIfNoSupabase()) return;

      const session1Events: any[] = [];
      const session2Events: any[] = [];

      // Simulate two different user sessions
      const session1Sync = new BrandingSyncManager();
      const session2Sync = new BrandingSyncManager();

      session1Sync.subscribe((event) => session1Events.push(event));
      session2Sync.subscribe((event) => session2Events.push(event));

      // Initial branding setup
      const initialBranding = {
        colorPalette: {
          id: 'realtime-test',
          name: 'Real-time Test',
          primary: '#f59e0b',
          primaryForeground: '#ffffff',
          secondary: '#6b7280',
          secondaryForeground: '#ffffff',
          accent: '#fbbf24',
          accentForeground: '#ffffff',
          muted: '#f3f4f6',
          mutedForeground: '#6b7280',
          background: '#ffffff',
          foreground: '#111827',
          card: '#ffffff',
          cardForeground: '#111827',
          destructive: '#dc2626',
          destructiveForeground: '#ffffff',
          sidebar: '#fffbeb',
          sidebarForeground: '#111827',
          sidebarPrimary: '#f59e0b',
          sidebarPrimaryForeground: '#ffffff',
          isCustom: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      };

      await brandManager.saveTenantBranding(testEmpresaId1, initialBranding);
      const savedBranding = await brandManager.loadTenantBranding(testEmpresaId1);

      // Broadcast update from session 1
      await session1Sync.broadcastBrandingUpdate(testEmpresaId1, savedBranding);

      // Both sessions should receive the update
      expect(session1Events).toHaveLength(1);
      expect(session2Events).toHaveLength(1);

      expect(session1Events[0].type).toBe('branding_updated');
      expect(session2Events[0].type).toBe('branding_updated');
      expect(session1Events[0].empresaId).toBe(testEmpresaId1);
      expect(session2Events[0].empresaId).toBe(testEmpresaId1);
    });

    it('should handle session-specific branding application', async () => {
      if (skipIfNoSupabase()) return;

      // Setup branding for tenant
      const brandingConfig = {
        colorPalette: {
          id: 'session-test',
          name: 'Session Test',
          primary: '#8b5cf6',
          primaryForeground: '#ffffff',
          secondary: '#6b7280',
          secondaryForeground: '#ffffff',
          accent: '#a78bfa',
          accentForeground: '#ffffff',
          muted: '#f3f4f6',
          mutedForeground: '#6b7280',
          background: '#ffffff',
          foreground: '#111827',
          card: '#ffffff',
          cardForeground: '#111827',
          destructive: '#dc2626',
          destructiveForeground: '#ffffff',
          sidebar: '#faf5ff',
          sidebarForeground: '#111827',
          sidebarPrimary: '#8b5cf6',
          sidebarPrimaryForeground: '#ffffff',
          isCustom: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        logos: {
          login: 'https://session-test.com/logo.png',
          sidebar: 'https://session-test.com/sidebar-logo.png'
        }
      };

      await brandManager.saveTenantBranding(testEmpresaId1, brandingConfig);

      // Simulate multiple sessions loading the same tenant branding
      const [session1Branding, session2Branding, session3Branding] = await Promise.all([
        brandManager.loadTenantBranding(testEmpresaId1),
        brandManager.loadTenantBranding(testEmpresaId1),
        brandManager.loadTenantBranding(testEmpresaId1)
      ]);

      // All sessions should get identical branding
      expect(session1Branding.colorPalette?.primary).toBe('#8b5cf6');
      expect(session2Branding.colorPalette?.primary).toBe('#8b5cf6');
      expect(session3Branding.colorPalette?.primary).toBe('#8b5cf6');

      expect(session1Branding.logos?.login).toBe('https://session-test.com/logo.png');
      expect(session2Branding.logos?.login).toBe('https://session-test.com/logo.png');
      expect(session3Branding.logos?.login).toBe('https://session-test.com/logo.png');

      // Generate CSS properties for each session
      const css1 = cssManager.generateCSSProperties(session1Branding);
      const css2 = cssManager.generateCSSProperties(session2Branding);
      const css3 = cssManager.generateCSSProperties(session3Branding);

      // CSS properties should be identical across sessions
      expect(css1['--primary']).toBe(css2['--primary']);
      expect(css2['--primary']).toBe(css3['--primary']);
      expect(css1['--sidebar']).toBe(css2['--sidebar']);
      expect(css2['--sidebar']).toBe(css3['--sidebar']);
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle database connection failures gracefully', async () => {
      if (skipIfNoSupabase()) return;

      // Create a manager with invalid client to simulate connection failure
      const invalidClient = createClient('https://invalid.supabase.co', 'invalid-key');
      const failingManager = new BrandCustomizationManager(invalidClient);

      // Should handle gracefully and not throw
      await expect(failingManager.loadTenantBranding(testEmpresaId1))
        .rejects.toThrow();

      // Should still work with valid manager
      const validResult = await brandManager.loadTenantBranding(testEmpresaId1);
      expect(validResult).toBeDefined();
    });

    it('should handle malformed branding data', async () => {
      if (skipIfNoSupabase()) return;

      // Try to save invalid branding data
      const invalidBranding = {
        colorPalette: {
          // Missing required fields
          id: 'invalid',
          name: 'Invalid Palette'
          // Missing all color properties
        }
      };

      // Should handle validation errors
      await expect(brandManager.saveTenantBranding(testEmpresaId1, invalidBranding as any))
        .rejects.toThrow();
    });
  });
});