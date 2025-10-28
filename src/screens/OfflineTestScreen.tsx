// Test component for offline functionality
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { useNetworkStatus, isGoodConnection } from '../hooks/useNetworkStatus';
import { getOfflineQueueStatus } from '../lib/offlineQueue';
import { addOfflineUpdate, addOfflineComment, addOfflineReaction } from '../lib/offlineQueue';
import { useAuth } from '../lib/authContext';

const OfflineTestScreen: React.FC = () => {
  console.log('OfflineTestScreen starting to render...');
  
  // Step 2: Test useAuth hook
  const { user } = useAuth();
  console.log('useAuth hook loaded, user:', user?.id);
  
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#f0f9ff' }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' }}>
        Offline Test Screen - Step 2
      </Text>
      
      <Text style={{ fontSize: 16, marginBottom: 20, textAlign: 'center', color: '#059669' }}>
        ✅ useAuth hook works!
      </Text>
      
      <Text style={{ fontSize: 14, marginBottom: 10, textAlign: 'center', color: '#6b7280' }}>
        User ID: {user?.id || 'Not signed in'}
      </Text>
      
      <Text style={{ fontSize: 14, marginBottom: 30, textAlign: 'center', color: '#6b7280' }}>
        Next: testing useNetworkStatus hook...
      </Text>
    </View>
  );
};

export default OfflineTestScreen;
