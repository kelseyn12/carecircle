// New update screen for creating text and photo updates
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  Alert, 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView,
  Image 
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { RootStackParamList } from '../types';
import { createUpdateSchema } from '../validation/schemas';
import { useAuth } from '../lib/authContext';
import { createUpdate, canUserPostUpdates } from '../lib/firestoreUtils';
import { uploadPhoto } from '../lib/firebase';

type NewUpdateScreenNavigationProp = StackNavigationProp<RootStackParamList, 'NewUpdate'>;
type NewUpdateScreenRouteProp = RouteProp<RootStackParamList, 'NewUpdate'>;

const NewUpdateScreen: React.FC = () => {
  const navigation = useNavigation<NewUpdateScreenNavigationProp>();
  const route = useRoute<NewUpdateScreenRouteProp>();
  const { user } = useAuth();
  const { circleId } = route.params;
  
  const [text, setText] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [canPost, setCanPost] = useState(false);

  // Check if user can post updates
  useEffect(() => {
    if (!user || !circleId) return;
    
    const checkPermissions = async () => {
      try {
        console.log('Checking permissions for circle:', circleId, 'user:', user.id);
        const canPostUpdates = await canUserPostUpdates(circleId, user.id);
        console.log('Result:', canPostUpdates);
        setCanPost(canPostUpdates);
        
        if (!canPostUpdates) {
          Alert.alert(
            'Permission Denied',
            'You don\'t have permission to post updates in this circle.',
            [{ text: 'OK', onPress: () => navigation.goBack() }]
          );
        }
      } catch (error) {
        console.error('Error checking permissions:', error);
        Alert.alert('Error', 'Failed to check permissions');
      }
    };
    
    checkPermissions();
  }, [user, circleId, navigation]);

  const handlePickImage = async () => {
    try {
      // Request permissions
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert('Permission Required', 'Please allow access to your photo library to add images.');
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        
        // Compress the image
        const compressedImage = await ImageManipulator.manipulateAsync(
          asset.uri,
          [{ resize: { width: 800 } }],
          { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
        );

        setPhoto(compressedImage.uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const handleRemovePhoto = () => {
    setPhoto(null);
  };

  const handleSubmit = async () => {
    try {
      if (!user) {
        Alert.alert('Error', 'You must be logged in to post updates.');
        return;
      }

      setIsLoading(true);
      
      let photoURL: string | undefined;
      
      // Upload photo if one was selected
      if (photo) {
        const timestamp = Date.now();
        const photoPath = `updates/${user.id}/${timestamp}.jpg`;
        photoURL = await uploadPhoto(photo, photoPath);
      }
      
      // Validate form data
      const validatedData = createUpdateSchema.parse({ 
        text, 
        photoURL 
      });
      
      // Create update in Firestore
      const updateData: any = {
        circleId,
        authorId: user.id,
        text: validatedData.text,
      };
      
      // Only include photoURL if it exists
      if (validatedData.photoURL) {
        updateData.photoURL = validatedData.photoURL;
      }
      
      await createUpdate(updateData);
      
      Alert.alert(
        'Update Posted!',
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
        Alert.alert('Error', error.message);
      } else {
        Alert.alert('Error', 'Failed to post update. Please try again.');
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
        {/* Header */}
        <View className="bg-white px-6 py-6 border-b border-gray-200">
          <View className="flex-row justify-between items-center">
            <TouchableOpacity
              className="bg-gray-100 rounded-xl px-4 py-3 mt-2"
              onPress={() => navigation.navigate('CircleFeed', { circleId })}
              disabled={isLoading}
            >
              <Text className="text-gray-700 font-semibold">Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              className={`rounded-xl px-4 py-2 ${
                isLoading || !text.trim() || !canPost
                  ? 'bg-gray-300' 
                  : 'bg-blue-500'
              }`}
              onPress={handleSubmit}
              disabled={isLoading || !text.trim() || !canPost}
            >
              <Text className="text-white font-semibold">
                {isLoading ? 'Posting...' : 'Post'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View className="flex-1 px-6 py-6">
          <View className="bg-white rounded-2xl p-6 shadow-sm">
            {/* Text Input */}
            <View className="mb-6">
              <Text className="text-lg font-semibold text-gray-800 mb-2">
                What's happening?
              </Text>
              <TextInput
                className="border border-gray-300 rounded-xl px-4 py-3 text-gray-800 text-base min-h-[120px]"
                placeholder="Share an update with your circle..."
                value={text}
                onChangeText={setText}
                maxLength={2000}
                multiline
                textAlignVertical="top"
              />
              <Text className="text-gray-500 text-sm mt-2 text-right">
                {text.length}/2000 characters
              </Text>
            </View>

            {/* Photo Section */}
            <View className="mb-6">
              <Text className="text-lg font-semibold text-gray-800 mb-2">
                Add a photo (optional)
              </Text>
              
              {photo ? (
                <View className="relative">
                  <Image
                    source={{ uri: photo }}
                    className="w-full h-48 rounded-xl"
                    resizeMode="cover"
                  />
                  <TouchableOpacity
                    className="absolute top-2 right-2 bg-red-500 rounded-full w-8 h-8 justify-center items-center"
                    onPress={handleRemovePhoto}
                  >
                    <Text className="text-white text-lg">×</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  className="border-2 border-dashed border-gray-300 rounded-xl p-6 items-center"
                  onPress={handlePickImage}
                >
                  <Text className="text-4xl mb-2">📷</Text>
                  <Text className="text-gray-600 font-medium">Tap to add a photo</Text>
                  <Text className="text-gray-500 text-sm">Optional</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Tips */}
            <View className="bg-blue-50 rounded-xl p-4">
              <Text className="text-blue-800 font-semibold mb-2">💡 Tips for great updates:</Text>
              <Text className="text-blue-700 text-sm">
                • Share how you're feeling{'\n'}
                • Include photos of activities or progress{'\n'}
                • Keep updates positive and encouraging{'\n'}
                • Be specific about what's happening
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default NewUpdateScreen;