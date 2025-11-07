# Testing SMS Notifications in the App

This guide walks you through testing SMS functionality using the app UI we just built.

## Prerequisites

1. ✅ Twilio credentials configured in Firebase Secrets
2. ✅ Functions deployed
3. ✅ Your phone number ready for testing
4. ✅ App running (Expo Go or development build)

## Test 1: Send SMS Invite from App

### Steps:

1. **Open the app** and sign in
2. **Create or open a circle**
3. **Tap the Members button** (or go to Circle Feed → Members)
4. **Tap "Invite Members"** button
5. **Tap "Create Invite Link"** button
   - Wait for the invite link to be created
   - You'll see the QR code and invite link
6. **Scroll down** to the "📱 Send via SMS" section
7. **Enter a phone number** in E.164 format:
   - Example: `+1234567890` (US)
   - Example: `+441234567890` (UK)
   - Must include country code with `+`
8. **Tap "Send SMS Invite"** button
9. **Expected Result**:
   - You should see "✅ SMS sent successfully!" toast
   - The phone number field clears
   - The recipient receives an SMS with:
     - Invitation message
     - Circle name
     - Preference options (1, 2, 3)
     - Invite link
     - App download link

### Troubleshooting:

- **"SMS service not available"**: Check if functions are deployed and Twilio secrets are set
- **"Invalid Phone Number"**: Make sure format is `+[country code][number]` (e.g., `+1234567890`)
- **SMS not received**: Check Twilio Console → Monitor → Logs for errors

## Test 2: Manage SMS Preferences in Settings

### Steps:

1. **From Home screen**, tap the **Settings button (⚙️)** in the top right
2. **Add Phone Number**:
   - Enter your phone number (e.g., `+1234567890`)
   - Tap "Save Phone Number"
   - Should see "✅ Phone number saved" toast
3. **Set SMS Preference**:
   - You'll see three options:
     - **All Notifications** - Receive SMS for all updates
     - **Owner-Only** - Only when owners post
     - **None** - No SMS notifications
   - Tap one to select it
   - Should see confirmation toast
4. **Verify in Firestore**:
   - Go to Firebase Console → Firestore → `users` collection
   - Find your user document
   - Check fields:
     - `phoneNumber`: Should be your number
     - `smsNotificationPreference`: Should match your selection
     - `smsOptedIn`: Should be `true` (unless "none" selected)

### Testing Each Preference:

#### Test "All Notifications":
1. Set preference to "All Notifications"
2. Have someone else post an update in a circle you're in
3. **Expected**: You receive SMS for the update

#### Test "Owner-Only":
1. Set preference to "Owner-Only"
2. Have a **member** (non-owner) post an update
   - **Expected**: You do NOT receive SMS
3. Have an **owner** post an update
   - **Expected**: You receive SMS

#### Test "None":
1. Set preference to "None"
2. Have anyone post an update
   - **Expected**: You do NOT receive SMS

## Test 3: SMS Reply Handling (Webhook)

### Prerequisites:
- Webhook configured in Twilio Console (see `TWILIO_SETUP.md`)
- You've received an SMS invite

### Steps:

1. **Receive an SMS invite** (from Test 1)
2. **Reply to the SMS** with one of these:
   - `1` → Sets preference to "all"
   - `2` → Sets preference to "owner-only"
   - `3` → Sets preference to "none"
   - `stop` or `unsubscribe` → Opts out
3. **You should receive a confirmation SMS**:
   - Example: "You will receive all notifications via SMS..."
4. **Verify in Firestore**:
   - Go to Firebase Console → Firestore → `users` collection
   - Find your user document (by phone number)
   - Check `smsNotificationPreference` field
   - Should match your reply

### Testing Invalid Replies:

1. Reply with `help` or any other text
2. **Expected**: You receive a help message with instructions

## Test 4: Automatic SMS Notifications

This tests the integration with the update system.

### Setup:

1. **Add your phone number** in Settings
2. **Set SMS preference** to "all" or "owner-only"
3. **Join or create a circle** with at least one other member

### Test Steps:

#### Scenario A: All Notifications

1. Set preference to "All Notifications"
2. Have **any member** post an update in the circle
3. **Expected**: You receive SMS with:
   - Circle name
   - Author name
   - Update preview (first 50 characters)
   - Link to view update

