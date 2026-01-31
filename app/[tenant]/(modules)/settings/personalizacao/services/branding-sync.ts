/**
 * Branding Synchronization Service
 *
 * Handles cross-tab synchronization of branding updates using the BroadcastChannel API.
 * This ensures that when branding is updated in one tab, other open tabs for the same
 * tenant reflect the changes immediately without needing a reload.
 */

type BrandingUpdateMessage = {
  type: "UPDATE" | "INVALIDATE";
  empresaId: string;
  data?: unknown;
  timestamp: number;
};

export class BrandingSync {
  private channel: BroadcastChannel | null = null;
  private readonly CHANNEL_NAME = "tenant-branding-sync";
  private listeners: Set<(message: BrandingUpdateMessage) => void> = new Set();
  private useLocalStorageFallback = false;

  constructor() {
    if (typeof window !== "undefined") {
      if ("BroadcastChannel" in window) {
        this.channel = new BroadcastChannel(this.CHANNEL_NAME);
        this.channel.onmessage = this.handleMessage.bind(this);
      } else {
        // Fallback for environments not supporting BroadcastChannel (e.g. older Safari)
        this.useLocalStorageFallback = true;
        (window as Window).addEventListener(
          "storage",
          this.handleStorageEvent.bind(this),
        );
      }
    }
  }

  /**
   * Publish an update to other tabs
   */
  publishUpdate(empresaId: string, data?: unknown) {
    this.postMessage({
      type: "UPDATE",
      empresaId,
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * Publish invalidation signal to other tabs
   */
  publishInvalidation(empresaId: string) {
    this.postMessage({
      type: "INVALIDATE",
      empresaId,
      timestamp: Date.now(),
    });
  }

  /**
   * Subscribe to messages
   */
  subscribe(callback: (message: BrandingUpdateMessage) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Close channel (cleanup)
   */
  close() {
    if (this.channel) {
      this.channel.close();
      this.channel = null;
    }
    if (this.useLocalStorageFallback && typeof window !== "undefined") {
      window.removeEventListener("storage", this.handleStorageEvent.bind(this));
    }
    this.listeners.clear();
  }

  private postMessage(message: BrandingUpdateMessage) {
    if (this.channel) {
      this.channel.postMessage(message);
    } else if (
      this.useLocalStorageFallback &&
      typeof localStorage !== "undefined"
    ) {
      // Use localStorage as message bus
      localStorage.setItem(this.CHANNEL_NAME, JSON.stringify(message));
      // Immediate cleanup not needed as 'storage' event fires on other tabs only
      // But we might want to clear it after a moment to avoid stale state?
      // Actually standard pattern is just setting it.
      // To ensure repeated same-messages trigger event (storage event only fires on change),
      // we already include 'timestamp' in message which guarantees uniqueness.
    }
  }

  private handleMessage(event: MessageEvent<BrandingUpdateMessage>) {
    this.notifyListeners(event.data);
  }

  private handleStorageEvent(event: StorageEvent) {
    if (event.key === this.CHANNEL_NAME && event.newValue) {
      try {
        const message = JSON.parse(event.newValue) as BrandingUpdateMessage;
        this.notifyListeners(message);
      } catch (e) {
        console.warn("Failed to parse branding sync message", e);
      }
    }
  }

  private notifyListeners(message: BrandingUpdateMessage) {
    if (this.listeners.size > 0 && message) {
      this.listeners.forEach((listener) => listener(message));
    }
  }
}
