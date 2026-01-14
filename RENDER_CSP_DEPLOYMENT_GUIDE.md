# Render Deployment Guide - CSP Configuration

## Overview

This guide explains how to deploy your React (Vite) + Node.js (Express) application on Render with proper Content Security Policy (CSP) configuration.

## What We've Implemented

### ✅ Production-Ready CSP Configuration
- **Secure by default**: No wildcards (`*`), minimal allowed sources
- **CDN Support**: jsdelivr, Google Fonts, Font CDNs
- **Auth Providers**: Google OAuth, Facebook Login
- **Payment Gateway**: Stripe integration
- **AI Services**: OpenRouter/DeepSeek API
- **WebSocket Support**: Socket.IO connections
- **Source Maps**: Development debugging support

### ✅ Security Headers
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: geolocation=(), microphone=(), camera=()`
- `HSTS` with 1-year max-age and preload

---

## Deployment Architecture

```
┌─────────────────────────────────────────────────┐
│              Render Platform                     │
├─────────────────────────────────────────────────┤
│                                                  │
│  ┌──────────────────┐    ┌──────────────────┐  │
│  │   Frontend       │    │    Backend       │  │
│  │   (Web Service)  │───▶│  (Web Service)   │  │
│  │   Vite Build     │    │  Express + CSP   │  │
│  └──────────────────┘    └──────────────────┘  │
│          │                       │              │
│          │                       │              │
│          ▼                       ▼              │
│     Static Files          API + WebSocket      │
│                                                  │
└─────────────────────────────────────────────────┘
```

---

## Step 1: Prepare Your Environment Files

### Backend Environment Variables

Create these in Render Dashboard for your **Backend Service**:

```env
# Environment
NODE_ENV=production
PORT=5001

# IMPORTANT: Update these with your actual Render URLs
FRONTEND_URL=https://your-frontend.onrender.com
BACKEND_URL=https://your-backend.onrender.com

# Database
MONGODB_URI=mongodb+srv://your-mongodb-connection-string

# JWT
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_EXPIRES_IN=7d

# Google OAuth
GOOGLE_CLIENT_ID=537022582047-lnvpp7g1ou4b59of2uubd92v65sq03si.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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

# Facebook OAuth
FACEBOOK_APP_ID=786223494164698
FACEBOOK_APP_SECRET=f621d39cd723546936b13eb55c623cc4

# AI Service
USE_DEEPSEEK=true
DEEPSEEK_API_KEY=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
DEEPSEEK_API_URL=https://openrouter.ai/api/v1

# Redis (optional - use Render's Redis if needed)
REDIS_URL=redis://your-redis-url

# Email
EMAIL_USER=kumarpandeygourav1024@gmail.com
EMAIL_PASS=xcqwtjptiaugzjpm

# Stripe
STRIPE_SECRET_KEY=sk_test_51SSlOtDMl7cGlqTLz8mXFax2fo8GLyN4I1n8pjCYm1EWZRlTooHXZgn70vezUQxGBE73ns6hh5eZMMlalOwdj9Ft00mUA7QHii
STRIPE_PUBLISHABLE_KEY=pk_test_51SSlOtDMl7cGlqTLGZ7G5ozdpkTs3x5nEDQh7WLANRml3V1EFhML24Cd09tDyRTcX6i9201az6tj5CjcHD7kFRT0008QFeDkah
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads
```

### Frontend Environment Variables

Create these in Render Dashboard for your **Frontend Service**:

```env
# IMPORTANT: Update with your actual Render backend URL
VITE_API_URL=https://your-backend.onrender.com/api
VITE_SOCKET_SERVER_URL=https://your-backend.onrender.com
VITE_SOCKET_PORT=443

