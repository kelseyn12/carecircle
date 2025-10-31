// Circle feed screen showing updates for a specific circle
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList, Update } from '../types';
import UpdateCard from '../components/UpdateCard';
import { useAuth } from '../lib/authContext';
import { subscribeToCircleUpdates, canUserPostUpdates, getUser, toggleReaction, getPendingJoinRequests, setCircleLastViewed } from '../lib/firestoreUtils';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import OfflineIndicator from '../components/OfflineIndicator';

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
  const [canPostUpdates, setCanPostUpdates] = useState(true); // Set to true by default for now
  const [userNames, setUserNames] = useState<Record<string, string>>({});
  const [pendingCount, setPendingCount] = useState(0);

  // Check if user can post updates
  useEffect(() => {
    if (!user || !circleId) return;

    const checkUpdatePermissions = async () => {
      try {
        const canPost = await canUserPostUpdates(circleId, user.id);
        console.log('Can post updates:', canPost, 'for circle:', circleId);
        setCanPostUpdates(canPost);
      } catch (error) {
        console.error('Error checking update permissions:', error);
        // Temporarily allow all users to post updates for debugging
        console.log('Permission check failed, allowing post for debugging');
        setCanPostUpdates(true);
      }
    };

    checkUpdatePermissions();
  }, [user, circleId]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!circleId) return;

    setLoading(true);
    setError(null);

    const unsubscribe = subscribeToCircleUpdates(circleId, async (updatesData) => {
      setUpdates(updatesData);
      
      // Fetch user names for all authors
      const authorIds = Array.from(new Set(updatesData.map(u => u.authorId)));
      const namesMap: Record<string, string> = {};
      
      for (const authorId of authorIds) {
        try {
          const userData = await getUser(authorId);
          if (userData) {
            namesMap[authorId] = userData.displayName;
          }
        } catch (error) {
          console.error('Error fetching user:', authorId, error);
        }
      }
      
      setUserNames(namesMap);
      setLoading(false);
      setRefreshing(false);
    });

    return unsubscribe;
  }, [circleId]);

  // Mark as viewed
  useEffect(() => {
    if (!user) return;
    setCircleLastViewed(user.id, circleId).catch(() => {});
  }, [user, circleId]);

  // Load pending join requests count (owners only; CF handles auth/permission)
  useEffect(() => {
    (async () => {
      try {
        const list = await getPendingJoinRequests(circleId);
        setPendingCount(list.length);
      } catch (e) {
        // ignore if not owner or no requests
      }
    })();
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

  const handleReaction = async (updateId: string, emoji: string) => {
    if (!user) return;
    
    try {
      await toggleReaction(updateId, user.id, emoji);
      console.log('Reaction toggled:', updateId, emoji);
    } catch (error) {
      console.error('Error toggling reaction:', error);
      Alert.alert('Error', 'Failed to update reaction. Please try again.');
    }
  };

  const handleComment = (updateId: string) => {
    navigation.navigate('Comments', { updateId });
  };

  const renderUpdate = ({ item }: { item: Update }) => {
    const authorName = item.authorId === user?.id ? 'You' : (userNames[item.authorId] || 'Member');
    
    return (
      <UpdateCard
        update={item}
        authorName={authorName}
        currentUserId={user?.id}
        onReaction={handleReaction}
        onComment={handleComment}
      />
    );
  };

  const renderEmptyState = () => (
    <View className="flex-1 justify-center items-center px-6">
      <LinearGradient
        colors={['#93c5fd', '#c4b5fd']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          width: 128,
          height: 128,
          borderRadius: 64,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.2,
          shadowRadius: 8,
          elevation: 8,
        }}
      >
        <Text className="text-4xl">💙</Text>
      </LinearGradient>
      <Text className="text-4xl font-bold text-gray-800 mb-3 text-center">
        No updates yet
      </Text>
      <Text className="text-gray-600 text-center mb-8 leading-relaxed text-base">
        When you have news, share it here. Your circle is waiting to hear from you.
      </Text>
      {canPostUpdates && (
        <TouchableOpacity
          onPress={handleCreateUpdate}
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.2,
            shadowRadius: 8,
            elevation: 5,
          }}
        >
          <LinearGradient
            colors={['#60a5fa', '#a78bfa']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              borderRadius: 16,
              paddingHorizontal: 32,
              paddingVertical: 16,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ color: '#ffffff', fontWeight: 'bold', fontSize: 18, textAlign: 'center' }}>
              Share Update
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      )}
      {!canPostUpdates && (
        <View className="bg-gray-100 rounded-2xl px-8 py-4">
          <Text className="text-gray-600 font-medium text-lg text-center">
            You don't have permission to post updates in this circle
          </Text>
        </View>
      )}
    </View>
  );

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-blue-50">
        <LinearGradient
          colors={['#93c5fd', '#c4b5fd']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            width: 64,
            height: 64,
            borderRadius: 32,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 16,
          }}
        >
          <Text className="text-2xl">💙</Text>
        </LinearGradient>
        <Text className="text-gray-600 text-lg font-medium">Loading updates...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 justify-center items-center bg-blue-50 px-6">
        <View className="w-16 h-16 bg-red-100 rounded-full items-center justify-center mb-4">
          <Text className="text-2xl">⚠️</Text>
        </View>
        <Text className="text-red-600 text-center mb-6 text-lg font-medium">{error}</Text>
        <TouchableOpacity
          onPress={handleRefresh}
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.2,
            shadowRadius: 8,
            elevation: 5,
          }}
        >
          <LinearGradient
            colors={['#60a5fa', '#a78bfa']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              borderRadius: 16,
              paddingHorizontal: 24,
              paddingVertical: 12,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ color: '#ffffff', fontWeight: 'bold', fontSize: 16, textAlign: 'center' }}>
              Try Again
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-blue-50">
      {/* Header */}
      <View className="bg-white px-6 py-4 border-b border-gray-100 shadow-sm" style={{ paddingTop: 50 }}>
        <View className="flex-row justify-between items-center">
          <View className="flex-row items-center flex-1">
            <TouchableOpacity
              className="bg-gray-100 rounded-2xl w-12 h-12 items-center justify-center mr-4"
              onPress={() => navigation.navigate('Home')}
              style={{
                backgroundColor: '#f3f4f6',
                borderRadius: 16,
                width: 48,
                height: 48,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Text className="text-gray-700 text-lg font-bold" style={{ fontSize: 18 }}>←</Text>
            </TouchableOpacity>
            <View className="flex-1">
              <Text className="text-2xl font-bold text-blue-600">
                Circle Updates
              </Text>
              <Text className="text-gray-600 text-base" style={{ marginTop: 4 }}>
                {updates.length} update{updates.length !== 1 ? 's' : ''}
              </Text>
            </View>
          </View>
          <View className="flex-row" style={{ gap: 8 }}>
            <TouchableOpacity
              style={{
                backgroundColor: '#374151',
                borderRadius: 12,
                width: 44,
                height: 44,
                justifyContent: 'center',
                alignItems: 'center',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 3,
              }}
              onPress={handleManageMembers}
            >
              <Text className="text-white" style={{ fontSize: 20 }}>⚙️</Text>
              {pendingCount > 0 && (
                <View style={{
                  position: 'absolute',
                  top: -4,
                  right: -4,
                  backgroundColor: '#ef4444',
                  borderRadius: 9999,
                  width: 16,
                  height: 16,
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderWidth: 2,
                  borderColor: '#374151',
                }}>
                  <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>{pendingCount > 9 ? '9+' : pendingCount}</Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                backgroundColor: '#10b981',
                borderRadius: 12,
                width: 44,
                height: 44,
                justifyContent: 'center',
                alignItems: 'center',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 3,
              }}
              onPress={handleInviteMembers}
            >
              <Text className="text-white" style={{ fontSize: 20 }}>👥</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                backgroundColor: '#ffffff',
                borderWidth: 2,
                borderColor: '#3b82f6',
                borderRadius: 12,
                width: 44,
                height: 44,
                justifyContent: 'center',
                alignItems: 'center',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 3,
              }}
              onPress={handleCreateUpdate}
            >
              <Text className="text-blue-600" style={{ fontSize: 24, fontWeight: 'bold' }}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Offline Indicator */}
      <OfflineIndicator />

      {/* Updates List */}
      {updates.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={updates}
          renderItem={renderUpdate}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
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

export default CircleFeedScreen;