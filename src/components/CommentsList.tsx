// Comments list component for displaying and adding comments
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  FlatList, 
  Alert,
  KeyboardAvoidingView,
  Platform 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Toast from 'react-native-root-toast';
import { Comment, User } from '../types';
import { subscribeToComments, createComment, getUser } from '../lib/firestoreUtils';
import { useAuth } from '../lib/authContext';
import { createCommentSchema } from '../validation/schemas';
import { EMOJIS } from '../utils/emojiUtils';

interface CommentsListProps {
  updateId: string;
  onClose: () => void;
}

const CommentsList: React.FC<CommentsListProps> = ({ updateId, onClose }) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<Record<string, User>>({});

  // Subscribe to real-time comments
  useEffect(() => {
    if (!updateId) return;

    const unsubscribe = subscribeToComments(updateId, (commentsData) => {
      setComments(commentsData);
      
      // Fetch user data for all comment authors
      const fetchUsers = async () => {
        const userIds = Array.from(new Set(commentsData.map(c => c.authorId)));
        const userMap: Record<string, User> = {};
        
        for (const userId of userIds) {
          const userData = await getUser(userId);
          if (userData) {
            userMap[userId] = userData;
          }
        }
        
        setUsers(userMap);
      };
      
      fetchUsers();
    });

    return unsubscribe;
  }, [updateId]);

  const handleSubmitComment = async () => {
    if (!user || !newComment.trim()) return;

    try {
      const validatedData = createCommentSchema.parse({
        text: newComment.trim(),
      });

      setLoading(true);
      await createComment({
        updateId,
        authorId: user.id,
        text: validatedData.text,
      });

      setNewComment('');
      Toast.show(`${EMOJIS.COMMENT} Comment posted!`, {
        duration: Toast.durations.SHORT,
        position: Toast.positions.BOTTOM,
      });
    } catch (error) {
      console.error('Error creating comment:', error);
      Alert.alert('Error', 'Failed to post comment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const renderComment = ({ item }: { item: Comment }) => (
    <View className="bg-white rounded-2xl p-4 mb-3 shadow-sm border border-gray-100">
      <View className="flex-row items-start" style={{ gap: 12 }}>
        <View className="w-10 h-10 bg-blue-500 rounded-full items-center justify-center" style={{ backgroundColor: '#3b82f6' }}>
          <Text className="text-white font-bold text-sm">
            {users[item.authorId]?.displayName?.charAt(0).toUpperCase() || '?'}
          </Text>
        </View>
        <View className="flex-1">
          <View className="flex-row items-center mb-1" style={{ gap: 8 }}>
            <Text className="font-semibold text-gray-900">
              {users[item.authorId]?.displayName || 'Unknown User'}
            </Text>
            <Text className="text-gray-500 text-sm">
              {formatTime(item.createdAt)}
            </Text>
          </View>
          <Text className="text-gray-700 leading-relaxed">
            {item.text}
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1, backgroundColor: '#f9fafb' }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View className="bg-white border-b border-gray-200 px-6 py-4">
        <View className="flex-row items-center justify-between">
          <Text className="text-xl font-bold text-gray-900">Comments</Text>
          <TouchableOpacity
            className="bg-gray-100 rounded-xl px-4 py-2"
            onPress={onClose}
          >
            <Text className="text-gray-700 font-semibold">Close</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Comments List */}
      <FlatList
        data={comments}
        keyExtractor={(item) => item.id}
        renderItem={renderComment}
        className="flex-1 px-6 py-4"
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View className="flex-1 justify-center items-center py-12">
            <View className="w-16 h-16 bg-gray-100 rounded-full items-center justify-center mb-4">
              <Text className="text-2xl">{EMOJIS.COMMENT}</Text>
            </View>
            <Text className="text-gray-600 text-lg font-medium mb-2">
              No comments yet
            </Text>
            <Text className="text-gray-500 text-center leading-relaxed">
              Leave some encouragement {EMOJIS.BLUE_HEART}
            </Text>
          </View>
        }
      />

      {/* Comment Input */}
      <View className="bg-white border-t border-gray-200 px-6 py-4">
        <View className="flex-row items-start" style={{ gap: 12 }}>
          <View className="flex-1">
            <TextInput
              className="bg-gray-100 rounded-2xl px-4 py-3 text-gray-900 text-base"
              placeholder="Add a comment..."
              value={newComment}
              onChangeText={setNewComment}
              multiline
              maxLength={1000}
              style={{ maxHeight: 100 }}
            />
            <Text className="text-gray-400 text-xs mt-1 text-right">
              {newComment.length}/1000
            </Text>
          </View>
          <TouchableOpacity
            onPress={handleSubmitComment}
            disabled={!newComment.trim() || loading}
            style={{
              opacity: (!newComment.trim() || loading) ? 0.7 : 1,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3,
            }}
          >
            {newComment.trim() && !loading ? (
              <LinearGradient
                colors={['#60a5fa', '#a78bfa']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  borderRadius: 16,
                  paddingHorizontal: 24,
                  paddingVertical: 12,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ color: '#ffffff', fontWeight: '600', fontSize: 15 }}>
                  {loading ? 'Posting...' : 'Post'}
                </Text>
              </LinearGradient>
            ) : (
              <View
                style={{
                  backgroundColor: '#d1d5db',
                  borderRadius: 16,
                  paddingHorizontal: 24,
                  paddingVertical: 12,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ color: '#6b7280', fontWeight: '600', fontSize: 15 }}>
                  {loading ? 'Posting...' : 'Post'}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

export default CommentsList;
