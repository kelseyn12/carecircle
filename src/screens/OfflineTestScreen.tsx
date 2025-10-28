// Test component for offline functionality
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { useNetworkStatus, isGoodConnection } from '../hooks/useNetworkStatus';
import { getOfflineQueueStatus } from '../lib/offlineQueue';
import { addOfflineUpdate, addOfflineComment, addOfflineReaction } from '../lib/offlineQueue';
import { useAuth } from '../lib/authContext';

const OfflineTestScreen: React.FC = () => {
  const networkStatus = useNetworkStatus();
  const { user } = useAuth();
  const [queueStatus, setQueueStatus] = useState(getOfflineQueueStatus());

  const refreshQueueStatus = () => {
    setQueueStatus(getOfflineQueueStatus());
  };

  const testOfflineUpdate = async () => {
    if (!user) {
      Alert.alert('Error', 'Please sign in first');
      return;
    }

    try {
      await addOfflineUpdate({
        circleId: 'test-circle',
        authorId: user.id,
        text: `Test offline update - ${new Date().toLocaleTimeString()}`,
      });
      refreshQueueStatus();
      Alert.alert('Success', 'Test update added to offline queue');
    } catch (error) {
      Alert.alert('Error', 'Failed to add offline update');
    }
  };

  const testOfflineComment = async () => {
    if (!user) {
      Alert.alert('Error', 'Please sign in first');
      return;
    }

    try {
      await addOfflineComment({
        updateId: 'test-update',
        authorId: user.id,
        text: `Test offline comment - ${new Date().toLocaleTimeString()}`,
      });
      refreshQueueStatus();
      Alert.alert('Success', 'Test comment added to offline queue');
    } catch (error) {
      Alert.alert('Error', 'Failed to add offline comment');
    }
  };

  const testOfflineReaction = async () => {
    if (!user) {
      Alert.alert('Error', 'Please sign in first');
      return;
    }

    try {
      await addOfflineReaction({
        updateId: 'test-update',
        userId: user.id,
        emoji: '❤️',
      });
      refreshQueueStatus();
      Alert.alert('Success', 'Test reaction added to offline queue');
    } catch (error) {
      Alert.alert('Error', 'Failed to add offline reaction');
    }
  };

  const isOnline = isGoodConnection(networkStatus);

  return (
    <View style={{ flex: 1, padding: 20, backgroundColor: '#f9fafb' }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' }}>
        Offline Functionality Test
      </Text>

      {/* Network Status */}
      <View style={{
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
      }}>
        <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 12 }}>
          Network Status
        </Text>
        <Text style={{ fontSize: 16, marginBottom: 4 }}>
          Connected: {isOnline ? '✅ Yes' : '❌ No'}
        </Text>
        <Text style={{ fontSize: 16, marginBottom: 4 }}>
          Type: {networkStatus.type || 'Unknown'}
        </Text>
        <Text style={{ fontSize: 16 }}>
          Internet Reachable: {networkStatus.isInternetReachable === null ? 'Unknown' : networkStatus.isInternetReachable ? 'Yes' : 'No'}
        </Text>
      </View>

      {/* Queue Status */}
      <View style={{
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
      }}>
        <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 12 }}>
          Offline Queue Status
        </Text>
        <Text style={{ fontSize: 16, marginBottom: 4 }}>
          Queued Operations: {queueStatus.count}
        </Text>
        {queueStatus.operations.length > 0 && (
          <View style={{ marginTop: 8 }}>
            <Text style={{ fontSize: 14, fontWeight: '600', marginBottom: 4 }}>
              Operations:
            </Text>
            {queueStatus.operations.map((op, index) => (
              <Text key={index} style={{ fontSize: 12, color: '#6b7280', marginBottom: 2 }}>
                • {op.type} (retry: {op.retryCount})
              </Text>
            ))}
          </View>
        )}
        <TouchableOpacity
          style={{
            backgroundColor: '#3b82f6',
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 8,
            marginTop: 12,
          }}
          onPress={refreshQueueStatus}
        >
          <Text style={{ color: '#ffffff', fontWeight: '600' }}>
            Refresh Status
          </Text>
        </TouchableOpacity>
      </View>

      {/* Test Buttons */}
      <View style={{
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
      }}>
        <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 12 }}>
          Test Offline Operations
        </Text>
        
        <TouchableOpacity
          style={{
            backgroundColor: '#10b981',
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderRadius: 8,
            marginBottom: 12,
          }}
          onPress={testOfflineUpdate}
        >
          <Text style={{ color: '#ffffff', fontWeight: '600', textAlign: 'center' }}>
            Add Test Update to Queue
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
          onPress={testOfflineComment}
        >
          <Text style={{ color: '#ffffff', fontWeight: '600', textAlign: 'center' }}>
            Add Test Comment to Queue
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{
            backgroundColor: '#ef4444',
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderRadius: 8,
          }}
          onPress={testOfflineReaction}
        >
          <Text style={{ color: '#ffffff', fontWeight: '600', textAlign: 'center' }}>
            Add Test Reaction to Queue
          </Text>
        </TouchableOpacity>
      </View>

      {/* Instructions */}
      <View style={{
        backgroundColor: '#eff6ff',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#dbeafe',
      }}>
        <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 8, color: '#1e40af' }}>
          How to Test:
        </Text>
        <Text style={{ fontSize: 14, color: '#1e3a8a', marginBottom: 4 }}>
          1. Turn off WiFi/cellular data
        </Text>
        <Text style={{ fontSize: 14, color: '#1e3a8a', marginBottom: 4 }}>
          2. Add operations to queue (they'll be stored offline)
        </Text>
        <Text style={{ fontSize: 14, color: '#1e3a8a', marginBottom: 4 }}>
          3. Turn network back on
        </Text>
        <Text style={{ fontSize: 14, color: '#1e3a8a' }}>
          4. Watch operations sync automatically
        </Text>
      </View>
    </View>
  );
};

export default OfflineTestScreen;
