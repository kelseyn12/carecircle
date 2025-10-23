// Circle card component for displaying circle information
// TODO: Add proper styling and interaction states
// TODO: Add member count and last update info
// TODO: Add navigation to circle feed

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Circle } from '../types';

interface CircleCardProps {
  circle: Circle;
  onPress: () => void;
}

const CircleCard: React.FC<CircleCardProps> = ({ circle, onPress }) => {
  // TODO: Add member count and last update logic
  const memberCount = circle.members.length;
  const lastUpdate = '2 hours ago'; // TODO: Calculate from actual data

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
            Last update: {lastUpdate}
          </Text>
        </View>
        
        <View className="ml-4">
          <Text className="text-3xl">👥</Text>
        </View>
      </View>
      
      {/* TODO: Add unread indicator if there are new updates */}
      <View className="mt-3 pt-3 border-t border-gray-100">
        <Text className="text-blue-600 text-sm font-medium">
          Tap to view updates →
        </Text>
      </View>
    </TouchableOpacity>
  );
};

export default CircleCard;
