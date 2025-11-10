import React, { useRef, useState } from 'react';
import { 
  View, 
  TouchableOpacity, 
  Alert, 
  Share,
  ActivityIndicator,
  TextInput,
  Text,
  Platform,
  ScrollView,
  KeyboardAvoidingView
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Clipboard from 'expo-clipboard';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types';
import { useAuth } from '../lib/authContext';
// Import httpsCallable with explicit typing to prevent minification issues
import { httpsCallable, type HttpsCallable, type HttpsCallableResult } from 'firebase/functions';
import { functions } from '../lib/firebase';
import Toast from 'react-native-root-toast';
import QRCode from 'react-native-qrcode-svg';
import SafeText from '../components/SafeText';

// Hermes detection utility for production debugging
const isHermesEnabled = (): boolean => {
  try {
    // @ts-ignore - Hermes global is not in types
    const globalAny = globalThis as any;
    const globalObj = global as any;
    return typeof globalAny.HermesInternal !== 'undefined' || 
           typeof globalObj.HermesInternal !== 'undefined';
  } catch {
    return false;
  }
};

// Production-safe callable creation with runtime validation
const createSafeCallable = <RequestData = any, ResponseData = any>(
  functionsInstance: any,
  functionName: string
): HttpsCallable<RequestData, ResponseData> | null => {
  // Runtime validation: ensure functions instance is valid
  if (!functionsInstance) {
    console.error('[createSafeCallable] Functions instance is null/undefined');
    return null;
  }

  // Runtime validation: ensure functions is an object (not a class that got minified incorrectly)
  if (typeof functionsInstance !== 'object') {
    console.error('[createSafeCallable] Functions instance is not an object:', typeof functionsInstance);
    return null;
  }

  // Runtime validation: ensure httpsCallable is a function
  if (typeof httpsCallable !== 'function') {
    console.error('[createSafeCallable] httpsCallable is not a function:', typeof httpsCallable);
    return null;
  }

  try {
    // Create callable synchronously - critical for minification safety
    const callable = httpsCallable<RequestData, ResponseData>(functionsInstance, functionName);
    
    // Runtime validation: ensure callable was created and is a function
    if (!callable) {
      console.error('[createSafeCallable] Callable creation returned null/undefined');
      return null;
    }

    if (typeof callable !== 'function') {
      const callableAny = callable as any;
      console.error('[createSafeCallable] Callable is not a function:', {
        type: typeof callable,
        constructor: callableAny?.constructor?.name,
        value: callable,
      });
      return null;
    }

    // Log Hermes status in production for debugging (only once)
    const globalAny = global as any;
    if (__DEV__ || !globalAny.__HERMES_LOGGED__) {
      const hermesEnabled = isHermesEnabled();
      console.log('[createSafeCallable] Environment:', {
        hermesEnabled,
        functionName,
        functionsType: typeof functionsInstance,
        callableType: typeof callable,
      });
      globalAny.__HERMES_LOGGED__ = true;
    }

    return callable;
  } catch (error: any) {
    console.error('[createSafeCallable] Error creating callable:', {
      error: error.message,
      stack: error.stack,
      functionName,
      hermesEnabled: isHermesEnabled(),
    });
    return null;
  }
};

type InviteScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Invite'>;
type InviteScreenRouteProp = RouteProp<RootStackParamList, 'Invite'>;

const InviteScreen: React.FC = () => {
  const navigation = useNavigation<InviteScreenNavigationProp>();
  const route = useRoute<InviteScreenRouteProp>();
  const { user } = useAuth();
  const { circleId } = route.params;

  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<TextInput>(null);

  /** ✅ Force plain-text copy (fixes iOS "bplist00" bug) */
  const forcePlainCopy = async (text: string) => {
    const cleanText = String(text).trim();
    const safeText = Platform.OS === 'ios' ? ` ${cleanText}` : cleanText; // 👈 key fix

    // Optional: write to hidden input (fallback for older iOS versions)
    if (Platform.OS === 'ios') {
      try {
        inputRef.current?.setNativeProps({ text: safeText });
      } catch (err) {
        console.warn('Clipboard fallback:', err);
      }
    }

    await Clipboard.setStringAsync(safeText);
  };

  const handleCreateInvite = async () => {
    // Early validation: user must be logged in
    if (!user) {
      Alert.alert('Error', 'You must be logged in to create invites.');
      return;
    }

    // Early validation: functions must be available
    if (!functions) {
      Alert.alert('Error', 'Firebase functions not available. Please check your connection.');
      return;
    }

    // Early validation: circleId must be present
    if (!circleId || typeof circleId !== 'string' || circleId.trim().length === 0) {
      Alert.alert('Error', 'Invalid circle ID.');
      return;
    }

    try {
      setIsCreating(true);
      
      // PRODUCTION-SAFE: Create callable with runtime validation
      // This ensures class constructors aren't mis-minified by Hermes
      const createInviteCallable = createSafeCallable<{ circleId: string }, { inviteLink: string; inviteId: string; expiresAt: string }>(
        functions,
        'createInvite'
      );

      // Runtime guard: validate callable was created successfully
      if (!createInviteCallable) {
        throw new Error('Failed to create Firebase callable function. This may be a minification issue.');
      }

      // Runtime guard: ensure callable is actually a function before calling
      if (typeof createInviteCallable !== 'function') {
        const callableAny = createInviteCallable as any;
        console.error('[handleCreateInvite] Callable is not a function:', {
          type: typeof createInviteCallable,
          constructor: callableAny?.constructor?.name,
          hermesEnabled: isHermesEnabled(),
        });
        throw new Error('Callable function is invalid. This may indicate a minification issue.');
      }

      // Call the function with explicit typing and error handling
      let result: HttpsCallableResult<{ inviteLink: string; inviteId: string; expiresAt: string }>;
      try {
        result = await createInviteCallable({ circleId });
      } catch (callError: any) {
        // Catch callable execution errors separately
        console.error('[handleCreateInvite] Callable execution error:', {
          error: callError.message,
          code: callError.code,
          hermesEnabled: isHermesEnabled(),
        });
        throw callError;
      }

      // Runtime validation: ensure result exists and has data
      if (!result) {
        throw new Error('No response received from server');
      }

      if (!result.data) {
        throw new Error('Invalid response format from server');
      }

      const data = result.data;

      // PRODUCTION-SAFE: Explicit runtime validation for inviteLink
      // This prevents undefined/null issues after minification
      if (!data.inviteLink) {
        console.error('[handleCreateInvite] Missing inviteLink in response:', {
          dataKeys: Object.keys(data),
          dataType: typeof data,
          hermesEnabled: isHermesEnabled(),
        });
        throw new Error('Server response missing invite link');
      }

      // Type-safe conversion with validation
      const inviteLinkValue = data.inviteLink;
      if (typeof inviteLinkValue !== 'string') {
        console.error('[handleCreateInvite] inviteLink is not a string:', {
          type: typeof inviteLinkValue,
          value: inviteLinkValue,
        });
        throw new Error('Invalid invite link format from server');
      }

      const link = String(inviteLinkValue).trim();
      
      // Final validation: ensure link is not empty
      if (!link || link.length === 0) {
        throw new Error('Received empty invite link from server');
      }

      // Validate link format (should be a URL)
      if (!link.startsWith('http://') && !link.startsWith('https://')) {
        console.warn('[handleCreateInvite] Invite link does not start with http/https:', link.substring(0, 50));
        // Still proceed, but log warning
      }

      setInviteLink(link);
      await forcePlainCopy(link);

      Toast.show('✅ Invite link copied to clipboard', {
        duration: Toast.durations.SHORT,
        position: Toast.positions.BOTTOM,
      });
    } catch (error: any) {
      // Comprehensive error logging for production debugging
      const hermesEnabled = isHermesEnabled();
      console.error('[handleCreateInvite] Error creating invite:', {
        error: error.message,
        code: error.code,
        stack: error.stack,
        hermesEnabled,
        functionsAvailable: !!functions,
        circleId,
        errorType: error.constructor?.name,
      });
      
      // User-friendly error messages
      let errorMessage = 'Failed to create invite. Please try again.';
      
      if (error.code === 'functions/permission-denied') {
        errorMessage = 'You are not a member of this circle.';
      } else if (error.code === 'functions/not-found') {
        errorMessage = 'Circle not found.';
      } else if (error.code === 'functions/unavailable') {
        errorMessage = 'Firebase Functions service is unavailable. Please check your connection.';
      } else if (error.message?.includes('minification')) {
        errorMessage = 'A build configuration issue occurred. Please contact support.';
      } else if (error.message) {
        // Use the error message if it's user-friendly, otherwise use generic
        errorMessage = error.message.length < 100 ? error.message : errorMessage;
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setIsCreating(false);
    }
  };

  const handleCopyLink = async () => {
    if (!inviteLink) return;
    try {
      await forcePlainCopy(inviteLink);
      setCopied(true);
      Toast.show('✅ Invite link copied to clipboard', {
        duration: Toast.durations.SHORT,
        position: Toast.positions.BOTTOM,
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      Alert.alert('Error', 'Failed to copy link. Please try again.');
    }
  };

  const handleShareLink = async () => {
    if (!inviteLink) return;
    try {
      const cleanLink = String(inviteLink).trim();
      const safeMessage = Platform.OS === 'ios'
        ? `Join my CareCircle Connect circle:\n${cleanLink}`
        : cleanLink;

      await Share.share({
        message: safeMessage,
        url: cleanLink,
      });
    } catch {
      Alert.alert('Error', 'Failed to share link. Please try again.');
    }
  };

  return (
    <KeyboardAvoidingView 
      className="flex-1 bg-gray-50"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Hidden TextInput (for iOS clipboard sanitization) */}
      <TextInput
        ref={inputRef}
        style={{
          position: 'absolute',
          top: -100,
          left: -100,
          width: 0,
          height: 0,
          opacity: 0,
        }}
        editable={false}
      />

      {/* Header */}
      <View className="bg-white border-b border-gray-200" style={{ paddingHorizontal: 24, paddingTop: 60, paddingBottom: 20 }}>
        <View className="flex-row justify-between items-center">
          <TouchableOpacity
            onPress={() => navigation.navigate('CircleFeed', { circleId })}
            style={{
              backgroundColor: '#f3f4f6',
              borderRadius: 12,
              paddingHorizontal: 16,
              paddingVertical: 10,
            }}
          >
            <SafeText className="text-gray-700 font-semibold" style={{ fontSize: 15 }}>Back</SafeText>
          </TouchableOpacity>

          <SafeText className="text-xl font-bold text-gray-900" style={{ fontSize: 20 }}>Invite Members</SafeText>

          <View style={{ width: 60 }} />
        </View>
      </View>

      <ScrollView 
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 24, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {!inviteLink ? (
          // Create invite section
          <View className="bg-white rounded-2xl p-6 shadow-sm">
            <View className="items-center mb-6">
              <SafeText className="text-6xl mb-4">📧</SafeText>
              <SafeText className="text-xl font-semibold text-gray-800 mb-2">
                Invite Family & Friends
              </SafeText>
              <SafeText className="text-gray-600 text-center">
                Create a secure invite link to share with your loved ones. 
                They can join your circle with just one tap.
              </SafeText>
            </View>

            <TouchableOpacity
              onPress={handleCreateInvite}
              disabled={isCreating}
              style={{
                opacity: isCreating ? 0.7 : 1,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 8,
                elevation: 5,
              }}
            >
              {isCreating ? (
                <View style={{
                  backgroundColor: '#d1d5db',
                  borderRadius: 16,
                  paddingVertical: 16,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <ActivityIndicator color="white" size="small" />
                    <SafeText style={{ color: '#ffffff', fontWeight: '600', fontSize: 18, marginLeft: 8 }}>
                      Creating Invite...
                    </SafeText>
                  </View>
                </View>
              ) : (
                <LinearGradient
                  colors={['#60a5fa', '#a78bfa']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    borderRadius: 16,
                    paddingVertical: 16,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <SafeText style={{ color: '#ffffff', fontWeight: '600', fontSize: 18, textAlign: 'center' }}>
                    Create Invite Link
                  </SafeText>
                </LinearGradient>
              )}
            </TouchableOpacity>

            <View className="mt-6 bg-blue-50 rounded-xl p-4">
              <SafeText className="text-blue-800 font-semibold mb-2">💡 How it works:</SafeText>
              <SafeText className="text-blue-700 text-sm">
                • Invite link expires in 7 days{'\n'}
                • One-time use for security{'\n'}
                • Recipients need to create an account{'\n'}
                • They'll see a consent screen before joining
              </SafeText>
            </View>
          </View>
        ) : (
          // Share invite section
          <View className="bg-white rounded-2xl p-6 shadow-sm">
            <View className="items-center mb-6" style={{ paddingTop: 8 }}>
              <View style={{ 
                width: 80, 
                height: 80, 
                borderRadius: 40, 
                backgroundColor: '#10b981', 
                justifyContent: 'center', 
                alignItems: 'center',
                marginBottom: 16,
              }}>
                <SafeText style={{ fontSize: 48, color: '#ffffff' }}>✓</SafeText>
              </View>
              <SafeText className="text-xl font-semibold text-gray-800 mb-2">
                Invite Link Created!
              </SafeText>
              <SafeText className="text-gray-600 text-center">
                Share this link with family and friends to invite them to your circle.
              </SafeText>
            </View>

            {/* QR Code Display */}
            <View className="items-center mb-6">
              <View className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                <SafeText className="text-gray-700 font-semibold mb-3 text-center">
                  Scan to Join
                </SafeText>
                <QRCode
                  value={inviteLink}
                  size={200}
                  color="#1f2937"
                  backgroundColor="#ffffff"
                />
                <SafeText className="text-gray-500 text-xs mt-3 text-center">
                  Share this QR code for easy joining
                </SafeText>
              </View>
            </View>

            <View className="bg-gray-50 rounded-xl p-4 mb-6">
              <Text 
                allowFontScaling={false}
                maxFontSizeMultiplier={1.0}
                className="text-gray-800 text-sm font-mono break-all"
              >
                {inviteLink}
              </Text>
            </View>

            <View className="space-y-3">
              <TouchableOpacity
                onPress={handleShareLink}
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
                    borderRadius: 12,
                    paddingVertical: 16,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <SafeText style={{ color: '#ffffff', fontWeight: '600', fontSize: 18, textAlign: 'center' }}>
                    Share Link
                  </SafeText>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                className="bg-gray-100 rounded-xl py-4"
                onPress={handleCopyLink}
              >
                <SafeText className="text-gray-700 text-center font-semibold text-lg">
                  {copied ? '✅ Copied!' : 'Copy Link'}
                </SafeText>
              </TouchableOpacity>
            </View>

            <View className="mt-6 bg-green-50 rounded-xl p-4">
              <SafeText className="text-green-800 font-semibold mb-2">🎉 Ready to share!</SafeText>
              <SafeText className="text-green-700 text-sm">
                Your invite link is ready. Share it via text, email, or any messaging app.
              </SafeText>
            </View>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default InviteScreen;



