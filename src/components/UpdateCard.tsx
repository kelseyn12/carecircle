// Update card component for displaying individual updates
import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Update } from '../types';

interface UpdateCardProps {
  update: Update;
  authorName?: string;
  onReaction?: (updateId: string, emoji: string) => void;
}

const UpdateCard: React.FC<UpdateCardProps> = ({ 
  update, 
  authorName = 'Anonymous',
  onReaction 
}) => {
  // Format relative time
  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return date.toLocaleDateString();
  };

  // Get reaction count for an emoji
  const getReactionCount = (emoji: string) => {
    return update.reactions?.[emoji]?.length || 0;
  };

  return (
    <View className="bg-white rounded-2xl p-4 mb-4 shadow-sm border border-gray-100">
      {/* Header with author and time */}
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center">
          <View className="w-8 h-8 bg-blue-500 rounded-full items-center justify-center mr-3">
            <Text className="text-white font-semibold text-sm">
              {authorName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View>
            <Text className="font-semibold text-gray-800">{authorName}</Text>
            <Text className="text-gray-500 text-sm">
              {formatRelativeTime(update.createdAt)}
            </Text>
          </View>
        </View>
      </View>

      {/* Update text */}
      <Text className="text-gray-800 text-base leading-6 mb-3">
        {update.text}
      </Text>

      {/* Photo if available */}
      {update.photoURL && (
        <View className="mb-3">
          <Image
            source={{ uri: update.photoURL }}
            className="w-full h-48 rounded-xl"
            resizeMode="cover"
          />
        </View>
      )}

      {/* Reactions */}
      <View className="flex-row items-center space-x-4 pt-3 border-t border-gray-100">
        <TouchableOpacity
          className="flex-row items-center space-x-1"
          onPress={() => onReaction?.(update.id, '❤️')}
        >
          <Text className="text-lg">❤️</Text>
          {getReactionCount('❤️') > 0 && (
            <Text className="text-gray-600 text-sm">{getReactionCount('❤️')}</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          className="flex-row items-center space-x-1"
          onPress={() => onReaction?.(update.id, '🙏')}
        >
          <Text className="text-lg">🙏</Text>
          {getReactionCount('🙏') > 0 && (
            <Text className="text-gray-600 text-sm">{getReactionCount('🙏')}</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          className="flex-row items-center space-x-1"
          onPress={() => onReaction?.(update.id, '👍')}
        >
          <Text className="text-lg">👍</Text>
          {getReactionCount('👍') > 0 && (
            <Text className="text-gray-600 text-sm">{getReactionCount('👍')}</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default UpdateCard;