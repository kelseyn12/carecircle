// TextInput component with font scaling protection and consistent sizing
import React from 'react';
import { TextInput, TextInputProps } from 'react-native';

interface SafeTextInputProps extends TextInputProps {
  size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl';
}

/**
 * SafeTextInput component that prevents font scaling from breaking UI
 * Provides consistent text and placeholder sizing
 * 
 * Size mapping (matches SafeText):
 * xs: 13px
 * sm: 16px
 * base: 19px (default)
 * lg: 21px
 * xl: 24px
 */
const SafeTextInput: React.FC<SafeTextInputProps> = ({ 
  size,
  style,
  placeholderTextColor,
  ...props 
}) => {
  // Size mapping - matches SafeText sizes
  const sizeMap: Record<string, number> = {
    xs: 13,
    sm: 16,
    base: 19, // default
    lg: 21,
    xl: 24,
  };

  // Extract size from className if not explicitly provided
  let fontSize: number = sizeMap.base;
  if (size) {
    fontSize = sizeMap[size];
  } else if (props.className) {
    const className = String(props.className);
    if (className.includes('text-xs')) fontSize = sizeMap.xs;
    else if (className.includes('text-sm')) fontSize = sizeMap.sm;
    else if (className.includes('text-base')) fontSize = sizeMap.base;
    else if (className.includes('text-lg')) fontSize = sizeMap.lg;
    else if (className.includes('text-xl')) fontSize = sizeMap.xl;
  }

  // Merge styles - ensure fontSize is set
  const styleObj = style && typeof style === 'object' && !Array.isArray(style) ? style : {};
  const hasInlineFontSize = 'fontSize' in styleObj;
  
  const mergedStyle = [
    !hasInlineFontSize && { fontSize },
    style,
  ].filter(Boolean);

  return (
    <TextInput 
      allowFontScaling={false}
      maxFontSizeMultiplier={1.0}
      style={mergedStyle}
      placeholderTextColor={placeholderTextColor || '#9CA3AF'}
      {...props}
    />
  );
};

export default SafeTextInput;

