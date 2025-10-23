# Cloud Functions Setup Guide

This guide explains how to set up and deploy the Cloud Functions for the Care Circle app.

## Prerequisites

1. **Firebase CLI**: Install Firebase CLI
   ```bash
   npm install -g firebase-tools
   ```

2. **Firebase Project**: Make sure you have a Firebase project set up

3. **Node.js**: Version 18 or higher

## Setup Steps

### 1. Install Dependencies

Navigate to the functions directory and install dependencies:

```bash
cd functions
npm install
```

### 2. Firebase Login

Login to Firebase:

```bash
firebase login
```

### 3. Initialize Firebase Project

If not already done, initialize Firebase in your project root:

```bash
firebase init
```

Select:
- ✅ Functions
- ✅ Firestore
- ✅ Storage

### 4. Configure Functions

The functions are already configured in:
- `functions/package.json` - Dependencies
- `functions/tsconfig.json` - TypeScript config
- `functions/src/index.ts` - Function implementations
- `firebase.json` - Firebase configuration

### 5. Deploy Functions

Deploy the functions to Firebase:

```bash
firebase deploy --only functions
```

### 6. Set Up Dynamic Links (Optional)

For production, you'll need to set up Firebase Dynamic Links:

1. Go to Firebase Console → Dynamic Links
2. Create a new domain (e.g., `carecircle.page.link`)
3. Update the `generateDynamicLink` function in `functions/src/index.ts`

## Functions Overview

### 1. `createInvite`
- **Trigger**: Callable function
- **Purpose**: Creates a secure invite link for a circle
- **Input**: `{ circleId: string }`
- **Output**: `{ inviteId: string, dynamicLink: string, expiresAt: string }`

### 2. `acceptInvite`
- **Trigger**: Callable function
- **Purpose**: Allows users to join a circle via invite
- **Input**: `{ inviteId: string }`
- **Output**: `{ circleId: string, title: string, alreadyMember: boolean }`

### 3. `onUpdateCreated`
- **Trigger**: Firestore document creation
- **Purpose**: Sends push notifications when updates are posted
- **Triggered by**: `updates/{updateId}` document creation
- **Action**: Sends notifications to all circle members except the author

## Testing Functions

### Local Testing

Test functions locally:

```bash
cd functions
npm run serve
```

### Production Testing

1. Deploy functions:
   ```bash
   firebase deploy --only functions
   ```

2. Test in your app by creating invites and posting updates

## Security

- All functions require authentication
- Invites expire after 7 days
- Only circle members can create invites
- Push notifications are sent only to circle members
- Invites are one-time use by default

## Monitoring

Monitor function performance in Firebase Console:
- Go to Functions → Logs
- Check for errors and performance metrics
- Set up alerts for function failures

## Troubleshooting

### Common Issues

1. **Permission Denied**: Check Firestore rules
2. **Function Timeout**: Increase timeout in `firebase.json`
3. **Push Notification Failures**: Check Expo push tokens
4. **Dynamic Link Issues**: Verify domain configuration

### Debug Mode

Enable debug logging:

```bash
firebase functions:log --only createInvite,acceptInvite,onUpdateCreated
```

## Next Steps

After deploying functions:

1. Update your app to use the deployed functions
2. Test the complete invite flow
3. Verify push notifications work
4. Set up monitoring and alerts

