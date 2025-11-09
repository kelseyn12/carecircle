import 'react-native-gesture-handler';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootSiblingParent } from 'react-native-root-siblings'; // Required for react-native-root-toast
import AppNavigator from './src/navigation/AppNavigator';
import { AuthProvider } from './src/lib/authContext';
import { ErrorBoundary } from './src/lib/errorHandler';
import './global.css'; 

// Global error handler for unhandled promise rejections
if (typeof global !== 'undefined') {
  const originalHandler = global.ErrorUtils?.getGlobalHandler?.();
  
  global.ErrorUtils?.setGlobalHandler?.((error: Error, isFatal?: boolean) => {
    console.error('Global error handler:', error, { isFatal });
    
    // Call original handler if it exists
    if (originalHandler) {
      originalHandler(error, isFatal);
    }
  });
}

// Handle unhandled promise rejections
if (typeof process !== 'undefined' && process.on) {
  process.on('unhandledRejection', (reason: any) => {
    console.error('Unhandled promise rejection:', reason);
  });
}

export default function App() {
  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <RootSiblingParent>
          <AuthProvider>
            <AppNavigator />
            <StatusBar style="auto" />
          </AuthProvider>
        </RootSiblingParent>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}

