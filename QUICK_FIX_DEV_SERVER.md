# Quick Fix: "No Development Servers Found"

## The Issue
You built a **development build** which requires an Expo dev server to run. Development builds are meant for active development with hot reloading.

## Solutions

### Option 1: Start the Dev Server (Quick Fix)
```bash
npm start
```
Then in the app, it should automatically connect to the dev server.

**Note:** This requires your Mac and iPhone to be on the same network.

---

### Option 2: Build a Preview Build (Recommended for Testing)
Preview builds are **standalone** and don't need a dev server - perfect for testing:

```bash
eas build --profile preview --platform ios --local
```

This will:
- ✅ Create a standalone build (no dev server needed)
- ✅ Include all your fixes
- ✅ Work exactly like a production build
- ✅ Take ~10-20 minutes to build

**Why this is better for testing:**
- No dev server required
- Tests the actual production-like experience
- Can be uploaded to TestFlight
- More accurate testing environment

---

### Option 3: Install .ipa and Start Dev Server
1. Install the `.ipa` file on your device (via Xcode or TestFlight)
2. Start the dev server: `npm start`
3. The app should connect automatically

---

## Recommendation

**For thorough testing, use Option 2 (Preview Build):**
- It's a standalone build that doesn't need a dev server
- More accurate representation of production
- Can be uploaded to TestFlight
- All your fixes are included

The preview build will have build number 28 (auto-incremented) and will work standalone.
