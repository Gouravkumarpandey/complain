# SMS Testing Guide - QuickFix

## 🧪 Test Results

### ✅ Twilio Configuration Status:
- **Account SID**: Configured ✅
- **Auth Token**: Configured ✅
- **Twilio Phone Number**: Configured ✅
- **Twilio Client**: Initialized Successfully ✅

### ⚠️ Current Issue:
**Error Code 21608**: "The number +919876543210 is unverified. Trial accounts cannot send messages to unverified numbers."

---

## 📋 What This Means:

Your Twilio account is a **Trial Account**, which has the following limitations:

1. ✅ **Can send SMS** - The service is working
2. ⚠️ **Can only send to verified numbers** - You must verify phone numbers first
3. 💰 **Limited credits** - Trial accounts have limited free credits

---

## 🔧 How to Fix - Verify Your Phone Number:

### Option 1: Verify Phone Number in Twilio Console (Recommended)

1. **Go to Twilio Console**:
   ```
   https://console.twilio.com/us1/develop/phone-numbers/manage/verified
   ```

2. **Click "Add a new number"** or **"Verify a number"**

3. **Enter your phone number** in international format:
   ```
   +919876543210
   ```

4. **Receive verification code** via SMS or call

5. **Enter the code** to verify

6. **Done!** You can now send SMS to this number

### Option 2: Upgrade to Paid Account

1. Go to: https://console.twilio.com/us1/billing/manage-billing/upgrade
2. Add payment method
3. Upgrade account
4. You can now send SMS to ANY number (no verification needed)

---

## 🧪 Testing SMS After Verification:

### Test 1: Direct Twilio Test
```bash
cd backend
node test-twilio-direct.js
```

**Expected Output:**
```
✅ SUCCESS! SMS sent successfully!
📊 Message Details:
   Message SID: SM...
   Status: queued
   Date Created: ...
📲 Check your phone for the SMS!
```

### Test 2: Full System Test (via API)
```bash
# Test signup with SMS
curl -X POST http://localhost:5001/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123",
    "role": "user",
    "phoneNumber": "+919876543210"
  }'
```

**Expected:**
- User account created ✅
- OTP email sent ✅
- **SMS sent to phone** ✅

### Test 3: Check Backend Logs
```bash
# Watch backend logs for SMS notifications
# You should see:
✅ Signup SMS sent to +919876543210
```

---

## 📱 SMS Message Templates:

### Signup SMS:
```
Hello Gourav Pandey 👋

Welcome to QuickFix Complaint Management System.
We are here to help you resolve issues quickly and efficiently.

Thank you for joining us!
– QuickFix Team
```

### OTP SMS:
```
Your OTP for QuickFix is: 123456
Valid for 10 minutes. Do not share this code.
```

### Complaint Created SMS:
```
Hello Gourav Pandey,

Your complaint has been successfully registered.
Complaint ID: CMP-12345

Our team will review it shortly.
– QuickFix Support
```

---

## 🔍 Troubleshooting:

### Error 21608: Unverified Number
**Solution**: Verify the phone number in Twilio console or upgrade account

### Error 21211: Invalid Phone Number
**Solution**: Use E.164 format: `+[country code][number]`
- India: `+919876543210`
- USA: `+11234567890`

### Error 21606: Invalid From Number
**Solution**: Check your Twilio phone number in console

### Error 20003: Authentication Error
**Solution**: Check TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN in .env

### SMS Not Received
**Possible Causes:**
1. Phone number not verified (trial account)
2. Network delay (wait 1-2 minutes)
3. Phone number blocked by carrier
4. Twilio credits exhausted

---

## 💰 Twilio Trial Account Limits:

| Feature | Trial Account | Paid Account |
|---------|--------------|--------------|
| SMS to verified numbers | ✅ Yes | ✅ Yes |
| SMS to any number | ❌ No | ✅ Yes |
| Free credits | ~$15 | N/A |
| Phone number verification | ✅ Required | ❌ Not required |
| WhatsApp | ⚠️ Limited | ✅ Full access |

---

## 🚀 Next Steps:

### For Testing (Trial Account):
1. ✅ Verify your phone number in Twilio console
2. ✅ Run test script: `node test-twilio-direct.js`
3. ✅ Test signup flow with verified number
4. ✅ Check SMS delivery

### For Production (Recommended):
1. 💳 Upgrade to paid Twilio account
2. 📱 Add multiple phone numbers for testing
3. 📊 Set up SMS delivery webhooks
4. 🔔 Configure SMS alerts for failures
5. 💰 Monitor SMS usage and costs

---

## 📊 Current Configuration:

```env
# Twilio credentials are stored in backend/.env
# DO NOT commit actual credentials to git
TWILIO_ACCOUNT_SID=AC********************************
TWILIO_AUTH_TOKEN=********************************
TWILIO_PHONE_NUMBER=+1**********
```

**Status**: ✅ Configured in .env file (credentials hidden for security)

---

## 🎯 Quick Action Items:

### Immediate (To Test SMS):
- [ ] Verify your phone number at: https://console.twilio.com/us1/develop/phone-numbers/manage/verified
- [ ] Update `test-twilio-direct.js` with your verified phone number
- [ ] Run: `node test-twilio-direct.js`
- [ ] Check your phone for SMS

### For Production:
- [ ] Upgrade Twilio account to paid
- [ ] Test SMS with multiple numbers
- [ ] Set up SMS delivery monitoring
- [ ] Configure rate limiting
- [ ] Add SMS cost tracking

---

## 📞 Support:

**Twilio Support**: https://support.twilio.com
**Twilio Console**: https://console.twilio.com
**Twilio Docs**: https://www.twilio.com/docs/sms

---

## ✅ Summary:

✅ **Twilio is configured correctly**
✅ **SMS service is working**
⚠️ **Phone number needs verification** (trial account limitation)
🎯 **Action**: Verify your phone number in Twilio console

**Once verified, SMS will work perfectly!** 🎉
