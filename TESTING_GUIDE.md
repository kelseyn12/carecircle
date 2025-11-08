# Testing Guide - Sign-In & QR Scanner

## What You Can Test Now (Expo Go)

### ✅ Email/Password Authentication
- **Works in Expo Go**: Yes
- **Test Steps**:
  1. Run `npm start`
  2. Open in Expo Go
  3. Try signing up with email/password
  4. Try signing in
  5. Test password visibility toggle (eye icon)
  6. Test real-time validation (email format, password strength)

### ✅ UI Testing
- **Sign-In Screen UI**: Can test in Expo Go
- **What to Check**:
  - Google Sign-In button appearance (white with border, Google logo)
  - Apple Sign-In button appearance (black, Apple logo) - iOS only
  - Button spacing and alignment
  - Loading states
  - Error messages
  - Form validation feedback

## What Requires Development Build

### ❌ Apple Sign-In
- **Requires**: Development build (iOS only)
- **Why**: Native module not in Expo Go
- **Test After Build**:
  1. Install development build on iOS device
  2. Tap "Sign in with Apple"
  3. Authenticate with Face ID/Touch ID
  4. Verify user is created in Firebase

### ❌ Google Sign-In
- **Requires**: Development build + OAuth credentials
- **Why**: Native OAuth flow + needs client IDs configured
- **Current Status**: Code ready, needs:
  - Google OAuth client IDs in `.env` file
  - Firebase Google Sign-In enabled
- **Test After Build**:
  1. Add OAuth client IDs to `.env`
  2. Enable Google Sign-In in Firebase Console
  3. Install development build
  4. Tap "Sign in with Google"
  5. Complete OAuth flow
  6. Verify user is created

### ❌ QR Code Scanner
- **Requires**: Development build
- **Why**: `expo-camera` is a native module
- **Current Implementation**: Uses `expo-camera` with `CameraView`
- **Test After Build**:
  1. Install development build
  2. Tap "Join Circle" button
  3. Tap QR code icon
  4. Grant camera permission
  5. Scan a QR code
  6. Verify invite link is filled in

## Quick Test Checklist

### In Expo Go (Now):
- [ ] Sign-In screen loads correctly
- [ ] Email/password form works
- [ ] Password visibility toggle works
- [ ] Real-time validation shows errors
- [ ] Google button appears (won't work, but UI is visible)
- [ ] Apple button appears on iOS (won't work, but UI is visible)
- [ ] Error messages display correctly
- [ ] Loading states work

### After Development Build:
- [ ] Apple Sign-In works on iOS device
- [ ] Google Sign-In works (after OAuth setup)
- [ ] QR code scanner opens camera
- [ ] QR code scanning works
- [ ] Camera permissions requested correctly

## Testing QR Scanner

### Generate Test QR Code
1. Create an invite link in your app
2. Use a QR code generator (online tool or app)
3. Generate QR code from the invite URL
4. Test scanning it

### Expected Behavior
- Camera opens when tapping QR icon
- Permission prompt appears (first time)
- QR code is detected and scanned
- Invite link is automatically filled in
- User can complete join request

## Testing Social Sign-In

### Apple Sign-In
- **iOS Only**: Only shows on iOS devices
- **Requirements**: 
  - Development build installed
  - Device signed in with Apple ID
  - Firebase Apple Sign-In enabled

### Google Sign-In
- **All Platforms**: Shows on iOS, Android, Web
- **Requirements**:
  - Development build installed
  - OAuth client IDs configured
  - Firebase Google Sign-In enabled

## Current Status

✅ **UI**: Improved and ready
- Apple button: Black background, proper Apple logo icon
- Google button: White with border, Google logo
- Both buttons: Proper sizing (44px min height), shadows, spacing

✅ **Code**: Fully implemented
- Apple Sign-In: Complete implementation
- Google Sign-In: Complete implementation (needs OAuth setup)
- QR Scanner: Updated to use `expo-camera`

⏳ **Waiting For**:
- Development build to complete
- Google OAuth credentials (for Google Sign-In)

## Next Steps

1. **Test UI in Expo Go** (can do now)
2. **Wait for dev build** to complete
3. **Test native features** after installing build
4. **Set up Google OAuth** when ready to test Google Sign-In

