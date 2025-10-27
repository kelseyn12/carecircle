import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { RootSiblingParent } from 'react-native-root-siblings'; // Required for react-native-root-toast
import AppNavigator from './src/navigation/AppNavigator';
import { AuthProvider } from './src/lib/authContext';
import './global.css'; 

export default function App() {
  return (
    <RootSiblingParent>
      <AuthProvider>
        <AppNavigator />
        <StatusBar style="auto" />
      </AuthProvider>
    </RootSiblingParent>
  );
}

