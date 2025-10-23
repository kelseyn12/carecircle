// Circle feed screen showing updates for a specific circle
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList, Update } from '../types';
import UpdateCard from '../components/UpdateCard';
import { useAuth } from '../lib/authContext';
import { subscribeToCircleUpdates } from '../lib/firestoreUtils';

type CircleFeedScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'CircleFeed'>;
type CircleFeedScreenRouteProp = RouteProp<RootStackParamList, 'CircleFeed'>;

const CircleFeedScreen: React.FC = () => {
  const navigation = useNavigation<CircleFeedScreenNavigationProp>();
  const route = useRoute<CircleFeedScreenRouteProp>();
  const { user } = useAuth();
  const { circleId } = route.params;
  
  const [updates, setUpdates] = useState<Update[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!circleId) return;

    setLoading(true);
    setError(null);

    const unsubscribe = subscribeToCircleUpdates(circleId, (updatesData) => {
      setUpdates(updatesData);
      setLoading(false);
      setRefreshing(false);
    });

    return unsubscribe;
  }, [circleId]);

  const handleRefresh = async () => {
    setRefreshing(true);
    // The real-time subscription will automatically update the data
  };

  const handleCreateUpdate = () => {
    navigation.navigate('NewUpdate', { circleId });
  };

  const handleReaction = (updateId: string, emoji: string) => {
    // TODO: Implement reaction functionality
    console.log('Reaction:', updateId, emoji);
  };

  const renderUpdate = ({ item }: { item: Update }) => (
    <UpdateCard
      update={item}
      authorName={item.authorId === user?.id ? 'You' : 'Member'}
      onReaction={handleReaction}
    />
  );

  const renderEmptyState = () => (
    <View className="flex-1 justify-center items-center px-6">
      <Text className="text-6xl mb-4">📝</Text>
      <Text className="text-xl font-semibold text-gray-800 mb-2">
        No updates yet
      </Text>
      <Text className="text-gray-600 text-center mb-6">
        Be the first to share an update with your circle
      </Text>
      <TouchableOpacity
        className="bg-blue-500 rounded-xl px-6 py-3"
        onPress={handleCreateUpdate}
      >
        <Text className="text-white font-semibold">Share Update</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <Text className="text-gray-600">Loading updates...</Text>
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
      {/* Header */}
      <View className="bg-white px-6 py-4 border-b border-gray-200">
        <View className="flex-row justify-between items-center">
          <View className="flex-1">
            <Text className="text-xl font-semibold text-gray-800">Circle Updates</Text>
            <Text className="text-gray-600 text-sm">
              {updates.length} update{updates.length !== 1 ? 's' : ''}
            </Text>
          </View>
          <TouchableOpacity
            className="bg-blue-500 rounded-full w-10 h-10 justify-center items-center"
            onPress={handleCreateUpdate}
          >
            <Text className="text-white text-xl">+</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Updates List */}
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
              refreshing={refreshing}
              onRefresh={handleRefresh}
            />
          }
        />
      )}
    </View>
  );
};

export default CircleFeedScreen;