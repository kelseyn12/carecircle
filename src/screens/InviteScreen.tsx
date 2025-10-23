// Invite screen for inviting people to join a circle
// TODO: Implement Cloud Function to create invite links
// TODO: Add email validation and sending
// TODO: Add dynamic link generation
// TODO: Add loading states and error handling

import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types';
import { inviteSchema } from '../validation/schemas';

type InviteScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Invite'>;
type InviteScreenRouteProp = RouteProp<RootStackParamList, 'Invite'>;

const InviteScreen: React.FC = () => {
  const navigation = useNavigation<InviteScreenNavigationProp>();
  const route = useRoute<InviteScreenRouteProp>();
  const { circleId } = route.params;

  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);

  // TODO: Implement Cloud Function to create invite
  const handleCreateInvite = async () => {
    try {
      // Validate email
      const validatedData = inviteSchema.parse({ email });
      
      setIsLoading(true);
      
      // TODO: Call Cloud Function to create invite
      console.log('Creating invite for:', validatedData.email);
      
      // TODO: Generate dynamic link
      // TODO: Send email with invite link
      
      Alert.alert(
        'Invite Sent!',
        `An invitation has been sent to ${validatedData.email}`,
        [
          {
            text: 'Send Another',
            onPress: () => setEmail(''),
          },
          {
            text: 'Done',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert('Validation Error', error.message);
      } else {
        Alert.alert('Error', 'Failed to send invite. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // TODO: Implement share functionality
  const handleShareLink = () => {
    if (inviteLink) {
      // TODO: Implement native sharing
      console.log('Sharing link:', inviteLink);
    }
  };

  return (
    <View className="flex-1 bg-gray-50">
      <View className="bg-white px-6 py-4 border-b border-gray-200">
        <Text className="text-xl font-semibold text-gray-800">Invite to Circle</Text>
        <Text className="text-gray-600 mt-1">
          Send an invitation to family and friends
        </Text>
      </View>

      <ScrollView className="flex-1 px-6 py-6">
        <View className="bg-white rounded-2xl p-6 shadow-sm">
          <View className="mb-6">
            <Text className="text-lg font-semibold text-gray-800 mb-2">
              Email Address
            </Text>
            <Text className="text-gray-600 mb-4">
              Enter the email address of the person you'd like to invite
            </Text>
            <TextInput
              className="border border-gray-300 rounded-xl px-4 py-3 text-gray-800 text-lg"
              placeholder="Enter email address"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <TouchableOpacity
            className="bg-blue-500 rounded-xl py-4 mb-4"
            onPress={handleCreateInvite}
            disabled={isLoading || !email.trim()}
          >
            <Text className="text-white text-center font-semibold text-lg">
              {isLoading ? 'Sending Invite...' : 'Send Invitation'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="bg-gray-100 rounded-xl py-4"
            onPress={() => navigation.goBack()}
            disabled={isLoading}
          >
            <Text className="text-gray-700 text-center font-semibold text-lg">
              Cancel
            </Text>
          </TouchableOpacity>
        </View>

        {/* Invite link section */}
        {inviteLink && (
          <View className="mt-6 bg-green-50 rounded-xl p-4">
            <Text className="text-green-800 font-semibold mb-2">✅ Invite Link Created</Text>
            <Text className="text-green-700 text-sm mb-4">
              You can also share this link directly:
            </Text>
            <View className="bg-white rounded-lg p-3 mb-4">
              <Text className="text-gray-800 text-sm" numberOfLines={2}>
                {inviteLink}
              </Text>
            </View>
            <TouchableOpacity
              className="bg-green-500 rounded-lg py-2"
              onPress={handleShareLink}
            >
              <Text className="text-white text-center font-medium">Share Link</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Help section */}
        <View className="mt-6 bg-blue-50 rounded-xl p-4">
          <Text className="text-blue-800 font-semibold mb-2">💡 Invitation Tips:</Text>
          <Text className="text-blue-700 text-sm">
            • Only invite people you trust with personal information{'\n'}
            • Explain what the circle is for before sending{'\n'}
            • Invitees will need to create an account to join{'\n'}
            • Invitations expire after 7 days for security
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

export default InviteScreen;
