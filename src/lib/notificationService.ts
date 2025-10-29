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

    // Get Expo project ID from various sources
    let projectId: string | undefined;
    
    // Known Expo project ID for this app (@kelseyn12/care-circle)
    const EXPO_PROJECT_ID = 'fe31d812-0085-4a97-acdb-202ae5eea8db';
    
    // Try different sources for project ID
    if (Constants.expoConfig?.projectId) {
      projectId = Constants.expoConfig.projectId;
      console.log('📦 Found project ID in expoConfig:', projectId);
    } else if (Constants.manifest?.extra?.expo?.projectId) {
      projectId = Constants.manifest.extra.expo.projectId;
      console.log('📦 Found project ID in manifest.extra:', projectId);
    } else if (Constants.expoConfig?.extra?.eas?.projectId) {
      projectId = Constants.expoConfig.extra.eas.projectId;
      console.log('📦 Found project ID in EAS config:', projectId);
    } else {
      // Fallback to known project ID
      projectId = EXPO_PROJECT_ID;
      console.log('📦 Using known Expo project ID:', projectId.substring(0, 8) + '...');
    }
    
    // For Expo Go, if no projectId found, try without it (should work if project is linked)
    const tokenOptions = projectId ? { projectId } : {};
    console.log('📲 Requesting Expo push token...' + (projectId ? ' (with projectId: ' + projectId.substring(0, 8) + '...)' : ' (auto-detect - may require published project)'));
    
    try {
      const token = await Notifications.getExpoPushTokenAsync(tokenOptions);
      console.log('✅ Successfully got Expo push token');
      return token.data;
    } catch (tokenError: any) {
      // If auto-detect failed and we tried without projectId, suggest publishing
      if (!projectId && tokenError?.message?.includes('projectId')) {
        console.error('❌ Push token failed - project needs to be initialized on Expo');
        console.error('💡 Solution: Run "eas build:configure" or "eas update" to initialize project');
        console.error('💡 Or manually create project at: https://expo.dev');
      }
      throw tokenError;
    }
  } catch (error: any) {
    console.error('❌ Error getting Expo push token:', error);
    console.error('Error details:', error?.message);
    
    // If project ID error, provide helpful guidance
    if (error?.message?.includes('projectId') || error?.message?.includes('UUID')) {
      console.warn('💡 Note: Make sure you have an Expo account and the project is linked');
      console.warn('Run: npx expo login and npx expo prebuild if needed');
    }
    
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
    console.log('📬 Notification received (foreground):', notification.request.content.title);
    console.log('Notification body:', notification.request.content.body);
    console.log('Notification data:', notification.request.content.data);
    console.log('Full notification:', JSON.stringify(notification, null, 2));
    
    // For Expo Go, we need to manually show alerts in foreground
    // The handler should work, but let's also try showing an Alert as fallback
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
                console.log('Would navigate to circle:', data.circleId);
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
    console.log('👆 Notification tapped:', response.notification.request.content.title);
    
    const data = response.notification.request.content.data;
    if (data?.circleId) {
      console.log('Navigating to circle:', data.circleId);
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
  console.log('Notification received:', notification);
};

// Handle notification response (deprecated, use setupNotificationListeners instead)
export const handleNotificationResponse = (response: Notifications.NotificationResponse) => {
  console.log('Notification response:', response);
};
