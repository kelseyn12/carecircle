// Subscription service using RevenueCat
// Use dynamic import to avoid errors in Expo Go (RevenueCat requires native build)
// NOTE: This conditional import ONLY affects Expo Go. In production builds (TestFlight/App Store),
// RevenueCat will be available and work normally since react-native-purchases is included in the bundle.
let Purchases: any = null;
let CustomerInfo: any = null;
let PurchasesOffering: any = null;
let PurchasesPackage: any = null;

// Try to import RevenueCat (will fail gracefully in Expo Go, but works in production builds)
try {
  const PurchasesModule = require('react-native-purchases');
  Purchases = PurchasesModule.default || PurchasesModule;
  CustomerInfo = PurchasesModule.CustomerInfo;
  PurchasesOffering = PurchasesModule.PurchasesOffering;
  PurchasesPackage = PurchasesModule.PurchasesPackage;
} catch (error) {
  // RevenueCat not available (only happens in Expo Go, not in production builds)
  // In TestFlight/App Store builds, this require() will succeed and RevenueCat will work
  console.warn('RevenueCat not available. This is expected in Expo Go. Subscription features will be disabled.');
}

import { Platform } from 'react-native';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db, auth } from './firebase';

// RevenueCat API key - should be set in environment variables
const REVENUECAT_API_KEY_IOS = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_IOS || '';
const REVENUECAT_API_KEY_ANDROID = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID || '';

// Subscription entitlement identifier
const ENTITLEMENT_IDENTIFIER = 'premium';

// Free tier limit: 1 circle
export const FREE_CIRCLE_LIMIT = 1;

export interface SubscriptionStatus {
  isPremium: boolean;
  isActive: boolean;
  expirationDate?: Date;
  productIdentifier?: string;
}

let isInitialized = false;
let currentRevenueCatUserId: string | null = null;

/**
 * Initialize RevenueCat SDK
 */
export const initializePurchases = async (userId: string): Promise<void> => {
  try {
    // Check if Purchases is available (requires native build)
    // In production builds (TestFlight/App Store), Purchases will be available
    // This check only fails in Expo Go
    if (!Purchases || typeof Purchases.configure !== 'function') {
      console.warn('RevenueCat SDK not available. This is expected in Expo Go. In production builds, RevenueCat will work normally.');
      isInitialized = false;
      currentRevenueCatUserId = null;
      return;
    }

    const apiKey = Platform.OS === 'ios' ? REVENUECAT_API_KEY_IOS : REVENUECAT_API_KEY_ANDROID;
    
    if (!apiKey) {
      console.warn('RevenueCat API key not configured. Subscription features will be disabled.');
      isInitialized = false;
      currentRevenueCatUserId = null;
      return;
    }

    // Configure if not already configured
    if (!isInitialized) {
      await Purchases.configure({ apiKey });
      isInitialized = true;
    }

    // If user ID changed, re-login to RevenueCat
    if (currentRevenueCatUserId !== userId) {
      await Purchases.logIn(userId);
      currentRevenueCatUserId = userId;
    }
  } catch (error) {
    console.error('Error initializing RevenueCat:', error);
    // Don't throw - allow app to continue without subscriptions
    console.warn('Continuing without RevenueCat. Subscription features will be disabled.');
    isInitialized = false;
    currentRevenueCatUserId = null;
  }
};

/**
 * Get current subscription status
 */
export const getSubscriptionStatus = async (): Promise<SubscriptionStatus> => {
  try {
    if (!isInitialized || !Purchases) {
      return { isPremium: false, isActive: false };
    }

    // Ensure we're using the current authenticated user's UID
    const currentUser = auth?.currentUser;
    if (!currentUser) {
      return { isPremium: false, isActive: false };
    }

    // Make sure RevenueCat is logged in with the current Firebase user
    if (currentRevenueCatUserId !== currentUser.uid) {
      await Purchases.logIn(currentUser.uid);
      currentRevenueCatUserId = currentUser.uid;
    }

    const customerInfo = await Purchases.getCustomerInfo();
    
    // Note: We don't check originalAppUserId because it shows the first user ID (often anonymous),
    // not the current logged-in user. Purchases.logIn() handles user association.
    // Apple subscriptions are device/Apple ID based, which is expected iOS behavior.

    const isPremium = customerInfo.entitlements.active[ENTITLEMENT_IDENTIFIER] !== undefined;
    const entitlement = customerInfo.entitlements.active[ENTITLEMENT_IDENTIFIER];

    return {
      isPremium,
      isActive: isPremium,
      expirationDate: entitlement?.expirationDate ? new Date(entitlement.expirationDate) : undefined,
      productIdentifier: entitlement?.productIdentifier,
    };
  } catch (error) {
    console.error('Error getting subscription status:', error);
    return { isPremium: false, isActive: false };
  }
};

/**
 * Refresh subscription from RevenueCat and sync the latest state to Firestore.
 * This is the most reliable way to keep the app consistent across screens.
 */
