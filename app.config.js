import 'dotenv/config';

const isDev = process.env.APP_ENV !== 'production';

export default {
  expo: {
    name: 'CareCircle Connect',
    slug: 'care-circle',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    splash: {
      image: './assets/splash-icon.png', // Falls back to icon.png if not found
      resizeMode: 'contain',
      backgroundColor: '#ffffff',
    },
    assetBundlePatterns: ['**/*'],

    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.carecircle.app',
      associatedDomains: ['applinks:care-circle-15fd5.web.app'],
      // Google Sign-In requires the reverse client ID as a URL scheme
      // Format: com.googleusercontent.apps.{CLIENT_ID}
      // The reverse client ID is: com.googleusercontent.apps.{iOS_CLIENT_ID}
      infoPlist: {
        CFBundleDisplayName: 'CareCircle Connect',
        CFBundleURLTypes: [
          {
            CFBundleURLSchemes: [
              'carecircle', // Your app's custom scheme
              // Google Sign-In reverse client ID
              // Extract from iOS client ID: 1005643316602-i4elqebsflij1m5gauplojddo95emlsp
              'com.googleusercontent.apps.1005643316602-i4elqebsflij1m5gauplojddo95emlsp',
            ],
          },
        ],
        ITSAppUsesNonExemptEncryption: false,
        NSPhotoLibraryUsageDescription:
          'CareCircle Connect needs access to your photo library so you can choose and share pictures in your family circle updates and messages.',
        NSCameraUsageDescription:
          'CareCircle Connect uses your camera to take photos for sharing updates with your CareCircle.',
      },
    },

    android: {
      package: 'com.carecircle.app',
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#FFFFFF',
      },
      intentFilters: [
        {
          action: 'VIEW',
          data: [
            {
              scheme: 'https',
              host: 'care-circle-15fd5.web.app',
              pathPrefix: '/inviteRedirect',
            },
            {
              scheme: 'carecircle',
            },
          ],
          category: ['BROWSABLE', 'DEFAULT'],
        },
      ],
    },

    web: {
      favicon: './assets/favicon.png', // Falls back to icon.png if not found
    },

    extra: {
      eas: {
        projectId: 'fe31d812-0085-4a97-acdb-202ae5eea8db',
      },
      firebase: {
        apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
        authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
      },
      inviteLinkDomain:
        process.env.EXPO_PUBLIC_INVITE_LINK_DOMAIN || 'care-circle-15fd5.web.app',
    },

    scheme: 'carecircle',

    plugins: [
      ...(isDev ? ['expo-dev-client'] : []),
      'expo-notifications',
      'expo-image-picker',
      [
        'expo-camera',
        {
          cameraPermission:
            'Allow CareCircle Connect to access your camera to scan QR codes for joining circles.',
        },
      ],
      'expo-apple-authentication',
      [
        'expo-build-properties',
        {
          ios: {
            bitcode: false,
            useFrameworks: 'static', // ← Add this back for stability with Firebase & BarcodeScanner
            // Disable Hermes to avoid minification issues with Firebase (can re-enable after testing)
            // hermes: false,
          },
          android: {
            // Disable Hermes to avoid minification issues with Firebase (can re-enable after testing)
            // hermes: false,
          },
        },
      ],
    ],
  },
};
