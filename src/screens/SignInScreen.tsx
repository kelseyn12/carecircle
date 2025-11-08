// Sign-in screen for user authentication
import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackParamList } from '../types';
import { useAuth } from '../lib/authContext';
import { z } from 'zod';
import SafeText from '../components/SafeText';

type SignInScreenNavigationProp = StackNavigationProp<RootStackParamList, 'SignIn'>;

// Validation schemas
const signInSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const signUpSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  displayName: z.string().min(1, 'Display name is required').max(50, 'Display name too long'),
});

// Real-time email validation
const validateEmail = (email: string): string => {
  if (!email) return '';
  try {
    z.string().email().parse(email);
    return '';
  } catch {
    return 'Please enter a valid email address';
  }
};

// Real-time password validation
const validatePassword = (password: string, isSignUp: boolean): string => {
  if (!password) return '';
  if (!isSignUp) return '';
  
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

const SignInScreen: React.FC = () => {
  const navigation = useNavigation<SignInScreenNavigationProp>();
  const { signIn, signUp, signInWithGoogle, signInWithApple } = useAuth();
  const insets = useSafeAreaInsets();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Handle sign in
  const handleSignIn = async () => {
    try {
      // Validate form data
      const validatedData = signInSchema.parse({ email, password });
      
      setIsLoading(true);
      await signIn(validatedData.email, validatedData.password);
      // Navigation will be handled by AuthProvider
    } catch (error) {
      if (error instanceof z.ZodError) {
        Alert.alert('Validation Error', error.errors[0].message);
      } else {
        Alert.alert('Sign In Error', error instanceof Error ? error.message : 'Failed to sign in. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle sign up
  const handleSignUp = async () => {
    try {
      // Validate form data
      const validatedData = signUpSchema.parse({ email, password, displayName });
      
      setIsLoading(true);
      await signUp(validatedData.email, validatedData.password, validatedData.displayName);
      // Navigation will be handled by AuthProvider
    } catch (error) {
      if (error instanceof z.ZodError) {
        Alert.alert('Validation Error', error.errors[0].message);
      } else {
        Alert.alert('Sign Up Error', error instanceof Error ? error.message : 'Failed to create account. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      className="flex-1 bg-blue-50" 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        className="flex-1" 
        contentContainerStyle={{ 
          flexGrow: 1, 
          paddingTop: Math.max(insets.top + 40, 80),
          paddingBottom: 40,
          paddingHorizontal: 24
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="items-center mb-10 px-2 py-2">
          <LinearGradient
            colors={['#93c5fd', '#c4b5fd']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              width: 96,
              height: 96,
              borderRadius: 24,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 24,
              shadowColor: '#3b82f6',
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.25,
              shadowRadius: 12,
              elevation: 10,
            }}
          >
            <SafeText className="text-5xl leading-[55px]">💙</SafeText>
          </LinearGradient>
          <SafeText className="text-5xl font-bold text-blue-600 text-center px-1 leading-[55px]">
            Care Circle
          </SafeText>
          <SafeText className="text-xl text-gray-600 text-center mt-4 leading-[30px]">
            Share updates with your loved ones
          </SafeText>
        </View>

        <View className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100">
            <View className="space-y-6">
              {/* Display Name field for sign up */}
              {isSignUp && (
                <View>
                  <SafeText className="text-gray-700 font-semibold mb-3 text-lg leading-[26px]">Display Name</SafeText>
                  <View className="bg-gray-50 rounded-2xl border border-gray-100">
                    <TextInput
                      className="px-5 py-4 text-gray-800 text-base"
                      placeholder="Enter your name"
                      placeholderTextColor="#9CA3AF"
                      value={displayName}
                      onChangeText={setDisplayName}
                      autoCapitalize="words"
                      autoComplete="name"
                      allowFontScaling={false}
                      maxFontSizeMultiplier={1.0}
                      style={{ fontSize: 19 }}
                    />
                  </View>
                </View>
              )}

              <View>
                <SafeText className="text-gray-700 font-semibold mb-3 text-lg leading-[26px]">Email</SafeText>
                <View className={`bg-gray-50 rounded-2xl border ${emailError ? 'border-red-300' : 'border-gray-100'}`}>
                  <TextInput
                    className="px-5 py-4 text-gray-800 text-base"
                    placeholder="Enter your email"
                    placeholderTextColor="#9CA3AF"
                    value={email}
                    onChangeText={(text) => {
                      setEmail(text);
                      setEmailError(validateEmail(text));
                    }}
                    onBlur={() => setEmailError(validateEmail(email))}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    allowFontScaling={false}
                    maxFontSizeMultiplier={1.0}
                    style={{ fontSize: 19 }}
                  />
                </View>
                {emailError ? (
                  <SafeText className="text-red-500 text-base mt-1 ml-1 leading-[24px]">{emailError}</SafeText>
                ) : null}
              </View>

              <View>
                <SafeText className="text-gray-700 font-semibold mb-3 text-lg leading-[26px]">Password</SafeText>
                <View className={`bg-gray-50 rounded-2xl border ${passwordError ? 'border-red-300' : 'border-gray-100'} flex-row items-center`}>
                  <TextInput
                    className="flex-1 px-5 py-4 text-gray-800 text-base"
                    placeholder="Enter your password"
                    placeholderTextColor="#9CA3AF"
                    value={password}
                    onChangeText={(text) => {
                      setPassword(text);
                      setPasswordError(validatePassword(text, isSignUp));
                    }}
                    onBlur={() => setPasswordError(validatePassword(password, isSignUp))}
                    secureTextEntry={!showPassword}
                    autoComplete="password"
                    allowFontScaling={false}
                    maxFontSizeMultiplier={1.0}
                    style={{ fontSize: 19 }}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    className="px-4 py-4"
                    activeOpacity={0.7}
                  >
                    <Ionicons 
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'} 
                      size={20} 
                      color="#6b7280" 
                    />
                  </TouchableOpacity>
                </View>
                {passwordError ? (
                  <SafeText className="text-red-500 text-base mt-1 ml-1 leading-[24px]">{passwordError}</SafeText>
                ) : null}
                {isSignUp && !passwordError && password.length > 0 ? (
                  <SafeText className="text-green-600 text-base mt-1 ml-1 leading-[24px]">✓ Password meets requirements</SafeText>
                ) : null}
              </View>

              <TouchableOpacity
                onPress={isSignUp ? handleSignUp : handleSignIn}
                disabled={isLoading}
                style={{ 
                  opacity: isLoading ? 0.7 : 1,
                  marginTop: 32,
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
                    paddingVertical: 16,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <SafeText className="text-white text-center font-bold text-xl leading-[30px]">
                    {isLoading 
                      ? (isSignUp ? 'Creating Account...' : 'Signing in...') 
                      : (isSignUp ? 'Create Account' : 'Sign In')
                    }
                  </SafeText>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setIsSignUp(!isSignUp)}
                disabled={isLoading}
                style={{
                  backgroundColor: '#f3f4f6',
                  borderRadius: 16,
                  paddingVertical: 16,
                  opacity: isLoading ? 0.7 : 1,
                }}
              >
                <SafeText className="text-gray-700 text-center font-semibold text-lg leading-[26px]">
                  {isSignUp ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
                </SafeText>
              </TouchableOpacity>
            </View>

            {/* Social login section */}
            <View className="mt-8">
              <View className="flex-row items-center mb-6">
                <View className="flex-1 h-px bg-gray-200" />
                <SafeText className="mx-4 text-gray-500 font-medium text-base leading-[24px]">Or continue with</SafeText>
                <View className="flex-1 h-px bg-gray-200" />
              </View>
              
              <View style={{ gap: 12 }}>
                {/* Apple Sign In Button - Placed first per Apple guidelines */}
                {Platform.OS === 'ios' && (
                  <TouchableOpacity
                    disabled={isLoading}
                    onPress={async () => {
                      try {
                        setIsLoading(true);
                        await signInWithApple();
                      } catch (error) {
                        Alert.alert('Error', error instanceof Error ? error.message : 'Failed to sign in with Apple.');
                      } finally {
                        setIsLoading(false);
                      }
                    }}
                    style={{
                      backgroundColor: '#000000',
                      borderRadius: 8,
                      paddingVertical: 12,
                      paddingHorizontal: 16,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: isLoading ? 0.7 : 1,
                      minHeight: 44,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.2,
                      shadowRadius: 2,
                      elevation: 2,
                    }}
                    activeOpacity={0.8}
                  >
                    {/* Apple Logo - SVG path for proper Apple logo */}
                    <View style={{ marginRight: 8, width: 18, height: 18, justifyContent: 'center', alignItems: 'center' }}>
                      <Ionicons name="logo-apple" size={18} color="#ffffff" />
                    </View>
                    <SafeText className="text-white font-medium text-lg leading-[26px]" style={{ letterSpacing: 0.2 }}>
                      Sign in with Apple
                    </SafeText>
                  </TouchableOpacity>
                )}

                {/* Google Sign In Button */}
                <TouchableOpacity
                  disabled={isLoading}
                  onPress={async () => {
                    try {
                      setIsLoading(true);
                      await signInWithGoogle();
                    } catch (error) {
                      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to sign in with Google.');
                    } finally {
                      setIsLoading(false);
                    }
                  }}
                  style={{
                    backgroundColor: '#ffffff',
                    borderWidth: 1,
                    borderColor: '#dadce0',
                    borderRadius: 8,
                    paddingVertical: 12,
                    paddingHorizontal: 16,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: isLoading ? 0.7 : 1,
                    minHeight: 44,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.1,
                    shadowRadius: 2,
                    elevation: 2,
                  }}
                  activeOpacity={0.8}
                >
                  {/* Google "G" Logo - Official Google colors */}
                  <View style={{
                    width: 20,
                    height: 20,
                    marginRight: 12,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}>
                    <View style={{
                      width: 20,
                      height: 20,
                      borderRadius: 2,
                      overflow: 'hidden',
                      position: 'relative',
                    }}>
                      {/* Google G logo using colored squares */}
                      <View style={{ position: 'absolute', width: 10, height: 10, backgroundColor: '#4285F4', top: 0, left: 0 }} />
                      <View style={{ position: 'absolute', width: 10, height: 10, backgroundColor: '#34A853', top: 0, right: 0 }} />
                      <View style={{ position: 'absolute', width: 10, height: 10, backgroundColor: '#FBBC05', bottom: 0, left: 0 }} />
                      <View style={{ position: 'absolute', width: 10, height: 10, backgroundColor: '#EA4335', bottom: 0, right: 0 }} />
                      <View style={{ 
                        position: 'absolute', 
                        top: 2, 
                        left: 2, 
                        width: 6, 
                        height: 6, 
                        backgroundColor: '#ffffff',
                        borderRadius: 1,
                      }} />
                    </View>
                  </View>
                  <SafeText className="text-gray-800 font-medium text-lg leading-[26px]" style={{ letterSpacing: 0.1 }}>
                    Sign in with Google
                  </SafeText>
                </TouchableOpacity>
              </View>
            </View>
          </View>

        {/* Footer */}
        <View style={{ marginTop: 32, marginBottom: 20, paddingHorizontal: 16 }}>
          <SafeText className="text-gray-500 text-center text-base leading-[24px]">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </SafeText>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default SignInScreen;
