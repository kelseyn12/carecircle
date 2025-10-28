// Emoji utilities for consistent emoji handling across the app

export const EMOJIS = {
  // Reaction emojis
  HEART: '❤️',
  PRAY: '🙏', 
  THUMBS_UP: '👍',
  COMMENT: '💬',
  
  // UI emojis
  BLUE_HEART: '💙',
  WARNING: '⚠️',
  CAMERA: '📷',
  LIGHTBULB: '💡',
  CHECKMARK: '✅',
  EMAIL: '📧',
  PEOPLE: '👥',
  SEARCH: '🔍',
  APPLE: '🍎',
  GEAR: '⚙️',
  ARROW_LEFT: '←',
  ARROW_RIGHT: '→',
  ARROW_UP: '↑',
  ARROW_DOWN: '↓',
  CLOSE: '×',
  
  // Success/Status emojis
  SUCCESS: '✅',
  ERROR: '❌',
  INFO: 'ℹ️',
  
  // Navigation emojis
  BACK: '←',
  FORWARD: '→',
  UP: '↑',
  DOWN: '↓',
} as const;

// Ensure emoji font support
export const ensureEmojiSupport = () => {
  // Test if emojis render properly
  const testEmoji = '❤️';
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.font = '16px system-ui';
    const metrics = ctx.measureText(testEmoji);
    return metrics.width > 0;
  }
  return true; // Assume support on mobile
};

// Get emoji with fallback
export const getEmoji = (emoji: string, fallback: string = '?') => {
  // In React Native, emojis should work by default
  // This is mainly for web fallbacks
  return emoji || fallback;
};

// Validate emoji string
export const isValidEmoji = (str: string): boolean => {
  // Check if string contains only emoji characters
  const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u;
  return emojiRegex.test(str);
};

// Get reaction emoji by type
export const getReactionEmoji = (type: '❤️' | '🙏' | '👍'): string => {
  switch (type) {
    case '❤️':
      return EMOJIS.HEART;
    case '🙏':
      return EMOJIS.PRAY;
    case '👍':
      return EMOJIS.THUMBS_UP;
    default:
      return EMOJIS.HEART;
  }
};

// Format emoji for display
export const formatEmojiForDisplay = (emoji: string, size: number = 16): string => {
  return emoji; // In React Native, emojis scale with font size
};