export const refreshAndSyncSubscription = async (): Promise<SubscriptionStatus> => {
  try {
    if (!isInitialized || !Purchases) {
      return { isPremium: false, isActive: false };
    }

    // Ensure we're using the current authenticated user's UID
    const currentUser = auth?.currentUser;
    if (!currentUser) {
      return { isPremium: false, isActive: false };
    }

    // Make sure RevenueCat is logged in with the current Firebase user
    if (currentRevenueCatUserId !== currentUser.uid) {
      await Purchases.logIn(currentUser.uid);
      currentRevenueCatUserId = currentUser.uid;
    }

    const customerInfo = await Purchases.getCustomerInfo();
    
    // Note: We previously checked originalAppUserId to verify ownership, but this was incorrect.
    // originalAppUserId shows the FIRST user ID (often an anonymous $RCAnonymousID), not the current user.
    // Since we call Purchases.logIn(firebaseUserId) before this, RevenueCat handles the user association.
    // Apple subscriptions are tied to Apple ID, so if the user has an active subscription on their
    // Apple ID, they should get premium access on any Firebase account they use on that device.
    // This is the expected iOS subscription behavior (family sharing, device-based).

    await syncSubscriptionToFirestore(customerInfo);

    const isPremium = customerInfo.entitlements.active[ENTITLEMENT_IDENTIFIER] !== undefined;
    const entitlement = customerInfo.entitlements.active[ENTITLEMENT_IDENTIFIER];

    return {
      isPremium,
      isActive: isPremium,
      expirationDate: entitlement?.expirationDate ? new Date(entitlement.expirationDate) : undefined,
      productIdentifier: entitlement?.productIdentifier,
    };
  } catch (error) {
    console.error('Error refreshing + syncing subscription:', error);
    return { isPremium: false, isActive: false };
  }
};

/**
 * Get available subscription offerings
 */
export const getOfferings = async (): Promise<any | null> => {
  try {
    if (!isInitialized || !Purchases) {
      return null;
    }

    const offerings = await Purchases.getOfferings();
    // Try to get the "premium" offering first, fallback to current
    return offerings.all['premium'] || offerings.current;
  } catch (error) {
    console.error('Error getting offerings:', error);
    return null;
  }
};

/**
 * Purchase a subscription package
 */
export const purchasePackage = async (packageToPurchase: any): Promise<any> => {
  try {
    if (!isInitialized || !Purchases) {
      throw new Error('RevenueCat not initialized');
    }

    const { customerInfo } = await Purchases.purchasePackage(packageToPurchase);
    
    // Sync subscription status to Firestore
    await syncSubscriptionToFirestore(customerInfo);
    
    return customerInfo;
  } catch (error: any) {
    console.error('Error purchasing package:', error);
    
    // Handle user cancellation gracefully
    if (error.userCancelled) {
      throw new Error('Purchase was cancelled');
    }
    
    throw error;
  }
};

/**
 * Restore purchases
 */
export const restorePurchases = async (): Promise<any> => {
  try {
    if (!isInitialized || !Purchases) {
      throw new Error('RevenueCat not initialized');
    }

    const customerInfo = await Purchases.restorePurchases();
    
    // Sync subscription status to Firestore
    await syncSubscriptionToFirestore(customerInfo);
    
    return customerInfo;
  } catch (error) {
    console.error('Error restoring purchases:', error);
    throw error;
  }
};

/**
 * Sync subscription status to Firestore user document
 */
export const syncSubscriptionToFirestore = async (customerInfo: any): Promise<void> => {
  if (!db) {
    console.warn('Firestore not initialized, skipping subscription sync');
    return;
  }

  try {
    // Use the currently authenticated user's UID to ensure security rules pass
    // This is more secure than trusting customerInfo.originalAppUserId
    const currentUser = auth?.currentUser;
    if (!currentUser) {
      console.warn('No authenticated user found, skipping subscription sync');
      return;
    }

    const userId = currentUser.uid;
    
    // Note: We don't check originalAppUserId because it shows the first user ID (often anonymous),
    // not the current logged-in user. Apple subscriptions are tied to Apple ID, so if a user
    // has an active subscription on their Apple ID, they get premium on their current Firebase account.
    // This is expected iOS subscription behavior.

    const isPremium = customerInfo.entitlements.active[ENTITLEMENT_IDENTIFIER] !== undefined;
    const entitlement = customerInfo.entitlements.active[ENTITLEMENT_IDENTIFIER];

    const subscriptionData = {
      isPremium,
      subscriptionExpiresAt: entitlement?.expirationDate 
        ? new Date(entitlement.expirationDate) 
        : null,
      productIdentifier: entitlement?.productIdentifier || null,
      lastSyncedAt: new Date(),
    };

    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, subscriptionData, { merge: true });
  } catch (error) {
    console.error('Error syncing subscription to Firestore:', error);
  }
};

/**
 * Check if user can create more circles based on subscription status
 */
export const canCreateCircle = async (currentCircleCount: number): Promise<boolean> => {
  // Free users can create up to FREE_CIRCLE_LIMIT circles
  if (currentCircleCount < FREE_CIRCLE_LIMIT) {
    return true;
  }

  // If user has reached free limit, check subscription
  const subscriptionStatus = await getSubscriptionStatus();
  return subscriptionStatus.isPremium;
};

/**
 * Get subscription status from Firestore (faster than RevenueCat API call)
 */
export const getSubscriptionStatusFromFirestore = async (userId: string): Promise<SubscriptionStatus> => {
  if (!db) {
    return { isPremium: false, isActive: false };
  }

  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) {
      return { isPremium: false, isActive: false };
    }

    const data = userDoc.data();
    const isPremium = data.isPremium === true;
    const expirationDate = data.subscriptionExpiresAt?.toDate();

    return {
      isPremium,
      isActive: isPremium && (!expirationDate || expirationDate > new Date()),
      expirationDate,
      productIdentifier: data.productIdentifier,
    };
  } catch (error) {
    console.error('Error getting subscription status from Firestore:', error);
    return { isPremium: false, isActive: false };
  }
};
