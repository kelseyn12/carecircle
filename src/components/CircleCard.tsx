// Circle card component for displaying circle information
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Circle } from '../types';
import { EMOJIS } from '../utils/emojiUtils';

interface CircleCardProps {
  circle: Circle;
  onPress: () => void;
}

const CircleCard: React.FC<CircleCardProps> = ({ circle, onPress }) => {
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
            <View className="w-11 h-11 bg-blue-500 rounded-xl justify-center items-center mr-3">
              <Text className="text-lg text-white font-bold">{EMOJIS.PEOPLE}</Text>
            </View>
            <Text className="text-lg font-bold text-gray-800 flex-1">
              {circle.title}
            </Text>
          </View>
          
          <View className="flex-row items-center mb-2">
            <View className="bg-blue-100 rounded-xl px-2.5 py-1 mr-2">
              <Text className="text-blue-800 text-sm font-semibold">
                {memberCount} member{memberCount !== 1 ? 's' : ''}
              </Text>
            </View>
            <Text className="text-gray-500 text-sm">
              {formatDate(circle.createdAt)}
            </Text>
          </View>
        </View>

        <View className="ml-3">
          <View className="w-10 h-10 bg-blue-500 rounded-xl justify-center items-center">
            <Text className="text-white text-lg font-bold">{EMOJIS.ARROW_RIGHT}</Text>
          </View>
        </View>
      </View>

      <View className="mt-3 pt-3 border-t border-gray-200">
        <View className="flex-row items-center justify-between">
          <Text className="text-blue-600 text-sm font-semibold">
            View updates
          </Text>
          <View className="w-2 h-2 bg-blue-500 rounded-full" />
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default CircleCard;