// Circle feed screen showing updates for a specific circle
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl, Alert, Modal } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList, Update } from '../types';
import UpdateCard from '../components/UpdateCard';
import CommentsList from '../components/CommentsList';
import { useAuth } from '../lib/authContext';
import { subscribeToCircleUpdates, isUserOwner } from '../lib/firestoreUtils';

type CircleFeedScreenNavigationProp = StackNavigationProp<RootStackParamList, 'CircleFeed'>;
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
  const [isOwner, setIsOwner] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [selectedUpdateId, setSelectedUpdateId] = useState<string | null>(null);

  // Check if user is owner
  useEffect(() => {
    if (!user || !circleId) return;

    const checkOwnership = async () => {
      try {
        const ownerStatus = await isUserOwner(circleId, user.id);
        setIsOwner(ownerStatus);
      } catch (error) {
        console.error('Error checking ownership:', error);
      }
    };

    checkOwnership();
  }, [user, circleId]);

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

  const handleInviteMembers = () => {
    navigation.navigate('Invite', { circleId });
  };

  const handleManageMembers = () => {
    navigation.navigate('MemberManagement', { circleId });
  };

  const handleReaction = (updateId: string, emoji: string) => {
    // TODO: Implement reaction functionality
    console.log('Reaction:', updateId, emoji);
  };

  const handleComment = (updateId: string) => {
    setSelectedUpdateId(updateId);
    setShowComments(true);
  };

  const handleCloseComments = () => {
    setShowComments(false);
    setSelectedUpdateId(null);
  };

  const renderUpdate = ({ item }: { item: Update }) => (
    <UpdateCard
      update={item}
      authorName={item.authorId === user?.id ? 'You' : 'Member'}
      onReaction={handleReaction}
      onComment={handleComment}
    />
  );

  const renderEmptyState = () => (
    <View className="flex-1 justify-center items-center px-6">
      <View className="w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full items-center justify-center mb-8 shadow-xl">
        <Text className="text-6xl">💙</Text>
      </View>
      <Text className="text-2xl font-bold text-gray-800 mb-3 text-center">
        No updates yet
      </Text>
      <Text className="text-gray-600 text-center mb-8 leading-relaxed text-base">
        When you have news, share it here. Your circle is waiting to hear from you.
      </Text>
      {isOwner && (
        <TouchableOpacity
          className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl px-8 py-4 shadow-lg"
          onPress={handleCreateUpdate}
        >
          <Text className="text-white font-bold text-lg">Share Update</Text>
        </TouchableOpacity>
      )}
      {!isOwner && (
        <View className="bg-gray-100 rounded-2xl px-8 py-4">
          <Text className="text-gray-600 font-medium text-lg text-center">
            Only circle owners can post updates
          </Text>
        </View>
      )}
    </View>
  );

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <View className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full items-center justify-center mb-4">
          <Text className="text-2xl">💙</Text>
        </View>
        <Text className="text-gray-600 text-lg font-medium">Loading updates...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 justify-center items-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 px-6">
        <View className="w-16 h-16 bg-red-100 rounded-full items-center justify-center mb-4">
          <Text className="text-2xl">⚠️</Text>
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
      <View className="bg-white px-6 py-6 border-b border-gray-100 shadow-sm">
        <View className="flex-row justify-between items-center">
          <View className="flex-row items-center flex-1">
            <TouchableOpacity
              className="bg-gray-100 rounded-2xl w-12 h-12 items-center justify-center mr-4 mt-4"
              onPress={() => navigation.navigate('Home')}
            >
              <Text className="text-gray-700 text-lg font-bold">←</Text>
            </TouchableOpacity>
            <View className="flex-1">
              <Text className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Circle Updates
              </Text>
              <Text className="text-gray-600 text-base mt-1">
                {updates.length} update{updates.length !== 1 ? 's' : ''}
              </Text>
            </View>
          </View>
          <View className="flex-row space-x-3">
            <TouchableOpacity
              className="bg-gradient-to-r from-gray-500 to-gray-600 rounded-2xl w-12 h-12 justify-center items-center shadow-lg"
              onPress={handleManageMembers}
            >
              <Text className="text-white text-lg">⚙️</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-2xl w-12 h-12 justify-center items-center shadow-lg"
              onPress={handleInviteMembers}
            >
              <Text className="text-white text-lg">👥</Text>
            </TouchableOpacity>
            {isOwner && (
              <TouchableOpacity
                className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl w-12 h-12 justify-center items-center shadow-lg"
                onPress={handleCreateUpdate}
              >
                <Text className="text-white text-xl font-bold">+</Text>
              </TouchableOpacity>
            )}
          </View>
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

      {/* Comments Modal */}
      <Modal
        visible={showComments}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleCloseComments}
      >
        {selectedUpdateId && (
          <CommentsList
            updateId={selectedUpdateId}
            onClose={handleCloseComments}
          />
        )}
      </Modal>
    </View>
  );
};

export default CircleFeedScreen;