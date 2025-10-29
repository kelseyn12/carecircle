# Notification Testing Guide

## ✅ **Fixed Issues:**
1. **Circle Mute Toggle Error** - Fixed `updateDoc` reference error
   - Changed `updateDoc` to `firestoreUpdateDoc` to match import
   - Added retry mechanism and proper error handling

## 🧪 **Testing Circle Mute Notifications**

### **Manual Testing Steps:**

#### **1. Test Mute Toggle Functionality:**
```
1. Open the app and sign in
2. Navigate to any circle you're a member of
3. Go to "Member Management" screen (gear icon)
4. Find the "Notifications" section with the toggle switch
5. Toggle notifications OFF (should mute the circle)
6. Verify you see: "Notifications muted for this circle"
7. Toggle notifications ON (should unmute the circle)
8. Verify you see: "Notifications enabled for this circle"
```

#### **2. Test Notification Delivery (Muted vs Unmuted):**

**Setup:**
- Device 1: User A (update author)
- Device 2: User B (receiver - test mute toggle)
- Device 3: User C (receiver - should receive notifications)

**Test Steps:**

**Scenario A: Unmuted Circle (Should Receive Notifications)**
1. On Device 2, make sure notifications are **ENABLED** for the circle
2. On Device 1, post a new update to the circle
3. On Device 2, verify you **DO** receive a push notification
4. Check notification content shows correct circle name and update preview

**Scenario B: Muted Circle (Should NOT Receive Notifications)**
1. On Device 2, toggle notifications **OFF** (mute the circle)
2. Verify you see "Notifications muted for this circle"
3. On Device 1, post another new update to the circle
4. On Device 2, verify you **DO NOT** receive a push notification
5. Check that Device 3 (which is unmuted) still receives the notification

**Scenario C: Unmute and Verify**
1. On Device 2, toggle notifications back **ON**
2. Verify you see "Notifications enabled for this circle"
3. On Device 1, post another update
4. On Device 2, verify you **DO** receive the notification again

#### **3. Test Cloud Function Mute Logic:**
The Cloud Function should skip sending notifications to users who have muted a circle.

**Verify in Cloud Functions Logs:**
1. Check Firebase Console → Functions → Logs
2. After posting an update, verify the `onUpdateCreated` function runs
3. Check that users with `circlesMuted` array containing the circleId are skipped
4. Verify only unmuted members receive notifications

#### **4. Test Edge Cases:**

**Test 1: Multiple Circles**
- Mute Circle A, keep Circle B unmuted
- Post update to Circle A → should NOT receive notification
- Post update to Circle B → should receive notification

**Test 2: Update Author**
- When you post an update, you should NOT receive a notification (regardless of mute status)
- This is handled in the Cloud Function

**Test 3: Persistence**
- Mute a circle on Device 1
- Close and reopen the app
- Verify the mute setting persisted
- Verify toggle switch reflects correct state

### **Automated Testing:**

Run the unit tests for mute toggle logic:
```bash
npm test src/lib/__tests__/firestoreLogic.test.ts
```

The tests verify:
- Adding circle to muted list
- Removing circle from muted list
- Handling empty lists
- Preventing duplicates

### **Firestore Rules Check:**

The Firestore rules allow users to update their own `circlesMuted` field:

```javascript
match /users/{userId} {
  allow update: if request.auth.uid == userId && 
    request.resource.data.diff(resource.data).affectedKeys().hasOnly(['circlesMuted']);
}
```

## 🔍 **Debugging Tips:**

1. **Check User Document in Firestore:**
   - Navigate to `users/{userId}`
   - Verify `circlesMuted` array contains correct circle IDs

2. **Check Cloud Function Logs:**
   - Firebase Console → Functions → onUpdateCreated → Logs
   - Look for "Skipping notification" messages for muted users

3. **Check Push Token:**
   - Verify user has `expoPushToken` in their user document
   - Without a token, notifications won't send regardless of mute status

4. **Test Network Conditions:**
   - Try muting/unmuting while offline
   - Verify operation queues and syncs when online

## ✅ **Success Criteria:**

- ✅ Toggle switch updates immediately
- ✅ Success message displays correctly
- ✅ Muted users do NOT receive notifications
- ✅ Unmuted users DO receive notifications
- ✅ Setting persists across app restarts
- ✅ Update author never receives notifications
- ✅ Multiple circles can have different mute states
