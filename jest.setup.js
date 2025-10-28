// Basic Jest setup for utility testing
// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock Expo Constants
jest.mock('expo-constants', () => ({
  __esModule: true,
  default: {
    expoConfig: {
      extra: {
        firebaseApiKey: 'mock-api-key',
        firebaseAuthDomain: 'mock-auth-domain',
        firebaseProjectId: 'mock-project-id',
        firebaseStorageBucket: 'mock-storage-bucket',
        firebaseMessagingSenderId: 'mock-sender-id',
        firebaseAppId: 'mock-app-id',
      },
    },
  },
}));

// Mock Firebase modules
jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(),
  getApps: jest.fn(() => []),
}));

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(),
  collection: jest.fn(),
  doc: jest.fn(),
  addDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  onSnapshot: jest.fn(),
  serverTimestamp: jest.fn(() => 'mock-timestamp'),
}));

jest.mock('firebase/functions', () => ({
  getFunctions: jest.fn(),
  connectFunctionsEmulator: jest.fn(),
}));
