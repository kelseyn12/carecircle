// Main navigation component for the Care Circle app
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { View, Text, ActivityIndicator } from 'react-native';

// Import screens
import SignInScreen from '../screens/SignInScreen';
import HomeScreen from '../screens/HomeScreen';
import CreateCircleScreen from '../screens/CreateCircleScreen';
import CircleFeedScreen from '../screens/CircleFeedScreen';
import NewUpdateScreen from '../screens/NewUpdateScreen';
import InviteScreen from '../screens/InviteScreen';
import JoinScreen from '../screens/JoinScreen';
import MemberManagementScreen from '../screens/MemberManagementScreen';

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

const AppNavigator: React.FC = () => {
  const { user, loading } = useAuth();

  // Show loading screen while checking authentication
  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          // Authenticated user screens
          <>
            <Stack.Screen 
              name="Home" 
              component={HomeScreen} 
              options={{ title: 'Care Circles' }}
            />
            <Stack.Screen 
              name="CreateCircle" 
              component={CreateCircleScreen}
              options={{ title: 'Create Circle' }}
            />
            <Stack.Screen 
              name="CircleFeed" 
              component={CircleFeedScreen}
              options={{ title: 'Circle Updates' }}
            />
            <Stack.Screen 
              name="NewUpdate" 
              component={NewUpdateScreen}
              options={{ title: 'Share Update' }}
            />
            <Stack.Screen 
              name="Invite" 
              component={InviteScreen}
              options={{ title: 'Invite to Circle' }}
            />
            <Stack.Screen 
              name="Join" 
              component={JoinScreen}
              options={{ title: 'Join Circle' }}
            />
            <Stack.Screen 
              name="MemberManagement" 
              component={MemberManagementScreen}
              options={{ title: 'Manage Members' }}
            />
          </>
        ) : (
          // Unauthenticated user screens
          <Stack.Screen name="SignIn" component={SignInScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
