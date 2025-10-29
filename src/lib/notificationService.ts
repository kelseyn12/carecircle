// Notification service for push notifications
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform, Linking, Alert } from 'react-native';
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
  if (!Device.isDevice) {
    return false;
  }
  
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      
      // Show helpful alert with option to open settings
      Alert.alert(
        'Notification Permissions Required',
        finalStatus === 'denied' 
          ? 'Notifications are currently disabled. Would you like to open Settings to enable them?'
          : 'Please enable notification permissions in Settings to receive updates.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Open Settings', 
            onPress: () => openAppSettings(),
            style: 'default'
          },
        ]
      );
      
      return false;
    }
    
    return true;
  } catch (error: any) {
    console.error('Error requesting notification permissions:', error);
    return false;
  }
};

// Get Expo push token
export const getExpoPushToken = async (): Promise<string | null> => {
  try {
    if (!Device.isDevice) {
      return null;
    }

    // Get Expo project ID from various sources
    let projectId: string | undefined;
    
    // Known Expo project ID for this app (@kelseyn12/care-circle)
    const EXPO_PROJECT_ID = 'fe31d812-0085-4a97-acdb-202ae5eea8db';
    
    // Try different sources for project ID
    if (Constants.expoConfig?.projectId) {
      projectId = Constants.expoConfig.projectId;
    } else if (Constants.manifest?.extra?.expo?.projectId) {
      projectId = Constants.manifest.extra.expo.projectId;
    } else if (Constants.expoConfig?.extra?.eas?.projectId) {
      projectId = Constants.expoConfig.extra.eas.projectId;
    } else {
      // Fallback to known project ID
      projectId = EXPO_PROJECT_ID;
    }
    
    const tokenOptions = projectId ? { projectId } : {};
    const token = await Notifications.getExpoPushTokenAsync(tokenOptions);
    
    return token.data;
  } catch (error: any) {
    console.error('Error getting Expo push token:', error);
    return null;
  }
};

// Save push token to user document
export const savePushTokenToUser = async (userId: string, token: string): Promise<void> => {
  if (!db) {
    return;
  }

  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      expoPushToken: token,
    });
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
    
    return true;
  } catch (error: any) {
    console.error('Error initializing notifications:', error);
    return false;
  }
};

// Open device Settings for the app
export const openAppSettings = async (): Promise<void> => {
  try {
    if (Platform.OS === 'ios') {
      await Linking.openURL('app-settings:');
    } else {
      await Linking.openSettings();
    }
  } catch (error) {
    console.error('Error opening settings:', error);
    Alert.alert(
      'Unable to Open Settings',
      'Please manually open Settings → ' + 
      (Platform.OS === 'ios' 
        ? 'Care Circle → Notifications' 
        : 'Apps → Care Circle → Notifications') +
      ' and enable notifications.'
    );
  }
};

// Setup notification listeners for foreground notifications
export const setupNotificationListeners = () => {
  // Listen for notifications received while app is in foreground
  const receivedListener = Notifications.addNotificationReceivedListener((notification) => {
    // For Expo Go, manually show alerts in foreground
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      Alert.alert(
        notification.request.content.title || 'New Update',
        notification.request.content.body || 'You have a new update in your circle',
        [
          { text: 'OK', style: 'default' },
          {
            text: 'View',
            onPress: () => {
              const data = notification.request.content.data;
              if (data?.circleId) {
                // Navigation would happen via deep linking
              }
            },
          },
        ]
      );
    }
  });

  // Listen for notifications that the user taps
  const responseListener = Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data;
    if (data?.circleId) {
      // Navigation will be handled by the app's deep linking or navigation context
    }
  });

  return {
    receivedListener,
    responseListener,
    remove: () => {
      receivedListener.remove();
      responseListener.remove();
    },
  };
};

// Handle notification received (deprecated, use setupNotificationListeners instead)
export const handleNotificationReceived = (notification: Notifications.Notification) => {
  // Deprecated - use setupNotificationListeners instead
};

// Handle notification response (deprecated, use setupNotificationListeners instead)
export const handleNotificationResponse = (response: Notifications.NotificationResponse) => {
  // Deprecated - use setupNotificationListeners instead
};
