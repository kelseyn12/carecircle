// Sign-in screen for user authentication
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
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
      className="flex-1 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50" 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        className="flex-1" 
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="px-6 py-8">
          {/* Header */}
          <View className="items-center mb-12">
            <View className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl items-center justify-center mb-6 shadow-xl">
              <Text className="text-4xl">💙</Text>
            </View>
            <Text className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent text-center">
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
                className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl py-5 mt-8 shadow-lg"
                onPress={isSignUp ? handleSignUp : handleSignIn}
                disabled={isLoading}
                style={{ opacity: isLoading ? 0.7 : 1 }}
              >
                <Text className="text-white text-center font-bold text-lg">
                  {isLoading 
                    ? (isSignUp ? 'Creating Account...' : 'Signing in...') 
                    : (isSignUp ? 'Create Account' : 'Sign In')
                  }
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="bg-gray-100 rounded-2xl py-4"
                onPress={() => setIsSignUp(!isSignUp)}
                disabled={isLoading}
                style={{ opacity: isLoading ? 0.7 : 1 }}
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
              
              <View className="space-y-3">
                <TouchableOpacity
                  className="bg-white border-2 border-gray-200 rounded-2xl py-4 flex-row items-center justify-center shadow-sm"
                  disabled={isLoading}
                  style={{ opacity: isLoading ? 0.7 : 1 }}
                >
                  <Text className="text-xl mr-3">🔍</Text>
                  <Text className="text-gray-700 font-semibold text-base">Google</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  className="bg-black rounded-2xl py-4 flex-row items-center justify-center shadow-sm"
                  disabled={isLoading}
                  style={{ opacity: isLoading ? 0.7 : 1 }}
                >
                  <Text className="text-white text-xl mr-3">🍎</Text>
                  <Text className="text-white font-semibold text-base">Apple</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Footer */}
          <View className="mt-8 items-center">
            <Text className="text-gray-500 text-sm text-center leading-relaxed">
              By continuing, you agree to our Terms of Service and Privacy Policy
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default SignInScreen;
