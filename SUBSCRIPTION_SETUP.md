# Subscription & Payment System Setup Guide

## Overview
This guide explains how to set up the subscription and payment system for QuickFix using Razorpay.

## Features Implemented

### 1. Three-Tier Subscription Plans

| Feature | Free | Pro | Premium |
|---------|------|-----|---------|
| Basic issue reporting | ✅ | ✅ | ✅ |
| AI diagnosis suggestions | ❌ | ✅ | ✅ |
| Live chat with agents | ❌ | ✅ | ✅ |
| Video call support | ❌ | ❌ | ✅ |
| Priority support | ❌ | ✅ | ✅ |
| Analytics dashboard | ❌ | ✅ | ✅ |
| Real-time alerts | ❌ | ❌ | ✅ |
| Team management | ❌ | ❌ | ✅ |
| Custom branding | ❌ | ❌ | ✅ |
| Complaint limit | 5/month | Unlimited | Unlimited |

### Pricing
- **Free**: ₹0/month
- **Pro**: ₹499/month
- **Premium**: ₹999/month

## Backend Setup

### 1. Environment Variables
Add these to your `.env` file in the `backend` directory:

```env
# Razorpay Configuration
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_SECRET=your_razorpay_key_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret

# JWT Secret (if not already set)
JWT_SECRET=your_jwt_secret_key
```

### 2. Get Razorpay Credentials

