// Create Circle screen for setting up new care circles
import React, { useState, useEffect } from 'react';
import { View, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types';
import { createCircleSchema } from '../validation/schemas';
import { useCircles } from '../lib/useCircles';
import { useAuth } from '../lib/authContext';
import { useSubscription } from '../hooks/useSubscription';
import { initializeNotifications } from '../lib/notificationService';
import { getUser } from '../lib/firestoreUtils';
// Import async canCreateCircle that fetches fresh subscription data
import { canCreateCircle as canCreateCircleAsync } from '../lib/subscriptionService';
import SafeText from '../components/SafeText';

type CreateCircleScreenNavigationProp = StackNavigationProp<RootStackParamList, 'CreateCircle'>;

const CreateCircleScreen: React.FC = () => {
  const navigation = useNavigation<CreateCircleScreenNavigationProp>();
  const { createNewCircle, circles } = useCircles();
  const { user } = useAuth();
  const { canCreateCircle, FREE_CIRCLE_LIMIT, refreshSubscription, subscriptionStatus } = useSubscription();
  const [title, setTitle] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Refresh subscription status when screen comes into focus (e.g., after purchase)
  useFocusEffect(
    React.useCallback(() => {
      refreshSubscription();
    }, [refreshSubscription])
  );
  
  // Check if user has reached circle limit based on total circles ever created
  // This prevents users from gaming the system by deleting and recreating circles
  // Premium users should never see the limit message
  // IMPORTANT: Always check the latest subscription status, not cached values
  const totalCirclesCreated = user?.totalCirclesCreated || 0;
  const isPremium = subscriptionStatus.isPremium;
  // Double-check: premium users can always create circles
  const hasReachedLimit = isPremium ? false : !canCreateCircle(totalCirclesCreated);

  const handleCreateCircle = async () => {
    try {
      if (!user) {
        Alert.alert('Error', 'You must be logged in to create a circle.');
        return;
      }

      // Refresh subscription status before checking limit
      await refreshSubscription();
      
      // CRITICAL: Fetch fresh user data directly from Firestore to get the latest totalCirclesCreated
      // The user object in state might be stale after creating a circle
      const freshUserData = await getUser(user.id);
      const currentTotal = freshUserData?.totalCirclesCreated || 0;
      
      // CRITICAL: Use the async canCreateCircleAsync that fetches FRESH subscription data
      // This avoids stale closure issues with React hook state
      // The hook's subscriptionStatus.isPremium may be stale even after refreshSubscription()
      // because React state updates are asynchronous and batched
      const canCreate = await canCreateCircleAsync(currentTotal);
      
      // Check if user has reached limit before attempting creation
      if (!canCreate) {
        Alert.alert(
          'Circle Limit Reached',
          `You've reached the free limit of ${FREE_CIRCLE_LIMIT} circle${FREE_CIRCLE_LIMIT > 1 ? 's' : ''}. Upgrade to Premium to create unlimited circles!`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Upgrade to Premium',
              onPress: () => navigation.navigate('Paywall'),
            },
          ]
        );
        return;
      }

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
        if (error.message === 'CIRCLE_LIMIT_REACHED') {
          Alert.alert(
            'Circle Limit Reached',
            `You've reached the free limit of ${FREE_CIRCLE_LIMIT} circle${FREE_CIRCLE_LIMIT > 1 ? 's' : ''}. Upgrade to Premium to create unlimited circles!`,
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Upgrade to Premium',
                onPress: () => navigation.navigate('Paywall'),
              },
            ]
          );
        } else {
          Alert.alert('Error', error.message);
        }
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
              <SafeText style={{ color: '#374151', fontSize: 18, fontWeight: 'bold' }}>←</SafeText>
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <SafeText style={{ fontSize: 22, marginTop: 20, fontWeight: 'bold', color: '#1f2937' }}>Create New Circle</SafeText>
              <SafeText style={{ color: '#6b7280', marginTop: 4, fontSize: 15 }}>
                Set up a private space to share updates with your loved ones
              </SafeText>
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
              <SafeText style={{ fontSize: 20, fontWeight: 'bold', color: '#1f2937', marginBottom: 12 }}>
                Circle Name
              </SafeText>
              <SafeText style={{ color: '#6b7280', marginBottom: 24, fontSize: 15, lineHeight: 22 }}>
                Choose a meaningful name for your circle (e.g., "Dad's Recovery", "Mom's Health Updates")
              </SafeText>
              
              <View style={{ backgroundColor: '#f9fafb', borderRadius: 16, borderWidth: 1, borderColor: '#f3f4f6' }}>
                <TextInput
                  style={{ paddingHorizontal: 20, paddingVertical: 16, color: '#1f2937', fontSize: 19 }}
                  placeholder="Enter circle name"
                  placeholderTextColor="#9CA3AF"
                  value={title}
                  onChangeText={setTitle}
                  maxLength={100}
                  autoFocus
                  allowFontScaling={false}
                  maxFontSizeMultiplier={1.0}
                />
              </View>
              
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
                <SafeText style={{ color: '#6b7280', fontSize: 13 }}>
                  {title.length}/100 characters
                </SafeText>
                {title.length > 80 && (
                  <SafeText style={{ color: '#f97316', fontSize: 13, fontWeight: '600' }}>
                    Getting close to limit
                  </SafeText>
                )}
              </View>
            </View>

            <View style={{ gap: 16 }}>
              {hasReachedLimit ? (
                <View style={{ gap: 12 }}>
                  <View style={{
                    backgroundColor: '#fef3c7',
                    borderRadius: 16,
                    padding: 16,
                    borderWidth: 1,
                    borderColor: '#fcd34d',
                  }}>
                    <SafeText style={{ color: '#92400e', fontSize: 15, textAlign: 'center', marginBottom: 8 }}>
                      You've reached the free limit of {FREE_CIRCLE_LIMIT} circle{FREE_CIRCLE_LIMIT > 1 ? 's' : ''}
                    </SafeText>
                    <SafeText style={{ color: '#92400e', fontSize: 14, textAlign: 'center' }}>
                      Upgrade to Premium to create unlimited circles!
                    </SafeText>
                  </View>
                  <TouchableOpacity
                    onPress={() => navigation.navigate('Paywall')}
                    style={{
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.2,
                      shadowRadius: 8,
                      elevation: 5,
                    }}
                  >
                    <LinearGradient
                      colors={['#60a5fa', '#a78bfa']}
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
                      <SafeText style={{ color: '#ffffff', textAlign: 'center', fontWeight: 'bold', fontSize: 16 }}>
                        Upgrade to Premium
                      </SafeText>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              ) : (
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
                    <SafeText style={{ color: '#ffffff', textAlign: 'center', fontWeight: 'bold', fontSize: 16 }}>
                      {isLoading ? 'Creating Circle...' : 'Create Circle'}
                    </SafeText>
                  </LinearGradient>
                </TouchableOpacity>
              )}

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
                <SafeText style={{ color: '#374151', textAlign: 'center', fontWeight: '600', fontSize: 15 }}>
                  Cancel
                </SafeText>
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
                <SafeText style={{ color: '#ffffff', fontSize: 16 }}>💡</SafeText>
              </LinearGradient>
              <SafeText style={{ color: '#1e40af', fontWeight: 'bold', fontSize: 16 }}>Tips for a great circle name:</SafeText>
            </View>
            <View style={{ gap: 8 }}>
              <SafeText style={{ color: '#1e3a8a', fontSize: 13, lineHeight: 20 }}>
                • Use the person's name or relationship (e.g., "Mom's Recovery")
              </SafeText>
              <SafeText style={{ color: '#1e3a8a', fontSize: 13, lineHeight: 20 }}>
                • Be specific about the purpose (e.g., "Dad's Health Updates")
              </SafeText>
              <SafeText style={{ color: '#1e3a8a', fontSize: 13, lineHeight: 20 }}>
                • Keep it simple and clear for all family members
              </SafeText>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default CreateCircleScreen;
