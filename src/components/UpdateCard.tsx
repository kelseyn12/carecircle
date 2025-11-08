// Update card component for displaying individual updates
import React from 'react';
import { View, TouchableOpacity, Image, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Update } from '../types';
import { formatRelativeTime } from '../lib/utils';
import { EMOJIS, getReactionEmoji } from '../utils/emojiUtils';
import SafeText from './SafeText';

interface UpdateCardProps {
  update: Update;
  authorName?: string;
  currentUserId?: string;
  onReaction?: (updateId: string, emoji: string) => void;
  onComment?: (updateId: string) => void;
}

const UpdateCard: React.FC<UpdateCardProps> = ({ 
  update, 
  authorName = 'Anonymous',
  currentUserId,
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
    if (!update.reactions) return 0;
    return Object.values(update.reactions).filter(reactionEmoji => reactionEmoji === emoji).length;
  };

  // Check if current user has reacted with this emoji
  const hasUserReacted = (emoji: string) => {
    if (!currentUserId || !update.reactions) return false;
    return update.reactions[currentUserId] === emoji;
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
          <LinearGradient
            colors={['#93c5fd', '#c4b5fd']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              width: 48,
              height: 48,
              borderRadius: 16,
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 16,
            }}
          >
            <SafeText style={{ color: '#ffffff', fontWeight: 'bold', fontSize: 18 }}>
              {authorName.charAt(0).toUpperCase()}
            </SafeText>
          </LinearGradient>
          <View className="flex-1">
            <SafeText className="font-bold text-gray-800 text-lg">{authorName}</SafeText>
            <SafeText className="text-gray-500 text-sm">
              {formatRelativeTime(update.createdAt)}
            </SafeText>
          </View>
        </View>
      </View>

      {/* Update text - allow some scaling for user content but cap it */}
      <Text 
        allowFontScaling={false}
        maxFontSizeMultiplier={1.0}
        style={{ color: '#1f2937', fontSize: 16, lineHeight: 24, marginBottom: update.photoURL ? 16 : 0 }}
      >
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
          style={{ 
            flexDirection: 'row', 
            alignItems: 'center', 
            backgroundColor: hasUserReacted(EMOJIS.HEART) ? '#fecaca' : '#fef2f2', 
            borderRadius: 20, 
            paddingHorizontal: 12, 
            paddingVertical: 8,
            borderWidth: hasUserReacted(EMOJIS.HEART) ? 2 : 0,
            borderColor: hasUserReacted(EMOJIS.HEART) ? '#dc2626' : 'transparent',
          }}
          onPress={() => onReaction?.(update.id, EMOJIS.HEART)}
        >
          <SafeText style={{ fontSize: 16 }}>{EMOJIS.HEART}</SafeText>
          {getReactionCount(EMOJIS.HEART) > 0 && (
            <SafeText style={{ color: '#dc2626', fontSize: 14, fontWeight: '600', marginLeft: 4 }}>{getReactionCount(EMOJIS.HEART)}</SafeText>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={{ 
            flexDirection: 'row', 
            alignItems: 'center', 
            backgroundColor: hasUserReacted(EMOJIS.PRAY) ? '#fde68a' : '#fefce8', 
            borderRadius: 20, 
            paddingHorizontal: 12, 
            paddingVertical: 8,
            borderWidth: hasUserReacted(EMOJIS.PRAY) ? 2 : 0,
            borderColor: hasUserReacted(EMOJIS.PRAY) ? '#ca8a04' : 'transparent',
          }}
          onPress={() => onReaction?.(update.id, EMOJIS.PRAY)}
        >
          <SafeText style={{ fontSize: 16 }}>{EMOJIS.PRAY}</SafeText>
          {getReactionCount(EMOJIS.PRAY) > 0 && (
            <SafeText style={{ color: '#ca8a04', fontSize: 14, fontWeight: '600', marginLeft: 4 }}>{getReactionCount(EMOJIS.PRAY)}</SafeText>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={{ 
            flexDirection: 'row', 
            alignItems: 'center', 
            backgroundColor: hasUserReacted(EMOJIS.THUMBS_UP) ? '#bbf7d0' : '#f0fdf4', 
            borderRadius: 20, 
            paddingHorizontal: 12, 
            paddingVertical: 8,
            borderWidth: hasUserReacted(EMOJIS.THUMBS_UP) ? 2 : 0,
            borderColor: hasUserReacted(EMOJIS.THUMBS_UP) ? '#16a34a' : 'transparent',
          }}
          onPress={() => onReaction?.(update.id, EMOJIS.THUMBS_UP)}
        >
          <SafeText style={{ fontSize: 16 }}>{EMOJIS.THUMBS_UP}</SafeText>
          {getReactionCount(EMOJIS.THUMBS_UP) > 0 && (
            <SafeText style={{ color: '#16a34a', fontSize: 14, fontWeight: '600', marginLeft: 4 }}>{getReactionCount(EMOJIS.THUMBS_UP)}</SafeText>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#eff6ff', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8 }}
          onPress={() => onComment?.(update.id)}
        >
          <SafeText style={{ fontSize: 16 }}>{EMOJIS.COMMENT}</SafeText>
          <SafeText style={{ color: '#2563eb', fontSize: 14, fontWeight: '600', marginLeft: 4 }}>Comment</SafeText>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default UpdateCard;