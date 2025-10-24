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
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/stack';
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
  toggleCircleMute 
} from '../lib/firestoreUtils';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

type MemberManagementScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'MemberManagement'>;
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
      
    } catch (error) {
      console.error('Error loading circle data:', error);
      Alert.alert('Error', 'Failed to load circle data');
    } finally {
      setLoading(false);
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
            } catch (error) {
              Alert.alert('Error', 'Failed to promote member');
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
            } catch (error) {
              Alert.alert('Error', 'Failed to remove member');
            }
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

  const handleToggleMute = async (value: boolean) => {
    if (!user) return;

    try {
      await toggleCircleMute(user.id, circleId, value);
      setIsMuted(value);
      Alert.alert(
        'Notifications',
        value ? 'Notifications muted for this circle' : 'Notifications enabled for this circle'
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to update notification settings');
    }
  };

  const renderMember = ({ item }: { item: MemberWithRole }) => (
    <View className="bg-white rounded-xl p-4 mb-3 shadow-sm border border-gray-100">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center flex-1">
          <View className="w-10 h-10 bg-blue-500 rounded-full items-center justify-center mr-3">
            <Text className="text-white font-semibold">
              {item.displayName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View className="flex-1">
            <Text className="font-semibold text-gray-800">
              {item.displayName} {item.isCurrentUser && '(You)'}
            </Text>
            <Text className="text-sm text-gray-600 capitalize">
              {item.role}
            </Text>
          </View>
        </View>
        
        {userRole === 'owner' && !item.isCurrentUser && (
          <View className="flex-row space-x-2">
            {item.role === 'member' ? (
              <TouchableOpacity
                className="bg-green-500 rounded-lg px-3 py-1"
                onPress={() => handlePromoteMember(item.id)}
              >
                <Text className="text-white text-xs font-semibold">Promote</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                className="bg-yellow-500 rounded-lg px-3 py-1"
                onPress={() => handleDemoteOwner(item.id)}
              >
                <Text className="text-white text-xs font-semibold">Demote</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              className="bg-red-500 rounded-lg px-3 py-1"
              onPress={() => handleRemoveMember(item.id, item.displayName)}
            >
              <Text className="text-white text-xs font-semibold">Remove</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
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

      {/* Leave Circle Button (for members only) */}
      {userRole === 'member' && (
        <View className="px-4 pb-4">
          <TouchableOpacity
            className="bg-red-500 rounded-xl py-4"
            onPress={handleLeaveCircle}
          >
            <Text className="text-white text-center font-semibold">
              Leave Circle
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

export default MemberManagementScreen;

