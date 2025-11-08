// Text component with font scaling protection and consistent sizing
import React from 'react';
import { Text, TextProps } from 'react-native';

interface SafeTextProps extends TextProps {
  children: React.ReactNode;
  maxFontSizeMultiplier?: number;
  className?: string;
  allowFontScaling?: boolean;
  size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl';
}

/**
 * SafeText component that prevents font scaling from breaking UI
 * Disables font scaling by default to prevent layout issues
 * Provides consistent text sizing across the app
 * 
 * Size mapping (larger sizes for better readability):
 * xs: 13px
 * sm: 16px
 * base: 19px (default)
 * lg: 21px
 * xl: 24px
 * 2xl: 28px
 * 3xl: 32px
 * 4xl: 38px
 * 5xl: 44px
 * 6xl: 50px
 */
const SafeText: React.FC<SafeTextProps> = ({ 
  children, 
  maxFontSizeMultiplier = 1.0,
  allowFontScaling = false,
  size,
  style,
  ...props 
}) => {
  // Size mapping - larger sizes for better readability
  const sizeMap: Record<string, number> = {
    xs: 13,   // Increased from 11
    sm: 16,   // Increased from 14
    base: 19, // Increased from 17 (default)
    lg: 21,   // Increased from 19
    xl: 24,   // Increased from 22
    '2xl': 28, // Increased from 26
    '3xl': 32, // Increased from 30
    '4xl': 38, // Increased from 36
    '5xl': 44, // Increased from 42
    '6xl': 50, // Increased from 48
  };

  // Extract size from className if not explicitly provided
  let fontSize: number | undefined;
  if (size) {
    fontSize = sizeMap[size];
  } else if (props.className) {
    // Try to extract size from Tailwind classes
    const className = String(props.className);
    if (className.includes('text-xs')) fontSize = sizeMap.xs;
    else if (className.includes('text-sm')) fontSize = sizeMap.sm;
    else if (className.includes('text-base')) fontSize = sizeMap.base;
    else if (className.includes('text-lg')) fontSize = sizeMap.lg;
    else if (className.includes('text-xl')) fontSize = sizeMap.xl;
    else if (className.includes('text-2xl')) fontSize = sizeMap['2xl'];
    else if (className.includes('text-3xl')) fontSize = sizeMap['3xl'];
    else if (className.includes('text-4xl')) fontSize = sizeMap['4xl'];
    else if (className.includes('text-5xl')) fontSize = sizeMap['5xl'];
    else if (className.includes('text-6xl')) fontSize = sizeMap['6xl'];
    // Default to base if no size class found
    else if (!className.includes('text-')) fontSize = sizeMap.base;
  } else {
    // Default to base size if nothing specified
    fontSize = sizeMap.base;
  }

  // Merge styles - if style has fontSize, use it; otherwise use our calculated fontSize
  const styleObj = style && typeof style === 'object' && !Array.isArray(style) ? style : {};
  const hasInlineFontSize = 'fontSize' in styleObj;
  
  const mergedStyle = [
    !hasInlineFontSize && fontSize && { fontSize },
    style,
  ].filter(Boolean);

  return (
    <Text 
      allowFontScaling={allowFontScaling}
      maxFontSizeMultiplier={maxFontSizeMultiplier}
      style={mergedStyle}
      {...props}
    >
      {children}
    </Text>
  );
};

export default SafeText;
