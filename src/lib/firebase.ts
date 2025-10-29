// Firebase configuration and initialization
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getFunctions, connectFunctionsEmulator, Functions } from 'firebase/functions';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// Firebase config from environment variables
const firebaseConfig = {
  apiKey: Constants.expoConfig?.extra?.firebase?.apiKey || 'demo-api-key',
  authDomain: Constants.expoConfig?.extra?.firebase?.authDomain || 'demo-project.firebaseapp.com',
  projectId: Constants.expoConfig?.extra?.firebase?.projectId || 'demo-project',
  storageBucket: Constants.expoConfig?.extra?.firebase?.storageBucket || 'demo-project.appspot.com',
  messagingSenderId: Constants.expoConfig?.extra?.firebase?.messagingSenderId || '123456789',
  appId: Constants.expoConfig?.extra?.firebase?.appId || '1:123456789:web:demo',
};

// Check if Firebase is properly configured
const isFirebaseConfigured = firebaseConfig.apiKey !== 'demo-api-key';

// Debug: Log Firebase configuration status (only in dev)
if (__DEV__) {
  console.log('Firebase Configuration Status:', {
    isConfigured: isFirebaseConfigured,
    projectId: firebaseConfig.projectId,
    authDomain: firebaseConfig.authDomain,
    hasApiKey: !!firebaseConfig.apiKey && firebaseConfig.apiKey !== 'demo-api-key'
  });
}

// Initialize Firebase (avoid duplicate initialization)
let app;
try {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
} catch (error) {
  console.warn('Firebase initialization failed:', error);
  // Create a mock app object to prevent crashes
  app = { name: 'demo-app' };
}

// Initialize Firebase services with error handling
let auth: any, db: any, storage: any, functions: Functions | null;

try {
  // Initialize Firebase Auth with AsyncStorage persistence
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
  });

  // Initialize Firestore
  db = getFirestore(app);

  // Initialize Firebase Storage
  storage = getStorage(app);

  // Initialize Cloud Functions
  functions = getFunctions(app);
} catch (error) {
  console.warn('Firebase services initialization failed:', error);
  // Create mock objects to prevent crashes
  auth = null;
  db = null;
  storage = null;
  functions = null;
}

export { auth, db, storage, functions };

// Development emulator setup (only in development)
if (__DEV__) {
  // Uncomment these lines when you want to use Firestore emulator
  // connectFirestoreEmulator(db, 'localhost', 8080);
  // connectFunctionsEmulator(functions, 'localhost', 5001);
}

// Helper function to get FCM token (disabled for now)
export const getFCMToken = async (): Promise<string | null> => {
  console.warn('FCM token not available in this setup');
  return null;
};

// Helper function to check if user is authenticated
export const isAuthenticated = (): boolean => {
  if (!auth) {
    console.warn('Firebase Auth not initialized');
    return false;
  }
  return auth.currentUser !== null;
};

// Helper function to get current user
export const getCurrentUser = () => {
  if (!auth) {
    console.warn('Firebase Auth not initialized');
    return null;
  }
  return auth.currentUser;
};

// Photo upload utility
export const uploadPhoto = async (uri: string, path: string): Promise<string> => {
  if (!storage) {
    throw new Error('Firebase Storage not initialized');
  }

  try {
    // Convert URI to blob
    const response = await fetch(uri);
    const blob = await response.blob();
    
    // Create storage reference
    const storageRef = ref(storage, path);
    
    // Upload the blob
    const snapshot = await uploadBytes(storageRef, blob);
    
    // Get download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return downloadURL;
  } catch (error) {
    console.error('Error uploading photo:', error);
    throw new Error('Failed to upload photo. Please try again.');
  }
};

export default app;
