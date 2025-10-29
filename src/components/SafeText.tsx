// Text component with font scaling protection
import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';

interface SafeTextProps extends TextProps {
  children: React.ReactNode;
  maxFontSizeMultiplier?: number;
}

/**
 * SafeText component that prevents font scaling from breaking UI
 * Uses maxFontSizeMultiplier to cap font size increases
 */
const SafeText: React.FC<SafeTextProps> = ({ 
  children, 
  maxFontSizeMultiplier = 1.3,
  style,
  ...props 
}) => {
  return (
    <Text 
      maxFontSizeMultiplier={maxFontSizeMultiplier}
      style={style}
      {...props}
    >
      {children}
    </Text>
  );
};

export default SafeText;
