// Notification service for push notifications
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Request notification permissions
export const requestNotificationPermissions = async (): Promise<boolean> => {
  console.log('📱 Checking device type...');
  console.log('Device.isDevice:', Device.isDevice);
  
  if (!Device.isDevice) {
    console.warn('⚠️ Must use physical device for Push Notifications (simulator detected)');
    return false;
  }
  
  console.log('✅ Running on real device');
  console.log('🔍 Checking existing notification permissions...');
  
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    console.log('Current permission status:', existingStatus);
    
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      console.log('📲 Requesting notification permissions...');
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
      console.log('Permission request result:', status);
    } else {
      console.log('✅ Permissions already granted');
    }
    
    if (finalStatus !== 'granted') {
      console.warn('❌ Permission status is not granted:', finalStatus);
      console.warn('Please grant notification permissions in device Settings → App → Notifications');
      return false;
    }
    
    console.log('✅ Notification permissions granted');
    return true;
  } catch (error: any) {
    console.error('❌ Error checking/requesting permissions:', error);
    return false;
  }
};

// Get Expo push token
export const getExpoPushToken = async (): Promise<string | null> => {
  try {
    if (!Device.isDevice) {
      console.warn('Must use physical device for Push Notifications');
      return null;
    }

    const token = await Notifications.getExpoPushTokenAsync({
      projectId: 'care-circle-15fd5', // Replace with your actual project ID
    });
    
    return token.data;
  } catch (error) {
    console.error('Error getting Expo push token:', error);
    return null;
  }
};

// Save push token to user document
export const savePushTokenToUser = async (userId: string, token: string): Promise<void> => {
  if (!db) {
    console.warn('Firestore not initialized');
    return;
  }

  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      expoPushToken: token,
    });
    console.log('Push token saved to user document');
  } catch (error) {
    console.error('Error saving push token:', error);
  }
};

// Initialize notifications for a user
export const initializeNotifications = async (userId: string): Promise<boolean> => {
  try {
    console.log('🔔 Initializing notifications for user:', userId);
    
    // Request permissions
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) {
      console.error('❌ Notification permissions not granted');
      return false;
    }
    console.log('✅ Notification permissions granted');

    // Get push token
    const token = await getExpoPushToken();
    if (!token) {
      console.error('❌ Failed to get Expo push token');
      console.log('Note: Push tokens only work on real devices, not simulators');
      return false;
    }
    console.log('✅ Got Expo push token:', token.substring(0, 30) + '...');

    // Save token to user document
    await savePushTokenToUser(userId, token);
    
    console.log('✅ Notifications initialized successfully');
    return true;
  } catch (error: any) {
    console.error('❌ Error initializing notifications:', error);
    console.error('Error details:', error?.message, error?.code);
    return false;
  }
};

// Handle notification received
export const handleNotificationReceived = (notification: Notifications.Notification) => {
  console.log('Notification received:', notification);
  // You can add custom handling here
};

// Handle notification response (when user taps notification)
export const handleNotificationResponse = (response: Notifications.NotificationResponse) => {
  console.log('Notification response:', response);
  // You can add navigation logic here
};
