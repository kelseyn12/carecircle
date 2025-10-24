import React, { useRef, useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Alert, 
  Share,
  ActivityIndicator,
  TextInput,
  Platform
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types';
import { useAuth } from '../lib/authContext';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../lib/firebase';
import Toast from 'react-native-root-toast';

type InviteScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Invite'>;
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

  const createInvite = httpsCallable(functions, 'createInvite');

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
    if (!user) {
      Alert.alert('Error', 'You must be logged in to create invites.');
      return;
    }

    try {
      setIsCreating(true);
      const result = await createInvite({ circleId });
      const data = result.data as any;

      const link = String(data.inviteLink).trim();
      setInviteLink(link);
      await forcePlainCopy(link);

      Toast.show('✅ Invite link copied to clipboard', {
        duration: Toast.durations.SHORT,
        position: Toast.positions.BOTTOM,
      });
    } catch (error: any) {
      console.error('Error creating invite:', error);
      let errorMessage = 'Failed to create invite. Please try again.';
      if (error.code === 'functions/permission-denied') {
        errorMessage = 'You are not a member of this circle.';
      } else if (error.code === 'functions/not-found') {
        errorMessage = 'Circle not found.';
      } else if (error.message) {
        errorMessage = error.message;
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
        ? `Join my Care Circle:\n${cleanLink}`
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
    <View className="flex-1 bg-gray-50">
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
      <View className="bg-white px-6 py-6 border-b border-gray-200">
        <View className="flex-row justify-between items-center">
          <TouchableOpacity
            className="bg-gray-100 rounded-xl px-4 py-3 mt-4"
            onPress={() => navigation.navigate('CircleFeed', { circleId })}
          >
            <Text className="text-gray-700 font-semibold">Back</Text>
          </TouchableOpacity>

          <Text className="text-xl font-semibold text-gray-800">Invite Members</Text>

          <View className="w-16" />
        </View>
      </View>

      <View className="flex-1 px-6 py-6">
        {!inviteLink ? (
          // Create invite section
          <View className="bg-white rounded-2xl p-6 shadow-sm">
            <View className="items-center mb-6">
              <Text className="text-6xl mb-4">📧</Text>
              <Text className="text-xl font-semibold text-gray-800 mb-2">
                Invite Family & Friends
              </Text>
              <Text className="text-gray-600 text-center">
                Create a secure invite link to share with your loved ones. 
                They can join your circle with just one tap.
              </Text>
            </View>

            <TouchableOpacity
              className={`rounded-xl py-4 ${
                isCreating ? 'bg-gray-300' : 'bg-blue-500'
              }`}
              onPress={handleCreateInvite}
              disabled={isCreating}
            >
              {isCreating ? (
                <View className="flex-row items-center justify-center">
                  <ActivityIndicator color="white" size="small" />
                  <Text className="text-white font-semibold ml-2">Creating Invite...</Text>
                </View>
              ) : (
                <Text className="text-white text-center font-semibold text-lg">
                  Create Invite Link
                </Text>
              )}
            </TouchableOpacity>

            <View className="mt-6 bg-blue-50 rounded-xl p-4">
              <Text className="text-blue-800 font-semibold mb-2">💡 How it works:</Text>
              <Text className="text-blue-700 text-sm">
                • Invite link expires in 7 days{'\n'}
                • One-time use for security{'\n'}
                • Recipients need to create an account{'\n'}
                • They'll see a consent screen before joining
              </Text>
            </View>
          </View>
        ) : (
          // Share invite section
          <View className="bg-white rounded-2xl p-6 shadow-sm">
            <View className="items-center mb-6">
              <Text className="text-6xl mb-4">✅</Text>
              <Text className="text-xl font-semibold text-gray-800 mb-2">
                Invite Link Created!
              </Text>
              <Text className="text-gray-600 text-center">
                Share this link with family and friends to invite them to your circle.
              </Text>
            </View>

            <View className="bg-gray-50 rounded-xl p-4 mb-6">
              <Text className="text-gray-800 text-sm font-mono break-all">
                {inviteLink}
              </Text>
            </View>

            <View className="space-y-3">
              <TouchableOpacity
                className="bg-blue-500 rounded-xl py-4"
                onPress={handleShareLink}
              >
                <Text className="text-white text-center font-semibold text-lg">
                  Share Link
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="bg-gray-100 rounded-xl py-4"
                onPress={handleCopyLink}
              >
                <Text className="text-gray-700 text-center font-semibold text-lg">
                  {copied ? '✅ Copied!' : 'Copy Link'}
                </Text>
              </TouchableOpacity>
            </View>

            <View className="mt-6 bg-green-50 rounded-xl p-4">
              <Text className="text-green-800 font-semibold mb-2">🎉 Ready to share!</Text>
              <Text className="text-green-700 text-sm">
                Your invite link is ready. Share it via text, email, or any messaging app.
              </Text>
            </View>
          </View>
        )}
      </View>
    </View>
  );
};

export default InviteScreen;



