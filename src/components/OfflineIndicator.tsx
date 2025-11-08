// Offline indicator component
import React from 'react';
import { View, TouchableOpacity, Animated } from 'react-native';
import { useNetworkStatus, isGoodConnection } from '../hooks/useNetworkStatus';
import { getOfflineQueueStatus } from '../lib/offlineQueue';
import { EMOJIS } from '../utils/emojiUtils';
import SafeText from './SafeText';

interface OfflineIndicatorProps {
  onPress?: () => void;
}

const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({ onPress }) => {
  const networkStatus = useNetworkStatus();
  const queueStatus = getOfflineQueueStatus();
  const isOnline = isGoodConnection(networkStatus);

  // Don't show indicator if online and no queued operations
  if (isOnline && queueStatus.count === 0) {
    return null;
  }

  const getIndicatorContent = () => {
    if (!isOnline) {
      return {
        text: 'You\'re offline',
        subtext: queueStatus.count > 0 ? `${queueStatus.count} update${queueStatus.count !== 1 ? 's' : ''} queued` : 'Updates will sync when online',
        backgroundColor: '#fef2f2',
        borderColor: '#fecaca',
        textColor: '#dc2626',
        emoji: EMOJIS.WARNING,
      };
    } else if (queueStatus.count > 0) {
      return {
        text: 'Syncing updates...',
        subtext: `${queueStatus.count} update${queueStatus.count !== 1 ? 's' : ''} being sent`,
        backgroundColor: '#eff6ff',
        borderColor: '#dbeafe',
        textColor: '#2563eb',
        emoji: EMOJIS.ARROW_UP,
      };
    }
    return null;
  };

  const content = getIndicatorContent();
  if (!content) return null;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={{
        backgroundColor: content.backgroundColor,
        borderWidth: 1,
        borderColor: content.borderColor,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginHorizontal: 16,
        marginVertical: 8,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
      }}
    >
      <View style={{
        width: 32,
        height: 32,
        backgroundColor: content.textColor,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
      }}>
        <SafeText style={{ fontSize: 16 }}>{content.emoji}</SafeText>
      </View>
      
      <View style={{ flex: 1 }}>
        <SafeText style={{
          color: content.textColor,
          fontSize: 14,
          fontWeight: '600',
          marginBottom: 2,
        }}>
          {content.text}
        </SafeText>
        <SafeText style={{
          color: content.textColor,
          fontSize: 12,
          opacity: 0.8,
        }}>
          {content.subtext}
        </SafeText>
      </View>

      {onPress && (
        <View style={{
          width: 24,
          height: 24,
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          <SafeText style={{
            color: content.textColor,
            fontSize: 16,
            fontWeight: 'bold',
          }}>
            →
          </SafeText>
        </View>
      )}
    </TouchableOpacity>
  );
};

export default OfflineIndicator;
