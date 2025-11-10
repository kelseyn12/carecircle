// Join screen for accepting circle invites (Hermes-safe)
import React, { useState, useEffect } from 'react';
import { 
  View, 
  TouchableOpacity, 
  Alert, 
  ActivityIndicator,
  ScrollView
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types';
import { useAuth } from '../lib/authContext';
import { httpsCallable, type HttpsCallable, type HttpsCallableResult } from 'firebase/functions';
import { functions } from '../lib/firebase';
import SafeText from '../components/SafeText';

// ✅ Hermes detection utility
const isHermesEnabled = (): boolean => {
  try {
    const globalAny = global as any;
    return typeof globalAny.HermesInternal !== 'undefined';
  } catch {
    return false;
  }
};

// ✅ Production-safe callable creation
const createSafeCallable = <RequestData = any, ResponseData = any>(
  functionsInstance: any,
  functionName: string
): HttpsCallable<RequestData, ResponseData> | null => {
  if (!functionsInstance || typeof httpsCallable !== 'function') {
    console.error('[createSafeCallable] Invalid Firebase setup:', {
      hasFunctions: !!functionsInstance,
      hasCallable: typeof httpsCallable === 'function',
    });
    return null;
  }

  try {
    const callable = httpsCallable<RequestData, ResponseData>(functionsInstance, functionName);
    if (typeof callable !== 'function') {
      console.error('[createSafeCallable] Callable is not a function:', typeof callable);
      return null;
    }

    console.log('[createSafeCallable] Created callable for', functionName, 'Hermes:', isHermesEnabled());
    return callable;
  } catch (error: any) {
    console.error('[createSafeCallable] Failed to create callable:', {
      error: error.message,
      stack: error.stack,
      hermesEnabled: isHermesEnabled(),
    });
    return null;
  }
};

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

  // ✅ Safely create callable before async usage
  const acceptInviteCallable = createSafeCallable<{ inviteId: string }, { 
    title: string;
    circleId: string;
    alreadyMember: boolean;
  }>(functions, 'acceptInvite');

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

      if (!acceptInviteCallable) {
        throw new Error('Firebase functions not available');
      }

      let result: HttpsCallableResult<{
        title: string;
        circleId: string;
        alreadyMember: boolean;
      }>;

      try {
        result = await acceptInviteCallable({ inviteId });
      } catch (callError: any) {
        console.error('[handleAcceptInvite] Callable execution error:', callError);
        throw callError;
      }

      if (!result?.data) {
        throw new Error('Invalid response from server');
      }

      const data = result.data;

      if (!data.circleId || !data.title) {
        throw new Error('Server response missing required fields');
      }

      // Optional: fetch encryption key after join
      if (data.circleId && !data.alreadyMember) {
        try {
          const { getCircleEncryptionKey } = await import('../lib/encryption');
          await getCircleEncryptionKey(data.circleId);
        } catch (keyError) {
          console.warn('Error fetching encryption key:', keyError);
        }
      }

      setCircleInfo({
        title: data.title,
        circleId: data.circleId,
        alreadyMember: data.alreadyMember,
      });
    } catch (error: any) {
      console.error('[handleAcceptInvite] Error accepting invite:', {
        message: error.message,
        code: error.code,
        stack: error.stack,
        hermesEnabled: isHermesEnabled(),
      });

      let errorMessage = 'Failed to join circle. Please try again.';
      if (error.code === 'functions/not-found') {
        errorMessage = 'Invite not found or has expired.';
      } else if (error.code === 'functions/deadline-exceeded') {
        errorMessage = 'This invite has expired. Please request a new one.';
      } else if (error.message?.includes('minification')) {
        errorMessage = 'A build configuration issue occurred. Please contact support.';
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
      navigation.navigate('CircleFeed', { circleId: circleInfo.circleId });
    } else {
      Alert.alert(
        'Join Circle',
        `By joining "${circleInfo.title}", you'll be able to see updates shared within this circle. Do you want to join?`,
        [
          { text: 'Cancel', style: 'cancel', onPress: () => navigation.navigate('Home') },
          {
            text: 'Join',
            onPress: () => navigation.navigate('CircleFeed', { circleId: circleInfo.circleId }),
          },
        ]
      );
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#3b82f6" />
        <SafeText className="text-gray-600 mt-4">Joining circle...</SafeText>
      </View>
    );
  }

  if (!circleInfo) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50 px-6">
        <SafeText className="text-red-600 text-center mb-4">Failed to load circle information</SafeText>
        <TouchableOpacity
          className="bg-blue-500 rounded-xl px-6 py-3"
          onPress={() => navigation.navigate('Home')}
        >
          <SafeText className="text-white font-semibold">Go Home</SafeText>
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
            <SafeText className="text-gray-700 font-semibold">Back</SafeText>
          </TouchableOpacity>

          <SafeText className="text-xl font-semibold text-gray-800">
            {circleInfo.alreadyMember ? 'Welcome Back!' : 'Join Circle'}
          </SafeText>

          <View className="w-16" />
        </View>
      </View>

      <View className="flex-1 px-6 py-6">
        <View className="bg-white rounded-2xl p-6 shadow-sm">
          <View className="items-center mb-6">
            <SafeText className="text-6xl mb-4">👥</SafeText>
            <SafeText className="text-2xl font-semibold text-gray-800 mb-2">
              {circleInfo.title}
            </SafeText>
            <SafeText className="text-gray-600 text-center">
              {circleInfo.alreadyMember
                ? "You're already a member of this circle!"
                : "You've been invited to join this CareCircle Connect circle"}
            </SafeText>
          </View>

          {!circleInfo.alreadyMember && (
            <View className="mb-6">
              <SafeText className="text-lg font-semibold text-gray-800 mb-3">
                What you'll be able to do:
              </SafeText>
              <View className="space-y-2">
                {[
                  'See updates shared by circle members',
                  'Post your own updates and photos',
                  'React to updates with emojis',
                  'Receive push notifications for new updates',
                ].map((text, i) => (
                  <View key={i} className="flex-row items-center">
                    <SafeText className="text-green-600 text-lg mr-3">✓</SafeText>
                    <SafeText className="text-gray-700">{text}</SafeText>
                  </View>
                ))}
              </View>
            </View>
          )}

          <TouchableOpacity
            className={`rounded-xl py-4 ${isJoining ? 'bg-gray-300' : 'bg-blue-500'}`}
            onPress={handleJoinCircle}
            disabled={isJoining}
          >
            {isJoining ? (
              <View className="flex-row items-center justify-center">
                <ActivityIndicator color="white" size="small" />
                <SafeText className="text-white font-semibold ml-2">Joining...</SafeText>
              </View>
            ) : (
              <SafeText className="text-white text-center font-semibold text-lg">
                {circleInfo.alreadyMember ? 'View Circle' : 'Join Circle'}
              </SafeText>
            )}
          </TouchableOpacity>

          {/* Privacy notice */}
          <View className="mt-6 bg-blue-50 rounded-xl p-4">
            <SafeText className="text-blue-800 font-semibold mb-2">🔒 Privacy & Security</SafeText>
            <SafeText className="text-blue-700 text-sm">
              • Only circle members can see updates{'\n'}
              • Your personal information is protected{'\n'}
              • You can leave the circle anytime{'\n'}
              • Updates are not shared publicly
            </SafeText>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

// 🧠 Prevent Hermes minifier renaming
JoinScreen.displayName = 'JoinScreen';
Object.defineProperty(JoinScreen, 'name', { value: 'JoinScreen' });

export default JoinScreen;
