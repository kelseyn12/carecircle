// New Update screen for sharing updates in a circle
// TODO: Implement Firestore document creation for updates
// TODO: Add image picker and upload functionality
// TODO: Add form validation with Zod schemas
// TODO: Add loading states and error handling
// TODO: Strip EXIF data from photos before upload

import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types';
import { createUpdateSchema } from '../validation/schemas';

type NewUpdateScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'NewUpdate'>;
type NewUpdateScreenRouteProp = RouteProp<RootStackParamList, 'NewUpdate'>;

const NewUpdateScreen: React.FC = () => {
  const navigation = useNavigation<NewUpdateScreenNavigationProp>();
  const route = useRoute<NewUpdateScreenRouteProp>();
  const { circleId } = route.params;

  const [text, setText] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // TODO: Implement image picker functionality
  const handlePickImage = async () => {
    try {
      // TODO: Add Expo ImagePicker logic
      // TODO: Strip EXIF data with ImageManipulator
      console.log('Picking image...');
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  // TODO: Implement Firestore document creation
  const handleShareUpdate = async () => {
    try {
      // Validate form data
      const validatedData = createUpdateSchema.parse({ 
        text, 
        photoURL: photo || undefined 
      });
      
      setIsLoading(true);
      
      // TODO: Add Firestore document creation logic
      console.log('Sharing update:', validatedData);
      
      // TODO: Create update document in Firestore
      // TODO: Upload photo to Firebase Storage if present
      // TODO: Trigger Cloud Function for push notifications
      
      Alert.alert(
        'Update Shared!',
        'Your update has been shared with the circle.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert('Validation Error', error.message);
      } else {
        Alert.alert('Error', 'Failed to share update. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-gray-50">
      <View className="bg-white px-6 py-4 border-b border-gray-200">
        <Text className="text-xl font-semibold text-gray-800">Share Update</Text>
        <Text className="text-gray-600 mt-1">
          Keep your circle informed with a personal update
        </Text>
      </View>

      <ScrollView className="flex-1 px-6 py-6">
        <View className="bg-white rounded-2xl p-6 shadow-sm">
          <View className="mb-6">
            <Text className="text-lg font-semibold text-gray-800 mb-2">
              What's happening?
            </Text>
            <TextInput
              className="border border-gray-300 rounded-xl px-4 py-3 text-gray-800 text-base min-h-[120px]"
              placeholder="Share an update with your circle..."
              value={text}
              onChangeText={setText}
              multiline
              maxLength={2000}
              textAlignVertical="top"
            />
            <Text className="text-gray-500 text-sm mt-2">
              {text.length}/2000 characters
            </Text>
          </View>

          {/* Photo section */}
          <View className="mb-6">
            <Text className="text-lg font-semibold text-gray-800 mb-2">
              Add a photo (optional)
            </Text>
            
            {photo ? (
              <View className="relative">
                {/* TODO: Add Image component to display selected photo */}
                <View className="bg-gray-200 rounded-xl h-48 justify-center items-center">
                  <Text className="text-gray-500">Photo selected</Text>
                </View>
                <TouchableOpacity
                  className="absolute top-2 right-2 bg-red-500 rounded-full w-8 h-8 justify-center items-center"
                  onPress={() => setPhoto(null)}
                >
                  <Text className="text-white text-sm">×</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                className="border-2 border-dashed border-gray-300 rounded-xl h-32 justify-center items-center"
                onPress={handlePickImage}
              >
                <Text className="text-4xl mb-2">📷</Text>
                <Text className="text-gray-600 font-medium">Add Photo</Text>
                <Text className="text-gray-500 text-sm">Tap to select from gallery</Text>
              </TouchableOpacity>
            )}
          </View>

          <View className="space-y-4">
            <TouchableOpacity
              className="bg-blue-500 rounded-xl py-4"
              onPress={handleShareUpdate}
              disabled={isLoading || !text.trim()}
            >
              <Text className="text-white text-center font-semibold text-lg">
                {isLoading ? 'Sharing Update...' : 'Share Update'}
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

        {/* TODO: Add helpful tips */}
        <View className="mt-6 bg-green-50 rounded-xl p-4">
          <Text className="text-green-800 font-semibold mb-2">💡 Update Tips:</Text>
          <Text className="text-green-700 text-sm">
            • Share specific details about progress or changes{'\n'}
            • Include photos to make updates more personal{'\n'}
            • Be encouraging and supportive in your tone{'\n'}
            • Keep updates concise but informative
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

export default NewUpdateScreen;
