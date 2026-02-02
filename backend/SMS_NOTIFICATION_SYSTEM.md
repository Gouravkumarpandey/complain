# SMS Notification System Documentation

## Overview
The SMS Notification System is a comprehensive backend feature that sends SMS messages to users when specific events occur in the QuickFix Complaint Management System.

## Features
- ✅ International phone number support (all country formats)
- ✅ Automatic SMS triggers for various events
- ✅ Dynamic and personalized messages
- ✅ Delivery status tracking in database
- ✅ Error handling and logging
- ✅ Bulk SMS support
- ✅ SMS statistics and analytics

## Setup Instructions

### 1. Install Dependencies
```bash
cd backend
npm install
```

This will install:
- `twilio` - SMS service provider
- `libphonenumber-js` - International phone number validation

### 2. Configure Environment Variables

Add the following to your `.env` file in the `backend` directory:

```env
# Twilio SMS Configuration
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# Application Name (for SMS messages)
APP_NAME=QuickFix
```

#### Getting Twilio Credentials:
1. Sign up at [https://www.twilio.com](https://www.twilio.com)
2. Get a free trial account (includes $15 credit)
3. From the Twilio Console Dashboard:
   - **Account SID** - Found on the dashboard
   - **Auth Token** - Click "Show" next to Auth Token
   - **Phone Number** - Get a phone number from "Phone Numbers" section

### 3. Database Model
The system automatically creates an `SMSLog` collection to track all SMS messages:

```javascript
{
  userId: ObjectId,
  phoneNumber: String,
  message: String,
  eventType: String,
  status: String, // 'pending', 'sent', 'delivered', 'failed'
  messageSid: String,
  deliveryStatus: String,
  sentAt: Date,
  errorCode: String,
  errorMessage: String
}
```

## Phone Number Format

### Supported Formats
The system accepts phone numbers in multiple formats:

- **International format with +**: `+1234567890`, `+919876543210`
- **International format with spaces**: `+1 234 567 8900`
- **National format** (if country is detected): `(234) 567-8900`

### Important Notes
- Phone numbers are automatically validated and converted to E.164 format (`+1234567890`)
- Invalid phone numbers are rejected during signup
- All SMS are sent to E.164 formatted numbers

### Example Phone Numbers by Country
```javascript
USA:        +1234567890
India:      +919876543210
UK:         +447911123456
Canada:     +14165551234
Australia:  +61412345678
```

## API Endpoints

### 1. Send Single SMS
```http
POST /api/sms/send
Authorization: Bearer <token>
Content-Type: application/json

{
  "userName": "John Doe",
  "phoneNumber": "+1234567890",
  "eventType": "REMINDER",
  "eventData": {
    "reminderText": "Your appointment is tomorrow at 3 PM"
  }
}
```

### 2. Send Bulk SMS
```http
POST /api/sms/send-bulk
Authorization: Bearer <token>
Content-Type: application/json

{
  "recipients": [
    {
      "userName": "John Doe",
      "phoneNumber": "+1234567890",
      "userId": "user_id_1"
    },
    {
      "userName": "Jane Smith",
      "phoneNumber": "+919876543210",
      "userId": "user_id_2"
    }
  ],
  "eventType": "STATUS_UPDATE",
  "commonEventData": {
    "complaintId": "12345",
    "status": "Resolved"
  }
}
```

### 3. Get SMS Status
```http
GET /api/sms/status/:messageSid
Authorization: Bearer <token>
```

### 4. Get User SMS Logs
```http
GET /api/sms/logs?limit=50&skip=0&eventType=SIGNUP
Authorization: Bearer <token>
```

### 5. Get SMS Statistics (Admin)
```http
GET /api/sms/stats?startDate=2024-01-01&endDate=2024-12-31
Authorization: Bearer <token>
```

### 6. Test SMS Configuration
```http
POST /api/sms/test
Authorization: Bearer <token>
Content-Type: application/json

{
  "phoneNumber": "+1234567890"
}
```

## SMS Event Types

The system supports the following event types:

| Event Type | Description | Trigger |
|------------|-------------|---------|
| `SIGNUP` | User registration | When user creates account |
| `OTP_GENERATION` | OTP verification | When OTP is generated |
| `INTERVIEW_SCHEDULED` | Interview notification | When interview is scheduled |
| `REMINDER` | General reminders | Custom reminders |
| `COMPLAINT_CREATED` | Complaint registered | When complaint is created |
| `COMPLAINT_ASSIGNED` | Complaint assigned to agent | When agent is assigned |
| `COMPLAINT_RESOLVED` | Complaint resolved | When complaint is closed |
| `STATUS_UPDATE` | Status change | When status changes |
| `PASSWORD_RESET` | Password reset | When password reset is requested |
| `PAYMENT_SUCCESS` | Payment successful | After successful payment |
| `PAYMENT_FAILED` | Payment failed | When payment fails |

## Message Templates

All messages follow this format:
```
Hello {UserName}, this is a notification from {AppName}. {EventMessage}. Thank you.
```

### Example Messages

**Signup:**
```
Hello John, this is a notification from QuickFix. Welcome to QuickFix! Thank you for signing up, John. We're excited to have you on board. Thank you.
```

**OTP Generation:**
```
Hello John, this is a notification from QuickFix. Your OTP for QuickFix is: 123456. Valid for 10 minutes. Do not share this code. Thank you.
```

**Complaint Created:**
```
Hello John, this is a notification from QuickFix. Your complaint #12345 has been registered successfully. We'll update you soon. Thank you.
```

## Automatic SMS Triggers

### Integration in Your Code

#### 1. Signup SMS (Already Integrated)
```javascript
import { triggerSignupSMS } from '../services/smsTriggers.js';

// In your signup controller
const user = await User.create(userData);
await triggerSignupSMS(user);
```

#### 2. OTP Generation
```javascript
import { triggerOTPSMS } from '../services/smsTriggers.js';

const otp = generateOTP();
await triggerOTPSMS(user, otp, 10); // 10 minutes expiry
```

#### 3. Complaint Created
```javascript
import { triggerComplaintCreatedSMS } from '../services/smsTriggers.js';

const complaint = await Complaint.create(complaintData);
await triggerComplaintCreatedSMS(user, complaint._id);
```

#### 4. Complaint Assigned
```javascript
import { triggerComplaintAssignedSMS } from '../services/smsTriggers.js';

await triggerComplaintAssignedSMS(user, complaintId, agentName);
```

#### 5. Payment Success
```javascript
import { triggerPaymentSuccessSMS } from '../services/smsTriggers.js';

await triggerPaymentSuccessSMS(user, amount, currency, transactionId);
```

## User Signup with Phone Number

### Frontend Integration

```javascript
// Signup form data
const signupData = {
  name: "John Doe",
  email: "john@example.com",
  password: "securePassword123",
  phoneNumber: "+1234567890", // International format recommended
  role: "user"
};

// API call
const response = await fetch('http://localhost:5000/api/auth/register', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(signupData)
});

const result = await response.json();
```

### Phone Number Input Component (React Example)

```jsx
import React, { useState } from 'react';

function PhoneNumberInput({ value, onChange }) {
  const [phoneNumber, setPhoneNumber] = useState(value || '');
  const [countryCode, setCountryCode] = useState('+1');

  const handlePhoneChange = (e) => {
    const number = e.target.value;
    setPhoneNumber(number);
    
    // Combine country code with phone number
    const fullNumber = number.startsWith('+') ? number : `${countryCode}${number}`;
    onChange(fullNumber);
  };

  return (
    <div className="flex gap-2">
      <select
        value={countryCode}
        onChange={(e) => setCountryCode(e.target.value)}
        className="w-24 px-3 py-2 border rounded"
      >
        <option value="+1">🇺🇸 +1</option>
        <option value="+91">🇮🇳 +91</option>
        <option value="+44">🇬🇧 +44</option>
        <option value="+61">🇦🇺 +61</option>
        <option value="+81">🇯🇵 +81</option>
        <option value="+86">🇨🇳 +86</option>
      </select>
      
      <input
        type="tel"
        value={phoneNumber}
        onChange={handlePhoneChange}
        placeholder="Enter phone number"
        className="flex-1 px-3 py-2 border rounded"
      />
    </div>
  );
}
```

## Error Handling

### Common Errors and Solutions

#### 1. Twilio Not Configured
```json
{
  "success": false,
  "error": "Twilio is not configured. Please add TWILIO credentials to .env file"
}
```
**Solution:** Add Twilio credentials to `.env` file

#### 2. Invalid Phone Number
```json
{
  "success": false,
  "error": "Invalid phone number format",
  "hint": "Please provide phone number in international format (e.g., +1234567890)"
}
```
**Solution:** Ensure phone number includes country code with + prefix

#### 3. SMS Delivery Failed
```json
{
  "success": false,
  "error": "Failed to send SMS",
  "errorCode": "21211"
}
```
**Solution:** Check Twilio error codes at [https://www.twilio.com/docs/api/errors](https://www.twilio.com/docs/api/errors)

## Monitoring and Analytics

### View SMS Statistics
```http
GET /api/sms/stats
```

Response:
```json
{
  "success": true,
  "data": {
    "total": 1250,
    "sent": 1180,
    "failed": 70,
    "pending": 0,
    "successRate": "94.40"
  }
}
```

### View Event Statistics
```http
GET /api/sms/stats/events
```

Response:
```json
{
  "success": true,
  "data": [
    {
      "eventType": "SIGNUP",
      "count": 450,
      "sent": 445,
      "failed": 5,
      "successRate": 98.89
    },
    {
      "eventType": "COMPLAINT_CREATED",
      "count": 320,
      "sent": 315,
      "failed": 5,
      "successRate": 98.44
    }
  ]
}
```

## Database Queries

### Find all SMS for a user
```javascript
const logs = await SMSLog.find({ userId: user._id })
  .sort({ sentAt: -1 })
  .limit(50);
```

### Find failed SMS
```javascript
const failedSMS = await SMSLog.find({ status: 'failed' })
  .sort({ sentAt: -1 });
```

### Get SMS count by event type
```javascript
const stats = await SMSLog.aggregate([
  {
    $group: {
      _id: '$eventType',
      count: { $sum: 1 }
    }
  }
]);
```

## Testing

### Test with Twilio Trial Account
1. Sign up for Twilio trial account
2. Verify your phone number (trial accounts can only send to verified numbers)
3. Use the test endpoint:

```bash
curl -X POST http://localhost:5000/api/sms/test \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+1234567890"}'
```

## Production Considerations

1. **Rate Limiting**: Add rate limiting to prevent SMS spam
2. **Cost Management**: Monitor SMS usage to control costs
3. **User Preferences**: Allow users to opt-out of SMS notifications
4. **Compliance**: Follow TCPA, GDPR, and other regulations
5. **Security**: Never log phone numbers in plain text in production logs

## Alternative SMS Providers

The system is designed to work with Twilio, but you can integrate other providers:

- **Fast2SMS** (India)
- **MSG91** (India)
- **AWS SNS** (Global)
- **Nexmo/Vonage** (Global)

To switch providers, modify `backend/src/services/smsService.js`

## Support

For issues or questions:
1. Check Twilio dashboard for delivery status
2. Review SMS logs in database
3. Check application logs for errors
4. Verify environment variables are correctly set

## Files Created

1. `backend/src/services/smsService.js` - Main SMS service
2. `backend/src/services/smsTriggers.js` - Event-based triggers
3. `backend/src/models/SMSLog.js` - Database model
4. `backend/src/controllers/smsController.js` - API controllers
5. `backend/src/routes/sms.js` - API routes
6. `backend/src/utils/phoneValidation.js` - Phone number validation utilities
7. `backend/SMS_NOTIFICATION_SYSTEM.md` - This documentation

## License
MIT
