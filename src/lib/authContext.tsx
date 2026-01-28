// Authentication context for managing user state
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, updateProfile, signInWithCredential, OAuthProvider, GoogleAuthProvider, deleteUser, reauthenticateWithCredential, EmailAuthProvider, sendPasswordResetEmail } from 'firebase/auth';
import { Alert, Platform } from 'react-native';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db, getFCMToken } from './firebase';
import { User as AppUser } from '../types';
import { initializeNotifications } from './notificationService';
import { deleteAccount as deleteAccountData } from './firestoreUtils';

// Use conditional import for RevenueCat (not available in Expo Go)
let Purchases: any = null;
try {
  Purchases = require('react-native-purchases').default || require('react-native-purchases');
} catch (error) {
  // RevenueCat not available (e.g., in Expo Go)
  console.warn('RevenueCat not available for account deletion cleanup.');
}

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signOut: () => Promise<void>;
  updateUserProfile: (updates: Partial<AppUser>) => Promise<void>;
  deleteAccount: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Convert Firebase User to App User
  const convertFirebaseUser = async (firebaseUser: User): Promise<AppUser> => {
    // Get user data from Firestore if available
    let userData = null;
    if (db) {
      try {
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        userData = userDoc.data();
      } catch (error) {
        console.warn('Error fetching user data from Firestore:', error);
      }
    }

    // Note: We no longer request notification permissions on login.
    // Permissions will be requested contextually when user creates/joins a circle.

    return {
      id: firebaseUser.uid,
      displayName: userData?.displayName || firebaseUser.displayName || 'User',
      photoURL: firebaseUser.photoURL || userData?.photoURL,
      expoPushToken: userData?.expoPushToken,
      createdAt: userData?.createdAt?.toDate() || new Date(),
      isPremium: userData?.isPremium || false,
      subscriptionExpiresAt: userData?.subscriptionExpiresAt?.toDate() || undefined,
      productIdentifier: userData?.productIdentifier,
      totalCirclesCreated: userData?.totalCirclesCreated || 0,
    };
  };

  // Create user document in Firestore
  const createUserDocument = async (firebaseUser: User, additionalData?: any) => {
    if (!db) {
      console.warn('Firestore not initialized, skipping user document creation');
      return;
    }
    
    const userRef = doc(db, 'users', firebaseUser.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      const { displayName, email } = firebaseUser;
      const createdAt = new Date();
      const expoPushToken = await getFCMToken();

      try {
        // Use additionalData.displayName if provided, otherwise use Firebase displayName, otherwise 'User'
        const finalDisplayName = additionalData?.displayName || displayName || 'User';
        await setDoc(userRef, {
          displayName: finalDisplayName,
          email,
          createdAt,
          expoPushToken,
          totalCirclesCreated: 0, // Initialize counter to prevent gaming the system
          ...additionalData,
        });
      } catch (error) {
        console.error('Error creating user document:', error);
      }
    } else if (additionalData?.displayName) {
      // Update display name if provided and user document exists
      try {
        await setDoc(userRef, {
          displayName: additionalData.displayName,
          ...additionalData,
        }, { merge: true });
      } catch (error) {
        console.error('Error updating user document:', error);
      }
    }
  };

  // Sign in with email and password
  const signIn = async (email: string, password: string) => {
    if (!auth) {
      throw new Error('Firebase Auth not initialized. Please check your Firebase configuration.');
    }
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      await createUserDocument(result.user);
    } catch (error: any) {
      throw new Error(getAuthErrorMessage(error.code));
    }
  };

  // Sign up with email and password
  const signUp = async (email: string, password: string, displayName: string) => {
    if (!auth) {
      throw new Error('Firebase Auth not initialized. Please check your Firebase configuration.');
    }
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(result.user, { displayName });
      await createUserDocument(result.user, { displayName });
      
      // IMPORTANT: After signup, manually update the local user state with the correct displayName
      // This fixes a race condition where onAuthStateChanged fires before Firestore doc is created
      setUser({
        id: result.user.uid,
        displayName: displayName,
        photoURL: result.user.photoURL || undefined,
        createdAt: new Date(),
        totalCirclesCreated: 0,
        isPremium: false,
      });
    } catch (error: any) {
      throw new Error(getAuthErrorMessage(error.code));
    }
  };

  // Reset password
  const resetPassword = async (email: string) => {
    if (!auth) {
      throw new Error('Firebase Auth not initialized. Please check your Firebase configuration.');
    }
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      throw new Error(getAuthErrorMessage(error.code));
    }
  };

  // Sign in with Google
  const signInWithGoogle = async () => {
    if (!auth) {
      throw new Error('Firebase Auth not initialized. Please check your Firebase configuration.');
    }
    try {
      const { GoogleSignin } = await import('@react-native-google-signin/google-signin');
      const Constants = await import('expo-constants');
      
      // Get the appropriate client ID based on platform
      const getGoogleClientId = () => {
        const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
        const androidClientId = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;
        const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
        
        if (Constants.default.platform?.ios && iosClientId) {
          return iosClientId;
        } else if (Constants.default.platform?.android && androidClientId) {
          return androidClientId;
        } else if (webClientId) {
          return webClientId;
        }
        
        throw new Error('Google OAuth client ID not configured. Please set EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID in your .env file.');
      };

      const clientId = getGoogleClientId();
      
      // Get web client ID (required for ID token)
      const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
      const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
      
      if (!webClientId) {
        throw new Error('Google Web Client ID is required. Please set EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID in your .env file.');
      }

      // Configure Google Sign-In
      GoogleSignin.configure({
        webClientId: webClientId, // Required for ID token
        iosClientId: iosClientId || undefined,
        offlineAccess: false, // We don't need offline access
      });

      // Check if Google Play Services are available (Android only)
      if (Constants.default.platform?.android) {
        await GoogleSignin.hasPlayServices();
      }

      // Sign in
      let userInfo;
      try {
        userInfo = await GoogleSignin.signIn();
        
        if (!userInfo) {
          throw new Error('No user info received from Google Sign-In.');
        }
      } catch (signInError: any) {
        console.error('Google Sign-In error:', signInError);
        
        // Handle specific Google Sign-In errors
        if (signInError.code === 'SIGN_IN_CANCELLED') {
          throw new Error('Sign-in was canceled.');
        } else if (signInError.code === 'IN_PROGRESS') {
          throw new Error('Sign-in is already in progress.');
        } else if (signInError.code === 'PLAY_SERVICES_NOT_AVAILABLE') {
          throw new Error('Google Play Services is not available. Please update Google Play Services.');
        }
        
        throw new Error(`Google Sign-In failed: ${signInError.message || 'Unknown error'}`);
      }
      
      // Get ID token - try from userInfo first, then from getTokens()
      let idToken = userInfo.idToken;
      
      if (!idToken) {
        try {
          // On iOS, sometimes we need to get tokens explicitly
          const tokens = await GoogleSignin.getTokens();
          idToken = tokens.idToken;
        } catch (tokenError) {
          console.error('Error getting Google tokens:', tokenError);
          // Continue - we'll check if idToken is still null
        }
      }
      
      if (!idToken) {
        console.error('Google Sign-In response:', userInfo);
        throw new Error('No ID token received from Google. Please check your Google OAuth configuration.');
      }

      // Create Firebase credential with error handling
      let credential;
      try {
        credential = GoogleAuthProvider.credential(idToken);
        
        if (!credential) {
          throw new Error('Failed to create Firebase credential from Google token.');
        }
      } catch (credError: any) {
        console.error('Firebase credential creation error:', credError);
        throw new Error(`Failed to process Google Sign-In credentials: ${credError.message || 'Unknown error'}`);
      }
      
      // Sign in to Firebase with error handling
      let userCredential;
      try {
        userCredential = await signInWithCredential(auth, credential);
        
        if (!userCredential || !userCredential.user) {
          throw new Error('Firebase sign-in succeeded but no user was returned.');
        }
      } catch (firebaseError: any) {
        console.error('Firebase sign-in error:', firebaseError);
        
        // Handle specific Firebase errors
        if (firebaseError.code === 'auth/invalid-credential') {
          throw new Error('Invalid Google Sign-In credentials. Please try again.');
        }
        if (firebaseError.code === 'auth/operation-not-allowed') {
          throw new Error('Google Sign-In is not enabled in Firebase. Please contact support.');
        }
        
        throw new Error(`Firebase authentication failed: ${firebaseError.message || 'Unknown error'}`);
      }
      
      // Create or update user document (non-blocking)
      try {
        const displayName = userCredential.user.displayName || userInfo.user.name || 'User';
        await createUserDocument(userCredential.user, {
          displayName: displayName,
          photoURL: userCredential.user.photoURL || userInfo.user.photo || undefined,
        });
        // If display name is still 'User', try to update from userInfo
        if (displayName === 'User' && userInfo.user.name) {
          await updateProfile(userCredential.user, { displayName: userInfo.user.name });
          await createUserDocument(userCredential.user, { displayName: userInfo.user.name });
        }
      } catch (docError) {
        // Non-critical error - log but don't fail sign-in
        console.warn('Failed to create user document:', docError);
      }
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        stack: error.stack,
      });
      
      // Handle specific Google Sign-In errors
      if (error.code === 'SIGN_IN_CANCELLED') {
        throw new Error('Sign-in was canceled.');
      } else if (error.code === 'IN_PROGRESS') {
        throw new Error('Sign-in is already in progress.');
      } else if (error.code === 'PLAY_SERVICES_NOT_AVAILABLE') {
        throw new Error('Google Play Services is not available. Please update Google Play Services.');
      }
      
      // Check for Firebase-specific errors
      if (error.code?.startsWith('auth/')) {
        const firebaseErrorMsg = error.message || 'Firebase authentication error';
        throw new Error(`Authentication failed: ${firebaseErrorMsg}`);
      }
      
      // If error already has a message, use it; otherwise provide generic message
      if (error.message && !error.message.includes('Failed to sign in with Google')) {
        throw error;
      }
      
      const errorMessage = error.message || error.toString() || 'Unknown error';
      throw new Error(`Failed to sign in with Google: ${errorMessage}`);
    }
  };

  // Sign in with Apple
  const signInWithApple = async () => {
    if (!auth) {
      throw new Error('Firebase Auth not initialized. Please check your Firebase configuration.');
    }
    try {
      const AppleAuthentication = await import('expo-apple-authentication');
      
      // expo-apple-authentication exports functions directly, not as default
      const { isAvailableAsync, signInAsync, AppleAuthenticationScope } = AppleAuthentication;
      
      // Check if Apple Authentication is available
      if (!isAvailableAsync) {
        throw new Error('Apple Sign-In is not available on this device.');
      }
      
      const isAvailable = await isAvailableAsync();
      if (!isAvailable) {
        throw new Error('Apple Sign-In is not available on this device.');
      }

      // Request Apple authentication
      const credential = await signInAsync({
        requestedScopes: [
          AppleAuthenticationScope.FULL_NAME,
          AppleAuthenticationScope.EMAIL,
        ],
      });

      // Validate credential
      if (!credential) {
        throw new Error('No credential received from Apple Sign-In.');
      }

      if (!credential.identityToken) {
        throw new Error('Apple Sign-In did not provide an identity token. Please try again.');
      }

      // Create Firebase credential with error handling
      let firebaseCredential;
      try {
        const provider = new OAuthProvider('apple.com');
        firebaseCredential = provider.credential({
          idToken: credential.identityToken,
          rawNonce: credential.nonce || undefined, // nonce is optional for Apple
        });

        if (!firebaseCredential) {
          throw new Error('Failed to create Firebase credential from Apple token.');
        }
      } catch (credError: any) {
        console.error('Firebase credential creation error:', credError);
        throw new Error(`Failed to process Apple Sign-In credentials: ${credError.message || 'Unknown error'}`);
      }

      // Sign in to Firebase with error handling
      let userCredential;
      try {
        userCredential = await signInWithCredential(auth, firebaseCredential);
        
        if (!userCredential || !userCredential.user) {
          throw new Error('Firebase sign-in succeeded but no user was returned.');
        }
      } catch (firebaseError: any) {
        console.error('Firebase sign-in error:', firebaseError);
        
        // Handle specific Firebase errors
        if (firebaseError.code === 'auth/invalid-credential') {
          throw new Error('Invalid Apple Sign-In credentials. Please try again.');
        }
        if (firebaseError.code === 'auth/operation-not-allowed') {
          throw new Error('Apple Sign-In is not enabled in Firebase. Please contact support.');
        }
        
        throw new Error(`Firebase authentication failed: ${firebaseError.message || 'Unknown error'}`);
      }
      
      // Update profile with Apple name if available (non-blocking)
      try {
        if (credential.fullName && userCredential.user) {
          const displayName = `${credential.fullName.givenName || ''} ${credential.fullName.familyName || ''}`.trim();
          if (displayName) {
            await updateProfile(userCredential.user, { displayName });
          }
        }
      } catch (profileError) {
        // Non-critical error - log but don't fail sign-in
        console.warn('Failed to update profile with Apple name:', profileError);
      }

      // Create user document (non-blocking)
      try {
        const displayName = userCredential.user.displayName || 
                           (credential.fullName ? `${credential.fullName.givenName || ''} ${credential.fullName.familyName || ''}`.trim() : '') ||
                           'User';
        await createUserDocument(userCredential.user, {
          displayName: displayName || 'User',
        });
        // If display name is still 'User', update it from credential if available
        if (displayName === 'User' && credential.fullName) {
          const nameFromCredential = `${credential.fullName.givenName || ''} ${credential.fullName.familyName || ''}`.trim();
          if (nameFromCredential) {
            await updateProfile(userCredential.user, { displayName: nameFromCredential });
            await createUserDocument(userCredential.user, { displayName: nameFromCredential });
          }
        }
      } catch (docError) {
        // Non-critical error - log but don't fail sign-in
        console.warn('Failed to create user document:', docError);
      }
    } catch (error: any) {
      console.error('Apple sign-in error:', error);
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        stack: error.stack,
      });
      
      // Handle specific error codes
      if (error.code === 'ERR_REQUEST_CANCELED') {
        throw new Error('Sign-in was canceled.');
      }
      
      // Check for capability/entitlement errors
      if (error.message?.includes('entitlement') || error.message?.includes('capability')) {
        throw new Error('Apple Sign-In is not properly configured. Please contact support.');
      }
      
      // Check for availability errors
      if (error.message?.includes('not available') || error.code === 'ERR_APPLE_AUTHENTICATION_UNAVAILABLE') {
        throw new Error('Apple Sign-In is not available. This may require enabling the capability in Apple Developer Portal.');
      }
      
      // Check for Firebase-specific errors
      if (error.code?.startsWith('auth/')) {
        const firebaseErrorMsg = error.message || 'Firebase authentication error';
        throw new Error(`Authentication failed: ${firebaseErrorMsg}`);
      }
      
      // Provide more detailed error message
      const errorMessage = error.message || error.toString() || 'Unknown error';
      throw new Error(`Failed to sign in with Apple: ${errorMessage}`);
    }
  };

  // Sign out
  const handleSignOut = async () => {
    if (!auth) {
      throw new Error('Firebase Auth not initialized. Please check your Firebase configuration.');
    }
    try {
      await signOut(auth);
    } catch (error: any) {
      throw new Error('Failed to sign out. Please try again.');
    }
  };

  // Update user profile
  const handleDeleteAccount = async (password?: string): Promise<void> => {
    if (!auth?.currentUser) {
      throw new Error('No user logged in');
    }

    const userId = auth.currentUser.uid;
    const currentUser = auth.currentUser;
    let authDeletionSucceeded = false; // Track if Auth deletion succeeded

    try {
      // Step 1: Re-authenticate user (required by Firebase for account deletion)
      // This ensures the user has recently authenticated before deleting their account
      const providerData = currentUser.providerData || [];
      const providerId = providerData.length > 0 ? providerData[0]?.providerId : null;
      
      let reauthSucceeded = false;
      if (providerId === 'password' && currentUser.email) {
        // Email/password authentication - need password
        if (!password) {
          throw new Error('REAUTH_REQUIRED');
        }
        try {
          const credential = EmailAuthProvider.credential(currentUser.email, password);
          await reauthenticateWithCredential(currentUser, credential);
          reauthSucceeded = true;
        } catch (reauthError: any) {
          // If re-auth fails, throw the error so UI can handle it
          if (reauthError.code === 'auth/requires-recent-login' || 
              reauthError.message?.includes('requires-recent-login')) {
            throw new Error('REAUTH_REQUIRED');
          }
          throw reauthError;
        }
      } else if (providerId === 'google.com' || providerId === 'apple.com') {
        // For OAuth providers (Google/Apple), re-authentication is complex
        // Firebase requires recent authentication, but we can't easily re-auth OAuth users
        // The best approach is to try deletion and if it fails, ask user to sign out/in
        // For now, we'll skip re-auth for OAuth and let Firebase handle it
        // If it fails, the error will be caught and handled in the UI
        reauthSucceeded = true; // Assume success for OAuth (will be validated by deleteUser)
      } else {
        // Unknown provider or no provider data - try to proceed anyway
        // This might work if the user has recently authenticated
        reauthSucceeded = true; // Assume success (will be validated by deleteUser)
      }

      // Step 2: Log out from RevenueCat (cleanup subscription tracking)
      try {
        if (Purchases && typeof Purchases.logOut === 'function') {
          await Purchases.logOut();
        }
      } catch (revenueCatError) {
        // Don't fail account deletion if RevenueCat logout fails
        console.warn('Error logging out from RevenueCat:', revenueCatError);
      }

      // Step 3: Delete all user data from Firestore and Storage FIRST
      // Do this while user is still authenticated (needed for security rules)
      await deleteAccountData(userId);

      // Step 4: Delete Firebase Auth account (requires re-auth)
      // If this fails, data is already deleted, which is the main goal
      try {
        await deleteUser(currentUser);
        authDeletionSucceeded = true;
      } catch (authError: any) {
        // If Auth deletion fails due to requires-recent-login, that's okay
        // The Firestore data is already deleted, which is the main goal
        const errorCode = authError.code || authError?.error?.code;
        const errorMessage = authError.message || authError?.error?.message || '';
        
        if (errorCode === 'auth/requires-recent-login' || 
            errorMessage.includes('requires-recent-login')) {
          // Data is already deleted, but Auth account remains
          // Sign out the user and show a message
          try {
            if (auth) {
              await signOut(auth);
            }
          } catch (signOutError) {
            console.warn('Error signing out after failed Auth deletion:', signOutError);
          }
          throw new Error('REAUTH_REQUIRED_AUTH_REMAINS');
        }
        // For other errors, still sign out and throw
        try {
          if (auth) {
            await signOut(auth);
          }
        } catch (signOutError) {
          console.warn('Error signing out after Auth deletion error:', signOutError);
        }
        throw authError;
      }

      // Step 5: Sign out (this will clear local state)
      // Note: If account was successfully deleted, currentUser will be null
      // so signOut might not be necessary, but we try it anyway to clear any cached state
      // If signOut fails because user is already deleted, that's expected and fine
      // IMPORTANT: Don't throw errors here - account deletion was successful
      try {
        if (auth && auth.currentUser) {
          await signOut(auth);
        }
      } catch (signOutError: any) {
        // If signOut fails because user is already deleted, that's expected and fine
        // The account deletion was successful, so this is not an error
        // Silently ignore - account deletion succeeded
      }
    } catch (error: any) {
      // Check if account was actually deleted (success case with minor error)
      // This can happen if deletion succeeded but signOut failed
      const accountWasDeleted = error.message?.includes('user-not-found') || 
                                 error.code === 'auth/user-not-found' ||
                                 !auth?.currentUser; // User is null, deletion likely succeeded
      
      // Also check if the error is from signOut after successful deletion
      // If authDeletionSucceeded is true, we know deletion worked
      if (accountWasDeleted || authDeletionSucceeded) {
        // Account was successfully deleted, just sign out silently if needed
        try {
          if (auth && auth.currentUser) {
            await signOut(auth);
          }
        } catch (signOutError) {
          // Ignore sign out errors if user is already deleted
        }
        // Don't throw error - deletion was successful
        return;
      }
      
      console.error('Error deleting account:', error);
      
      // Handle specific Firebase Auth errors
      if (error.code === 'auth/requires-recent-login') {
        throw new Error('REAUTH_REQUIRED');
      }
      
      if (error.message === 'REAUTH_REQUIRED') {
        throw new Error('REAUTH_REQUIRED');
      }
      
      // Handle "undefined is not a function" errors - provide more context
      const errorMessage = error.message || error.toString() || '';
      if (errorMessage.includes('undefined is not a function') || 
          errorMessage.includes('is not a function')) {
        console.error('Function call error details:', {
          error: errorMessage,
          stack: error.stack,
          code: error.code,
          name: error.name,
        });
        throw new Error('An error occurred during account deletion. Please try signing out and signing back in, then try again.');
      }
      
      throw new Error(errorMessage || 'Failed to delete account. Please try again.');
    }
  };

  const updateUserProfile = async (updates: Partial<AppUser>) => {
    if (!user) throw new Error('No user logged in');

    try {
      // Update Firebase Auth profile
      if (updates.displayName && auth?.currentUser) {
        await updateProfile(auth.currentUser, { displayName: updates.displayName });
      }

      // Update Firestore document if available
      if (db) {
        const userRef = doc(db, 'users', user.id);
        await setDoc(userRef, updates, { merge: true });
      }

      // Update local state
      setUser({ ...user, ...updates });
    } catch (error: any) {
      throw new Error('Failed to update profile. Please try again.');
    }
  };

  // Get user-friendly error messages
  const getAuthErrorMessage = (errorCode: string): string => {
    switch (errorCode) {
      case 'auth/user-not-found':
        return 'No account found with this email address.';
      case 'auth/wrong-password':
        return 'Incorrect password. Please try again.';
      case 'auth/invalid-credential':
        // New Firebase error code that combines wrong-password and user-not-found
        return 'Invalid email or password. Please check your credentials and try again.';
      case 'auth/invalid-login-credentials':
        return 'Invalid email or password. Please check your credentials and try again.';
      case 'auth/email-already-in-use':
        return 'An account with this email already exists.';
      case 'auth/weak-password':
        return 'Password should be at least 6 characters.';
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/too-many-requests':
        return 'Too many failed attempts. Please try again later.';
      case 'auth/network-request-failed':
        return 'Network error. Please check your connection.';
      case 'auth/user-disabled':
        return 'This account has been disabled. Please contact support.';
      case 'auth/operation-not-allowed':
        return 'Email/password sign-in is not enabled. Please contact support.';
      default:
        console.warn('Unhandled auth error code:', errorCode);
        return 'An error occurred. Please try again.';
    }
  };

  // Listen to authentication state changes
  useEffect(() => {
    if (!auth) {
      console.warn('Firebase Auth not initialized, skipping auth state listener');
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(
      auth,
      async (firebaseUser) => {
        try {
          if (firebaseUser) {
            try {
              const appUser = await convertFirebaseUser(firebaseUser);
              setUser(appUser);
            } catch (error) {
              console.error('Error converting user:', error);
              // Set a minimal user object to prevent crashes
              setUser({
                id: firebaseUser.uid,
                displayName: firebaseUser.displayName || '',
                photoURL: firebaseUser.photoURL || undefined,
                createdAt: new Date(),
              });
            }
          } else {
            setUser(null);
          }
        } catch (error) {
          console.error('Error in auth state listener:', error);
          // Ensure we don't leave the app in a broken state
          setUser(null);
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        // Handle auth state change errors
        console.error('Auth state change error:', error);
        setUser(null);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  const value: AuthContextType = {
    user,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    signInWithApple,
    signOut: handleSignOut,
    updateUserProfile,
    deleteAccount: handleDeleteAccount,
    resetPassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
