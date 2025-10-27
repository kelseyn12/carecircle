// Update card component for displaying individual updates
import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Update } from '../types';

interface UpdateCardProps {
  update: Update;
  authorName?: string;
  onReaction?: (updateId: string, emoji: string) => void;
  onComment?: (updateId: string) => void;
}

const UpdateCard: React.FC<UpdateCardProps> = ({ 
  update, 
  authorName = 'Anonymous',
  onReaction,
  onComment 
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
    <View style={{
      backgroundColor: '#ffffff',
      borderRadius: 20,
      padding: 16,
      marginBottom: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 3,
      borderWidth: 1,
      borderColor: '#f3f4f6',
    }}>
      {/* Header with author and time */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
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
      <Text style={{ color: '#1f2937', fontSize: 16, lineHeight: 24, marginBottom: update.photoURL ? 16 : 0 }}>
        {update.text}
      </Text>

      {/* Photo if available */}
      {update.photoURL && (
        <View style={{ marginBottom: 16, borderRadius: 16, overflow: 'hidden' }}>
          <Image
            source={{ uri: update.photoURL }}
            style={{ width: '100%', height: 200 }}
            resizeMode="cover"
          />
        </View>
      )}

      {/* Reactions */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f3f4f6', gap: 8, flexWrap: 'wrap' }}>
        <TouchableOpacity
          style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#fef2f2', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8 }}
          onPress={() => onReaction?.(update.id, '❤️')}
        >
          <Text style={{ fontSize: 16 }}>❤️</Text>
          {getReactionCount('❤️') > 0 && (
            <Text style={{ color: '#dc2626', fontSize: 14, fontWeight: '600', marginLeft: 4 }}>{getReactionCount('❤️')}</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#fefce8', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8 }}
          onPress={() => onReaction?.(update.id, '🙏')}
        >
          <Text style={{ fontSize: 16 }}>🙏</Text>
          {getReactionCount('🙏') > 0 && (
            <Text style={{ color: '#ca8a04', fontSize: 14, fontWeight: '600', marginLeft: 4 }}>{getReactionCount('🙏')}</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0fdf4', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8 }}
          onPress={() => onReaction?.(update.id, '👍')}
        >
          <Text style={{ fontSize: 16 }}>👍</Text>
          {getReactionCount('👍') > 0 && (
            <Text style={{ color: '#16a34a', fontSize: 14, fontWeight: '600', marginLeft: 4 }}>{getReactionCount('👍')}</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#eff6ff', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8 }}
          onPress={() => onComment?.(update.id)}
        >
          <Text style={{ fontSize: 16 }}>💬</Text>
          <Text style={{ color: '#2563eb', fontSize: 14, fontWeight: '600', marginLeft: 4 }}>Comment</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default UpdateCard;