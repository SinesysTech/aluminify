/**
 * Branding Performance Monitor
 * 
 * Monitors and tracks performance metrics for brand customization operations.
 * Provides insights into CSS property updates, font loading, and cache performance.
 */

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

interface PerformanceReport {
  cssPropertyUpdates: {
    averageTime: number;
    totalUpdates: number;
    batchedUpdates: number;
    individualUpdates: number;
  };
  fontLoading: {
    averageLoadTime: number;
    totalFontsLoaded: number;
    cacheHitRate: number;
    failedLoads: number;
  };
  cachePerformance: {
    hitRate: number;
    averageRetrievalTime: number;
    memoryUsage: number;
    evictionCount: number;
  };
  overallPerformance: {
    averageBrandingApplicationTime: number;
    totalBrandingOperations: number;
    performanceScore: number;
  };
}

export class BrandingPerformanceMonitor {
  private static instance: BrandingPerformanceMonitor;
  private metrics: PerformanceMetric[] = [];
  private maxMetrics: number = 1000;
  private isEnabled: boolean = true;

  private constructor() {
    // Habilitar monitoramento fora de produção (dev/test) ou quando explicitamente ativado.
    // Em Jest (NODE_ENV=test) queremos registrar métricas para validar comportamento.
    this.isEnabled =
      process.env.NODE_ENV !== 'production' ||
      process.env.ENABLE_BRANDING_PERFORMANCE_MONITORING === 'true';
  }

  public static getInstance(): BrandingPerformanceMonitor {
    if (!BrandingPerformanceMonitor.instance) {
      BrandingPerformanceMonitor.instance = new BrandingPerformanceMonitor();
    }
    return BrandingPerformanceMonitor.instance;
  }

