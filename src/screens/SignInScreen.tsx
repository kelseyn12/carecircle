// Sign-in screen for user authentication
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types';
import { useAuth } from '../lib/authContext';
import { z } from 'zod';

type SignInScreenNavigationProp = StackNavigationProp<RootStackParamList, 'SignIn'>;

// Validation schemas
const signInSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const signUpSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  displayName: z.string().min(1, 'Display name is required').max(50, 'Display name too long'),
});

const SignInScreen: React.FC = () => {
  const navigation = useNavigation<SignInScreenNavigationProp>();
  const { signIn, signUp } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

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
        contentContainerStyle={{ flexGrow: 1, paddingTop: 60, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="px-6 py-6">
          {/* Header */}
          <View className="items-center mb-10">
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
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 8,
                elevation: 8,
              }}
            >
              <Text className="text-4xl">💙</Text>
            </LinearGradient>
            <Text className="text-4xl font-bold text-blue-600 text-center">
              Care Circle
            </Text>
            <Text className="text-lg text-gray-600 text-center mt-3 leading-relaxed">
              Share updates with your loved ones
            </Text>
          </View>

          <View className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100">
            <View className="space-y-6">
              {/* Display Name field for sign up */}
              {isSignUp && (
                <View>
                  <Text className="text-gray-700 font-semibold mb-3 text-base">Display Name</Text>
                  <View className="bg-gray-50 rounded-2xl border border-gray-100">
                    <TextInput
                      className="px-5 py-4 text-gray-800 text-base"
                      placeholder="Enter your name"
                      placeholderTextColor="#9CA3AF"
                      value={displayName}
                      onChangeText={setDisplayName}
                      autoCapitalize="words"
                      autoComplete="name"
                    />
                  </View>
                </View>
              )}

              <View>
                <Text className="text-gray-700 font-semibold mb-3 text-base">Email</Text>
                <View className="bg-gray-50 rounded-2xl border border-gray-100">
                  <TextInput
                    className="px-5 py-4 text-gray-800 text-base"
                    placeholder="Enter your email"
                    placeholderTextColor="#9CA3AF"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                  />
                </View>
              </View>

              <View>
                <Text className="text-gray-700 font-semibold mb-3 text-base">Password</Text>
                <View className="bg-gray-50 rounded-2xl border border-gray-100">
                  <TextInput
                    className="px-5 py-4 text-gray-800 text-base"
                    placeholder="Enter your password"
                    placeholderTextColor="#9CA3AF"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    autoComplete="password"
                  />
                </View>
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
                  <Text className="text-white text-center font-bold text-lg">
                    {isLoading 
                      ? (isSignUp ? 'Creating Account...' : 'Signing in...') 
                      : (isSignUp ? 'Create Account' : 'Sign In')
                    }
                  </Text>
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
                <Text className="text-gray-700 text-center font-semibold text-base">
                  {isSignUp ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Social login section */}
            <View className="mt-8">
              <View className="flex-row items-center mb-6">
                <View className="flex-1 h-px bg-gray-200" />
                <Text className="mx-4 text-gray-500 font-medium text-sm">Or continue with</Text>
                <View className="flex-1 h-px bg-gray-200" />
              </View>
              
              <View style={{ gap: 12 }}>
                {/* Google Sign In Button */}
                <TouchableOpacity
                  disabled={isLoading}
                  onPress={() => {
                    Alert.alert(
                      'Coming Soon',
                      'Google Sign In will be available soon. Please use email/password for now.',
                      [{ text: 'OK' }]
                    );
                  }}
                  style={{
                    backgroundColor: '#ffffff',
                    borderWidth: 1,
                    borderColor: '#dadce0',
                    borderRadius: 4,
                    paddingVertical: 11,
                    paddingHorizontal: 16,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: isLoading ? 0.7 : 1,
                    minHeight: 40,
                  }}
                  activeOpacity={0.7}
                >
                  {/* Google "G" Logo - multi-colored Google style */}
                  <View style={{
                    width: 18,
                    height: 18,
                    borderRadius: 2,
                    marginRight: 12,
                    overflow: 'hidden',
                    position: 'relative',
                  }}>
                    <LinearGradient
                      colors={['#4285F4', '#34A853', '#FBBC05', '#EA4335']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={{
                        width: '100%',
                        height: '100%',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text style={{ color: '#ffffff', fontSize: 10, fontWeight: 'bold' }}>G</Text>
                    </LinearGradient>
                  </View>
                  <Text style={{ 
                    color: '#3c4043', 
                    fontWeight: '500', 
                    fontSize: 14,
                    letterSpacing: 0.25,
                  }}>
                    Sign in with Google
                  </Text>
                </TouchableOpacity>

                {/* Apple Sign In Button */}
                <TouchableOpacity
                  disabled={isLoading}
                  onPress={() => {
                    Alert.alert(
                      'Coming Soon',
                      'Apple Sign In will be available soon. Please use email/password for now.',
                      [{ text: 'OK' }]
                    );
                  }}
                  style={{
                    backgroundColor: '#000000',
                    borderRadius: 6,
                    paddingVertical: 11,
                    paddingHorizontal: 16,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: isLoading ? 0.7 : 1,
                    minHeight: 40,
                  }}
                  activeOpacity={0.7}
                >
                  {/* Apple Logo - white outline style */}
                  <Text style={{ 
                    fontSize: 16, 
                    marginRight: 8, 
                    color: '#ffffff',
                    lineHeight: 20,
                  }}>🍎</Text>
                  <Text style={{ 
                    color: '#ffffff', 
                    fontWeight: '400', 
                    fontSize: 15,
                    letterSpacing: 0.3,
                  }}>
                    Sign in with Apple
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Footer */}
          <View style={{ marginTop: 32, marginBottom: 20, paddingHorizontal: 16 }}>
            <Text style={{ color: '#6b7280', fontSize: 13, textAlign: 'center', lineHeight: 20 }}>
              By continuing, you agree to our Terms of Service and Privacy Policy
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default SignInScreen;
