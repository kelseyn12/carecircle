// Create Circle screen for setting up new care circles
// TODO: Implement Firestore document creation
// TODO: Add form validation with Zod schemas
// TODO: Add loading states and error handling
// TODO: Navigate to invite screen after creation

import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types';
import { createCircleSchema } from '../validation/schemas';

type CreateCircleScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'CreateCircle'>;

const CreateCircleScreen: React.FC = () => {
  const navigation = useNavigation<CreateCircleScreenNavigationProp>();
  const [title, setTitle] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // TODO: Implement Firestore document creation
  const handleCreateCircle = async () => {
    try {
      // Validate form data
      const validatedData = createCircleSchema.parse({ title });
      
      setIsLoading(true);
      
      // TODO: Add Firestore document creation logic
      console.log('Creating circle:', validatedData);
      
      // TODO: Create circle document in Firestore
      // TODO: Add current user as owner and first member
      // TODO: Navigate to invite screen
      
      Alert.alert(
        'Circle Created!',
        'Your circle has been created. You can now invite family and friends.',
        [
          {
            text: 'Invite People',
            onPress: () => {
              // TODO: Navigate to invite screen with circleId
              navigation.navigate('Home');
            },
          },
        ]
      );
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert('Validation Error', error.message);
      } else {
        Alert.alert('Error', 'Failed to create circle. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-gray-50">
      <View className="bg-white px-6 py-4 border-b border-gray-200">
        <Text className="text-xl font-semibold text-gray-800">Create New Circle</Text>
        <Text className="text-gray-600 mt-1">
          Set up a private space to share updates with your loved ones
        </Text>
      </View>

      <View className="flex-1 px-6 py-6">
        <View className="bg-white rounded-2xl p-6 shadow-sm">
          <View className="mb-6">
            <Text className="text-lg font-semibold text-gray-800 mb-2">
              Circle Name
            </Text>
            <Text className="text-gray-600 mb-4">
              Choose a meaningful name for your circle (e.g., "Dad's Recovery", "Mom's Health Updates")
            </Text>
            <TextInput
              className="border border-gray-300 rounded-xl px-4 py-3 text-gray-800 text-lg"
              placeholder="Enter circle name"
              value={title}
              onChangeText={setTitle}
              maxLength={100}
            />
            <Text className="text-gray-500 text-sm mt-2">
              {title.length}/100 characters
            </Text>
          </View>

          <View className="space-y-4">
            <TouchableOpacity
              className="bg-blue-500 rounded-xl py-4"
              onPress={handleCreateCircle}
              disabled={isLoading || !title.trim()}
            >
              <Text className="text-white text-center font-semibold text-lg">
                {isLoading ? 'Creating Circle...' : 'Create Circle'}
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
        </View>

        {/* TODO: Add helpful tips or examples */}
        <View className="mt-6 bg-blue-50 rounded-xl p-4">
          <Text className="text-blue-800 font-semibold mb-2">💡 Tips for a great circle name:</Text>
          <Text className="text-blue-700 text-sm">
            • Use the person's name or relationship (e.g., "Mom's Recovery"){'\n'}
            • Be specific about the purpose (e.g., "Dad's Health Updates"){'\n'}
            • Keep it simple and clear for all family members
          </Text>
        </View>
      </View>
    </View>
  );
};

export default CreateCircleScreen;
