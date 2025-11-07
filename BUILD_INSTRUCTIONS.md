# Building Development Builds - Interactive Instructions

The EAS build commands require interactive prompts that can't be automated. Follow these steps to start your builds:

## Quick Start

Run the interactive build script:
```bash
./start-builds.sh
```

Or run the builds manually (see below).

## Manual Build Instructions

### iOS Development Build

1. **Start the iOS build:**
   ```bash
   eas build --profile development --platform ios
   ```

2. **When prompted:**
   - **"iOS app only uses standard/exempt encryption?"** → Answer: **`y` (yes)**
   - This is correct because we use standard encryption (Firebase, HTTPS)

3. **Build will be queued** and you'll get a link to track progress

### Android Development Build

1. **Start the Android build:**
   ```bash
   eas build --profile development --platform android
   ```

2. **When prompted:**
   - **"Generate a new Android Keystore?"** → Answer: **`y` (yes)**
   - This creates a signing key for your app (required for Android)

3. **Build will be queued** and you'll get a link to track progress

## Check Build Status

```bash
eas build:list
```

Or visit: https://expo.dev/accounts/kelseyn12/projects/care-circle/builds

## After Builds Complete

1. **Download the builds** from the EAS dashboard
2. **Install on your device:**
   - iOS: Install via TestFlight or direct download
   - Android: Install APK directly (enable "Install from unknown sources")
3. **Start the dev server:**
   ```bash
   npm start -- --dev-client
   ```
4. **Open the app** - it will automatically connect to your dev server

## Troubleshooting

### Builds Not Appearing
- Make sure you're logged in: `eas login`
- Check EAS service status: https://status.expo.dev/
- Free tier may have capacity limits during peak times

### Build Fails
- Check the build logs in the EAS dashboard
- Verify your `app.config.js` is valid
- Ensure all environment variables are set

### Can't Answer Prompts
- Run the commands in an interactive terminal (not in a script)
- Make sure your terminal supports interactive input

## Next Steps

After builds complete and you've tested on devices:
1. Test QR code scanning
2. Test push notifications
3. Test all native features
4. Proceed with production builds when ready

