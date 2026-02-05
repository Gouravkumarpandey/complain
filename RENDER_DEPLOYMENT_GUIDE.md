# 🚀 Render Deployment Checklist & Troubleshooting Guide

## 📋 Environment Variables Required for Render

Copy and paste these into your Render service's Environment Variables section:

### 🔧 Core Configuration
```bash
NODE_ENV=production
PORT=5001
```

### 🌐 URLs (Update with your actual domains)
```bash
FRONTEND_URL=https://www.innovexlabs.me
BACKEND_URL=https://your-app-name.onrender.com
```

### 🗄️ Database (CRITICAL - Most Common Issue)
```bash
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/complaintsdb?retryWrites=true&w=majority
```

### 🔐 Authentication & Security
```bash
JWT_SECRET=your_super_secure_jwt_secret_key_here_minimum_32_characters
JWT_EXPIRES_IN=7d

GOOGLE_CLIENT_ID=537022582047-lnvpp7g1ou4b59of2uubd92v65sq03si.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_actual_google_client_secret

FACEBOOK_APP_ID=786223494164698
FACEBOOK_APP_SECRET=your_actual_facebook_app_secret
```

### 💳 Payments (Optional - can be added later)
```bash
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

### 📱 SMS & Communications
```bash
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1234567890

EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_specific_password
```

### 🤖 AI Services
```bash
USE_DEEPSEEK=true
DEEPSEEK_API_KEY=sk-or-v1-your_deepseek_api_key
DEEPSEEK_API_URL=https://openrouter.ai/api/v1
AI_SERVICE_URL=http://localhost:8001
```

### ⚡ Performance & Limits
```bash
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## 🛠️ Step-by-Step Render Deployment

### 1. 📝 Set Environment Variables
1. Go to your Render service dashboard
2. Click on "Environment" tab
3. Add each variable above with your actual values
4. **CRITICAL**: Ensure `MONGODB_URI` is exactly as shown (case-sensitive)

### 2. 🗄️ MongoDB Atlas Setup
1. **Whitelist Render IPs**: Go to MongoDB Atlas > Network Access
2. Click "Add IP Address"
3. Use `0.0.0.0/0` for testing (allow all IPs)
4. **For production**: Add specific Render IP ranges
5. **Verify cluster is running** (not paused)

### 3. 🔐 Google OAuth Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Find your OAuth 2.0 Client ID
3. Add to "Authorized JavaScript origins":
   - `https://www.innovexlabs.me`
   - `https://your-app-name.onrender.com`

### 4. 🚀 Deploy & Test
1. Click "Deploy latest commit" in Render
2. Monitor logs for connection success
3. Test the deployed application

## 🔍 Common Issues & Solutions

### ❌ "MONGODB_URI is not defined"
**Solution**:
- ✅ Check variable name is exactly `MONGODB_URI` (case-sensitive)
- ✅ Verify value starts with `mongodb+srv://` or `mongodb://`
- ✅ Redeploy after adding variables

### ❌ "Authentication failed" (MongoDB)
**Solution**:
- ✅ Check username/password in connection string
- ✅ Verify user has `readWrite` permissions
- ✅ Ensure cluster is not paused

### ❌ "Network timeout" or "ENOTFOUND"
**Solution**:
- ✅ MongoDB Atlas > Network Access > Add `0.0.0.0/0`
- ✅ Check cluster hostname in connection string
- ✅ Verify cluster is in correct region

### ❌ Google OAuth "origin not authorized"
**Solution**:
- ✅ Add your domain to Google Cloud Console
- ✅ Include both www and non-www versions
- ✅ Wait 5-10 minutes for changes to propagate

### ❌ Stripe errors
**Solution**:
- ✅ Add Stripe keys to environment variables
- ✅ Use test keys for testing, live keys for production
- ✅ Verify webhook endpoint if using webhooks

## 📊 Health Check Commands

Run these in your local terminal to verify:

```bash
# Check if your MongoDB URI is valid
curl -X POST "https://your-app-name.onrender.com/api/health"

# Test Google OAuth
curl "https://your-app-name.onrender.com/api/auth/google"

# Check environment status
curl "https://your-app-name.onrender.com/api/status"
```

## 📞 Support Resources

- **Render Docs**: https://render.com/docs
- **MongoDB Atlas**: https://cloud.mongodb.com
- **Google Cloud Console**: https://console.cloud.google.com
- **GitHub Repository**: https://github.com/Gouravkumarpandey/complain

---

⚠️ **Important**: Never commit actual secrets to Git. All sensitive values should only be in Render's environment variables.

🔄 After making any environment variable changes, always redeploy your service!