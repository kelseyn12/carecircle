/**
 * Accessibility Testing Utilities
 * 
 * Utilities for testing and ensuring accessibility compliance
 * including screen reader support, keyboard navigation, and WCAG compliance.
 */

import { Platform } from 'react-native';

/**
 * Accessibility test results
 */
export interface AccessibilityTestResult {
  test: string;
  passed: boolean;
  message: string;
  severity?: 'error' | 'warning' | 'info';
}

/**
 * WCAG AA Color Contrast Ratios
 * - Normal text (16px+): 4.5:1
 * - Large text (18pt+ or 14pt+ bold): 3:1
 * - UI components: 3:1
 */
export const WCAG_CONTRAST_RATIOS = {
  NORMAL_TEXT: 4.5,
  LARGE_TEXT: 3.0,
  UI_COMPONENT: 3.0,
} as const;

/**
 * Minimum touch target size (iOS/Android guidelines)
 */
export const MIN_TOUCH_TARGET_SIZE = 44; // pixels

/**
 * Calculate luminance from RGB values (0-255)
 * Based on WCAG 2.1 formulas
 */
function calculateLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((val) => {
    val = val / 255;
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calculate contrast ratio between two colors
 * Returns ratio from 1:1 (no contrast) to 21:1 (maximum contrast)
 */
export function calculateContrastRatio(
  color1: { r: number; g: number; b: number },
  color2: { r: number; g: number; b: number }
): number {
  const l1 = calculateLuminance(color1.r, color1.g, color1.b);
  const l2 = calculateLuminance(color2.r, color2.g, color2.b);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if color contrast meets WCAG AA standards
 */
export function meetsWCAGAA(
  foreground: { r: number; g: number; b: number },
  background: { r: number; g: number; b: number },
  isLargeText: boolean = false
): boolean {
  const ratio = calculateContrastRatio(foreground, background);
  const threshold = isLargeText
    ? WCAG_CONTRAST_RATIOS.LARGE_TEXT
    : WCAG_CONTRAST_RATIOS.NORMAL_TEXT;
  return ratio >= threshold;
}

/**
 * Parse hex color to RGB
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * Test accessibility properties for a component
 */
export function testAccessibilityProperties(props: {
  accessible?: boolean;
  accessibilityLabel?: string;
  accessibilityRole?: string;
  accessibilityHint?: string;
}): AccessibilityTestResult[] {
  const results: AccessibilityTestResult[] = [];

  // Test 1: Component should be accessible
  if (props.accessible === false) {
    results.push({
      test: 'accessible-prop',
      passed: false,
      message: 'Component should be accessible (accessible={true} or omitted)',
      severity: 'error',
    });
  }

  // Test 2: Should have accessibilityLabel if interactive
  if (
    ['button', 'link', 'imagebutton', 'togglebutton'].includes(
      props.accessibilityRole || ''
    ) &&
    !props.accessibilityLabel
  ) {
    results.push({
      test: 'accessibility-label',
      passed: false,
      message:
        'Interactive components should have an accessibilityLabel for screen readers',
      severity: 'error',
    });
  }

  // Test 3: Accessibility hint should be helpful but not redundant
  if (props.accessibilityHint && props.accessibilityHint === props.accessibilityLabel) {
    results.push({
      test: 'accessibility-hint',
      passed: false,
      message: 'accessibilityHint should provide additional context, not repeat the label',
      severity: 'warning',
    });
  }

  // Test 4: Appropriate role for component
  const validRoles = [
    'none',
    'button',
    'link',
    'search',
    'image',
    'text',
    'adjustable',
    'imagebutton',
    'header',
    'summary',
    'alert',
    'checkbox',
    'combobox',
    'menu',
    'menubar',
    'menuitem',
    'progressbar',
    'radio',
    'radiogroup',
    'scrollbar',
    'spinbutton',
    'switch',
    'tab',
    'tablist',
    'timer',
    'toolbar',
  ];

  if (props.accessibilityRole && !validRoles.includes(props.accessibilityRole)) {
    results.push({
      test: 'accessibility-role',
      passed: false,
      message: `Invalid accessibilityRole: ${props.accessibilityRole}. Should be one of: ${validRoles.join(', ')}`,
      severity: 'error',
    });
  }

  return results.length > 0 ? results : [{ test: 'all-props', passed: true, message: 'All accessibility properties are correct' }];
}

/**
 * Check if touch target size meets minimum requirements
 */
export function checkTouchTargetSize(
  width: number,
  height: number
): AccessibilityTestResult {
  const minSize = MIN_TOUCH_TARGET_SIZE;
  const passes = width >= minSize && height >= minSize;

  return {
    test: 'touch-target-size',
    passed: passes,
    message: passes
      ? `Touch target ${width}x${height}px meets minimum size requirement (${minSize}px)`
      : `Touch target ${width}x${height}px is too small. Minimum: ${minSize}px`,
    severity: passes ? 'info' : 'error',
  };
}

/**
 * Generate accessibility testing report
 */
export function generateAccessibilityReport(
  tests: AccessibilityTestResult[]
): {
  passed: number;
  failed: number;
  warnings: number;
  total: number;
  score: number;
  details: AccessibilityTestResult[];
} {
  const passed = tests.filter((t) => t.passed).length;
  const failed = tests.filter((t) => !t.passed && t.severity === 'error').length;
  const warnings = tests.filter((t) => !t.passed && t.severity === 'warning').length;
  const total = tests.length;
  const score = total > 0 ? (passed / total) * 100 : 100;

  return {
    passed,
    failed,
    warnings,
    total,
    score: Math.round(score),
    details: tests,
  };
}

/**
 * Common accessibility helpers for components
 */
export const accessibilityHelpers = {
  /**
   * Generate accessibility label for button with count
   */
  buttonWithCount: (action: string, count: number): string => {
    return `${action} (${count} ${count === 1 ? 'item' : 'items'})`;
  },

  /**
   * Generate accessibility label for navigation
   */
  navigationLabel: (screen: string): string => {
    return `Navigate to ${screen}`;
  },

  /**
   * Generate accessibility hint for interactive elements
   */
  hintForAction: (action: string): string => {
    return `Double tap to ${action.toLowerCase()}`;
  },

  /**
   * Format date for screen readers
   */
  formatDateForScreenReader: (date: Date): string => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(date);
  },
};

/**
 * Platform-specific accessibility requirements
 */
export const PLATFORM_ACCESSIBILITY = {
  ios: {
    minTouchTarget: 44,
    supportVoiceOver: true,
    supportSwitchControl: true,
  },
  android: {
    minTouchTarget: 48, // Material Design recommends 48dp
    supportTalkBack: true,
    supportSwitchAccess: true,
  },
  web: {
    minTouchTarget: 44,
    supportKeyboardNavigation: true,
    supportScreenReaders: true,
  },
} as const;

/**
 * Get platform-specific accessibility requirements
 */
export function getPlatformRequirements(): typeof PLATFORM_ACCESSIBILITY.ios | typeof PLATFORM_ACCESSIBILITY.android {
  return Platform.OS === 'ios'
    ? PLATFORM_ACCESSIBILITY.ios
    : PLATFORM_ACCESSIBILITY.android;
}
