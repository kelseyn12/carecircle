// Isolated network status hook without any dependencies
import { useState, useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';

export interface SimpleNetworkStatus {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  type: string | null;
}

export const useSimpleNetworkStatus = (): SimpleNetworkStatus => {
  const [networkStatus, setNetworkStatus] = useState<SimpleNetworkStatus>({
    isConnected: true,
    isInternetReachable: true,
    type: null,
  });

  useEffect(() => {
    let isMounted = true;

    const getInitialState = async () => {
      try {
        const state = await NetInfo.fetch();
        if (isMounted) {
          setNetworkStatus({
            isConnected: state.isConnected ?? false,
            isInternetReachable: state.isInternetReachable,
            type: state.type,
          });
        }
      } catch (error) {
        console.error('Error fetching initial network state:', error);
        if (isMounted) {
          setNetworkStatus({
            isConnected: false,
            isInternetReachable: false,
            type: 'unknown',
          });
        }
      }
    };

    getInitialState();

    const unsubscribe = NetInfo.addEventListener((state) => {
      if (isMounted) {
        setNetworkStatus({
          isConnected: state.isConnected ?? false,
          isInternetReachable: state.isInternetReachable,
          type: state.type,
        });
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  return networkStatus;
};
