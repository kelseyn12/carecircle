# Testing Checklist for Build 27

## ⚠️ Important: Development Build vs Standalone Build

**If you see "no development servers found":**
- Development builds (`developmentClient: true`) require an Expo dev server
- For standalone testing, you have two options:

### Option 1: Start Dev Server (for development builds)
```bash
npm start
# Then connect the app to the dev server
```

### Option 2: Build Preview Build (standalone, no dev server needed)
```bash
eas build --profile preview --platform ios --local
```
This creates a standalone build that doesn't need a dev server.

### Option 3: Install .ipa Directly (current build)
The `.ipa` file can be installed directly, but development builds will look for a dev server.
For full testing without a dev server, use Option 2.

---

# Testing Checklist for Build 27

## ✅ Critical Fixes to Test

### 1. Deleted Account Updates Filtering
**What was fixed:** Updates from deleted accounts no longer show "[This update was deleted]"

**How to test:**
- [ ] Create a test account and post an update in a circle
- [ ] Delete that account
- [ ] Check the circle feed - the deleted account's update should **NOT appear** at all
- [ ] Verify no "[This update was deleted]" messages show up
- [ ] Check that other members' updates still display normally

**Expected result:** Deleted updates are completely hidden from the feed

---

### 2. Display Name Editing
**What was fixed:** Display name is now editable in Settings, and OAuth users get proper display names

**How to test:**
- [ ] Go to Settings screen
- [ ] Click "Edit Display Name" button
- [ ] Change your display name
- [ ] Save and verify it updates throughout the app
- [ ] Check that the new name appears in:
  - [ ] Settings screen header
  - [ ] Circle member lists
  - [ ] Update author names
  - [ ] Comments

**For OAuth users (Google/Apple):**
- [ ] Sign in with Google/Apple
- [ ] Verify display name is set (not just "User")
- [ ] If it shows "User", edit it in Settings

**Expected result:** Display names are editable and persist correctly

---

### 3. Paywall Enforcement
**What was fixed:** Free users can only create 1 circle, premium users can create unlimited

**How to test:**
- [ ] **As a free user:**
  - [ ] Create 1 circle (should work)
  - [ ] Try to create a 2nd circle
  - [ ] Should see paywall/upgrade prompt
  - [ ] Should NOT be able to create a 2nd circle
  - [ ] Delete the 1st circle
  - [ ] Try to create a new circle - should still show paywall (because `totalCirclesCreated` is tracked)

- [ ] **As a premium user:**
  - [ ] Subscribe to premium
  - [ ] Create multiple circles (should work)
  - [ ] Verify no paywall appears
  - [ ] Verify you can create unlimited circles

**Expected result:** Free tier is properly enforced, premium users have unlimited circles

---

### 4. Subscription Flow
**What was fixed:** Subscription purchase flow, "already subscribed" handling, and post-purchase navigation

**How to test:**
- [ ] **Purchase flow:**
  - [ ] Navigate to Paywall screen
  - [ ] Click "Subscribe Now"
  - [ ] Complete purchase with sandbox account
  - [ ] After purchase, should navigate to Create Circle screen
  - [ ] Should NOT see "limit reached" message after subscribing

- [ ] **"Already subscribed" handling:**
  - [ ] If you see "already subscribed" error
  - [ ] Should offer to restore purchases
  - [ ] Should navigate to Create Circle if subscription is active
  - [ ] Should show proper error if subscription isn't actually active

- [ ] **Subscription status:**
  - [ ] Go to Settings
  - [ ] Verify subscription status shows correctly
  - [ ] Check expiration date displays properly
  - [ ] Test "Manage Subscription" button (should open Apple settings)

**Expected result:** Smooth subscription flow with proper error handling

---

### 5. Account Deletion (Critical - Especially Apple Sign-In)
**What was fixed:** Account deletion now works for all auth providers, including Apple sign-in

**How to test:**
- [ ] **Email/Password account:**
  - [ ] Try to delete account
  - [ ] Should prompt for password (re-authentication)
  - [ ] Enter password and delete
  - [ ] Should complete successfully

- [ ] **Apple Sign-In account (CRITICAL):**
  - [ ] Sign in with Apple
  - [ ] Try to delete account
  - [ ] Should NOT show "undefined is not a function" error
  - [ ] Should complete deletion successfully
  - [ ] If it fails, should show clear error message (not crash)

- [ ] **Google Sign-In account:**
  - [ ] Sign in with Google
  - [ ] Try to delete account
  - [ ] Should work or show clear error message

**Expected result:** Account deletion works for all auth providers without crashes

---

### 6. Subscription Status Syncing
**What was fixed:** Subscription status now syncs correctly between RevenueCat and Firestore

**How to test:**
- [ ] Subscribe to premium
- [ ] Check Settings - should show "Premium Subscription"
- [ ] Close and reopen app
- [ ] Check Settings again - should still show premium status
- [ ] Check expiration date - should show correct date (not current date)
- [ ] Verify you can create unlimited circles

**Expected result:** Subscription status persists correctly across app sessions

---

## 🧪 Additional Testing

### General Functionality
- [ ] App launches without crashes
- [ ] Sign in/sign up works
- [ ] Create circle works
- [ ] Post updates works
- [ ] Add comments works
- [ ] Invite members works
- [ ] Join circle via invite link works
- [ ] Push notifications work (if applicable)

### Edge Cases
- [ ] Test with poor/no internet connection
- [ ] Test app after being backgrounded for a while
- [ ] Test with multiple accounts on the same device
- [ ] Test subscription restoration after app reinstall

---

## 🐛 Known Issues to Watch For

1. **"undefined is not a function"** - Should NOT appear when deleting Apple sign-in accounts
2. **"[This update was deleted]"** - Should NOT appear in feed
3. **"Welcome, User"** - Should show actual display name or allow editing
4. **Subscription expiration showing current date** - Should show correct expiration date
5. **Paywall not enforcing** - Free users should be blocked from creating 2nd circle

---

## 📝 Test Results Template

```
Build Number: 27
Test Date: ___________
Tester: ___________

Critical Fixes:
[ ] Deleted updates filtering - PASS / FAIL
[ ] Display name editing - PASS / FAIL
[ ] Paywall enforcement - PASS / FAIL
[ ] Subscription flow - PASS / FAIL
[ ] Account deletion (Apple) - PASS / FAIL
[ ] Subscription status syncing - PASS / FAIL

Issues Found:
1. 
2. 
3. 
```

---

## 🚨 If Something Fails

1. **Note the exact error message**
2. **Take a screenshot if possible**
3. **Note which account type you're using** (email/password, Apple, Google)
4. **Note the steps to reproduce**
5. **Check console logs** if available

---

## ✅ Success Criteria

All critical fixes should work:
- ✅ Deleted updates don't appear
- ✅ Display names are editable
- ✅ Paywall properly enforces 1 free circle
- ✅ Subscription flow works smoothly
- ✅ Account deletion works for all auth types
- ✅ Subscription status syncs correctly

If all these pass, the build is ready for TestFlight distribution!
