/**
 * Branding Sync Manager
 * 
 * Manages real-time synchronization of branding changes across browser tabs,
 * sessions, and potentially multiple users within the same empresa.
 */

import type { CompleteBrandingConfig } from '@/empresa/personalizacao/services/empresa/personalizacao.types';

export interface BrandingSyncEvent {
  type: 'branding-updated' | 'branding-reset' | 'branding-error';
  empresaId: string;
  timestamp: number;
  data?: CompleteBrandingConfig;
  error?: string;
}

export type BrandingSyncListener = (event: BrandingSyncEvent) => void;

export class BrandingSyncManager {
  private static instance: BrandingSyncManager;
  private listeners: Set<BrandingSyncListener> = new Set();
  private currentEmpresaId: string | null = null;

  private constructor() {
    // Listen for storage events (cross-tab communication)
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', this.handleStorageEvent.bind(this));
    }
  }

  public static getInstance(): BrandingSyncManager {
    if (!BrandingSyncManager.instance) {
      BrandingSyncManager.instance = new BrandingSyncManager();
    }
    return BrandingSyncManager.instance;
  }

  /**
   * Set the current empresa ID for filtering events
   */
  public setCurrentEmpresa(empresaId: string | null): void {
    this.currentEmpresaId = empresaId;
  }

  /**
   * Add a listener for branding sync events
   */
  public addListener(listener: BrandingSyncListener): () => void {
    this.listeners.add(listener);
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Remove a listener
   */
  public removeListener(listener: BrandingSyncListener): void {
    this.listeners.delete(listener);
  }

  /**
   * Broadcast a branding update event
   */
  public broadcastBrandingUpdate(
    empresaId: string, 
    branding: CompleteBrandingConfig
  ): void {
    const event: BrandingSyncEvent = {
      type: 'branding-updated',
      empresaId,
      timestamp: Date.now(),
      data: branding,
    };

    this.broadcastEvent(event);
  }

  /**
   * Broadcast a branding reset event
   */
  public broadcastBrandingReset(empresaId: string): void {
    const event: BrandingSyncEvent = {
      type: 'branding-reset',
      empresaId,
      timestamp: Date.now(),
    };

    this.broadcastEvent(event);
  }

  /**
   * Broadcast a branding error event
   */
  public broadcastBrandingError(empresaId: string, error: string): void {
    const event: BrandingSyncEvent = {
      type: 'branding-error',
      empresaId,
      timestamp: Date.now(),
      error,
    };

    this.broadcastEvent(event);
  }

  /**
   * Get the last sync timestamp for an empresa
   */
  public getLastSyncTimestamp(empresaId: string): number | null {
    if (typeof window === 'undefined') return null;
    
    const key = `branding-sync-${empresaId}`;
    const stored = localStorage.getItem(key);
    return stored ? parseInt(stored, 10) : null;
  }

  /**
   * Set the last sync timestamp for an empresa
   */
  public setLastSyncTimestamp(empresaId: string, timestamp: number): void {
    if (typeof window === 'undefined') return;
    
    const key = `branding-sync-${empresaId}`;
    localStorage.setItem(key, timestamp.toString());
  }

  /**
   * Check if branding data is stale and needs refresh
   */
  public isBrandingStale(empresaId: string, maxAgeMs: number = 300000): boolean {
    const lastSync = this.getLastSyncTimestamp(empresaId);
    if (!lastSync) return true;
    
    return Date.now() - lastSync > maxAgeMs;
  }

  /**
   * Private method to broadcast an event
   */
  private broadcastEvent(event: BrandingSyncEvent): void {
    // Store in localStorage to trigger cross-tab events
    if (typeof window !== 'undefined') {
      const key = 'branding-sync-event';
      localStorage.setItem(key, JSON.stringify(event));
      
      // Remove immediately to trigger storage event
      localStorage.removeItem(key);
    }

    // Notify local listeners
    this.notifyListeners(event);
  }

  /**
   * Handle storage events from other tabs
   */
  private handleStorageEvent(event: StorageEvent): void {
    if (event.key === 'branding-sync-event' && event.newValue) {
      try {
        const syncEvent: BrandingSyncEvent = JSON.parse(event.newValue);
        this.notifyListeners(syncEvent);
      } catch (error) {
        console.error('Failed to parse branding sync event:', error);
      }
    }
  }

  /**
   * Notify all listeners of an event
   */
  private notifyListeners(event: BrandingSyncEvent): void {
    // Only notify if the event is for the current empresa or no empresa is set
    if (!this.currentEmpresaId || event.empresaId === this.currentEmpresaId) {
      this.listeners.forEach(listener => {
        try {
          listener(event);
        } catch (error) {
          console.error('Error in branding sync listener:', error);
        }
      });
    }
  }

  /**
   * Clean up old sync timestamps
   */
  public cleanupOldSyncData(maxAgeMs: number = 86400000): void {
    if (typeof window === 'undefined') return;

    const now = Date.now();
    const keysToRemove: string[] = [];

    // Check all localStorage keys for old sync data
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('branding-sync-')) {
        const value = localStorage.getItem(key);
        if (value) {
          const timestamp = parseInt(value, 10);
          if (now - timestamp > maxAgeMs) {
            keysToRemove.push(key);
          }
        }
      }
    }

    // Remove old keys
    keysToRemove.forEach(key => localStorage.removeItem(key));
  }
}

/**
 * Hook for using branding sync manager
 */
export function useBrandingSyncManager() {
  return BrandingSyncManager.getInstance();
}

/**
 * Utility function to get singleton instance
 */
export function getBrandingSyncManager(): BrandingSyncManager {
  return BrandingSyncManager.getInstance();
}