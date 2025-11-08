# Bundle ID Not Showing in App Store Connect - Troubleshooting

## The Issue
Your Bundle ID `com.carecircle.app` exists in Apple Developer Portal but doesn't appear in the App Store Connect dropdown when creating a new app.

## Solutions

### Option 1: Register Bundle ID Through App Store Connect (Recommended)

1. In App Store Connect, when creating a new app:
   - Instead of selecting from dropdown, look for a link like **"Register a new Bundle ID"** or **"Create new"**
   - Click it to register the Bundle ID directly through App Store Connect
   - This will sync it properly

### Option 2: Verify App ID Type in Developer Portal

1. Go to [Apple Developer Portal - Identifiers](https://developer.apple.com/account/resources/identifiers/list)
2. Find `com.carecircle.app`
3. Check the **Type** - it should be **"App IDs"** (not just "App Groups" or other types)
4. If it's the wrong type, you may need to create a new one specifically as an "App IDs" type

### Option 3: Create New App ID in Developer Portal

If the existing one isn't working:

1. Go to [Apple Developer Portal - Identifiers](https://developer.apple.com/account/resources/identifiers/list)
2. Click **"+"** to create new identifier
3. Select **"App IDs"** → Continue
4. Select **"App"** (not App Clip, etc.)
5. Description: "CareCircle Connect"
6. Bundle ID: Select **"Explicit"** and enter: `com.carecircle.app`
7. Enable required capabilities (Push Notifications, Associated Domains, etc.)
8. Register
9. Wait a few minutes, then try App Store Connect again

### Option 4: Use Wildcard Bundle ID (Not Recommended)

If you're in a hurry, you could:
1. Create a wildcard Bundle ID like `com.carecircle.*` in Developer Portal
2. But this limits some capabilities - **not recommended for production**

## Why This Happens

- App Store Connect and Developer Portal can have sync delays
- The App ID might have been created with wrong type
- The Bundle ID might be registered but not properly linked to your team

## Recommended Next Steps

1. **First, try Option 1** - look for "Register new Bundle ID" link in App Store Connect
2. **If that doesn't work**, verify the App ID type in Developer Portal (Option 2)
3. **If still not working**, create a fresh App ID following Option 3

## After Fixing

Once the Bundle ID appears in the dropdown:
1. Select it when creating your app
2. Complete app creation
3. Proceed with TestFlight setup

