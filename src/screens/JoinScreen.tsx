// Join screen for accepting circle invites
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Alert, 
  ActivityIndicator,
  ScrollView 
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types';
import { useAuth } from '../lib/authContext';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../lib/firebase';

type JoinScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Join'>;
type JoinScreenRouteProp = RouteProp<RootStackParamList, 'Join'>;

const JoinScreen: React.FC = () => {
  const navigation = useNavigation<JoinScreenNavigationProp>();
  const route = useRoute<JoinScreenRouteProp>();
  const { user } = useAuth();
  const { inviteId } = route.params;
  
  const [circleInfo, setCircleInfo] = useState<{
    title: string;
    circleId: string;
    alreadyMember: boolean;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);

  const acceptInvite = functions ? httpsCallable(functions, 'acceptInvite') : null;

  useEffect(() => {
    if (!user) {
      Alert.alert('Authentication Required', 'Please sign in to join a circle.');
      navigation.navigate('SignIn');
      return;
    }

    handleAcceptInvite();
  }, [user, inviteId]);

  const handleAcceptInvite = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      
      if (!acceptInvite) {
        throw new Error('Firebase functions not available');
      }
      const result = await acceptInvite({ inviteId });
      const data = result.data as any;
      
      setCircleInfo({
        title: data.title,
        circleId: data.circleId,
        alreadyMember: data.alreadyMember,
      });
    } catch (error: any) {
      console.error('Error accepting invite:', error);
      
      let errorMessage = 'Failed to join circle. Please try again.';
      
      if (error.code === 'functions/not-found') {
        errorMessage = 'Invite not found or has expired.';
      } else if (error.code === 'functions/deadline-exceeded') {
        errorMessage = 'This invite has expired. Please request a new one.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Error', errorMessage, [
        {
          text: 'OK',
          onPress: () => navigation.navigate('Home'),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinCircle = () => {
    if (!circleInfo) return;

    if (circleInfo.alreadyMember) {
      // User is already a member, just navigate to the circle
      navigation.navigate('CircleFeed', { circleId: circleInfo.circleId });
    } else {
      // Show consent screen
      Alert.alert(
        'Join Circle',
        `By joining "${circleInfo.title}", you'll be able to see updates shared within this circle. Do you want to join?`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => navigation.navigate('Home'),
          },
          {
            text: 'Join',
            onPress: () => {
              // User has already been added to the circle by the Cloud Function
              navigation.navigate('CircleFeed', { circleId: circleInfo.circleId });
            },
          },
        ]
      );
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className="text-gray-600 mt-4">Joining circle...</Text>
      </View>
    );
  }

  if (!circleInfo) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50 px-6">
        <Text className="text-red-600 text-center mb-4">Failed to load circle information</Text>
        <TouchableOpacity
          className="bg-blue-500 rounded-xl px-6 py-3"
          onPress={() => navigation.navigate('Home')}
        >
          <Text className="text-white font-semibold">Go Home</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-6 py-6 border-b border-gray-200">
        <View className="flex-row justify-between items-center">
          <TouchableOpacity
            className="bg-gray-100 rounded-xl px-4 py-3 mt-4"
            onPress={() => navigation.navigate('Home')}
          >
            <Text className="text-gray-700 font-semibold">Back</Text>
          </TouchableOpacity>
          
          <Text className="text-xl font-semibold text-gray-800">
            {circleInfo.alreadyMember ? 'Welcome Back!' : 'Join Circle'}
          </Text>
          
          <View className="w-16" />
        </View>
      </View>

      <View className="flex-1 px-6 py-6">
        <View className="bg-white rounded-2xl p-6 shadow-sm">
          <View className="items-center mb-6">
            <Text className="text-6xl mb-4">👥</Text>
            <Text className="text-2xl font-semibold text-gray-800 mb-2">
              {circleInfo.title}
            </Text>
            <Text className="text-gray-600 text-center">
              {circleInfo.alreadyMember 
                ? "You're already a member of this circle!"
                : "You've been invited to join this Care Circle"
              }
            </Text>
          </View>

          {!circleInfo.alreadyMember && (
            <View className="mb-6">
              <Text className="text-lg font-semibold text-gray-800 mb-3">
                What you'll be able to do:
              </Text>
              <View className="space-y-2">
                <View className="flex-row items-center">
                  <Text className="text-green-600 text-lg mr-3">✓</Text>
                  <Text className="text-gray-700">See updates shared by circle members</Text>
                </View>
                <View className="flex-row items-center">
                  <Text className="text-green-600 text-lg mr-3">✓</Text>
                  <Text className="text-gray-700">Post your own updates and photos</Text>
                </View>
                <View className="flex-row items-center">
                  <Text className="text-green-600 text-lg mr-3">✓</Text>
                  <Text className="text-gray-700">React to updates with emojis</Text>
                </View>
                <View className="flex-row items-center">
                  <Text className="text-green-600 text-lg mr-3">✓</Text>
                  <Text className="text-gray-700">Receive push notifications for new updates</Text>
                </View>
              </View>
            </View>
          )}

          <TouchableOpacity
            className={`rounded-xl py-4 ${
              isJoining ? 'bg-gray-300' : 'bg-blue-500'
            }`}
            onPress={handleJoinCircle}
            disabled={isJoining}
          >
            {isJoining ? (
              <View className="flex-row items-center justify-center">
                <ActivityIndicator color="white" size="small" />
                <Text className="text-white font-semibold ml-2">Joining...</Text>
              </View>
            ) : (
              <Text className="text-white text-center font-semibold text-lg">
                {circleInfo.alreadyMember ? 'View Circle' : 'Join Circle'}
              </Text>
            )}
          </TouchableOpacity>

          {/* Privacy notice */}
          <View className="mt-6 bg-blue-50 rounded-xl p-4">
            <Text className="text-blue-800 font-semibold mb-2">🔒 Privacy & Security</Text>
            <Text className="text-blue-700 text-sm">
              • Only circle members can see updates{'\n'}
              • Your personal information is protected{'\n'}
              • You can leave the circle anytime{'\n'}
              • Updates are not shared publicly
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

export default JoinScreen;