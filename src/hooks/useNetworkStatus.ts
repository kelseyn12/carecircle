// Network status hook for monitoring connectivity
import { useState, useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { setOnlineStatus } from './offlineQueue';

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
      const state = await NetInfo.fetch();
      const status: NetworkStatus = {
        isConnected: state.isConnected ?? false,
        isInternetReachable: state.isInternetReachable,
        type: state.type,
      };
      
      setNetworkStatus(status);
      setOnlineStatus(status.isConnected && status.isInternetReachable === true);
    };

    getInitialState();

    // Subscribe to network state changes
    const unsubscribe = NetInfo.addEventListener((state) => {
      const status: NetworkStatus = {
        isConnected: state.isConnected ?? false,
        isInternetReachable: state.isInternetReachable,
        type: state.type,
      };
      
      setNetworkStatus(status);
      setOnlineStatus(status.isConnected && status.isInternetReachable === true);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return networkStatus;
};

// Utility function to check if we have a good connection
export const isGoodConnection = (status: NetworkStatus): boolean => {
  return status.isConnected && status.isInternetReachable === true;
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
