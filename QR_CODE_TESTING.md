# QR Code Testing Guide

This guide explains how to test the QR code invite functionality in Care Circle.

## How It Works

### The Flow:
1. **QR Code Created** → Contains invite link: `https://care-circle-15fd5.web.app/inviteRedirect/ABC123`
2. **QR Code Scanned** → Opens the invite link in browser
3. **Invite Redirect Function** → Validates invite and redirects to fallback page
4. **Fallback Page** → Tries to open app, shows download options if app not installed
5. **App Opens** → Deep link navigates to join screen (if app is installed)

## Testing Scenarios

### ✅ Scenario 1: Testing WITHOUT App Installed (Your Current Situation)

**What You're Seeing:**
- Scan QR code → Opens web page
- Web page shows: "Join Your Care Circle" with download buttons
- This is **CORRECT** behavior!

**Steps:**
1. Generate QR code in app (Circle Feed → Invite Members → Create Invite Link)
2. Scan QR code with phone camera (or QR scanner app)
3. **Expected**: Opens web page at `care-circle-15fd5.web.app/fallback.html?inviteId=...`
4. **Expected**: Shows download options (App Store / Google Play)
5. **Expected**: Page tries to open app with deep link (will fail gracefully if app not installed)

**This is working correctly!** The fallback page is designed to:
- Show download options when app isn't installed
- Try to open the app if it is installed
- Preserve the invite ID in the URL

---

### ✅ Scenario 2: Testing WITH App Installed

**Steps:**
1. Install the app on your phone (development build or production)
2. Generate QR code in app
3. Scan QR code with phone camera
4. **Expected**: 
   - Opens web page briefly
   - Automatically opens app via deep link
   - App navigates to Join screen with invite pre-filled
   - User can complete join request

**Deep Link Format:**
```
carecircle://join?inviteId=ABC123
```

---

### ✅ Scenario 3: Testing QR Scanner IN App

**Steps:**
1. Open app → Home screen
2. Tap "Join" button (👥)
3. Tap "Scan QR Code" button
4. Point camera at QR code
5. **Expected**: 
   - QR code scanned
   - Invite input field auto-filled
   - User can complete join form

**Note**: This requires a development build (not Expo Go) because `expo-barcode-scanner` is a native module.

---

## Testing Checklist

### Basic Functionality
- [ ] QR code generates correctly in InviteScreen
- [ ] QR code displays properly (readable, correct size)
- [ ] QR code contains correct invite link
- [ ] Scanning QR code opens correct URL

### Without App Installed
- [ ] QR code scan opens web page
- [ ] Web page shows "Join Your Care Circle" message
- [ ] Download buttons are visible and functional
- [ ] Invite ID is preserved in URL (`?inviteId=...`)

### With App Installed
- [ ] QR code scan opens web page briefly
- [ ] App opens automatically via deep link
- [ ] App navigates to Join screen
- [ ] Invite ID is passed correctly
- [ ] User can complete join request

### In-App Scanner
- [ ] Scanner opens when "Scan QR Code" is tapped
- [ ] Camera permission requested correctly
- [ ] QR code scanned successfully
- [ ] Invite input auto-filled
- [ ] User can complete join form

---

## Common Issues & Solutions

### Issue: QR Code Not Scanning
**Solutions:**
- Ensure QR code is clear and well-lit
- Hold phone steady
- Try different QR scanner apps
- Check if QR code is damaged/obscured

### Issue: Web Page Shows "Invite Not Found"
**Possible Causes:**
- Invite expired (7-day expiration)
- Invite already used (one-time use)
- Invalid invite ID
- Firestore rules blocking access

**Solutions:**
- Create a new invite link
- Check Firestore console for invite document
- Verify `inviteRedirect` function is deployed

### Issue: App Doesn't Open from QR Code
**Possible Causes:**
- App not installed
- Deep link not configured correctly
- iOS: Associated domains not set up
- Android: Intent filters not configured

**Solutions:**
- Verify app is installed
- Check `app.config.js` for deep link configuration
- For iOS: Verify `apple-app-site-association` file is deployed
- For Android: Check `intentFilters` in `app.config.js`

### Issue: Scanner Not Working in App
**Possible Causes:**
- Using Expo Go (scanner requires development build)
- Camera permission denied
- Native module not available

**Solutions:**
- Create a development build (see `DEVELOPMENT_BUILD.md`)
- Grant camera permissions
- Check `expo-barcode-scanner` is installed

---

## Testing Tools

### QR Code Generators (for testing)
- [QR Code Generator](https://www.qr-code-generator.com/)
- [QRCode Monkey](https://www.qrcode-monkey.com/)

### QR Code Scanners
- **iOS**: Built-in Camera app
- **Android**: Built-in Camera app or Google Lens
- **Third-party**: QR Code Reader apps

### Deep Link Testing
- **iOS**: Test with Safari (open `carecircle://join?inviteId=TEST`)
- **Android**: Use ADB: `adb shell am start -W -a android.intent.action.VIEW -d "carecircle://join?inviteId=TEST"`

---

## Expected URLs

### Invite Link Format:
```
https://care-circle-15fd5.web.app/inviteRedirect/ABC123XYZ
```

### Fallback Page:
```
https://care-circle-15fd5.web.app/fallback.html?inviteId=ABC123XYZ
```

### Deep Link:
```
carecircle://join?inviteId=ABC123XYZ
```

---

## Verification Steps

1. **Check Invite Link Format:**
   - Should start with `https://care-circle-15fd5.web.app/inviteRedirect/`
   - Followed by invite ID (alphanumeric, ~20 characters)

2. **Check QR Code Content:**
   - Scan with a QR reader app
   - Should show the full invite URL
   - Should match what's displayed in the app

3. **Check Web Page:**
   - Should load at `fallback.html`
   - Should have `inviteId` in URL query parameter
   - Should show download options

4. **Check Deep Link (if app installed):**
   - Should open app
   - Should navigate to Join screen
   - Should pre-fill invite ID

---

## Summary

**Your Current Situation: ✅ Working Correctly!**

When you scan the QR code without the app installed:
- ✅ Opens web page (expected)
- ✅ Shows "Join Your Care Circle" message (expected)
- ✅ Shows download buttons (expected)
- ✅ Preserves invite ID in URL (expected)

This is the **correct fallback behavior**. Once you install the app, scanning the QR code will:
1. Open the web page briefly
2. Automatically open the app
3. Navigate to the join screen

The web page serves as a bridge that:
- Shows download options if app isn't installed
- Opens the app if it is installed
- Preserves the invite information

---

**Need Help?**
- Check `DEVELOPMENT_BUILD.md` for creating a development build
- Review `app.config.js` for deep link configuration
- Check Firebase Functions logs for `inviteRedirect` errors
- Verify `fallback.html` is deployed to Firebase Hosting