#### Scenario B: Owner-Only

1. Set preference to "Owner-Only"
2. Have a **member** (non-owner) post an update
   - **Expected**: You do NOT receive SMS
3. Have an **owner** post an update
   - **Expected**: You receive SMS

#### Scenario C: Muted Circle

1. Mute a circle (in Member Management screen)
2. Have someone post an update
   - **Expected**: You do NOT receive SMS (even if preference is "all")

#### Scenario D: Your Own Update

1. Post an update yourself
   - **Expected**: You do NOT receive SMS (authors never get notified)

## Test 5: End-to-End Flow

### Complete User Journey:

1. **User A (You)**:
   - Create a circle
   - Go to Invite screen
   - Send SMS invite to User B's phone number

2. **User B (Recipient)**:
   - Receives SMS with invite
   - Replies with `1` (all notifications)
   - Clicks invite link or downloads app
   - Joins circle

3. **User A**:
   - Posts an update in the circle

4. **User B**:
   - Receives SMS notification about the update
   - Can click link to view in app

## Testing Checklist

### Basic Functionality
- [ ] Send SMS invite from InviteScreen
- [ ] Phone number validation works
- [ ] Error messages display correctly
- [ ] Success toast appears

### Settings Screen
- [ ] Can add phone number
- [ ] Can update phone number
- [ ] Can remove phone number (clear field)
- [ ] Can select "All Notifications"
- [ ] Can select "Owner-Only"
- [ ] Can select "None"
- [ ] Preference saves correctly
- [ ] Visual indicators show selected preference

### SMS Replies
- [ ] Reply "1" sets preference to "all"
- [ ] Reply "2" sets preference to "owner-only"
- [ ] Reply "3" opts out
- [ ] Invalid replies show help message
- [ ] Unknown phone numbers show error

### Automatic Notifications
- [ ] Receive SMS for updates (preference: "all")
- [ ] Receive SMS only for owner updates (preference: "owner-only")
- [ ] Don't receive SMS when opted out
- [ ] Don't receive SMS for muted circles
- [ ] Don't receive SMS for own updates

## Quick Test Commands

### Check Function Logs:
```bash
# View SMS function logs
firebase functions:log --only sendInitialSMS
firebase functions:log --only smsWebhook
firebase functions:log --only onUpdateCreated
```

### Check Twilio Logs:
1. Go to [Twilio Console](https://console.twilio.com/)
2. Monitor → Logs → Messaging
3. Look for sent/received messages

### Check Firestore:
1. Go to Firebase Console → Firestore
2. Check `users` collection for:
   - `phoneNumber`
   - `smsNotificationPreference`
   - `smsOptedIn`

## Common Issues

### SMS Not Sending
- **Check**: Twilio secrets are set correctly
- **Check**: Functions are deployed
- **Check**: Phone number format is correct (`+1234567890`)
- **Check**: Twilio Console logs for errors

### SMS Not Received
- **Check**: Phone number is correct
- **Check**: A2P 10DLC registration (if sending to US numbers)
- **Check**: Twilio account has credits
- **Check**: Webhook is configured (for replies)

### Preferences Not Saving
- **Check**: User is authenticated
- **Check**: Firestore rules allow updates
- **Check**: Function logs for errors
- **Check**: Network connection

### Notifications Not Triggering
- **Check**: User has phone number set
- **Check**: SMS preference is not "none"
- **Check**: Circle is not muted
- **Check**: User is not the update author
- **Check**: `onUpdateCreated` function logs

## Tips for Testing

1. **Use your own phone number** for initial testing
2. **Test with multiple circles** to verify isolation
3. **Test edge cases**: empty phone, invalid format, etc.
4. **Monitor Twilio costs** during testing
5. **Check logs** if something doesn't work
6. **Test on real devices** for best results

## Next Steps After Testing

Once everything works:
1. ✅ Test with real users
2. ✅ Monitor SMS costs
3. ✅ Set up usage alerts in Twilio
4. ✅ Document any issues found
5. ✅ Update user documentation

---

**Need Help?**
- Check `TWILIO_SETUP.md` for setup
- Check `SMS_TESTING.md` for backend testing
- Review Firebase Functions logs
- Check Twilio Console for delivery status

