# Development Build Setup for QR Scanner

The QR code scanner feature requires a **development build** because `expo-barcode-scanner` is a native module that doesn't work in Expo Go.

## Why Development Build?

- **Expo Go** only includes a limited set of pre-installed native modules
- **Development Build** includes all your custom native modules (like `expo-barcode-scanner`)
- Required for: Camera access, barcode scanning, and other native features

## Quick Options

### Option 1: Use Development Build (Recommended)

1. **Install EAS CLI** (if not already installed):
   ```bash
   npm install -g eas-cli
   ```

2. **Login to Expo**:
   ```bash
   eas login
   ```

3. **Configure EAS**:
   ```bash
   eas build:configure
   ```

4. **Build for iOS** (requires Apple Developer account):
   ```bash
   eas build --profile development --platform ios
   ```

5. **Build for Android**:
   ```bash
   eas build --profile development --platform android
   ```

6. **Install on device**:
   - iOS: Download from the build URL or TestFlight
   - Android: Download the APK from the build URL

### Option 2: Local Development Build

1. **Install dependencies**:
   ```bash
   npx expo install expo-dev-client
   ```

2. **Prebuild native code**:
   ```bash
   npx expo prebuild
   ```

3. **Run on iOS**:
   ```bash
   npx expo run:ios
   ```

4. **Run on Android**:
   ```bash
   npx expo run:android
   ```

### Option 3: Temporary Workaround (Current)

The app now gracefully handles the missing QR scanner:
- QR scanner button still appears
- Shows a helpful message if scanner isn't available
- Users can still paste invite links manually
- No app crashes

## For Production

You'll need a development build for production anyway, so it's good to set this up now.

## Testing QR Scanner

Once you have a development build:
1. Open the app
2. Tap "Join Circle"
3. Tap the camera icon 📷
4. Grant camera permissions
5. Scan a QR code from the Invite screen

## Resources

- [Expo Development Builds Guide](https://docs.expo.dev/develop/development-builds/introduction/)
- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [Local Development Builds](https://docs.expo.dev/develop/development-builds/create-a-build/)

