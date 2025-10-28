// Simple test screen to debug navigation issue
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types';

type SimpleTestNavigationProp = StackNavigationProp<RootStackParamList, 'OfflineTest'>;

const SimpleOfflineTestScreen: React.FC = () => {
  const navigation = useNavigation<SimpleTestNavigationProp>();
  
  console.log('SimpleOfflineTestScreen rendered!');

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#f0f9ff' }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' }}>
        Simple Test Screen
      </Text>
      
      <Text style={{ fontSize: 16, marginBottom: 20, textAlign: 'center', color: '#059669' }}>
        ✅ This screen loaded successfully!
      </Text>
      
      <Text style={{ fontSize: 14, marginBottom: 30, textAlign: 'center', color: '#6b7280' }}>
        If you can see this, navigation is working.
      </Text>
      
      <TouchableOpacity
        style={{
          backgroundColor: '#3b82f6',
          paddingHorizontal: 20,
          paddingVertical: 12,
          borderRadius: 8,
        }}
        onPress={() => navigation.goBack()}
      >
        <Text style={{ color: '#ffffff', fontWeight: '600' }}>
          Go Back
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default SimpleOfflineTestScreen;
