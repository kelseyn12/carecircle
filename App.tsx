import 'react-native-gesture-handler';
import React, { useEffect, useRef } from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootSiblingParent } from 'react-native-root-siblings';
import AppNavigator from './src/navigation/AppNavigator';
import { AuthProvider } from './src/lib/authContext';
import { ErrorBoundary } from './src/lib/errorHandler';
// ErrorBoundary is exported as a class, this import should work
import './global.css';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Linking from 'expo-linking';
import { NavigationContainerRefWithCurrent } from '@react-navigation/native';
// Sentry for crash reporting (optional - only if DSN is provided)
let Sentry: any = null;
if (!__DEV__ && process.env.EXPO_PUBLIC_SENTRY_DSN) {
  try {
    Sentry = require('@sentry/react-native');
    Sentry.init({
      dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
      enableInExpoDevelopment: false,
      debug: false,
      environment: process.env.APP_ENV || 'production',
      tracesSampleRate: 0.1, // 10% of transactions for performance monitoring
    });
  } catch (error) {
    console.warn('Sentry not available or initialization failed:', error);
  }
}

// 🧩 Global error handler
if (typeof global !== 'undefined' && (global as any).ErrorUtils) {
  const originalHandler = (global as any).ErrorUtils?.getGlobalHandler?.();
  (global as any).ErrorUtils?.setGlobalHandler?.((error: Error, isFatal?: boolean) => {
    console.error('Global error handler:', error, { isFatal });
    if (!__DEV__ && Sentry) {
      try {
        Sentry.captureException(error, {
          tags: { isFatal: isFatal?.toString() },
        });
      } catch (sentryError) {
        console.warn('Sentry capture failed:', sentryError);
      }
    }
    if (originalHandler) originalHandler(error, isFatal);
  });
}

// 🧩 Handle unhandled promise rejections
if (typeof process !== 'undefined' && process.on) {
  process.on('unhandledRejection', (reason: any) => {
    console.error('Unhandled promise rejection:', reason);
    if (!__DEV__ && Sentry) {
      try {
        Sentry.captureException(reason instanceof Error ? reason : new Error(String(reason)));
      } catch (sentryError) {
        console.warn('Sentry capture failed:', sentryError);
      }
    }
  });
}

export default function App() {
  // We'll store a ref to the navigator so we can trigger navigation after mount
  const navigationRef = useRef<NavigationContainerRefWithCurrent<ReactNavigation.RootParamList>>(null);

  // ✅ Handle invite links and stored pending invites
  useEffect(() => {
    const handleInitialInvite = async () => {
      try {
        // Wait a moment for navigation to initialize
        await new Promise((r) => setTimeout(r, 500));

        let inviteId: string | null = null;

        // Check if the app was opened via a deep link (carecircle:// or universal link)
        const url = await Linking.getInitialURL();
        if (url) {
          try {
            const parsed = new URL(url);
            inviteId = parsed.searchParams.get('inviteId');
          } catch (parseError) {
            console.warn('Could not parse deep link:', parseError);
          }
        }

        // Fallback: check if there's a pending invite saved by fallback.html
        if (!inviteId) {
          inviteId = await AsyncStorage.getItem('pendingInviteId');
        }

        if (inviteId) {
          console.log('🎯 Found invite ID:', inviteId);
          await AsyncStorage.removeItem('pendingInviteId');

          // Ensure navigation is ready
          const navigateToJoin = () => {
            if (navigationRef.current?.navigate) {
              (navigationRef.current as any).navigate('Join', { inviteId });
            } else {
              // If navigation not ready, retry shortly
              setTimeout(navigateToJoin, 300);
            }
          };
          navigateToJoin();
        }
      } catch (err) {
        console.error('Error handling pending invite:', err);
      }
    };

    handleInitialInvite();

    // Optional: Listen for new deep links while app is open
    const subscription = Linking.addEventListener('url', ({ url }) => {
      try {
        const parsed = new URL(url);
        const inviteId = parsed.searchParams.get('inviteId');
        if (inviteId && navigationRef.current?.navigate) {
          (navigationRef.current as any).navigate('Join', { inviteId });
        }
      } catch (err) {
        console.error('Error handling runtime deep link:', err);
      }
    });

    return () => subscription.remove();
  }, []);

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <RootSiblingParent>
          <AuthProvider>
            {/* 🚀 Pass the navigationRef down so it can be accessed in AppNavigator */}
            <AppNavigator navigationRef={navigationRef} />
            <StatusBar barStyle="default" />
          </AuthProvider>
        </RootSiblingParent>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
