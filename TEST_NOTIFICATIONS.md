# 🧪 Testing Notifications - Quick Guide

## ⚡ **Quick Test Setup (2 Devices Minimum)**

### **Step 1: Set Up Test Accounts**

**Option A: Use Real Devices**
- Device 1: Sign in as User A (Poster)
- Device 2: Sign in as User B (Receiver)

**Option B: Use Simulator + Real Device**
- Simulator: User A (Poster) - for posting updates
- Real Device: User B (Receiver) - to receive notifications
  - ⚠️ Note: Push notifications only work on **real devices**, not simulators

### **Step 2: Create a Circle Together**

1. On Device 1 (User A): Create a circle
2. Invite User B to the circle
3. On Device 2 (User B): Accept the invite and join the circle

### **Step 3: Verify Push Tokens Are Registered**

**Check in Firestore:**
1. Go to Firebase Console → Firestore Database
2. Navigate to `users/{userId}` for both users
3. Verify both users have `expoPushToken` field populated
   - Format: `ExponentPushToken[xxxxxxxxxxxxx]`
   - ⚠️ If missing, the user needs to grant notification permissions

**Check in App:**
- On first sign-in, the app should request notification permissions
- Accept the permissions
- Check console logs for: "Push token saved to user document"

---

## 🧪 **Test Scenarios**

### **Test 1: Basic Notification Delivery** ✅

**Steps:**
1. On Device 2 (User B), ensure notifications are **ENABLED** for the circle
   - Go to Circle → Member Management → Notifications toggle should be ON
2. On Device 1 (User A), post a new update to the circle
3. On Device 2 (User B), you should receive a push notification

**Expected Result:**
- ✅ Notification appears on Device 2
- ✅ Notification shows circle name and update preview
- ✅ Tapping notification opens the app to the circle feed

---

### **Test 2: Muted Circle (No Notifications)** 🔕

**Steps:**
1. On Device 2 (User B), go to Member Management
2. Toggle notifications **OFF** (mute the circle)
3. Verify you see: "Notifications muted for this circle"
4. On Device 1 (User A), post another update
5. On Device 2 (User B), you should **NOT** receive a notification

**Expected Result:**
- ✅ No notification appears on Device 2
- ✅ Update still appears in the circle feed when you open the app
- ✅ Only the notification is suppressed

---

### **Test 3: Unmute and Re-enable** ✅

**Steps:**
1. On Device 2 (User B), toggle notifications back **ON**
2. Verify you see: "Notifications enabled for this circle"
3. On Device 1 (User A), post another update
4. On Device 2 (User B), you should receive the notification again

**Expected Result:**
- ✅ Notifications resume working
- ✅ Notification appears as expected

---

### **Test 4: Update Author Never Receives Notification** 👤

**Steps:**
1. On Device 1 (User A), ensure notifications are enabled
2. On Device 1 (User A), post an update
3. You should **NOT** receive a notification for your own update

**Expected Result:**
- ✅ Update author is excluded from notifications
- ✅ Other members still receive notifications

---

### **Test 5: Multiple Circles (Independent Mute States)** 🔄

**Steps:**
1. Create two circles: Circle A and Circle B
2. On Device 2 (User B):
   - Mute Circle A
   - Keep Circle B unmuted
3. On Device 1 (User A):
   - Post update to Circle A → Device 2 should NOT receive notification
   - Post update to Circle B → Device 2 SHOULD receive notification

**Expected Result:**
- ✅ Each circle has independent mute state
- ✅ Can mute one circle while receiving notifications from others

---

## 🔍 **Debugging**

### **If Notifications Don't Work:**

1. **Check Push Token:**
   ```bash
   # In Firestore Console
   users/{userId}/expoPushToken
   ```
   - Should exist and be a valid Expo token
   - If missing, user needs to grant permissions and re-sign in

2. **Check Notification Permissions:**
   - Go to device Settings → App → Notifications
   - Ensure notifications are enabled for the app

3. **Check Cloud Function Logs:**
   - Firebase Console → Functions → `onUpdateCreated` → Logs
   - Look for errors or skipped notifications
   - Should see logs like: "Sending notification to user X"

4. **Check User's Muted Circles:**
   ```bash
   # In Firestore Console
   users/{userId}/circlesMuted
   ```
   - Should be an array of circle IDs
   - If circleId is in array, user won't receive notifications

5. **Check Console Logs:**
   - Look for: "Error sending push notification"
   - Look for: "Skipping notification (user muted circle)"
   - Look for: "Push token saved to user document"

---

## 📊 **Check Cloud Function Execution**

**In Firebase Console:**
1. Go to Functions → `onUpdateCreated`
2. Click on "Logs" tab
3. After posting an update, you should see:
   ```
   Processing update created
   Getting circle members
   Checking muted circles for user: {userId}
   Sending notification to: {expoPushToken}
   ```

**Common Log Messages:**
- ✅ `"Sending notification to user X"` - Notification sent successfully
- ⚠️ `"User X has muted this circle"` - Correctly skipped
- ⚠️ `"User X has no push token"` - User needs to grant permissions
- ❌ `"Error sending notification"` - Check Expo service status

---

## ✅ **Success Checklist**

- [ ] Push tokens are registered for both users
- [ ] Notifications appear when circle is unmuted
- [ ] Notifications do NOT appear when circle is muted
- [ ] Toggle works both ways (on/off)
- [ ] Update author never receives notifications
- [ ] Multiple circles have independent mute states
- [ ] Notifications persist across app restarts
- [ ] Cloud Function logs show correct behavior

---

## 🚨 **Troubleshooting**

**Problem: No push token in Firestore**
- Solution: User needs to grant notification permissions on device
- Re-sign in to trigger token registration

**Problem: Notifications not arriving**
- Check device notification settings
- Verify Cloud Function is deployed and running
- Check Expo Push Notification service status

**Problem: Still receiving notifications when muted**
- Check `circlesMuted` array in Firestore
- Verify Cloud Function is checking mute status
- Look for errors in Cloud Function logs

**Problem: Toggle doesn't work**
- Check console for errors
- Verify Firestore rules allow updates
- Check network connection
