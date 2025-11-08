// Home screen showing user's circles
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl, Alert, TextInput, Modal, StyleSheet, KeyboardAvoidingView, ScrollView, TouchableWithoutFeedback, Keyboard, Platform } from 'react-native';
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
// Lazy import CameraView from expo-camera for QR code scanning
// expo-barcode-scanner is deprecated (removed in SDK 52), using expo-camera instead
let CameraView: any = null;
let Camera: any = null; // For permissions
let cameraError: Error | null = null;

const isCameraAvailable = () => {
  if (CameraView && Camera) return true;
  if (cameraError) return false;
  
  try {
    const cameraModule = require('expo-camera');
    if (cameraModule) {
      CameraView = cameraModule.CameraView;
      Camera = cameraModule.Camera;
      return true;
    }
  } catch (error: any) {
    cameraError = error;
    console.warn('Camera not available (requires development build)');
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
  const [cameraReady, setCameraReady] = useState(false);
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);
  const [scansEnabled, setScansEnabled] = useState(false);
  const [cameraViewLoaded, setCameraViewLoaded] = useState(false);
  const scanTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const scanCountRef = React.useRef<number>(0);
  const cameraViewRef = React.useRef<any>(null);

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
        // Reset camera ready state when opening scanner
        setCameraReady(false);
        setScansEnabled(false);
        setLastScannedCode(null);
        scanCountRef.current = 0;
        setHasPermission(null);
        
        // Clear any existing timeout
        if (scanTimeoutRef.current) {
          clearTimeout(scanTimeoutRef.current);
          scanTimeoutRef.current = null;
        }
        
        // Try to load Camera if not already loaded
        if (!cameraViewRef.current || !Camera) {
          isCameraAvailable();
          if (CameraView && Camera) {
            cameraViewRef.current = CameraView;
            setCameraViewLoaded(true);
          }
        }
        
        // Check if Camera is available (requires development build)
        if (!cameraViewRef.current || !Camera) {
          Alert.alert(
            'QR Scanner Not Available',
            'QR code scanning requires a development build. For now, you can paste the invite link manually.',
            [{ text: 'OK', onPress: () => setShowScanner(false) }]
          );
          return;
        }
        
        try {
          const { status } = await Camera.requestCameraPermissionsAsync();
          setHasPermission(status === 'granted');
          
          if (status === 'granted') {
            // Wait for camera to fully initialize before allowing scans
            // Also ignore the first few scans that might fire on mount
            scanTimeoutRef.current = setTimeout(() => {
              setCameraReady(true);
              // Wait an additional 500ms before actually accepting scans
              setTimeout(() => {
                setScansEnabled(true);
              }, 500);
            }, 1000);
          }
        } catch (error) {
          console.error('Camera error:', error);
          Alert.alert(
            'QR Scanner Not Available',
            'QR code scanning requires a development build. For now, you can paste the invite link manually.',
            [{ text: 'OK', onPress: () => setShowScanner(false) }]
          );
        }
      } else {
        // Reset states when closing scanner
        setCameraReady(false);
        setScansEnabled(false);
        setLastScannedCode(null);
        setCameraViewLoaded(false);
        scanCountRef.current = 0;
        if (scanTimeoutRef.current) {
          clearTimeout(scanTimeoutRef.current);
          scanTimeoutRef.current = null;
        }
      }
    })();
  }, [showScanner]);

  const handleBarCodeScanned = ({ data, type }: { data: string; type: string }) => {
    // Increment scan count
    scanCountRef.current += 1;
    
    // Ignore scans if they're not enabled yet
    if (!scansEnabled) {
      return;
    }
    
    // Ignore scans if camera isn't ready yet
    if (!cameraReady) {
      return;
    }
    
    // Ignore the first few scans (they're often false positives on mount)
    if (scanCountRef.current <= 3) {
      return;
    }
    
    // Validate that we have actual data
    if (!data || typeof data !== 'string' || data.trim().length === 0) {
      return;
    }
    
    // Only process QR codes
    if (type !== 'qr') {
      return;
    }
    
    // Prevent duplicate scans of the same code
    if (lastScannedCode === data) {
      return;
    }
    
    // Additional validation: check if data looks like a valid invite link
    const trimmedData = data.trim();
    if (trimmedData.length < 10) {
      return;
    }
    
    // Mark this code as scanned immediately to prevent duplicates
    setLastScannedCode(data);
    
    // Close scanner
    setShowScanner(false);
    
    // Extract invite ID from URL if it's a full URL
    const inviteId = extractInviteId(trimmedData);
    const valueToSet = inviteId || trimmedData;
    
    // Set the invite input value
    setInviteInput(valueToSet);
    
    // Re-open the join modal so user can continue filling the form
    setTimeout(() => {
      setShowJoinModal(true);
    }, 300); // Small delay to ensure scanner modal closes first
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
        <SafeText className="text-6xl leading-[63px]">{EMOJIS.BLUE_HEART}</SafeText>
      </LinearGradient>
      <SafeText className="text-3xl font-bold text-gray-800 mb-3 text-center leading-[40px]">
        Welcome to CareCircle Connect
      </SafeText>
      <SafeText className="text-gray-600 text-center mb-8 text-lg leading-[26px]">
        Create your first circle to start sharing updates with family and friends. 
        Stay connected with those who matter most.
      </SafeText>
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
            <SafeText className="text-white font-bold text-xl text-center leading-[30px]">
              Create Your First Circle
            </SafeText>
          </LinearGradient>
        </TouchableOpacity>
        
        <TouchableOpacity
          className="bg-gray-200 rounded-2xl px-8 py-4 items-center"
          onPress={() => setShowJoinModal(true)}
        >
          <SafeText className="text-gray-700 font-semibold text-xl leading-[30px]">Join Existing Circle</SafeText>
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
          <SafeText className="text-3xl leading-[40px]">{EMOJIS.BLUE_HEART}</SafeText>
        </LinearGradient>
        <SafeText className="text-gray-600 text-xl font-medium leading-[30px]">Loading circles...</SafeText>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 justify-center items-center bg-blue-50 px-6">
        <View className="w-16 h-16 bg-red-100 rounded-full items-center justify-center mb-4">
          <SafeText className="text-3xl leading-[40px]">{EMOJIS.WARNING}</SafeText>
        </View>
        <SafeText className="text-red-600 text-center mb-6 text-xl font-medium leading-[30px]">{error}</SafeText>
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
            <SafeText style={{ color: '#ffffff', fontWeight: 'bold', fontSize: 16, textAlign: 'center' }}>
              Try Again
            </SafeText>
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
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="flex-1"
          >
            <TouchableWithoutFeedback onPress={() => {}}>
              <View className="flex-1 bg-black/50 justify-center px-4">
                <ScrollView
                  contentContainerStyle={{ 
                    flexGrow: 1, 
                    justifyContent: 'center', 
                    paddingVertical: 20,
                    paddingBottom: 30
                  }}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                >
                  <TouchableWithoutFeedback onPress={() => {}}>
                    <View className="bg-white rounded-3xl" style={{ padding: 24, overflow: 'hidden', width: '100%', maxWidth: 500, alignSelf: 'center' }}>
                      <SafeText className="text-3xl font-bold mb-2 text-gray-900 leading-[40px]">Join Circle</SafeText>
                      <SafeText className="text-gray-600 text-lg mb-2 leading-[26px]">
                        Enter your invite link to join a CareCircle Connect circle.
                      </SafeText>
                      <SafeText className="text-gray-500 text-base mb-4 leading-[24px]">
                        You can paste the full link or just the code after <SafeText className="font-semibold">inviteRedirect/</SafeText>.
                        Example: <SafeText className="font-semibold">ABC123...</SafeText>
                      </SafeText>
                      
                      <View className="flex-row gap-2 mb-4">
                        <TextInput
                          className="flex-1 border border-gray-300 rounded-xl px-4 py-3 text-gray-800 text-base bg-gray-50"
                          placeholder="https://care-circle-15fd5.web.app/inviteRedirect/..."
                          value={inviteInput}
                          onChangeText={setInviteInput}
                          autoCapitalize="none"
                          autoCorrect={false}
                          multiline
                          allowFontScaling={false}
                          maxFontSizeMultiplier={1.0}
                          style={{ minHeight: 44, maxHeight: 100, fontSize: 19 }}
                        />
                        <TouchableOpacity
                          onPress={() => {
                            setShowJoinModal(false); // Close join modal first
                            setTimeout(() => {
                              setShowScanner(true); // Then open scanner
                            }, 100); // Small delay to ensure join modal closes
                          }}
                          className="bg-blue-100 rounded-xl px-4 py-3 items-center justify-center"
                          style={{ minWidth: 60, minHeight: 44 }}
                          activeOpacity={0.7}
                        >
                          <SafeText className="text-3xl leading-[40px]">📷</SafeText>
                        </TouchableOpacity>
                      </View>

                      <SafeText className="text-gray-700 mb-2 font-medium text-lg leading-[26px]">Your name</SafeText>
                      <TextInput
                        className="border border-gray-300 rounded-xl px-4 py-3 text-gray-800 text-base mb-4 bg-gray-50"
                        placeholder={user?.displayName ? `${user.displayName}` : 'Full name'}
                        value={requestName}
                        onChangeText={setRequestName}
                        autoCapitalize="words"
                        autoCorrect={false}
                        allowFontScaling={false}
                        maxFontSizeMultiplier={1.0}
                        style={{ minHeight: 44, fontSize: 19 }}
                      />

                      <SafeText className="text-gray-700 mb-2 font-medium text-lg leading-[26px]">Relation to the person</SafeText>
                      <TextInput
                        className="border border-gray-300 rounded-xl px-4 py-3 text-gray-800 text-base mb-4 bg-gray-50"
                        placeholder="e.g., Daughter, Friend, Neighbor"
                        value={requestRelation}
                        onChangeText={setRequestRelation}
                        autoCapitalize="sentences"
                        autoCorrect
                        allowFontScaling={false}
                        maxFontSizeMultiplier={1.0}
                        style={{ minHeight: 44, fontSize: 19 }}
                      />
                      
                      <View className="flex-row gap-3" style={{ marginTop: 8 }}>
                        <TouchableOpacity
                          className="flex-1 bg-gray-200 rounded-xl py-3.5 items-center justify-center"
                          onPress={() => {
                            Keyboard.dismiss();
                            setShowJoinModal(false);
                            setInviteInput('');
                            setRequestName('');
                            setRequestRelation('');
                          }}
                          activeOpacity={0.7}
                          style={{ minHeight: 48 }}
                        >
                          <SafeText className="text-gray-700 font-semibold text-lg leading-[26px]">Cancel</SafeText>
                        </TouchableOpacity>
                        
                        <TouchableOpacity
                          onPress={handleJoinByInvite}
                          style={{
                            flex: 1,
                            minHeight: 48,
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.1,
                            shadowRadius: 4,
                            elevation: 3,
                          }}
                          activeOpacity={0.8}
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
                              minHeight: 48,
                            }}
                          >
                            <SafeText style={{ color: '#ffffff', fontWeight: '600', fontSize: 16, textAlign: 'center' }}>
                              Join
                            </SafeText>
                          </LinearGradient>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </TouchableWithoutFeedback>
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
      </Modal>

      {/* QR Code Scanner Modal */}
      <Modal
        visible={showScanner}
        transparent={false}
        animationType="slide"
        onRequestClose={() => {
          setShowScanner(false);
        }}
        statusBarTranslucent={true}
      >
        <View style={{ flex: 1, backgroundColor: '#000000' }}>
          {hasPermission === null ? (
            <View className="flex-1 justify-center items-center">
              <SafeText className="text-white text-xl">Requesting camera permission...</SafeText>
              <TouchableOpacity
                onPress={() => {
                  setShowScanner(false);
                }}
                className="mt-4 bg-blue-600 rounded-xl px-6 py-3"
              >
                <SafeText className="text-white font-semibold text-lg">Close</SafeText>
              </TouchableOpacity>
            </View>
          ) : hasPermission === false ? (
            <View className="flex-1 justify-center items-center px-6">
              <SafeText className="text-white text-xl mb-4 text-center">
                Camera permission is required to scan QR codes.
              </SafeText>
              <TouchableOpacity
                onPress={() => setShowScanner(false)}
                className="bg-blue-600 rounded-xl px-6 py-3"
              >
                <SafeText className="text-white font-semibold text-lg">Close</SafeText>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {!cameraViewLoaded ? (
                <View className="flex-1 justify-center items-center bg-black">
                  <SafeText className="text-white text-xl font-semibold mb-2">Loading camera...</SafeText>
                  <SafeText className="text-white/70 text-base">Please wait</SafeText>
                </View>
              ) : !cameraReady ? (
                <View className="flex-1 justify-center items-center bg-black">
                  <SafeText className="text-white text-xl font-semibold mb-2">Preparing camera...</SafeText>
                  <SafeText className="text-white/70 text-base">Please wait</SafeText>
                </View>
              ) : cameraViewRef.current ? (
                <View style={{ flex: 1 }}>
                  {React.createElement(cameraViewRef.current, {
                    style: StyleSheet.absoluteFillObject,
                    facing: "back",
                    onBarcodeScanned: scansEnabled ? handleBarCodeScanned : undefined,
                    barcodeScannerSettings: {
                      barcodeTypes: ['qr'],
                    },
                  })}
                </View>
              ) : (
                <View className="flex-1 justify-center items-center bg-black">
                  <SafeText className="text-white text-xl font-semibold mb-2">Camera not available</SafeText>
                  <TouchableOpacity
                    onPress={() => setShowScanner(false)}
                    className="mt-4 bg-blue-600 rounded-xl px-6 py-3"
                  >
                    <SafeText className="text-white font-semibold text-lg">Close</SafeText>
                  </TouchableOpacity>
                </View>
              )}
              <View className="absolute top-12 left-0 right-0 items-center">
                <SafeText className="text-white text-2xl font-bold mb-2">Scan QR Code</SafeText>
                <SafeText className="text-white/80 text-base">Point your camera at the QR code</SafeText>
              </View>
              <View className="absolute bottom-8 left-0 right-0 items-center px-6">
                <TouchableOpacity
                  onPress={() => setShowScanner(false)}
                  className="bg-white/20 rounded-xl px-6 py-3"
                >
                  <SafeText className="text-white font-semibold text-lg">Cancel</SafeText>
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
            <SafeText className="text-4xl font-bold mt-5 leading-[48px]" style={{ color: '#3b82f6' }} maxFontSizeMultiplier={1.2}>
              My Circles
            </SafeText>
            <View>
              <SafeText className="text-lg mt-1 leading-[26px]" style={{ color: '#64748b' }} maxFontSizeMultiplier={1.3}>
                Welcome,
              </SafeText>
              <SafeText className="text-lg leading-[26px]" style={{ color: '#64748b' }} maxFontSizeMultiplier={1.3}>
                {user?.displayName || 'User'} {EMOJIS.BLUE_HEART}
              </SafeText>
            </View>
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
              <SafeText className="text-lg" maxFontSizeMultiplier={1.1}>👥</SafeText>
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
                <SafeText className="text-lg font-bold" style={{ color: '#ffffff' }} maxFontSizeMultiplier={1.1}>+</SafeText>
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
                backgroundColor: '#e5e7eb',
                borderRadius: 12,
                width: 48,
                height: 48,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <SafeText className="text-lg" maxFontSizeMultiplier={1.1}>⚙️</SafeText>
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
          contentContainerStyle={{ 
            paddingHorizontal: 16, 
            paddingTop: 16,
            paddingBottom: 32 
          }}
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