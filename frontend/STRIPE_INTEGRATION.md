# Stripe Payment Integration - Frontend

This document explains how the Stripe payment integration works on the frontend.

## Overview

The QuickFix application now uses Stripe for payment processing. When users click on a plan on the homepage or pricing page, they are redirected to Stripe's hosted checkout page for secure payment processing.

## User Flow

1. **User clicks on a plan** (on homepage `/` or pricing page `/pricing`)
2. **Redirected to Stripe Checkout** - Secure hosted payment page
3. **User completes payment** on Stripe
4. **Redirected back to app**:
   - Success: `/payment/success?session_id=...`
   - Cancel: `/payment/cancel`
5. **Payment verified** - Backend verifies the payment with Stripe
6. **Plan activated** - User's plan is upgraded in the database

## Routes

### Public Routes
- `/pricing` - Pricing plans page (accessible to all users)

### Protected Routes (requires login)
- `/payment/success` - Payment success page (verifies payment and shows confirmation)
- `/payment/cancel` - Payment cancelled page (shows when user cancels payment)

## Components

### PricingPlans Component
Located at: `src/components/subscription/PricingPlans.tsx`

**Features:**
- Displays all available plans (Free, Pro, Premium)
- Shows current user's plan
- Handles plan selection and initiates Stripe checkout
- Supports downgrading to free plan

**Key Functions:**
- `handleUpgrade(planType)` - Redirects to Stripe checkout or downgrades to free

### PaymentSuccess Component
Located at: `src/components/subscription/PaymentSuccess.tsx`

**Features:**
- Verifies payment with backend using session ID from URL
- Shows loading state during verification
- Displays success message when payment is confirmed
- Auto-redirects to dashboard after 3 seconds

### PaymentCancel Component
Located at: `src/components/subscription/PaymentCancel.tsx`

**Features:**
- Shows message when user cancels payment
- Provides options to retry or return to dashboard

## Services

### subscriptionService
Located at: `src/services/subscriptionService.ts`

**Key Methods:**

```typescript
// Get Stripe publishable key (not currently used, but available)
getStripeKey(): Promise<string>

// Create Stripe checkout session and get redirect URL
createCheckoutSession(planType: PlanType): Promise<StripeCheckoutSession>

// Redirect user to Stripe checkout
redirectToCheckout(planType: PlanType, onError: Function): Promise<void>

// Verify payment after user returns from Stripe
verifyPayment(sessionId: string): Promise<VerifyPaymentResponse>

// Downgrade to free plan
downgradePlan(): Promise<DowngradeResponse>

// Get payment history
getPaymentHistory(): Promise<PaymentRecord[]>
```

## Types

Located at: `src/types/subscription.ts`

**Key Types:**

```typescript
// Stripe checkout session
interface StripeCheckoutSession {
  sessionId: string;
  url: string;
  planType: PlanType;
}

// Plan types
type PlanType = 'Free' | 'Pro' | 'Premium';
```

## Environment Variables

Add to your `.env` file in the frontend:

```env
VITE_API_URL=http://localhost:5001/api
```

The backend URL is used for API calls to create checkout sessions and verify payments.

## How It Works

### 1. Plan Selection
When a user clicks "Upgrade to Pro" or "Upgrade to Premium":

```typescript
const handleUpgrade = async (planType: PlanType) => {
  // Call backend to create Stripe checkout session
  const session = await subscriptionService.createCheckoutSession(planType);
  
  // Redirect to Stripe hosted checkout page
  window.location.href = session.url;
};
```

### 2. Payment Processing
- User is redirected to Stripe's secure checkout page
- Stripe handles all payment details, PCI compliance, etc.
- No sensitive payment data touches your server

### 3. Return to Application
After payment, Stripe redirects back to your configured URLs:

**Success URL:**
```
http://localhost:5173/payment/success?session_id={CHECKOUT_SESSION_ID}
```

**Cancel URL:**
```
http://localhost:5173/payment/cancel
```

### 4. Payment Verification
The `PaymentSuccess` component extracts the session ID and verifies:

```typescript
const sessionId = searchParams.get('session_id');
const result = await subscriptionService.verifyPayment(sessionId);
// User plan is now upgraded
```

## Pricing

Current plan pricing (configured in backend):
- **Free Plan**: $0.00/month
- **Pro Plan**: $4.99/month
- **Premium Plan**: $9.99/month

## Security

✅ **Stripe handles all payment data** - Your application never sees credit card details
✅ **Session-based verification** - Payment is verified server-side with Stripe
✅ **Protected routes** - Payment pages require authentication
✅ **HTTPS required in production** - Stripe enforces secure connections

## Testing

### Test Mode
Use Stripe test cards for testing:

**Successful payment:**
- Card: `4242 4242 4242 4242`
- Date: Any future date
- CVC: Any 3 digits
- ZIP: Any 5 digits

**Payment requires authentication:**
- Card: `4000 0025 0000 3155`

**Payment declined:**
- Card: `4000 0000 0000 9995`

## Troubleshooting

### Payment doesn't complete
- Check browser console for errors
- Verify backend Stripe keys are correct
- Check that `FRONTEND_URL` is set correctly in backend `.env`

### User plan not updated
- Check backend logs for verification errors
- Verify webhook is configured (optional but recommended)
- Test the `/api/payments/verify` endpoint directly

### Redirect URLs not working
- Update `FRONTEND_URL` in backend `.env`
- Ensure frontend dev server is running on the expected port
- Check that routes are properly defined in `App.tsx`

## Production Checklist

Before going live:

- [ ] Switch to Stripe live mode keys in backend
- [ ] Update `FRONTEND_URL` to production domain
- [ ] Test complete payment flow with real cards
- [ ] Set up Stripe webhooks for production domain
- [ ] Enable HTTPS on your domain
- [ ] Test payment success and cancel flows
- [ ] Verify email notifications are working
- [ ] Set up monitoring for failed payments

## Support

For issues with:
- **Stripe integration**: Check [Stripe documentation](https://stripe.com/docs)
- **Payment verification**: Check backend logs and `/api/payments/verify` endpoint
- **Frontend routing**: Verify routes in `App.tsx` and component imports
