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
      className="bg-white rounded-2xl p-6 mb-4 shadow-sm border border-gray-100"
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-1">
          <Text className="text-xl font-semibold text-gray-800 mb-1">
            {circle.title}
          </Text>
          <Text className="text-gray-600 mb-2">
            {memberCount} member{memberCount !== 1 ? 's' : ''}
          </Text>
          <Text className="text-gray-500 text-sm">
            Created {formatDate(circle.createdAt)}
          </Text>
        </View>
        
        <View className="ml-4">
          <Text className="text-3xl">👥</Text>
        </View>
      </View>
      
      <View className="mt-3 pt-3 border-t border-gray-100">
        <Text className="text-blue-600 text-sm font-medium">
          Tap to view updates →
        </Text>
      </View>
    </TouchableOpacity>
  );
};

export default CircleCard;
