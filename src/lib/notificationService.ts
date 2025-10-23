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
  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.warn('Failed to get push token for push notification!');
      return false;
    }
    
    return true;
  } else {
    console.warn('Must use physical device for Push Notifications');
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
    // Request permissions
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) {
      return false;
    }

    // Get push token
    const token = await getExpoPushToken();
    if (!token) {
      return false;
    }

    // Save token to user document
    await savePushTokenToUser(userId, token);
    
    console.log('Notifications initialized successfully');
    return true;
  } catch (error) {
    console.error('Error initializing notifications:', error);
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
