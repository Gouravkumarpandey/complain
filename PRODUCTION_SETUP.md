# Production Deployment Configuration Guide

## 🚨 Current Issues and Solutions

### 1. Stripe Payment Configuration
**Error**: `Neither apiKey nor config.authenticator provided`

**Solution**: Add the following environment variables in Render:
```
STRIPE_SECRET_KEY=sk_live_your_actual_stripe_secret_key_for_production
STRIPE_PUBLISHABLE_KEY=pk_live_your_actual_stripe_publishable_key_for_production
```

### 2. Google OAuth Configuration  
**Error**: `Current origin "https://www.innovexlabs.me" is not authorized for Google Sign-In`

**Solution**: 
1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Select your project
3. Find your OAuth 2.0 Client ID: `537022582047-lnvpp7g1ou4b59of2uubd92v65sq03si.apps.googleusercontent.com`
4. Add these authorized JavaScript origins:
   - `https://www.innovexlabs.me`
   - `https://innovexlabs.me`
5. Add these authorized redirect URIs:
   - `https://www.innovexlabs.me/auth/google/callback`
   - `https://innovexlabs.me/auth/google/callback`

### 3. Cross-Origin-Opener-Policy Issues
**Error**: `Cross-Origin-Opener-Policy policy would block the window.postMessage call`

**Solution**: ✅ Fixed in code - Disabled COOP policy to allow OAuth popups

### 4. Environment Variables Required for Production

Add these to your Render environment variables:

```bash
# Core Configuration
NODE_ENV=production
PORT=5001

# URLs - Update to your actual domains
FRONTEND_URL=https://www.innovexlabs.me
BACKEND_URL=https://complai-y8tj.onrender.com

# Database - Use your actual MongoDB connection string
MONGODB_URI=mongodb+srv://your_username:your_password@cluster.mongodb.net/complaintsdb

# JWT - Use a strong secret (32+ characters)
JWT_SECRET=your_super_secure_jwt_secret_key_here_minimum_32_characters
JWT_EXPIRES_IN=7d

# Google OAuth - Your actual credentials
GOOGLE_CLIENT_ID=537022582047-lnvpp7g1ou4b59of2uubd92v65sq03si.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_actual_google_client_secret

# Facebook OAuth - Your actual credentials
FACEBOOK_APP_ID=786223494164698
FACEBOOK_APP_SECRET=your_actual_facebook_app_secret

# Stripe Payments - Your actual production keys
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Twilio SMS - Your actual credentials
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# DeepSeek AI - Your actual API key
USE_DEEPSEEK=true
DEEPSEEK_API_KEY=sk-or-v1-your_deepseek_api_key
DEEPSEEK_API_URL=https://openrouter.ai/api/v1

# Email - Your actual email credentials
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_specific_password

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## 🔄 Deployment Steps

1. **Update Google OAuth Settings** (High Priority)
   - Add `https://www.innovexlabs.me` to authorized origins in Google Cloud Console
   
2. **Add Environment Variables in Render** (High Priority)
   - Go to your Render service dashboard
   - Add all the environment variables listed above with actual values
   
3. **Redeploy the Service**
   - After adding environment variables, trigger a redeploy in Render
   
4. **Test the Application**
   - Try Google OAuth login
   - Test Stripe payment functionality
   - Verify all features work correctly

## 🛡️ Security Notes

- Never commit actual API keys to Git
- Use production keys for live deployment
- Ensure all secrets are stored securely in Render's environment variables
- The `.env` file has been removed from Git history to prevent secret exposure

## 📞 Support

If you encounter any issues after following these steps:
1. Check Render logs for specific error messages
2. Verify all environment variables are set correctly
3. Ensure Google Cloud Console OAuth settings match your domain
4. Test with test payment data first before going live with Stripe