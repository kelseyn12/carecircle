// Home screen showing user's circles
import React from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types';
import CircleCard from '../components/CircleCard';
import { useAuth } from '../lib/authContext';
import { useCircles } from '../lib/useCircles';

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { user, signOut } = useAuth();
  const { circles, loading, error, refreshCircles } = useCircles();

  const handleCreateCircle = () => {
    navigation.navigate('CreateCircle');
  };

  const handleCirclePress = (circleId: string) => {
    navigation.navigate('CircleFeed', { circleId });
  };

  const handleRefresh = async () => {
    try {
      await refreshCircles();
    } catch (error) {
      console.error('Error refreshing circles:', error);
    }
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
            } catch (error) {
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            }
          },
        },
      ]
    );
  };

  const renderEmptyState = () => (
    <View className="flex-1 justify-center items-center px-6">
      <Text className="text-6xl mb-4">👥</Text>
      <Text className="text-xl font-semibold text-gray-800 mb-2">
        No circles yet
      </Text>
      <Text className="text-gray-600 text-center mb-8">
        Create your first circle to start sharing updates with family and friends
      </Text>
      <TouchableOpacity
        className="bg-blue-500 rounded-xl px-6 py-3"
        onPress={handleCreateCircle}
      >
        <Text className="text-white font-semibold">Create Circle</Text>
      </TouchableOpacity>
    </View>
  );

  const renderCircle = ({ item }: { item: Circle }) => (
    <CircleCard
      circle={item}
      onPress={() => handleCirclePress(item.id)}
    />
  );

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <Text className="text-gray-600">Loading circles...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50 px-6">
        <Text className="text-red-600 text-center mb-4">{error}</Text>
        <TouchableOpacity
          className="bg-blue-500 rounded-xl px-6 py-3"
          onPress={handleRefresh}
        >
          <Text className="text-white font-semibold">Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <View className="bg-white px-6 py-4 border-b border-gray-200">
        <View className="flex-row justify-between items-center">
          <View className="flex-1">
            <Text className="text-2xl font-bold text-gray-800">My Circles</Text>
            <Text className="text-gray-600 text-sm">Welcome, {user?.displayName || 'User'}</Text>
          </View>
          <View className="flex-row space-x-2">
            <TouchableOpacity
              className="bg-blue-500 rounded-full w-10 h-10 justify-center items-center"
              onPress={handleCreateCircle}
            >
              <Text className="text-white text-xl">+</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="bg-gray-500 rounded-full w-10 h-10 justify-center items-center"
              onPress={handleSignOut}
            >
              <Text className="text-white text-sm">↪</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {circles.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={circles}
          renderItem={renderCircle}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16 }}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={handleRefresh}
            />
          }
        />
      )}
    </View>
  );
};

export default HomeScreen;
