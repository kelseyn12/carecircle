// Home screen showing user's circles
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl, Alert, TextInput, Modal, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList, Circle } from '../types';
import CircleCard from '../components/CircleCard';
import { useAuth } from '../lib/authContext';
import { useCircles } from '../lib/useCircles';
import { getUser } from '../lib/firestoreUtils';
import { EMOJIS } from '../utils/emojiUtils';
import { initializeNotifications } from '../lib/notificationService';
import { createJoinRequest, getInviteInfo } from '../lib/firestoreUtils';
import SafeText from '../components/SafeText';
// Lazy import BarCodeScanner to avoid crash in Expo Go
// The native module may not be available in Expo Go
let BarCodeScanner: any = null;
let barCodeScannerError: Error | null = null;

const isBarCodeScannerAvailable = () => {
  if (BarCodeScanner) return true;
  if (barCodeScannerError) return false;
  
  try {
    // Suppress the native module error by catching it
    const scannerModule = require('expo-barcode-scanner');
    if (scannerModule && scannerModule.BarCodeScanner) {
      BarCodeScanner = scannerModule.BarCodeScanner;
      return true;
    }
  } catch (error: any) {
    // Native module not available - this is expected in Expo Go
    barCodeScannerError = error;
    // Suppress the error from console in Expo Go
    if (!error.message?.includes('ExpoBarCodeScanner')) {
      console.warn('BarCodeScanner not available (requires development build)');
    }
    return false;
  }
  return false;
};

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { user, signOut } = useAuth();
  const { circles, loading, error, refreshCircles } = useCircles();
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [inviteInput, setInviteInput] = useState('');
  const [requestName, setRequestName] = useState('');
  const [requestRelation, setRequestRelation] = useState('');
  const [lastViewedMap, setLastViewedMap] = useState<Record<string, Date>>({});
  const [showScanner, setShowScanner] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      if (!user) return;
      const u = await getUser(user.id);
      setLastViewedMap(u?.lastViewedCircles || {});
    })();
  }, [user]);

  useEffect(() => {
    (async () => {
      if (showScanner) {
        // Try to load BarCodeScanner if not already loaded
        if (!BarCodeScanner) {
          isBarCodeScannerAvailable();
        }
        
        // Check if BarCodeScanner is available (requires development build)
        if (!BarCodeScanner) {
          Alert.alert(
            'QR Scanner Not Available',
            'QR code scanning requires a development build. For now, you can paste the invite link manually.',
            [{ text: 'OK', onPress: () => setShowScanner(false) }]
          );
          return;
        }
        try {
          const { status } = await BarCodeScanner.requestPermissionsAsync();
          setHasPermission(status === 'granted');
        } catch (error) {
          console.error('BarCodeScanner error:', error);
          Alert.alert(
            'QR Scanner Not Available',
            'QR code scanning requires a development build. For now, you can paste the invite link manually.',
            [{ text: 'OK', onPress: () => setShowScanner(false) }]
          );
        }
      }
    })();
  }, [showScanner]);

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    setShowScanner(false);
    // Extract invite ID from URL if it's a full URL
    const inviteId = extractInviteId(data);
    if (inviteId) {
      setInviteInput(inviteId);
      Alert.alert('QR Code Scanned', 'Invite link has been filled in. Please complete the form and join.');
    } else {
      setInviteInput(data);
      Alert.alert('QR Code Scanned', 'Please verify the invite link and complete the form.');
    }
  };

  const handleCreateCircle = () => {
    navigation.navigate('CreateCircle');
  };

  const handleCirclePress = (circleId: string) => {
    navigation.navigate('CircleFeed', { circleId });
  };

  const handleRefresh = async () => {
    try {
      await refreshCircles();
    } catch (error) {
      console.error('Error refreshing circles:', error);
    }
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
            } catch (error) {
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            }
          },
        },
      ]
    );
  };

  // Extract inviteId from full invite link or use the input directly
  const extractInviteId = (input: string): string | null => {
    const trimmed = input.trim();
    
    // If it's a full URL, extract the inviteId
    if (trimmed.includes('/inviteRedirect/')) {
      const parts = trimmed.split('/inviteRedirect/');
      if (parts.length > 1) {
        return parts[1].split('?')[0].split('#')[0]; // Remove query params and hash
      }
    }
    
    // If it looks like just an invite ID (alphanumeric, reasonable length)
    if (/^[a-zA-Z0-9_-]{15,}$/.test(trimmed)) {
      return trimmed;
    }
    return null;
  };

  const handleJoinByInvite = () => {
    const inviteId = extractInviteId(inviteInput);
    
    if (!inviteId) {
      Alert.alert(
        'Invalid Invite',
        'Please enter a valid invite link or invite ID.\n\nExample: https://care-circle-15fd5.web.app/inviteRedirect/ABC123...\nOr just: ABC123...'
      );
      return;
    }

    // Validate extra fields
    const nameToUse = requestName.trim() || user?.displayName || '';
    if (!nameToUse) {
      Alert.alert('Name required', 'Please provide your name.');
      return;
    }
    if (!requestRelation.trim()) {
      Alert.alert('Relation required', 'Please describe your relation to the person.');
      return;
    }

    // Submit join request flow
    (async () => {
      try {
        const invite = await getInviteInfo(inviteId);
        if (!invite) {
          Alert.alert('Invalid Invite', 'Invite not found or has expired.');
          return;
        }
        if (invite.expiresAt && invite.expiresAt.getTime() < Date.now()) {
          Alert.alert('Invite Expired', 'This invite has expired. Please request a new one.');
          return;
        }
        if (!user) {
          Alert.alert('Authentication Required', 'Please sign in to request to join.');
          navigation.navigate('SignIn');
          return;
        }

        await createJoinRequest(invite.circleId, {
          userId: user.id,
          displayName: nameToUse,
          relation: requestRelation.trim(),
          inviteId,
        });

        // Request notification permissions contextually after joining
        await initializeNotifications(
          user.id,
          'Stay connected! Get notified when there are new updates in this circle and when your join request is approved.'
        );

        setShowJoinModal(false);
        setInviteInput('');
        setRequestName('');
        setRequestRelation('');

        Alert.alert(
          'Request Sent',
          'Your request to join has been sent. You will be notified once the owners approve your request.'
        );
      } catch (err:any) {
        console.error('Join request error:', err);
        Alert.alert('Error', err?.message || 'Failed to submit request. Please try again.');
      }
    })();
  };

  const renderEmptyState = () => (
    <View className="flex-1 justify-center items-center px-6">
      <LinearGradient
        colors={['#93c5fd', '#c4b5fd']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          width: 128,
          height: 128,
          borderRadius: 64,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 32,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.2,
          shadowRadius: 8,
          elevation: 8,
        }}
      >
        <Text className="text-6xl">{EMOJIS.BLUE_HEART}</Text>
      </LinearGradient>
      <Text className="text-2xl font-bold text-gray-800 mb-3 text-center">
        Welcome to Care Circle
      </Text>
      <Text className="text-gray-600 text-center mb-8 leading-relaxed text-base">
        Create your first circle to start sharing updates with family and friends. 
        Stay connected with those who matter most.
      </Text>
      <View className="w-full gap-3">
        <TouchableOpacity
          onPress={handleCreateCircle}
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
              paddingHorizontal: 32,
              paddingVertical: 16,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ color: '#ffffff', fontWeight: 'bold', fontSize: 18, textAlign: 'center' }}>
              Create Your First Circle
            </Text>
          </LinearGradient>
        </TouchableOpacity>
        
        <TouchableOpacity
          className="bg-gray-200 rounded-2xl px-8 py-4 items-center"
          onPress={() => setShowJoinModal(true)}
        >
          <Text className="text-gray-700 font-semibold text-lg">Join Existing Circle</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderCircle = ({ item }: { item: Circle }) => {
    const lastViewed = lastViewedMap[item.id];
    const hasNew = item.lastUpdateAt && (!lastViewed || (lastViewed < (item.lastUpdateAt as Date)));
    return (
      <CircleCard
        circle={item}
        hasNew={!!hasNew}
        onPress={() => handleCirclePress(item.id)}
      />
    );
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-blue-50">
        <LinearGradient
          colors={['#93c5fd', '#c4b5fd']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            width: 64,
            height: 64,
            borderRadius: 32,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 16,
          }}
        >
          <Text className="text-2xl">{EMOJIS.BLUE_HEART}</Text>
        </LinearGradient>
        <Text className="text-gray-600 text-lg font-medium">Loading circles...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 justify-center items-center bg-blue-50 px-6">
        <View className="w-16 h-16 bg-red-100 rounded-full items-center justify-center mb-4">
          <Text className="text-2xl">{EMOJIS.WARNING}</Text>
        </View>
        <Text className="text-red-600 text-center mb-6 text-lg font-medium">{error}</Text>
        <TouchableOpacity
          onPress={handleRefresh}
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
              paddingHorizontal: 24,
              paddingVertical: 12,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ color: '#ffffff', fontWeight: 'bold', fontSize: 16, textAlign: 'center' }}>
              Try Again
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-blue-50">
      {/* Join Circle Modal */}
      <Modal
        visible={showJoinModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowJoinModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-center px-5">
          <View className="bg-white rounded-3xl p-6">
            <Text className="text-2xl font-bold mb-2">Join Circle</Text>
            <Text className="text-gray-600 text-base mb-2">
              Enter your invite link to join a Care Circle.
            </Text>
            <Text className="text-gray-500 text-sm mb-4">
              You can paste the full link or just the code after <Text className="font-semibold">inviteRedirect/</Text>.
              Example: <Text className="font-semibold">ABC123...</Text>
            </Text>
            
            <View className="flex-row gap-2 mb-4">
              <TextInput
                className="flex-1 border border-gray-300 rounded-xl px-4 py-3 text-gray-800 text-base bg-gray-50"
                placeholder="https://care-circle-15fd5.web.app/inviteRedirect/..."
                value={inviteInput}
                onChangeText={setInviteInput}
                autoCapitalize="none"
                autoCorrect={false}
                multiline
              />
              <TouchableOpacity
                onPress={() => {
                  // Try to load BarCodeScanner if not already loaded
                  if (!BarCodeScanner) {
                    isBarCodeScannerAvailable();
                  }
                  
                  // Check if BarCodeScanner is available
                  if (BarCodeScanner) {
                    setShowScanner(true);
                  } else {
                    Alert.alert(
                      'QR Scanner Not Available',
                      'QR code scanning requires a development build. Please paste the invite link manually.',
                      [{ text: 'OK' }]
                    );
                  }
                }}
                className="bg-blue-100 rounded-xl px-4 py-3 items-center justify-center"
                style={{ minWidth: 60 }}
              >
                <Text className="text-2xl">📷</Text>
              </TouchableOpacity>
            </View>

            <Text className="text-gray-700 mb-2">Your name</Text>
            <TextInput
              className="border border-gray-300 rounded-xl px-4 py-3 text-gray-800 text-base mb-4 bg-gray-50"
              placeholder={user?.displayName ? `${user.displayName}` : 'Full name'}
              value={requestName}
              onChangeText={setRequestName}
              autoCapitalize="words"
              autoCorrect={false}
            />

            <Text className="text-gray-700 mb-2">Relation to the person</Text>
            <TextInput
              className="border border-gray-300 rounded-xl px-4 py-3 text-gray-800 text-base mb-5 bg-gray-50"
              placeholder="e.g., Daughter, Friend, Neighbor"
              value={requestRelation}
              onChangeText={setRequestRelation}
              autoCapitalize="sentences"
              autoCorrect
            />
            
            <View className="flex-row gap-3">
              <TouchableOpacity
                className="flex-1 bg-gray-500 rounded-xl py-3.5 items-center"
                onPress={() => {
                  setShowJoinModal(false);
                  setInviteInput('');
                }}
              >
                <Text className="text-white font-semibold text-base">Back</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={handleJoinByInvite}
                style={{
                  flex: 1,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                  elevation: 3,
                }}
              >
                <LinearGradient
                  colors={['#60a5fa', '#a78bfa']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    borderRadius: 12,
                    paddingVertical: 14,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ color: '#ffffff', fontWeight: '600', fontSize: 16, textAlign: 'center' }}>
                    Join
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* QR Code Scanner Modal */}
      <Modal
        visible={showScanner}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowScanner(false)}
      >
        <View className="flex-1 bg-black">
          {hasPermission === null ? (
            <View className="flex-1 justify-center items-center">
              <Text className="text-white text-lg">Requesting camera permission...</Text>
            </View>
          ) : hasPermission === false ? (
            <View className="flex-1 justify-center items-center px-6">
              <Text className="text-white text-lg mb-4 text-center">
                Camera permission is required to scan QR codes.
              </Text>
              <TouchableOpacity
                onPress={() => setShowScanner(false)}
                className="bg-blue-600 rounded-xl px-6 py-3"
              >
                <Text className="text-white font-semibold">Close</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {BarCodeScanner && (
                <BarCodeScanner
                  onBarCodeScanned={handleBarCodeScanned}
                  style={StyleSheet.absoluteFillObject}
                  barCodeTypes={[BarCodeScanner.Constants?.BarCodeType?.qr || 'qr']}
                />
              )}
              <View className="absolute top-12 left-0 right-0 items-center">
                <Text className="text-white text-xl font-bold mb-2">Scan QR Code</Text>
                <Text className="text-white/80 text-sm">Point your camera at the QR code</Text>
              </View>
              <View className="absolute bottom-8 left-0 right-0 items-center px-6">
                <TouchableOpacity
                  onPress={() => setShowScanner(false)}
                  className="bg-white/20 rounded-xl px-6 py-3"
                >
                  <Text className="text-white font-semibold">Cancel</Text>
                </TouchableOpacity>
              </View>
              <View className="absolute top-1/2 left-1/2" style={{ transform: [{ translateX: -100 }, { translateY: -100 }] }}>
                <View style={{ width: 200, height: 200, borderWidth: 2, borderColor: '#60a5fa', borderRadius: 12 }} />
              </View>
            </>
          )}
        </View>
      </Modal>

      {/* Header */}
      <LinearGradient
        colors={['#ffffff', '#eff6ff']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{
          paddingHorizontal: 24,
          paddingTop: 48,
          paddingBottom: 16,
          borderBottomWidth: 1,
          borderBottomColor: '#e5e7eb',
        }}
      >
        <View className="flex-row justify-between items-center">
          <View className="flex-1">
            <SafeText className="text-3xl font-bold mt-5" style={{ color: '#3b82f6' }} maxFontSizeMultiplier={1.2}>
              My Circles
            </SafeText>
            <SafeText className="text-base mt-1" style={{ color: '#64748b' }} maxFontSizeMultiplier={1.3}>
              Welcome, {user?.displayName || 'User'} {EMOJIS.BLUE_HEART}
            </SafeText>
          </View>
          <View className="flex-row gap-2 mt-5 flex-shrink-0">
            <TouchableOpacity
              onPress={() => setShowJoinModal(true)}
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 3,
                backgroundColor: '#dbeafe',
                borderRadius: 12,
                width: 48,
                height: 48,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <SafeText className="text-base" maxFontSizeMultiplier={1.1}>👥</SafeText>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleCreateCircle}
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 3,
              }}
            >
              <LinearGradient
                colors={['#60a5fa', '#a78bfa']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  borderRadius: 12,
                  width: 48,
                  height: 48,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <SafeText className="text-base font-bold" style={{ color: '#ffffff' }} maxFontSizeMultiplier={1.1}>+</SafeText>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigation.navigate('Settings')}
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 3,
              }}
            >
              <View
                style={{
                  backgroundColor: '#e5e7eb',
                  borderRadius: 12,
                  width: 48,
                  height: 48,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Ionicons name="settings-outline" size={24} color="#3b82f6" />
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      {/* Content */}
      {circles.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={circles}
          renderItem={renderCircle}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 16 }}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={handleRefresh}
              tintColor="#3b82f6"
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

export default HomeScreen;