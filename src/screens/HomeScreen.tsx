// Home screen showing user's circles
import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl, Alert, TextInput, Modal } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList, Circle } from '../types';
import CircleCard from '../components/CircleCard';
import { useAuth } from '../lib/authContext';
import { useCircles } from '../lib/useCircles';
import { EMOJIS } from '../utils/emojiUtils';
import { initializeNotifications } from '../lib/notificationService';

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { user, signOut } = useAuth();
  const { circles, loading, error, refreshCircles } = useCircles();
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [inviteInput, setInviteInput] = useState('');

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

  // Extract inviteId from full invite link or use the input directly
  const extractInviteId = (input: string): string | null => {
    const trimmed = input.trim();
    
    // If it's a full URL, extract the inviteId
    if (trimmed.includes('/inviteRedirect/')) {
      const parts = trimmed.split('/inviteRedirect/');
      if (parts.length > 1) {
        return parts[1].split('?')[0].split('#')[0]; // Remove query params and hash
      }
    }
    
    // If it looks like just an invite ID (alphanumeric, reasonable length)
    if (/^[a-zA-Z0-9_-]{15,}$/.test(trimmed)) {
      return trimmed;
    }
    
    return null;
  };

  const handleJoinByInvite = () => {
    const inviteId = extractInviteId(inviteInput);
    
    if (!inviteId) {
      Alert.alert(
        'Invalid Invite',
        'Please enter a valid invite link or invite ID.\n\nExample: https://care-circle-15fd5.web.app/inviteRedirect/ABC123...\nOr just: ABC123...'
      );
      return;
    }

    setShowJoinModal(false);
    setInviteInput('');
    navigation.navigate('Join', { inviteId });
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
      <View style={{ width: '100%', gap: 12 }}>
        <TouchableOpacity
          className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl px-8 py-4 shadow-lg"
          onPress={handleCreateCircle}
          style={{
            backgroundColor: '#3b82f6',
            borderRadius: 16,
            padding: 16,
            alignItems: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 4,
            elevation: 5,
          }}
        >
          <Text className="text-white font-bold text-lg" style={{ color: 'white', fontWeight: 'bold', fontSize: 18 }}>Create Your First Circle</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          className="bg-gray-200 rounded-2xl px-8 py-4 shadow-lg"
          onPress={() => setShowJoinModal(true)}
          style={{
            backgroundColor: '#e5e7eb',
            borderRadius: 16,
            padding: 16,
            alignItems: 'center',
          }}
        >
          <Text className="text-gray-700 font-semibold text-lg" style={{ color: '#374151', fontWeight: '600', fontSize: 18 }}>Join Existing Circle</Text>
        </TouchableOpacity>
      </View>
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
      {/* Join Circle Modal */}
      <Modal
        visible={showJoinModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowJoinModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 }}>
          <View style={{ backgroundColor: 'white', borderRadius: 20, padding: 24 }}>
            <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 8 }}>Join Circle</Text>
            <Text style={{ fontSize: 16, color: '#6b7280', marginBottom: 20 }}>
              Paste the invite link or enter the invite ID
            </Text>
            
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: '#d1d5db',
                borderRadius: 12,
                padding: 12,
                fontSize: 16,
                marginBottom: 16,
                backgroundColor: '#f9fafb',
              }}
              placeholder="https://care-circle-15fd5.web.app/inviteRedirect/..."
              value={inviteInput}
              onChangeText={setInviteInput}
              autoCapitalize="none"
              autoCorrect={false}
              multiline
            />
            
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity
                style={{
                  flex: 1,
                  backgroundColor: '#6b7280',
                  borderRadius: 12,
                  padding: 14,
                  alignItems: 'center',
                }}
                onPress={() => {
                  setShowJoinModal(false);
                  setInviteInput('');
                }}
              >
                <Text style={{ color: 'white', fontWeight: '600', fontSize: 16 }}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={{
                  flex: 1,
                  backgroundColor: '#3b82f6',
                  borderRadius: 12,
                  padding: 14,
                  alignItems: 'center',
                }}
                onPress={handleJoinByInvite}
              >
                <Text style={{ color: 'white', fontWeight: '600', fontSize: 16 }}>Join</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Header */}
      <View className="bg-white px-6 py-4 border-b border-gray-100 shadow-sm" style={{ paddingTop: 50 }}>
        <View className="flex-row justify-between items-center">
          <View className="flex-1" style={{ flex: 1 }}>
            <Text className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              My Circles
            </Text>
            <Text className="text-gray-600 text-base mt-2" style={{ marginTop: 4 }}>
              Welcome, {user?.displayName || 'User'} {EMOJIS.BLUE_HEART}
            </Text>
          </View>
          <View className="flex-row" style={{ gap: 8, flexShrink: 0 }}>
            <TouchableOpacity
              className="bg-blue-500 rounded-2xl w-12 h-12 justify-center items-center shadow-lg"
              onPress={() => setShowJoinModal(true)}
              style={{
                backgroundColor: '#3b82f6',
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
              <Text className="text-white" style={{ color: 'white', fontSize: 18 }}>👥</Text>
            </TouchableOpacity>
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
              className="bg-purple-500 rounded-2xl w-12 h-12 justify-center items-center shadow-lg"
              onPress={async () => {
                if (user) {
                  Alert.alert(
                    'Enable Notifications',
                    'This will request notification permissions for Expo Go. Make sure notifications are enabled in Settings → Expo Go → Notifications',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Enable',
                        onPress: async () => {
                          try {
                            await initializeNotifications(user.id);
                            Alert.alert('Success', 'Notifications enabled! You should receive notifications now.');
                          } catch (error) {
                            Alert.alert('Error', 'Failed to enable notifications. Please check Settings → Expo Go → Notifications');
                          }
                        },
                      },
                    ]
                  );
                }
              }}
              style={{
                backgroundColor: '#a855f7',
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
              <Text className="text-white text-lg" style={{ color: 'white', fontSize: 18 }}>🔔</Text>
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
              <Text className="text-white" style={{ color: 'white', fontSize: 18 }}>🚪</Text>
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
