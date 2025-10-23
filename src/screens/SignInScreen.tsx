// Sign-in screen for user authentication
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types';
import { useAuth } from '../lib/authContext';
import { z } from 'zod';

type SignInScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'SignIn'>;

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
      className="flex-1 bg-gray-50" 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        className="flex-1" 
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="px-6 py-8">
          <View className="bg-white rounded-2xl p-6 shadow-sm">
            <Text className="text-3xl font-bold text-gray-800 text-center mb-2">
              Care Circle
            </Text>
            
            <Text className="text-lg text-gray-600 text-center mb-8">
              Share updates with your loved ones
            </Text>

            <View className="space-y-4">
              {/* Display Name field for sign up */}
              {isSignUp && (
                <View>
                  <Text className="text-gray-700 mb-2">Display Name</Text>
                  <TextInput
                    className="border border-gray-300 rounded-xl px-4 py-3 text-gray-800"
                    placeholder="Enter your name"
                    value={displayName}
                    onChangeText={setDisplayName}
                    autoCapitalize="words"
                    autoComplete="name"
                  />
                </View>
              )}

              <View>
                <Text className="text-gray-700 mb-2">Email</Text>
                <TextInput
                  className="border border-gray-300 rounded-xl px-4 py-3 text-gray-800"
                  placeholder="Enter your email"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                />
              </View>

              <View>
                <Text className="text-gray-700 mb-2">Password</Text>
                <TextInput
                  className="border border-gray-300 rounded-xl px-4 py-3 text-gray-800"
                  placeholder="Enter your password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoComplete="password"
                />
              </View>

              <TouchableOpacity
                className="bg-blue-500 rounded-xl py-4 mt-6"
                onPress={isSignUp ? handleSignUp : handleSignIn}
                disabled={isLoading}
              >
                <Text className="text-white text-center font-semibold text-lg">
                  {isLoading 
                    ? (isSignUp ? 'Creating Account...' : 'Signing in...') 
                    : (isSignUp ? 'Create Account' : 'Sign In')
                  }
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="bg-gray-100 rounded-xl py-4"
                onPress={() => setIsSignUp(!isSignUp)}
                disabled={isLoading}
              >
                <Text className="text-gray-700 text-center font-semibold text-lg">
                  {isSignUp ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Social login section */}
            <View className="mt-6">
              <Text className="text-gray-500 text-center mb-4">Or continue with</Text>
              <View className="space-y-3">
                {/* TODO: Add Google Sign-In */}
                <TouchableOpacity
                  className="bg-white border border-gray-300 rounded-xl py-3 flex-row items-center justify-center"
                  disabled={isLoading}
                >
                  <Text className="text-lg mr-2">🔍</Text>
                  <Text className="text-gray-700 font-medium">Google</Text>
                </TouchableOpacity>

                {/* TODO: Add Apple Sign-In */}
                <TouchableOpacity
                  className="bg-black rounded-xl py-3 flex-row items-center justify-center"
                  disabled={isLoading}
                >
                  <Text className="text-white text-lg mr-2">🍎</Text>
                  <Text className="text-white font-medium">Apple</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default SignInScreen;
