// Emoji test component to verify emoji rendering works properly
import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { EMOJIS } from '../utils/emojiUtils';

const EmojiTest: React.FC = () => {
  const testEmojis = [
    { name: 'Heart', emoji: EMOJIS.HEART },
    { name: 'Pray', emoji: EMOJIS.PRAY },
    { name: 'Thumbs Up', emoji: EMOJIS.THUMBS_UP },
    { name: 'Comment', emoji: EMOJIS.COMMENT },
    { name: 'Blue Heart', emoji: EMOJIS.BLUE_HEART },
    { name: 'Warning', emoji: EMOJIS.WARNING },
    { name: 'Camera', emoji: EMOJIS.CAMERA },
    { name: 'Lightbulb', emoji: EMOJIS.LIGHTBULB },
    { name: 'Checkmark', emoji: EMOJIS.CHECKMARK },
    { name: 'Email', emoji: EMOJIS.EMAIL },
    { name: 'People', emoji: EMOJIS.PEOPLE },
    { name: 'Search', emoji: EMOJIS.SEARCH },
    { name: 'Apple', emoji: EMOJIS.APPLE },
    { name: 'Gear', emoji: EMOJIS.GEAR },
    { name: 'Arrow Left', emoji: EMOJIS.ARROW_LEFT },
    { name: 'Arrow Right', emoji: EMOJIS.ARROW_RIGHT },
    { name: 'Arrow Up', emoji: EMOJIS.ARROW_UP },
    { name: 'Arrow Down', emoji: EMOJIS.ARROW_DOWN },
    { name: 'Close', emoji: EMOJIS.CLOSE },
    { name: 'Success', emoji: EMOJIS.SUCCESS },
    { name: 'Error', emoji: EMOJIS.ERROR },
    { name: 'Info', emoji: EMOJIS.INFO },
  ];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f9fafb', padding: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' }}>
        Emoji Test
      </Text>
      
      <View style={{ 
        backgroundColor: '#ffffff', 
        borderRadius: 16, 
        padding: 20, 
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
      }}>
        <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 16, color: '#1f2937' }}>
          All Emojis Should Render Properly:
        </Text>
        
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          {testEmojis.map((item, index) => (
            <View key={index} style={{ 
              alignItems: 'center', 
              marginBottom: 16,
              minWidth: 80,
            }}>
              <Text style={{ fontSize: 32, marginBottom: 4 }}>
                {item.emoji}
              </Text>
              <Text style={{ fontSize: 12, color: '#6b7280', textAlign: 'center' }}>
                {item.name}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <View style={{ 
        backgroundColor: '#eff6ff', 
        borderRadius: 16, 
        padding: 20,
        borderWidth: 1,
        borderColor: '#dbeafe',
      }}>
        <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 12, color: '#1e40af' }}>
          Reaction Emojis Test:
        </Text>
        
        <View style={{ flexDirection: 'row', gap: 16 }}>
          <View style={{ 
            backgroundColor: '#fef2f2', 
            borderRadius: 20, 
            paddingHorizontal: 12, 
            paddingVertical: 8,
            flexDirection: 'row',
            alignItems: 'center',
          }}>
            <Text style={{ fontSize: 16 }}>{EMOJIS.HEART}</Text>
            <Text style={{ color: '#dc2626', fontSize: 14, fontWeight: '600', marginLeft: 4 }}>5</Text>
          </View>
          
          <View style={{ 
            backgroundColor: '#fefce8', 
            borderRadius: 20, 
            paddingHorizontal: 12, 
            paddingVertical: 8,
            flexDirection: 'row',
            alignItems: 'center',
          }}>
            <Text style={{ fontSize: 16 }}>{EMOJIS.PRAY}</Text>
            <Text style={{ color: '#ca8a04', fontSize: 14, fontWeight: '600', marginLeft: 4 }}>3</Text>
          </View>
          
          <View style={{ 
            backgroundColor: '#f0fdf4', 
            borderRadius: 20, 
            paddingHorizontal: 12, 
            paddingVertical: 8,
            flexDirection: 'row',
            alignItems: 'center',
          }}>
            <Text style={{ fontSize: 16 }}>{EMOJIS.THUMBS_UP}</Text>
            <Text style={{ color: '#16a34a', fontSize: 14, fontWeight: '600', marginLeft: 4 }}>7</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

export default EmojiTest;
