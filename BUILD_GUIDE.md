# Build & Deployment Guide

This guide walks you through creating development builds and preparing for production deployment.

## Prerequisites

1. **EAS Account**: Sign up at [expo.dev](https://expo.dev) if you haven't already
2. **EAS CLI**: Install globally (already installed)
   ```bash
   npm install -g eas-cli
   ```
3. **Login to EAS**:
   ```bash
   eas login
   ```

## Development Builds

Development builds allow you to test native features like:
- QR code scanning (`expo-barcode-scanner`)
- Push notifications (`expo-notifications`)
- Secure storage (`expo-secure-store`)
- Image manipulation (`expo-image-manipulator`)

### Creating a Development Build

#### iOS Development Build

```bash
npm run build:dev:ios
```

This will:
- Build for iOS simulator (or device if you have a paid Apple Developer account)
- Create a development client with all native modules
- Allow you to test QR scanning and push notifications

**After build completes:**
1. Download the build from the EAS dashboard
2. Install on your iOS device/simulator
3. Run `expo start --dev-client` to connect to the development server

#### Android Development Build

```bash
npm run build:dev:android
```

This will:
- Build an APK for Android devices
- Create a development client with all native modules
- Allow you to test QR scanning and push notifications

**After build completes:**
1. Download the APK from the EAS dashboard
2. Install on your Android device (enable "Install from unknown sources")
3. Run `expo start --dev-client` to connect to the development server

### Using Development Builds

Once you have a development build installed:

1. **Start the development server:**
   ```bash
   npm start -- --dev-client
   ```

2. **Open the app** on your device (it should automatically connect)

3. **Test native features:**
   - QR code scanning should work
   - Push notifications should work
   - All native modules should be available

## Preview Builds

Preview builds are for testing before production:

```bash
# iOS
npm run build:preview:ios

# Android
npm run build:preview:android
```

These builds:
- Are optimized for testing
- Can be distributed via TestFlight (iOS) or direct download (Android)
- Don't require App Store submission

## Production Builds

Production builds are for App Store submission:

```bash
# iOS (creates .ipa for App Store)
npm run build:prod:ios

# Android (creates .aab for Google Play)
npm run build:prod:android
```

### iOS App Store Submission

1. **Build for production:**
   ```bash
   npm run build:prod:ios
   ```

2. **Submit to App Store:**
   ```bash
   eas submit --platform ios
   ```

3. **Requirements:**
   - Apple Developer account ($99/year)
   - App Store Connect app created
   - App metadata prepared

### Android Google Play Submission

1. **Build for production:**
   ```bash
   npm run build:prod:android
   ```

2. **Submit to Google Play:**
   ```bash
   eas submit --platform android
   ```

3. **Requirements:**
   - Google Play Developer account ($25 one-time)
   - Google Play Console app created
   - App metadata prepared

## Build Profiles Explained

### Development
- **Purpose**: Testing native features during development
- **Distribution**: Internal (your devices only)
- **Features**: Development client, debugging enabled
- **Use when**: Testing QR scanner, notifications, etc.

### Preview
- **Purpose**: Testing with real users before production
- **Distribution**: Internal (TestFlight, direct download)
- **Features**: Production-like but not optimized
- **Use when**: Beta testing with family/friends

### Production
- **Purpose**: App Store/Play Store release
- **Distribution**: Public (App Store, Google Play)
- **Features**: Fully optimized, release-ready
- **Use when**: Ready to publish

## Environment Variables

Make sure your `.env` file has all required variables:
```env
EXPO_PUBLIC_FIREBASE_API_KEY=...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=...
EXPO_PUBLIC_FIREBASE_PROJECT_ID=...
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=...
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
EXPO_PUBLIC_FIREBASE_APP_ID=...
EXPO_PUBLIC_INVITE_LINK_DOMAIN=care-circle-15fd5.web.app
```

## Testing Checklist

Before submitting to app stores:

### iOS
- [ ] Test on physical iOS device
- [ ] Test push notifications
- [ ] Test QR code scanning
- [ ] Test photo uploads
- [ ] Test deep linking
- [ ] Verify app icon and splash screen
- [ ] Test on different iOS versions (if possible)

### Android
- [ ] Test on physical Android device
- [ ] Test push notifications
- [ ] Test QR code scanning
- [ ] Test photo uploads
- [ ] Test deep linking
- [ ] Verify app icon and splash screen
- [ ] Test on different Android versions (if possible)

## Common Issues

### Build Fails
- Check EAS dashboard for detailed error logs
- Verify all environment variables are set
- Ensure app.config.js is valid
- Check that all dependencies are compatible

### Development Build Won't Connect
- Make sure you're running `expo start --dev-client`
- Check that device and computer are on same network
- Verify firewall isn't blocking connections

### Native Modules Not Working
- Ensure you're using a development build (not Expo Go)
- Check that plugins are configured in app.config.js
- Verify native modules are properly installed

## Next Steps

1. **Create development build** for your primary platform
2. **Test all features** on physical device
3. **Fix any issues** found during testing
4. **Create preview build** for beta testing
5. **Gather feedback** from beta testers
6. **Create production build** when ready
7. **Submit to app stores**

## Resources

- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [EAS Submit Documentation](https://docs.expo.dev/submit/introduction/)
- [App Store Connect](https://appstoreconnect.apple.com/)
- [Google Play Console](https://play.google.com/console/)

