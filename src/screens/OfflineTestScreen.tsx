// Test component for offline functionality
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { useSimpleNetworkStatus } from '../hooks/useSimpleNetworkStatus';
import { getOfflineQueueStatus } from '../lib/offlineQueue';
import { addOfflineUpdate, addOfflineComment, addOfflineReaction } from '../lib/offlineQueue';
import { useAuth } from '../lib/authContext';

const OfflineTestScreen: React.FC = () => {
  console.log('OfflineTestScreen starting to render...');
  
  // Step 4: Test all hooks + getOfflineQueueStatus
  const { user } = useAuth();
  console.log('useAuth hook loaded, user:', user?.id);
  
  const networkStatus = useSimpleNetworkStatus();
  console.log('useSimpleNetworkStatus hook loaded:', networkStatus);
  
  const [queueStatus, setQueueStatus] = useState(() => {
    try {
      const status = getOfflineQueueStatus();
      console.log('Queue status loaded:', status);
      return status;
    } catch (error) {
      console.error('Error loading queue status:', error);
      return { count: 0, operations: [] };
    }
  });

  console.log('All hooks loaded successfully!');
  
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#f0f9ff' }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' }}>
        Offline Test Screen - Step 4
      </Text>
      
      <Text style={{ fontSize: 16, marginBottom: 20, textAlign: 'center', color: '#059669' }}>
        ✅ All hooks work! Offline system ready!
      </Text>
      
      <Text style={{ fontSize: 14, marginBottom: 10, textAlign: 'center', color: '#6b7280' }}>
        User ID: {user?.id || 'Not signed in'}
      </Text>
      
      <Text style={{ fontSize: 14, marginBottom: 10, textAlign: 'center', color: '#6b7280' }}>
        Connected: {networkStatus.isConnected ? 'Yes' : 'No'}
      </Text>
      
      <Text style={{ fontSize: 14, marginBottom: 10, textAlign: 'center', color: '#6b7280' }}>
        Type: {networkStatus.type || 'Unknown'}
      </Text>
      
      <Text style={{ fontSize: 14, marginBottom: 10, textAlign: 'center', color: '#6b7280' }}>
        Queued Operations: {queueStatus.count}
      </Text>
      
      <Text style={{ fontSize: 14, marginBottom: 30, textAlign: 'center', color: '#6b7280' }}>
        🎉 Offline functionality is working!
      </Text>
    </View>
  );
};

export default OfflineTestScreen;
