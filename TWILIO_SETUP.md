# Twilio SMS Setup Guide

This guide walks you through setting up Twilio for SMS notifications in the Care Circle app.

## Prerequisites

- Firebase project with Cloud Functions enabled
- Firebase CLI installed (`npm install -g firebase-tools`)
- Node.js 20+ installed

## Step 1: Create Twilio Account

1. Go to [https://www.twilio.com/try-twilio](https://www.twilio.com/try-twilio)
2. Sign up for a free account (includes $15.50 trial credit)
3. Verify your email and phone number

**⚠️ Important for SMS**: If you plan to send SMS to US numbers, you'll need to **upgrade your account** (add a payment method) to register for A2P 10DLC. The upgrade is free - you just need to add a credit card. You'll still have access to your trial credit.

## Step 2: Get Twilio Credentials

1. After logging in, go to the [Twilio Console Dashboard](https://console.twilio.com/)
2. You'll see your **Account SID** and **Auth Token** on the dashboard
   - **Account SID**: Starts with `AC...` (e.g., `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`)
   - **Auth Token**: Click "Show" to reveal it (e.g., `your_auth_token_here`)
3. **Save these credentials** - you'll need them in the next step

## Step 3: Get a Twilio Phone Number

1. In the Twilio Console, go to **Phone Numbers** → **Manage** → **Buy a number**
2. Click **Buy a number**
3. Select your country (e.g., United States)
4. For **Capabilities**, check:
   - ✅ **SMS**
   - ✅ **Voice** (optional, but recommended)
5. Click **Search** and choose a number
6. **Review the number** - You'll see:
   - Monthly fee (typically $1.15/month for US numbers)
   - Capabilities (Voice, SMS, MMS)
   - ⚠️ **Important**: You'll see a warning about "A2P 10DLC registration required" for SMS/MMS
7. Click **Buy** to purchase (free trial includes one number)
8. **Copy the phone number** (e.g., `+1234567890`)

### ⚠️ A2P 10DLC Registration (Required for US SMS)

**Important**: If you're sending SMS to US phone numbers, you **must** complete A2P 10DLC registration. This is a US regulatory requirement.

**⚠️ CRITICAL: Account Upgrade Required**
- **Trial accounts CANNOT register for A2P 10DLC**
- You must **upgrade your Twilio account** to a paid account first
- Registration is free, but requires an upgraded account
- Upgrade is required even if you're still within trial credit limits

**What is A2P 10DLC?**
- Application-to-Person (A2P) messaging over 10-digit long codes
- Required by US carriers for business messaging
- Helps prevent spam and ensures message deliverability
- **All unregistered US-bound messages will be blocked**

**How to Register:**
1. **First, upgrade your account** (if still on trial):
   - Go to Twilio Console → Account → Upgrade
   - Add a payment method (credit card)
   - You'll still have access to your trial credit
2. After upgrading, go to **Messaging** → **Regulatory Compliance** → **A2P 10DLC**
3. Click **Create a Brand** (your company/organization)
   - Provide company information
   - Business registration details
   - May require business verification
4. Click **Create a Campaign** (your use case)
   - Select "Healthcare" or "Notifications" as use case
   - Describe your messaging purpose
   - Provide sample messages
5. **Wait for approval** (can take 1-7 business days)
   - You can still use the number for testing during approval
   - Full SMS sending requires approval

**Alternative for Testing (Trial Account):**
- Use Twilio's test credentials (limited functionality)
- Send to verified phone numbers only (your own number)
- **Note**: Without A2P 10DLC, US SMS will be blocked
- For full production, you must upgrade and complete registration

## Step 4: Set Firebase Functions Environment Variables

You need to set the Twilio credentials as environment variables in Firebase Functions. There are two methods:

### Method A: Using Firebase CLI (Recommended)

Run these commands in your terminal (from the project root):

```bash
# Set Twilio Account SID
firebase functions:config:set twilio.account_sid="YOUR_ACCOUNT_SID_HERE"

# Set Twilio Auth Token
firebase functions:config:set twilio.auth_token="YOUR_AUTH_TOKEN_HERE"

# Set Twilio Phone Number
firebase functions:config:set twilio.phone_number="+1234567890"
```

**Note**: If you're using Firebase Functions v2 (which we are), you need to use **Firebase Secrets** instead:

```bash
# Set Twilio Account SID (as a secret)
echo "YOUR_ACCOUNT_SID_HERE" | firebase functions:secrets:set TWILIO_ACCOUNT_SID

# Set Twilio Auth Token (as a secret)
echo "YOUR_AUTH_TOKEN_HERE" | firebase functions:secrets:set TWILIO_AUTH_TOKEN

# Set Twilio Phone Number (as a secret)
echo "+1234567890" | firebase functions:secrets:set TWILIO_PHONE_NUMBER
```

### Method B: Using Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Functions** → **Configuration**
4. Click **Secrets** tab
5. Click **Add secret** and add:
   - `TWILIO_ACCOUNT_SID` = Your Account SID
   - `TWILIO_AUTH_TOKEN` = Your Auth Token
   - `TWILIO_PHONE_NUMBER` = Your Twilio phone number (with + and country code)

## Step 5: Update Functions Code (if needed)

The functions code already reads from `process.env`, but we need to ensure it works with Firebase Secrets. Let me check if we need to update the code...

**Note**: Firebase Functions v2 automatically makes secrets available as `process.env` variables, so our current code should work!

## Step 6: Build and Deploy Functions

**Yes, you need to deploy the functions** for Twilio to work. Here's how:

1. **Build the functions** (compile TypeScript):
   ```bash
   cd functions
   npm run build
   ```

2. **Deploy all functions**:
   ```bash
   cd ..
   firebase deploy --only functions
   ```

   Or deploy specific functions:
   ```bash
   firebase deploy --only functions:sendSMSNotification,functions:sendInitialSMS,functions:updateSMSPreference,functions:smsWebhook
   ```

3. **Wait for deployment** - This may take 2-5 minutes

## Step 7: Set Up SMS Webhook (for Reply Handling)

After deploying, you need to configure Twilio to send SMS replies to your webhook:

1. **Get your webhook URL**:
   - After deployment, Firebase will show you the function URLs
   - Or find it in Firebase Console → Functions → `smsWebhook`
   - It will look like: `https://us-central1-YOUR_PROJECT_ID.cloudfunctions.net/smsWebhook`

2. **Configure Twilio Webhook**:
   - Go to [Twilio Console](https://console.twilio.com/) → **Phone Numbers** → **Manage** → **Active numbers**
   - Click on your phone number
   - Scroll to **Messaging** section
   - Under **A MESSAGE COMES IN**, enter your webhook URL:
     ```
     https://us-central1-YOUR_PROJECT_ID.cloudfunctions.net/smsWebhook
     ```
   - Set method to **HTTP POST**
   - Click **Save**

## Step 8: Test SMS Functionality

### Test 1: Send Initial SMS (from app)

You'll need to call the `sendInitialSMS` function from your app. This requires:
- A user to provide their phone number
- The app to call the Cloud Function with phone number, circle name, and invite link

### Test 2: Test SMS Reply

1. Send yourself a test SMS with the initial message
2. Reply with:
   - `1` - Should set preference to "all"
   - `2` - Should set preference to "owner-only"
   - `3` - Should opt out
3. Check Firebase Console → Firestore → `users` collection to verify preference was updated

### Test 3: Test SMS Notifications

1. Create a circle and add a member with phone number
2. Set their SMS preference to "all" or "owner-only"
3. Post an update in the circle
4. The member should receive an SMS notification

## A2P 10DLC Registration Details

### Why It's Required
- US carriers (Verizon, AT&T, T-Mobile) require registration for business SMS
- Prevents spam and improves deliverability
- Without registration, SMS may be blocked or have low deliverability

### Registration Process
1. **Create Brand** (one-time, per organization)
   - Company name, address, business type
   - Tax ID or business registration
   - May require business verification documents

2. **Create Campaign** (per use case)
   - Use case: "Healthcare" or "Notifications"
   - Sample messages
   - Expected message volume
   - Opt-in/opt-out process description

3. **Approval Timeline**
   - Brand registration: 1-3 business days
   - Campaign approval: 1-7 business days
   - Can take longer for first-time registrations

### Cost
- **Account upgrade**: Free (just add payment method, no charge unless you use services)
- **Brand registration**: Free
- **Campaign registration**: Free
- **Monthly number fee**: ~$1.15/month (still applies)
- **SMS costs**: Same as before (~$0.0075 per message)
- **Note**: You keep your trial credit even after upgrading

### Testing Without Full Registration
- You can test with your own verified phone number
- Limited to a few test numbers during approval
- Full production requires completed registration

### Resources
- [Twilio A2P 10DLC Guide](https://www.twilio.com/docs/messaging/a2p-10dlc)
- [Registration Best Practices](https://www.twilio.com/docs/messaging/a2p-10dlc/registration-best-practices)

## Troubleshooting

### SMS blocked or not delivering
- **Check account status**: Ensure account is upgraded (not trial) for A2P 10DLC
- **Check A2P 10DLC status**: Ensure registration is complete and approved
- **Verify phone number**: Make sure recipient number is in correct format (+1XXXXXXXXXX)
- **Check Twilio logs**: Monitor → Logs → Messaging for delivery status
- **Test with verified number**: Try sending to your own verified number first
- **Trial account limitation**: Trial accounts cannot send US SMS without A2P 10DLC (which requires upgrade)

### Functions won't deploy
- Make sure you're logged in: `firebase login`
- Check that you're in the correct project: `firebase use YOUR_PROJECT_ID`
- Verify Node.js version: `node --version` (should be 20+)

### SMS not sending
- Check Firebase Functions logs: `firebase functions:log`
- Verify environment variables are set: `firebase functions:config:get`
- Check Twilio Console → Monitor → Logs for errors
- Verify phone number format includes country code (e.g., `+1234567890`)

### Webhook not receiving replies
- Verify webhook URL is correct in Twilio Console
- Check Firebase Functions logs for incoming requests
- Ensure webhook is set to **HTTP POST** method
- Test webhook URL manually with a POST request

### "SMS not configured" warnings
- This is normal if Twilio credentials aren't set yet
- Once configured, these warnings will stop
- SMS will only send if all three environment variables are set

## Cost Considerations

- **Trial Account**: $15.50 free credit
- **SMS Pricing**: ~$0.0075 per SMS in US (varies by country)
- **Monthly Cost**: Depends on usage
  - 100 SMS/month ≈ $0.75
  - 1,000 SMS/month ≈ $7.50
  - 10,000 SMS/month ≈ $75.00

## Security Best Practices

1. **Never commit secrets to Git** - They're stored in Firebase Secrets
2. **Use Firebase Secrets** - More secure than config variables
3. **Rotate credentials** - Change Auth Token periodically
4. **Monitor usage** - Set up Twilio usage alerts
5. **Rate limiting** - Consider implementing rate limits for SMS sending

## Next Steps

After setup:
1. ✅ Test SMS sending from the app
2. ✅ Test SMS reply handling
3. ✅ Test notification preferences
4. ✅ Monitor usage and costs
5. ✅ Set up usage alerts in Twilio Console

---

**Need Help?**
- [Twilio Documentation](https://www.twilio.com/docs)
- [Firebase Functions Documentation](https://firebase.google.com/docs/functions)
- Check Firebase Functions logs: `firebase functions:log`

