// Join screen for accepting circle invitations
// TODO: Implement Cloud Function to validate and accept invites
// TODO: Add consent flow with clear privacy information
// TODO: Add loading states and error handling
// TODO: Navigate to circle feed after joining

import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types';

type JoinScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Join'>;
type JoinScreenRouteProp = RouteProp<RootStackParamList, 'Join'>;

const JoinScreen: React.FC = () => {
  const navigation = useNavigation<JoinScreenNavigationProp>();
  const route = useRoute<JoinScreenRouteProp>();
  const { inviteId } = route.params;

  const [isLoading, setIsLoading] = useState(true);
  const [isValidating, setIsValidating] = useState(false);
  const [inviteData, setInviteData] = useState<{
    circleTitle: string;
    inviterName: string;
    expiresAt: Date;
  } | null>(null);
  const [hasAccepted, setHasAccepted] = useState(false);

  // TODO: Implement Cloud Function to validate invite
  const validateInvite = async () => {
    try {
      setIsLoading(true);
      
      // TODO: Call Cloud Function to validate invite
      console.log('Validating invite:', inviteId);
      
      // Mock data for now
      setInviteData({
        circleTitle: 'Dad\'s Recovery',
        inviterName: 'Sarah Johnson',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      });
    } catch (error) {
      Alert.alert('Invalid Invite', 'This invitation is no longer valid or has expired.');
      navigation.navigate('SignIn');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    validateInvite();
  }, [inviteId]);

  // TODO: Implement Cloud Function to accept invite
  const handleAcceptInvite = async () => {
    try {
      setIsValidating(true);
      
      // TODO: Call Cloud Function to accept invite
      console.log('Accepting invite:', inviteId);
      
      // TODO: Add user to circle members
      // TODO: Delete invite document
      // TODO: Navigate to circle feed
      
      setHasAccepted(true);
      
      Alert.alert(
        'Welcome to the Circle!',
        'You have successfully joined the circle. You can now view and share updates.',
        [
          {
            text: 'View Circle',
            onPress: () => {
              // TODO: Navigate to circle feed
              navigation.navigate('Home');
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to join circle. Please try again.');
    } finally {
      setIsValidating(false);
    }
  };

  const handleDecline = () => {
    Alert.alert(
      'Decline Invitation',
      'Are you sure you want to decline this invitation?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: () => navigation.navigate('SignIn'),
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <Text className="text-gray-600">Validating invitation...</Text>
      </View>
    );
  }

  if (!inviteData) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50 px-6">
        <Text className="text-6xl mb-4">❌</Text>
        <Text className="text-xl font-semibold text-gray-800 mb-2">
          Invalid Invitation
        </Text>
        <Text className="text-gray-600 text-center mb-8">
          This invitation is no longer valid or has expired.
        </Text>
        <TouchableOpacity
          className="bg-blue-500 rounded-xl px-6 py-3"
          onPress={() => navigation.navigate('SignIn')}
        >
          <Text className="text-white font-semibold">Sign In</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (hasAccepted) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50 px-6">
        <Text className="text-6xl mb-4">✅</Text>
        <Text className="text-xl font-semibold text-gray-800 mb-2">
          Welcome to the Circle!
        </Text>
        <Text className="text-gray-600 text-center mb-8">
          You have successfully joined {inviteData.circleTitle}.
        </Text>
        <TouchableOpacity
          className="bg-blue-500 rounded-xl px-6 py-3"
          onPress={() => navigation.navigate('Home')}
        >
          <Text className="text-white font-semibold">View Circle</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <View className="bg-white px-6 py-4 border-b border-gray-200">
        <Text className="text-xl font-semibold text-gray-800">Join Circle</Text>
        <Text className="text-gray-600 mt-1">
          You've been invited to join a care circle
        </Text>
      </View>

      <ScrollView className="flex-1 px-6 py-6">
        <View className="bg-white rounded-2xl p-6 shadow-sm">
          <View className="text-center mb-6">
            <Text className="text-6xl mb-4">👥</Text>
            <Text className="text-2xl font-bold text-gray-800 mb-2">
              {inviteData.circleTitle}
            </Text>
            <Text className="text-gray-600">
              Invited by {inviteData.inviterName}
            </Text>
          </View>

          {/* Privacy and consent information */}
          <View className="mb-6 bg-blue-50 rounded-xl p-4">
            <Text className="text-blue-800 font-semibold mb-2">🔒 Privacy & Consent</Text>
            <Text className="text-blue-700 text-sm mb-2">
              By joining this circle, you agree to:
            </Text>
            <Text className="text-blue-700 text-sm">
              • View and share personal health/medical updates{'\n'}
              • Respect the privacy of all circle members{'\n'}
              • Only share information you're comfortable with{'\n'}
              • Keep all updates confidential within the circle
            </Text>
          </View>

          <View className="space-y-4">
            <TouchableOpacity
              className="bg-green-500 rounded-xl py-4"
              onPress={handleAcceptInvite}
              disabled={isValidating}
            >
              <Text className="text-white text-center font-semibold text-lg">
                {isValidating ? 'Joining Circle...' : 'Join Circle'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="bg-gray-100 rounded-xl py-4"
              onPress={handleDecline}
              disabled={isValidating}
            >
              <Text className="text-gray-700 text-center font-semibold text-lg">
                Decline
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Additional information */}
        <View className="mt-6 bg-yellow-50 rounded-xl p-4">
          <Text className="text-yellow-800 font-semibold mb-2">ℹ️ Important Information:</Text>
          <Text className="text-yellow-700 text-sm">
            • You can leave this circle at any time{'\n'}
            • All updates are private to circle members only{'\n'}
            • You'll receive notifications for new updates{'\n'}
            • You can mute notifications if needed
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

export default JoinScreen;
