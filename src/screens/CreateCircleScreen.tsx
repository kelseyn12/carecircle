// Create Circle screen for setting up new care circles
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types';
import { createCircleSchema } from '../validation/schemas';
import { useCircles } from '../lib/useCircles';

type CreateCircleScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'CreateCircle'>;

const CreateCircleScreen: React.FC = () => {
  const navigation = useNavigation<CreateCircleScreenNavigationProp>();
  const { createNewCircle } = useCircles();
  const [title, setTitle] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateCircle = async () => {
    try {
      // Validate form data
      const validatedData = createCircleSchema.parse({ title });
      
      setIsLoading(true);
      
      // Create circle in Firestore
      const circleId = await createNewCircle(validatedData.title);
      
      Alert.alert(
        'Circle Created!',
        'Your circle has been created. You can now invite family and friends.',
        [
          {
            text: 'Invite People',
            onPress: () => {
              navigation.navigate('Invite', { circleId });
            },
          },
          {
            text: 'View Circle',
            onPress: () => {
              navigation.navigate('CircleFeed', { circleId });
            },
          },
        ]
      );
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert('Error', error.message);
      } else {
        Alert.alert('Error', 'Failed to create circle. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      className="flex-1 bg-gray-50" 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        className="flex-1" 
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
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
                autoFocus
              />
              <Text className="text-gray-500 text-sm mt-2">
                {title.length}/100 characters
              </Text>
            </View>

            <View className="space-y-4">
              <TouchableOpacity
                className={`rounded-xl py-4 ${
                  isLoading || !title.trim() 
                    ? 'bg-gray-300' 
                    : 'bg-blue-500'
                }`}
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

          {/* Helpful tips */}
          <View className="mt-6 bg-blue-50 rounded-xl p-4">
            <Text className="text-blue-800 font-semibold mb-2">💡 Tips for a great circle name:</Text>
            <Text className="text-blue-700 text-sm">
              • Use the person's name or relationship (e.g., "Mom's Recovery"){'\n'}
              • Be specific about the purpose (e.g., "Dad's Health Updates"){'\n'}
              • Keep it simple and clear for all family members
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default CreateCircleScreen;
