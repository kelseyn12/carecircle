// Home screen showing user's circles
import React from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList, Circle } from '../types';
import CircleCard from '../components/CircleCard';
import { useAuth } from '../lib/authContext';
import { useCircles } from '../lib/useCircles';
import { EMOJIS } from '../utils/emojiUtils';

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

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
      <View className="w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full items-center justify-center mb-8 shadow-xl">
        <Text className="text-6xl">{EMOJIS.BLUE_HEART}</Text>
      </View>
      <Text className="text-2xl font-bold text-gray-800 mb-3 text-center">
        Welcome to Care Circle
      </Text>
      <Text className="text-gray-600 text-center mb-8 leading-relaxed text-base">
        Create your first circle to start sharing updates with family and friends. 
        Stay connected with those who matter most.
      </Text>
      <TouchableOpacity
        className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl px-8 py-4 shadow-lg"
        onPress={handleCreateCircle}
      >
        <Text className="text-white font-bold text-lg">Create Your First Circle</Text>
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
      <View className="flex-1 justify-center items-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <View className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full items-center justify-center mb-4">
          <Text className="text-2xl">{EMOJIS.BLUE_HEART}</Text>
        </View>
        <Text className="text-gray-600 text-lg font-medium">Loading circles...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 justify-center items-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 px-6">
        <View className="w-16 h-16 bg-red-100 rounded-full items-center justify-center mb-4">
          <Text className="text-2xl">{EMOJIS.WARNING}</Text>
        </View>
        <Text className="text-red-600 text-center mb-6 text-lg font-medium">{error}</Text>
        <TouchableOpacity
          className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl px-6 py-3 shadow-lg"
          onPress={handleRefresh}
        >
          <Text className="text-white font-bold text-base">Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <View className="bg-white px-6 py-4 border-b border-gray-100 shadow-sm" style={{ paddingTop: 50 }}>
        <View className="flex-row justify-between items-center">
          <View className="flex-1">
            <Text className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              My Circles
            </Text>
            <Text className="text-gray-600 text-base mt-2" style={{ marginTop: 4 }}>
              Welcome, {user?.displayName || 'User'} {EMOJIS.BLUE_HEART}
            </Text>
          </View>
          <View className="flex-row space-x-3">
            <TouchableOpacity
              className="bg-emerald-500 rounded-2xl w-12 h-12 justify-center items-center shadow-lg"
              onPress={handleCreateCircle}
              style={{
                backgroundColor: '#10b981',
                borderRadius: 16,
                width: 48,
                height: 48,
                justifyContent: 'center',
                alignItems: 'center',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.25,
                shadowRadius: 4,
                elevation: 5,
              }}
            >
              <Text className="text-white text-xl font-bold" style={{ color: 'white', fontSize: 20, fontWeight: 'bold' }}>+</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="bg-gray-500 rounded-2xl w-12 h-12 justify-center items-center shadow-lg"
              onPress={handleSignOut}
              style={{
                backgroundColor: '#6b7280',
                borderRadius: 16,
                width: 48,
                height: 48,
                justifyContent: 'center',
                alignItems: 'center',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.25,
                shadowRadius: 4,
                elevation: 5,
              }}
            >
              <Text className="text-white text-lg" style={{ color: 'white', fontSize: 18 }}>↪</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Content */}
      {circles.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={circles}
          renderItem={renderCircle}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 20 }}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={handleRefresh}
              tintColor="#3b82f6"
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

export default HomeScreen;
