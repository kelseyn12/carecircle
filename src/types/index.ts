// TypeScript type definitions for Care Circle app

export interface User {
  id: string;
  displayName: string;
  photoURL?: string;
  expoPushToken?: string;
  createdAt: Date;
  circlesMuted?: string[]; // Array of circle IDs where user has muted notifications
}

export interface Circle {
  id: string;
  title: string;
  ownerId: string; // Keep for backward compatibility
  ownerIds: string[]; // New: array of owner IDs
  members: string[];
  roles: Record<string, 'owner' | 'member'>;
  createdAt: Date;
}

export interface Update {
  id: string;
  circleId: string;
  authorId: string;
  text: string;
  photoURL?: string;
  createdAt: Date;
  reactions?: {
    [userId: string]: '❤️' | '🙏' | '👍';
  };
}

export interface Invite {
  id: string;
  circleId: string;
  createdBy: string;
  expiresAt: Date;
  dynamicLink?: string;
}

export interface Reaction {
  userId: string;
  emoji: '❤️' | '🙏' | '👍';
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