# OAuth
VITE_GOOGLE_CLIENT_ID=537022582047-lnvpp7g1ou4b59of2uubd92v65sq03si.apps.googleusercontent.com
VITE_FB_APP_ID=786223494164698
```

---

## Step 2: Deploy Backend to Render

### Create Backend Web Service

1. **Go to Render Dashboard** → New → Web Service
2. **Connect Repository**: Select your GitHub repo
3. **Configure Service**:

```yaml
Name: quickfix-backend
Environment: Node
Region: Ohio (US East) or closest to your users
Branch: main
Root Directory: backend
Build Command: npm install
Start Command: npm start
Instance Type: Free (or Starter for production)
```

4. **Add Environment Variables**: 
   - Go to "Environment" tab
   - Add all backend variables from above
   - **CRITICAL**: Set `FRONTEND_URL` to your actual frontend URL (after you create it)

5. **Advanced Settings**:
   - Auto-Deploy: Yes
   - Health Check Path: `/api/health`

6. **Deploy** and note your backend URL: `https://your-backend.onrender.com`

---

## Step 3: Deploy Frontend to Render

### Create Frontend Web Service

1. **Go to Render Dashboard** → New → Static Site (or Web Service)
2. **Connect Repository**: Select same GitHub repo
3. **Configure Service**:

```yaml
Name: quickfix-frontend
Environment: Static Site
Region: Ohio (US East)
Branch: main
Root Directory: frontend
Build Command: npm install && npm run build
Publish Directory: dist
```

4. **Add Environment Variables**:
   - Go to "Environment" tab
   - Add `VITE_API_URL=https://your-backend.onrender.com/api`
   - Add `VITE_SOCKET_SERVER_URL=https://your-backend.onrender.com`
   - Add OAuth variables

5. **Deploy** and note your frontend URL: `https://your-frontend.onrender.com`

---

## Step 4: Update Cross-Origin URLs

### Update Backend Environment

Go back to **Backend Service** → Environment:
```env
FRONTEND_URL=https://your-actual-frontend.onrender.com
```

Trigger a redeploy.

### Update Frontend Environment (if needed)

Verify `VITE_API_URL` points to correct backend URL.

---

## Step 5: Configure OAuth Providers

### Google OAuth Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** → **Credentials**
3. Edit your OAuth 2.0 Client ID
4. Add **Authorized JavaScript origins**:
   ```
   https://your-frontend.onrender.com
   https://your-backend.onrender.com
   ```
5. Add **Authorized redirect URIs**:
   ```
   https://your-frontend.onrender.com
   https://your-backend.onrender.com/api/auth/google/callback
   ```

### Facebook Developer Console

