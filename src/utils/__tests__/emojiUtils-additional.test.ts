import { isValidEmoji, getEmoji, formatEmojiForDisplay } from '../emojiUtils';

describe('emojiUtils additional functions', () => {
  describe('isValidEmoji', () => {
    it('returns true for valid emojis', () => {
      expect(isValidEmoji('❤️')).toBe(true);
      expect(isValidEmoji('🙏')).toBe(true);
      expect(isValidEmoji('👍')).toBe(true);
      expect(isValidEmoji('💬')).toBe(true);
    });

    it('returns false for non-emoji strings', () => {
      expect(isValidEmoji('hello')).toBe(false);
      expect(isValidEmoji('123')).toBe(false);
      expect(isValidEmoji('')).toBe(false);
    });

    it('returns true for mixed content with emojis', () => {
      expect(isValidEmoji('hello ❤️')).toBe(true);
      expect(isValidEmoji('❤️ world')).toBe(true);
    });
  });

  describe('getEmoji', () => {
    it('returns the emoji if provided', () => {
      expect(getEmoji('❤️')).toBe('❤️');
      expect(getEmoji('🙏')).toBe('🙏');
    });

    it('returns fallback for empty string', () => {
      expect(getEmoji('', '?')).toBe('?');
      expect(getEmoji('', 'fallback')).toBe('fallback');
    });

    it('returns default fallback for empty string', () => {
      expect(getEmoji('')).toBe('?');
    });
  });

  describe('formatEmojiForDisplay', () => {
    it('returns the emoji unchanged', () => {
      expect(formatEmojiForDisplay('❤️')).toBe('❤️');
      expect(formatEmojiForDisplay('🙏')).toBe('🙏');
    });

    it('accepts size parameter but returns emoji unchanged', () => {
      expect(formatEmojiForDisplay('❤️', 24)).toBe('❤️');
      expect(formatEmojiForDisplay('👍', 32)).toBe('👍');
    });
  });
});
