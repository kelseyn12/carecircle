# TestFlight Setup Guide

This guide walks you through setting up TestFlight for CareCircle Connect iOS app.

## Prerequisites

1. **Apple Developer Account** (paid, $99/year)
   - Sign up at: https://developer.apple.com
   - You need an active membership

2. **App Store Connect Access**
   - Log in at: https://appstoreconnect.apple.com
   - Use your Apple Developer account credentials

## Step 1: Create App in App Store Connect

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Click **"My Apps"** → **"+"** → **"New App"**
3. Fill in the details:
   - **Platform**: iOS
   - **Name**: CareCircle Connect
   - **Primary Language**: English (U.S.)
   - **Bundle ID**: 
     - **If `com.carecircle.app` appears in dropdown**: Select it
     - **If it doesn't appear**: Look for **"Register a new Bundle ID"** link (usually near the dropdown) and click it
     - In the registration form, enter:
       - **Description**: CareCircle Connect
       - **Bundle ID**: `com.carecircle.app` (Explicit)
       - Enable required capabilities (Push Notifications, Associated Domains)
       - Click **"Continue"** → **"Register"**
     - Go back to app creation and the Bundle ID should now appear
   - **SKU**: `care-circle-ios` (unique identifier, can be anything)
   - **User Access**: Full Access (or select specific users)
4. Click **"Create"**

**Note**: If the Bundle ID still doesn't appear, see `BUNDLE_ID_TROUBLESHOOTING.md` for detailed solutions.

## Step 2: Configure App Information

1. In your app's page, go to **"App Information"**
2. Fill in required fields:
   - **Category**: Health & Fitness (Primary)
   - **Subcategory**: Medical (Optional)
   - **Privacy Policy URL**: `https://care-circle-15fd5.web.app/privacy`
   - **Support URL**: `https://care-circle-15fd5.web.app/support`

## Step 3: Build and Submit to TestFlight

### Option A: Using EAS Build (Recommended)

```bash
# Build for production
eas build --platform ios --profile production

# After build completes, submit to App Store Connect
eas submit --platform ios --profile production
```

### Option B: Manual Upload

1. After EAS build completes, download the `.ipa` file
2. Use **Transporter** app (from Mac App Store) or **Xcode Organizer** to upload
3. Or use command line: `xcrun altool --upload-app --file app.ipa --apiKey YOUR_API_KEY --apiIssuer YOUR_ISSUER_ID`

## Step 4: Process Build in App Store Connect

1. Go to **App Store Connect** → Your App → **TestFlight** tab
2. Wait for build to process (usually 10-30 minutes)
3. You'll see status: "Processing" → "Ready to Submit"

## Step 5: Configure TestFlight

### Internal Testing (Up to 100 testers, instant access)

1. Go to **TestFlight** tab → **Internal Testing**
2. Click **"+"** to create a new group (e.g., "Internal Testers")
3. Add testers:
   - Click **"+"** next to testers
   - Add email addresses of team members
   - They must accept email invitation
4. Select your build
5. Click **"Start Testing"**

### External Testing (Up to 10,000 testers, requires review)

1. Go to **TestFlight** tab → **External Testing**
2. Click **"+"** to create a new group
3. Add testers (email addresses)
4. Fill in required information:
   - **What to Test**: Brief description of what testers should focus on
   - **Feedback Email**: Your support email
   - **Beta App Description**: What's new in this version
5. Select your build
6. Submit for Beta App Review (first time only, takes 24-48 hours)
7. After approval, click **"Start Testing"**

## Step 6: Testers Install TestFlight

1. Testers receive email invitation
2. They install **TestFlight** app from App Store (if not already installed)
3. Open invitation email on their iPhone/iPad
4. Tap **"View in TestFlight"** or **"Start Testing"**
5. App installs automatically

## Important Notes

### Build Requirements

- **Version Number**: Must increment for each new build
  - Current: `1.0.0` (in `app.config.js`)
  - Next build: `1.0.1`, then `1.0.2`, etc.

- **Build Number**: Automatically managed by EAS (using `appVersionSource: "remote"`)

### First External Test Submission

- First external test requires **Beta App Review** (similar to App Store review)
- Takes 24-48 hours
- Subsequent updates are usually instant (if no major changes)

### TestFlight Limitations

- **Builds expire**: After 90 days, testers can't install
- **Build limit**: Can have multiple builds, but only latest is available
- **Test duration**: External tests can run for up to 90 days

## Troubleshooting

### Build Not Appearing in TestFlight

1. Check build status in EAS dashboard
2. Verify bundle identifier matches: `com.carecircle.app`
3. Ensure you're logged into correct Apple Developer account
4. Wait 10-30 minutes for processing

### Testers Can't Install

1. Verify they accepted email invitation
2. Check they have TestFlight app installed
3. Ensure build hasn't expired (90 days)
4. Verify iOS version compatibility

### Build Processing Failed

1. Check email from Apple for specific errors
2. Verify certificates and provisioning profiles
3. Check App Store Connect for error messages
4. Review build logs in EAS dashboard

## Quick Commands

```bash
# Build for TestFlight
eas build --platform ios --profile production

# Submit to App Store Connect
eas submit --platform ios --profile production

# Check build status
eas build:list --platform ios

# View build details
eas build:view [BUILD_ID]
```

## Next Steps After TestFlight

Once testing is complete:

1. Fix any critical bugs found
2. Update version number
3. Build new version
4. Submit to App Store for review
5. Use `eas submit` to submit for App Store review

## Resources

- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [EAS Submit Documentation](https://docs.expo.dev/submit/introduction/)
- [App Store Connect Help](https://help.apple.com/app-store-connect/)
- [TestFlight Documentation](https://developer.apple.com/testflight/)

