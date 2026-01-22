// Main navigation component for the CareCircle Connect app
import React, { useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { View, Text, ActivityIndicator } from 'react-native';
import * as Linking from 'expo-linking';
import { setupNotificationListeners } from '../lib/notificationService';

// Import screens
import SignInScreen from '../screens/SignInScreen';
import HomeScreen from '../screens/HomeScreen';
import CreateCircleScreen from '../screens/CreateCircleScreen';
import CircleFeedScreen from '../screens/CircleFeedScreen';
import NewUpdateScreen from '../screens/NewUpdateScreen';
import InviteScreen from '../screens/InviteScreen';
import JoinScreen from '../screens/JoinScreen';
import MemberManagementScreen from '../screens/MemberManagementScreen';
import CommentsScreen from '../screens/CommentsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import PaywallScreen from '../screens/PaywallScreen';

// Import auth context
import { useAuth } from '../lib/authContext';
import { RootStackParamList } from '../types';

const Stack = createStackNavigator<RootStackParamList>();

// Loading component
const LoadingScreen: React.FC = () => (
  <View className="flex-1 justify-center items-center bg-gray-50">
    <ActivityIndicator size="large" color="#3b82f6" />
    <Text className="text-gray-600 mt-4">Loading...</Text>
  </View>
);

// AppNavigator.tsx
const AppNavigator: React.FC<{ navigationRef?: any }> = ({ navigationRef }) => {
  const { user, loading } = useAuth();
  const notificationListenersRef = useRef<ReturnType<typeof setupNotificationListeners> | null>(null);

  useEffect(() => {
    const listeners = setupNotificationListeners();
    notificationListenersRef.current = listeners;
    return () => listeners.remove();
  }, []);

  const prefix = Linking.createURL('/');
  const linking = {
    prefixes: [prefix, 'https://care-circle-15fd5.web.app', 'https://carecircle.web.app', 'carecircle://'],
    config: {
      screens: {
        Join: 'join',
        Home: 'home',
      },
    },
  };

  if (loading) return <LoadingScreen />;

  return (
    <NavigationContainer ref={navigationRef} linking={linking}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="CreateCircle" component={CreateCircleScreen} />
            <Stack.Screen name="CircleFeed" component={CircleFeedScreen} />
            <Stack.Screen name="NewUpdate" component={NewUpdateScreen} />
            <Stack.Screen name="Invite" component={InviteScreen} />
            <Stack.Screen name="Join" component={JoinScreen} />
            <Stack.Screen name="MemberManagement" component={MemberManagementScreen} />
            <Stack.Screen name="Comments" component={CommentsScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
            <Stack.Screen name="Paywall" component={PaywallScreen} />
          </>
        ) : (
          <Stack.Screen name="SignIn" component={SignInScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};


export default AppNavigator;
