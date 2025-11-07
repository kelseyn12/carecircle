import React, { useRef, useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Alert, 
  Share,
  ActivityIndicator,
  TextInput,
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
import { httpsCallable } from 'firebase/functions';
import { functions } from '../lib/firebase';
import Toast from 'react-native-root-toast';
import QRCode from 'react-native-qrcode-svg';

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

  const createInvite = functions ? httpsCallable(functions, 'createInvite') : null;

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
      if (!createInvite) {
        throw new Error('Firebase functions not available');
      }
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
            <Text className="text-gray-700 font-semibold" style={{ fontSize: 15 }}>Back</Text>
          </TouchableOpacity>

          <Text className="text-xl font-bold text-gray-900" style={{ fontSize: 20 }}>Invite Members</Text>

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
                    <Text style={{ color: '#ffffff', fontWeight: '600', fontSize: 18, marginLeft: 8 }}>
                      Creating Invite...
                    </Text>
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
                  <Text style={{ color: '#ffffff', fontWeight: '600', fontSize: 18, textAlign: 'center' }}>
                    Create Invite Link
                  </Text>
                </LinearGradient>
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

            {/* QR Code Display */}
            <View className="items-center mb-6">
              <View className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                <Text className="text-gray-700 font-semibold mb-3 text-center">
                  Scan to Join
                </Text>
                <QRCode
                  value={inviteLink}
                  size={200}
                  color="#1f2937"
                  backgroundColor="#ffffff"
                />
                <Text className="text-gray-500 text-xs mt-3 text-center">
                  Share this QR code for easy joining
                </Text>
              </View>
            </View>

            <View className="bg-gray-50 rounded-xl p-4 mb-6">
              <Text className="text-gray-800 text-sm font-mono break-all">
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
                  <Text style={{ color: '#ffffff', fontWeight: '600', fontSize: 18, textAlign: 'center' }}>
                    Share Link
                  </Text>
                </LinearGradient>
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
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default InviteScreen;



