// Circle Feed screen showing updates for a specific circle
// TODO: Implement Firestore queries to fetch circle updates
// TODO: Add real-time updates with Firestore listeners
// TODO: Add pull-to-refresh functionality
// TODO: Add loading states and error handling
// TODO: Implement emoji reactions

import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList, Update } from '../types';
import UpdateCard from '../components/UpdateCard';

type CircleFeedScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'CircleFeed'>;
type CircleFeedScreenRouteProp = RouteProp<RootStackParamList, 'CircleFeed'>;

const CircleFeedScreen: React.FC = () => {
  const navigation = useNavigation<CircleFeedScreenNavigationProp>();
  const route = useRoute<CircleFeedScreenRouteProp>();
  const { circleId } = route.params;

  const [updates, setUpdates] = useState<Update[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [circleTitle, setCircleTitle] = useState('Circle Updates');

  // TODO: Implement Firestore query to fetch circle updates
  const fetchUpdates = async () => {
    try {
      // TODO: Add Firestore query logic
      console.log('Fetching updates for circle:', circleId);
      // Mock data for now
      setUpdates([]);
    } catch (error) {
      console.error('Error fetching updates:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUpdates();
  }, [circleId]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchUpdates();
  };

  const handleNewUpdate = () => {
    navigation.navigate('NewUpdate', { circleId });
  };

  const handleInvite = () => {
    navigation.navigate('Invite', { circleId });
  };

  // TODO: Implement emoji reaction functionality
  const handleReaction = (updateId: string, emoji: '❤️' | '🙏' | '👍') => {
    console.log('Reacting to update:', updateId, 'with', emoji);
    // TODO: Add Firestore update for reaction
  };

  const renderEmptyState = () => (
    <View className="flex-1 justify-center items-center px-6">
      <Text className="text-6xl mb-4">📝</Text>
      <Text className="text-xl font-semibold text-gray-800 mb-2">
        No updates yet
      </Text>
      <Text className="text-gray-600 text-center mb-8">
        Share the first update to keep your circle informed
      </Text>
      <TouchableOpacity
        className="bg-blue-500 rounded-xl px-6 py-3"
        onPress={handleNewUpdate}
      >
        <Text className="text-white font-semibold">Share Update</Text>
      </TouchableOpacity>
    </View>
  );

  const renderUpdate = ({ item }: { item: Update }) => (
    <UpdateCard
      update={item}
      onReaction={handleReaction}
    />
  );

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text className="text-gray-600">Loading updates...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <View className="bg-white px-6 py-4 border-b border-gray-200">
        <View className="flex-row justify-between items-center">
          <View className="flex-1">
            <Text className="text-xl font-bold text-gray-800">{circleTitle}</Text>
            <Text className="text-gray-600">{updates.length} updates</Text>
          </View>
          <View className="flex-row space-x-2">
            <TouchableOpacity
              className="bg-green-500 rounded-full w-10 h-10 justify-center items-center"
              onPress={handleNewUpdate}
            >
              <Text className="text-white text-xl">+</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="bg-blue-500 rounded-full w-10 h-10 justify-center items-center"
              onPress={handleInvite}
            >
              <Text className="text-white text-sm">👥</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {updates.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={updates}
          renderItem={renderUpdate}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16 }}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
            />
          }
        />
      )}
    </View>
  );
};

export default CircleFeedScreen;
