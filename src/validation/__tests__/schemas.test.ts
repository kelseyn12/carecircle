import { describe, it, expect } from '@jest/globals';
import {
  userSchema,
  createCircleSchema,
  createUpdateSchema,
  inviteSchema,
  reactionSchema,
  createCommentSchema,
} from '../schemas';
import { EMOJIS } from '../../utils/emojiUtils';

describe('Validation Schemas', () => {
  describe('userSchema', () => {
    it('should validate valid user data', () => {
      const validUser = {
        displayName: 'John Doe',
        photoURL: 'https://example.com/photo.jpg',
        expoPushToken: 'ExponentPushToken[test]',
      };

      expect(() => userSchema.parse(validUser)).not.toThrow();
    });

    it('should reject empty display name', () => {
      const invalidUser = {
        displayName: '',
      };

      expect(() => userSchema.parse(invalidUser)).toThrow();
    });

    it('should reject display name that is too long', () => {
      const invalidUser = {
        displayName: 'a'.repeat(51),
      };

      expect(() => userSchema.parse(invalidUser)).toThrow('Display name too long');
    });

    it('should reject invalid photo URL', () => {
      const invalidUser = {
        displayName: 'John Doe',
        photoURL: 'not-a-url',
      };

      expect(() => userSchema.parse(invalidUser)).toThrow();
    });

    it('should allow optional photoURL', () => {
      const validUser = {
        displayName: 'John Doe',
      };

      expect(() => userSchema.parse(validUser)).not.toThrow();
    });
  });

  describe('createCircleSchema', () => {
    it('should validate valid circle data', () => {
      const validCircle = {
        title: 'Family Circle',
      };

      expect(() => createCircleSchema.parse(validCircle)).not.toThrow();
    });

    it('should reject empty title', () => {
      const invalidCircle = {
        title: '',
      };

      expect(() => createCircleSchema.parse(invalidCircle)).toThrow('Circle title is required');
    });

    it('should reject title that is too long', () => {
      const invalidCircle = {
        title: 'a'.repeat(101),
      };

      expect(() => createCircleSchema.parse(invalidCircle)).toThrow('Title too long');
    });
  });

  describe('createUpdateSchema', () => {
    it('should validate valid update data', () => {
      const validUpdate = {
        text: 'This is a valid update',
      };

      expect(() => createUpdateSchema.parse(validUpdate)).not.toThrow();
    });

    it('should validate update with photo URL', () => {
      const validUpdate = {
        text: 'Update with photo',
        photoURL: 'https://example.com/photo.jpg',
      };

      expect(() => createUpdateSchema.parse(validUpdate)).not.toThrow();
    });

    it('should reject empty text', () => {
      const invalidUpdate = {
        text: '',
      };

      expect(() => createUpdateSchema.parse(invalidUpdate)).toThrow('Update text is required');
    });

    it('should reject text that is too long', () => {
      const invalidUpdate = {
        text: 'a'.repeat(2001),
      };

      expect(() => createUpdateSchema.parse(invalidUpdate)).toThrow('Update too long');
    });

    it('should reject invalid photo URL', () => {
      const invalidUpdate = {
        text: 'Valid text',
        photoURL: 'not-a-url',
      };

      expect(() => createUpdateSchema.parse(invalidUpdate)).toThrow();
    });
  });

  describe('inviteSchema', () => {
    it('should validate valid email', () => {
      const validInvite = {
        email: 'test@example.com',
      };

      expect(() => inviteSchema.parse(validInvite)).not.toThrow();
    });

    it('should reject invalid email format', () => {
      const invalidInvite = {
        email: 'not-an-email',
      };

      expect(() => inviteSchema.parse(invalidInvite)).toThrow('Invalid email address');
    });

    it('should reject empty email', () => {
      const invalidInvite = {
        email: '',
      };

      expect(() => inviteSchema.parse(invalidInvite)).toThrow();
    });
  });

  describe('reactionSchema', () => {
    it('should validate valid reaction emoji (heart)', () => {
      const validReaction = {
        emoji: EMOJIS.HEART,
      };

      expect(() => reactionSchema.parse(validReaction)).not.toThrow();
    });

    it('should validate valid reaction emoji (pray)', () => {
      const validReaction = {
        emoji: EMOJIS.PRAY,
      };

      expect(() => reactionSchema.parse(validReaction)).not.toThrow();
    });

    it('should validate valid reaction emoji (thumbs up)', () => {
      const validReaction = {
        emoji: EMOJIS.THUMBS_UP,
      };

      expect(() => reactionSchema.parse(validReaction)).not.toThrow();
    });

    it('should reject invalid reaction emoji', () => {
      const invalidReaction = {
        emoji: '😀',
      };

      expect(() => reactionSchema.parse(invalidReaction)).toThrow('Invalid reaction emoji');
    });
  });

  describe('createCommentSchema', () => {
    it('should validate valid comment data', () => {
      const validComment = {
        text: 'This is a valid comment',
      };

      expect(() => createCommentSchema.parse(validComment)).not.toThrow();
    });

    it('should reject empty text', () => {
      const invalidComment = {
        text: '',
      };

      expect(() => createCommentSchema.parse(invalidComment)).toThrow('Comment text is required');
    });

    it('should reject text that is too long', () => {
      const invalidComment = {
        text: 'a'.repeat(1001),
      };

      expect(() => createCommentSchema.parse(invalidComment)).toThrow('Comment too long');
    });
  });
});
