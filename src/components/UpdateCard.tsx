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
    <View className="bg-white rounded-3xl p-6 mb-4 shadow-lg border border-gray-100"
      style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
      }}
    >
      {/* Header with author and time */}
      <View className="flex-row items-center justify-between mb-4">
        <View className="flex-row items-center flex-1">
          <View className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl items-center justify-center mr-4">
            <Text className="text-white font-bold text-lg">
              {authorName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View className="flex-1">
            <Text className="font-bold text-gray-800 text-lg">{authorName}</Text>
            <Text className="text-gray-500 text-sm">
              {formatRelativeTime(update.createdAt)}
            </Text>
          </View>
        </View>
      </View>

      {/* Update text */}
      <Text className="text-gray-800 text-base leading-relaxed mb-4">
        {update.text}
      </Text>

      {/* Photo if available */}
      {update.photoURL && (
        <View className="mb-4 rounded-2xl overflow-hidden">
          <Image
            source={{ uri: update.photoURL }}
            className="w-full h-48"
            resizeMode="cover"
          />
        </View>
      )}

      {/* Reactions */}
      <View className="flex-row items-center space-x-4 pt-4 border-t border-gray-100">
        <TouchableOpacity
          className="flex-row items-center space-x-2 bg-red-50 rounded-full px-4 py-2"
          onPress={() => onReaction?.(update.id, '❤️')}
        >
          <Text className="text-lg">❤️</Text>
          {getReactionCount('❤️') > 0 && (
            <Text className="text-red-600 text-sm font-semibold">{getReactionCount('❤️')}</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          className="flex-row items-center space-x-2 bg-yellow-50 rounded-full px-4 py-2"
          onPress={() => onReaction?.(update.id, '🙏')}
        >
          <Text className="text-lg">🙏</Text>
          {getReactionCount('🙏') > 0 && (
            <Text className="text-yellow-600 text-sm font-semibold">{getReactionCount('🙏')}</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          className="flex-row items-center space-x-2 bg-green-50 rounded-full px-4 py-2"
          onPress={() => onReaction?.(update.id, '👍')}
        >
          <Text className="text-lg">👍</Text>
          {getReactionCount('👍') > 0 && (
            <Text className="text-green-600 text-sm font-semibold">{getReactionCount('👍')}</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default UpdateCard;