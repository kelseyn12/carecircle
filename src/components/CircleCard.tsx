// Circle card component for displaying circle information
import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Circle } from '../types';
import { EMOJIS } from '../utils/emojiUtils';
import SafeText from './SafeText';

interface CircleCardProps {
  circle: Circle;
  onPress: () => void;
  hasNew?: boolean;
}

const CircleCard: React.FC<CircleCardProps> = ({ circle, onPress, hasNew }) => {
  const memberCount = circle.members.length;
  
  // Format creation date
  const formatDate = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      className="bg-white rounded-2xl p-4 mb-4 border border-gray-200 shadow-sm"
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-1">
          <View className="flex-row items-center mb-3">
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                backgroundColor: '#dbeafe',
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: 12,
              }}
            >
              <SafeText className="text-lg text-blue-700 font-bold">{EMOJIS.PEOPLE}</SafeText>
            </View>
            <SafeText className="text-lg font-bold text-gray-800 flex-1">
              {circle.title}
            </SafeText>
            {hasNew && <View className="w-2 h-2 bg-red-500 rounded-full ml-2" />}
          </View>
          
          <View className="flex-row items-center mb-2">
            <View className="bg-blue-100 rounded-xl px-2.5 py-1 mr-2">
              <SafeText className="text-blue-800 text-sm font-semibold">
                {memberCount} member{memberCount !== 1 ? 's' : ''}
              </SafeText>
            </View>
            <SafeText className="text-gray-500 text-sm">
              {formatDate(circle.createdAt)}
            </SafeText>
          </View>
        </View>

        <View className="ml-3">
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              backgroundColor: '#3b82f6',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <SafeText className="text-white text-lg font-bold">{EMOJIS.ARROW_RIGHT}</SafeText>
          </View>
        </View>
      </View>

      <View className="mt-3 pt-3 border-t border-gray-200">
        <View className="flex-row items-center justify-between">
          <SafeText className="text-blue-600 text-sm font-semibold">
            View updates
          </SafeText>
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: '#60a5fa',
            }}
          />
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default CircleCard;