1. Sign up at [Razorpay](https://razorpay.com/)
2. Go to **Settings** → **API Keys**
3. Generate **Test Mode** API keys for development
4. Copy the **Key ID** and **Key Secret**
5. For webhooks, go to **Settings** → **Webhooks** and create a webhook URL
6. Copy the **Webhook Secret**

### 3. Install Dependencies

```bash
cd backend
npm install razorpay
```

### 4. Database Migration
The User model has been updated with subscription fields. Existing users will automatically get the `Free` plan.

## Frontend Setup

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Environment Variables
Add to your `.env` file in the `frontend` directory:

```env
VITE_API_URL=http://localhost:5000/api
```

### 3. Add Razorpay Script
The Razorpay checkout script is loaded dynamically, so no manual setup needed.

## API Endpoints

### Subscription Endpoints

#### Get Current Subscription
```http
GET /api/subscriptions/current
Authorization: Bearer <token>
```

#### Get Available Plans
```http
GET /api/subscriptions/plans
```

#### Check Feature Access
```http
GET /api/subscriptions/feature-access?feature=ai-diagnosis
Authorization: Bearer <token>
```

#### Upgrade Plan (Manual - for testing)
```http
POST /api/subscriptions/upgrade
Authorization: Bearer <token>
Content-Type: application/json

{
  "planType": "Pro",
  "orderId": "order_xxx",
  "paymentId": "pay_xxx",
  "amount": 499,
  "duration": 30
}
```

#### Downgrade to Free
```http
POST /api/subscriptions/downgrade
Authorization: Bearer <token>
```

### Payment Endpoints

#### Get Razorpay Key
```http
GET /api/payments/key
```

#### Create Order
```http
POST /api/payments/create-order
Authorization: Bearer <token>
Content-Type: application/json

{
  "planType": "Pro"
}
```

#### Verify Payment
```http
POST /api/payments/verify
Authorization: Bearer <token>
Content-Type: application/json

{
  "razorpay_order_id": "order_xxx",
  "razorpay_payment_id": "pay_xxx",
  "razorpay_signature": "signature_xxx",
  "planType": "Pro"
}
```

#### Get Payment History
```http
GET /api/payments/history
Authorization: Bearer <token>
```

### Admin Endpoints

#### Set User Plan (Admin Only)
```http
POST /api/subscriptions/admin/set-plan
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "userId": "user_id",
  "planType": "Premium",
  "duration": 30
}
```

#### Get Subscription Stats (Admin Only)
```http
GET /api/subscriptions/admin/stats
Authorization: Bearer <admin_token>
```

#### Get All Payments (Admin Only)
```http
GET /api/payments/all
Authorization: Bearer <admin_token>
```

## Using Plan-Based Middleware

### Protect Routes by Plan Type

```javascript
import { requirePlan, requireFeature, checkComplaintLimit } from './middleware/planAuth.js';

// Require specific plans
router.get('/analytics', auth, requirePlan(['Pro', 'Premium']), getAnalytics);

// Require specific feature access
router.post('/ai-diagnosis', auth, requireFeature('ai-diagnosis'), getDiagnosis);

// Check complaint limits for Free users
router.post('/complaints', auth, checkComplaintLimit, createComplaint);
```

## Frontend Usage

### Access the Pricing Page

The PricingPlans component is at:
```
/frontend/src/components/subscription/PricingPlans.tsx
```

Add it to your router:

```typescript
import PricingPlans from './components/subscription/PricingPlans';

// In your router
<Route path="/pricing" element={<PricingPlans />} />
```

### Check User's Plan

```typescript
import { useAuth } from './hooks/useAuth';

const { user } = useAuth();
const userPlan = user?.planType || 'Free';

// Conditionally render based on plan
{userPlan === 'Free' && <UpgradePrompt />}
```

### Use Subscription Service

```typescript
import subscriptionService from './services/subscriptionService';

// Get current subscription
const subscription = await subscriptionService.getCurrentSubscription();

// Check feature access
const access = await subscriptionService.checkFeatureAccess('ai-diagnosis');

// Initiate payment (opens Razorpay modal)
await subscriptionService.openPaymentModal(
  'Pro',
  (response) => {
    // Payment successful
    console.log('Payment successful:', response);
  },
  (error) => {
    // Payment failed
    console.error('Payment failed:', error);
  }
);
```

## Testing

### Test Payment Flow (Using Test Mode)

1. Make sure you're using Razorpay **Test Mode** keys
2. Navigate to `/pricing` page
3. Click "Upgrade to Pro" or "Upgrade to Premium"
4. Use Razorpay test cards:
   - **Successful**: 4111 1111 1111 1111
   - **Failed**: 4000 0000 0000 0002
   - CVV: Any 3 digits
   - Expiry: Any future date

### Manual Testing with Admin Endpoint

For testing without payment, use the admin endpoint:

```bash
curl -X POST http://localhost:5000/api/subscriptions/admin/set-plan \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "userId": "USER_ID",
    "planType": "Premium",
    "duration": 30
  }'
```

## Auto-Downgrade Expired Plans

Plans are automatically checked for expiry:
- When fetching subscription details
- When checking feature access
- When user authenticates

To add a CRON job for automatic cleanup:

```javascript
// backend/src/jobs/subscriptionCleanup.js
import cron from 'node-cron';
import { User } from '../models/User.js';

// Run daily at midnight
cron.schedule('0 0 * * *', async () => {
  console.log('Running subscription expiry check...');
  
  const expiredUsers = await User.find({
    planType: { $in: ['Pro', 'Premium'] },
    planExpiresAt: { $lt: new Date() }
  });
  
  for (const user of expiredUsers) {
    user.planType = 'Free';
    user.planExpiresAt = null;
    await user.save();
    console.log(`Downgraded user ${user.email} to Free plan`);
  }
  
  console.log(`Downgraded ${expiredUsers.length} users to Free plan`);
});
```

## Security Considerations

1. **Webhook Verification**: Always verify Razorpay webhook signatures
2. **Payment Verification**: Double-check payment status on backend before upgrading
3. **Plan Expiry**: Check expiry dates before granting premium features
4. **Rate Limiting**: Implement rate limiting on payment endpoints
5. **Logging**: Log all payment transactions for auditing

## Troubleshooting

### Issue: Payment Modal Not Opening
- Check if Razorpay script is loaded
- Verify RAZORPAY_KEY_ID is set correctly
- Check browser console for errors

### Issue: Payment Verification Failed
- Verify RAZORPAY_SECRET is correct
- Check signature calculation
- Ensure webhook secret matches

### Issue: Plan Not Updating After Payment
- Check if payment verification endpoint is called
- Verify user context is refreshed after upgrade
- Check backend logs for errors

## Next Steps

1. **Set up Production Keys**: Replace test keys with production keys when ready
2. **Add Email Notifications**: Send confirmation emails after successful payment
3. **Add Invoicing**: Generate invoices for payments
4. **Add Subscription Management**: Allow users to cancel/modify subscriptions
5. **Add Trial Period**: Offer 7-day free trial for Pro/Premium
6. **Add Discount Codes**: Implement promotional discount codes

## Support

For issues or questions:
- Check backend logs: `backend/logs/`
- Check frontend console
- Review Razorpay dashboard for payment details
- Contact Razorpay support for payment gateway issues
