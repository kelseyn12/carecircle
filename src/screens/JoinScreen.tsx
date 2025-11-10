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
import AsyncStorage from '@react-native-async-storage/async-storage'; // ✅ Added

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

  const acceptInviteCallable = createSafeCallable<{ inviteId: string }, { 
    title: string;
    circleId: string;
    alreadyMember: boolean;
  }>(functions, 'acceptInvite');

  useEffect(() => {
    const handleFlow = async () => {
      if (!user) {
        // 🧠 Save inviteId temporarily for after login
        await AsyncStorage.setItem('pendingInviteId', inviteId);
        Alert.alert('Authentication Required', 'Please sign in to join a circle.');
        navigation.navigate('SignIn');
        return;
      }

      handleAcceptInvite();
    };

    handleFlow();
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

      result = await acceptInviteCallable({ inviteId });

      if (!result?.data) throw new Error('Invalid response from server');
      const data = result.data;

      if (!data.circleId || !data.title) throw new Error('Server response missing required fields');

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

      // ✅ Clear pending invite storage once successfully joined
      await AsyncStorage.removeItem('pendingInviteId');
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
      {/* existing UI unchanged */}
      ...
    </ScrollView>
  );
};

// 🧠 Prevent Hermes minifier renaming
JoinScreen.displayName = 'JoinScreen';
Object.defineProperty(JoinScreen, 'name', { value: 'JoinScreen' });

export default JoinScreen;

