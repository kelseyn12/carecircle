// Member management screen for circle owners and members
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  Alert, 
  ActivityIndicator,
  Switch 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList, Circle, User } from '../types';
import { useAuth } from '../lib/authContext';
import { 
  getCircle, 
  getUserRoleInCircle, 
  isUserOwner,
  promoteMemberToOwner, 
  demoteOwnerToMember, 
  removeMemberFromCircle,
  leaveCircle,
  toggleCircleMute,
  addUpdateAuthor,
  removeUpdateAuthor,
  canUserPostUpdates,
  deleteCircle,
  getPendingJoinRequests,
  approveJoinRequest,
  declineJoinRequest,
} from '../lib/firestoreUtils';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

type MemberManagementScreenNavigationProp = StackNavigationProp<RootStackParamList, 'MemberManagement'>;
type MemberManagementScreenRouteProp = RouteProp<RootStackParamList, 'MemberManagement'>;

interface MemberWithRole {
  id: string;
  displayName: string;
  photoURL?: string;
  role: 'owner' | 'member';
  isCurrentUser: boolean;
}

const MemberManagementScreen: React.FC = () => {
  const navigation = useNavigation<MemberManagementScreenNavigationProp>();
  const route = useRoute<MemberManagementScreenRouteProp>();
  const { user } = useAuth();
  const { circleId } = route.params;
  
  const [circle, setCircle] = useState<Circle | null>(null);
  const [members, setMembers] = useState<MemberWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<'owner' | 'member' | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [pendingRequests, setPendingRequests] = useState<{
    id: string;
    userId: string;
    displayName: string;
    relation: string;
  }[]>([]);

  useEffect(() => {
    loadCircleData();
  }, [circleId, user]);

  const loadCircleData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Get circle data
      const circleData = await getCircle(circleId);
      if (!circleData) {
        Alert.alert('Error', 'Circle not found');
        navigation.goBack();
        return;
      }
      
      setCircle(circleData);
      
      // Get user role
      const role = await getUserRoleInCircle(circleId, user.id);
      setUserRole(role);
      
      // Get member details
      const memberPromises = circleData.members.map(async (memberId) => {
        try {
          const userDoc = await getDoc(doc(db, 'users', memberId));
          const userData = userDoc.data();
          return {
            id: memberId,
            displayName: userData?.displayName || 'Unknown User',
            photoURL: userData?.photoURL,
            role: circleData.roles[memberId] || 'member',
            isCurrentUser: memberId === user.id,
          };
        } catch (error) {
          return {
            id: memberId,
            displayName: 'Unknown User',
            role: circleData.roles[memberId] || 'member',
            isCurrentUser: memberId === user.id,
          };
        }
      });
      
      const memberDetails = await Promise.all(memberPromises);
      setMembers(memberDetails);
      
      // Check if user has muted this circle
      const userDoc = await getDoc(doc(db, 'users', user.id));
      const userData = userDoc.data();
      const circlesMuted = userData?.circlesMuted || [];
      setIsMuted(circlesMuted.includes(circleId));

      // Load pending join requests for owners
      if (role === 'owner') {
        try {
          const requests = await getPendingJoinRequests(circleId);
          setPendingRequests(
            requests.map((r) => ({
              id: r.id,
              userId: r.userId,
              displayName: r.displayName,
              relation: r.relation,
            }))
          );
        } catch (e) {
          // Non-blocking: just log
          console.error('Error loading join requests', e);
        }
      } else {
        setPendingRequests([]);
      }
      
    } catch (error) {
      console.error('Error loading circle data:', error);
      Alert.alert('Error', 'Failed to load circle data');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveRequest = async (requestId: string, requesterUserId: string) => {
    try {
      await approveJoinRequest(circleId, requestId, requesterUserId);
      await loadCircleData();
      Alert.alert('Approved', 'Join request approved.');
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to approve request');
    }
  };

  const handleDeclineRequest = async (requestId: string) => {
    try {
      await declineJoinRequest(circleId, requestId);
      await loadCircleData();
      Alert.alert('Declined', 'Join request declined.');
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to decline request');
    }
  };

  const handlePromoteMember = async (memberId: string) => {
    if (!user) return;

    Alert.alert(
      'Promote to Owner',
      'Are you sure you want to promote this member to owner? They will have full control of the circle.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Promote',
          onPress: async () => {
            try {
              await promoteMemberToOwner(circleId, memberId);
              await loadCircleData(); // Refresh data
              Alert.alert('Success', 'Member promoted to owner');
            } catch (error: any) {
              console.error('Error promoting member:', error);
              Alert.alert('Error', error?.message || 'Failed to promote member');
            }
          },
        },
      ]
    );
  };

  const handleDemoteOwner = async (memberId: string) => {
    if (!user) return;

    Alert.alert(
      'Demote to Member',
      'Are you sure you want to demote this owner to member?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Demote',
          onPress: async () => {
            try {
              await demoteOwnerToMember(circleId, memberId);
              await loadCircleData(); // Refresh data
              Alert.alert('Success', 'Owner demoted to member');
            } catch (error) {
              Alert.alert('Error', 'Failed to demote owner');
            }
          },
        },
      ]
    );
  };

  const handleAddUpdateAuthor = async (memberId: string) => {
    if (!user) return;

    try {
      Alert.alert(
        'Grant Update Permission',
        'This member will be able to post updates in this circle.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Grant Permission',
            onPress: async () => {
              try {
                await addUpdateAuthor(circleId, memberId);
                await loadCircleData(); // Refresh data
                Alert.alert('Success', 'Member can now post updates');
              } catch (error: any) {
                console.error('Error adding update author:', error);
                Alert.alert('Error', error?.message || 'Failed to grant update permission');
              }
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('Error in handleAddUpdateAuthor:', error);
      Alert.alert('Error', 'Failed to show permission dialog');
    }
  };

  const handleRemoveUpdateAuthor = async (memberId: string) => {
    if (!user) return;

    Alert.alert(
      'Revoke Update Permission',
      'This member will no longer be able to post updates in this circle.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Revoke Permission',
          onPress: async () => {
            try {
              await removeUpdateAuthor(circleId, memberId);
              await loadCircleData(); // Refresh data
              Alert.alert('Success', 'Update permission revoked');
            } catch (error) {
              Alert.alert('Error', error instanceof Error ? error.message : 'Failed to revoke update permission');
            }
          },
        },
      ]
    );
  };

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (!user) return;

    Alert.alert(
      'Remove Member',
      `Are you sure you want to remove ${memberName} from this circle?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeMemberFromCircle(circleId, memberId);
              await loadCircleData(); // Refresh data
              Alert.alert('Success', 'Member removed from circle');
            } catch (error: any) {
              console.error('Error removing member:', error);
              Alert.alert('Error', error?.message || 'Failed to remove member');
            }
          },
        },
      ]
    );
  };

  const handleDeleteCircle = async () => {
    if (!user) return;

    Alert.alert(
      'Delete Circle',
      'Are you sure you want to delete this circle? This action cannot be undone. All updates, comments, and member data will be permanently removed.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            // Double confirmation for destructive action
            Alert.alert(
              'Final Confirmation',
              'This will permanently delete the circle and all its content. This cannot be undone. Are you absolutely sure?',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete Forever',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      await deleteCircle(circleId);
                      Alert.alert('Success', 'Circle deleted successfully', [
                        { text: 'OK', onPress: () => navigation.navigate('Home') }
                      ]);
                    } catch (error: any) {
                      console.error('Error deleting circle:', error);
                      Alert.alert('Error', error?.message || 'Failed to delete circle');
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  const handleLeaveCircle = async () => {
    if (!user) return;

    Alert.alert(
      'Leave Circle',
      'Are you sure you want to leave this circle? You will no longer receive updates.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            try {
              await leaveCircle(circleId, user.id);
              Alert.alert('Success', 'You have left the circle', [
                { text: 'OK', onPress: () => navigation.navigate('Home') }
              ]);
            } catch (error) {
              Alert.alert('Error', error instanceof Error ? error.message : 'Failed to leave circle');
            }
          },
        },
      ]
    );
  };

  const handleToggleMute = async (switchValue: boolean) => {
    if (!user) return;

    // Switch value is inverted: switchValue=true means notifications enabled (not muted)
    // But toggleCircleMute expects: isMuted=true means mute, isMuted=false means unmute
    // So we need to invert: isMuted = !switchValue
    const isMuted = !switchValue;

    try {
      await toggleCircleMute(user.id, circleId, isMuted);
      setIsMuted(isMuted);
      Alert.alert(
        'Notifications',
        isMuted ? 'Notifications muted for this circle' : 'Notifications enabled for this circle'
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to update notification settings');
    }
  };

  const renderMember = ({ item }: { item: MemberWithRole }) => (
    <View style={{
      backgroundColor: '#ffffff',
      borderRadius: 16,
      padding: 16,
      marginBottom: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
      borderWidth: 1,
      borderColor: '#f3f4f6',
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: userRole === 'owner' && !item.isCurrentUser ? 12 : 0 }}>
        <LinearGradient
          colors={['#93c5fd', '#c4b5fd']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 12,
          }}
        >
          <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: '600' }}>
            {item.displayName.charAt(0).toUpperCase()}
          </Text>
        </LinearGradient>
        <View style={{ flex: 1 }}>
          <Text style={{ fontWeight: '600', color: '#1f2937', fontSize: 15 }}>
            {item.displayName} {item.isCurrentUser && '(You)'}
          </Text>
          <Text style={{ fontSize: 13, color: '#6b7280', textTransform: 'capitalize', marginTop: 2 }}>
            {item.role}
          </Text>
        </View>
      </View>
      
      {userRole === 'owner' && !item.isCurrentUser && (
        <View style={{ gap: 8 }}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {item.role === 'member' ? (
              <TouchableOpacity
                style={{ backgroundColor: '#10b981', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8, flex: 1 }}
                onPress={() => handlePromoteMember(item.id)}
              >
                <Text style={{ color: '#ffffff', fontSize: 13, fontWeight: '600', textAlign: 'center' }}>Promote</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={{ backgroundColor: '#eab308', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8, flex: 1 }}
                onPress={() => handleDemoteOwner(item.id)}
              >
                <Text style={{ color: '#ffffff', fontSize: 13, fontWeight: '600', textAlign: 'center' }}>Demote</Text>
              </TouchableOpacity>
            )}
            {circle?.updateAuthors?.includes(item.id) ? (
              <TouchableOpacity
                style={{ backgroundColor: '#f97316', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8, flex: 1 }}
                onPress={() => handleRemoveUpdateAuthor(item.id)}
              >
                <Text style={{ color: '#ffffff', fontSize: 12, fontWeight: '600', textAlign: 'center' }}>Revoke Updates</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={() => handleAddUpdateAuthor(item.id)}
                style={{ flex: 1, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8, overflow: 'hidden' }}
              >
                <LinearGradient
                  colors={['#60a5fa', '#a78bfa']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{ flex: 1, paddingHorizontal: 14, paddingVertical: 8, alignItems: 'center', justifyContent: 'center' }}
                >
                  <Text style={{ color: '#ffffff', fontSize: 12, fontWeight: '600', textAlign: 'center' }}>Allow Updates</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity
            style={{ backgroundColor: '#ef4444', borderRadius: 8, paddingVertical: 10 }}
            onPress={() => handleRemoveMember(item.id, item.displayName)}
          >
            <Text style={{ color: '#ffffff', fontSize: 13, fontWeight: '600', textAlign: 'center' }}>Remove from Circle</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className="text-gray-600 mt-4">Loading members...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-6 py-6 border-b border-gray-200">
        <View className="flex-row justify-between items-center">
          <TouchableOpacity
            className="bg-gray-100 rounded-xl px-4 py-3 mt-4"
            onPress={() => navigation.navigate('CircleFeed', { circleId })}
          >
            <Text className="text-gray-700 font-semibold">Back</Text>
          </TouchableOpacity>
          
          <Text className="text-xl font-semibold text-gray-800">Members</Text>
          
          <View className="w-16" />
        </View>
        {circle && (
          <Text className="text-gray-600 text-center mt-2">
            {circle.title} • {members.length} member{members.length !== 1 ? 's' : ''}
          </Text>
        )}
      </View>

      {/* Pending Join Requests (Owners only) */}
      {userRole === 'owner' && pendingRequests.length > 0 && (
        <View className="bg-white mx-4 mt-4 rounded-xl p-4 shadow-sm border border-gray-100">
          <Text className="font-semibold text-gray-800 mb-3">Pending Join Requests</Text>
          {pendingRequests.map((req) => (
            <View key={req.id} className="border border-gray-100 rounded-lg p-3 mb-2">
              <Text className="text-gray-900 font-medium">{req.displayName}</Text>
              <Text className="text-gray-600 text-sm mt-0.5">Relation: {req.relation}</Text>
              <View className="flex-row gap-2 mt-3">
                <TouchableOpacity
                  className="bg-green-600 rounded-lg px-4 py-2"
                  onPress={() => handleApproveRequest(req.id, req.userId)}
                >
                  <Text className="text-white font-semibold text-sm">Approve</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="bg-gray-300 rounded-lg px-4 py-2"
                  onPress={() => handleDeclineRequest(req.id)}
                >
                  <Text className="text-gray-800 font-semibold text-sm">Decline</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Notification Settings */}
      <View className="bg-white mx-4 mt-4 rounded-xl p-4 shadow-sm border border-gray-100">
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <Text className="font-semibold text-gray-800">Notifications</Text>
            <Text className="text-sm text-gray-600">
              {isMuted ? 'Muted for this circle' : 'Enabled for this circle'}
            </Text>
          </View>
          <Switch
            value={!isMuted}
            onValueChange={handleToggleMute}
            trackColor={{ false: '#d1d5db', true: '#3b82f6' }}
            thumbColor={!isMuted ? '#ffffff' : '#ffffff'}
          />
        </View>
      </View>

      {/* Members List */}
      <View className="flex-1 px-4 py-4">
        <FlatList
          data={members}
          renderItem={renderMember}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
        />
      </View>

      {/* Delete Circle Button (for owners only) */}
      {userRole === 'owner' && (
        <View className="px-4 pb-4">
          <TouchableOpacity
            className="bg-red-600 rounded-xl py-4"
            onPress={handleDeleteCircle}
            style={{
              backgroundColor: '#dc2626',
              borderRadius: 12,
              paddingVertical: 14,
            }}
          >
            <Text className="text-white text-center font-semibold" style={{ color: '#ffffff', fontWeight: '600', fontSize: 16 }}>
              Delete Circle
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Leave Circle Button (for members only) */}
      {userRole === 'member' && (
        <View className="px-4 pb-4">
          <TouchableOpacity
            className="bg-red-500 rounded-xl py-4"
            onPress={handleLeaveCircle}
            style={{
              backgroundColor: '#ef4444',
              borderRadius: 12,
              paddingVertical: 14,
            }}
          >
            <Text className="text-white text-center font-semibold" style={{ color: '#ffffff', fontWeight: '600', fontSize: 16 }}>
              Leave Circle
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

export default MemberManagementScreen;

