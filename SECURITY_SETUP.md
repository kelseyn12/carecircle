# Firebase Security Rules Setup

This document explains how to set up the Firebase security rules for the Care Circle app.

## Firestore Rules

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Firestore Database** → **Rules**
4. Replace the existing rules with the content from `firestore.rules`
5. Click **Publish**

## Storage Rules

1. In the Firebase Console, navigate to **Storage** → **Rules**
2. Replace the existing rules with the content from `storage.rules`
3. Click **Publish**

## What These Rules Do

### Firestore Rules
- **Users**: Can only read/write their own user documents
- **Circles**: Only members can read, only owner can modify
- **Updates**: Only circle members can read, only members can create
- **Invites**: Only circle owner can create invites

### Storage Rules
- **Updates**: Users can only upload/read their own photos
- **Profiles**: Users can only upload/read their own profile photos

## Testing Rules

After deploying the rules, test them by:
1. Creating a circle
2. Posting updates with photos
3. Trying to access other users' data (should be blocked)

## Security Features

- ✅ **User Isolation**: Users can only access their own data
- ✅ **Circle Privacy**: Only members can see circle content
- ✅ **Update Security**: Only circle members can post/read updates
- ✅ **Photo Protection**: Users can only access their own photos
- ✅ **Invite Control**: Only circle owners can create invites
