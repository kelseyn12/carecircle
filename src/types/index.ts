// TypeScript type definitions for Care Circle app

import { EMOJIS } from '../utils/emojiUtils';

export interface User {
  id: string;
  displayName: string;
  photoURL?: string;
  expoPushToken?: string;
  createdAt: Date;
  circlesMuted?: string[]; // Array of circle IDs where user has muted notifications
  lastViewedCircles?: Record<string, Date>; // circleId -> last viewed timestamp
  isPremium?: boolean; // Subscription status
  subscriptionExpiresAt?: Date; // Subscription expiration date
  productIdentifier?: string; // Product identifier for the subscription
  totalCirclesCreated?: number; // Total number of circles user has ever created (prevents gaming the system)
}

export interface Circle {
  id: string;
  title: string;
  ownerId: string; // Keep for backward compatibility
  ownerIds: string[]; // New: array of owner IDs
  members: string[];
  updateAuthors: string[]; // New: array of user IDs who can post updates
  roles: Record<string, 'owner' | 'member'>;
  createdAt: Date;
  lastUpdateAt?: Date;
}

export interface Update {
  id: string;
  circleId: string;
  authorId: string;
  text: string;
  photoURL?: string;
  createdAt: Date;
  reactions?: {
    [userId: string]: typeof EMOJIS.HEART | typeof EMOJIS.PRAY | typeof EMOJIS.THUMBS_UP;
  };
}

export interface Invite {
  id: string;
  circleId: string;
  createdBy: string;
  expiresAt: Date;
  inviteLink?: string;
}

export interface Reaction {
  userId: string;
  emoji: typeof EMOJIS.HEART | typeof EMOJIS.PRAY | typeof EMOJIS.THUMBS_UP;
}

export interface Comment {
  id: string;
  updateId: string;
  authorId: string;
  text: string;
  createdAt: Date;
}

// Navigation types
export type RootStackParamList = {
  SignIn: undefined;
  Home: undefined;
  CreateCircle: undefined;
  CircleFeed: { circleId: string };
  NewUpdate: { circleId: string };
  Invite: { circleId: string };
  Join: { inviteId: string };
  MemberManagement: { circleId: string };
  Comments: { updateId: string; circleId?: string };
  Settings: undefined;
  Paywall: undefined;
};

// Form validation types
export interface CreateCircleForm {
  title: string;
}

export interface CreateUpdateForm {
  text: string;
  photo?: string;
}

export interface InviteForm {
  email: string;
}
