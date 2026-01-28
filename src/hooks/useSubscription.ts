// Custom hook for subscription management
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../lib/authContext';
import {
  initializePurchases,
  getSubscriptionStatus,
  refreshAndSyncSubscription,
  getOfferings,
  purchasePackage,
  restorePurchases,
  getSubscriptionStatusFromFirestore,
  SubscriptionStatus,
  FREE_CIRCLE_LIMIT,
} from '../lib/subscriptionService';
// Use conditional import for RevenueCat types (not available in Expo Go)
let PurchasesOffering: any = null;
let PurchasesPackage: any = null;
try {
  const PurchasesModule = require('react-native-purchases');
  PurchasesOffering = PurchasesModule.PurchasesOffering;
  PurchasesPackage = PurchasesModule.PurchasesPackage;
} catch (error) {
  // Types not available (e.g., in Expo Go) - use any
}

export const useSubscription = () => {
  const { user } = useAuth();
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus>({
    isPremium: false,
    isActive: false,
  });
  const [offerings, setOfferings] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize RevenueCat when user logs in
  useEffect(() => {
    if (!user) {
      setSubscriptionStatus({ isPremium: false, isActive: false });
      setLoading(false);
      return;
    }

    const initialize = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Initialize RevenueCat
        await initializePurchases(user.id);
        
        // Get subscription status from Firestore first (faster)
        const firestoreStatus = await getSubscriptionStatusFromFirestore(user.id);
        setSubscriptionStatus(firestoreStatus);

        // Then refresh from RevenueCat (most accurate) and sync back to Firestore
        const revenueCatStatus = await refreshAndSyncSubscription();
        if (revenueCatStatus.isPremium || firestoreStatus.isPremium !== revenueCatStatus.isPremium) {
          setSubscriptionStatus(revenueCatStatus);
        }
        
        // Also fetch offerings
        const currentOfferings = await getOfferings();
        setOfferings(currentOfferings);
      } catch (err) {
        console.error('Error initializing subscription:', err);
        setError(err instanceof Error ? err.message : 'Failed to initialize subscription');
        // Don't block the app if subscription fails to initialize
        setSubscriptionStatus({ isPremium: false, isActive: false });
      } finally {
        setLoading(false);
      }
    };

    initialize();
  }, [user]);

  // Refresh subscription status
  const refreshSubscription = useCallback(async () => {
    if (!user) return;

    try {
      setError(null);
      // Always grab Firestore first for a stable baseline (works even if RevenueCat isn't initialized)
      const firestoreStatus = await getSubscriptionStatusFromFirestore(user.id);
      setSubscriptionStatus(firestoreStatus);

      // Then refresh from RevenueCat and sync to Firestore (if available)
      const revenueCatStatus = await refreshAndSyncSubscription();
      // Always use RevenueCat status if it says premium, or if it differs from Firestore
      // This ensures we show premium status correctly even if Firestore is stale
      if (revenueCatStatus.isPremium || firestoreStatus.isPremium !== revenueCatStatus.isPremium) {
        setSubscriptionStatus(revenueCatStatus);
      } else {
        // If RevenueCat says not premium but Firestore says premium, trust RevenueCat (source of truth)
        setSubscriptionStatus(revenueCatStatus);
      }
    } catch (err) {
      console.error('Error refreshing subscription:', err);
      setError(err instanceof Error ? err.message : 'Failed to refresh subscription');
    }
  }, [user]);

  // Purchase a package
  const purchase = useCallback(async (packageToPurchase: any) => {
    try {
      setError(null);
      await purchasePackage(packageToPurchase);
      await refreshSubscription();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to purchase subscription';
      setError(errorMessage);
      throw err;
    }
  }, [refreshSubscription]);

  // Restore purchases
  const restore = useCallback(async () => {
    try {
      setError(null);
      await restorePurchases();
      await refreshSubscription();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to restore purchases';
      setError(errorMessage);
      throw err;
    }
  }, [refreshSubscription]);

  // Check if user can create more circles
  // Uses totalCirclesCreated to prevent users from gaming the system by deleting and recreating circles
  const canCreateCircle = useCallback((totalCirclesCreated: number): boolean => {
    if (totalCirclesCreated < FREE_CIRCLE_LIMIT) {
      return true;
    }
    return subscriptionStatus.isPremium;
  }, [subscriptionStatus.isPremium]);

  return {
    subscriptionStatus,
    offerings,
    loading,
    error,
    refreshSubscription,
    purchase,
    restore,
    canCreateCircle,
    FREE_CIRCLE_LIMIT,
  };
};
