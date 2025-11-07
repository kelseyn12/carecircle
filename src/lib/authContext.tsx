// Authentication context for managing user state
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, updateProfile, signInWithCredential, OAuthProvider } from 'firebase/auth';
import { Alert } from 'react-native';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db, getFCMToken } from './firebase';
import { User as AppUser } from '../types';
import { initializeNotifications } from './notificationService';

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signOut: () => Promise<void>;
  updateUserProfile: (updates: Partial<AppUser>) => Promise<void>;
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
      displayName: firebaseUser.displayName || userData?.displayName || '',
      photoURL: firebaseUser.photoURL || userData?.photoURL,
      expoPushToken: userData?.expoPushToken,
      createdAt: userData?.createdAt?.toDate() || new Date(),
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
        await setDoc(userRef, {
          displayName,
          email,
          createdAt,
          expoPushToken,
          ...additionalData,
        });
      } catch (error) {
        console.error('Error creating user document:', error);
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
      // For Expo, we'll use expo-auth-session with Google
      const { makeRedirectUri, useAuthRequest, ResponseType } = await import('expo-auth-session');
      const { useGoogleAuth } = await import('expo-auth-session/providers/google');
      
      // This is a simplified implementation
      // In production, you'll need to configure Google OAuth properly
      Alert.alert('Coming Soon', 'Google Sign-In will be fully implemented in the next build. For now, please use email/password.');
      
      // TODO: Implement full Google OAuth flow with expo-auth-session
      // const [request, response, promptAsync] = useGoogleAuth({
      //   clientId: 'YOUR_GOOGLE_CLIENT_ID',
      // });
      // 
      // const result = await promptAsync();
      // if (result.type === 'success') {
      //   const credential = GoogleAuthProvider.credential(result.authentication?.idToken);
      //   const userCredential = await signInWithCredential(auth, credential);
      //   await createUserDocument(userCredential.user, {
      //     displayName: userCredential.user.displayName,
      //   });
      // }
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      throw new Error('Failed to sign in with Google. Please try again.');
    }
  };

  // Sign in with Apple
  const signInWithApple = async () => {
    if (!auth) {
      throw new Error('Firebase Auth not initialized. Please check your Firebase configuration.');
    }
    try {
      const AppleAuthentication = await import('expo-apple-authentication').then(m => m.default);
      
      // Check if Apple Authentication is available
      const isAvailable = await AppleAuthentication.isAvailableAsync();
      if (!isAvailable) {
        throw new Error('Apple Sign-In is not available on this device.');
      }

      // Request Apple authentication
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (credential.identityToken) {
        // Create Firebase credential
        const provider = new OAuthProvider('apple.com');
        const firebaseCredential = provider.credential({
          idToken: credential.identityToken,
          rawNonce: credential.nonce,
        });

        // Sign in to Firebase
        const userCredential = await signInWithCredential(auth, firebaseCredential);
        
        // Update profile with Apple name if available
        if (credential.fullName) {
          const displayName = `${credential.fullName.givenName || ''} ${credential.fullName.familyName || ''}`.trim();
          if (displayName && userCredential.user) {
            await updateProfile(userCredential.user, { displayName });
          }
        }

        await createUserDocument(userCredential.user, {
          displayName: userCredential.user.displayName || credential.fullName?.givenName || 'User',
        });
      }
    } catch (error: any) {
      console.error('Apple sign-in error:', error);
      if (error.code === 'ERR_REQUEST_CANCELED') {
        throw new Error('Sign-in was canceled.');
      }
      throw new Error('Failed to sign in with Apple. Please try again.');
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
      default:
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

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const appUser = await convertFirebaseUser(firebaseUser);
          setUser(appUser);
        } catch (error) {
          console.error('Error converting user:', error);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

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
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
