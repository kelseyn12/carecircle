// Circle card component for displaying circle information
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Circle } from '../types';

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
      className="bg-white rounded-3xl p-6 mb-4 shadow-lg border border-gray-100"
      onPress={onPress}
      activeOpacity={0.8}
      style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
      }}
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-1">
          <View className="flex-row items-center mb-2">
            <View className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl items-center justify-center mr-3">
              <Text className="text-white text-lg font-bold">👥</Text>
            </View>
            <Text className="text-xl font-bold text-gray-800 flex-1">
              {circle.title}
            </Text>
          </View>
          
          <View className="flex-row items-center mb-3">
            <View className="bg-blue-100 rounded-full px-3 py-1 mr-3">
              <Text className="text-blue-700 text-sm font-semibold">
                {memberCount} member{memberCount !== 1 ? 's' : ''}
              </Text>
            </View>
            <Text className="text-gray-500 text-sm">
              {formatDate(circle.createdAt)}
            </Text>
          </View>
        </View>

        <View className="ml-4">
          <View className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl items-center justify-center">
            <Text className="text-white text-lg">→</Text>
          </View>
        </View>
      </View>

      <View className="mt-4 pt-4 border-t border-gray-100">
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
