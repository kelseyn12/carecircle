// Update card component for displaying circle updates
// TODO: Add proper styling and interaction states
// TODO: Implement emoji reactions functionality
// TODO: Add photo display functionality
// TODO: Add author information display

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Update } from '../types';

interface UpdateCardProps {
  update: Update;
  onReaction: (updateId: string, emoji: '❤️' | '🙏' | '👍') => void;
}

const UpdateCard: React.FC<UpdateCardProps> = ({ update, onReaction }) => {
  const [userReaction, setUserReaction] = useState<string | null>(null);

  // TODO: Get author information from Firestore
  const authorName = 'Sarah Johnson'; // TODO: Replace with actual author data
  const timeAgo = '2 hours ago'; // TODO: Calculate from createdAt

  const handleReaction = (emoji: '❤️' | '🙏' | '👍') => {
    if (userReaction === emoji) {
      // Remove reaction
      setUserReaction(null);
      // TODO: Remove reaction from Firestore
    } else {
      // Add/change reaction
      setUserReaction(emoji);
      onReaction(update.id, emoji);
    }
  };

  const getReactionCount = (emoji: string) => {
    if (!update.reactions) return 0;
    return Object.values(update.reactions).filter(r => r === emoji).length;
  };

  return (
    <View className="bg-white rounded-2xl p-6 mb-4 shadow-sm border border-gray-100">
      {/* Author info */}
      <View className="flex-row items-center mb-4">
        <View className="w-10 h-10 bg-blue-100 rounded-full justify-center items-center mr-3">
          <Text className="text-blue-600 font-semibold text-lg">
            {authorName.charAt(0)}
          </Text>
        </View>
        <View className="flex-1">
          <Text className="font-semibold text-gray-800">{authorName}</Text>
          <Text className="text-gray-500 text-sm">{timeAgo}</Text>
        </View>
      </View>

      {/* Update text */}
      <Text className="text-gray-800 text-base leading-6 mb-4">
        {update.text}
      </Text>

      {/* Photo */}
      {update.photoURL && (
        <View className="mb-4">
          <Image
            source={{ uri: update.photoURL }}
            className="w-full h-48 rounded-xl"
            resizeMode="cover"
          />
        </View>
      )}

      {/* Reactions */}
      <View className="flex-row items-center justify-between pt-4 border-t border-gray-100">
        <View className="flex-row space-x-4">
          <TouchableOpacity
            className={`flex-row items-center px-3 py-2 rounded-full ${
              userReaction === '❤️' ? 'bg-red-100' : 'bg-gray-100'
            }`}
            onPress={() => handleReaction('❤️')}
          >
            <Text className="text-lg mr-1">❤️</Text>
            <Text className="text-gray-700 font-medium">
              {getReactionCount('❤️')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className={`flex-row items-center px-3 py-2 rounded-full ${
              userReaction === '🙏' ? 'bg-yellow-100' : 'bg-gray-100'
            }`}
            onPress={() => handleReaction('🙏')}
          >
            <Text className="text-lg mr-1">🙏</Text>
            <Text className="text-gray-700 font-medium">
              {getReactionCount('🙏')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className={`flex-row items-center px-3 py-2 rounded-full ${
              userReaction === '👍' ? 'bg-green-100' : 'bg-gray-100'
            }`}
            onPress={() => handleReaction('👍')}
          >
            <Text className="text-lg mr-1">👍</Text>
            <Text className="text-gray-700 font-medium">
              {getReactionCount('👍')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* TODO: Add comment functionality */}
        <TouchableOpacity className="flex-row items-center">
          <Text className="text-gray-500 text-sm">💬</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default UpdateCard;
