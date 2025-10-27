// Circle card component for displaying circle information
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Circle } from '../types';

interface CircleCardProps {
  circle: Circle;
  onPress: () => void;
}

const CircleCard: React.FC<CircleCardProps> = ({ circle, onPress }) => {
  const memberCount = circle.members.length;
  
  // Format creation date
  const formatDate = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={{
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
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <View style={{
              width: 44,
              height: 44,
              backgroundColor: '#3b82f6',
              borderRadius: 12,
              justifyContent: 'center',
              alignItems: 'center',
              marginRight: 12,
            }}>
              <Text style={{ fontSize: 18, color: '#ffffff', fontWeight: 'bold' }}>👥</Text>
            </View>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#1f2937', flex: 1 }}>
              {circle.title}
            </Text>
          </View>
          
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <View style={{
              backgroundColor: '#dbeafe',
              borderRadius: 12,
              paddingHorizontal: 10,
              paddingVertical: 4,
              marginRight: 8,
            }}>
              <Text style={{ color: '#1e40af', fontSize: 13, fontWeight: '600' }}>
                {memberCount} member{memberCount !== 1 ? 's' : ''}
              </Text>
            </View>
            <Text style={{ color: '#6b7280', fontSize: 13 }}>
              {formatDate(circle.createdAt)}
            </Text>
          </View>
        </View>

        <View style={{ marginLeft: 12 }}>
          <View style={{
            width: 40,
            height: 40,
            backgroundColor: '#3b82f6',
            borderRadius: 12,
            justifyContent: 'center',
            alignItems: 'center',
          }}>
            <Text style={{ color: '#ffffff', fontSize: 18, fontWeight: 'bold' }}>→</Text>
          </View>
        </View>
      </View>

      <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f3f4f6' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ color: '#2563eb', fontSize: 14, fontWeight: '600' }}>
            View updates
          </Text>
          <View style={{ width: 8, height: 8, backgroundColor: '#3b82f6', borderRadius: 4 }} />
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default CircleCard;
