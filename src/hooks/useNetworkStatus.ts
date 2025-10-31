// Network status hook for monitoring connectivity
import { useState, useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { setOnlineStatus } from '../lib/offlineQueue';

export interface NetworkStatus {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  type: string | null;
}

export const useNetworkStatus = (): NetworkStatus => {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isConnected: true,
    isInternetReachable: true,
    type: null,
  });

  useEffect(() => {
    // Get initial network state
    const getInitialState = async () => {
      try {
        const state = await NetInfo.fetch();
        const status: NetworkStatus = {
          isConnected: state.isConnected ?? false,
          isInternetReachable: state.isInternetReachable,
          type: state.type,
        };
        
        setNetworkStatus(status);
        // Don't call setOnlineStatus here to avoid circular dependency
      } catch (error) {
        console.error('Error fetching initial network state:', error);
        // Set safe defaults on error
        setNetworkStatus({
          isConnected: false,
          isInternetReachable: false,
          type: 'unknown',
        });
      }
    };

    getInitialState();

    // Subscribe to network state changes
    const unsubscribe = NetInfo.addEventListener((state) => {
      try {
        const status: NetworkStatus = {
          isConnected: state.isConnected ?? false,
          isInternetReachable: state.isInternetReachable,
          type: state.type,
        };
        
        setNetworkStatus(status);
        // Don't call setOnlineStatus here to avoid circular dependency
      } catch (error) {
        console.error('Error in network state listener:', error);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return networkStatus;
};

// Utility function to check if we have a good connection
export const isGoodConnection = (status: NetworkStatus): boolean => {
  // If not connected at all, we're offline
  if (!status.isConnected) {
    return false;
  }
  
  // If connected and on Wi-Fi, assume we're online (Wi-Fi usually means internet)
  // This prevents false positives when isInternetReachable check is slow or unreliable
  if (status.type === 'wifi') {
    return true;
  }
  
  // For other connection types, check isInternetReachable
  // If isInternetReachable is null (uncertain), assume connected (common on simulator/hotspot)
  if (status.isInternetReachable === null) {
    return true;
  }
  
  // Only return false if explicitly unreachable
  return status.isInternetReachable === true;
};

// Utility function to get connection quality
export const getConnectionQuality = (status: NetworkStatus): 'excellent' | 'good' | 'poor' | 'offline' => {
  if (!status.isConnected || status.isInternetReachable === false) {
    return 'offline';
  }
  
  if (status.isInternetReachable === null) {
    return 'poor';
  }
  
  switch (status.type) {
    case 'wifi':
      return 'excellent';
    case 'cellular':
      return 'good';
    default:
      return 'poor';
  }
};
