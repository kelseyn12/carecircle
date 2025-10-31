// Create Circle screen for setting up new care circles
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types';
import { createCircleSchema } from '../validation/schemas';
import { useCircles } from '../lib/useCircles';
import { useAuth } from '../lib/authContext';
import { initializeNotifications } from '../lib/notificationService';

type CreateCircleScreenNavigationProp = StackNavigationProp<RootStackParamList, 'CreateCircle'>;

const CreateCircleScreen: React.FC = () => {
  const navigation = useNavigation<CreateCircleScreenNavigationProp>();
  const { createNewCircle } = useCircles();
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateCircle = async () => {
    try {
      // Validate form data
      const validatedData = createCircleSchema.parse({ title });
      
      setIsLoading(true);
      
      // Create circle in Firestore
      const circleId = await createNewCircle(validatedData.title);
      
      // Request notification permissions contextually after creating circle
      if (user) {
        // This will show a contextual message and request permissions if not already granted
        await initializeNotifications(
          user.id,
          'Stay connected! Get notified when family members post updates in your circle.'
        );
      }
      
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
      className="flex-1 bg-blue-50" 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        className="flex-1" 
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={{ backgroundColor: '#ffffff', paddingHorizontal: 24, paddingTop: 50, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: '#f3f4f6', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity
              onPress={() => navigation.navigate('Home')}
              style={{
                backgroundColor: '#f3f4f6',
                borderRadius: 12,
                width: 44,
                height: 44,
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: 16,
              }}
            >
              <Text style={{ color: '#374151', fontSize: 18, fontWeight: 'bold' }}>←</Text>
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 22, marginTop: 20, fontWeight: 'bold', color: '#1f2937' }}>Create New Circle</Text>
              <Text style={{ color: '#6b7280', marginTop: 4, fontSize: 15 }}>
                Set up a private space to share updates with your loved ones
              </Text>
            </View>
          </View>
        </View>

        <View style={{ flex: 1, paddingHorizontal: 24, paddingVertical: 24 }}>
          <View style={{
            backgroundColor: '#ffffff',
            borderRadius: 24,
            padding: 32,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 12,
            elevation: 4,
            borderWidth: 1,
            borderColor: '#f3f4f6',
          }}>
            <View style={{ marginBottom: 32 }}>
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#1f2937', marginBottom: 12 }}>
                Circle Name
              </Text>
              <Text style={{ color: '#6b7280', marginBottom: 24, fontSize: 15, lineHeight: 22 }}>
                Choose a meaningful name for your circle (e.g., "Dad's Recovery", "Mom's Health Updates")
              </Text>
              
              <View style={{ backgroundColor: '#f9fafb', borderRadius: 16, borderWidth: 1, borderColor: '#f3f4f6' }}>
                <TextInput
                  style={{ paddingHorizontal: 20, paddingVertical: 16, color: '#1f2937', fontSize: 16 }}
                  placeholder="Enter circle name"
                  placeholderTextColor="#9CA3AF"
                  value={title}
                  onChangeText={setTitle}
                  maxLength={100}
                  autoFocus
                />
              </View>
              
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
                <Text style={{ color: '#6b7280', fontSize: 13 }}>
                  {title.length}/100 characters
                </Text>
                {title.length > 80 && (
                  <Text style={{ color: '#f97316', fontSize: 13, fontWeight: '600' }}>
                    Getting close to limit
                  </Text>
                )}
              </View>
            </View>

            <View style={{ gap: 16 }}>
              <TouchableOpacity
                onPress={handleCreateCircle}
                disabled={isLoading || !title.trim()}
                style={{
                  opacity: isLoading || !title.trim() ? 0.7 : 1,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.2,
                  shadowRadius: 8,
                  elevation: 5,
                }}
              >
                <LinearGradient
                  colors={isLoading || !title.trim() ? ['#93c5fd', '#c4b5fd'] : ['#60a5fa', '#a78bfa']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    borderRadius: 16,
                    paddingVertical: 16,
                    paddingHorizontal: 24,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ color: '#ffffff', textAlign: 'center', fontWeight: 'bold', fontSize: 16 }}>
                    {isLoading ? 'Creating Circle...' : 'Create Circle'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => navigation.goBack()}
                disabled={isLoading}
                style={{
                  backgroundColor: '#f3f4f6',
                  borderRadius: 16,
                  paddingVertical: 14,
                  paddingHorizontal: 24,
                  opacity: isLoading ? 0.7 : 1,
                }}
              >
                <Text style={{ color: '#374151', textAlign: 'center', fontWeight: '600', fontSize: 15 }}>
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Helpful tips */}
          <View style={{
            marginTop: 24,
            backgroundColor: '#eff6ff',
            borderRadius: 24,
            padding: 24,
            borderWidth: 1,
            borderColor: '#dbeafe',
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <LinearGradient
                colors={['#93c5fd', '#c4b5fd']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginRight: 12,
                }}
              >
                <Text style={{ color: '#ffffff', fontSize: 16 }}>💡</Text>
              </LinearGradient>
              <Text style={{ color: '#1e40af', fontWeight: 'bold', fontSize: 16 }}>Tips for a great circle name:</Text>
            </View>
            <View style={{ gap: 8 }}>
              <Text style={{ color: '#1e3a8a', fontSize: 13, lineHeight: 20 }}>
                • Use the person's name or relationship (e.g., "Mom's Recovery")
              </Text>
              <Text style={{ color: '#1e3a8a', fontSize: 13, lineHeight: 20 }}>
                • Be specific about the purpose (e.g., "Dad's Health Updates")
              </Text>
              <Text style={{ color: '#1e3a8a', fontSize: 13, lineHeight: 20 }}>
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
