// Comments list component for displaying and adding comments
import React, { useState, useEffect } from 'react';
import { 
  View, 
  TextInput, 
  TouchableOpacity, 
  FlatList, 
  Alert,
  KeyboardAvoidingView,
  Platform,
  Text 
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import SafeText from './SafeText';
import { LinearGradient } from 'expo-linear-gradient';
import Toast from 'react-native-root-toast';
import { Comment, User } from '../types';
import { subscribeToComments, getCommentsPaginated, createComment, getUser } from '../lib/firestoreUtils';
import { QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
import { useAuth } from '../lib/authContext';
import { createCommentSchema } from '../validation/schemas';
import { EMOJIS } from '../utils/emojiUtils';

interface CommentsListProps {
  updateId: string;
  circleId?: string; // Optional circleId for encryption
  onClose: () => void;
}

const CommentsList: React.FC<CommentsListProps> = ({ updateId, circleId, onClose }) => {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [users, setUsers] = useState<Record<string, User>>({});
  const [lastCommentDoc, setLastCommentDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMoreComments, setHasMoreComments] = useState(true);

  // Load initial comments with pagination
  useEffect(() => {
    if (!updateId) return;

    const loadInitialComments = async () => {
      try {
        const result = await getCommentsPaginated(updateId, 20, undefined, circleId);
        setComments(result.comments);
        setLastCommentDoc(result.lastDoc);
        setHasMoreComments(result.hasMore);
        
        // Fetch user data for all comment authors
        const userIds = Array.from(new Set(result.comments.map(c => c.authorId)));
        const userMap: Record<string, User> = {};
        
        for (const userId of userIds) {
          const userData = await getUser(userId);
          if (userData) {
            userMap[userId] = userData;
          }
        }
        
        setUsers(userMap);
      } catch (error) {
        console.error('Error loading comments:', error);
      }
    };

    loadInitialComments();
  }, [updateId, circleId]);

  // Subscribe to new comments (real-time for latest comments)
  useEffect(() => {
    if (!updateId || comments.length === 0) return;

    // Get the most recent comment timestamp
    const mostRecentComment = comments[comments.length - 1]?.createdAt;
    if (!mostRecentComment) return;

    // Subscribe to comments created after the most recent one we have
    const unsubscribe = subscribeToComments(updateId, (commentsData) => {
      // Filter to only new comments (created after our most recent)
      const newComments = commentsData.filter(
        comment => comment.createdAt.getTime() > mostRecentComment.getTime()
      );

      if (newComments.length > 0) {
        // Add new comments to the end of the list
        setComments(prev => {
          const combined = [...prev, ...newComments];
          // Remove duplicates
          const unique = combined.filter((comment, index, self) =>
            index === self.findIndex(c => c.id === comment.id)
          );
          return unique;
        });

        // Fetch user data for new authors
        const userIds = Array.from(new Set(newComments.map(c => c.authorId)));
        const userMap: Record<string, User> = { ...users };
        
        const fetchNewUsers = async () => {
          for (const userId of userIds) {
            if (!userMap[userId]) {
              try {
                const userData = await getUser(userId);
                if (userData) {
                  userMap[userId] = userData;
                }
              } catch (error) {
                console.error('Error fetching user:', userId, error);
              }
            }
          }
          setUsers(prev => ({ ...prev, ...userMap }));
        };
        
        fetchNewUsers();
      }
    }, circleId);

    return unsubscribe;
  }, [updateId, circleId, comments.length > 0 ? comments[comments.length - 1]?.createdAt : null]);

  // Load more comments
  const handleLoadMore = async () => {
    if (!updateId || !lastCommentDoc || loadingMore || !hasMoreComments) return;

    setLoadingMore(true);
    try {
      const result = await getCommentsPaginated(updateId, 20, lastCommentDoc, circleId);
      
      if (result.comments.length > 0) {
        setComments(prev => [...prev, ...result.comments]);
        setLastCommentDoc(result.lastDoc);
        setHasMoreComments(result.hasMore);

        // Fetch user data for new authors
        const userIds = Array.from(new Set(result.comments.map(c => c.authorId)));
        const userMap: Record<string, User> = { ...users };
        
        for (const userId of userIds) {
          if (!userMap[userId]) {
            const userData = await getUser(userId);
            if (userData) {
              userMap[userId] = userData;
            }
          }
        }
        
        setUsers(userMap);
      }
    } catch (error) {
      console.error('Error loading more comments:', error);
      Alert.alert('Error', 'Failed to load more comments');
    } finally {
      setLoadingMore(false);
    }
  };

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
        circleId, // Pass circleId for encryption
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
          <SafeText className="text-white font-bold text-sm">
            {users[item.authorId]?.displayName?.charAt(0).toUpperCase() || '?'}
          </SafeText>
        </View>
        <View className="flex-1">
          <View className="flex-row items-center mb-1" style={{ gap: 8 }}>
            <SafeText className="font-semibold text-gray-900">
              {users[item.authorId]?.displayName || 'Unknown User'}
            </SafeText>
            <SafeText className="text-gray-500 text-sm">
              {formatTime(item.createdAt)}
            </SafeText>
          </View>
          <Text 
            allowFontScaling={false}
            maxFontSizeMultiplier={1.0}
            className="text-gray-700 leading-relaxed"
          >
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
      <View 
        className="bg-white border-b border-gray-200 px-6"
        style={{ 
          paddingTop: insets.top + 12,
          paddingBottom: 16
        }}
      >
        <View className="flex-row items-center justify-between">
          <SafeText className="text-xl font-bold text-gray-900">Comments</SafeText>
          <TouchableOpacity
            className="bg-gray-100 rounded-xl px-4 py-2"
            onPress={onClose}
            activeOpacity={0.7}
          >
            <SafeText className="text-gray-700 font-semibold">Close</SafeText>
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
              <SafeText className="text-2xl">{EMOJIS.COMMENT}</SafeText>
            </View>
            <SafeText className="text-gray-600 text-lg font-medium mb-2">
              No comments yet
            </SafeText>
            <SafeText className="text-gray-500 text-center leading-relaxed">
              Leave some encouragement {EMOJIS.BLUE_HEART}
            </SafeText>
          </View>
        }
        ListFooterComponent={
          hasMoreComments ? (
            <View style={{ paddingVertical: 20, alignItems: 'center' }}>
              <TouchableOpacity
                onPress={handleLoadMore}
                disabled={loadingMore}
                style={{
                  backgroundColor: loadingMore ? '#d1d5db' : '#3b82f6',
                  borderRadius: 16,
                  paddingHorizontal: 24,
                  paddingVertical: 12,
                  minWidth: 120,
                }}
              >
                <SafeText style={{ color: '#ffffff', fontWeight: '600', fontSize: 16, textAlign: 'center' }}>
                  {loadingMore ? 'Loading...' : 'Load More'}
                </SafeText>
              </TouchableOpacity>
            </View>
          ) : null
        }
      />

      {/* Comment Input */}
      <View 
        className="bg-white border-t border-gray-200 px-6"
        style={{ 
          paddingTop: 16,
          paddingBottom: Math.max(insets.bottom, 16)
        }}
      >
        <View className="flex-row items-start" style={{ gap: 12 }}>
          <View className="flex-1">
            <TextInput
              allowFontScaling={false}
              maxFontSizeMultiplier={1.0}
              className="bg-gray-100 rounded-2xl px-4 py-3 text-gray-900 text-base"
              placeholder="Add a comment..."
              value={newComment}
              onChangeText={setNewComment}
              multiline
              maxLength={1000}
              style={{ fontSize: 19, maxHeight: 100 }}
            />
            <SafeText className="text-gray-400 text-xs mt-1 text-right">
              {newComment.length}/1000
            </SafeText>
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
                <SafeText style={{ color: '#ffffff', fontWeight: '600', fontSize: 15 }}>
                  {loading ? 'Posting...' : 'Post'}
                </SafeText>
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
                <SafeText style={{ color: '#6b7280', fontWeight: '600', fontSize: 15 }}>
                  {loading ? 'Posting...' : 'Post'}
                </SafeText>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

export default CommentsList;