  /**
   * Start timing a performance operation
   */
  public startTiming(operationName: string): () => void {
    if (!this.isEnabled) return () => {};

    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      this.recordMetric(operationName, duration);
    };
  }

  /**
   * Record a performance metric
   */
  public recordMetric(name: string, value: number, metadata?: Record<string, unknown>): void {
    if (!this.isEnabled) return;

    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now(),
      metadata
    };

    this.metrics.push(metric);

    // Keep metrics array size manageable
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
  }

  /**
   * Record CSS property update performance
   */
  public recordCSSPropertyUpdate(propertyCount: number, duration: number, isBatched: boolean): void {
    this.recordMetric('css_property_update', duration, {
      propertyCount,
      isBatched,
      propertiesPerMs: propertyCount / duration
    });
  }

  /**
   * Record font loading performance
   */
  public recordFontLoading(fontName: string, duration: number, fromCache: boolean, success: boolean): void {
    this.recordMetric('font_loading', duration, {
      fontName,
      fromCache,
      success,
      loadSpeed: success ? 1000 / duration : 0 // fonts per second
    });
  }

  /**
   * Record cache operation performance
   */
  public recordCacheOperation(operation: 'get' | 'set' | 'delete', duration: number, hit: boolean): void {
    this.recordMetric('cache_operation', duration, {
      operation,
      hit,
      operationsPerSecond: 1000 / duration
    });
  }

  /**
   * Record complete branding application performance
   */
  public recordBrandingApplication(empresaId: string, duration: number, componentsApplied: string[]): void {
    this.recordMetric('branding_application', duration, {
      empresaId,
      componentsApplied,
      componentCount: componentsApplied.length,
      averageComponentTime: duration / componentsApplied.length
    });
  }

  /**
   * Get performance report
   */
  public getPerformanceReport(): PerformanceReport {
    const cssMetrics = this.getMetricsByName('css_property_update');
    const fontMetrics = this.getMetricsByName('font_loading');
    const cacheMetrics = this.getMetricsByName('cache_operation');
    const brandingMetrics = this.getMetricsByName('branding_application');

    return {
      cssPropertyUpdates: this.analyzeCSSMetrics(cssMetrics),
      fontLoading: this.analyzeFontMetrics(fontMetrics),
      cachePerformance: this.analyzeCacheMetrics(cacheMetrics),
      overallPerformance: this.analyzeBrandingMetrics(brandingMetrics)
    };
  }

  /**
   * Get metrics for a specific time range
   */
  public getMetricsInRange(startTime: number, endTime: number): PerformanceMetric[] {
    return this.metrics.filter(metric => 
      metric.timestamp >= startTime && metric.timestamp <= endTime
    );
  }

  /**
   * Get top slowest operations
   */
  public getSlowestOperations(limit: number = 10): PerformanceMetric[] {
    return [...this.metrics]
      .sort((a, b) => b.value - a.value)
      .slice(0, limit);
  }

  /**
   * Get performance trends over time
   */
  public getPerformanceTrends(metricName: string, intervalMs: number = 60000): Array<{
    timestamp: number;
    averageValue: number;
    count: number;
  }> {
    const metrics = this.getMetricsByName(metricName);
    const intervals = new Map<number, PerformanceMetric[]>();

    // Group metrics by time intervals
    metrics.forEach(metric => {
      const intervalKey = Math.floor(metric.timestamp / intervalMs) * intervalMs;
      if (!intervals.has(intervalKey)) {
        intervals.set(intervalKey, []);
      }
      intervals.get(intervalKey)!.push(metric);
    });

    // Calculate averages for each interval
    return Array.from(intervals.entries())
      .map(([timestamp, intervalMetrics]) => ({
        timestamp,
        averageValue: intervalMetrics.reduce((sum, m) => sum + m.value, 0) / intervalMetrics.length,
        count: intervalMetrics.length
      }))
      .sort((a, b) => a.timestamp - b.timestamp);
  }

  /**
   * Clear all metrics
   */
  public clearMetrics(): void {
    this.metrics = [];
  }

  /**
   * Export metrics for analysis
   */
  public exportMetrics(): string {
    return JSON.stringify({
      exportTime: new Date().toISOString(),
      metricsCount: this.metrics.length,
      metrics: this.metrics
    }, null, 2);
  }

  /**
   * Enable or disable performance monitoring
   */
  public setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  /**
   * Check if performance monitoring is enabled
   */
  public isMonitoringEnabled(): boolean {
    return this.isEnabled;
  }

  /**
   * Get memory usage of the monitor itself
   */
  public getMonitorMemoryUsage(): number {
    return JSON.stringify(this.metrics).length;
  }

  /**
   * Get metrics by name
   */
  private getMetricsByName(name: string): PerformanceMetric[] {
    return this.metrics.filter(metric => metric.name === name);
  }

  /**
   * Analyze CSS property update metrics
   */
  private analyzeCSSMetrics(metrics: PerformanceMetric[]): PerformanceReport['cssPropertyUpdates'] {
    if (metrics.length === 0) {
      return {
        averageTime: 0,
        totalUpdates: 0,
        batchedUpdates: 0,
        individualUpdates: 0
      };
    }

    const totalTime = metrics.reduce((sum, m) => sum + m.value, 0);
    const batchedUpdates = metrics.filter(m => m.metadata?.isBatched).length;

    return {
      averageTime: totalTime / metrics.length,
      totalUpdates: metrics.length,
      batchedUpdates,
      individualUpdates: metrics.length - batchedUpdates
    };
  }

  /**
   * Analyze font loading metrics
   */
  private analyzeFontMetrics(metrics: PerformanceMetric[]): PerformanceReport['fontLoading'] {
    if (metrics.length === 0) {
      return {
        averageLoadTime: 0,
        totalFontsLoaded: 0,
        cacheHitRate: 0,
        failedLoads: 0
      };
    }

    const totalTime = metrics.reduce((sum, m) => sum + m.value, 0);
    const cacheHits = metrics.filter(m => m.metadata?.fromCache).length;
    const failedLoads = metrics.filter(m => !m.metadata?.success).length;

    return {
      averageLoadTime: totalTime / metrics.length,
      totalFontsLoaded: metrics.length,
      cacheHitRate: cacheHits / metrics.length,
      failedLoads
    };
  }

  /**
   * Analyze cache operation metrics
   */
  private analyzeCacheMetrics(metrics: PerformanceMetric[]): PerformanceReport['cachePerformance'] {
    if (metrics.length === 0) {
      return {
        hitRate: 0,
        averageRetrievalTime: 0,
        memoryUsage: 0,
        evictionCount: 0
      };
    }

    const totalTime = metrics.reduce((sum, m) => sum + m.value, 0);
    const hits = metrics.filter(m => m.metadata?.hit).length;
    const getOperations = metrics.filter(m => m.metadata?.operation === 'get');

    return {
      hitRate: getOperations.length > 0 ? hits / getOperations.length : 0,
      averageRetrievalTime: totalTime / metrics.length,
      memoryUsage: 0, // This would need to be provided externally
      evictionCount: 0 // This would need to be tracked separately
    };
  }

  /**
   * Analyze overall branding application metrics
   */
  private analyzeBrandingMetrics(metrics: PerformanceMetric[]): PerformanceReport['overallPerformance'] {
    if (metrics.length === 0) {
      return {
        averageBrandingApplicationTime: 0,
        totalBrandingOperations: 0,
        performanceScore: 100
      };
    }

    const totalTime = metrics.reduce((sum, m) => sum + m.value, 0);
    const averageTime = totalTime / metrics.length;

    // Calculate performance score (lower time = higher score)
    // Score from 0-100, where 100ms = 50 points, 50ms = 75 points, 25ms = 90 points
    const performanceScore = Math.max(0, Math.min(100, 100 - (averageTime / 2)));

    return {
      averageBrandingApplicationTime: averageTime,
      totalBrandingOperations: metrics.length,
      performanceScore
    };
  }
}

/**
 * Utility functions for performance monitoring
 */

/**
 * Performance decorator for methods
 */
export function measurePerformance(metricName: string) {
  return function (target: unknown, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    const monitor = getBrandingPerformanceMonitor();

    descriptor.value = async function (...args: unknown[]) {
      const stopTiming = monitor.startTiming(metricName);
      
      try {
        const result = await method.apply(this, args);
        stopTiming();
        return result;
      } catch (error) {
        stopTiming();
        throw error;
      }
    };
  };
}

/**
 * Get singleton instance of performance monitor
 */
export function getBrandingPerformanceMonitor(): BrandingPerformanceMonitor {
  return BrandingPerformanceMonitor.getInstance();
}

/**
 * Create performance timing wrapper
 */
export function withPerformanceTiming<T>(
  operationName: string,
  operation: () => Promise<T> | T
): Promise<T> {
  const monitor = getBrandingPerformanceMonitor();
  const stopTiming = monitor.startTiming(operationName);

  try {
    const result = operation();
    
    if (result instanceof Promise) {
      return result.finally(() => stopTiming());
    } else {
      stopTiming();
      return Promise.resolve(result);
    }
  } catch (error) {
    stopTiming();
    throw error;
  }
}