// Settings screen for user account management
import React, { useState } from 'react';
import { View, TouchableOpacity, Alert, ScrollView, TextInput, KeyboardAvoidingView, Platform, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types';
import { useAuth } from '../lib/authContext';
import { useSubscription } from '../hooks/useSubscription';
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { Linking } from 'react-native';
import SafeText from '../components/SafeText';
import { EMOJIS } from '../utils/emojiUtils';

type SettingsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Settings'>;

const SettingsScreen: React.FC = () => {
  const navigation = useNavigation<SettingsScreenNavigationProp>();
  const { user, signOut, deleteAccount, updateUserProfile } = useAuth();
  const { subscriptionStatus, refreshSubscription, FREE_CIRCLE_LIMIT } = useSubscription();
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [showReauthModal, setShowReauthModal] = useState(false);
  const [reauthPassword, setReauthPassword] = useState('');
  const [showEditDisplayName, setShowEditDisplayName] = useState(false);
  const [editDisplayName, setEditDisplayName] = useState('');

  // Refresh subscription status when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      refreshSubscription();
    }, [refreshSubscription])
  );

  const formatRenewalText = (expirationDate?: Date) => {
    if (!expirationDate) return '';
    return ` Renews at ${expirationDate.toLocaleString()}.`;
  };

  const handleManageSubscription = async () => {
    // Apple does not allow cancelling subscriptions directly inside the app UI.
    // Best UX is to deep link to the system subscriptions management page.
    const iosSubscriptionsUrl = 'itms-apps://apps.apple.com/account/subscriptions';
    const webSubscriptionsUrl = 'https://apps.apple.com/account/subscriptions';
    const targetUrl = Platform.OS === 'ios' ? iosSubscriptionsUrl : webSubscriptionsUrl;
    const fallbackInstructions =
      'To manage or cancel your subscription, go to iPhone Settings → [Your Name] → Subscriptions.';

    try {
      const supported = await Linking.canOpenURL(targetUrl);
      if (supported) {
        await Linking.openURL(targetUrl);
        return;
      }
      // Fallback to the web URL if the itms-apps scheme isn't supported for some reason
      const webSupported = await Linking.canOpenURL(webSubscriptionsUrl);
      if (webSupported) {
        await Linking.openURL(webSubscriptionsUrl);
      } else {
        Alert.alert('Manage Subscription', fallbackInstructions);
      }
    } catch (error) {
      console.error('Error opening subscription management:', error);
      Alert.alert('Manage Subscription', fallbackInstructions);
    }
  };

  // Validate new password
  const validateNewPassword = (password: string): string => {
    if (!password) return '';
    if (password.length < 8) {
      return 'Password must be at least 8 characters';
    }
    if (!/[A-Z]/.test(password)) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!/[a-z]/.test(password)) {
      return 'Password must contain at least one lowercase letter';
    }
    if (!/[0-9]/.test(password)) {
      return 'Password must contain at least one number';
    }
    return '';
  };

  const handleChangePassword = async () => {
    if (!auth?.currentUser) {
      Alert.alert('Error', 'No user logged in');
      return;
    }

    // Validate inputs
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    const passwordValidation = validateNewPassword(newPassword);
    if (passwordValidation) {
      setPasswordError(passwordValidation);
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }

    if (currentPassword === newPassword) {
      Alert.alert('Error', 'New password must be different from current password');
      return;
    }

    setIsLoading(true);
    setPasswordError('');

    try {
      // Re-authenticate user
      const credential = EmailAuthProvider.credential(
        auth.currentUser.email!,
        currentPassword
      );
      await reauthenticateWithCredential(auth.currentUser, credential);

      // Update password
      await updatePassword(auth.currentUser, newPassword);

      Alert.alert('Success', 'Password changed successfully', [
        {
          text: 'OK',
          onPress: () => {
            setShowChangePassword(false);
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
          },
        },
      ]);
    } catch (error: any) {
      console.error('Error changing password:', error);
      if (error.code === 'auth/wrong-password') {
        Alert.alert('Error', 'Current password is incorrect');
      } else if (error.code === 'auth/weak-password') {
        Alert.alert('Error', 'New password is too weak');
      } else {
        Alert.alert('Error', 'Failed to change password. Please try again.');
      }
    } finally {
      setIsLoading(false);
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

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone. All your data, including updates, comments, and circle memberships, will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            // Second confirmation
            Alert.alert(
              'Final Confirmation',
              'This will permanently delete your account and all associated data. This cannot be undone. Are you absolutely sure?',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Yes, Delete My Account',
                  style: 'destructive',
                  onPress: async () => {
                    setIsLoading(true);
                    try {
                      await deleteAccount();
                      // User will be automatically signed out after account deletion
                    } catch (error: any) {
                      setIsLoading(false);
                      
                      // Handle re-authentication requirement
                      // Check both error code and message
                      const isReauthRequired = 
                        error.code === 'auth/requires-recent-login' || 
                        error.message === 'REAUTH_REQUIRED' ||
                        error.message?.includes('requires-recent-login');
                      
                      const isAuthRemains = error.message === 'REAUTH_REQUIRED_AUTH_REMAINS';
                      
                      if (isAuthRemains) {
                        // Data was deleted but Auth account remains
                        Alert.alert(
                          'Account Data Deleted',
                          'Your account data has been successfully deleted. However, your authentication account could not be deleted due to security requirements. You have been signed out. If you want to completely remove your authentication account, please contact support or sign in again and try deleting your account.',
                          [{ text: 'OK' }]
                        );
                      } else if (isReauthRequired) {
                        // Check if user is using email/password
                        const providerData = auth?.currentUser?.providerData || [];
                        const providerId = providerData.length > 0 ? providerData[0]?.providerId : null;
                        if (providerId === 'password' && auth?.currentUser?.email) {
                          // Show password input modal
                          setShowReauthModal(true);
                        } else {
                          // For Google/Apple, user needs to sign in again
                          Alert.alert(
                            'Re-authentication Required',
                            'For security, you need to sign in again to delete your account. Please sign out and sign back in, then try deleting your account.',
                            [{ text: 'OK' }]
                          );
                        }
                      } else {
                        Alert.alert(
                          'Error',
                          error.message || 'Failed to delete account. Please try again.',
                          [{ text: 'OK' }]
                        );
                      }
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-blue-50"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header - Fixed outside ScrollView */}
      <View className="bg-white border-b border-gray-200 pt-12 pb-4 px-6">
        <View className="flex-row items-center" style={{ marginTop: 10 }}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
            style={{
              width: 44,
              height: 44,
              justifyContent: 'center',
              alignItems: 'center',
              marginRight: 16,
              backgroundColor: '#f3f4f6',
              borderRadius: 12,
            }}
          >
            <SafeText style={{ fontSize: 24, color: '#374151', fontWeight: '600' }}>←</SafeText>
          </TouchableOpacity>
          <SafeText className="text-3xl font-bold text-gray-900 leading-[40px]" style={{ marginLeft: 4 }}>Settings</SafeText>
        </View>
      </View>
      
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>

        <View className="px-6 py-6">
          {/* User Info */}
          <View className="bg-white rounded-2xl p-6 mb-6 shadow-sm border border-gray-100 py-3">
            <View className="flex-row items-center mb-4">
              <LinearGradient
                colors={['#93c5fd', '#c4b5fd']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: 30,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 16,
                }}
              >
                <SafeText className="text-3xl leading-[40px]">
                  {user?.displayName?.charAt(0).toUpperCase() || 'U'}
                </SafeText>
              </LinearGradient>
              <View className="flex-1">
                <SafeText className="text-xl font-semibold text-gray-900 leading-[30px]">
                  {user?.displayName || 'User'}
                </SafeText>
                <SafeText className="text-base text-gray-500 mt-1 leading-[24px]">
                  {auth?.currentUser?.email}
                </SafeText>
              </View>
            </View>
            <TouchableOpacity
              onPress={() => {
                setEditDisplayName(user?.displayName || '');
                setShowEditDisplayName(true);
              }}
              className="mt-4"
              activeOpacity={0.7}
            >
              <SafeText className="text-blue-600 font-semibold text-sm">
                Edit Display Name
              </SafeText>
            </TouchableOpacity>
          </View>

          {/* Subscription Management Section */}
          <View className="bg-white rounded-2xl p-5 mb-6 shadow-sm border border-gray-100">
            <View className="flex-row items-center mb-4">
              <Ionicons 
                name={subscriptionStatus.isPremium ? "star" : "star-outline"} 
                size={24} 
                color={subscriptionStatus.isPremium ? "#fbbf24" : "#3b82f6"} 
              />
              <View className="flex-1 ml-4">
                <SafeText className="text-lg font-semibold text-gray-900 leading-[26px]">
                  {subscriptionStatus.isPremium ? 'Premium Subscription' : 'Free Plan'}
                </SafeText>
                {subscriptionStatus.isPremium && subscriptionStatus.expirationDate ? (
                  <SafeText className="text-sm text-gray-500 mt-1 leading-[20px]">
                    {formatRenewalText(subscriptionStatus.expirationDate)}
                  </SafeText>
                ) : (
                  <SafeText className="text-sm text-gray-500 mt-1 leading-[20px]">
                    {subscriptionStatus.isPremium ? 'Active' : `${FREE_CIRCLE_LIMIT} circle included`}
                  </SafeText>
                )}
              </View>
            </View>
            
            {subscriptionStatus.isPremium ? (
              <>
                <TouchableOpacity
                  onPress={handleManageSubscription}
                  className="bg-gray-50 rounded-xl p-3 mt-2 border border-gray-100"
                  activeOpacity={0.7}
                >
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center flex-1">
                      <Ionicons name="settings-outline" size={20} color="#3b82f6" />
                      <SafeText className="text-gray-900 font-semibold text-sm ml-2 leading-[20px]">
                        Manage Subscription
                      </SafeText>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={async () => {
                    await refreshSubscription();
                    Alert.alert(
                      'Subscription Info',
                      'If you cancel your subscription, you\'ll keep Premium access until the end of your current billing period. After that, you\'ll be limited to 1 circle.\n\nTo cancel:\n1. Tap "Manage Subscription" above\n2. Or go to Settings → Apple ID → Subscriptions',
                      [{ text: 'OK' }]
                    );
                  }}
                  className="mt-2"
                  activeOpacity={0.7}
                >
                  <SafeText className="text-gray-500 text-xs leading-[16px] text-center">
                    Tap to learn about cancellation
                  </SafeText>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity
                onPress={() => navigation.navigate('Paywall')}
                className="bg-gray-50 rounded-xl p-3 mt-2 border border-gray-100"
                activeOpacity={0.7}
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center flex-1">
                    <Ionicons name="star-outline" size={20} color="#3b82f6" />
                    <SafeText className="text-gray-900 font-semibold text-sm ml-2 leading-[20px]">
                      Upgrade to Premium
                    </SafeText>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
                </View>
              </TouchableOpacity>
            )}
          </View>

          {/* Change Password Section */}
          {!showChangePassword ? (
            <TouchableOpacity
              onPress={() => setShowChangePassword(true)}
              className="bg-white rounded-2xl p-5 mb-6 shadow-sm border border-gray-100 flex-row items-center justify-between"
              activeOpacity={0.7}
            >
              <View className="flex-row items-center flex-1">
                <Ionicons name="lock-closed-outline" size={24} color="#3b82f6" />
                <SafeText className="text-lg font-semibold text-gray-900 ml-4 leading-[26px]">
                  Change Password
                </SafeText>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
            </TouchableOpacity>
          ) : (
            <View className="bg-white rounded-2xl p-6 mb-6 shadow-sm border border-gray-100">
              <View className="flex-row items-center justify-between mb-4">
                <SafeText className="text-xl font-semibold text-gray-900 leading-[30px]">
                  Change Password
                </SafeText>
                <TouchableOpacity
                  onPress={() => {
                    setShowChangePassword(false);
                    setCurrentPassword('');
                    setNewPassword('');
                    setConfirmPassword('');
                    setPasswordError('');
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="close" size={24} color="#6b7280" />
                </TouchableOpacity>
              </View>

              {/* Current Password */}
              <View className="mb-4">
                <SafeText className="text-gray-700 font-semibold mb-2 text-lg leading-[26px]">Current Password</SafeText>
                <View className="bg-gray-50 rounded-xl border border-gray-100 flex-row items-center">
                  <TextInput
                    className="flex-1 px-4 py-3 text-gray-800"
                    placeholder="Enter current password"
                    placeholderTextColor="#9CA3AF"
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                    secureTextEntry={!showCurrentPassword}
                    autoComplete="password"
                    allowFontScaling={false}
                    maxFontSizeMultiplier={1.0}
                    style={{ fontSize: 19 }}
                  />
                  <TouchableOpacity
                    onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="px-4"
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={showCurrentPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color="#6b7280"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* New Password */}
              <View className="mb-4">
                <SafeText className="text-gray-700 font-semibold mb-2 text-lg leading-[26px]">New Password</SafeText>
                <View className="bg-gray-50 rounded-xl border border-gray-100 flex-row items-center">
                  <TextInput
                    className="flex-1 px-4 py-3 text-gray-800"
                    placeholder="Enter new password"
                    placeholderTextColor="#9CA3AF"
                    value={newPassword}
                    onChangeText={(text) => {
                      setNewPassword(text);
                      setPasswordError(validateNewPassword(text));
                    }}
                    onBlur={() => setPasswordError(validateNewPassword(newPassword))}
                    secureTextEntry={!showNewPassword}
                    autoComplete="password-new"
                    allowFontScaling={false}
                    maxFontSizeMultiplier={1.0}
                    style={{ fontSize: 19 }}
                  />
                  <TouchableOpacity
                    onPress={() => setShowNewPassword(!showNewPassword)}
                    className="px-4"
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={showNewPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color="#6b7280"
                    />
                  </TouchableOpacity>
                </View>
                {passwordError ? (
                  <SafeText className="text-red-500 text-base mt-1 leading-[24px]">{passwordError}</SafeText>
                ) : null}
                {!passwordError && newPassword.length > 0 ? (
                  <SafeText className="text-green-600 text-base mt-1 leading-[24px]">
                    ✓ Password meets requirements
                  </SafeText>
                ) : null}
              </View>

              {/* Confirm Password */}
              <View className="mb-6">
                <SafeText className="text-gray-700 font-semibold mb-2 text-lg leading-[26px]">Confirm New Password</SafeText>
                <View className="bg-gray-50 rounded-xl border border-gray-100 flex-row items-center">
                  <TextInput
                    className="flex-1 px-4 py-3 text-gray-800"
                    placeholder="Confirm new password"
                    placeholderTextColor="#9CA3AF"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirmPassword}
                    autoComplete="password-new"
                    allowFontScaling={false}
                    maxFontSizeMultiplier={1.0}
                    style={{ fontSize: 19 }}
                  />
                  <TouchableOpacity
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="px-4"
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color="#6b7280"
                    />
                  </TouchableOpacity>
                </View>
                {confirmPassword && newPassword !== confirmPassword ? (
                  <SafeText className="text-red-500 text-base mt-1 leading-[24px]">
                    Passwords do not match
                  </SafeText>
                ) : null}
              </View>

              {/* Change Password Button */}
              <TouchableOpacity
                onPress={handleChangePassword}
                disabled={isLoading || !!passwordError || newPassword !== confirmPassword}
                style={{
                  opacity: isLoading || !!passwordError || newPassword !== confirmPassword ? 0.7 : 1,
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
                  <SafeText className="text-white font-bold text-lg leading-[26px]">
                    {isLoading ? 'Changing Password...' : 'Change Password'}
                  </SafeText>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {/* About / Disclaimer */}
          <View className="bg-white rounded-2xl p-5 mb-6 shadow-sm border border-gray-100">
            <View className="flex-row items-center mb-3">
              <Ionicons name="information-circle-outline" size={24} color="#3b82f6" />
              <SafeText className="text-lg font-semibold text-gray-900 ml-4 leading-[26px]">
                About CareCircle Connect
              </SafeText>
            </View>
            <SafeText className="text-base text-gray-600 leading-[24px]">
              CareCircle Connect helps families share updates privately — it's not affiliated with any healthcare provider.
            </SafeText>
          </View>

          {/* Sign Out */}
          <TouchableOpacity
            onPress={handleSignOut}
            disabled={isLoading}
            className="bg-white rounded-2xl p-5 mb-6 shadow-sm border border-red-200"
            activeOpacity={0.7}
            style={{ opacity: isLoading ? 0.5 : 1 }}
          >
            <View className="flex-row items-center">
              <Ionicons name="log-out-outline" size={24} color="#ef4444" />
              <SafeText className="text-lg font-semibold text-red-600 ml-4 leading-[26px]">
                Sign Out
              </SafeText>
            </View>
          </TouchableOpacity>

          {/* Delete Account */}
          <TouchableOpacity
            onPress={handleDeleteAccount}
            disabled={isLoading}
            className="bg-white rounded-2xl p-5 shadow-sm border border-red-300"
            activeOpacity={0.7}
            style={{ opacity: isLoading ? 0.5 : 1 }}
          >
            <View className="flex-row items-center">
              <Ionicons name="trash-outline" size={24} color="#dc2626" />
              <View className="flex-1 ml-4">
                <SafeText className="text-lg font-semibold text-red-700 leading-[26px]">
                  Delete Account
                </SafeText>
                <SafeText className="text-sm text-red-600 mt-1 leading-[20px]">
                  Permanently delete your account and all data
                </SafeText>
              </View>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Re-authentication Modal for Account Deletion */}
      <Modal
        visible={showReauthModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowReauthModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{ backgroundColor: 'white', borderRadius: 16, padding: 24, width: '100%', maxWidth: 400 }}>
            <SafeText className="text-xl font-semibold text-gray-900 mb-2">Re-authentication Required</SafeText>
            <SafeText className="text-base text-gray-600 mb-6">
              Please enter your password to confirm account deletion:
            </SafeText>
            
            <View style={{ marginBottom: 20 }}>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: '#e5e7eb',
                  borderRadius: 12,
                  padding: 12,
                  fontSize: 16,
                  backgroundColor: '#f9fafb',
                }}
                placeholder="Password"
                placeholderTextColor="#9ca3af"
                secureTextEntry
                value={reauthPassword}
                onChangeText={setReauthPassword}
                autoFocus
              />
            </View>

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity
                onPress={() => {
                  setShowReauthModal(false);
                  setReauthPassword('');
                }}
                style={{
                  flex: 1,
                  padding: 12,
                  borderRadius: 12,
                  backgroundColor: '#f3f4f6',
                  alignItems: 'center',
                }}
              >
                <SafeText className="text-base font-semibold text-gray-700">Cancel</SafeText>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={async () => {
                  if (!reauthPassword) {
                    Alert.alert('Error', 'Password is required to delete your account.');
                    return;
                  }
                  setShowReauthModal(false);
                  setIsLoading(true);
                  try {
                    await deleteAccount(reauthPassword);
                    setReauthPassword('');
                  } catch (deleteError: any) {
                    setIsLoading(false);
                    setReauthPassword('');
                    Alert.alert(
                      'Error',
                      deleteError.message || 'Failed to delete account. Please try again.',
                      [{ text: 'OK' }]
                    );
                  }
                }}
                style={{
                  flex: 1,
                  padding: 12,
                  borderRadius: 12,
                  backgroundColor: '#ef4444',
                  alignItems: 'center',
                }}
              >
                <SafeText className="text-base font-semibold text-white">Delete</SafeText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
        </Modal>

        {/* Edit Display Name Modal */}
        <Modal
          visible={showEditDisplayName}
          transparent
          animationType="fade"
          onRequestClose={() => setShowEditDisplayName(false)}
        >
          <View style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20,
          }}>
            <View style={{
              backgroundColor: '#ffffff',
              borderRadius: 20,
              padding: 24,
              width: '100%',
              maxWidth: 400,
            }}>
              <SafeText className="text-2xl font-bold text-gray-900 mb-4">
                Edit Display Name
              </SafeText>
              <TextInput
                value={editDisplayName}
                onChangeText={setEditDisplayName}
                placeholder="Enter display name"
                maxLength={50}
                autoFocus
                style={{
                  borderWidth: 1,
                  borderColor: '#d1d5db',
                  borderRadius: 12,
                  padding: 12,
                  fontSize: 16,
                  marginBottom: 20,
                  backgroundColor: '#ffffff',
                }}
              />
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <TouchableOpacity
                  onPress={() => {
                    setShowEditDisplayName(false);
                    setEditDisplayName('');
                  }}
                  style={{
                    flex: 1,
                    padding: 12,
                    borderRadius: 12,
                    backgroundColor: '#f3f4f6',
                    alignItems: 'center',
                  }}
                >
                  <SafeText className="text-base font-semibold text-gray-700">Cancel</SafeText>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={async () => {
                    if (!editDisplayName.trim()) {
                      Alert.alert('Error', 'Display name cannot be empty.');
                      return;
                    }
                    if (editDisplayName.trim().length > 50) {
                      Alert.alert('Error', 'Display name must be 50 characters or less.');
                      return;
                    }
                    setIsLoading(true);
                    try {
                      await updateUserProfile({ displayName: editDisplayName.trim() });
                      setShowEditDisplayName(false);
                      setEditDisplayName('');
                      Alert.alert('Success', 'Display name updated successfully.');
                    } catch (error: any) {
                      Alert.alert('Error', error.message || 'Failed to update display name.');
                    } finally {
                      setIsLoading(false);
                    }
                  }}
                  style={{
                    flex: 1,
                    padding: 12,
                    borderRadius: 12,
                    backgroundColor: '#3b82f6',
                    alignItems: 'center',
                  }}
                >
                  <SafeText className="text-base font-semibold text-white">Save</SafeText>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    );
  };
  
  export default SettingsScreen;

