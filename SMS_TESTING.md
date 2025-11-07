# SMS Testing Guide

This guide walks you through testing all SMS functionality in the Care Circle app.

## Prerequisites

1. **Twilio Account Setup** (see `TWILIO_SETUP.md`):
   - ✅ Twilio account created
   - ✅ Account upgraded (for A2P 10DLC)
   - ✅ Phone number purchased
   - ✅ Twilio credentials set as Firebase Secrets:
     - `TWILIO_ACCOUNT_SID`
     - `TWILIO_AUTH_TOKEN`
     - `TWILIO_PHONE_NUMBER`
   - ✅ Functions deployed (see deployment output)

2. **Your Phone Number**:
   - Have your own phone number ready for testing
   - Make sure it can receive SMS

## Testing Methods

### Method 1: Test via Firebase Console (Easiest)

#### Test 1: Send Initial SMS

1. Go to [Firebase Console](https://console.firebase.google.com/) → Your Project → Functions
2. Find `sendInitialSMS` function
3. Click "Test function" or use the test tab
4. Enter test data:
   ```json
   {
     "phoneNumber": "+1234567890",
     "circleName": "Test Circle",
     "inviteLink": "https://care-circle-15fd5.web.app/inviteRedirect/TEST123"
   }
   ```
   Replace `+1234567890` with your phone number (include country code, e.g., `+1` for US)
5. Click "Test"
6. **Expected**: You should receive an SMS with:
   - Invitation message
   - Preference options (1, 2, 3)
   - Invite link
   - App download link

#### Test 2: Send SMS Notification

1. In Firebase Console → Functions → `sendSMSNotification`
2. Enter test data:
   ```json
   {
     "phoneNumber": "+1234567890",
     "message": "Test message from Care Circle"
   }
   ```
3. Click "Test"
4. **Expected**: You should receive the test SMS

#### Test 3: Update SMS Preference

1. In Firebase Console → Functions → `updateSMSPreference`
2. Enter test data:
   ```json
   {
     "preference": "all"
   }
   ```
   Options: `"all"`, `"owner-only"`, or `"none"`
3. Click "Test"
4. **Expected**: Function should return success
5. **Verify**: Check Firestore → `users` → your user document → should see `smsNotificationPreference: "all"`

### Method 2: Test via App (Requires App Integration)

To test from the app, you'll need to add UI to call these functions. Here's what you need:

#### Add Phone Number to User Profile

First, users need to provide their phone number. You can add this to:
- Sign-up flow
- User profile settings
- Join circle flow

#### Call Functions from App

```typescript
import { httpsCallable } from 'firebase/functions';
import { functions } from '../lib/firebase';

// Send initial SMS
const sendInitialSMS = httpsCallable(functions, 'sendInitialSMS');
await sendInitialSMS({
  phoneNumber: '+1234567890',
  circleName: 'My Circle',
  inviteLink: 'https://care-circle-15fd5.web.app/inviteRedirect/ABC123'
});

// Update preference
const updateSMSPreference = httpsCallable(functions, 'updateSMSPreference');
await updateSMSPreference({ preference: 'all' });
```

### Method 3: Test SMS Webhook (Reply Handling)

#### Setup Webhook in Twilio

1. Go to [Twilio Console](https://console.twilio.com/) → Phone Numbers → Your Number
2. Scroll to "Messaging" section
3. Under "A MESSAGE COMES IN", enter:
   ```
   https://us-central1-care-circle-15fd5.cloudfunctions.net/smsWebhook
   ```
4. Set method to **HTTP POST**
5. Click **Save**

#### Test SMS Replies

1. **Send yourself an initial SMS** (using Test 1 above)
2. **Reply to the SMS** with:
   - `1` → Should set preference to "all"
   - `2` → Should set preference to "owner-only"
   - `3` → Should opt out
   - `stop` or `unsubscribe` → Should opt out
3. **Check the response**: You should receive a confirmation SMS
4. **Verify in Firestore**: 
   - Go to Firestore → `users` collection
   - Find your user document (by phone number)
   - Check `smsNotificationPreference` field
   - Should match your reply

### Method 4: Test Automatic SMS Notifications

This tests the integration with the update system:

1. **Set up a test user**:
   - Create a user in Firestore → `users` collection
   - Add `phoneNumber: "+1234567890"` (your number)
   - Add `smsNotificationPreference: "all"` or `"owner-only"`
   - Add `smsOptedIn: true`

2. **Create a test circle**:
   - Create a circle in Firestore → `circles` collection
   - Add your user ID to `members` array
   - If testing "owner-only", add owner ID to `ownerIds` array

3. **Post an update**:
   - Create an update in Firestore → `updates` collection:
     ```json
     {
       "circleId": "your-circle-id",
       "authorId": "author-user-id",
       "text": "Test update message",
       "createdAt": "2024-01-01T00:00:00Z"
     }
     ```

4. **Trigger the function**:
   - The `onUpdateCreated` function should automatically trigger
   - Or manually trigger it from Firebase Console → Functions → `onUpdateCreated`

5. **Expected**:
   - You should receive an SMS with the update
   - SMS format: "New update in [Circle Name]: [Author]: [Preview]..."

## Testing Checklist

### Basic SMS Functions
- [ ] `sendInitialSMS` - Sends initial invite SMS
- [ ] `sendSMSNotification` - Sends custom SMS
- [ ] `updateSMSPreference` - Updates user preference

### Webhook Testing
- [ ] SMS webhook URL configured in Twilio
- [ ] Reply "1" sets preference to "all"
- [ ] Reply "2" sets preference to "owner-only"
- [ ] Reply "3" opts out
- [ ] Invalid replies show help message
- [ ] Unknown phone numbers show error message

### Integration Testing
- [ ] User receives SMS when update is posted (preference: "all")
- [ ] User receives SMS only for owner updates (preference: "owner-only")
- [ ] User doesn't receive SMS when opted out (preference: "none")
- [ ] User doesn't receive SMS for muted circles
- [ ] Author doesn't receive SMS for their own updates

### Edge Cases
- [ ] Missing phone number (should not send)
- [ ] Invalid phone number format
- [ ] User not found in Firestore
- [ ] Circle not found
- [ ] Expired invite links

## Troubleshooting

### SMS Not Sending

1. **Check Twilio Credentials**:
   ```bash
   firebase functions:secrets:access TWILIO_ACCOUNT_SID
   firebase functions:secrets:access TWILIO_AUTH_TOKEN
   firebase functions:secrets:access TWILIO_PHONE_NUMBER
   ```

2. **Check Function Logs**:
   ```bash
   firebase functions:log --only sendInitialSMS
   ```

3. **Check Twilio Console**:
   - Go to Twilio Console → Monitor → Logs
   - Look for failed message attempts
   - Check error messages

4. **Verify Phone Number Format**:
   - Must include country code: `+1234567890`
   - No spaces or dashes
   - E.164 format

### Webhook Not Receiving Replies

1. **Check Webhook URL**:
   - Verify URL in Twilio Console matches your function URL
   - Must be HTTP POST method

2. **Check Function Logs**:
   ```bash
   firebase functions:log --only smsWebhook
   ```

3. **Test Webhook Manually**:
   - Use a tool like Postman or curl:
     ```bash
     curl -X POST https://us-central1-care-circle-15fd5.cloudfunctions.net/smsWebhook \
       -d "From=+1234567890&Body=1"
     ```

### A2P 10DLC Issues

- **SMS Blocked**: Check A2P 10DLC registration status in Twilio Console
- **Low Deliverability**: Ensure campaign is approved
- **Trial Account**: Upgrade account to enable A2P 10DLC

## Quick Test Script

Here's a quick way to test all functions at once:

```bash
# 1. Test sendInitialSMS
# Use Firebase Console or:
curl -X POST https://us-central1-care-circle-15fd5.cloudfunctions.net/sendInitialSMS \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -d '{"data":{"phoneNumber":"+1234567890","circleName":"Test","inviteLink":"https://..."}}'

# 2. Reply to SMS with "1"

# 3. Check Firestore for updated preference

# 4. Post an update to trigger automatic SMS
```

## Next Steps

After testing:
1. ✅ Integrate SMS into app UI (phone number input, preference settings)
2. ✅ Add SMS opt-in/opt-out in user settings
3. ✅ Test with real users
4. ✅ Monitor SMS costs in Twilio Console
5. ✅ Set up usage alerts

## Cost Monitoring

- Check Twilio Console → Monitor → Usage
- Set up alerts for high usage
- Monitor SMS delivery rates
- Track costs per circle/user

---

**Need Help?**
- Check `TWILIO_SETUP.md` for setup instructions
- Review Firebase Functions logs for errors
- Check Twilio Console for delivery status

