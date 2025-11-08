// Settings screen for user account management
import React, { useState } from 'react';
import { View, TouchableOpacity, Alert, ScrollView, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types';
import { useAuth } from '../lib/authContext';
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { auth } from '../lib/firebase';
import SafeText from '../components/SafeText';

type SettingsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Settings'>;

const SettingsScreen: React.FC = () => {
  const navigation = useNavigation<SettingsScreenNavigationProp>();
  const { user, signOut } = useAuth();
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');

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
            className="bg-white rounded-2xl p-5 shadow-sm border border-red-200"
            activeOpacity={0.7}
          >
            <View className="flex-row items-center">
              <Ionicons name="log-out-outline" size={24} color="#ef4444" />
              <SafeText className="text-lg font-semibold text-red-600 ml-4 leading-[26px]">
                Sign Out
              </SafeText>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default SettingsScreen;

