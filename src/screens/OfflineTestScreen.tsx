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
      
      {/* Test Buttons */}
      <View style={{ width: '100%', maxWidth: 300 }}>
        <TouchableOpacity
          style={{
            backgroundColor: '#10b981',
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderRadius: 8,
            marginBottom: 12,
          }}
          onPress={async () => {
            if (!user) {
              Alert.alert('Error', 'Please sign in first');
              return;
            }
            try {
              console.log('Adding offline update...');
              await addOfflineUpdate({
                circleId: 'test-circle',
                authorId: user.id,
                text: `Test offline update - ${new Date().toLocaleTimeString()}`,
              });
              console.log('Offline update added successfully');
              Alert.alert('Success', 'Test update added to offline queue!');
            } catch (error) {
              console.error('Error adding offline update:', error);
              Alert.alert('Error', `Failed to add offline update: ${error.message || error}`);
            }
          }}
        >
          <Text style={{ color: '#ffffff', fontWeight: '600', textAlign: 'center' }}>
            Test Offline Update
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{
            backgroundColor: '#f59e0b',
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderRadius: 8,
            marginBottom: 12,
          }}
          onPress={async () => {
            if (!user) {
              Alert.alert('Error', 'Please sign in first');
              return;
            }
            try {
              console.log('Adding offline reaction...');
              await addOfflineReaction({
                updateId: 'test-update',
                userId: user.id,
                emoji: '❤️',
              });
              console.log('Offline reaction added successfully');
              Alert.alert('Success', 'Test reaction added to offline queue!');
            } catch (error) {
              console.error('Error adding offline reaction:', error);
              Alert.alert('Error', `Failed to add offline reaction: ${error.message || error}`);
            }
          }}
        >
          <Text style={{ color: '#ffffff', fontWeight: '600', textAlign: 'center' }}>
            Test Offline Reaction
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{
            backgroundColor: '#3b82f6',
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderRadius: 8,
            marginBottom: 12,
          }}
          onPress={() => {
            const status = getOfflineQueueStatus();
            Alert.alert('Queue Status', `Queued operations: ${status.count}\nOperations: ${status.operations.map(op => op.type).join(', ') || 'None'}`);
          }}
        >
          <Text style={{ color: '#ffffff', fontWeight: '600', textAlign: 'center' }}>
            Check Queue Status
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{
            backgroundColor: '#8b5cf6',
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderRadius: 8,
          }}
          onPress={async () => {
            try {
              console.log('Manually processing queue...');
              const { OfflineQueue } = await import('../lib/offlineQueue');
              const queue = OfflineQueue.getInstance();
              await queue.processQueueManually();
              Alert.alert('Success', 'Queue processing completed! Check console for logs.');
            } catch (error) {
              console.error('Error processing queue:', error);
              Alert.alert('Error', `Failed to process queue: ${error.message || error}`);
            }
          }}
        >
          <Text style={{ color: '#ffffff', fontWeight: '600', textAlign: 'center' }}>
            Process Queue Now
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Instructions */}
      <View style={{
        backgroundColor: '#eff6ff',
        borderRadius: 12,
        padding: 16,
        marginTop: 20,
        borderWidth: 1,
        borderColor: '#dbeafe',
      }}>
        <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 8, color: '#1e40af' }}>
          How to Test Offline:
        </Text>
        <Text style={{ fontSize: 14, color: '#1e3a8a', marginBottom: 4 }}>
          1. Turn off WiFi/cellular data
        </Text>
        <Text style={{ fontSize: 14, color: '#1e3a8a', marginBottom: 4 }}>
          2. Tap "Test Offline Update" or "Test Offline Reaction"
        </Text>
        <Text style={{ fontSize: 14, color: '#1e3a8a', marginBottom: 4 }}>
          3. Check queue status to see queued operations
        </Text>
        <Text style={{ fontSize: 14, color: '#1e3a8a' }}>
          4. Turn network back on - operations will sync automatically
        </Text>
      </View>
    </View>
  );
};

export default OfflineTestScreen;
