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
      className="flex-1 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50" 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        className="flex-1" 
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="bg-white px-6 py-6 border-b border-gray-100 shadow-sm">
          <View className="flex-row items-center justify-between mb-4">
            <TouchableOpacity
              className="bg-gray-100 rounded-2xl w-12 h-12 items-center justify-center mr-4 mt-4"
              onPress={() => navigation.navigate('Home')}
            >
              <Text className="text-gray-700 text-lg font-bold">←</Text>
            </TouchableOpacity>
            <View className="flex-1">
              <Text className="text-2xl font-bold text-gray-800">Create New Circle</Text>
              <Text className="text-gray-600 mt-1 text-base">
                Set up a private space to share updates with your loved ones
              </Text>
            </View>
          </View>
        </View>

        <View className="flex-1 px-6 py-6">
          <View className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100">
            <View className="mb-8">
              <Text className="text-xl font-bold text-gray-800 mb-3">
                Circle Name
              </Text>
              <Text className="text-gray-600 mb-6 text-base leading-relaxed">
                Choose a meaningful name for your circle (e.g., "Dad's Recovery", "Mom's Health Updates")
              </Text>
              
              <View className="bg-gray-50 rounded-2xl border border-gray-100">
                <TextInput
                  className="px-5 py-4 text-gray-800 text-lg"
                  placeholder="Enter circle name"
                  placeholderTextColor="#9CA3AF"
                  value={title}
                  onChangeText={setTitle}
                  maxLength={100}
                  autoFocus
                />
              </View>
              
              <View className="flex-row justify-between items-center mt-3">
                <Text className="text-gray-500 text-sm">
                  {title.length}/100 characters
                </Text>
                {title.length > 80 && (
                  <Text className="text-orange-500 text-sm font-medium">
                    Getting close to limit
                  </Text>
                )}
              </View>
            </View>

            <View className="space-y-4">
              <TouchableOpacity
                className={`rounded-2xl py-5 shadow-lg ${
                  isLoading || !title.trim() 
                    ? 'bg-gray-300' 
                    : 'bg-gradient-to-r from-blue-500 to-blue-600'
                }`}
                onPress={handleCreateCircle}
                disabled={isLoading || !title.trim()}
                style={{ opacity: isLoading || !title.trim() ? 0.7 : 1 }}
              >
                <Text className="text-white text-center font-bold text-lg">
                  {isLoading ? 'Creating Circle...' : 'Create Circle'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="bg-gray-100 rounded-2xl py-4"
                onPress={() => navigation.goBack()}
                disabled={isLoading}
                style={{ opacity: isLoading ? 0.7 : 1 }}
              >
                <Text className="text-gray-700 text-center font-semibold text-base">
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Helpful tips */}
          <View className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-3xl p-6 border border-blue-100">
            <View className="flex-row items-center mb-4">
              <View className="w-8 h-8 bg-blue-500 rounded-full items-center justify-center mr-3">
                <Text className="text-white text-sm">💡</Text>
              </View>
              <Text className="text-blue-800 font-bold text-lg">Tips for a great circle name:</Text>
            </View>
            <View className="space-y-2">
              <Text className="text-blue-700 text-sm leading-relaxed">
                • Use the person's name or relationship (e.g., "Mom's Recovery")
              </Text>
              <Text className="text-blue-700 text-sm leading-relaxed">
                • Be specific about the purpose (e.g., "Dad's Health Updates")
              </Text>
              <Text className="text-blue-700 text-sm leading-relaxed">
                • Keep it simple and clear for all family members
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default CreateCircleScreen;
