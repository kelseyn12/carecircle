/**
 * Performance Testing Utilities
 * 
 * Utilities for measuring and monitoring app performance
 * including render times, memory usage, and operation latency.
 */

interface PerformanceMetrics {
  operation: string;
  duration: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private startTimes: Map<string, number> = new Map();

  /**
   * Start timing an operation
   */
  start(operation: string): void {
    this.startTimes.set(operation, Date.now());
  }

  /**
   * End timing an operation and record metrics
   */
  end(operation: string, metadata?: Record<string, any>): number {
    const startTime = this.startTimes.get(operation);
    if (!startTime) {
      console.warn(`No start time found for operation: ${operation}`);
      return 0;
    }

    const duration = Date.now() - startTime;
    this.metrics.push({
      operation,
      duration,
      timestamp: Date.now(),
      metadata,
    });

    this.startTimes.delete(operation);
    return duration;
  }

  /**
   * Get all metrics
   */
  getMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }

  /**
   * Get metrics for a specific operation
   */
  getMetricsForOperation(operation: string): PerformanceMetrics[] {
    return this.metrics.filter((m) => m.operation === operation);
  }

  /**
   * Get average duration for an operation
   */
  getAverageDuration(operation: string): number {
    const operationMetrics = this.getMetricsForOperation(operation);
    if (operationMetrics.length === 0) return 0;

    const total = operationMetrics.reduce((sum, m) => sum + m.duration, 0);
    return total / operationMetrics.length;
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics = [];
    this.startTimes.clear();
  }

  /**
   * Get performance report
   */
  getReport(): string {
    const uniqueOperations = [...new Set(this.metrics.map((m) => m.operation))];
    
    const report = uniqueOperations.map((op) => {
      const opMetrics = this.getMetricsForOperation(op);
      const avg = this.getAverageDuration(op);
      const min = Math.min(...opMetrics.map((m) => m.duration));
      const max = Math.max(...opMetrics.map((m) => m.duration));
      
      return `${op}:
  Count: ${opMetrics.length}
  Average: ${avg.toFixed(2)}ms
  Min: ${min}ms
  Max: ${max}ms`;
    }).join('\n\n');

    return report || 'No metrics recorded';
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

/**
 * Measure async operation performance
 */
export async function measureAsyncOperation<T>(
  operation: string,
  fn: () => Promise<T>,
  metadata?: Record<string, any>
): Promise<T> {
  performanceMonitor.start(operation);
  try {
    const result = await fn();
    performanceMonitor.end(operation, { ...metadata, success: true });
    return result;
  } catch (error) {
    performanceMonitor.end(operation, { ...metadata, success: false, error: String(error) });
    throw error;
  }
}

/**
 * Measure sync operation performance
 */
export function measureSyncOperation<T>(
  operation: string,
  fn: () => T,
  metadata?: Record<string, any>
): T {
  performanceMonitor.start(operation);
  try {
    const result = fn();
    performanceMonitor.end(operation, { ...metadata, success: true });
    return result;
  } catch (error) {
    performanceMonitor.end(operation, { ...metadata, success: false, error: String(error) });
    throw error;
  }
}

/**
 * Performance thresholds for operations
 */
export const PERFORMANCE_THRESHOLDS = {
  // Render times (should be < 16ms for 60fps)
  COMPONENT_RENDER: 16,
  
  // Navigation (should be < 300ms for perceived instant)
  NAVIGATION: 300,
  
  // Firebase operations (network dependent)
  FIRESTORE_READ: 1000,
  FIRESTORE_WRITE: 1000,
  STORAGE_UPLOAD: 5000,
  
  // User interactions (should feel instant)
  BUTTON_PRESS: 100,
  INPUT_RESPONSE: 50,
  
  // Data processing
  DATA_TRANSFORM: 100,
  VALIDATION: 50,
} as const;

/**
 * Check if operation meets performance threshold
 */
export function checkPerformanceThreshold(
  operation: string,
  duration: number
): { passed: boolean; threshold?: number; message: string } {
  // Map operations to thresholds
  const thresholdMap: Record<string, number> = {
    'component-render': PERFORMANCE_THRESHOLDS.COMPONENT_RENDER,
    'navigation': PERFORMANCE_THRESHOLDS.NAVIGATION,
    'firestore-read': PERFORMANCE_THRESHOLDS.FIRESTORE_READ,
    'firestore-write': PERFORMANCE_THRESHOLDS.FIRESTORE_WRITE,
    'storage-upload': PERFORMANCE_THRESHOLDS.STORAGE_UPLOAD,
    'button-press': PERFORMANCE_THRESHOLDS.BUTTON_PRESS,
    'input-response': PERFORMANCE_THRESHOLDS.INPUT_RESPONSE,
    'data-transform': PERFORMANCE_THRESHOLDS.DATA_TRANSFORM,
    'validation': PERFORMANCE_THRESHOLDS.VALIDATION,
  };

  const threshold = thresholdMap[operation.toLowerCase()];
  
  if (!threshold) {
    return {
      passed: true,
      message: `No threshold defined for: ${operation}`,
    };
  }

  const passed = duration <= threshold;
  
  return {
    passed,
    threshold,
    message: passed
      ? `${operation} completed in ${duration}ms (under ${threshold}ms threshold) ✅`
      : `${operation} took ${duration}ms (exceeded ${threshold}ms threshold) ⚠️`,
  };
}

/**
 * Memory usage utilities (for testing/debugging)
 */
export const memoryUtils = {
  /**
   * Log memory usage (if available)
   */
  logMemoryUsage(): void {
    if (typeof performance !== 'undefined' && (performance as any).memory) {
      const memory = (performance as any).memory;
      console.log('Memory Usage:', {
        used: `${(memory.usedJSHeapSize / 1048576).toFixed(2)} MB`,
        total: `${(memory.totalJSHeapSize / 1048576).toFixed(2)} MB`,
        limit: `${(memory.jsHeapSizeLimit / 1048576).toFixed(2)} MB`,
      });
    } else {
      console.log('Memory usage not available in this environment');
    }
  },
};

/**
 * Render performance hook (for React components)
 * 
 * Usage in components:
 * ```tsx
 * import { useRenderPerformance } from '../utils/performance';
 * 
 * function MyComponent() {
 *   useRenderPerformance('MyComponent');
 *   // ... component code
 * }
 * ```
 */
export function useRenderPerformance(componentName: string): void {
  if (__DEV__) {
    const startTime = Date.now();
    
    // Use useEffect to measure after render
    const React = require('react');
    React.useEffect(() => {
      const renderTime = Date.now() - startTime;
      const check = checkPerformanceThreshold('component-render', renderTime);
      
      if (!check.passed) {
        console.warn(`⚡ Performance: ${componentName} took ${renderTime}ms to render`, check);
      }
    });
  }
}
