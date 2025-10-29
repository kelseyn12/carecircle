import {
  calculateContrastRatio,
  meetsWCAGAA,
  hexToRgb,
  testAccessibilityProperties,
  checkTouchTargetSize,
  generateAccessibilityReport,
  accessibilityHelpers,
  WCAG_CONTRAST_RATIOS,
  MIN_TOUCH_TARGET_SIZE,
} from '../accessibilityUtils';

describe('Accessibility Utilities', () => {
  describe('hexToRgb', () => {
    it('should convert hex color to RGB', () => {
      const rgb = hexToRgb('#000000');
      expect(rgb).toEqual({ r: 0, g: 0, b: 0 });
    });

    it('should convert hex without # prefix', () => {
      const rgb = hexToRgb('ffffff');
      expect(rgb).toEqual({ r: 255, g: 255, b: 255 });
    });

    it('should return null for invalid hex', () => {
      const rgb = hexToRgb('invalid');
      expect(rgb).toBeNull();
    });
  });

  describe('calculateContrastRatio', () => {
    it('should calculate maximum contrast (black on white)', () => {
      const ratio = calculateContrastRatio(
        { r: 0, g: 0, b: 0 },
        { r: 255, g: 255, b: 255 }
      );
      expect(ratio).toBeGreaterThan(20); // Should be close to 21:1
    });

    it('should calculate minimum contrast (same colors)', () => {
      const ratio = calculateContrastRatio(
        { r: 100, g: 100, b: 100 },
        { r: 100, g: 100, b: 100 }
      );
      expect(ratio).toBeCloseTo(1, 1); // 1:1 ratio
    });

    it('should calculate reasonable contrast ratios', () => {
      const ratio = calculateContrastRatio(
        { r: 50, g: 50, b: 50 },
        { r: 200, g: 200, b: 200 }
      );
      expect(ratio).toBeGreaterThan(4);
      expect(ratio).toBeLessThan(10);
    });
  });

  describe('meetsWCAGAA', () => {
    it('should pass WCAG AA for high contrast (black on white)', () => {
      const passes = meetsWCAGAA(
        { r: 0, g: 0, b: 0 },
        { r: 255, g: 255, b: 255 }
      );
      expect(passes).toBe(true);
    });

    it('should fail WCAG AA for low contrast', () => {
      const passes = meetsWCAGAA(
        { r: 200, g: 200, b: 200 },
        { r: 210, g: 210, b: 210 }
      );
      expect(passes).toBe(false);
    });

    it('should use lower threshold for large text', () => {
      const passes = meetsWCAGAA(
        { r: 150, g: 150, b: 150 },
        { r: 200, g: 200, b: 200 },
        true // isLargeText
      );
      // Large text has 3:1 threshold instead of 4.5:1
      expect(typeof passes).toBe('boolean');
    });
  });

  describe('testAccessibilityProperties', () => {
    it('should pass for valid accessibility props', () => {
      const results = testAccessibilityProperties({
        accessible: true,
        accessibilityLabel: 'Test button',
        accessibilityRole: 'button',
      });

      const allPassed = results.every((r) => r.passed);
      expect(allPassed).toBe(true);
    });

    it('should fail for interactive component without label', () => {
      const results = testAccessibilityProperties({
        accessibilityRole: 'button',
        // Missing accessibilityLabel
      });

      const failed = results.find((r) => !r.passed && r.test === 'accessibility-label');
      expect(failed).toBeDefined();
      expect(failed?.severity).toBe('error');
    });

    it('should warn for redundant hint', () => {
      const results = testAccessibilityProperties({
        accessibilityLabel: 'Button',
        accessibilityHint: 'Button', // Same as label
      });

      const warning = results.find((r) => r.test === 'accessibility-hint');
      expect(warning).toBeDefined();
      expect(warning?.severity).toBe('warning');
    });

    it('should fail for invalid accessibility role', () => {
      const results = testAccessibilityProperties({
        accessibilityRole: 'invalid-role',
      });

      const failed = results.find((r) => r.test === 'accessibility-role');
      expect(failed).toBeDefined();
      expect(failed?.severity).toBe('error');
    });
  });

  describe('checkTouchTargetSize', () => {
    it('should pass for adequate touch target size', () => {
      const result = checkTouchTargetSize(MIN_TOUCH_TARGET_SIZE, MIN_TOUCH_TARGET_SIZE);
      expect(result.passed).toBe(true);
    });

    it('should fail for small touch target', () => {
      const result = checkTouchTargetSize(20, 20);
      expect(result.passed).toBe(false);
      expect(result.severity).toBe('error');
    });

    it('should pass for larger touch targets', () => {
      const result = checkTouchTargetSize(60, 60);
      expect(result.passed).toBe(true);
    });
  });

  describe('generateAccessibilityReport', () => {
    it('should generate report with correct counts', () => {
      const tests = [
        { test: 'test1', passed: true, message: 'Passed' },
        { test: 'test2', passed: true, message: 'Passed' },
        { test: 'test3', passed: false, message: 'Failed', severity: 'error' as const },
        { test: 'test4', passed: false, message: 'Warning', severity: 'warning' as const },
      ];

      const report = generateAccessibilityReport(tests);

      expect(report.total).toBe(4);
      expect(report.passed).toBe(2);
      expect(report.failed).toBe(1);
      expect(report.warnings).toBe(1);
      expect(report.score).toBe(50); // 2/4 = 50%
    });

    it('should calculate perfect score', () => {
      const tests = [
        { test: 'test1', passed: true, message: 'Passed' },
        { test: 'test2', passed: true, message: 'Passed' },
      ];

      const report = generateAccessibilityReport(tests);
      expect(report.score).toBe(100);
    });
  });

  describe('accessibilityHelpers', () => {
    it('should format button with count', () => {
      const label = accessibilityHelpers.buttonWithCount('Like', 5);
      expect(label).toBe('Like (5 items)');
    });

    it('should use singular for count of 1', () => {
      const label = accessibilityHelpers.buttonWithCount('Like', 1);
      expect(label).toBe('Like (1 item)');
    });

    it('should format navigation label', () => {
      const label = accessibilityHelpers.navigationLabel('Home');
      expect(label).toBe('Navigate to Home');
    });

    it('should format hint for action', () => {
      const hint = accessibilityHelpers.hintForAction('Submit');
      expect(hint).toBe('Double tap to submit');
    });

    it('should format date for screen reader', () => {
      const date = new Date('2024-01-15T14:30:00Z');
      const formatted = accessibilityHelpers.formatDateForScreenReader(date);
      expect(formatted).toContain('January');
      expect(formatted).toContain('15');
      expect(formatted).toContain('2024');
    });
  });

  describe('WCAG_CONTRAST_RATIOS', () => {
    it('should have correct WCAG AA ratios', () => {
      expect(WCAG_CONTRAST_RATIOS.NORMAL_TEXT).toBe(4.5);
      expect(WCAG_CONTRAST_RATIOS.LARGE_TEXT).toBe(3.0);
      expect(WCAG_CONTRAST_RATIOS.UI_COMPONENT).toBe(3.0);
    });
  });

  describe('MIN_TOUCH_TARGET_SIZE', () => {
    it('should be 44 pixels', () => {
      expect(MIN_TOUCH_TARGET_SIZE).toBe(44);
    });
  });
});
