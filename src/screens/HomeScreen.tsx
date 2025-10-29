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
import SafeText from '../components/SafeText';

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
      <View className="w-32 h-32 bg-blue-500 rounded-full items-center justify-center mb-8 shadow-xl">
        <Text className="text-6xl">{EMOJIS.BLUE_HEART}</Text>
      </View>
      <Text className="text-2xl font-bold text-gray-800 mb-3 text-center">
        Welcome to Care Circle
      </Text>
      <Text className="text-gray-600 text-center mb-8 leading-relaxed text-base">
        Create your first circle to start sharing updates with family and friends. 
        Stay connected with those who matter most.
      </Text>
      <View className="w-full gap-3">
        <TouchableOpacity
          className="bg-blue-500 rounded-2xl px-8 py-4 shadow-lg items-center"
          onPress={handleCreateCircle}
        >
          <Text className="text-white font-bold text-lg">Create Your First Circle</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          className="bg-gray-200 rounded-2xl px-8 py-4 items-center"
          onPress={() => setShowJoinModal(true)}
        >
          <Text className="text-gray-700 font-semibold text-lg">Join Existing Circle</Text>
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
      <View className="flex-1 justify-center items-center bg-blue-50">
        <View className="w-16 h-16 bg-blue-500 rounded-full items-center justify-center mb-4">
          <Text className="text-2xl">{EMOJIS.BLUE_HEART}</Text>
        </View>
        <Text className="text-gray-600 text-lg font-medium">Loading circles...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 justify-center items-center bg-blue-50 px-6">
        <View className="w-16 h-16 bg-red-100 rounded-full items-center justify-center mb-4">
          <Text className="text-2xl">{EMOJIS.WARNING}</Text>
        </View>
        <Text className="text-red-600 text-center mb-6 text-lg font-medium">{error}</Text>
        <TouchableOpacity
          className="bg-blue-500 rounded-2xl px-6 py-3 shadow-lg items-center"
          onPress={handleRefresh}
        >
          <Text className="text-white font-bold text-base">Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-blue-50">
      {/* Join Circle Modal */}
      <Modal
        visible={showJoinModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowJoinModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-center px-5">
          <View className="bg-white rounded-3xl p-6">
            <Text className="text-2xl font-bold mb-2">Join Circle</Text>
            <Text className="text-gray-600 text-base mb-5">
              Enter your invite link to join a Care Circle.
            </Text>
            
            <TextInput
              className="border border-gray-300 rounded-xl px-4 py-3 text-gray-800 text-base mb-4 bg-gray-50"
              placeholder="https://care-circle-15fd5.web.app/inviteRedirect/..."
              value={inviteInput}
              onChangeText={setInviteInput}
              autoCapitalize="none"
              autoCorrect={false}
              multiline
            />
            
            <View className="flex-row gap-3">
              <TouchableOpacity
                className="flex-1 bg-gray-500 rounded-xl py-3.5 items-center"
                onPress={() => {
                  setShowJoinModal(false);
                  setInviteInput('');
                }}
              >
                <Text className="text-white font-semibold text-base">Back</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                className="flex-1 bg-blue-500 rounded-xl py-3.5 items-center"
                onPress={handleJoinByInvite}
              >
                <Text className="text-white font-semibold text-base">Join</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Header */}
      <View className="bg-white px-6 pt-12 pb-4 border-b border-gray-100 shadow-sm">
        <View className="flex-row justify-between items-center">
          <View className="flex-1">
            <SafeText className="text-3xl font-bold text-blue-600 mt-5" maxFontSizeMultiplier={1.2}>
              My Circles
            </SafeText>
            <SafeText className="text-gray-600 text-base mt-1" maxFontSizeMultiplier={1.3}>
              Welcome, {user?.displayName || 'User'} {EMOJIS.BLUE_HEART}
            </SafeText>
          </View>
          <View className="flex-row gap-2 mt-5 flex-shrink-0">
            <TouchableOpacity
              className="bg-blue-100 rounded-xl w-12 h-12 justify-center items-center shadow-sm"
              onPress={() => setShowJoinModal(true)}
            >
              <SafeText className="text-base" maxFontSizeMultiplier={1.1}>👥</SafeText>
            </TouchableOpacity>
            <TouchableOpacity
              className="bg-emerald-100 rounded-xl w-12 h-12 justify-center items-center shadow-sm"
              onPress={handleCreateCircle}
            >
              <SafeText className="text-base font-bold" maxFontSizeMultiplier={1.1}>+</SafeText>
            </TouchableOpacity>
            <TouchableOpacity
              className="bg-purple-100 rounded-xl w-12 h-12 justify-center items-center shadow-sm"
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
            >
              <SafeText className="text-base" maxFontSizeMultiplier={1.1}>🔔</SafeText>
            </TouchableOpacity>
            <TouchableOpacity
              className="bg-gray-200 rounded-xl w-12 h-12 justify-center items-center shadow-sm"
              onPress={handleSignOut}
            >
              <SafeText className="text-base" maxFontSizeMultiplier={1.1}>🚪</SafeText>
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
          contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 16 }}
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