# Stripe Payment Integration Setup

This document provides instructions for setting up Stripe payment integration in the QuickFix backend.

## Prerequisites

- A Stripe account (sign up at https://stripe.com)
- Node.js and npm installed
- Backend server running

## Setup Steps

### 1. Get Stripe API Keys

1. Log in to your [Stripe Dashboard](https://dashboard.stripe.com)
2. Go to **Developers** → **API keys**
3. Copy your **Publishable key** (starts with `pk_test_` for test mode)
4. Copy your **Secret key** (starts with `sk_test_` for test mode)

### 2. Configure Environment Variables

Add the following to your `.env` file in the backend directory:

```env
# Stripe Payment Gateway
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Frontend URL (required for payment redirects)
FRONTEND_URL=http://localhost:5173
```

### 3. Set Up Webhooks (Optional but Recommended)

Webhooks allow Stripe to notify your server about payment events.

1. Go to **Developers** → **Webhooks** in your Stripe Dashboard
2. Click **Add endpoint**
3. Set the endpoint URL to: `https://yourdomain.com/api/payments/webhook`
   - For local testing, use a tool like [Stripe CLI](https://stripe.com/docs/stripe-cli) or [ngrok](https://ngrok.com/)
4. Select events to listen to:
   - `checkout.session.completed`
   - `payment_intent.payment_failed`
   - `charge.refunded`
5. Copy the **Signing secret** (starts with `whsec_`) and add it to your `.env` file as `STRIPE_WEBHOOK_SECRET`

### 4. Install Dependencies

The Stripe package should already be installed. If not, run:

```bash
cd backend
npm install stripe
```

### 5. Test the Integration

#### Local Testing with Stripe CLI

1. Install the [Stripe CLI](https://stripe.com/docs/stripe-cli)
2. Login: `stripe login`
3. Forward webhooks to your local server:
   ```bash
   stripe listen --forward-to localhost:5000/api/payments/webhook
   ```
4. The CLI will provide a webhook signing secret. Update your `.env` file with it.

#### Test Card Numbers

Use these test card numbers in test mode:

- **Successful payment**: `4242 4242 4242 4242`
- **Payment requires authentication**: `4000 0025 0000 3155`
- **Payment is declined**: `4000 0000 0000 9995`

Use any future expiry date, any 3-digit CVC, and any postal code.

## API Endpoints

### Get Stripe Publishable Key
```
GET /api/payments/key
```
Returns the Stripe publishable key for frontend use.

### Create Checkout Session
```
POST /api/payments/create-checkout-session
Authorization: Bearer <token>
Body: { "planType": "Pro" | "Premium" }
```
Creates a Stripe checkout session and returns the session ID and URL.

### Verify Payment
```
POST /api/payments/verify
Authorization: Bearer <token>
Body: { "sessionId": "<checkout_session_id>" }
```
Verifies the payment and upgrades the user's plan.

### Get Payment History
```
GET /api/payments/history
Authorization: Bearer <token>
```
Returns the payment history for the authenticated user.

### Webhook Handler
```
POST /api/payments/webhook
```
Receives webhook events from Stripe (signature verified).

### Refund Payment (Admin Only)
```
POST /api/payments/refund
Authorization: Bearer <token>
Body: { "paymentIntentId": "<payment_intent_id>", "amount": <optional_partial_amount> }
```
Refunds a payment (full or partial).

### Get All Payments (Admin Only)
```
GET /api/payments/all
Authorization: Bearer <token>
```
Returns all payments across all users (admin only).

## Plan Pricing

Current plan pricing (in USD):
- **Pro Plan**: $4.99/month
- **Premium Plan**: $9.99/month

To modify pricing, update the `planPrices` object in `src/controllers/paymentController.js`.

## Frontend Integration

The frontend needs to be updated to use Stripe Checkout. Here's a basic flow:

1. Fetch the publishable key from `/api/payments/key`
2. Create a checkout session by calling `/api/payments/create-checkout-session`
3. Redirect to the Stripe Checkout page using the `url` from the response
4. After payment, Stripe redirects to your success URL with the `session_id`
5. Call `/api/payments/verify` with the `session_id` to complete the process

Example frontend code:
```javascript
// 1. Create checkout session
const response = await fetch('/api/payments/create-checkout-session', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ planType: 'Pro' })
});

const { url } = await response.json();

// 2. Redirect to Stripe Checkout
window.location.href = url;

// 3. On success page, verify payment
const urlParams = new URLSearchParams(window.location.search);
const sessionId = urlParams.get('session_id');

await fetch('/api/payments/verify', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ sessionId })
});
```

## Going Live

When ready to go live:

1. Switch to live API keys in your Stripe Dashboard
2. Update your `.env` file with live keys (they start with `sk_live_` and `pk_live_`)
3. Set up webhooks for your production domain
4. Update the `FRONTEND_URL` in `.env` to your production URL
5. Test thoroughly with real cards before launching

## Security Best Practices

- ✅ **Never expose your secret key** - it should only be in your `.env` file on the server
- ✅ **Always verify webhook signatures** - this is already implemented
- ✅ **Use HTTPS in production** - required for PCI compliance
- ✅ **Verify payment status** - always check `payment_status === 'paid'` before granting access
- ✅ **Handle errors gracefully** - provide clear error messages to users

## Troubleshooting

### "Invalid API Key" Error
- Check that your `.env` file has the correct `STRIPE_SECRET_KEY`
- Make sure you're using test keys for development and live keys for production
- Restart your server after updating environment variables

### Webhook Signature Verification Failed
- Verify the `STRIPE_WEBHOOK_SECRET` in your `.env` file
- If using Stripe CLI for local testing, use the secret provided by `stripe listen`
- Check that the webhook endpoint receives raw body (not JSON parsed)

### Payment Succeeds but User Plan Not Updated
- Check the server logs for errors
- Verify that the `client_reference_id` in the session matches the user ID
- Ensure the webhook is properly set up and receiving events
- Check that the user exists in the database

## Support

- Stripe Documentation: https://stripe.com/docs
- Stripe API Reference: https://stripe.com/docs/api
- Stripe Testing: https://stripe.com/docs/testing

For issues with this integration, check the server logs and ensure all environment variables are correctly set.
