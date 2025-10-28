import { EMOJIS, getReactionEmoji } from '../emojiUtils';

describe('emojiUtils', () => {
  describe('EMOJIS', () => {
    it('contains all expected emoji constants', () => {
      expect(EMOJIS.HEART).toBe('❤️');
      expect(EMOJIS.PRAY).toBe('🙏');
      expect(EMOJIS.THUMBS_UP).toBe('👍');
      expect(EMOJIS.COMMENT).toBe('💬');
      expect(EMOJIS.BLUE_HEART).toBe('💙');
      expect(EMOJIS.WARNING).toBe('⚠️');
      expect(EMOJIS.PEOPLE).toBe('👥');
      expect(EMOJIS.ARROW_RIGHT).toBe('→');
      expect(EMOJIS.GEAR).toBe('⚙️');
      expect(EMOJIS.EMAIL).toBe('📧');
      expect(EMOJIS.CHECKMARK).toBe('✅');
      expect(EMOJIS.LIGHTBULB).toBe('💡');
    });
  });

  describe('getReactionEmoji', () => {
    it('returns valid reaction emoji for heart', () => {
      expect(getReactionEmoji('❤️')).toBe(EMOJIS.HEART);
    });

    it('returns valid reaction emoji for pray', () => {
      expect(getReactionEmoji('🙏')).toBe(EMOJIS.PRAY);
    });

    it('returns valid reaction emoji for thumbs up', () => {
      expect(getReactionEmoji('👍')).toBe(EMOJIS.THUMBS_UP);
    });

    it('returns heart emoji for invalid input', () => {
      expect(getReactionEmoji('invalid' as any)).toBe(EMOJIS.HEART);
    });

    it('returns heart emoji for empty string', () => {
      expect(getReactionEmoji('' as any)).toBe(EMOJIS.HEART);
    });

    it('returns heart emoji for null/undefined', () => {
      expect(getReactionEmoji(null as any)).toBe(EMOJIS.HEART);
      expect(getReactionEmoji(undefined as any)).toBe(EMOJIS.HEART);
    });
  });
});
