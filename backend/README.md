# Complaint Management System - Backend

A comprehensive Node.js backend API for managing customer complaints with AI-powered classification, real-time updates, and advanced analytics.

## Features

- **User Management**: Registration, authentication, role-based access control
- **Complaint Management**: Create, track, update, and resolve complaints
- **AI Classification**: Automatic categorization, sentiment analysis, and priority assignment
- **Real-time Updates**: WebSocket support for live notifications and updates
- **Analytics Dashboard**: Comprehensive reporting and metrics
- **SLA Management**: Automatic tracking and breach notifications
- **Multi-role Support**: Different interfaces for users, agents, administrators, and analytics managers

## Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Real-time**: Socket.IO
- **Validation**: Joi
- **Security**: Helmet, CORS, Rate limiting
- **Email**: Nodemailer (for notifications)

## Prerequisites

- Node.js (v16 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn package manager

## Installation

1. **Clone the repository and navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   ```bash
   cp .env.example .env
   ```
   
   Update the `.env` file with your configuration:
   ```env
   NODE_ENV=development
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/complaint_management
   JWT_SECRET=your-super-secure-jwt-secret-key-here
   JWT_EXPIRES_IN=7d
   ```

4. **Start MongoDB**
   Make sure MongoDB is running on your system

5. **Start the development server**
   ```bash
   npm run dev
   ```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh JWT token
- `POST /api/auth/logout` - User logout

### Users
- `GET /api/users/profile` - Get current user profile
- `PATCH /api/users/profile` - Update user profile
- `PATCH /api/users/password` - Change password
- `GET /api/users` - Get all users (admin only)
- `GET /api/users/:id` - Get user by ID (admin only)
- `PATCH /api/users/:id` - Update user (admin only)

### Complaints
- `GET /api/complaints` - Get complaints (filtered by role)
- `GET /api/complaints/:id` - Get complaint by ID
- `POST /api/complaints` - Create new complaint
- `PATCH /api/complaints/:id/status` - Update complaint status
- `PATCH /api/complaints/:id/assign` - Assign complaint to agent
- `POST /api/complaints/:id/updates` - Add comment/update
- `PATCH /api/complaints/:id/escalate` - Escalate complaint
- `POST /api/complaints/:id/feedback` - Submit feedback

### Analytics
- `GET /api/analytics/dashboard` - Get dashboard analytics
- `GET /api/analytics/team-performance` - Get team performance metrics
- `GET /api/analytics/trends/category` - Get category trends
- `GET /api/analytics/sla-compliance` - Get SLA compliance report

### Admin
- `GET /api/admin/stats` - Get system statistics
- `GET /api/admin/users` - Get all users with admin access
- `PATCH /api/admin/users/bulk` - Bulk update users
- `GET /api/admin/complaints` - Get all complaints with admin access
- `PATCH /api/admin/complaints/bulk-assign` - Bulk assign complaints
- `PATCH /api/admin/complaints/bulk-close` - Bulk close complaints
- `GET /api/admin/config` - Get system configuration
- `PATCH /api/admin/config` - Update system configuration

### Notifications
- `GET /api/notifications` - Get user notifications
- `PATCH /api/notifications/:id/read` - Mark notification as read
- `PATCH /api/notifications/read-all` - Mark all notifications as read
- `GET /api/notifications/preferences` - Get notification preferences
- `PATCH /api/notifications/preferences` - Update notification preferences

### Payments (Stripe Integration)
- `GET /api/payments/key` - Get Stripe publishable key
- `POST /api/payments/create-checkout-session` - Create Stripe checkout session
- `POST /api/payments/verify` - Verify payment and upgrade user plan
- `GET /api/payments/history` - Get payment history
- `POST /api/payments/webhook` - Stripe webhook handler
- `POST /api/payments/refund` - Refund payment (admin only)
- `GET /api/payments/all` - Get all payments (admin only)

## User Roles

### User (Customer)
- Create and track complaints
- View their own complaints
- Add comments and attachments
- Submit feedback for resolved complaints

### Agent (Support Staff)
- View assigned complaints
- Update complaint status
- Add internal and external comments
- Escalate complaints when needed
- View team dashboard

### Admin (Administrator)
- Full system access
- User management
- System configuration
- Advanced analytics
- Bulk operations

## AI Classification

The system includes an AI service that automatically:
- **Categorizes complaints** into predefined categories (Billing, Technical, Service, Product, General)
- **Analyzes sentiment** (Positive, Neutral, Negative)
- **Assigns priority** levels (Low, Medium, High, Urgent)
- **Extracts keywords** for better searchability

## Real-time Features

Using Socket.IO, the system provides:
- Live complaint updates
- Real-time notifications
- Typing indicators
- Status change notifications
- SLA breach alerts
- Assignment notifications

## Database Schema

### Users Collection
```javascript
{
  firstName: String,
  lastName: String,
  email: String (unique),
  password: String (hashed),
  role: String (user|agent|admin|analytics),
  department: String,
  isActive: Boolean,
  profile: Object,
  preferences: Object,
  createdAt: Date,
  updatedAt: Date
}
```

### Complaints Collection
```javascript
{
  userId: ObjectId (ref: User),
  title: String,
  description: String,
  category: String,
  priority: String,
  status: String,
  sentiment: String,
  assignedTo: ObjectId (ref: User),
  assignedTeam: String,
  slaTarget: Date,
  isEscalated: Boolean,
  escalationReason: String,
  feedback: Object,
  aiAnalysis: Object,
  metrics: Object,
  updates: Array,
  createdAt: Date,
  updatedAt: Date
}
```

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Rate limiting to prevent abuse
- CORS configuration
- Helmet for security headers
- Input validation with Joi
- Role-based access control

## Error Handling

The API includes comprehensive error handling:
- Mongoose validation errors
- JWT authentication errors
- Database connection errors
- Custom business logic errors
- Detailed error messages in development
- Generic error messages in production

## Testing

Run the test suite:
```bash
npm test
```

## Production Deployment

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Set production environment variables**
   ```env
   NODE_ENV=production
   MONGODB_URI=your-production-mongodb-uri
   JWT_SECRET=your-production-jwt-secret
   ```

3. **Start the production server**
   ```bash
   npm start
   ```

## API Documentation

For detailed API documentation, you can:
1. Import the API collection into Postman
2. Use tools like Swagger/OpenAPI (can be added)
3. Refer to the route files in `src/routes/`

## Stripe Payment Integration

### Prerequisites

- A Stripe account (sign up at https://stripe.com)
- Node.js and npm installed
- Backend server running

### Setup Steps

#### 1. Get Stripe API Keys

1. Log in to your [Stripe Dashboard](https://dashboard.stripe.com)
2. Go to **Developers** → **API keys**
3. Copy your **Publishable key** (starts with `pk_test_` for test mode)
4. Copy your **Secret key** (starts with `sk_test_` for test mode)

#### 2. Configure Environment Variables

Add the following to your `.env` file in the backend directory:

```env
# Stripe Payment Gateway
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Frontend URL (required for payment redirects)
FRONTEND_URL=http://localhost:5173
```

#### 3. Set Up Webhooks (Optional but Recommended)

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

#### 4. Test the Integration

##### Local Testing with Stripe CLI

1. Install the [Stripe CLI](https://stripe.com/docs/stripe-cli)
2. Login: `stripe login`
3. Forward webhooks to your local server:
   ```bash
   stripe listen --forward-to localhost:5000/api/payments/webhook
   ```
4. The CLI will provide a webhook signing secret. Update your `.env` file with it.

##### Test Card Numbers

Use these test card numbers in test mode:

- **Successful payment**: `4242 4242 4242 4242`
- **Payment requires authentication**: `4000 0025 0000 3155`
- **Payment is declined**: `4000 0000 0000 9995`

Use any future expiry date, any 3-digit CVC, and any postal code.

### Plan Pricing

Current plan pricing (in USD):
- **Pro Plan**: $4.99/month
- **Premium Plan**: $9.99/month

To modify pricing, update the `planPrices` object in `src/controllers/paymentController.js`.

### Frontend Integration

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

### Going Live

When ready to go live:

1. Switch to live API keys in your Stripe Dashboard
2. Update your `.env` file with live keys (they start with `sk_live_` and `pk_live_`)
3. Set up webhooks for your production domain
4. Update the `FRONTEND_URL` in `.env` to your production URL
5. Test thoroughly with real cards before launching

### Security Best Practices

- ✅ **Never expose your secret key** - it should only be in your `.env` file on the server
- ✅ **Always verify webhook signatures** - this is already implemented
- ✅ **Use HTTPS in production** - required for PCI compliance
- ✅ **Verify payment status** - always check `payment_status === 'paid'` before granting access
- ✅ **Handle errors gracefully** - provide clear error messages to users

### Troubleshooting

#### "Invalid API Key" Error
- Check that your `.env` file has the correct `STRIPE_SECRET_KEY`
- Make sure you're using test keys for development and live keys for production
- Restart your server after updating environment variables

#### Webhook Signature Verification Failed
- Verify the `STRIPE_WEBHOOK_SECRET` in your `.env` file
- If using Stripe CLI for local testing, use the secret provided by `stripe listen`
- Check that the webhook endpoint receives raw body (not JSON parsed)

#### Payment Succeeds but User Plan Not Updated
- Check the server logs for errors
- Verify that the `client_reference_id` in the session matches the user ID
- Ensure the webhook is properly set up and receiving events
- Check that the user exists in the database

### Stripe Support

- Stripe Documentation: https://stripe.com/docs
- Stripe API Reference: https://stripe.com/docs/api
- Stripe Testing: https://stripe.com/docs/testing

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please refer to the documentation or create an issue in the repository.