1. Go to [Facebook Developers](https://developers.facebook.com/apps/)
2. Select your app
3. Go to **Settings** → **Basic**
4. Add **App Domains**:
   ```
   your-frontend.onrender.com
   your-backend.onrender.com
   ```
5. Go to **Facebook Login** → **Settings**
6. Add **Valid OAuth Redirect URIs**:
   ```
   https://your-frontend.onrender.com
   https://your-backend.onrender.com/api/auth/facebook/callback
   ```

### Stripe Configuration

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Navigate to **Developers** → **Webhooks**
3. Add endpoint:
   ```
   https://your-backend.onrender.com/api/payments/webhook
   ```
4. Update `STRIPE_WEBHOOK_SECRET` in Render environment

---

## Step 6: Test CSP Configuration

### Check CSP Headers

```bash
curl -I https://your-backend.onrender.com/api/health
```

Look for:
```
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' ...
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
```

### Browser Console Testing

1. Open your deployed frontend: `https://your-frontend.onrender.com`
2. Open Browser DevTools → Console
3. Look for CSP violations (should see none)
4. Test features:
   - ✅ Login with Google
   - ✅ Login with Facebook
   - ✅ Real-time notifications (WebSocket)
   - ✅ AI features
   - ✅ Stripe payments

---

## Common CSP Issues & Solutions

### Issue 1: "Refused to load stylesheet from cdn.jsdelivr.net"

**Solution**: Already fixed in `cspConfig.js`:
```javascript
styleSrc: [
  "'self'",
  "'unsafe-inline'",
  "https://cdn.jsdelivr.net", // ✅ Added
]
```

### Issue 2: "Refused to load font from cdn.jsdelivr.net"

**Solution**: Already fixed in `cspConfig.js`:
```javascript
fontSrc: [
  "'self'",
  "data:",
  "https://cdn.jsdelivr.net", // ✅ Added
  "https://fonts.gstatic.com",
]
```

### Issue 3: WebSocket connection blocked

**Solution**: Already fixed - `connectSrc` includes WebSocket URLs:
```javascript
connectSrc: [
  "'self'",
  backendUrl.replace('https://', 'wss://'), // ✅ WebSocket support
]
```

### Issue 4: Source maps blocked

**Solution**: Source maps are handled via `scriptSrc` and `connectSrc` allowing `'self'`

### Issue 5: Google/Facebook login popup blocked

**Solution**: Already fixed:
```javascript
crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' }, // ✅ Allows OAuth popups
frameSrc: [
  "https://accounts.google.com",
  "https://www.facebook.com",
]
```

---

## Monitoring CSP Violations

### View CSP Reports

Check your backend logs on Render:
```bash
# Render Dashboard → Backend Service → Logs
```

Look for:
```
CSP Violation Report: {
  documentUri: 'https://your-frontend.onrender.com',
  violatedDirective: 'script-src',
  blockedUri: 'https://example.com/script.js'
}
```

### Adding New Domains

If you need to allow a new domain, edit `backend/src/middleware/cspConfig.js`:

```javascript
// Example: Adding a new analytics service
scriptSrc: [
  "'self'",
  "'unsafe-inline'",
  "https://cdn.jsdelivr.net",
  "https://your-analytics-domain.com", // ← Add here
]
```

Commit, push, and Render will auto-deploy.

---

## Performance Optimization

### Enable Caching Headers

Already implemented in Helmet configuration. For static assets, Render automatically adds:
```
Cache-Control: public, max-age=31536000
```

### Enable Compression

Your backend already uses compression middleware (check `package.json`):
```json
"compression": "^1.7.4"
```

Ensure it's enabled in `server.js`:
```javascript
import compression from 'compression';
app.use(compression());
```

---

## Troubleshooting

### Backend won't start

1. Check Render logs for errors
2. Verify all required environment variables are set
3. Check MongoDB connection string is valid
4. Ensure `NODE_ENV=production`

### Frontend shows blank page

1. Check browser console for CSP errors
2. Verify `VITE_API_URL` points to correct backend
3. Check network tab for API call failures
4. Verify backend is running and healthy

### WebSocket connection fails

1. Ensure `VITE_SOCKET_SERVER_URL` uses `https://` (Render handles wss:// internally)
2. Check CORS configuration includes frontend URL
3. Verify Socket.IO version compatibility

### OAuth login fails

1. Verify OAuth redirect URLs are configured correctly
2. Check `FRONTEND_URL` environment variable
3. Ensure OAuth secrets are correct
4. Check browser console for CORS errors

---

## Security Best Practices

### ✅ Implemented
- [x] CSP with no wildcards
- [x] HSTS headers
- [x] XSS protection
- [x] Clickjacking prevention
- [x] MIME sniffing prevention
- [x] Secure OAuth flows
- [x] Rate limiting
- [x] JWT authentication

### 🔄 Recommended Next Steps
- [ ] Add API rate limiting per user
- [ ] Implement request signing for critical operations
- [ ] Add database query timeout limits
- [ ] Set up monitoring alerts (Sentry, LogRocket)
- [ ] Enable 2FA for admin accounts
- [ ] Regular security audits
- [ ] Update dependencies regularly

---

## Support & Resources

- **Render Docs**: https://render.com/docs
- **CSP Reference**: https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP
- **Helmet.js**: https://helmetjs.github.io/
- **Socket.IO**: https://socket.io/docs/v4/

---

## Quick Checklist

Before going live:

- [ ] Backend deployed and healthy (`/api/health` returns 200)
- [ ] Frontend deployed and accessible
- [ ] All environment variables configured
- [ ] OAuth providers configured with production URLs
- [ ] Stripe webhook configured
- [ ] MongoDB connection working
- [ ] WebSocket connections working
- [ ] No CSP violations in browser console
- [ ] All external CDN resources loading
- [ ] Test user signup/login flows
- [ ] Test creating complaints
- [ ] Test real-time notifications
- [ ] Test AI features
- [ ] Test payment flows
- [ ] SSL certificates active (Render provides automatically)

---

**Your application is now production-ready on Render with secure CSP configuration! 🚀**
