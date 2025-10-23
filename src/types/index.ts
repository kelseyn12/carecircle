// TypeScript type definitions for Care Circle app

export interface User {
  id: string;
  displayName: string;
  photoURL?: string;
  expoPushToken?: string;
  createdAt: Date;
}

export interface Circle {
  id: string;
  title: string;
  ownerId: string;
  members: string[];
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

// Navigation types
export type RootStackParamList = {
  SignIn: undefined;
  Home: undefined;
  CreateCircle: undefined;
  CircleFeed: { circleId: string };
  NewUpdate: { circleId: string };
  Invite: { circleId: string };
  Join: { inviteId: string };
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
