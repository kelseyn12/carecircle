import {
  performanceMonitor,
  measureAsyncOperation,
  measureSyncOperation,
  checkPerformanceThreshold,
  PERFORMANCE_THRESHOLDS,
} from '../performanceUtils';

describe('Performance Utilities', () => {
  beforeEach(() => {
    performanceMonitor.clear();
  });

  describe('performanceMonitor', () => {
    it('should track operation duration', () => {
      performanceMonitor.start('test-operation');
      // Simulate some work
      const start = Date.now();
      while (Date.now() - start < 10) {
        // busy wait
      }
      const duration = performanceMonitor.end('test-operation');

      expect(duration).toBeGreaterThan(0);
    });

    it('should store metrics', () => {
      performanceMonitor.start('op1');
      performanceMonitor.end('op1');
      
      const metrics = performanceMonitor.getMetrics();
      expect(metrics).toHaveLength(1);
      expect(metrics[0].operation).toBe('op1');
    });

    it('should calculate average duration', async () => {
      performanceMonitor.start('test-op');
      await new Promise((resolve) => setTimeout(resolve, 5));
      performanceMonitor.end('test-op');
      
      performanceMonitor.start('test-op');
      await new Promise((resolve) => setTimeout(resolve, 10));
      performanceMonitor.end('test-op');
      
      const avg = performanceMonitor.getAverageDuration('test-op');
      expect(avg).toBeGreaterThan(0);
      expect(avg).toBeGreaterThanOrEqual(5);
    });

    it('should filter metrics by operation', () => {
      performanceMonitor.start('op1');
      performanceMonitor.end('op1');
      
      performanceMonitor.start('op2');
      performanceMonitor.end('op2');
      
      const op1Metrics = performanceMonitor.getMetricsForOperation('op1');
      expect(op1Metrics).toHaveLength(1);
      expect(op1Metrics[0].operation).toBe('op1');
    });

    it('should generate performance report', () => {
      performanceMonitor.start('test-op');
      performanceMonitor.end('test-op');
      
      const report = performanceMonitor.getReport();
      expect(report).toContain('test-op');
      expect(report).toContain('Count:');
      expect(report).toContain('Average:');
    });
  });

  describe('measureAsyncOperation', () => {
    it('should measure async operation duration', async () => {
      const fn = async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        return 'result';
      };

      const result = await measureAsyncOperation('async-op', fn);

      expect(result).toBe('result');
      const metrics = performanceMonitor.getMetricsForOperation('async-op');
      expect(metrics.length).toBeGreaterThan(0);
    });

    it('should record metadata on success', async () => {
      const fn = async () => 'result';
      
      await measureAsyncOperation('async-op', fn, { test: 'data' });

      const metrics = performanceMonitor.getMetricsForOperation('async-op');
      expect(metrics[0].metadata?.test).toBe('data');
      expect(metrics[0].metadata?.success).toBe(true);
    });

    it('should record error on failure', async () => {
      const fn = async () => {
        throw new Error('test error');
      };

      await expect(measureAsyncOperation('async-op', fn)).rejects.toThrow();

      const metrics = performanceMonitor.getMetricsForOperation('async-op');
      expect(metrics[0].metadata?.success).toBe(false);
      expect(metrics[0].metadata?.error).toContain('test error');
    });
  });

  describe('measureSyncOperation', () => {
    it('should measure sync operation duration', () => {
      const fn = () => 'result';

      const result = measureSyncOperation('sync-op', fn);

      expect(result).toBe('result');
      const metrics = performanceMonitor.getMetricsForOperation('sync-op');
      expect(metrics.length).toBeGreaterThan(0);
    });

    it('should record metadata on success', () => {
      measureSyncOperation('sync-op', () => 'result', { test: 'data' });

      const metrics = performanceMonitor.getMetricsForOperation('sync-op');
      expect(metrics[0].metadata?.test).toBe('data');
      expect(metrics[0].metadata?.success).toBe(true);
    });
  });

  describe('checkPerformanceThreshold', () => {
    it('should pass when duration is under threshold', () => {
      const result = checkPerformanceThreshold('component-render', 10);
      
      expect(result.passed).toBe(true);
      expect(result.threshold).toBe(PERFORMANCE_THRESHOLDS.COMPONENT_RENDER);
    });

    it('should fail when duration exceeds threshold', () => {
      const result = checkPerformanceThreshold('component-render', 100);
      
      expect(result.passed).toBe(false);
      expect(result.message).toContain('exceeded');
    });

    it('should handle unknown operations', () => {
      const result = checkPerformanceThreshold('unknown-operation', 100);
      
      expect(result.passed).toBe(true);
      expect(result.message).toContain('No threshold defined');
    });

    it('should check navigation threshold', () => {
      const result = checkPerformanceThreshold('navigation', 200);
      
      expect(result.passed).toBe(true);
      expect(result.threshold).toBe(PERFORMANCE_THRESHOLDS.NAVIGATION);
    });

    it('should check Firestore read threshold', () => {
      const result = checkPerformanceThreshold('firestore-read', 500);
      
      expect(result.passed).toBe(true);
      expect(result.threshold).toBe(PERFORMANCE_THRESHOLDS.FIRESTORE_READ);
    });
  });

  describe('PERFORMANCE_THRESHOLDS', () => {
    it('should have reasonable threshold values', () => {
      expect(PERFORMANCE_THRESHOLDS.COMPONENT_RENDER).toBe(16); // 60fps
      expect(PERFORMANCE_THRESHOLDS.NAVIGATION).toBe(300); // Perceived instant
      expect(PERFORMANCE_THRESHOLDS.BUTTON_PRESS).toBeLessThan(200); // Should feel instant
    });
  });
});
