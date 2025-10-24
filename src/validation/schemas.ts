// Zod validation schemas for form inputs and API data

import { z } from 'zod';

// User validation
export const userSchema = z.object({
  displayName: z.string().min(1, 'Display name is required').max(50, 'Display name too long'),
  photoURL: z.string().url().optional(),
  expoPushToken: z.string().optional(),
});

// Circle validation
export const createCircleSchema = z.object({
  title: z.string().min(1, 'Circle title is required').max(100, 'Title too long'),
});

// Update validation
export const createUpdateSchema = z.object({
  text: z.string().min(1, 'Update text is required').max(2000, 'Update too long (max 2000 characters)'),
  photoURL: z.string().url().optional(),
});

// Invite validation
export const inviteSchema = z.object({
  email: z.string().email('Invalid email address'),
});

// Reaction validation
export const reactionSchema = z.object({
  emoji: z.enum(['❤️', '🙏', '👍'], {
    errorMap: () => ({ message: 'Invalid reaction emoji' }),
  }),
});

// Comment validation
export const createCommentSchema = z.object({
  text: z.string().min(1, 'Comment text is required').max(1000, 'Comment too long (max 1000 characters)'),
});

// Export types
export type CreateCircleInput = z.infer<typeof createCircleSchema>;
export type CreateUpdateInput = z.infer<typeof createUpdateSchema>;
export type InviteInput = z.infer<typeof inviteSchema>;
export type ReactionInput = z.infer<typeof reactionSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
